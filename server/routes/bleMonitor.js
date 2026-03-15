const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

let bleProcess = null;

// ✅✅✅ 正确路径 + 正确文件名 (与你的截图完全一致)
const scriptPath = path.join(__dirname, '../../BLE/multi_heart_rate_monitor.py');

console.log('🔎 Python 脚本路径:', scriptPath); // 帮助你定位

// 启动监测
router.post('/ble/start', (req, res) => {
  if (bleProcess) {
    return res.json({ code: 1, msg: '监测已在运行中' });
  }

  console.log('▶️ 后台启动蓝牙心率监测...');

  // Windows 必须用 python，不能用 python3
  bleProcess = spawn('python', [scriptPath]);

  bleProcess.stdout.on('data', (data) => {
    console.log('[BLE日志]', data.toString().trim());
  });

  bleProcess.stderr.on('data', (data) => {
    console.error('[BLE错误]', data.toString().trim());
  });

  bleProcess.on('close', (code) => {
    console.log(`🛑 蓝牙监测已停止，退出码: ${code}`);
    bleProcess = null;
  });

  return res.json({ code: 0, msg: '启动成功，正在连接蓝牙设备' });
});

// 停止监测
router.post('/ble/stop', (req, res) => {
  if (bleProcess) {
    bleProcess.kill();
    bleProcess = null;
    return res.json({ code: 0, msg: '已停止心率监测' });
  } else {
    return res.json({ code: 1, msg: '当前未运行监测' });
  }
});

// 获取状态
router.get('/ble/status', (req, res) => {
  return res.json({
    code: 0,
    data: { running: bleProcess != null }
  });
});

module.exports = router;