@echo off
chcp 65001 >nul
cd /d "%~dp0.."

echo.
echo === 生成网页并在浏览器里预览 ===
echo.

python tools\build-blog.py
if errorlevel 1 (
  echo.
  echo 生成失败，请把上面的报错发给助手。
  pause
  exit /b 1
)

echo.
echo 正在打开浏览器 http://localhost:8000/blog/
echo 预览期间请不要关闭这个黑窗口。看完按 Ctrl+C 或直接关掉窗口。
echo.

start "" http://localhost:8000/blog/
python -m http.server 8000
