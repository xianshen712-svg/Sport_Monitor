// 调试服务器启动
const { spawn } = require('child_process');
const path = require('path');

console.log('启动服务器进行调试...\n');

// 启动服务器进程
const serverProcess = spawn('node', ['server/index.js'], {
  cwd: __dirname,
  stdio: 'pipe',
  shell: true
});

// 捕获输出
serverProcess.stdout.on('data', (data) => {
  console.log(`服务器输出: ${data.toString()}`);
});

serverProcess.stderr.on('data', (data) => {
  console.error(`服务器错误: ${data.toString()}`);
});

serverProcess.on('close', (code) => {
  console.log(`服务器进程退出，代码: ${code}`);
});

serverProcess.on('error', (error) => {
  console.error(`启动服务器失败: ${error.message}`);
});

// 5秒后检查服务器状态
setTimeout(() => {
  console.log('\n检查服务器状态...');
  
  const http = require('http');
  const req = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/',
    method: 'GET',
    timeout: 3000
  }, (res) => {
    console.log(`服务器响应状态码: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log(`服务器响应: ${data}`);
      process.exit(0);
    });
  });
  
  req.on('error', (error) => {
    console.error(`无法连接到服务器: ${error.message}`);
    process.exit(1);
  });
  
  req.on('timeout', () => {
    console.error('连接服务器超时');
    req.destroy();
    process.exit(1);
  });
  
  req.end();
}, 5000);

// 10秒后停止服务器
setTimeout(() => {
  console.log('\n停止服务器...');
  serverProcess.kill();
  process.exit(0);
}, 10000);
