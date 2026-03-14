/**
 * 修复数据库表结构脚本
 */

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: './server/.env' });

async function fixDatabaseTables() {
  let conn;
  
  try {
    console.log('=' .repeat(60));
    console.log('修复数据库表结构');
    console.log('=' .repeat(60));
    
    conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('\n✅ 数据库连接成功！');

    // 1. 检查health_abnormalities表是否存在
    console.log('\n=== 检查health_abnormalities表 ===');
    const [tables] = await conn.execute('SHOW TABLES LIKE "health_abnormalities"');
    
    if (tables.length === 0) {
      console.log('health_abnormalities表不存在，创建表...');
      await conn.execute(`
        CREATE TABLE health_abnormalities (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          device_id VARCHAR(50) NOT NULL,
          abnormalities JSON,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ health_abnormalities表创建成功');
    } else {
      console.log('✅ health_abnormalities表已存在');
    }

    // 2. 检查device_data表结构
    console.log('\n=== device_data表结构 ===');
    const [cols] = await conn.execute('DESCRIBE device_data');
    cols.forEach(c => {
      console.log(`  ${c.Field} - ${c.Type} ${c.Null === 'YES' ? '(可空)' : ''}`);
    });

    // 3. 检查users表是否有device_id字段
    console.log('\n=== users表结构 ===');
    const [userCols] = await conn.execute('DESCRIBE users');
    const hasDeviceId = userCols.some(c => c.Field === 'device_id');
    if (!hasDeviceId) {
      console.log('users表缺少device_id字段，添加...');
      await conn.execute('ALTER TABLE users ADD COLUMN device_id VARCHAR(50)');
      console.log('✅ 已添加device_id字段');
    } else {
      console.log('✅ users表已有device_id字段');
    }

    // 4. 检查devices表是否有数据
    console.log('\n=== devices表数据 ===');
    const [devices] = await conn.execute('SELECT COUNT(*) as count FROM devices');
    console.log(`  devices表有 ${devices[0].count} 条记录`);

    console.log('\n' + '=' .repeat(60));
    console.log('数据库表结构修复完成！');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

fixDatabaseTables();
