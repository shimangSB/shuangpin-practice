# -*- coding: utf-8 -*-
"""用 GitHub REST API 把当前 HEAD 推上去，绕过 Git Credential Manager。

沙箱环境下 GCM 会因为命名管道限制而卡死，所以改成直接调 API。

用法（token 只走环境变量，不出现在命令行、磁盘或 git config 里）：
    $env:GH_TOKEN = "..."; python tools/push-via-api.py
"""

import base64
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")

TOKEN = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
if not TOKEN:
    print("缺少环境变量 GH_TOKEN")
    sys.exit(1)

REPO = "shimangSB/shuangpin-practice"
BRANCH = "main"
API = "https://api.github.com"


def git(*args):
    r = subprocess.run(["git"] + list(args), capture_output=True)
    if r.returncode != 0:
        raise SystemExit("git %s 失败：%s" % (" ".join(args), r.stderr.decode("utf-8", "replace")))
    return r.stdout


def api(method, path, payload=None):
    url = path if path.startswith("http") else API + path
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", "Bearer " + TOKEN)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    req.add_header("User-Agent", "blog-push-script")
    if data:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, (json.loads(body) if body else {})
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = {"raw": body}
        return e.code, parsed


# ---------- 1. 身份检查 ----------
status, me = api("GET", "/user")
if status != 200:
    print("认证失败（HTTP %d）：%s" % (status, me.get("message", me)))
    print("token 可能无效、已过期或已被作废。")
    sys.exit(1)
print("认证成功：%s" % me.get("login"))

# ---------- 2. 读取本地要推的提交 ----------
head = git("rev-parse", "HEAD").decode().strip()
parent = git("rev-parse", "HEAD^").decode().strip()
message = git("log", "-1", "--format=%B").decode().rstrip("\n")
print("本地 HEAD: %s" % head[:10])
print("父提交   : %s" % parent[:10])

# ---------- 3. 确认远程当前位置 ----------
# --overwrite：用于修正上一次推错内容的情况（把分支强制指到本地这个提交）
OVERWRITE = "--overwrite" in sys.argv

status, ref = api("GET", "/repos/%s/git/ref/heads/%s" % (REPO, BRANCH))
force = False
if status == 200:
    remote_sha = ref["object"]["sha"]
    print("远程 %s: %s" % (BRANCH, remote_sha[:10]))
    if remote_sha == head:
        print("远程已经是这个提交了，无需推送。")
        sys.exit(0)
    if remote_sha != parent:
        if OVERWRITE:
            print("远程位置和本地父提交不同，但指定了 --overwrite，将强制指向本地提交。")
            force = True
        else:
            print("远程位置和本地父提交不一致，为避免覆盖别人的改动，已中止。")
            print("如果确认是要修正上一次推错的内容，加 --overwrite 再跑一次。")
            sys.exit(1)
elif status == 404:
    print("远程还没有 %s 分支，将新建。" % BRANCH)
else:
    print("读取远程分支失败：HTTP %d %s" % (status, ref))
    sys.exit(1)

# ---------- 4. 收集本次提交新增/修改的文件 ----------
diff = git("diff", "--name-status", parent, head).decode("utf-8")
entries = []
for line in diff.splitlines():
    if not line.strip():
        continue
    parts = line.split("\t")
    state = parts[0]
    if state.startswith("D"):
        entries.append((parts[1], None))
    elif state.startswith("R"):
        entries.append((parts[1], None))   # 旧路径删除
        entries.append((parts[2], "keep"))  # 新路径稍后读
    else:
        entries.append((parts[1], "keep"))

print("本次提交涉及 %d 个文件" % len(entries))

# ---------- 5. 上传 blob ----------
tree_items = []
for path, action in entries:
    if action is None:
        # base_tree 模式下，sha 为 null 表示删除这个路径
        tree_items.append({"path": path, "mode": "100644", "type": "blob", "sha": None})
        print("  删除  %s" % path)
        continue

    # 直接从本地仓库取真实的 git blob 内容，保证和 git push 的结果一致
    sha = git("rev-parse", "%s:%s" % (head, path)).decode().strip()
    raw = subprocess.run(
        ["git", "cat-file", "blob", sha], capture_output=True).stdout
    # 注意：GitHub blobs API 要的是「原始内容」的 base64，不是 zlib 压缩后的。
    # 这里千万不要 compress，否则远程会存成一坨压缩流（曾经踩过这个坑）。
    encoded = base64.b64encode(raw).decode("ascii")

    status, blob = api("POST", "/repos/%s/git/blobs" % REPO,
                       {"content": encoded, "encoding": "base64"})
    if status not in (200, 201):
        print("  上传失败 %s：HTTP %d %s" % (path, status, blob.get("message")))
        sys.exit(1)
    tree_items.append({"path": path, "mode": "100644", "type": "blob", "sha": blob["sha"]})
    print("  上传  %s" % path)

# ---------- 6. 建 tree ----------
# 用 base_tree 让 GitHub 在父提交的 tree 基础上合并这些改动，
# 只列变动的文件即可（"path": "." 那种子树写法 API 不接受）。
parent_tree = git("rev-parse", "%s^{tree}" % parent).decode().strip()
status, tree = api("POST", "/repos/%s/git/trees" % REPO,
                   {"base_tree": parent_tree, "tree": tree_items})
if status not in (200, 201):
    print("建 tree 失败：HTTP %d %s" % (status, tree.get("message")))
    sys.exit(1)

# ---------- 7. 建 commit ----------
status, commit = api("POST", "/repos/%s/git/commits" % REPO, {
    "message": message,
    "tree": tree["sha"],
    "parents": [parent],
})
if status not in (200, 201):
    print("建 commit 失败：HTTP %d %s" % (status, commit.get("message")))
    sys.exit(1)
print("新 commit: %s" % commit["sha"][:10])

# ---------- 8. 移动分支指针 ----------
status, updated = api("PATCH", "/repos/%s/git/refs/heads/%s" % (REPO, BRANCH),
                      {"sha": commit["sha"], "force": force})
if status not in (200, 201):
    print("更新分支失败：HTTP %d %s" % (status, updated.get("message")))
    sys.exit(1)

print("")
print("推送成功：%s -> %s" % (commit["sha"][:10], BRANCH))
