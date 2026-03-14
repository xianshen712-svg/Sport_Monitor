#!/usr/bin/env node
/**
 * 测试数据流：从MQTT到数据库
 * 这个脚本模拟发送MQTT消息，然后检查数据库是否成功插入数据
 */

const mqtt = require('mqtt');
const mysql = require('mysql2/promise');

// MQTT配置
const MQTT_BROKER = 'mqtt://localhost:1883';
const TOPIC = 'sport/monitor/ble/E5:BF:3C:6E:3F:01/heartrate';

// 数据库配置
const DB_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'sport_monitor'
};

async function testDataFlow() {
  console.log('='.repeat(60));
  console.log('数据流测试');
  console.log('='.repeat(60));
  
  // 1. 连接到数据库
  console.log('\n1. 连接到数据库...');
  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return;
  }
  
  // 2. 检查当前数据库中的记录数
  console.log('\n2. 检查当前数据库记录...');
  try {
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM device_data');
    console.log(`当前数据库中有 ${rows[0].count} 条记录`);
    
    const [latestRows] = await connection.execute(
      'SELECT * FROM device_data ORDER BY record_time DESC LIMIT 5'
    );
    console.log('最新的5条记录:');
    latestRows.forEach((row, index) => {
      console.log(`  ${index + 1}. ID: ${row.id}, 心率: ${row.heart_rate}, 时间: ${row.record_time}`);
    });
  } catch (error) {
    console.error('❌ 查询数据库失败:', error.message);
  }
  
  // 3. 连接到MQTT并发送测试数据
  console.log('\n3. 连接到MQTT并发送测试数据...');
  const client = mqtt.connect(MQTT_BROKER);
  
  client.on('connect', async () => {
    console.log('✅ MQTT连接成功');
    
    // 发送测试数据
    const testData = {
      deviceId: 'E5:BF:3C:6E:3F:01',
      heartRate: Math.floor(Math.random() * 40) + 60, // 60-100之间的随机心率
      timestamp: new Date().toISOString(),
      unixTime: Date.now(),
      dataType: 'heart_rate'
    };
    
    console.log(`发送测试数据: 心率 ${testData.heartRate} bpm`);
    client.publish(TOPIC, JSON.stringify(testData), { qos: 1 }, async (err) => {
      if (err) {
        console.error('❌ 发送MQTT消息失败:', err.message);
      } else {
        console.log('✅ MQTT消息发送成功');
        
        // 等待2秒让服务器处理数据
        console.log('\n等待2秒让服务器处理数据...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 4. 检查数据库是否新增了记录
        console.log('\n4. 检查数据库是否新增记录...');
        try {
          const [newRows] = await connection.execute('SELECT COUNT(*) as count FROM device_data');
          console.log(`发送后数据库中有 ${newRows[0].count} 条记录`);
          
          const [newLatestRows] = await connection.execute(
            'SELECT * FROM device_data ORDER BY record_time DESC LIMIT 5'
          );
          console.log('发送后最新的5条记录:');
          newLatestRows.forEach((row, index) => {
            console.log(`  ${index + 1}. ID: ${row.id}, 心率: ${row.heart_rate}, 时间: ${row.record_time}`);
          });
          
          // 检查是否有新记录
          if (newRows[0].count > rows[0].count) {
            console.log('✅ 数据库成功插入新记录！');
          } else {
            console.log('❌ 数据库没有新增记录，可能存在问题');
            console.log('可能的原因:');
            console.log('  1. 服务器没有正确处理MQTT消息');
            console.log('  2. 服务器代码中的INSERT逻辑有问题');
            console.log('  3. 服务器可能需要重启');
          }
        } catch (error) {
          console.error('❌ 查询数据库失败:', error.message);
        }
        
        // 5. 检查服务器日志
        console.log('\n5. 检查建议:');
        console.log('  请查看服务器终端输出，确认是否收到MQTT消息并处理');
        console.log('  服务器应该输出类似: "收到MQTT消息: sport/monitor/ble/E5:BF:3C:6E:3F:01/heartrate"');
        console.log('  和 "插入设备 E5:BF:3C:6E:3F:01 的新数据记录"');
        
        // 清理
        client.end();
        await connection.end();
        console.log('\n✅ 测试完成');
      }
    });
  });
  
  client.on('error', (err) => {
    console.error('❌ MQTT连接错误:', err.message);
    console.log('\n请确保MQTT服务器正在运行:');
    console.log('  node simple_mqtt_broker.js');
  });
}

// 运行测试
testDataFlow().catch(console.error);