/**
 * 设备数据合并脚本
 * 
 * 问题：BLE工具发送的数据使用不同的设备ID（bloodoxygen、steps、heartrate、temperature），
 * 每个设备只发送一种类型的数据。但用户期望从单个设备获取所有健康数据。
 * 
 * 解决方案：此脚本将合并来自不同设备的数据，创建完整的健康数据记录。
 */

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: './server/.env' });

// BLE工具使用的设备ID
const BLE_DEVICE_IDS = ['heartrate', 'bloodoxygen', 'steps', 'temperature'];

// 目标用户的设备ID
const TARGET_DEVICE_ID = 'device001';

async function mergeDeviceData() {
  let connection;
  
  try {
    console.log('=' .repeat(60));
    console.log('设备数据合并工具');
    console.log('=' .repeat(60));
    
    // 创建连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ 数据库连接成功！');

    // 1. 查看当前数据分布
    console.log('\n📊 当前数据分布:');
    for (const deviceId of BLE_DEVICE_IDS) {
      const [rows] = await connection.execute(
        'SELECT COUNT(*) as count FROM device_data WHERE device_id = ?',
        [deviceId]
      );
      console.log(`  - ${deviceId}: ${rows[0].count} 条记录`);
    }

    // 2. 获取每种设备的最新数据
    console.log('\n📥 获取各设备最新数据...');
    
    const latestData = {};
    for (const deviceId of BLE_DEVICE_IDS) {
      const [rows] = await connection.execute(
        'SELECT * FROM device_data WHERE device_id = ? ORDER BY record_time DESC LIMIT 1',
        [deviceId]
      );
      if (rows.length > 0) {
        latestData[deviceId] = rows[0];
        console.log(`  ✅ ${deviceId}: 找到最新数据`);
      } else {
        console.log(`  ⚠️ ${deviceId}: 无数据`);
      }
    }

    // 3. 合并数据
    console.log('\n🔄 合并数据...');
    
    const mergedData = {
      heart_rate: latestData.heartrate?.heart_rate || null,
      blood_oxygen: latestData.bloodoxygen?.blood_oxygen || null,
      steps: latestData.steps?.steps || 0,
      body_temperature: latestData.temperature?.body_temperature || null
    };

    console.log('合并后的数据:');
    console.log(`  - 心率: ${mergedData.heart_rate || '无'} bpm`);
    console.log(`  - 血氧: ${mergedData.blood_oxygen || '无'}%`);
    console.log(`  - 步数: ${mergedData.steps} 步`);
    console.log(`  - 体温: ${mergedData.body_temperature || '无'}°C`);

    // 4. 检查目标设备是否存在数据
    const [existingData] = await connection.execute(
      'SELECT COUNT(*) as count FROM device_data WHERE device_id = ?',
      [TARGET_DEVICE_ID]
    );

    // 5. 插入合并后的数据到目标设备
    console.log(`\n📤 将合并数据写入设备 ${TARGET_DEVICE_ID}...`);
    
    // 获取用户的student_id
    const [userRows] = await connection.execute(
      'SELECT student_id FROM users WHERE device_id = ?',
      [TARGET_DEVICE_ID]
    );
    const studentId = userRows.length > 0 ? userRows[0].student_id : null;

    const [result] = await connection.execute(
      `INSERT INTO device_data (
        device_id, student_id, heart_rate, steps, blood_oxygen, 
        body_temperature, record_time
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        TARGET_DEVICE_ID,
        studentId,
        mergedData.heart_rate,
        mergedData.steps,
        mergedData.blood_oxygen,
        mergedData.body_temperature
      ]
    );

    console.log(`✅ 成功插入合并数据，ID: ${result.insertId}`);

    // 6. 验证插入结果
    const [verifyData] = await connection.execute(
      'SELECT * FROM device_data WHERE device_id = ? ORDER BY record_time DESC LIMIT 1',
      [TARGET_DEVICE_ID]
    );

    if (verifyData.length > 0) {
      console.log('\n✅ 验证成功！最新数据:');
      const data = verifyData[0];
      console.log(`  - 设备ID: ${data.device_id}`);
      console.log(`  - 心率: ${data.heart_rate || '无'} bpm`);
      console.log(`  - 血氧: ${data.blood_oxygen || '无'}%`);
      console.log(`  - 步数: ${data.steps} 步`);
      console.log(`  - 体温: ${data.body_temperature || '无'}°C`);
      console.log(`  - 记录时间: ${data.record_time}`);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('数据合并完成！用户现在应该能在前端看到健康数据了。');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 持续合并模式 - 每隔一段时间自动合并数据
async function continuousMerge(intervalMs = 5000) {
  console.log(`🔄 启动持续合并模式，间隔: ${intervalMs}ms`);
  console.log('按 Ctrl+C 停止\n');
  
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ 数据库连接成功！');

    // 获取用户的student_id
    const [userRows] = await connection.execute(
      'SELECT student_id FROM users WHERE device_id = ?',
      [TARGET_DEVICE_ID]
    );
    const studentId = userRows.length > 0 ? userRows[0].student_id : null;

    const mergeOnce = async () => {
      const latestData = {};
      
      for (const deviceId of BLE_DEVICE_IDS) {
        const [rows] = await connection.execute(
          'SELECT * FROM device_data WHERE device_id = ? ORDER BY record_time DESC LIMIT 1',
          [deviceId]
        );
        if (rows.length > 0) {
          latestData[deviceId] = rows[0];
        }
      }

      const mergedData = {
        heart_rate: latestData.heartrate?.heart_rate || null,
        blood_oxygen: latestData.bloodoxygen?.blood_oxygen || null,
        steps: latestData.steps?.steps || 0,
        body_temperature: latestData.temperature?.body_temperature || null
      };

      // 只有当有实际数据时才插入
      if (mergedData.heart_rate || mergedData.blood_oxygen || mergedData.body_temperature) {
        await connection.execute(
          `INSERT INTO device_data (
            device_id, student_id, heart_rate, steps, blood_oxygen, 
            body_temperature, record_time
          ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            TARGET_DEVICE_ID,
            studentId,
            mergedData.heart_rate,
            mergedData.steps,
            mergedData.blood_oxygen,
            mergedData.body_temperature
          ]
        );

        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ✅ 合并: 心率=${mergedData.heart_rate || '-'}, 血氧=${mergedData.blood_oxygen || '-'}%, 步数=${mergedData.steps}, 体温=${mergedData.body_temperature || '-'}°C`);
      } else {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ⏳ 等待BLE数据...`);
      }
    };

    // 立即执行一次
    await mergeOnce();

    // 然后定时执行
    setInterval(mergeOnce, intervalMs);

    // 保持进程运行
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ 错误:', error.message);
    if (connection) {
      await connection.end();
    }
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
if (args.includes('--continuous') || args.includes('-c')) {
  const intervalArg = args.find(a => a.startsWith('--interval='));
  const interval = intervalArg ? parseInt(intervalArg.split('=')[1]) : 5000;
  continuousMerge(interval);
} else {
  mergeDeviceData();
}
