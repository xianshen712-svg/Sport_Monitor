const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: './server/.env' });

async function checkLatestData() {
  try {
    console.log('检查数据库中的最新数据...');
    
    // 创建连接
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ 数据库连接成功！');

    // 检查device_data表中的最新10条数据
    const [latestData] = await connection.execute(
      'SELECT * FROM device_data ORDER BY record_time DESC LIMIT 10'
    );
    
    console.log(`\n最新的10条设备数据:`);
    if (latestData.length === 0) {
      console.log('⚠️ 数据库中没有设备数据！');
    } else {
      latestData.forEach((row, index) => {
        console.log(`\n记录 ${index + 1}:`);
        console.log(`  设备ID: ${row.device_id}`);
        console.log(`  心率: ${row.heart_rate}`);
        console.log(`  步数: ${row.steps}`);
        console.log(`  血氧: ${row.blood_oxygen}`);
        console.log(`  体温: ${row.body_temperature}`);
        console.log(`  记录时间: ${row.record_time}`);
        console.log(`  数据来源: ${row.device_id.startsWith('device') ? '可能是模拟数据' : '可能是真实数据'}`);
      });
    }

    // 检查特定用户的数据
    console.log('\n检查用户 "2023423320102" 的设备数据...');
    const [userData] = await connection.execute(
      'SELECT * FROM users WHERE username = ?',
      ['2023423320102']
    );
    
    if (userData.length > 0) {
      const user = userData[0];
      console.log(`用户信息:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  设备ID: ${user.device_id}`);
      
      if (user.device_id) {
        const [userDeviceData] = await connection.execute(
          'SELECT * FROM device_data WHERE device_id = ? ORDER BY record_time DESC LIMIT 5',
          [user.device_id]
        );
        
        if (userDeviceData.length > 0) {
          console.log(`\n用户设备数据:`);
          userDeviceData.forEach((data, index) => {
            console.log(`\n记录 ${index + 1}:`);
            console.log(`  心率: ${data.heart_rate}`);
            console.log(`  步数: ${data.steps}`);
            console.log(`  血氧: ${data.blood_oxygen}`);
            console.log(`  体温: ${data.body_temperature}`);
            console.log(`  记录时间: ${data.record_time}`);
          });
        } else {
          console.log(`\n⚠️ 用户没有设备数据！`);
        }
      } else {
        console.log(`\n⚠️ 用户没有关联的设备ID！`);
      }
    }

    // 检查数据模式（模拟数据通常有规律）
    console.log('\n分析数据模式...');
    const [allData] = await connection.execute(
      'SELECT COUNT(*) as count, AVG(heart_rate) as avg_hr, AVG(steps) as avg_steps FROM device_data'
    );
    
    if (allData[0].count > 0) {
      console.log(`总数据量: ${allData[0].count}`);
      console.log(`平均心率: ${parseFloat(allData[0].avg_hr).toFixed(2)}`);
      console.log(`平均步数: ${parseFloat(allData[0].avg_steps).toFixed(2)}`);
      
      // 检查数据是否看起来像模拟数据
      const [hourlyData] = await connection.execute(
        'SELECT HOUR(record_time) as hour, COUNT(*) as count FROM device_data GROUP BY HOUR(record_time) ORDER BY hour'
      );
      
      console.log('\n按小时分布的数据量:');
      hourlyData.forEach(row => {
        console.log(`  小时 ${row.hour}: ${row.count} 条记录`);
      });
    }

    await connection.end();
    console.log('\n✅ 数据检查完成！');

  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
  }
}

checkLatestData();