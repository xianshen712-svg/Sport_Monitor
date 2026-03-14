// MQTT模拟数据生成器
const mqtt = require('mqtt');
require('dotenv').config();

// 连接到MQTT代理
const client = mqtt.connect(process.env.MQTT_BROKER, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD
});

// 设备ID列表（50个手环）
const deviceIds = Array.from({ length: 50 }, (_, i) => `device${String(i + 1).padStart(2, '0')}`);

// 模拟数据生成函数
function generateMockData() {
  const heartRate = Math.floor(Math.random() * 60) + 60; // 60-120 bpm
  const steps = Math.floor(Math.random() * 200) + 0; // 0-200步
  const bloodOxygen = parseFloat((Math.random() * 5 + 95).toFixed(1)); // 95.0-100.0%
  const bodyTemperature = parseFloat((Math.random() * 1.3 + 36.0).toFixed(1)); // 36.0-37.3℃
  const bloodPressureSystolic = Math.floor(Math.random() * 30) + 110; // 110-140 mmHg
  const bloodPressureDiastolic = Math.floor(Math.random() * 20) + 70; // 70-90 mmHg
  const bloodSugar = parseFloat((Math.random() * 2 + 4).toFixed(1)); // 4.0-6.0 mmol/L
  
  return {
    heartRate,
    steps,
    bloodOxygen,
    bodyTemperature,
    bloodPressure: {
      systolic: bloodPressureSystolic,
      diastolic: bloodPressureDiastolic
    },
    bloodSugar,
    timestamp: new Date().toISOString()
  };
}

// 当连接成功时
client.on('connect', () => {
  console.log('MQTT模拟客户端连接成功');
  
  // 定期发送模拟数据
  setInterval(() => {
    deviceIds.forEach(deviceId => {
      const mockData = generateMockData();
      const topic = `sport/monitor/${deviceId}`;
      
      client.publish(topic, JSON.stringify(mockData), (err) => {
        if (err) {
          console.error(`发送数据到设备 ${deviceId} 错误:`, err);
        } else {
          console.log(`发送模拟数据到设备 ${deviceId}:`, JSON.stringify(mockData));
        }
      });
    });
  }, 1000); // 每秒发送一次数据
});

// 处理错误
client.on('error', (err) => {
  console.error('MQTT连接错误:', err);
});

// 处理断开连接
client.on('close', () => {
  console.log('MQTT连接已关闭');
});

// 处理重新连接
client.on('reconnect', () => {
  console.log('MQTT正在重新连接...');
});