@echo off
echo 停止Vite开发服务器...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul

echo 启动Vite开发服务器...
cd /d "%~dp0client"
start cmd /k "npm run dev"

echo 前端开发服务器已重启！
echo 请访问 http://localhost:5173
pause
