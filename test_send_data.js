/**
 * 测试发送模拟数据到MQTT服务器
 * 用于测试完整的数据流
 */

const mqtt = require('mqtt');

// MQTT配置
const MQTT_BROKER = 'mqtt://localhost:1883';
const DEVICE_ID = 'E5:BF:3C:6E:3F:01'; // 曹睿焜的设备ID

// 连接到MQTT服务器
console.log('🔌 连接到MQTT服务器...');
const client = mqtt.connect(MQTT_BROKER);

client.on('connect', () => {
  console.log('✅ MQTT连接成功');
  
  // 发送测试数据
  sendTestData();
});

client.on('error', (error) => {
  console.error('❌ MQTT连接错误:', error);
  process.exit(1);
});

// 发送测试数据
function sendTestData() {
  console.log('\n📤 发送测试数据...');
  
  // 模拟心率数据
  const heartRateData = {
    deviceId: DEVICE_ID,
    heartRate: 72 + Math.floor(Math.random() * 20), // 72-92之间的随机心率
    timestamp: new Date().toISOString()
  };
  
  // 模拟步数数据
  const stepsData = {
    deviceId: DEVICE_ID,
    steps: 100 + Math.floor(Math.random() * 50), // 100-150之间的随机步数
    timestamp: new Date().toISOString()
  };
  
  // 模拟血氧数据
  const bloodOxygenData = {
    deviceId: DEVICE_ID,
    bloodOxygen: 95 + Math.floor(Math.random() * 5), // 95-100之间的随机血氧
    timestamp: new Date().toISOString()
  };
  
  // 模拟体温数据
  const temperatureData = {
    deviceId: DEVICE_ID,
    bodyTemperature: 36.5 + Math.random() * 0.5, // 36.5-37.0之间的随机体温
    timestamp: new Date().toISOString()
  };
  
  // 发送心率数据
  console.log(`📤 发送心率数据: ${heartRateData.heartRate} bpm`);
  client.publish('sport/monitor/ble/' + DEVICE_ID + '/heartrate', JSON.stringify(heartRateData));
  
  setTimeout(() => {
    // 发送步数数据
    console.log(`📤 发送步数数据: ${stepsData.steps} 步`);
    client.publish('sport/monitor/ble/' + DEVICE_ID + '/steps', JSON.stringify(stepsData));
    
    setTimeout(() => {
      // 发送血氧数据
      console.log(`📤 发送血氧数据: ${bloodOxygenData.bloodOxygen}%`);
      client.publish('sport/monitor/ble/' + DEVICE_ID + '/bloodoxygen', JSON.stringify(bloodOxygenData));
      
      setTimeout(() => {
        // 发送体温数据
        console.log(`📤 发送体温数据: ${temperatureData.bodyTemperature.toFixed(1)}°C`);
        client.publish('sport/monitor/ble/' + DEVICE_ID + '/temperature', JSON.stringify(temperatureData));
        
        // 发送完整数据包
        setTimeout(() => {
          const completeData = {
            deviceId: DEVICE_ID,
            heartRate: 75 + Math.floor(Math.random() * 15),
            steps: 120 + Math.floor(Math.random() * 80),
            bloodOxygen: 96 + Math.floor(Math.random() * 4),
            bodyTemperature: 36.7 + Math.random() * 0.3,
            timestamp: new Date().toISOString()
          };
          
          console.log(`\n📤 发送完整数据包:`);
          console.log(`   心率: ${completeData.heartRate} bpm`);
          console.log(`   步数: ${completeData.steps} 步`);
          console.log(`   血氧: ${completeData.bloodOxygen}%`);
          console.log(`   体温: ${completeData.bodyTemperature.toFixed(1)}°C`);
          
          client.publish('sport/monitor/android/' + DEVICE_ID, JSON.stringify(completeData));
          
          // 等待并关闭连接
          setTimeout(() => {
            console.log('\n✅ 测试数据发送完成');
            console.log('💡 请检查:');
            console.log('   1. 后端服务器日志是否收到数据');
            console.log('   2. 数据库是否插入新记录');
            console.log('   3. 前端是否显示实时数据');
            client.end();
            process.exit(0);
          }, 2000);
        }, 1000);
      }, 1000);
    }, 1000);
  }, 1000);
}

// 处理退出
process.on('SIGINT', () => {
  console.log('\n👋 程序终止');
  client.end();
  process.exit(0);
});
