const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

// 直接在这里导入multer并配置
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 创建uploads目录（如果不存在）
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 配置multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB文件大小限制
  },
  fileFilter: (req, file, cb) => {
    // 只允许上传图片文件
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

// 公开路由
router.post('/login', UserController.login);
router.post('/register', UserController.register);

// 受保护路由
router.get('/me', authenticateToken, UserController.getCurrentUser);
router.put('/me', authenticateToken, UserController.updateUser);
router.put('/reset-password', authenticateToken, UserController.resetPassword);

// 管理员和老师路由
router.post('/import', authenticateToken, authorizeRole(['admin', 'teacher']), UserController.importUsers);

// 头像上传路由
router.post('/avatar', authenticateToken, upload.single('avatar'), UserController.uploadAvatar);

module.exports = router;