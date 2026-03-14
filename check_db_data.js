const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: './server/.env' });

async function checkDatabase() {
  try {
    console.log('检查数据库连接...');
    console.log('数据库配置:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_NAME
    });

    // 创建连接
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ 数据库连接成功！');

    // 检查表是否存在
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('\n数据库中的表:');
    tables.forEach(table => {
      console.log(`  - ${table[Object.keys(table)[0]]}`);
    });

    // 检查device_data表
    const [deviceDataRows] = await connection.execute('SELECT COUNT(*) as count FROM device_data');
    console.log(`\ndevice_data表中的记录数: ${deviceDataRows[0].count}`);

    if (deviceDataRows[0].count > 0) {
      // 查看最新的几条数据
      const [latestData] = await connection.execute(
        'SELECT * FROM device_data ORDER BY record_time DESC LIMIT 5'
      );
      console.log('\n最新的5条设备数据:');
      latestData.forEach((row, index) => {
        console.log(`\n记录 ${index + 1}:`);
        console.log(`  设备ID: ${row.device_id}`);
        console.log(`  心率: ${row.heart_rate}`);
        console.log(`  步数: ${row.steps}`);
        console.log(`  血氧: ${row.blood_oxygen}`);
        console.log(`  体温: ${row.body_temperature}`);
        console.log(`  记录时间: ${row.record_time}`);
      });
    } else {
      console.log('\n⚠️ device_data表中没有数据！');
      
      // 检查users表
      const [userRows] = await connection.execute('SELECT * FROM users LIMIT 5');
      console.log('\nusers表中的用户数据:');
      userRows.forEach((user, index) => {
        console.log(`\n用户 ${index + 1}:`);
        console.log(`  ID: ${user.id}`);
        console.log(`  用户名: ${user.username}`);
        console.log(`  姓名: ${user.name}`);
        console.log(`  设备ID: ${user.device_id}`);
        console.log(`  角色: ${user.role}`);
      });
    }

    // 检查特定用户的数据
    const [userData] = await connection.execute(
      'SELECT * FROM users WHERE username = ?',
      ['2023423320102']
    );
    
    if (userData.length > 0) {
      const user = userData[0];
      console.log(`\n用户 "2023423320102" 的信息:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  设备ID: ${user.device_id}`);
      
      if (user.device_id) {
        const [userDeviceData] = await connection.execute(
          'SELECT * FROM device_data WHERE device_id = ? ORDER BY record_time DESC LIMIT 3',
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

    await connection.end();
    console.log('\n✅ 数据库检查完成！');

  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.error('错误详情:', error);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n⚠️ 数据库访问被拒绝，请检查用户名和密码');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n⚠️ 数据库不存在，请先创建数据库');
      console.log('运行命令: mysql -u root -p < server/database/init.sql');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️ 无法连接到MySQL服务器，请确保MySQL正在运行');
      console.log('Windows: 检查MySQL服务是否启动');
      console.log('Linux/Mac: sudo service mysql start');
    }
  }
}

checkDatabase();