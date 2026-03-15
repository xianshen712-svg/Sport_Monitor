系统架构

```
KCT手表 (CC30设备)
     ↓ (BLE蓝牙)
BLEDebug.exe (Windows工具)
     ↓ (BLE连接)
Python采集脚本 (unified_ble_mqtt_tool.py)
     ↓ (MQTT协议)
MQTT服务器 (localhost:1883)
     ↓ (MQTT订阅)
后端服务器 (Node.js + Express)
     ↓ (WebSocket)
前端界面 (Vue.js + ECharts)
     ↓ (MySQL存储)
数据库 (健康数据持久化)
```


快速启动指南

### 步骤1：安装必要的Python包
```bash
cd Sport_Monitor\BLE
pip install paho-mqtt bleak
```

### 步骤2：启动系统服务（按顺序）

#### 终端1：启动MQTT服务器
```bash
cd Sport_Monitor
node simple_mqtt_broker.js
```
**预期输出**:
```
MQTT代理服务器运行在端口 1883
等待客户端连接...
```

#### 终端2：启动后端服务器
```bash
cd Sport_Monitor\server
npm start
```

#### 终端3：启动前端服务器
```bash
cd Sport_Monitor\client
npm run dev
```

#### 终端4：运行BLE数据采集
```bash
cd Sport_Monitor\BLE
运行心率采集代码multi_heart_rate_monitor.py
```

## 扩展功能建议

### 1. 设备管理界面
- 添加设备MAC地址配置界面
- 支持多设备同时监测
- 设备状态监控

### 2. 数据持久化优化
- 添加数据缓存机制
- 实现断线重传功能
- 数据压缩和归档

### 3. 实时告警系统
- 基于健康数据阈值触发告警
- 发送邮件/短信通知
- 紧急联系人通知

### 4. 数据分析功能
- 健康趋势分析
- 运动效果评估
- 睡眠质量分析

---

## 性能优化建议

### 1. 数据采集优化
- 批量发送数据，减少MQTT消息数量
- 数据压缩传输
- 智能采样频率调整

### 2. 系统稳定性
- 添加心跳检测
- 自动重连机制
- 错误恢复策略

### 3. 用户体验
- 实时数据可视化优化
- 历史数据查询
- 导出数据功能

---
