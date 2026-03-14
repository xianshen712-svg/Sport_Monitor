/**
 * 数据库连接测试脚本
 * 用于测试 MySQL 数据库连接是否正常
 */

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: './server/.env' });

async function testDatabaseConnection() {
  console.log('='.repeat(50));
  console.log('       MySQL 数据库连接测试');
  console.log('='.repeat(50));
  
  // 显示当前配置（隐藏密码）
  console.log('\n📋 数据库配置信息:');
  console.log(`   主机: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   端口: ${process.env.DB_PORT || '3306'}`);
  console.log(`   用户: ${process.env.DB_USER || 'root'}`);
  console.log(`   数据库: ${process.env.DB_NAME || 'sport_monitor'}`);
  console.log(`   密码: ${'*'.repeat(8)}`);
  
  let connection;
  
  try {
    console.log('\n🔄 正在连接数据库...');
    
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sport_monitor'
    });
    
    console.log('✅ 数据库连接成功！\n');
    
    // 测试1: 获取数据库版本
    console.log('📊 测试1: 获取数据库版本');
    const [versionRows] = await connection.execute('SELECT VERSION() as version');
    console.log(`   MySQL版本: ${versionRows[0].version}`);
    
    // 测试2: 查看所有表
    console.log('\n📊 测试2: 查看数据库中的表');
    const [tables] = await connection.execute('SHOW TABLES');
    if (tables.length > 0) {
      console.log('   数据库中的表:');
      tables.forEach(table => {
        const tableName = table[Object.keys(table)[0]];
        console.log(`   - ${tableName}`);
      });
    } else {
      console.log('   ⚠️ 数据库中没有表');
    }
    
    // 测试3: 检查关键表的记录数
    console.log('\n📊 测试3: 检查表记录数');
    const tablesToCheck = ['users', 'device_data'];
    
    for (const tableName of tablesToCheck) {
      try {
        const [countResult] = await connection.execute(
          `SELECT COUNT(*) as count FROM ${tableName}`
        );
        console.log(`   ${tableName}: ${countResult[0].count} 条记录`);
      } catch (err) {
        console.log(`   ${tableName}: 表不存在或无法访问`);
      }
    }
    
    // 测试4: 执行简单查询
    console.log('\n📊 测试4: 执行简单查询测试');
    const [testResult] = await connection.execute('SELECT 1 + 1 AS result');
    console.log(`   SELECT 1 + 1 = ${testResult[0].result}`);
    
    // 测试5: 检查数据库字符集
    console.log('\n📊 测试5: 检查数据库字符集');
    const [charsetResult] = await connection.execute(
      'SHOW VARIABLES LIKE "character_set_database"'
    );
    if (charsetResult.length > 0) {
      console.log(`   数据库字符集: ${charsetResult[0].Value}`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ 所有测试通过！数据库连接正常！');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ 数据库连接失败！');
    console.error('='.repeat(50));
    console.error(`错误代码: ${error.code}`);
    console.error(`错误信息: ${error.message}`);
    
    // 提供错误诊断建议
    console.log('\n💡 诊断建议:');
    
    switch (error.code) {
      case 'ER_ACCESS_DENIED_ERROR':
        console.log('   - 用户名或密码错误');
        console.log('   - 请检查 server/.env 文件中的 DB_USER 和 DB_PASSWORD');
        break;
      case 'ER_BAD_DB_ERROR':
        console.log('   - 数据库不存在');
        console.log('   - 请运行: mysql -u root -p < server/database/init.sql');
        break;
      case 'ECONNREFUSED':
        console.log('   - MySQL 服务未启动');
        console.log('   - Windows: 在服务管理器中启动 MySQL 服务');
        console.log('   - 或运行: net start mysql');
        break;
      case 'ETIMEDOUT':
        console.log('   - 连接超时，请检查数据库主机地址是否正确');
        break;
      case 'ENOTFOUND':
        console.log('   - 无法解析数据库主机地址');
        console.log('   - 请检查 DB_HOST 配置是否正确');
        break;
      default:
        console.log('   - 请检查 MySQL 服务是否正在运行');
        console.log('   - 请检查 server/.env 文件中的数据库配置');
    }
    
    process.exit(1);
  } finally {
    // 关闭连接
    if (connection) {
      await connection.end();
      console.log('\n🔌 数据库连接已关闭');
    }
  }
}

// 运行测试
testDatabaseConnection();
