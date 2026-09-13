#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
静态博客生成器 —— 把 blog_src/*.md 转成 blog/ 下的网页。

依赖：只需要 Python 3（标准库），唯一的第三方库是可选的 PyYAML。
      如果没装 PyYAML，会自动退回到内置的简单 front matter 解析器。

用法：
    python tools/build-blog.py          # 生成网页
    python tools/build-blog.py --check  # 只检查，不写文件

你只需要在 blog_src/ 里写 markdown，然后运行这个脚本。
"""

import argparse
import datetime as _dt
import html
import os
import re
import shutil
import sys

# ---------------------------------------------------------------- 控制台编码
# Windows 的 cmd / PowerShell 默认用 GBK，直接 print 中文或符号会报
# UnicodeEncodeError。这里强制把标准输出切成 UTF-8。
for _stream in ("stdout", "stderr"):
    _s = getattr(sys, _stream, None)
    if _s is not None and hasattr(_s, "reconfigure"):
        try:
            _s.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

# ---------------------------------------------------------------- 配置

SITE_NAME = "双拼练习 · 博客"
SITE_DESC = "关于双拼、输入法、小鹤音形，以及做这个小站的一些记录。"
AUTHOR = "shimangSB"
SITE_URL = "https://shimangsb.github.io/shuangpin-practice"

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, "blog_src")
BLOG_DIR = os.path.join(ROOT, "blog")
POSTS_DIR = os.path.join(BLOG_DIR, "posts")

# 双拼站首页（博客在 /blog/ 下，所以上一级就是站点根）
HOME_URL = "../"

# 关于页内容：改这里就能改「关于」页
ABOUT_CONTENT = """<h1>关于</h1>
<p class="page-intro">这是个写东西的地方。</p>
<p>主要会写双拼、输入法、小鹤音形相关的内容，也会记录做
<a href="../">双拼练习</a>这个小站时踩过的坑。</p>
<h2>关于我</h2>
<p>业余折腾键盘和输入法，喜欢把用起来不顺手的东西自己重做一遍。</p>
<h2>关于这个站</h2>
<p>纯静态页面，托管在 GitHub Pages 上，没有任何追踪脚本，也不放广告。</p>
<h2>联系</h2>
<p>在 <a href="https://github.com/shimangSB">GitHub</a> 上找我，或者在
<a href="https://github.com/shimangSB/shuangpin-practice/issues">这里提 issue</a>。</p>
"""

PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="color-scheme" content="light dark" />
<title>{title}</title>
{meta}
<link rel="stylesheet" href="{css}" />
<link rel="alternate" type="application/rss+xml" title="{site_name}" href="{rss}" />
</head>
<body>
<header class="site-head">
  <div class="wrap head-inner">
    <a class="brand" href="{brand_href}">
      <span class="brand-mark">📝</span>
      <span class="brand-text">
        <strong>{site_name}</strong>
        <small>{site_desc}</small>
      </span>
    </a>
    <nav class="site-nav">{nav}</nav>
  </div>
</header>

<main class="wrap">
{content}
</main>

<footer class="site-foot">
  <div class="wrap">
    <p>{author} · <a href="{home}">双拼练习</a> · <a href="{rss}">RSS</a></p>
  </div>
</footer>
</body>
</html>
"""

CSS_CONTENT = """/* 博客样式 —— 独立阅读风格，自动适配深色模式 */
:root {
  --bg: #ffffff;
  --bg-soft: #f6f7f9;
  --text: #1f2328;
  --text-soft: #6b7280;
  --line: #e5e7eb;
  --accent: #e8590c;
  --accent-soft: #fff4ec;
  --code-bg: #f6f8fa;
  --radius: 12px;
  --measure: 44rem;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #14171c;
    --bg-soft: #1b1f27;
    --text: #e6e8eb;
    --text-soft: #9aa3af;
    --line: #2a3039;
    --accent: #ff9a4d;
    --accent-soft: #2f2418;
    --code-bg: #1d2229;
  }
}

* { box-sizing: border-box; }

html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, "Segoe UI", "Microsoft YaHei",
    "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", sans-serif;
  font-size: 17px;
  line-height: 1.85;
  -webkit-font-smoothing: antialiased;
}

.wrap {
  width: 100%;
  max-width: var(--measure);
  margin: 0 auto;
  padding: 0 20px;
}

a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }

/* ---------- 页头 ---------- */
.site-head {
  border-bottom: 1px solid var(--line);
  /* 不透明兜底：部分浏览器不支持 color-mix，没有这行页头会变透明，
     正文滚动时会从页头底下透出来 */
  background: var(--bg);
  backdrop-filter: saturate(180%) blur(8px);
  position: sticky;
  top: 0;
  z-index: 10;
}

@supports (background: color-mix(in srgb, red 50%, blue)) {
  .site-head { background: color-mix(in srgb, var(--bg) 88%, transparent); }
}

.head-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 62px;
  flex-wrap: wrap;
  padding-top: 8px;
  padding-bottom: 8px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: inherit;
  text-decoration: none;
}
.brand:hover { text-decoration: none; }
.brand-mark { font-size: 22px; line-height: 1; }
.brand-text { display: flex; flex-direction: column; line-height: 1.35; }
.brand-text strong { font-size: 16px; }
.brand-text small { color: var(--text-soft); font-size: 12px; }

.site-nav { display: flex; gap: 18px; font-size: 15px; }
.site-nav a { color: var(--text-soft); }
.site-nav a:hover { color: var(--accent); }
.site-nav a.active { color: var(--accent); font-weight: 600; }

/* ---------- 正文 ---------- */
main { padding-top: 36px; padding-bottom: 56px; }

h1, h2, h3, h4 { line-height: 1.35; font-weight: 700; }
h1 { font-size: 30px; margin: 0 0 6px; }
h2 { font-size: 23px; margin: 40px 0 12px; padding-bottom: 6px; border-bottom: 1px solid var(--line); }
h3 { font-size: 19px; margin: 30px 0 10px; }
h4 { font-size: 17px; margin: 24px 0 8px; color: var(--text-soft); }

p { margin: 0 0 18px; }

.post-meta {
  color: var(--text-soft);
  font-size: 14px;
  margin: 0 0 32px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  align-items: center;
}

.tag {
  display: inline-block;
  background: var(--accent-soft);
  color: var(--accent);
  border-radius: 999px;
  padding: 2px 11px;
  font-size: 12.5px;
  line-height: 1.7;
}

ul, ol { padding-left: 26px; margin: 0 0 18px; }
li { margin: 6px 0; }

blockquote {
  margin: 22px 0;
  padding: 4px 18px;
  border-left: 3px solid var(--accent);
  background: var(--bg-soft);
  border-radius: 0 var(--radius) var(--radius) 0;
  color: var(--text-soft);
}
blockquote p:last-child { margin-bottom: 0; }

code {
  font-family: ui-monospace, SFMono-Regular, "Cascadia Mono", Consolas, monospace;
  font-size: 0.9em;
  background: var(--code-bg);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 1px 6px;
}

pre {
  background: var(--code-bg);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 16px 18px;
  overflow-x: auto;
  line-height: 1.7;
  margin: 0 0 18px;
}
pre code { background: none; border: none; padding: 0; font-size: 14px; }

img { max-width: 100%; height: auto; border-radius: var(--radius); display: block; margin: 22px auto; }

hr { border: none; border-top: 1px solid var(--line); margin: 40px 0; }

table { border-collapse: collapse; width: 100%; margin: 0 0 18px; font-size: 15px; }
th, td { border: 1px solid var(--line); padding: 9px 12px; text-align: left; }
th { background: var(--bg-soft); font-weight: 600; }

/* ---------- 文章列表 ---------- */
.post-list { list-style: none; padding: 0; margin: 10px 0 0; }

.post-list li {
  padding: 22px 0;
  border-bottom: 1px solid var(--line);
  margin: 0;
}
.post-list li:last-child { border-bottom: none; }

.post-list h2 {
  font-size: 21px;
  margin: 0 0 6px;
  padding: 0;
  border: none;
}
.post-list h2 a { color: var(--text); }
.post-list h2 a:hover { color: var(--accent); text-decoration: none; }

.post-list .summary { color: var(--text-soft); font-size: 15px; margin: 0 0 10px; }
.post-list .meta { color: var(--text-soft); font-size: 13px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }

.page-intro { color: var(--text-soft); font-size: 16px; margin-bottom: 8px; }
.empty { color: var(--text-soft); padding: 40px 0; }

/* ---------- 页脚 ---------- */
.site-foot {
  border-top: 1px solid var(--line);
  color: var(--text-soft);
  font-size: 13.5px;
  padding: 22px 0 34px;
}
.site-foot p { margin: 0; }

/* ---------- 移动端 ---------- */
@media (max-width: 560px) {
  body { font-size: 16px; line-height: 1.8; }
  h1 { font-size: 25px; }
  h2 { font-size: 20px; }
  .head-inner { min-height: 56px; }
  .brand-text small { display: none; }
  .site-nav { gap: 14px; font-size: 14px; }
  main { padding-top: 24px; padding-bottom: 40px; }
}
"""


# ---------------------------------------------------------------- 小工具

def _warn(msg):
    print("  [警告] " + msg)


def _die(msg):
    print("\n[错误] " + msg)
    sys.exit(1)


def site_page(title, content, meta="", css="style.css", rss="feed.xml",
              brand_href="index.html", nav=None, active=""):
    """把内容套进整站模板。brand_href / css / rss 由调用方按层级传入。"""
    if nav is None:
        nav = [("首页", "index.html"), ("关于", "about.html")]
    nav_html = "".join(
        '<a class="{cls}" href="{href}">{label}</a>'.format(
            cls="active" if label == active else "",
            href=href, label=label)
        for label, href in nav
    )
    return PAGE_TEMPLATE.format(
        title=html.escape(title),
        meta=meta,
        css=css,
        rss=rss,
        brand_href=brand_href,
        site_name=html.escape(SITE_NAME),
        site_desc=html.escape(SITE_DESC),
        nav=nav_html,
        content=content,
        author=html.escape(AUTHOR),
        home=HOME_URL,
    )


# ---------------------------------------------------------------- front matter

def parse_front_matter(text, path):
    """返回 (meta_dict, body)。支持 YAML，也支持没装 PyYAML 时的简单解析。"""
    if not text.startswith("---"):
        return {}, text

    lines = text.split("\n")
    end = None
    for i in range(1, len(lines)):
        if lines[i].strip() in ("---", "..."):
            end = i
            break
    if end is None:
        _warn("%s：front matter 没有闭合的 --- ，已当作正文处理" % os.path.basename(path))
        return {}, text

    block = "\n".join(lines[1:end])
    body = "\n".join(lines[end + 1:])

    meta = {}
    try:
        import yaml
        loaded = yaml.safe_load(block)
        if isinstance(loaded, dict):
            meta = loaded
    except ImportError:
        meta = _simple_front_matter(block)
    except Exception as e:
        _warn("%s：YAML 解析失败（%s），改用简单解析" % (os.path.basename(path), e))
        meta = _simple_front_matter(block)

    # 统一把 None 值丢掉，避免后面到处判空
    meta = {k: v for k, v in meta.items() if v is not None}
    return meta, body


def _simple_front_matter(block):
    """没有 PyYAML 时的兜底：只认 key: value 和 key: [a, b] / key:\\n  - a"""
    meta = {}
    key = None
    for raw in block.split("\n"):
        line = raw.rstrip()
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        m = re.match(r"^([A-Za-z_][\w-]*)\s*:\s*(.*)$", line)
        if m:
            key = m.group(1)
            val = m.group(2).strip()
            if val.startswith("[") and val.endswith("]"):
                items = [v.strip().strip("'\"") for v in val[1:-1].split(",")]
                meta[key] = [v for v in items if v]
            elif val == "":
                meta[key] = []
            else:
                meta[key] = val.strip("'\"")
            continue
        m = re.match(r"^\s*-\s+(.*)$", line)
        if m and key:
            if not isinstance(meta.get(key), list):
                meta[key] = []
            meta[key].append(m.group(1).strip().strip("'\""))
    return meta


def _norm_tags(value):
    if value is None:
        return []
    if isinstance(value, str):
        return [t.strip() for t in re.split(r"[,，\s]+", value) if t.strip()]
    if isinstance(value, (list, tuple)):
        return [str(t).strip() for t in value if str(t).strip()]
    return [str(value)]


def _norm_date(value, path):
    if isinstance(value, _dt.datetime):
        return value
    if isinstance(value, _dt.date):
        return _dt.datetime(value.year, value.month, value.day)
    if isinstance(value, str) and value.strip():
        raw = value.strip().replace("/", "-")
        for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y.%m.%d", "%Y年%m月%d日"):
            try:
                return _dt.datetime.strptime(raw, fmt)
            except ValueError:
                continue
        _warn("%s：看不懂日期 %r，改用文件修改时间" % (os.path.basename(path), value))
    else:
        _warn("%s：没写 date，改用文件修改时间" % os.path.basename(path))
    return _dt.datetime.fromtimestamp(os.path.getmtime(path))


# ---------------------------------------------------------------- markdown

_RE_HEADING = re.compile(r"^(#{1,6})\s+(.*)$")
_RE_HR = re.compile(r"^\s*([-*_])(\s*\1){2,}\s*$")
_RE_UL = re.compile(r"^(\s*)[-*+]\s+(.*)$")
_RE_OL = re.compile(r"^(\s*)(\d+)[.)]\s+(.*)$")
_RE_QUOTE = re.compile(r"^>\s?(.*)$")
_RE_FENCE = re.compile(r"^\s*(```+|~~~+)\s*(\S*)\s*$")
_RE_IMG = re.compile(r"!\[([^\]]*)\]\(([^)\s]+)(?:\s+\"([^\"]*)\")?\)")
_RE_LINK = re.compile(r"\[([^\]]+)\]\(([^)\s]+)(?:\s+\"([^\"]*)\")?\)")
_RE_CODE = re.compile(r"`([^`]+)`")
_RE_BOLD = re.compile(r"\*\*(.+?)\*\*")
_RE_BOLD_ALT = re.compile(r"__(.+?)__")
_RE_ITALIC = re.compile(r"(?<!\*)\*([^*\n]+)\*(?!\*)")
_RE_ITALIC_ALT = re.compile(r"(?<!\w)_([^_\n]+)_(?!\w)")
_RE_LIST_ITEM = re.compile(r"^([-*+]|\d+[.)])\s+")

_MASTER = re.compile(
    r"(?P<code>`[^`]+`)"
    r"|(?P<img>!\[[^\]]*\]\([^)\s]+(?:\s+\"[^\"]*\")?\))"
    r"|(?P<link>\[[^\]]+\]\([^)\s]+(?:\s+\"[^\"]*\")?\))"
    r"|(?P<auto><https?://[^>\s]+>)"
)


def _inline(text):
    """行内元素。

    做法：先把代码段 / 图片 / 链接换成占位符（NUL 包起来的序号，正文里
    不可能出现），再处理粗体斜体，最后把占位符还原成 HTML。
    这样写是为了让 `**` 能跨过行内代码正确配对，例如：
        **`blog/` 全是生成的**
    如果反过来先切掉代码段，`**` 就会落在两个片段里配不上对。
    """
    parts = []

    def stash(html_text):
        parts.append(html_text)
        return "\x00%d\x00" % (len(parts) - 1)

    def repl(m):
        if m.group("code"):
            return stash("<code>%s</code>" % html.escape(m.group(0)[1:-1]))
        if m.group("img"):
            return stash(_render_img(m.group(0)))
        if m.group("link"):
            return stash(_render_link(m.group(0)))
        url = m.group(0)[1:-1]
        return stash('<a href="%s">%s</a>' % (
            html.escape(url, quote=True), html.escape(url, quote=False)))

    # 占位符里是 NUL，不会被下面的强调正则碰到
    s = _MASTER.sub(repl, text)
    s = html.escape(s, quote=False)

    s = _RE_BOLD.sub(r"<strong>\1</strong>", s)
    s = _RE_BOLD_ALT.sub(r"<strong>\1</strong>", s)
    s = _RE_ITALIC.sub(r"<em>\1</em>", s)
    s = _RE_ITALIC_ALT.sub(r"<em>\1</em>", s)

    def unstash(m):
        return parts[int(m.group(1))]

    return re.sub(r"\x00(\d+)\x00", unstash, s)


def _render_img(raw):
    m = _RE_IMG.fullmatch(raw)
    alt, src, title = m.group(1), m.group(2), m.group(3)
    t = ' title="%s"' % html.escape(title, quote=True) if title else ""
    return '<img src="%s" alt="%s"%s />' % (
        html.escape(src, quote=True), html.escape(alt, quote=True), t)


def _render_link(raw):
    m = _RE_LINK.fullmatch(raw)
    label, href, title = m.group(1), m.group(2), m.group(3)
    t = ' title="%s"' % html.escape(title, quote=True) if title else ""
    return '<a href="%s"%s>%s</a>' % (
        html.escape(href, quote=True), t, html.escape(label, quote=False))


# 表格分隔行：| --- | :--: | 这类
_RE_TABLE_SEP = re.compile(r"^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$")


def _split_row(line):
    """把 | a | b | 切成 ['a', 'b']。"""
    s = line.strip()
    if s.startswith("|"):
        s = s[1:]
    if s.endswith("|"):
        s = s[:-1]
    return [c.strip() for c in s.split("|")]


def _looks_like_table_row(line):
    return line.count("|") >= 2


def markdown(text):
    lines = text.replace("\r\n", "\n").replace("\r", "").split("\n")
    out = []
    para = []
    list_type = None
    quote = []

    def flush_para():
        if para:
            joined = " ".join(x.strip() for x in para if x.strip())
            if joined:
                out.append("<p>%s</p>" % _inline(joined))
            para.clear()

    def flush_list():
        nonlocal list_type
        if list_type:
            out.append("</%s>" % list_type)
            list_type = None

    def flush_quote():
        if quote:
            inner = markdown("\n".join(quote))
            out.append("<blockquote>\n%s\n</blockquote>" % inner)
            quote.clear()

    def flush_all():
        flush_para()
        flush_list()
        flush_quote()

    i = 0
    while i < len(lines):
        line = lines[i]

        # 代码块
        fence = _RE_FENCE.match(line)
        if fence:
            flush_all()
            marker, lang = fence.group(1)[0], fence.group(2)
            buf = []
            i += 1
            closed = False
            while i < len(lines):
                if re.match(r"^\s*%s{3,}\s*$" % re.escape(marker), lines[i]):
                    closed = True
                    i += 1
                    break
                buf.append(lines[i])
                i += 1
            if not closed:
                _warn("代码块没有闭合的 %s" % (marker * 3))
            cls = ' class="language-%s"' % html.escape(lang, quote=True) if lang else ""
            out.append("<pre><code%s>%s</code></pre>" % (cls, html.escape("\n".join(buf))))
            continue

        # 引用
        q = _RE_QUOTE.match(line)
        if q:
            flush_para()
            flush_list()
            quote.append(q.group(1))
            i += 1
            continue
        flush_quote()

        # 空行
        if not line.strip():
            flush_para()
            flush_list()
            i += 1
            continue

        # 分隔线
        if _RE_HR.match(line):
            flush_all()
            out.append("<hr />")
            i += 1
            continue

        # 标题
        h = _RE_HEADING.match(line)
        if h:
            flush_all()
            level = min(len(h.group(1)), 6)
            out.append("<h%d>%s</h%d>" % (level, _inline(h.group(2).strip()), level))
            i += 1
            continue

        # 表格：当前行是表头，下一行是 |---|---| 分隔行
        if (i + 1 < len(lines)
                and _looks_like_table_row(line)
                and _RE_TABLE_SEP.match(lines[i + 1])
                and "-" in lines[i + 1]):
            flush_all()
            aligns = []
            for cell in _split_row(lines[i + 1]):
                left, right = cell.startswith(":"), cell.endswith(":")
                if left and right:
                    aligns.append("center")
                elif right:
                    aligns.append("right")
                elif left:
                    aligns.append("left")
                else:
                    aligns.append("")

            def cell_attr(idx):
                return ' style="text-align:%s"' % aligns[idx] if idx < len(aligns) and aligns[idx] else ""

            heads = _split_row(line)
            out.append("<table>")
            out.append("<thead><tr>%s</tr></thead>" % "".join(
                "<th%s>%s</th>" % (cell_attr(k), _inline(c))
                for k, c in enumerate(heads)))
            out.append("<tbody>")

            i += 2
            while i < len(lines) and lines[i].strip() and _looks_like_table_row(lines[i]):
                cells = _split_row(lines[i])
                out.append("<tr>%s</tr>" % "".join(
                    "<td%s>%s</td>" % (cell_attr(k), _inline(c))
                    for k, c in enumerate(cells)))
                i += 1
            out.append("</tbody></table>")
            continue

        # 列表
        ul = _RE_UL.match(line)
        ol = _RE_OL.match(line)
        if ul or ol:
            flush_para()
            want = "ul" if ul else "ol"
            if list_type and list_type != want:
                flush_list()
            if not list_type:
                out.append("<%s>" % want)
                list_type = want
            content = (ul.group(2) if ul else ol.group(3))
            out.append("<li>%s</li>" % _inline(content.strip()))
            i += 1
            continue

        # 普通段落
        flush_list()
        para.append(line)
        i += 1

    flush_all()
    return "\n".join(out)


def plain_excerpt(body, limit=110):
    """从正文里抠一段纯文字做摘要。"""
    text = re.sub(r"```.*?```", " ", body, flags=re.S)
    text = _RE_IMG.sub(" ", text)
    text = _RE_LINK.sub(r"\1", text)
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.M)
    text = re.sub(r"^[>\-*+]\s*", "", text, flags=re.M)
    text = re.sub(r"[*_`]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > limit:
        text = text[:limit].rstrip() + "…"
    return text


# ---------------------------------------------------------------- 读取文章

def read_posts():
    if not os.path.isdir(SRC_DIR):
        _die("找不到 blog_src/ 目录。请在仓库根目录运行：python tools/build-blog.py")

    posts = []
    for name in sorted(os.listdir(SRC_DIR)):
        if not name.lower().endswith(".md"):
            continue
        if name.startswith("_"):
            continue

        path = os.path.join(SRC_DIR, name)
        with open(path, "r", encoding="utf-8") as f:
            raw = f.read()

        meta, body = parse_front_matter(raw, path)
        slug = str(meta.get("slug") or os.path.splitext(name)[0])
        slug = re.sub(r"[^\w\-]+", "-", slug, flags=re.U).strip("-").lower() or "post"

        title = str(meta.get("title") or "").strip()
        if not title:
            # 没写 title 就用正文第一个一级标题，再不行用文件名
            m = re.search(r"^#\s+(.+)$", body, flags=re.M)
            title = m.group(1).strip() if m else os.path.splitext(name)[0]
            _warn("%s：没写 title，暂用「%s」" % (name, title))

        date = _norm_date(meta.get("date"), path)
        tags = _norm_tags(meta.get("tags"))
        summary = str(meta.get("summary") or "").strip()
        draft = str(meta.get("draft", "")).lower() in ("true", "yes", "1", "是")

        # 标题行不再重复渲染一遍（列表页已经有标题了）
        body_clean = re.sub(r"^#\s+.+$", "", body, count=1, flags=re.M).strip()

        posts.append({
            "slug": slug,
            "title": title,
            "date": date,
            "tags": tags,
            "draft": draft,
            "summary": summary or plain_excerpt(body_clean),
            "body": body_clean,
            "source": name,
        })

    seen = {}
    for p in posts:
        if p["slug"] in seen:
            _die("有两篇文章的 slug 都是「%s」：%s 和 %s。请给其中一篇加 slug 字段。"
                 % (p["slug"], seen[p["slug"]], p["source"]))
        seen[p["slug"]] = p["source"]

    posts.sort(key=lambda p: p["date"], reverse=True)
    return posts


# ---------------------------------------------------------------- 生成

def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)


def build(check_only=False):
    posts = read_posts()
    published = [p for p in posts if not p["draft"]]
    drafts = [p for p in posts if p["draft"]]

    print("找到 %d 篇文章（%d 篇已发布，%d 篇草稿）" % (len(posts), len(published), len(drafts)))
    for p in drafts:
        print("  · 草稿（不会发布）：%s" % p["title"])

    if not check_only:
        # 清掉旧的 posts/，避免删掉文章后网页还留着
        if os.path.isdir(POSTS_DIR):
            shutil.rmtree(POSTS_DIR)
        os.makedirs(POSTS_DIR, exist_ok=True)
        # 样式表也由脚本生成，改样式只需要改这个脚本里的 CSS_CONTENT
        write(os.path.join(BLOG_DIR, "style.css"), CSS_CONTENT)

    # ---------- 文章列表页 ----------
    if published:
        items = []
        for p in published:
            tags = "".join('<span class="tag">%s</span>' % html.escape(t) for t in p["tags"])
            items.append(
                '<li>\n'
                '  <h2><a href="posts/%s.html">%s</a></h2>\n'
                '  <p class="summary">%s</p>\n'
                '  <div class="meta"><time datetime="%s">%s</time>%s</div>\n'
                '</li>' % (
                    p["slug"], html.escape(p["title"]),
                    html.escape(p["summary"]),
                    p["date"].strftime("%Y-%m-%d"),
                    p["date"].strftime("%Y 年 %m 月 %d 日"),
                    tags,
                )
            )
        listing = '<ul class="post-list">\n%s\n</ul>' % "\n".join(items)
    else:
        listing = '<p class="empty">还没有文章。在 <code>blog_src/</code> 里新建一个 .md 文件，然后运行构建脚本。</p>'

    index_html = site_page(
        title="文章 · " + SITE_NAME,
        content='<h1>文章</h1>\n<p class="page-intro">%s</p>\n%s' % (html.escape(SITE_DESC), listing),
        meta='<meta name="description" content="%s" />' % html.escape(SITE_DESC, quote=True),
        active="首页",
    )
    if not check_only:
        write(os.path.join(BLOG_DIR, "index.html"), index_html)

    # ---------- 每篇文章 ----------
    for p in published:
        tags = "".join('<span class="tag">%s</span>' % html.escape(t) for t in p["tags"])
        content = (
            '<article>\n'
            '<h1>%s</h1>\n'
            '<div class="post-meta"><time datetime="%s">%s</time>%s</div>\n'
            '%s\n'
            '</article>'
        ) % (
            html.escape(p["title"]),
            p["date"].strftime("%Y-%m-%d"),
            p["date"].strftime("%Y 年 %m 月 %d 日"),
            tags,
            markdown(p["body"]),
        )
        page = site_page(
            title="%s · %s" % (p["title"], SITE_NAME),
            content=content,
            meta='<meta name="description" content="%s" />' % html.escape(p["summary"], quote=True),
            css="../style.css",
            rss="../feed.xml",
            brand_href="../index.html",
            nav=[("首页", "../index.html"), ("关于", "../about.html")],
        )
        if not check_only:
            write(os.path.join(POSTS_DIR, "%s.html" % p["slug"]), page)

    # ---------- 关于页 ----------
    if not check_only:
        about = site_page(
            title="关于 · " + SITE_NAME,
            content=ABOUT_CONTENT,
            active="关于",
        )
        write(os.path.join(BLOG_DIR, "about.html"), about)

    # ---------- RSS ----------
    if not check_only:
        now = _dt.datetime.now().strftime("%a, %d %b %Y %H:%M:%S +0800")
        items = []
        for p in published[:20]:
            url = "%s/blog/posts/%s.html" % (SITE_URL, p["slug"])
            items.append(
                "  <item>\n"
                "    <title>%s</title>\n"
                "    <link>%s</link>\n"
                "    <guid isPermaLink=\"true\">%s</guid>\n"
                "    <pubDate>%s</pubDate>\n"
                "    <description>%s</description>\n"
                "  </item>" % (
                    html.escape(p["title"]), url, url,
                    p["date"].strftime("%a, %d %b %Y %H:%M:%S +0800"),
                    html.escape(p["summary"]),
                )
            )
        feed = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<rss version="2.0">\n<channel>\n'
            '  <title>%s</title>\n'
            '  <link>%s/blog/</link>\n'
            '  <description>%s</description>\n'
            '  <language>zh-CN</language>\n'
            '  <lastBuildDate>%s</lastBuildDate>\n'
            '%s\n'
            '</channel>\n</rss>\n'
        ) % (
            html.escape(SITE_NAME), SITE_URL, html.escape(SITE_DESC), now,
            "\n".join(items),
        )
        write(os.path.join(BLOG_DIR, "feed.xml"), feed)

        # GitHub Pages 会默认拿 Jekyll 处理站点；博客是纯静态的，关掉更稳
        write(os.path.join(ROOT, ".nojekyll"), "")

    print("\n[完成] 网页已生成")
    if not check_only:
        print("   网页位置：blog/")
        print("   本地预览：双击 tools/preview-blog.bat")
        print("   发布上线：双击 tools/publish-blog.bat")
    return 0


def main():
    ap = argparse.ArgumentParser(description="把 blog_src/*.md 生成到 blog/")
    ap.add_argument("--check", action="store_true", help="只检查，不写文件")
    args = ap.parse_args()
    return build(check_only=args.check)


if __name__ == "__main__":
    sys.exit(main())
