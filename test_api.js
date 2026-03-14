const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywidXNlcm5hbWUiOiIyMDIzNDIzMzIwMTAyIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NzM0NjEzNjksImV4cCI6MTc3MzU0Nzc2OX0.UddBLkwGB27vSCUzJJoJs7-8s6XmTTrIsAuRimH4WRc';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/device-data/user/realtime',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('API响应:');
      console.log(JSON.stringify(jsonData, null, 2));
      
      if (jsonData.success && jsonData.data) {
        console.log('\n解析后的数据:');
        console.log(`心率: ${jsonData.data.heart_rate || '无数据'}`);
        console.log(`步数: ${jsonData.data.steps || '无数据'}`);
        console.log(`血氧: ${jsonData.data.blood_oxygen || '无数据'}`);
        console.log(`体温: ${jsonData.data.body_temperature || '无数据'}`);
        console.log(`时间戳: ${jsonData.data.timestamp || '无数据'}`);
      }
    } catch (e) {
      console.error('解析响应失败:', e.message);
      console.log('原始响应:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`请求失败: ${e.message}`);
  console.log('提示: 请确保服务器正在运行 (node server/index.js)');
});

req.end();