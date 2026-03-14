// 停止MQTT模拟数据生成器的脚本
const { exec } = require('child_process');
const fs = require('fs');

console.log('检查MQTT模拟数据生成器是否在运行...');

// 检查是否有mqttMock.js进程在运行
exec('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', (error, stdout, stderr) => {
  if (error) {
    console.error('检查进程错误:', error);
    return;
  }
  
  const lines = stdout.split('\n');
  let found = false;
  
  // 检查每个node进程的命令行参数
  lines.forEach(line => {
    if (line.includes('mqttMock.js')) {
      found = true;
      const parts = line.split(',');
      const pid = parts[1] ? parts[1].replace(/"/g, '') : '';
      console.log(`找到MQTT模拟数据生成器进程 PID: ${pid}`);
      
      // 停止进程
      exec(`taskkill /PID ${pid} /F`, (killError, killStdout, killStderr) => {
        if (killError) {
          console.error(`停止进程 ${pid} 失败:`, killError);
        } else {
          console.log(`已停止MQTT模拟数据生成器进程 PID: ${pid}`);
        }
      });
    }
  });
  
  if (!found) {
    console.log('未找到MQTT模拟数据生成器进程');
  }
  
  // 检查是否有其他模拟数据生成器
  console.log('\n检查其他模拟数据源...');
  
  // 检查是否有test_heart_rate_simulation.js文件
  if (fs.existsSync('test_heart_rate_simulation.js')) {
    console.log('找到test_heart_rate_simulation.js文件');
    exec('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', (error2, stdout2, stderr2) => {
      if (error2) return;
      
      const lines2 = stdout2.split('\n');
      lines2.forEach(line => {
        if (line.includes('test_heart_rate_simulation.js')) {
          const parts = line.split(',');
          const pid = parts[1] ? parts[1].replace(/"/g, '') : '';
          console.log(`找到心率模拟进程 PID: ${pid}`);
          
          exec(`taskkill /PID ${pid} /F`, (killError) => {
            if (killError) {
              console.error(`停止进程 ${pid} 失败:`, killError);
            } else {
              console.log(`已停止心率模拟进程 PID: ${pid}`);
            }
          });
        }
      });
    });
  } else {
    console.log('未找到test_heart_rate_simulation.js文件');
  }
  
  console.log('\n检查完成！');
  console.log('建议：');
  console.log('1. 确保没有模拟数据生成器在运行');
  console.log('2. 使用真实的BLE设备数据');
  console.log('3. 重启系统以清除所有模拟数据');
});