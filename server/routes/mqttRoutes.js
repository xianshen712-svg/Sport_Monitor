const express = require('express');
const router = express.Router();
const { getConfig, saveConfig } = require('../controllers/mqttController');

// GET /api/mqtt/config
router.get('/config', getConfig);

// POST /api/mqtt/config
router.post('/config', saveConfig);

// POST /api/mqtt/test
const { testConnection } = require('../controllers/mqttController');
router.post('/test', testConnection);

module.exports = router;
