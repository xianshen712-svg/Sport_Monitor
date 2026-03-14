const express = require('express');
const router = express.Router();
const DeviceController = require('../controllers/deviceController');

// 设备管理路由
// 获取设备统计信息
router.get('/stats', DeviceController.getDeviceStats);

// 获取未绑定学生列表
router.get('/unbound-students', DeviceController.getUnboundStudents);

// 获取设备列表
router.get('/', DeviceController.getDevices);

// 获取单个设备
router.get('/:id', DeviceController.getDevice);

// 新增设备
router.post('/', DeviceController.createDevice);

// 更新设备
router.put('/:id', DeviceController.updateDevice);

// 删除设备
router.delete('/:id', DeviceController.deleteDevice);

// 批量删除设备
router.post('/batch-delete', DeviceController.batchDeleteDevices);

// 绑定设备到学生
router.post('/:id/bind', DeviceController.bindDevice);

// 解绑设备
router.post('/:id/unbind', DeviceController.unbindDevice);

module.exports = router;
