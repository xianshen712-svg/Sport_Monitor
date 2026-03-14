const pool = require('../config/database');

class DeviceController {
  // 获取设备列表
  static async getDevices(req, res) {
    try {
      const { page = 1, limit = 20, status, search } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      
      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }
      
      if (search) {
        whereClause += ' AND (mac LIKE ? OR name LIKE ? OR student_id LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      // 查询设备列表
      const [rows] = await pool.execute(
        `SELECT d.*, u.name as student_name 
         FROM device d 
         LEFT JOIN users u ON d.student_id = u.student_id 
         ${whereClause} 
         ORDER BY d.created_at DESC 
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );
      
      // 查询总数
      const [countRows] = await pool.execute(
        `SELECT COUNT(*) as total FROM device ${whereClause}`,
        params
      );
      
      const total = countRows[0].total;
      
      res.json({ 
        success: true, 
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('获取设备列表失败:', error);
      res.status(500).json({ success: false, message: '获取设备列表失败', error: error.message });
    }
  }

  // 获取单个设备
  static async getDevice(req, res) {
    try {
      const { id } = req.params;
      const [rows] = await pool.execute(
        `SELECT d.*, u.name as student_name 
         FROM device d 
         LEFT JOIN users u ON d.student_id = u.student_id 
         WHERE d.id = ?`,
        [id]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: '设备不存在' });
      }
      
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      console.error('获取设备详情失败:', error);
      res.status(500).json({ success: false, message: '获取设备详情失败', error: error.message });
    }
  }

  // 新增设备
  static async createDevice(req, res) {
    const { mac, name, student_id, status } = req.body;
    
    if (!mac) {
      return res.status(400).json({ success: false, message: 'MAC地址不能为空' });
    }
    
    try {
      // 检查MAC地址是否已存在
      const [existing] = await pool.execute('SELECT id FROM device WHERE mac = ?', [mac]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: 'MAC地址已存在' });
      }
      
      const [result] = await pool.execute(
        'INSERT INTO device (mac, name, student_id, status) VALUES (?, ?, ?, ?)',
        [mac, name || null, student_id || null, status || 'offline']
      );
      
      res.json({ success: true, message: '设备创建成功', insertId: result.insertId });
    } catch (error) {
      console.error('创建设备失败:', error);
      res.status(500).json({ success: false, message: '创建设备失败', error: error.message });
    }
  }

  // 更新设备
  static async updateDevice(req, res) {
    const { id } = req.params;
    const { mac, name, student_id, status } = req.body;
    
    try {
      // 检查设备是否存在
      const [existing] = await pool.execute('SELECT id FROM device WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: '设备不存在' });
      }
      
      // 检查MAC地址是否被其他设备使用
      if (mac) {
        const [macCheck] = await pool.execute('SELECT id FROM device WHERE mac = ? AND id != ?', [mac, id]);
        if (macCheck.length > 0) {
          return res.status(400).json({ success: false, message: 'MAC地址已被其他设备使用' });
        }
      }
      
      await pool.execute(
        'UPDATE device SET mac = ?, name = ?, student_id = ?, status = ?, updated_at = NOW() WHERE id = ?',
        [mac, name || null, student_id || null, status || 'offline', id]
      );
      
      res.json({ success: true, message: '设备更新成功' });
    } catch (error) {
      console.error('更新设备失败:', error);
      res.status(500).json({ success: false, message: '更新设备失败', error: error.message });
    }
  }

  // 删除设备
  static async deleteDevice(req, res) {
    const { id } = req.params;
    
    try {
      const [existing] = await pool.execute('SELECT id FROM device WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: '设备不存在' });
      }
      
      await pool.execute('DELETE FROM device WHERE id = ?', [id]);
      res.json({ success: true, message: '设备删除成功' });
    } catch (error) {
      console.error('删除设备失败:', error);
      res.status(500).json({ success: false, message: '删除设备失败', error: error.message });
    }
  }

  // 批量删除设备
  static async batchDeleteDevices(req, res) {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: '请提供要删除的设备ID列表' });
    }
    
    try {
      const placeholders = ids.map(() => '?').join(',');
      await pool.execute(`DELETE FROM device WHERE id IN (${placeholders})`, ids);
      res.json({ success: true, message: `成功删除 ${ids.length} 个设备` });
    } catch (error) {
      console.error('批量删除设备失败:', error);
      res.status(500).json({ success: false, message: '批量删除设备失败', error: error.message });
    }
  }

  // 绑定设备到学生
  static async bindDevice(req, res) {
    const { id } = req.params;
    const { student_id } = req.body;
    
    if (!student_id) {
      return res.status(400).json({ success: false, message: '学生ID不能为空' });
    }
    
    try {
      // 检查设备是否存在
      const [device] = await pool.execute('SELECT id FROM device WHERE id = ?', [id]);
      if (device.length === 0) {
        return res.status(404).json({ success: false, message: '设备不存在' });
      }
      
      // 检查学生是否存在
      const [student] = await pool.execute('SELECT student_id FROM users WHERE student_id = ?', [student_id]);
      if (student.length === 0) {
        return res.status(404).json({ success: false, message: '学生不存在' });
      }
      
      await pool.execute(
        'UPDATE device SET student_id = ?, updated_at = NOW() WHERE id = ?',
        [student_id, id]
      );
      
      res.json({ success: true, message: '设备绑定成功' });
    } catch (error) {
      console.error('绑定设备失败:', error);
      res.status(500).json({ success: false, message: '绑定设备失败', error: error.message });
    }
  }

  // 解绑设备
  static async unbindDevice(req, res) {
    const { id } = req.params;
    
    try {
      const [existing] = await pool.execute('SELECT id FROM device WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: '设备不存在' });
      }
      
      await pool.execute(
        'UPDATE device SET student_id = NULL, updated_at = NOW() WHERE id = ?',
        [id]
      );
      
      res.json({ success: true, message: '设备解绑成功' });
    } catch (error) {
      console.error('解绑设备失败:', error);
      res.status(500).json({ success: false, message: '解绑设备失败', error: error.message });
    }
  }

  // 获取设备统计信息
  static async getDeviceStats(req, res) {
    try {
      // 总设备数
      const [totalRows] = await pool.execute('SELECT COUNT(*) as total FROM device');
      const total = totalRows[0].total;
      
      // 在线设备数
      const [onlineRows] = await pool.execute("SELECT COUNT(*) as count FROM device WHERE status = 'online'");
      const online = onlineRows[0].count;
      
      // 离线设备数
      const [offlineRows] = await pool.execute("SELECT COUNT(*) as count FROM device WHERE status = 'offline'");
      const offline = offlineRows[0].count;
      
      // 已绑定设备数
      const [boundRows] = await pool.execute('SELECT COUNT(*) as count FROM device WHERE student_id IS NOT NULL');
      const bound = boundRows[0].count;
      
      // 未绑定设备数
      const unbound = total - bound;
      
      res.json({
        success: true,
        stats: {
          total,
          online,
          offline,
          bound,
          unbound
        }
      });
    } catch (error) {
      console.error('获取设备统计失败:', error);
      res.status(500).json({ success: false, message: '获取设备统计失败', error: error.message });
    }
  }

  // 获取未绑定的学生列表（用于绑定设备）
  static async getUnboundStudents(req, res) {
    try {
      const [rows] = await pool.execute(`
        SELECT u.student_id, u.name, u.class_name
        FROM users u
        WHERE u.role = 'student' 
        AND u.student_id NOT IN (SELECT student_id FROM device WHERE student_id IS NOT NULL)
        ORDER BY u.class_name, u.name
      `);
      
      res.json({ success: true, data: rows });
    } catch (error) {
      console.error('获取未绑定学生列表失败:', error);
      res.status(500).json({ success: false, message: '获取未绑定学生列表失败', error: error.message });
    }
  }
}

module.exports = DeviceController;
