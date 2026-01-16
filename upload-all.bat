@echo off
cd /d "%~dp0"

echo ========================
echo BubuChat 项目上传脚本
echo 功能: 上传整个项目到 GitHub
echo ========================
echo.

:: 确保在正确的目录
echo 当前目录: %CD%
echo.

:: 检查是否有未跟踪的文件
echo 检查未跟踪文件...
git status

echo.
echo 按任意键开始上传整个项目...
pause > nul

echo.
echo 开始上传项目...
git add .
git commit -m "Upload complete project: %date% %time%"
git push origin main --force

if %ERRORLEVEL% neq 0 (
    echo.
    echo 上传失败！按任意键退出...
    pause > nul
    exit /b 1
) else (
    echo.
    echo 项目上传成功！按任意键退出...
    pause > nul
    exit /b 0
)
