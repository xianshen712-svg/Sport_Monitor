const redis = require('redis');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// Redis客户端
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

redisClient.on('error', (err) => {
  console.error('Redis连接错误:', err);
  console.warn('Redis连接失败，但服务器将继续运行');
});

redisClient.on('connect', () => {
  console.log('Redis连接成功');
});

module.exports = redisClient;