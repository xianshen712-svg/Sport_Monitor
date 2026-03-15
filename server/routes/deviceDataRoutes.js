const express = require('express');
const router = express.Router();
const DeviceDataController = require('../controllers/deviceDataController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

// 用户相关路由（需要认证）
router.get('/user/realtime', authenticateToken, DeviceDataController.getUserRealtimeData);
router.get('/user/history', authenticateToken, DeviceDataController.getUserHistoryData);
router.get('/user/report', authenticateToken, DeviceDataController.getUserHealthReport);

// 设备相关路由（管理员/教师权限）
router.get('/device/:deviceId/realtime', authenticateToken, authorizeRole(['admin', 'teacher']), DeviceDataController.getDeviceRealtimeData);
router.get('/device/:deviceId/history', authenticateToken, authorizeRole(['admin', 'teacher']), DeviceDataController.getDeviceHistoryData);

// 班级相关路由（教师/管理员权限）
router.get('/class/:className/data', authenticateToken, authorizeRole(['admin', 'teacher']), DeviceDataController.getClassDeviceData);
router.get('/class/:className/report', authenticateToken, authorizeRole(['admin', 'teacher']), DeviceDataController.getClassHealthReport);

// 仪表盘相关路由（管理员权限）
router.get('/latest', authenticateToken, authorizeRole(['admin']), DeviceDataController.getLatestDeviceData);
router.get('/stats', authenticateToken, authorizeRole(['admin']), DeviceDataController.getDashboardStats);

// 数据管理相关路由（管理员权限）
router.get('/all', authenticateToken, authorizeRole(['admin']), DeviceDataController.getAllDeviceData);
router.get('/data-stats', authenticateToken, authorizeRole(['admin']), DeviceDataController.getDeviceDataStats);

module.exports = router;
