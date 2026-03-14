const jwt = require('jsonwebtoken');
const User = require('../models/user');

// 硬编码测试用户
const hardcodedUsers = [
  { id: 1, username: 'admin001', password: 'password123', name: '管理员', gender: 'male', class_name: 'admin', student_id: null, device_id: null, role: 'admin' },
  { id: 2, username: 'Teacher101', password: 'password123', name: '李教师', gender: 'female', class_name: '高一1班', student_id: null, device_id: null, role: 'teacher' },
  { id: 3, username: '2023423320102', password: 'password123', name: '曹睿焜', gender: 'male', class_name: '高一1班', student_id: '2023423320102', device_id: 'device001', role: 'student' }
];

// 验证JWT令牌
const authenticateToken = async (req, res, next) => {
  try {
    // 获取Authorization头
    const authHeader = req.headers['authorization'];
    
    // 如果没有认证令牌，直接返回测试用户（用于开发测试）
    if (!authHeader) {
      req.user = hardcodedUsers.find(u => u.id === 3) || hardcodedUsers[0];
      return next();
    }
    
    // 提取token
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: '无效的认证令牌格式' });
    
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 获取用户信息
    let user = hardcodedUsers.find(u => u.id === decoded.id);
    if (!user) {
      // 如果硬编码用户中找不到，再从数据库中查找
      user = await User.getUserById(decoded.id);
      // 如果数据库中也找不到，仍然返回硬编码用户（用于测试）
      if (!user) {
        user = hardcodedUsers.find(u => u.id === 3) || hardcodedUsers[0];
      }
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('认证错误:', error);
    // 错误情况下仍然返回测试用户（用于测试）
    req.user = hardcodedUsers.find(u => u.id === 3) || hardcodedUsers[0];
    next();
  }
};

// 验证用户角色
const authorizeRole = (roles) => (req, res, next) => {
  roles.includes(req.user.role) ? next() : res.status(403).json({ message: '权限不足' });
};

module.exports = {
  authenticateToken,
  authorizeRole
};