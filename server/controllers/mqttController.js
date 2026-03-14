const path = require('path');
const fs = require('fs').promises;

const configPath = path.join(__dirname, '../config/mqttConfig.json');

async function getConfig(req, res) {
  try {
    const content = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(content);
    res.json({ success: true, data: config });
  } catch (err) {
    console.error('读取MQTT配置失败:', err);
    res.status(500).json({ success: false, message: '读取MQTT配置失败' });
  }
}

async function saveConfig(req, res) {
  try {
    const newConfig = req.body;
    await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
    res.json({ success: true });
  } catch (err) {
    console.error('保存MQTT配置失败:', err);
    res.status(500).json({ success: false, message: '保存MQTT配置失败' });
  }
}

// 测试 MQTT 连接：使用传入的配置（或文件中的配置）尝试一次短连接并返回结果
async function testConnection(req, res) {
  const mqtt = require('mqtt');
  let cfg = req.body;
  try {
    if (!cfg || Object.keys(cfg).length === 0) {
      const content = await fs.readFile(configPath, 'utf8');
      cfg = JSON.parse(content);
    }
  } catch (err) {
    console.warn('读取本地mqtt配置失败，使用请求体中的配置或默认值');
  }

  const connectOptions = {
    username: cfg.username || undefined,
    password: cfg.password || undefined,
    clientId: cfg.clientId || undefined,
    reconnectPeriod: 0, // 临时测试连接不自动重连
    connectTimeout: cfg.connectTimeout || 5000
  };

  let timer;
  const client = mqtt.connect(cfg.broker || 'mqtt://localhost', connectOptions);

  const cleanUp = (result) => {
    clearTimeout(timer);
    try { client.end(true); } catch (e) {}
    if (!res.headersSent) res.json(result);
  };

  client.on('connect', () => {
    cleanUp({ success: true, message: '连接成功' });
  });

  client.on('error', (err) => {
    cleanUp({ success: false, message: err.message || '连接失败', error: String(err) });
  });

  // 超时处理
  timer = setTimeout(() => {
    cleanUp({ success: false, message: '连接超时' });
  }, connectOptions.connectTimeout + 2000);
}

module.exports = { getConfig, saveConfig, testConnection };
