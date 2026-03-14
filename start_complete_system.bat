@echo off
cls
echo ===========================================
echo    Sport Monitor Complete System Launcher
echo ===========================================
echo.

REM 设置当前目录
cd /d %~dp0

REM 1. Start MQTT Broker
echo 1. Starting MQTT Broker...
start "mqtt-broker" /min cmd.exe /c "node simple_mqtt_broker.js"
echo MQTT broker is starting on port 1883...
timeout /t 3 /nobreak >nul

REM 2. Start Backend Server
echo 2. Starting backend server...
start "backend-server" /min cmd.exe /c "cd server && node index.js"
echo Backend server is starting on port 3001...
timeout /t 5 /nobreak >nul

REM 3. Start Frontend Server
echo 3. Starting frontend server...
start "frontend-server" /min cmd.exe /c "cd client && npm run dev"
echo Frontend server is starting on port 5173...
timeout /t 5 /nobreak >nul

REM 4. Start Heart Rate Simulation (Optional - for testing)
echo 4. Starting heart rate simulation (optional)...
start "heart-rate-sim" /min cmd.exe /c "node test_heart_rate_simulation.js"
echo Heart rate simulation is starting...
echo Note: This is optional. Real heart rate data should come from APK via MQTT.
timeout /t 3 /nobreak >nul

REM 5. Open Browser
echo 5. Opening browser...
start http://localhost:5173/
echo.
echo ===========================================
echo    Complete System Started Successfully!
echo ===========================================
echo System Components:
echo - MQTT Broker: localhost:1883
echo - Backend API: http://localhost:3001
echo - Frontend: http://localhost:5173
echo - WebSocket: ws://localhost:3001/ws
echo.
echo Test Accounts:
echo - Admin: admin001 / password123
echo - Teacher: Teacher101 / password123
echo - Student: 2023423320102 / password123
echo.
echo Data Configuration:
echo - Heart Rate: REAL DATA (from APK via MQTT)
echo - Other Data: SIMULATED DATA (based on heart rate)
echo.
echo Data Flow:
echo 1. APK -> MQTT Broker -> Backend -> Database
echo 2. Backend -> WebSocket -> Frontend实时显示
echo 3. Backend generates simulated data based on real heart rate
echo.
echo For APK Integration:
echo 1. Install APK on Android device
echo 2. Connect to MQTT broker: localhost:1883
echo 3. Send heart rate data to topic: sport/monitor/android/{deviceId}
echo 4. Format: {"heartRate": 78, "deviceId": "device001", "userId": 3}
echo.
echo Press any key to exit this launcher...
echo (Note: All services will continue running in background)
pause >nul
