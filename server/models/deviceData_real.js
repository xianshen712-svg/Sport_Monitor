const pool = require('../config/database');

class DeviceData {
  // 获取设备实时数据
  static async getDeviceRealtimeData(deviceId) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM device_data 
         WHERE device_id = ? 
         ORDER BY record_time DESC 
         LIMIT 1`,
        [deviceId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error getting device realtime data:', error);
      return null;
    }
  }

  // 获取设备历史数据
  static async getDeviceHistoryData(deviceId, startTime, endTime, limit = 100) {
    try {
      // 确保时间格式正确
      let formattedStartTime, formattedEndTime;
      try {
        formattedStartTime = new Date(startTime).toISOString().slice(0, 19).replace('T', ' ');
        formattedEndTime = new Date(endTime).toISOString().slice(0, 19).replace('T', ' ');
      } catch (dateError) {
        console.error('Error formatting dates:', dateError);
        const now = new Date();
        formattedStartTime = now.toISOString().slice(0, 19).replace('T', ' ');
        formattedEndTime = now.toISOString().slice(0, 19).replace('T', ' ');
      }
      
      const limitNum = Number(limit);
      const finalLimit = isNaN(limitNum) || limitNum <= 0 ? 100 : limitNum;
      
      // ✅ 改为 query
      const [rows] = await pool.query(
        `SELECT * FROM device_data 
         WHERE device_id = ? 
         AND record_time BETWEEN ? AND ?
         ORDER BY record_time DESC 
         LIMIT ?`,
        [deviceId, formattedStartTime, formattedEndTime, finalLimit]
      );
      return rows;
    } catch (error) {
      console.error('Error getting device history data:', error);
      return [];
    }
  }

  // 获取用户的设备数据
  static async getUserDeviceData(userId, startTime, endTime, limit = 100) {
    try {
      console.log(`getUserDeviceData called with: userId=${userId}, startTime=${startTime}, endTime=${endTime}, limit=${limit}`);
      
      const [userRows] = await pool.query(
        `SELECT device_id FROM users WHERE id = ?`,
        [userId]
      );
      
      if (userRows.length === 0 || !userRows[0].device_id) {
        console.log('No device found for user:', userId);
        return [];
      }
      
      const deviceId = userRows[0].device_id;
      console.log('User device ID:', deviceId);
      
      let formattedStartTime, formattedEndTime;
      try {
        formattedStartTime = new Date(startTime).toISOString().slice(0, 19).replace('T', ' ');
        formattedEndTime = new Date(endTime).toISOString().slice(0, 19).replace('T', ' ');
      } catch (dateError) {
        console.error('Error formatting dates:', dateError);
        const now = new Date();
        formattedStartTime = now.toISOString().slice(0, 19).replace('T', ' ');
        formattedEndTime = now.toISOString().slice(0, 19).replace('T', ' ');
      }
      
      console.log('Formatted times:', { formattedStartTime, formattedEndTime });
      
      const limitNum = Number(limit);
      const finalLimit = isNaN(limitNum) || limitNum <= 0 ? 100 : limitNum;
      
      // ✅ 改为 query
      const [rows] = await pool.query(
        `SELECT * FROM device_data 
         WHERE device_id = ? 
         AND record_time BETWEEN ? AND ?
         ORDER BY record_time DESC 
         LIMIT ?`,
        [deviceId, formattedStartTime, formattedEndTime, finalLimit]
      );
      
      console.log(`Found ${rows.length} rows for device ${deviceId}`);
      return rows;
    } catch (error) {
      console.error('Error getting user device data:', error.message);
      console.error('Error details:', error);
      return [];
    }
  }

// 保存设备数据 —— 纯插入，永远不会覆盖！
static async saveDeviceData(deviceId, data) {
  try {
    // 查学生ID
    const [userRows] = await pool.query(
      `SELECT student_id FROM users WHERE device_id = ?`,
      [deviceId]
    );
    
    const studentId = userRows.length > 0 ? userRows[0].student_id : null;

    // 血压解析
    let bloodPressureSystolic = null;
    let bloodPressureDiastolic = null;
    if (data.bloodPressure) {
      if (typeof data.bloodPressure === 'string') {
        try {
          const bp = JSON.parse(data.bloodPressure);
          bloodPressureSystolic = bp.systolic;
          bloodPressureDiastolic = bp.diastolic;
        } catch (e) {}
      } else if (typeof data.bloodPressure === 'object') {
        bloodPressureSystolic = data.bloodPressure.systolic;
        bloodPressureDiastolic = data.bloodPressure.diastolic;
      }
    }

    // ======================
    // 关键：纯 INSERT！每次都新增一行！
    // ======================
    const [result] = await pool.query(
      `INSERT INTO device_data (
        device_id, student_id, heart_rate, steps, blood_oxygen, 
        body_temperature, blood_pressure_systolic, blood_pressure_diastolic, 
        blood_sugar, fatigue_level, exercise_load, aerobic_stress, 
        anaerobic_stress, recovery_level, record_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        deviceId,
        studentId,
        data.heartRate || null,
        data.steps || 0,
        data.bloodOxygen || null,
        data.bodyTemperature || null,
        bloodPressureSystolic,
        bloodPressureDiastolic,
        data.bloodSugar || null,
        data.fatigueLevel || null,
        data.exerciseLoad || null,
        data.aerobicStress || null,
        data.anaerobicStress || null,
        data.recoveryLevel || null
      ]
    );

    console.log(`✅ 新增数据成功 ID: ${result.insertId} | 心率: ${data.heartRate}`);
    return { insertId: result.insertId };
  } catch (error) {
    console.error('Error saving device data:', error);
    throw error;
  }
}

  // 获取班级设备数据
  static async getClassDeviceData(className, startTime, endTime, limit = 100) {
    try {
      let formattedStartTime, formattedEndTime;
      try {
        formattedStartTime = new Date(startTime).toISOString().slice(0, 19).replace('T', ' ');
        formattedEndTime = new Date(endTime).toISOString().slice(0, 19).replace('T', ' ');
      } catch (dateError) {
        console.error('Error formatting dates:', dateError);
        const now = new Date();
        formattedStartTime = now.toISOString().slice(0, 19).replace('T', ' ');
        formattedEndTime = now.toISOString().slice(0, 19).replace('T', ' ');
      }
      
      const limitNum = Number(limit);
      const finalLimit = isNaN(limitNum) || limitNum <= 0 ? 100 : limitNum;
      
      // ✅ 改为 query
      const [rows] = await pool.query(
        `SELECT dd.* FROM device_data dd
         JOIN users u ON dd.student_id = u.student_id
         WHERE u.class_name = ? 
         AND dd.record_time BETWEEN ? AND ?
         ORDER BY dd.record_time DESC 
         LIMIT ?`,
        [className, formattedStartTime, formattedEndTime, finalLimit]
      );
      return rows;
    } catch (error) {
      console.error('Error getting class device data:', error);
      return [];
    }
  }

  // 获取最近N天的设备数据统计
  static async getDeviceStats(deviceId, days = 7) {
    try {
      const [rows] = await pool.query(
        `SELECT 
          DATE(record_time) as date,
          AVG(heart_rate) as avg_heart_rate,
          SUM(steps) as total_steps,
          AVG(blood_oxygen) as avg_blood_oxygen,
          AVG(body_temperature) as avg_body_temperature
         FROM device_data 
         WHERE device_id = ? 
         AND record_time >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY DATE(record_time)
         ORDER BY date DESC`,
        [deviceId, days]
      );
      return rows;
    } catch (error) {
      console.error('Error getting device stats:', error);
      return [];
    }
  }

  // 检查设备是否存在
  static async deviceExists(deviceId) {
    try {
      const [rows] = await pool.query(
        `SELECT COUNT(*) as count FROM device_data WHERE device_id = ?`,
        [deviceId]
      );
      return rows[0].count > 0;
    } catch (error) {
      console.error('Error checking device existence:', error);
      return false;
    }
  }
}

module.exports = DeviceData;