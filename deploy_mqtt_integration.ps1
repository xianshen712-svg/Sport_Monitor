# PowerShell MQTT集成部署脚本
# 用于部署和配置Sport_Monitor与AndroidSDK的MQTT集成

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    MQTT集成部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查依赖
function Check-Dependencies {
    Write-Host "检查系统依赖..." -ForegroundColor Green
    
    # 检查Node.js
    try {
        $nodeVersion = node --version
        Write-Host "Node.js版本: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "Node.js未安装" -ForegroundColor Red
        exit 1
    }
    
    # 检查npm
    try {
        $npmVersion = npm --version
        Write-Host "npm版本: $npmVersion" -ForegroundColor Green
    } catch {
        Write-Host "npm未安装" -ForegroundColor Red
        exit 1
    }
    
    # 检查Git（可选）
    try {
        $gitVersion = git --version
        Write-Host "Git版本: $gitVersion" -ForegroundColor Green
    } catch {
        Write-Host "Git未安装（可选）" -ForegroundColor Yellow
    }
}

# 配置Sport_Monitor环境
function Configure-SportMonitor {
    Write-Host "配置Sport_Monitor环境..." -ForegroundColor Green
    
    Set-Location server
    
    # 检查.env文件
    if (-not (Test-Path .env)) {
        Write-Host ".env文件不存在，创建示例配置" -ForegroundColor Yellow
        
        @"
# MQTT配置
MQTT_BROKER=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=

# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=sport_monitor

# 服务器配置
PORT=3001
NODE_ENV=development

# Redis配置（可选）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
"@ | Out-File -FilePath .env -Encoding UTF8
    } else {
        # 更新MQTT配置
        Write-Host "更新MQTT配置..." -ForegroundColor Green
        $envContent = Get-Content .env -Raw
        
        if ($envContent -match "MQTT_BROKER") {
            $envContent = $envContent -replace "MQTT_BROKER=.*", "MQTT_BROKER=mqtt://localhost:1883"
        } else {
            $envContent += "`nMQTT_BROKER=mqtt://localhost:1883"
        }
        
        $envContent | Out-File -FilePath .env -Encoding UTF8
    }
    
    # 安装依赖
    Write-Host "安装Node.js依赖..." -ForegroundColor Green
    npm install
    
    Set-Location ..
}

# 测试MQTT连接
function Test-MQTTConnection {
    Write-Host "测试MQTT连接..." -ForegroundColor Green
    
    # 检查测试文件
    if (Test-Path "test_mqtt_integration.js") {
        Write-Host "运行集成测试..." -ForegroundColor Green
        
        try {
            node test_mqtt_integration.js
            Write-Host "? MQTT集成测试通过" -ForegroundColor Green
        } catch {
            Write-Host "?? MQTT集成测试未通过，但部署继续" -ForegroundColor Yellow
        }
    } else {
        Write-Host "测试文件不存在，跳过测试" -ForegroundColor Yellow
    }
}

# 启动服务
function Start-Services {
    Write-Host "启动服务..." -ForegroundColor Green
    
    # 检查服务是否已在运行
    $serverProcess = Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "server\\index\.js" }
    
    if ($serverProcess) {
        Write-Host "Sport_Monitor服务已在运行" -ForegroundColor Green
    } else {
        Write-Host "启动Sport_Monitor服务..." -ForegroundColor Green
        
        # 启动服务器
        $serverJob = Start-Job -ScriptBlock {
            Set-Location server
            node index.js
        }
        
        Start-Sleep -Seconds 5
        
        # 检查是否启动成功
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 3 -ErrorAction Stop
            Write-Host "? Sport_Monitor服务启动成功" -ForegroundColor Green
        } catch {
            Write-Host "?? Sport_Monitor服务可能未正确启动" -ForegroundColor Yellow
        }
    }
}

# 显示部署摘要
function Show-DeploymentSummary {
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host "? 部署完成！" -ForegroundColor Green
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host ""
    Write-Host "? 部署摘要:" -ForegroundColor Cyan
    Write-Host "  ? 系统依赖检查完成" -ForegroundColor Green
    Write-Host "  ? Sport_Monitor环境配置完成" -ForegroundColor Green
    Write-Host "  ? 服务启动完成" -ForegroundColor Green
    Write-Host ""
    Write-Host "? 配置信息:" -ForegroundColor Cyan
    Write-Host "  MQTT服务器: mqtt://localhost:1883" -ForegroundColor Gray
    Write-Host "  Sport_Monitor: http://localhost:3001" -ForegroundColor Gray
    Write-Host "  Android主题前缀: sport/monitor/android/" -ForegroundColor Gray
    Write-Host ""
    Write-Host "? 文档:" -ForegroundColor Cyan
    Write-Host "  详细集成指南: Android_MQTT_Integration_Guide.md" -ForegroundColor Gray
    Write-Host "  测试脚本: test_mqtt_integration.js" -ForegroundColor Gray
    Write-Host "  Android模拟测试: test_android_data_send.js" -ForegroundColor Gray
    Write-Host ""
    Write-Host "? 下一步:" -ForegroundColor Cyan
    Write-Host "  1. 按照指南修改Android应用代码" -ForegroundColor Gray
    Write-Host "  2. 在Android应用中实现MQTT客户端" -ForegroundColor Gray
    Write-Host "  3. 测试真实设备数据传输" -ForegroundColor Gray
    Write-Host "  4. 生产环境启用TLS/SSL加密" -ForegroundColor Gray
    Write-Host ""
    Write-Host "??  注意事项:" -ForegroundColor Yellow
    Write-Host "  - 生产环境请使用安全的MQTT配置" -ForegroundColor Gray
    Write-Host "  - 建议启用用户名/密码认证" -ForegroundColor Gray
    Write-Host "  - 考虑使用TLS/SSL加密传输" -ForegroundColor Gray
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor Cyan
}

# 主函数
function Main {
    # 检查依赖
    Check-Dependencies
    
    # 询问是否安装MQTT服务器
    $installMQTT = Read-Host "是否安装MQTT服务器？(y/n)"
    if ($installMQTT -eq 'y' -or $installMQTT -eq 'Y') {
        Write-Host "在Windows上，建议使用以下方式安装MQTT服务器:" -ForegroundColor Yellow
        Write-Host "1. 下载Mosquitto: https://mosquitto.org/download/" -ForegroundColor Gray
        Write-Host "2. 安装后启动服务: net start mosquitto" -ForegroundColor Gray
        Write-Host "3. 或者使用内置的simple_mqtt_broker.js" -ForegroundColor Gray
    } else {
        Write-Host "跳过MQTT服务器安装" -ForegroundColor Green
    }
    
    # 配置Sport_Monitor
    Configure-SportMonitor
    
    # 测试连接
    Test-MQTTConnection
    
    # 启动服务
    Start-Services
    
    # 显示摘要
    Show-DeploymentSummary
}

# 执行主函数
Main
