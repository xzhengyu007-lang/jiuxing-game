@echo off
chcp 65001 >nul
setlocal
if "%~1"=="" (
  echo 用法: deploy.bat 你的GitHub用户名/仓库名
  echo 例如: deploy.bat zyx/jiuxing-game
  exit /b 1
)
for /f "tokens=1,2 delims=/" %%a in ("%~1") do set "GHUSER=%%a" & set "GHREPO=%%b"
cd /d "%~dp0"
git remote remove origin 2>nul
git remote add origin https://github.com/%GHUSER%/%GHREPO%.git
git branch -M main
echo 正在推送到 https://github.com/%GHUSER%/%GHREPO%.git ...
echo 如弹出浏览器登录窗口，请完成 GitHub 登录授权。
git push -u origin main
if errorlevel 1 (
  echo.
  echo 推送失败：请确认已在网页上创建仓库 %GHUSER%/%GHREPO% （创建时不要勾选任何初始化选项）。
  echo 创建地址: https://github.com/new
  exit /b 1
)
echo.
echo ============================================
echo 推送成功！最后一步（只需一次）：
echo   1. 打开 https://github.com/%GHUSER%/%GHREPO%/settings/pages
echo   2. Branch 选择 main 、目录选 /(root)，点 Save
echo   3. 等待 1~2 分钟后访问:
echo      https://%GHUSER%.github.io/%GHREPO%/
echo 手机浏览器打开该网址即可游玩（可"添加到主屏幕"当 App 用，支持离线）。
echo ============================================
