// 简单的MQTT代理服务器用于测试
const aedes = require('aedes');
const net = require('net');
const mqtt = require('mqtt');

// 创建Aedes MQTT代理
const broker = aedes();

// 创建TCP服务器
const server = net.createServer(broker.handle);

const PORT = 1883;

server.listen(PORT, () => {
  console.log(`MQTT代理服务器运行在端口 ${PORT}`);
  console.log('等待客户端连接...');
});

// 代理事件监听
broker.on('client', (client) => {
  console.log(`客户端连接: ${client.id}`);
});

broker.on('clientDisconnect', (client) => {
  console.log(`客户端断开: ${client.id}`);
});

broker.on('publish', (packet, client) => {
  if (client) {
    console.log(`收到来自 ${client.id} 的消息:`);
  } else {
    console.log('收到消息:');
  }
  console.log(`  主题: ${packet.topic}`);
  console.log(`  内容: ${packet.payload.toString()}`);
  
  // 如果是Android数据，模拟处理
  if (packet.topic.startsWith('sport/monitor/android/')) {
    console.log('  -> 检测到Android健康数据');
    try {
      const data = JSON.parse(packet.payload.toString());
      console.log(`  -> 设备ID: ${data.deviceId || '未知'}`);
      console.log(`  -> 心率: ${data.heartRate || '未知'}`);
      console.log(`  -> 步数: ${data.steps || '未知'}`);
    } catch (e) {
      console.log('  -> JSON解析失败');
    }
  }
});

broker.on('subscribe', (subscriptions, client) => {
  console.log(`客户端 ${client.id} 订阅主题:`);
  subscriptions.forEach(sub => {
    console.log(`  - ${sub.topic} (QoS: ${sub.qos})`);
  });
});

broker.on('unsubscribe', (unsubscriptions, client) => {
  console.log(`客户端 ${client.id} 取消订阅主题:`);
  unsubscriptions.forEach(topic => {
    console.log(`  - ${topic}`);
  });
});

// 错误处理
broker.on('clientError', (client, err) => {
  console.error(`客户端 ${client.id} 错误:`, err.message);
});

broker.on('connectionError', (client, err) => {
  console.error(`连接错误:`, err.message);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭MQTT代理服务器...');
  server.close(() => {
    console.log('MQTT代理服务器已关闭');
    process.exit(0);
  });
});

console.log('MQTT代理服务器启动完成');
console.log('按 Ctrl+C 停止服务器');
