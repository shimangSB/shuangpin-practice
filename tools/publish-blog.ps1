# 一键发布博客：生成网页 -> 提交 -> 推送到 GitHub
# 双击这个文件即可。发布后等 1~2 分钟，刷新线上博客就能看到。

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host ""
Write-Host "=== 1/3  生成网页 ===" -ForegroundColor Cyan
python tools/build-blog.py
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "生成失败，已中止。请把上面的报错发给我。" -ForegroundColor Red
    Read-Host "按回车关闭"
    exit 1
}

Write-Host ""
Write-Host "=== 2/3  提交改动 ===" -ForegroundColor Cyan
git add blog blog_src tools .nojekyll index.html

$changed = git status --porcelain
if (-not $changed) {
    Write-Host "没有任何改动，无需发布。" -ForegroundColor Yellow
    Read-Host "按回车关闭"
    exit 0
}

$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm'
git commit -m "blog: 更新于 $stamp"
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "提交失败，已中止。" -ForegroundColor Red
    Read-Host "按回车关闭"
    exit 1
}

Write-Host ""
Write-Host "=== 3/3  推送到 GitHub ===" -ForegroundColor Cyan
git push
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "推送失败。常见原因：网络问题，或者需要先登录 GitHub。" -ForegroundColor Red
    Write-Host "处理完可以重新双击本文件重试。" -ForegroundColor Red
    Read-Host "按回车关闭"
    exit 1
}

Write-Host ""
Write-Host "发布完成！" -ForegroundColor Green
Write-Host "等 1~2 分钟后打开：" -ForegroundColor Green
Write-Host "  https://shimangsb.github.io/shuangpin-practice/blog/" -ForegroundColor Green
Read-Host "按回车关闭"
