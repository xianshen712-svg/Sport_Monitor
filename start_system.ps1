# 运动监测系统快速启动脚本
# 此脚本将自动启动后端和前端服务器，然后打开浏览器访问系统

# 定义颜色常量
$GREEN = "`e[32m"
$YELLOW = "`e[33m"
$RED = "`e[31m"
$RESET = "`e[0m"

Write-Host "${GREEN}=== 运动监测系统快速启动脚本 ===${RESET}"

# 1. 启动后端服务器
Write-Host "${YELLOW}1. 启动后端服务器...${RESET}"
$backendPath = "e:\Daima\Sport_Monitor\server"
Start-Process -FilePath "node" -ArgumentList "index.js" -WorkingDirectory $backendPath -WindowStyle Minimized

# 等待后端服务器启动
Start-Sleep -Seconds 3

# 2. 启动前端服务器
Write-Host "${YELLOW}2. 启动前端服务器...${RESET}"
$frontendPath = "e:\Daima\Sport_Monitor\client"
Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory $frontendPath -WindowStyle Minimized

# 等待前端服务器启动
Start-Sleep -Seconds 3

# 3. 执行登录请求获取Token
Write-Host "${YELLOW}3. 执行登录操作...${RESET}"
try {
    $loginUrl = "http://localhost:3001/api/users/login"
    $loginData = @{
        username = "admin001"
        password = "password123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-WebRequest -Uri $loginUrl -Method POST -Body $loginData -ContentType "application/json" -ErrorAction Stop
    $loginResult = $loginResponse.Content | ConvertFrom-Json
    
    Write-Host "${GREEN}登录成功！Token已获取${RESET}"
} catch {
    Write-Host "${RED}登录请求失败: $($_.Exception.Message)${RESET}"
    Write-Host "${YELLOW}系统将继续启动，但可能需要手动登录${RESET}"
}

# 4. 打开浏览器访问系统
Write-Host "${YELLOW}4. 打开浏览器访问系统...${RESET}"
Start-Process -FilePath "chrome.exe" -ArgumentList "http://localhost:5173/"

Write-Host "${GREEN}=== 系统启动完成！ ===${RESET}"
Write-Host "${YELLOW}系统已在 http://localhost:5173/ 运行${RESET}"
Write-Host "${YELLOW}默认管理员账号: admin001 / password123${RESET}"