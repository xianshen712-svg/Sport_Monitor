const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function checkDatabase() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sport_monitor',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  
  try {
    // 检查最新的设备数据
    const [rows] = await pool.execute('SELECT * FROM device_data ORDER BY record_time DESC LIMIT 5');
    console.log('最新的5条设备数据:');
    rows.forEach((row, index) => {
      console.log(`${index + 1}. 设备ID: ${row.device_id}, 心率: ${row.heart_rate}, 步数: ${row.steps}, 时间: ${row.record_time}`);
    });
    
    // 检查是否有android-heartrate-device的数据
    const [androidRows] = await pool.execute('SELECT * FROM device_data WHERE device_id = ? ORDER BY record_time DESC LIMIT 5', ['android-heartrate-device']);
    console.log('\nandroid-heartrate-device的数据:');
    if (androidRows.length > 0) {
      androidRows.forEach((row, index) => {
        console.log(`${index + 1}. 心率: ${row.heart_rate}, 步数: ${row.steps}, 时间: ${row.record_time}`);
      });
    } else {
      console.log('没有找到android-heartrate-device的数据');
    }
    
    await pool.end();
  } catch (error) {
    console.error('数据库查询错误:', error.message);
  }
}

checkDatabase();
