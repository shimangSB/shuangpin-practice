@echo off
chcp 65001 >nul
cd /d "%~dp0.."

echo.
echo === 生成博客网页 ===
echo.

python tools\build-blog.py
if errorlevel 1 (
  echo.
  echo 生成失败，请把上面的报错发给助手。
  pause
  exit /b 1
)

echo.
pause
