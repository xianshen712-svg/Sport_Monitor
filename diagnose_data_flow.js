/**
 * 数据流诊断脚本
 * 检查从BLE设备到前端显示的完整数据流
 */

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const mqtt = require('mqtt');

// 加载环境变量
dotenv.config({ path: './server/.env' });

async function diagnoseDataFlow() {
  console.log('='.repeat(60));
  console.log('       数据流诊断工具');
  console.log('='.repeat(60));
  
  console.log('\n📋 系统配置检查:');
  console.log(`   数据库: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  console.log(`   MQTT: ${process.env.MQTT_BROKER || 'localhost:1883'}`);
  console.log(`   服务器端口: ${process.env.PORT || 3000}`);
  
  let connection;
  
  try {
    // 1. 检查数据库连接
    console.log('\n🔍 步骤1: 检查数据库连接...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sport_monitor'
    });
    console.log('✅ 数据库连接成功');
    
    // 2. 检查表结构
    console.log('\n🔍 步骤2: 检查表结构...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`   数据库中有 ${tables.length} 个表:`);
    tables.forEach(table => {
      const tableName = table[Object.keys(table)[0]];
      console.log(`   - ${tableName}`);
    });
    
    // 3. 检查device_data表结构
    console.log('\n🔍 步骤3: 检查device_data表结构...');
    const [columns] = await connection.execute('DESCRIBE device_data');
    console.log('   device_data表字段:');
    columns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });
    
    // 4. 检查最新数据
    console.log('\n🔍 步骤4: 检查最新设备数据...');
    const [latestData] = await connection.execute(
      'SELECT * FROM device_data ORDER BY record_time DESC LIMIT 5'
    );
    
    if (latestData.length > 0) {
      console.log(`   找到 ${latestData.length} 条最新记录:`);
      latestData.forEach((row, index) => {
        console.log(`\n   记录 ${index + 1}:`);
        console.log(`     设备ID: ${row.device_id}`);
        console.log(`     心率: ${row.heart_rate}`);
        console.log(`     步数: ${row.steps}`);
        console.log(`     血氧: ${row.blood_oxygen}`);
        console.log(`     体温: ${row.body_temperature}`);
        console.log(`     记录时间: ${row.record_time}`);
      });
    } else {
      console.log('   ⚠️ device_data表中没有数据');
    }
    
    // 5. 检查用户和设备关联
    console.log('\n🔍 步骤5: 检查用户和设备关联...');
    const [users] = await connection.execute(
      'SELECT id, username, name, device_id, role FROM users WHERE device_id IS NOT NULL'
    );
    
    if (users.length > 0) {
      console.log(`   找到 ${users.length} 个已关联设备的用户:`);
      users.forEach(user => {
        console.log(`   - ${user.name} (${user.username}): 设备ID=${user.device_id}`);
      });
    } else {
      console.log('   ⚠️ 没有用户关联设备');
    }
    
    // 6. 检查MQTT服务器
    console.log('\n🔍 步骤6: 检查MQTT服务器...');
    const mqttBroker = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
    console.log(`   尝试连接MQTT服务器: ${mqttBroker}`);
    
    const mqttClient = mqtt.connect(mqttBroker, {
      connectTimeout: 5000
    });
    
    await new Promise((resolve, reject) => {
      mqttClient.on('connect', () => {
        console.log('   ✅ MQTT服务器连接成功');
        mqttClient.end();
        resolve();
      });
      
      mqttClient.on('error', (error) => {
        console.log(`   ❌ MQTT服务器连接失败: ${error.message}`);
        console.log('   请确保MQTT服务器正在运行: node simple_mqtt_broker.js');
        mqttClient.end();
        resolve(); // 继续诊断，不中断
      });
      
      setTimeout(() => {
        console.log('   ⚠️ MQTT连接超时');
        mqttClient.end();
        resolve();
      }, 5000);
    });
    
    // 7. 检查WebSocket服务
    console.log('\n🔍 步骤7: 检查WebSocket服务...');
    console.log('   请确保后端服务器正在运行: npm start');
    console.log('   WebSocket地址: ws://localhost:' + (process.env.PORT || 3000) + '/ws');
    
    // 8. 检查前端配置
    console.log('\n🔍 步骤8: 检查前端配置...');
    console.log('   前端地址: http://localhost:5173');
    console.log('   请确保前端正在运行: cd client && npm run dev');
    
    // 9. 诊断建议
    console.log('\n💡 诊断建议:');
    
    if (latestData.length === 0) {
      console.log('   1. device_data表中没有数据，可能是以下原因:');
      console.log('      - BLE设备未发送数据到MQTT');
      console.log('      - MQTT服务器未运行');
      console.log('      - 后端服务器未处理MQTT消息');
      console.log('      - 数据库插入失败');
    } else {
      console.log('   1. 数据库中有数据，但前端未显示，可能是以下原因:');
      console.log('      - 前端WebSocket连接失败');
      console.log('      - 前端API调用错误');
      console.log('      - 用户设备关联不正确');
    }
    
    console.log('\n   2. 检查步骤:');
    console.log('      a. 运行MQTT服务器: node simple_mqtt_broker.js');
    console.log('      b. 运行后端服务器: cd server && npm start');
    console.log('      c. 运行前端: cd client && npm run dev');
    console.log('      d. 运行BLE工具: python BLE/unified_ble_mqtt_tool.py');
    console.log('      e. 检查各服务日志');
    
    console.log('\n   3. 快速测试命令:');
    console.log('      - 测试数据库: node test_db_connection.js');
    console.log('      - 测试API: node test_api.js');
    console.log('      - 检查最新数据: node check_latest_data.js');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 诊断完成');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ 诊断过程中出现错误:');
    console.error(`   错误: ${error.message}`);
    
    console.log('\n💡 建议:');
    console.log('   1. 检查数据库服务是否运行');
    console.log('   2. 检查server/.env文件配置');
    console.log('   3. 运行数据库初始化脚本: mysql -u root -p < server/database/init.sql');
    
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行诊断
diagnoseDataFlow();
