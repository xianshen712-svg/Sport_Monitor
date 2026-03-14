# 运动监测系统一键启动脚本 (PowerShell版本)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "     运动监测系统一键启动脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 启动MQTT服务器
Write-Host "[1/4] 启动MQTT服务器..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath "node" -ArgumentList "simple_mqtt_broker.js" -WindowStyle Hidden
Start-Sleep -Seconds 2

# 2. 启动后端服务器
Write-Host "[2/4] 启动后端服务器..." -ForegroundColor Yellow
$backendProcess = Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "start" -WorkingDirectory "server" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 3

# 3. 启动前端应用
Write-Host "[3/4] 启动前端应用..." -ForegroundColor Yellow
$frontendProcess = Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory "client" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 3

# 4. 打开测试页面
Write-Host "[4/4] 打开测试页面..." -ForegroundColor Yellow
Start-Process "test_frontend.html"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "     所有服务已启动！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "已启动的服务：" -ForegroundColor White
Write-Host "  1. MQTT服务器 (端口: 1883)" -ForegroundColor Gray
Write-Host "  2. 后端服务器 (端口: 3001)" -ForegroundColor Gray
Write-Host "  3. 前端应用 (端口: 5173)" -ForegroundColor Gray
Write-Host "  4. 测试页面 (test_frontend.html)" -ForegroundColor Gray
Write-Host ""

Write-Host "使用说明：" -ForegroundColor White
Write-Host "  1. 等待所有服务启动完成（约10秒）" -ForegroundColor Gray
Write-Host "  2. 打开浏览器访问：http://localhost:5173" -ForegroundColor Gray
Write-Host "  3. 测试页面会自动连接WebSocket" -ForegroundColor Gray
Write-Host "  4. 运行BLE工具：python BLE/unified_ble_mqtt_tool.py" -ForegroundColor Gray
Write-Host ""

Write-Host "服务管理命令：" -ForegroundColor White
Write-Host "  停止所有服务：按Ctrl+C关闭各个终端窗口" -ForegroundColor Gray
Write-Host "  重启服务：重新运行此脚本" -ForegroundColor Gray
Write-Host ""

Write-Host "故障排除：" -ForegroundColor White
Write-Host "  1. 查看各终端窗口的日志信息" -ForegroundColor Gray
Write-Host "  2. 运行诊断脚本：node diagnose_data_flow.js" -ForegroundColor Gray
Write-Host "  3. 检查端口占用情况" -ForegroundColor Gray
Write-Host ""

# 可选：运行测试
$runTests = Read-Host "是否运行服务状态测试？(y/n)"
if ($runTests -eq 'y' -or $runTests -eq 'Y') {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "     服务状态检查" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "检查数据库连接..." -ForegroundColor Yellow
    node test_db_connection.js
    Write-Host ""
    
    Write-Host "检查最新数据..." -ForegroundColor Yellow
    node check_latest_data.js
    Write-Host ""
    
    Write-Host "发送测试数据..." -ForegroundColor Yellow
    node test_send_data.js
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "     启动完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor White
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")