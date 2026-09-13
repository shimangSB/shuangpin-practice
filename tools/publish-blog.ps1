# One-click blog publish: build -> commit -> push to GitHub
# Double-click tools\publish-blog.bat to run this.
#
# NOTE: this file is deliberately ASCII-only. Windows PowerShell 5.1 reads
# .ps1 files using the system ANSI codepage when there is no BOM, which
# corrupts multi-byte UTF-8 text and can even break string parsing.
# All Chinese output comes from python tools/build-blog.py instead.

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Stop-Here($msg) {
    Write-Host ''
    Write-Host $msg -ForegroundColor Red
    Read-Host 'Press Enter to close'
    exit 1
}

Write-Host ''
Write-Host '=== [1/3] Build pages ===' -ForegroundColor Cyan
python tools/build-blog.py
if ($LASTEXITCODE -ne 0) { Stop-Here 'Build failed. See the error above.' }

Write-Host ''
Write-Host '=== [2/3] Commit ===' -ForegroundColor Cyan
git add blog blog_src tools .nojekyll index.html README.md .gitignore

if (-not (git status --porcelain)) {
    Write-Host 'Nothing changed, nothing to publish.' -ForegroundColor Yellow
    Read-Host 'Press Enter to close'
    exit 0
}

$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm'
git commit -m "blog: update $stamp" | Out-Null
if ($LASTEXITCODE -ne 0) { Stop-Here 'Commit failed, aborted.' }

Write-Host ''
Write-Host '=== [3/3] Push to GitHub ===' -ForegroundColor Cyan

# Try plain git push first. On this machine Git Credential Manager can hang,
# so on failure/timeout we fall back to the GitHub API (same end result).
$env:GIT_TERMINAL_PROMPT = '0'
$pushed = $false

$pushLog = Join-Path $env:TEMP 'dsh-push.log'
if (Test-Path $pushLog) { Remove-Item $pushLog -Force }
$pushCmd = 'cd /d "{0}" && git push origin main > "{1}" 2>&1' -f $root, $pushLog
$p = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $pushCmd -PassThru -WindowStyle Hidden

if ($p.WaitForExit(60000)) {
    if ($p.ExitCode -eq 0) { $pushed = $true }
} else {
    try { $p.Kill() } catch { }
}

if ($pushed) {
    Write-Host 'git push OK' -ForegroundColor Green
} else {
    $log = if (Test-Path $pushLog) { Get-Content $pushLog -Raw } else { '' }
    if ($log -match 'Everything up-to-date') {
        $pushed = $true
        Write-Host 'Remote already up to date.' -ForegroundColor Green
    } else {
        Write-Host 'git push did not complete, falling back to GitHub API...' -ForegroundColor Yellow
    }
}

if (-not $pushed) {
    if (-not $env:GH_TOKEN) {
        Write-Host ''
        Write-Host 'API push needs a GitHub token.' -ForegroundColor Yellow
        Write-Host 'Create a classic token at https://github.com/settings/tokens with repo scope.'
        Write-Host 'The token is stored only in your user environment variables, never in the repo.'
        $secure = Read-Host 'Paste token here' -AsSecureString
        $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
        $env:GH_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
        [Environment]::SetEnvironmentVariable('GH_TOKEN', $env:GH_TOKEN, 'User')
    }
    python tools/push-via-api.py
    if ($LASTEXITCODE -ne 0) { Stop-Here 'API push also failed. See the error above.' }
    $pushed = $true
}

Write-Host ''
Write-Host 'Published.' -ForegroundColor Green
Write-Host 'Wait 1-2 minutes, then open:' -ForegroundColor Green
Write-Host '  https://shimangsb.github.io/shuangpin-practice/blog/' -ForegroundColor Green
Read-Host 'Press Enter to close'
