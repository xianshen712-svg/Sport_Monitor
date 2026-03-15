const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const redis = require('redis');
const mqtt = require('mqtt');
const path = require('path');
const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');

// 创建uploads目录（如果不存在）
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 加载环境变量
dotenv.config();

// 初始化Express应用
const app = express();
const server = http.createServer(app);

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(uploadDir));

// 导入数据库连接池
const pool = require('./config/database');

// WebSocket服务器
const wss = new WebSocket.Server({ server, path: '/ws' });

// WebSocket连接管理
const clients = new Map();

wss.on('connection', (ws, req) => {
  console.log('WebSocket client connected');
  
  // 生成客户端ID
  const clientId = Date.now().toString();
  clients.set(clientId, ws);
  
  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'connected',
    clientId,
    message: 'WebSocket连接成功',
    timestamp: new Date().toISOString()
  }));
  
  // 处理消息
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('WebSocket message received:', data);
      
      // 处理心跳
      if (data.type === 'heartbeat') {
        ws.send(JSON.stringify({
          type: 'heartbeat',
          timestamp: Date.now(),
          received: data.timestamp
        }));
        return;
      }
      
      // 处理订阅请求
      if (data.type === 'subscribe') {
        ws.send(JSON.stringify({
          type: 'subscribed',
          topic: data.topic,
          message: `已订阅主题: ${data.topic}`,
          timestamp: new Date().toISOString()
        }));
        return;
      }
      
      // 广播消息给所有客户端
      if (data.type === 'broadcast') {
        broadcastMessage(data);
        return;
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: '消息格式错误',
        error: error.message
      }));
    }
  });
  
  // 处理连接关闭
  ws.on('close', () => {
    console.log('WebSocket client disconnected:', clientId);
    clients.delete(clientId);
  });
  
  // 处理错误
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(clientId);
  });
});

// 广播消息给所有客户端
function broadcastMessage(data) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// 发送实时设备数据给所有客户端
function broadcastDeviceData(deviceId, deviceData) {
  const message = {
    type: 'device_data',
    deviceId,
    data: deviceData,
    timestamp: new Date().toISOString()
  };
  broadcastMessage(message);
}

// 发送健康预警给所有客户端
function broadcastHealthAlert(user, abnormalities) {
  const message = {
    type: 'health_alert',
    user,
    abnormalities,
    timestamp: new Date().toISOString()
  };
  broadcastMessage(message);
}

// 导入Redis客户端
const redisClient = require('./config/redis');

// MQTT客户端
const mqttClient = mqtt.connect(process.env.MQTT_BROKER, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  reconnectPeriod: 5000, // 5秒重连一次
  connectTimeout: 10000 // 10秒连接超时
});

// 控制错误信息只打印一次以避免控制台被刷屏
let mqttErrorLogged = false;

mqttClient.on('connect', () => {
  // 成功连接时重置错误标志并记录连接信息
  mqttErrorLogged = false;
  console.log('MQTT连接成功');
  // 订阅手环数据主题
  mqttClient.subscribe('sport/monitor/#', (err) => {
    if (!err) {
      console.log('已订阅手环数据主题');
    } else {
      // 订阅错误属于一次性事件，直接打印
      console.error('订阅手环数据主题失败:', err);
    }
  });
});

mqttClient.on('error', (err) => {
  // 仅在第一次发生错误时打印详细信息，后续错误保持安静以免刷屏
  if (!mqttErrorLogged) {
    console.error('MQTT连接错误:', err);
    console.warn('MQTT连接失败，但服务器将继续运行');
    mqttErrorLogged = true;
  } else {
    // 可在调试时打开下面的行以查看后续错误摘要
    // console.debug('MQTT后续连接错误已被静默');
  }
});

mqttClient.on('message', (topic, message) => {
  console.log(`收到MQTT消息: ${topic} - ${message.toString()}`);
  // 处理手环数据
  handleDeviceData(topic, message.toString());
  
  // 广播给WebSocket客户端
  try {
    const deviceData = JSON.parse(message.toString());
    // 使用数据中的deviceId字段，如果不存在则从主题中提取
    const deviceId = deviceData.deviceId || topic.split('/').pop();
    console.log(`广播设备数据 - 设备ID: ${deviceId}, 主题: ${topic}`);
    broadcastDeviceData(deviceId, deviceData);
  } catch (error) {
    console.error('Error broadcasting MQTT data:', error);
  }
});

// 导入数据质量控制模块
const { applyDataQualityControl } = require('./utils/dataQualityControl');

// 生成模拟数据（除了心率使用真实数据）
function generateSimulatedData(realHeartRate) {
  // 使用真实心率作为基础生成相关模拟数据
  const baseHeartRate = realHeartRate || 75;
  
  // 步数：基于心率生成（心率越高，步数越多）
  const steps = Math.floor(baseHeartRate * 10 + Math.random() * 500);
  
  // 血氧：基于心率生成（心率正常时血氧正常）
  const bloodOxygen = Math.max(95, Math.min(100, 98 - (baseHeartRate - 70) * 0.1 + Math.random() * 2));
  
  // 体温：正常范围
  const bodyTemperature = 36.5 + Math.random() * 0.5;
  
  // 血压：基于心率生成
  const systolic = 110 + (baseHeartRate - 70) * 0.5 + Math.random() * 10;
  const diastolic = 70 + (baseHeartRate - 70) * 0.3 + Math.random() * 5;
  
  // 血糖：正常范围
  const bloodSugar = 5.0 + Math.random() * 1.5;
  
  return {
    heartRate: baseHeartRate,
    steps,
    bloodOxygen,
    bodyTemperature,
    bloodPressure: { systolic, diastolic },
    bloodSugar,
    timestamp: new Date().toISOString()
  };
}

// 处理设备数据
async function handleDeviceData(topic, data) {
  try {
    const rawDeviceData = JSON.parse(data);
    
    // 优先使用MQTT消息中的deviceId字段
    let deviceId = rawDeviceData.deviceId;
    
    // 如果消息中没有deviceId，则从主题中提取
    if (!deviceId) {
      if (topic.startsWith('sport/monitor/android/')) {
        // Android数据格式：sport/monitor/android/{deviceId}
        deviceId = topic.split('/').pop();
      } else if (topic.startsWith('sport/monitor/ble/')) {
        // BLE数据格式：sport/monitor/ble/{deviceId}/{datatype}
        const parts = topic.split('/');
        // 设备ID在第4个位置（索引3）
        deviceId = parts[3];
      } else {
        deviceId = topic.split('/').pop();
      }
    }
    
    // 对于BLE数据，我们需要合并来自不同主题的数据
    // 主题格式：sport/monitor/ble/{deviceId}/{datatype}
    const topicParts = topic.split('/');
    const dataType = topicParts.length > 4 ? topicParts[4] : null;
    
    // 如果是特定数据类型，只更新该字段
    if (dataType && deviceId) {
      // 从Redis获取现有数据（如果有）
      let existingData = {};
      try {
        if (redisClient.isOpen) {
          const cached = await redisClient.get(`device:${deviceId}:realtime`);
          if (cached) {
            existingData = JSON.parse(cached);
          }
        }
      } catch (redisError) {
        console.warn('Redis读取失败:', redisError.message);
      }
      
      // 合并数据
      const mergedData = { ...existingData };
      
      // 根据数据类型更新相应字段
      if (dataType === 'heartrate' && rawDeviceData.heartRate !== undefined) {
        mergedData.heartRate = rawDeviceData.heartRate;
      } else if (dataType === 'bloodoxygen' && rawDeviceData.bloodOxygen !== undefined) {
        mergedData.bloodOxygen = rawDeviceData.bloodOxygen;
      } else if (dataType === 'steps' && rawDeviceData.steps !== undefined) {
        mergedData.steps = rawDeviceData.steps;
      } else if (dataType === 'temperature' && rawDeviceData.bodyTemperature !== undefined) {
        mergedData.bodyTemperature = rawDeviceData.bodyTemperature;
      }
      
      // 确保有设备ID和时间戳
      mergedData.deviceId = deviceId;
      mergedData.timestamp = new Date().toISOString();
      
      // 缓存合并后的数据
      try {
        if (redisClient.isOpen) {
          await redisClient.set(`device:${deviceId}:realtime`, JSON.stringify(mergedData));
        }
      } catch (redisError) {
        console.warn('Redis缓存失败:', redisError.message);
      }
      
      // 每收到一个完整的数据集（包含所有4种数据类型）才保存到MySQL
      // 这里我们简化处理：只要有数据就保存，但只保存当前收到的数据类型
      const finalDeviceData = {
        heartRate: dataType === 'heartrate' ? rawDeviceData.heartRate : (mergedData.heartRate || null),
        steps: dataType === 'steps' ? rawDeviceData.steps : (mergedData.steps || 0),
        bloodOxygen: dataType === 'bloodoxygen' ? rawDeviceData.bloodOxygen : (mergedData.bloodOxygen || null),
        bodyTemperature: dataType === 'temperature' ? rawDeviceData.bodyTemperature : (mergedData.bodyTemperature || null),
        bloodPressure: mergedData.bloodPressure || null,
        bloodSugar: mergedData.bloodSugar || null,
        deviceId: deviceId,
        timestamp: mergedData.timestamp
      };
      
      console.log(`处理BLE数据 - 设备ID: ${deviceId}, 数据类型: ${dataType}, 值: ${rawDeviceData[dataType === 'heartrate' ? 'heartRate' : dataType === 'bloodoxygen' ? 'bloodOxygen' : dataType === 'steps' ? 'steps' : 'bodyTemperature']}`);
      
      // 每次都插入新记录，保留完整的历史数据
      // 这样可以追踪心率等数据随时间的变化
      await saveDeviceDataToMySQL(deviceId, finalDeviceData);
      console.log(`插入设备 ${deviceId} 的新数据记录`);
      
      // 广播给WebSocket客户端
      broadcastDeviceData(deviceId, finalDeviceData);
      
      console.log(`成功处理来自 ${deviceId} 的 ${dataType} 数据`);
      return;
    }
    
    // Android数据可能包含userId字段，用于关联用户
    if (rawDeviceData.userId) {
      await associateDeviceWithUser(deviceId, rawDeviceData.userId);
    }
    
    // 应用数据质量控制
    const deviceData = applyDataQualityControl(deviceId, rawDeviceData);
    
    // 配置：使用接收到的真实数据，不生成模拟数据
    // 从APK传输的数据中提取真实数据
    const realHeartRate = rawDeviceData.heartRate || deviceData.heartRate;
    const realSteps = rawDeviceData.steps || 0; // 如果没有步数数据，默认为0
    const realBloodOxygen = rawDeviceData.bloodOxygen || null;
    const realBodyTemperature = rawDeviceData.bodyTemperature || null;
    const realBloodPressure = rawDeviceData.bloodPressure || null;
    const realBloodSugar = rawDeviceData.bloodSugar || null;
    
    // 使用接收到的真实数据，不生成模拟数据
    const finalDeviceData = {
      heartRate: realHeartRate,
      steps: realSteps, // 使用接收到的步数数据或0
      bloodOxygen: realBloodOxygen,
      bodyTemperature: realBodyTemperature,
      bloodPressure: realBloodPressure,
      bloodSugar: realBloodSugar,
      deviceId: deviceData.deviceId || deviceId,
      timestamp: deviceData.timestamp || new Date().toISOString()
    };
    
    console.log(`处理设备数据 - 设备ID: ${deviceId}, 心率: ${realHeartRate}, 步数: ${realSteps}, 使用真实数据`);
    
    // 缓存实时数据到Redis（如果Redis可用）
    try {
      if (redisClient.isOpen) {
        await redisClient.set(`device:${deviceId}:realtime`, JSON.stringify(finalDeviceData));
      }
    } catch (redisError) {
      console.warn('Redis缓存失败，继续处理数据:', redisError.message);
    }
    
    // 保存历史数据到MySQL
    await saveDeviceDataToMySQL(deviceId, finalDeviceData);
    
    // 检查健康异常
    checkHealthAbnormalities(deviceId, finalDeviceData);
    
    console.log(`成功处理来自 ${deviceId} 的数据`);
  } catch (error) {
    console.error('处理设备数据错误:', error);
  }
}

// 计算运动状况评估指标
function calculateExerciseMetrics(deviceData) {
  // 使用真实心率数据计算运动评估指标
  const realHeartRate = deviceData.heartRate || 75; // 使用真实心率，如果没有则使用默认值
  
  // 疲劳度计算：基于真实心率
  const fatigueLevel = Math.min(100, Math.round((realHeartRate - 60) * 0.5 + 30));
  
  // 运动负荷计算：基于真实心率
  const exerciseLoad = Math.min(100, Math.round((realHeartRate - 60) * 0.3 + 40));
  
  // 有氧训练压力：基于心率区间（60-140为有氧区间）
  const aerobicStress = Math.min(5, Math.round((realHeartRate - 60) * 0.05));
  
  // 无氧训练压力：基于心率区间（>140为无氧区间）
  const anaerobicStress = Math.min(3, Math.round(Math.max(0, realHeartRate - 140) * 0.03));
  
  // 恢复程度计算：基于心率和时间（假设数据每5分钟上传一次）
  const recoveryLevel = Math.max(0, Math.min(100, Math.round(100 - (realHeartRate - 60) * 0.8)));
  
  return {
    fatigueLevel,
    exerciseLoad,
    aerobicStress,
    anaerobicStress,
    recoveryLevel
  };
}

// 更新设备数据到MySQL
async function updateDeviceDataInMySQL(deviceId, deviceData, recordId) {
  try {
    // 计算运动状况评估指标
    const exerciseMetrics = calculateExerciseMetrics(deviceData);
    
    // 获取学生ID
    let studentId = null;
    const [userResult] = await pool.execute('SELECT student_id FROM users WHERE device_id = ?', [deviceId]);
    if (userResult.length > 0) {
      studentId = userResult[0].student_id;
    }
    
    // 提取血压值（假设deviceData.bloodPressure是对象 {systolic, diastolic}）
    const systolic = deviceData.bloodPressure ? deviceData.bloodPressure.systolic : null;
    const diastolic = deviceData.bloodPressure ? deviceData.bloodPressure.diastolic : null;
    
    const [result] = await pool.execute(
      `UPDATE device_data SET 
        student_id = ?, 
        heart_rate = ?, 
        steps = ?, 
        blood_oxygen = ?, 
        body_temperature = ?, 
        blood_pressure_systolic = ?, 
        blood_pressure_diastolic = ?, 
        blood_sugar = ?, 
        fatigue_level = ?, 
        exercise_load = ?, 
        aerobic_stress = ?, 
        anaerobic_stress = ?, 
        recovery_level = ?, 
        record_time = NOW()
       WHERE id = ?`,
      [studentId, deviceData.heartRate, deviceData.steps, deviceData.bloodOxygen, 
       deviceData.bodyTemperature, systolic, diastolic, deviceData.bloodSugar, 
       exerciseMetrics.fatigueLevel, exerciseMetrics.exerciseLoad, exerciseMetrics.aerobicStress, 
       exerciseMetrics.anaerobicStress, exerciseMetrics.recoveryLevel, recordId]
    );
    return result;
  } catch (error) {
    console.error('更新设备数据到MySQL错误:', error);
    throw error;
  }
}

// 保存设备数据到MySQL
async function saveDeviceDataToMySQL(deviceId, deviceData) {
  try {
    // 计算运动状况评估指标
    const exerciseMetrics = calculateExerciseMetrics(deviceData);
    
    // 获取学生ID
    let studentId = null;
    const [userResult] = await pool.execute('SELECT student_id FROM users WHERE device_id = ?', [deviceId]);
    if (userResult.length > 0) {
      studentId = userResult[0].student_id;
    }
    
    // 提取血压值（假设deviceData.bloodPressure是对象 {systolic, diastolic}）
    const systolic = deviceData.bloodPressure ? deviceData.bloodPressure.systolic : null;
    const diastolic = deviceData.bloodPressure ? deviceData.bloodPressure.diastolic : null;
    
    const [result] = await pool.execute(
      `INSERT INTO device_data (device_id, student_id, heart_rate, steps, blood_oxygen, body_temperature, 
       blood_pressure_systolic, blood_pressure_diastolic, blood_sugar, fatigue_level, exercise_load, 
       aerobic_stress, anaerobic_stress, recovery_level, record_time) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [deviceId, studentId, deviceData.heartRate, deviceData.steps, deviceData.bloodOxygen, 
       deviceData.bodyTemperature, systolic, diastolic, deviceData.bloodSugar, 
       exerciseMetrics.fatigueLevel, exerciseMetrics.exerciseLoad, exerciseMetrics.aerobicStress, 
       exerciseMetrics.anaerobicStress, exerciseMetrics.recoveryLevel, new Date()]
    );
    return result;
  } catch (error) {
    console.error('保存设备数据到MySQL错误:', error);
    throw error;
  }
}

// 检查健康异常
async function checkHealthAbnormalities(deviceId, deviceData) {
  try {
    // 获取用户信息
    const [userResult] = await pool.execute('SELECT * FROM users WHERE device_id = ?', [deviceId]);
    if (userResult.length === 0) return;
    
    const user = userResult[0];
    let abnormalities = [];
    
    // 心率异常检查
    if (deviceData.heartRate < 60 || deviceData.heartRate > 100) {
      abnormalities.push({ type: 'heart_rate', value: deviceData.heartRate, status: deviceData.heartRate < 60 ? 'low' : 'high' });
    }
    
    // 血氧异常检查
    if (deviceData.bloodOxygen < 95) {
      abnormalities.push({ type: 'blood_oxygen', value: deviceData.bloodOxygen, status: 'low' });
    }
    
    // 体温异常检查
    if (deviceData.bodyTemperature < 36.0 || deviceData.bodyTemperature > 37.3) {
      abnormalities.push({ type: 'body_temperature', value: deviceData.bodyTemperature, status: deviceData.bodyTemperature < 36.0 ? 'low' : 'high' });
    }
    
    // 血压异常检查（简化版，实际应区分收缩压和舒张压）
    if (deviceData.bloodPressure && (deviceData.bloodPressure.systolic > 140 || deviceData.bloodPressure.diastolic > 90)) {
      abnormalities.push({ type: 'blood_pressure', value: deviceData.bloodPressure, status: 'high' });
    }
    
    // 如果有异常，发送预警通知
    if (abnormalities.length > 0) {
      // 发送预警通知
      sendAlertNotification(user, abnormalities);
    }
  } catch (error) {
    console.error('检查健康异常错误:', error);
  }
}

// 关联设备与用户
async function associateDeviceWithUser(deviceId, userId) {
  try {
    // 检查设备是否已关联用户
    const [existing] = await pool.execute('SELECT * FROM users WHERE device_id = ?', [deviceId]);
    if (existing.length === 0) {
      // 更新用户表的device_id字段
      await pool.execute('UPDATE users SET device_id = ? WHERE id = ?', [deviceId, userId]);
      console.log(`设备 ${deviceId} 已关联到用户 ${userId}`);
    }
  } catch (error) {
    console.error('关联设备与用户错误:', error);
  }
}

// 发送预警通知
function sendAlertNotification(user, abnormalities) {
  console.log(`发送预警通知给用户 ${user.name}:`, abnormalities);
  // 广播给WebSocket客户端
  broadcastHealthAlert(user, abnormalities);
  // 这里可以实现短信、邮件等通知功能
}

// 路由
app.get('/', (req, res) => {
  res.json({ message: '运动监测系统API服务运行中' });
});

// 导入路由
const userRoutes = require('./routes/userRoutes');
const deviceDataRoutes = require('./routes/deviceDataRoutes');
const mqttRoutes = require('./routes/mqttRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const bleMonitorRoutes = require('./routes/bleMonitor');

// 使用路由
app.use('/api/users', userRoutes);
app.use('/api/device-data', deviceDataRoutes);
app.use('/api/mqtt', mqttRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api', bleMonitorRoutes);

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log('WebSocket服务运行在 ws://localhost:' + PORT + '/ws');
  console.log('API服务已启动，提供以下接口:');
  console.log('- GET /api/users: 用户管理接口');
  console.log('- GET /api/device-data: 设备数据接口');
  console.log('- GET /: 健康检查接口');
  console.log('- WebSocket: /ws 实时数据推送');
});

// 导出模块
module.exports = { app, server, pool, redisClient, mqttClient, wss, broadcastMessage, broadcastDeviceData, broadcastHealthAlert };
