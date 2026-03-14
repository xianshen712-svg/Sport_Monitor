const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 硬编码测试用户（模块级别共享）
const hardcodedUsers = [
  { id: 1, username: 'admin001', password: 'password123', name: '管理员', gender: 'male', class_name: 'admin', student_id: null, device_id: null, role: 'admin' },
  { id: 2, username: 'Teacher101', password: 'password123', name: '李教师', gender: 'female', class_name: '高一1班', student_id: null, device_id: null, role: 'teacher' },
  { id: 3, username: '2023423320102', password: 'password123', name: '曹睿焜', gender: 'male', class_name: '高一1班', student_id: '2023423320102', device_id: 'device001', role: 'student' }
];

class UserController {
  // 用户登录
  static async login(req, res) {
    try {
      const { username, password } = req.body;
      
      let user = hardcodedUsers.find(u => u.username === username);
      let isValidPwd = false;
      
      if (user) {
        isValidPwd = (password === user.password);
      } else {
        user = await User.getUserByUsername(username);
        if (user) isValidPwd = await bcrypt.compare(password, user.password);
      }
      
      if (!user || !isValidPwd) {
        return res.status(401).json({ message: '用户名或密码错误' });
      }
      
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );
      
      const { password: _, ...userNoPwd } = user;
      res.json({ token, user: userNoPwd });
    } catch (err) {
      res.status(500).json({ message: '登录失败' });
    }
  }

  // 用户注册
  static async register(req, res) {
    try {
      const { name, username, password, role, class_name, device_id } = req.body;
      
      if (await User.getUserByUsername(username)) {
        return res.status(400).json({ message: '用户名已存在' });
      }
      
      if (device_id && await User.getUserByDeviceId(device_id)) {
        return res.status(400).json({ message: '手环ID已绑定其他用户' });
      }
      
      const hashedPwd = await bcrypt.hash(password, 10);
      const newUser = await User.createUser({
        name, username, password: hashedPwd, role, class_name, device_id
      });
      
      const { password: _, ...userNoPwd } = newUser;
      res.status(201).json({ message: '注册成功', user: userNoPwd });
    } catch (err) {
      res.status(500).json({ message: '注册失败' });
    }
  }

  // 获取当前用户信息
  static async getCurrentUser(req, res) {
    try {
      const user = await User.getUserById(req.user.id);
      if (!user) return res.status(404).json({ message: '用户不存在' });
      
      const { password: _, ...userNoPwd } = user;
      res.json(userNoPwd);
    } catch (err) {
      res.status(500).json({ message: '获取用户信息失败' });
    }
  }

  // 更新用户信息
  static async updateUser(req, res) {
    try {
      const userId = req.user.id;
      const { name, class_name, device_id } = req.body;
      
      if (device_id) {
        const deviceUser = await User.getUserByDeviceId(device_id);
        if (deviceUser && deviceUser.id !== userId) {
          return res.status(400).json({ message: '手环ID已绑定其他用户' });
        }
      }
      
      const user = await User.getUserById(userId);
      const updated = await User.updateUser(userId, {
        name: name || user.name,
        username: user.username,
        password: user.password,
        role: user.role,
        class_name: class_name || user.class_name,
        device_id: device_id || user.device_id
      });
      
      if (!updated) return res.status(404).json({ message: '更新失败，用户不存在' });
      
      const { password: _, ...userNoPwd } = updated;
      res.json({ message: '更新成功', user: userNoPwd });
    } catch (err) {
      res.status(500).json({ message: '更新失败' });
    }
  }

  // 重置密码
  static async resetPassword(req, res) {
    try {
      const userId = req.user.id;
      const { oldPassword, newPassword } = req.body;
      
      // 使用模块级别的硬编码用户数组
      
      let userIndex = hardcodedUsers.findIndex(u => u.id === userId);
      
      if (userIndex !== -1) {
        // 处理硬编码用户
        const user = hardcodedUsers[userIndex];
        if (oldPassword !== user.password) {
          return res.status(400).json({ message: '旧密码错误' });
        }
        
        // 更新内存中的硬编码用户密码
        hardcodedUsers[userIndex] = {
          ...user,
          password: newPassword
        };
        
        res.json({ message: '密码重置成功' });
      } else {
        // 处理数据库用户
        const user = await User.getUserById(userId);
        if (!user) return res.status(404).json({ message: '用户不存在' });
        
        if (!await bcrypt.compare(oldPassword, user.password)) {
          return res.status(400).json({ message: '旧密码错误' });
        }
        
        const hashedPwd = await bcrypt.hash(newPassword, 10);
        const updated = await User.updateUser(userId, {
          ...user,
          password: hashedPwd
        });
        
        if (!updated) return res.status(404).json({ message: '更新失败，用户不存在' });
        
        res.json({ message: '密码重置成功' });
      }
    } catch (err) {
      console.error('密码重置失败:', err);
      res.status(500).json({ message: '密码重置失败' });
    }
  }

  // 批量导入用户
  static async importUsers(req, res) {
    try {
      const { users, overwrite = false } = req.body;
      const imported = [], updated = [], errors = [];
      
      for (const u of users) {
        try {
          const { name, username, password, role, class_name, device_id } = u;
          const existing = await User.getUserByUsername(username);
          
          // 检查手环ID冲突
          if (device_id) {
            const deviceUser = await User.getUserByDeviceId(device_id);
            if (deviceUser && (!existing || deviceUser.id !== existing.id)) {
              errors.push({ username, message: '手环ID已绑定其他用户' });
              continue;
            }
          }
          
          if (existing) {
            if (overwrite) {
              // 更新现有用户
              const hashedPwd = password ? await bcrypt.hash(password, 10) : existing.password;
              const updatedUser = await User.updateUser(existing.id, {
                name, password: hashedPwd, role, class_name, device_id
              });
              const { password: _, ...userNoPwd } = updatedUser;
              updated.push(userNoPwd);
            } else {
              errors.push({ username, message: '用户名已存在' });
            }
          } else {
            // 创建新用户
            const hashedPwd = await bcrypt.hash(password, 10);
            const newUser = await User.createUser({
              name, username, password: hashedPwd, role, class_name, device_id
            });
            const { password: _, ...userNoPwd } = newUser;
            imported.push(userNoPwd);
          }
        } catch (err) {
          errors.push({ username: u.username, message: err.message });
        }
      }
      
      res.json({ 
        message: `导入完成，成功导入 ${imported.length} 个用户，更新 ${updated.length} 个用户，失败 ${errors.length} 个`,
        importedUsers: imported,
        updatedUsers: updated,
        errors 
      });
    } catch (err) {
      res.status(500).json({ message: '导入失败' });
    }
  }

  // 上传用户头像
  static async uploadAvatar(req, res) {
    try {
      const userId = req.user.id;
      
      // 检查文件是否上传成功
      if (!req.file) {
        return res.status(400).json({ message: '没有上传头像文件' });
      }
      
      // 获取用户信息
      const user = await User.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }
      
      // 构建头像URL
      const avatarUrl = `http://localhost:${process.env.PORT || 3000}/uploads/${req.file.filename}`;
      
      // 更新用户头像
      const updated = await User.updateUser(userId, {
        ...user,
        avatar: avatarUrl
      });
      
      if (!updated) {
        return res.status(500).json({ message: '更新头像失败' });
      }
      
      // 返回成功响应
      res.json({ 
        message: '头像上传成功',
        avatar: avatarUrl
      });
    } catch (err) {
      console.error('头像上传失败:', err);
      res.status(500).json({ message: '头像上传失败' });
    }
  }
}

module.exports = UserController;