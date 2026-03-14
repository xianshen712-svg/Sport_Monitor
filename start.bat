@echo off
chcp 65001 > nul
title 运动监测系统集成启动脚本
color 0A

echo ========================================
echo     运动监测系统集成启动脚本
echo     根据《系统集成指南》制作
echo ========================================
echo.

echo 步骤1：检查Python环境...
python --version > nul 2>&1
if errorlevel 1 (
    echo ❌ Python未安装或未添加到PATH
    echo 请先安装Python并添加到系统环境变量
    pause
    exit /b 1
)
echo ✅ Python环境正常
echo.

echo 步骤2：检查Node.js环境...
node --version > nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js未安装或未添加到PATH
    echo 请先安装Node.js并添加到系统环境变量
    pause
    exit /b 1
)
echo ✅ Node.js环境正常
echo.

echo 步骤3：检查npm环境...
npm --version > nul 2>&1
if errorlevel 1 (
    echo ❌ npm未安装或未添加到PATH
    echo 请检查Node.js安装
    pause
    exit /b 1
)
echo ✅ npm环境正常
echo.

echo 步骤4：检查MySQL服务...
sc query MySQL80 > nul 2>&1
if errorlevel 1 (
    echo ⚠️ MySQL服务可能未运行
    echo 请确保MySQL服务已启动
    echo 可以运行：net start MySQL80
    echo.
)
echo ✅ 环境检查完成
echo.

echo ========================================
echo     启动系统服务（按顺序）
echo ========================================
echo.

echo [1/5] 启动MQTT服务器...
echo 请在新窗口中查看MQTT服务器日志
start "MQTT服务器" cmd /k "cd /d %~dp0 && node simple_mqtt_broker.js"
timeout /t 3 /nobreak > nul
echo ✅ MQTT服务器已启动（端口: 1883）
echo.

echo [2/5] 启动后端服务器...
echo 请在新窗口中查看后端服务器日志
start "后端服务器" cmd /k "cd /d %~dp0\server && npm start"
timeout /t 5 /nobreak > nul
echo ✅ 后端服务器已启动（端口: 3001）
echo.

echo [3/5] 启动前端服务器...
echo 请在新窗口中查看前端服务器日志
start "前端服务器" cmd /k "cd /d %~dp0\client && npm run dev"
timeout /t 5 /nobreak > nul
echo ✅ 前端服务器已启动（端口: 5173）
echo.

echo [4/5] 安装Python依赖包（如果需要）...
cd /d %~dp0\BLE
pip list | findstr "paho-mqtt" > nul 2>&1
if errorlevel 1 (
    echo 安装paho-mqtt...
    pip install paho-mqtt
) else (
    echo ✅ paho-mqtt已安装
)

pip list | findstr "bleak" > nul 2>&1
if errorlevel 1 (
    echo 安装bleak...
    pip install bleak
) else (
    echo ✅ bleak已安装
)
cd /d %~dp0
echo ✅ Python依赖包检查完成
echo.

echo [5/5] 打开系统界面...
start "" "http://localhost:5173"
timeout /t 2 /nobreak > nul
echo ✅ 系统界面已打开
echo.

echo ========================================
echo     系统启动完成！
echo ========================================
echo.

echo 已启动的服务：
echo   1. MQTT服务器     - 端口: 1883    - 主题: sport/monitor/#
echo   2. 后端服务器     - 端口: 3001    - API: http://localhost:3001
echo   3. 前端服务器     - 端口: 5173    - 界面: http://localhost:5173
echo   4. WebSocket服务  - 端口: 3001    - ws://localhost:3001/ws
echo.

echo 数据流路径：
echo   BLE设备 → BLEDebug.exe → Python采集脚本 → MQTT服务器 → 后端服务器 → 前端显示
echo.

echo ========================================
echo     使用说明
echo ========================================
echo.

echo 1. 数据采集步骤：
echo    a. 运行 BLEDebug.exe 并连接手表
echo    b. 在新终端运行：cd BLE && python unified_ble_mqtt_tool.py
echo    c. 在前端界面查看实时数据
echo.

echo 2. 测试步骤：
echo    a. 测试MQTT连接：cd BLE && python simple_mqtt_test.py
echo    b. 测试数据流：node test_send_data.js
echo    c. 检查数据库：node check_latest_data.js
echo.

echo 3. 故障排除：
echo    a. 运行诊断脚本：node diagnose_data_flow.js
echo    b. 检查各服务日志
echo    c. 查看《系统集成指南》文档
echo.

echo ========================================
echo     快捷命令
echo ========================================
echo.

echo 测试MQTT连接：      cd BLE && python simple_mqtt_test.py
echo 运行BLE数据采集：    cd BLE && python unified_ble_mqtt_tool.py
echo 发送测试数据：       node test_send_data.js
echo 检查数据库：         node check_latest_data.js
echo 诊断数据流：         node diagnose_data_flow.js
echo 测试数据库连接：     node test_db_connection.js
echo.

echo ========================================
echo     系统状态
echo ========================================
echo.

echo 正在检查系统状态...
echo.

echo 检查数据库连接...
node test_db_connection.js
echo.

echo 检查最新数据...
node check_latest_data.js
echo.

echo ========================================
echo     重要提示
echo ========================================
echo.

echo 1. 请确保所有服务窗口保持打开状态
echo 2. 按Ctrl+C可以停止各个服务
echo 3. 重新运行此脚本可以重启所有服务
echo 4. 详细文档请查看《系统集成指南》
echo.

echo 按任意键退出...
pause > nul

exit