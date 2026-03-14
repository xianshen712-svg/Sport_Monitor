const DeviceData = require('../models/deviceData_real');
const User = require('../models/user');
const { pool } = require('../index');

// BLE工具使用的设备ID列表
const BLE_DEVICE_IDS = ['heartrate', 'bloodoxygen', 'steps', 'temperature'];

class DeviceDataController {
  // 从多个BLE设备聚合数据
  static async aggregateBLEDeviceData() {
    try {
      const pool = require('../index').pool;
      if (!pool) {
        console.log('数据库连接池未就绪');
        return null;
      }
      
      const latestData = {};
      
      for (const deviceId of BLE_DEVICE_IDS) {
        const [rows] = await pool.execute(
          'SELECT * FROM device_data WHERE device_id = ? ORDER BY record_time DESC LIMIT 1',
          [deviceId]
        );
        if (rows.length > 0) {
          latestData[deviceId] = rows[0];
        }
      }
      
      // 如果没有任何BLE设备数据，返回null
      if (Object.keys(latestData).length === 0) {
        return null;
      }
      
      // 合并数据
      const mergedData = {
        heart_rate: latestData.heartrate?.heart_rate || null,
        blood_oxygen: latestData.bloodoxygen?.blood_oxygen || null,
        steps: latestData.steps?.steps || 0,
        body_temperature: latestData.temperature?.body_temperature || null,
        record_time: new Date().toISOString(),
        // 使用最新的记录时间
        latest_record_time: Math.max(
          ...Object.values(latestData).map(d => new Date(d.record_time).getTime())
        )
      };
      
      return mergedData;
    } catch (error) {
      console.error('聚合BLE设备数据失败:', error);
      return null;
    }
  }

  // 获取设备实时数据
  static async getDeviceRealtimeData(req, res) {
    try {
      const { deviceId } = req.params;
      const data = await DeviceData.getDeviceRealtimeData(deviceId);
      
      if (!data) {
        return res.status(404).json({ message: '未找到设备实时数据' });
      }
      
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: '获取设备实时数据失败', error: error.message });
    }
  }

  // 获取用户实时数据
  static async getUserRealtimeData(req, res) {
    try {
      const userId = req.user.id;
      console.log('获取用户实时数据，用户ID:', userId);
      
      // 为了兼容前端，使用最近7天的时间范围
      const endTime = new Date().toISOString();
      const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      // 首先尝试获取用户关联设备的数据
      let data = await DeviceData.getUserDeviceData(userId, startTime, endTime, 10);
      console.log('用户设备数据查询结果:', data ? data.length : 0, '条');
      
      // 合并最近的数据（因为BLE数据可能分散在多个记录中）
      let mergedData = {
        heart_rate: null,
        steps: null,
        blood_oxygen: null,
        body_temperature: null,
        blood_pressure_systolic: null,
        blood_pressure_diastolic: null,
        blood_sugar: null,
        record_time: null
      };
      
      if (data && data.length > 0) {
        // 从最近的记录开始合并数据
        for (const record of data) {
          if (record.heart_rate && !mergedData.heart_rate) mergedData.heart_rate = record.heart_rate;
          if (record.steps && !mergedData.steps) mergedData.steps = record.steps;
          if (record.blood_oxygen && !mergedData.blood_oxygen) mergedData.blood_oxygen = record.blood_oxygen;
          if (record.body_temperature && !mergedData.body_temperature) mergedData.body_temperature = record.body_temperature;
          if (record.blood_pressure_systolic && !mergedData.blood_pressure_systolic) mergedData.blood_pressure_systolic = record.blood_pressure_systolic;
          if (record.blood_pressure_diastolic && !mergedData.blood_pressure_diastolic) mergedData.blood_pressure_diastolic = record.blood_pressure_diastolic;
          if (record.blood_sugar && !mergedData.blood_sugar) mergedData.blood_sugar = record.blood_sugar;
          if (record.record_time && !mergedData.record_time) mergedData.record_time = record.record_time;
        }
      }
      
      // 如果合并后仍然没有数据，尝试直接查询设备数据（使用用户的设备ID）
      if (!mergedData.heart_rate && !mergedData.blood_oxygen && !mergedData.body_temperature) {
        console.log('用户设备无数据，尝试直接查询设备数据...');
        
        // 获取用户的设备ID
        const pool = require('../index').pool;
        const [userRows] = await pool.execute('SELECT device_id FROM users WHERE id = ?', [userId]);
        
        if (userRows.length > 0 && userRows[0].device_id) {
          const deviceId = userRows[0].device_id;
          console.log('用户设备ID:', deviceId);
          
          // 直接查询设备的最新数据
          const [deviceRows] = await pool.execute(
            'SELECT * FROM device_data WHERE device_id = ? ORDER BY record_time DESC LIMIT 10',
            [deviceId]
          );
          
          if (deviceRows.length > 0) {
            console.log('找到设备数据:', deviceRows.length, '条');
            // 合并数据
            for (const record of deviceRows) {
              if (record.heart_rate && !mergedData.heart_rate) mergedData.heart_rate = record.heart_rate;
              if (record.steps && !mergedData.steps) mergedData.steps = record.steps;
              if (record.blood_oxygen && !mergedData.blood_oxygen) mergedData.blood_oxygen = record.blood_oxygen;
              if (record.body_temperature && !mergedData.body_temperature) mergedData.body_temperature = record.body_temperature;
              if (record.blood_pressure_systolic && !mergedData.blood_pressure_systolic) mergedData.blood_pressure_systolic = record.blood_pressure_systolic;
              if (record.blood_pressure_diastolic && !mergedData.blood_pressure_diastolic) mergedData.blood_pressure_diastolic = record.blood_pressure_diastolic;
              if (record.blood_sugar && !mergedData.blood_sugar) mergedData.blood_sugar = record.blood_sugar;
              if (record.record_time && !mergedData.record_time) mergedData.record_time = record.record_time;
            }
          }
        }
      }
      
      console.log('合并后的数据:', mergedData);
      
      // 返回数据库中的真实BLE数据
      const responseData = {
        heart_rate: mergedData.heart_rate || null,
        steps: mergedData.steps !== undefined && mergedData.steps !== null ? mergedData.steps : null,
        blood_oxygen: mergedData.blood_oxygen || null,
        body_temperature: mergedData.body_temperature || null,
        blood_pressure: mergedData.blood_pressure_systolic && mergedData.blood_pressure_diastolic 
          ? JSON.stringify({ 
              systolic: mergedData.blood_pressure_systolic, 
              diastolic: mergedData.blood_pressure_diastolic 
            })
          : null,
        blood_sugar: mergedData.blood_sugar || null,
        timestamp: mergedData.record_time || new Date().toISOString()
      };
      
      // 前端期望的数据结构是 { success: true, data: ... }
      res.json({ success: true, data: responseData });
    } catch (error) {
      console.error('获取实时数据失败:', error);
      res.status(500).json({ message: '获取实时数据失败', error: error.message });
    }
  }

  // 获取设备历史数据
  static async getDeviceHistoryData(req, res) {
    try {
      const { deviceId } = req.params;
      const { startTime, endTime, limit = 100 } = req.query;
      
      if (!startTime || !endTime) {
        return res.status(400).json({ message: '请提供时间范围参数' });
      }
      
      const data = await DeviceData.getDeviceHistoryData(deviceId, startTime, endTime, parseInt(limit));
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: '获取设备历史数据失败', error: error.message });
    }
  }

  // 获取用户历史数据
  static async getUserHistoryData(req, res) {
    try {
      const userId = req.user.id;
      let { startTime, endTime, date, limit = 100 } = req.query;
      
      // 兼容前端传递的date参数
      if (date) {
        // 如果只有date参数，设置为当天的开始和结束时间
        startTime = new Date(date + 'T00:00:00Z').toISOString();
        endTime = new Date(date + 'T23:59:59Z').toISOString();
      } else if (!startTime || !endTime) {
        return res.status(400).json({ message: '请提供时间范围参数' });
      }
      
      const data = await DeviceData.getUserDeviceData(userId, startTime, endTime, parseInt(limit));
      
      if (!data) {
        return res.status(404).json({ message: '未找到用户设备数据' });
      }
      
      // 前端期望的数据结构是 { success: true, data: ... }
      res.json({ success: true, data: data });
    } catch (error) {
      res.status(500).json({ message: '获取用户历史数据失败', error: error.message });
    }
  }

  // 获取班级设备数据
  static async getClassDeviceData(req, res) {
    try {
      const { className } = req.params;
      const { startTime, endTime, limit = 100 } = req.query;
      
      if (!startTime || !endTime) {
        return res.status(400).json({ message: '请提供时间范围参数' });
      }
      
      const data = await DeviceData.getClassDeviceData(className, startTime, endTime, parseInt(limit));
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: '获取班级设备数据失败', error: error.message });
    }
  }

  // 获取用户健康报告
  static async getUserHealthReport(req, res) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: '请提供日期范围参数' });
      }
      
      // 使用req.user中的用户信息，不需要再次从数据库获取
      const user = req.user;
      
      // 获取设备数据
      const deviceData = await DeviceData.getUserDeviceData(userId, startDate, endDate, 1000);
      if (!deviceData || deviceData.length === 0) {
        return res.status(404).json({ message: '未找到足够的设备数据' });
      }
      
      // 计算健康指标
      console.log('Device data received:', deviceData.length, 'records');
      console.log('First record:', deviceData[0]);
      console.log('Last record:', deviceData[deviceData.length - 1]);
      
      const healthReport = DeviceDataController.generateHealthReport(deviceData);
      
      console.log('Health report generated successfully');
      res.json({ user, report: healthReport });
    } catch (error) {
      console.error('Error generating health report:', error);
      res.status(500).json({ message: '生成健康报告失败', error: error.message, stack: error.stack });
    }
  }

  // 获取班级健康报告
  static async getClassHealthReport(req, res) {
    try {
      const { className } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: '请提供日期范围参数' });
      }
      
      // 获取班级用户
      const users = await User.getUsersByClass(className);
      if (users.length === 0) {
        return res.status(404).json({ message: '班级不存在或没有学生' });
      }
      
      // 获取所有学生的设备数据
      const classData = [];
      for (const user of users) {
        if (user.device_id) {
          const deviceData = await DeviceData.getDeviceHistoryData(user.device_id, startDate, endDate, 1000);
          if (deviceData && deviceData.length > 0) {
            classData.push({ user, data: deviceData });
          }
        }
      }
      
      // 计算班级健康指标
      const classReport = this.generateClassHealthReport(classData);
      
      res.json({ className, report: classReport });
    } catch (error) {
      res.status(500).json({ message: '生成班级健康报告失败', error: error.message });
    }
  }

  // 生成健康报告
  static generateHealthReport(deviceData) {
    // 计算心率统计
    const heartRates = deviceData.map(data => data.heart_rate).filter(Boolean);
    const avgHeartRate = heartRates.length > 0 ? heartRates.reduce((sum, rate) => sum + rate, 0) / heartRates.length : 0;
    const maxHeartRate = heartRates.length > 0 ? Math.max(...heartRates) : 0;
    const minHeartRate = heartRates.length > 0 ? Math.min(...heartRates) : 0;
    const heartRateStatus = this.getHealthStatus(avgHeartRate, 60, 100);
    
    // 计算步数统计
    const steps = deviceData.map(data => data.steps).filter(Boolean);
    const totalSteps = steps.length > 0 ? steps.reduce((sum, step) => sum + step, 0) : 0;
    const avgSteps = steps.length > 0 ? totalSteps / steps.length : 0;
    const stepsStatus = this.getHealthStatus(avgSteps, 6000, 10000);
    
    // 计算血氧统计
    const bloodOxygen = deviceData.map(data => data.blood_oxygen).filter(Boolean);
    const avgBloodOxygen = bloodOxygen.length > 0 ? bloodOxygen.reduce((sum, oxygen) => sum + oxygen, 0) / bloodOxygen.length : 0;
    const bloodOxygenStatus = this.getHealthStatus(avgBloodOxygen, 95, 100);
    
    // 计算体温统计
    const bodyTemperatures = deviceData.map(data => data.body_temperature).filter(Boolean);
    const avgBodyTemperature = bodyTemperatures.length > 0 ? bodyTemperatures.reduce((sum, temp) => sum + temp, 0) / bodyTemperatures.length : 0;
    const bodyTemperatureStatus = this.getHealthStatus(avgBodyTemperature, 36.0, 37.2);
    
    // 计算运动负荷和疲劳度
    const exerciseLoad = Math.min(100, Math.round(avgHeartRate * 0.8));
    const fatigueLevel = Math.min(100, Math.round(exerciseLoad * 0.7));
    const exerciseLoadText = this.getLoadText(exerciseLoad);
    const fatigueLevelText = this.getFatigueText(fatigueLevel);
    
    // 计算恢复程度
    const recoveryLevel = this.calculateRecoveryLevel(heartRates, bloodOxygen);
    const recoveryLevelText = this.getRecoveryText(recoveryLevel);
    
    // 计算活动天数
    const uniqueDays = new Set(deviceData.map(data => data.timestamp ? data.timestamp.split('T')[0] : null).filter(Boolean));
    const activeDays = uniqueDays.size;
    
    // 计算健康得分和等级
    const healthScore = this.calculateHealthScore(avgHeartRate, avgBloodOxygen, avgSteps, recoveryLevel);
    const healthGrade = this.getHealthGrade(healthScore);
    
    // 生成详细建议
    const suggestions = this.generateDetailedSuggestions(avgHeartRate, avgBloodOxygen, avgSteps, exerciseLoad, fatigueLevel, recoveryLevel, activeDays);
    
    // 识别健康风险
    const healthRisks = this.identifyHealthRisks(avgHeartRate, avgBloodOxygen, avgBodyTemperature);
    
    // 计算每日统计数据
    // 保留有效的时间戳和对应的数据
    const validData = deviceData.filter(data => 
      data.timestamp && 
      (data.heart_rate || data.steps || data.blood_oxygen || data.body_temperature)
    );
    const dailyStats = validData.reduce((acc, data) => {
      const date = data.timestamp.split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          heartRate: [],
          steps: [],
          bloodOxygen: [],
          bodyTemperature: []
        };
      }
      if (data.heart_rate) acc[date].heartRate.push(data.heart_rate);
      if (data.steps) acc[date].steps.push(data.steps);
      if (data.blood_oxygen) acc[date].bloodOxygen.push(data.blood_oxygen);
      if (data.body_temperature) acc[date].bodyTemperature.push(data.body_temperature);
      return acc;
    }, {});
    // 计算每日平均值和总和
    Object.keys(dailyStats).forEach(date => {
      const day = dailyStats[date];
      day.heartRate = { 
        average: day.heartRate.length > 0 ? day.heartRate.reduce((sum, val) => sum + val, 0) / day.heartRate.length : 0,
        total: 0 // 心率没有总和的概念
      };
      day.steps = { 
        total: day.steps.length > 0 ? day.steps.reduce((sum, val) => sum + val, 0) : 0,
        average: day.steps.length > 0 ? day.steps.reduce((sum, val) => sum + val, 0) / day.steps.length : 0
      };
      day.bloodOxygen = { 
        average: day.bloodOxygen.length > 0 ? day.bloodOxygen.reduce((sum, val) => sum + val, 0) / day.bloodOxygen.length : 0,
        total: 0 // 血氧没有总和的概念
      };
      day.bodyTemperature = { 
        average: day.bodyTemperature.length > 0 ? day.bodyTemperature.reduce((sum, val) => sum + val, 0) / day.bodyTemperature.length : 0,
        total: 0 // 体温没有总和的概念
      };
    });
    
    // 生成最佳运动时间建议
    const hourlyData = {};
    deviceData.forEach(data => {
      if (data.timestamp && data.heart_rate) {
        const hour = new Date(data.timestamp).getHours();
        if (!hourlyData[hour]) {
          hourlyData[hour] = { count: 0, totalHeartRate: 0 };
        }
        hourlyData[hour].count++;
        hourlyData[hour].totalHeartRate += data.heart_rate;
      }
    });
    
    let bestExerciseTime = null;
    let lowestAverageHeartRate = Infinity;
    
    Object.keys(hourlyData).forEach(hour => {
      const avgHr = hourlyData[hour].totalHeartRate / hourlyData[hour].count;
      if (avgHr < lowestAverageHeartRate) {
        lowestAverageHeartRate = avgHr;
        bestExerciseTime = `${hour}:00-${parseInt(hour) + 1}:00`;
      }
    });
    
    return {
      period: {
        start: deviceData[deviceData.length - 1]?.timestamp,
        end: deviceData[0]?.timestamp,
        days: activeDays
      },
      healthMetrics: {
        heartRate: { average: avgHeartRate, max: maxHeartRate, min: minHeartRate, status: heartRateStatus },
        steps: { total: totalSteps, average: avgSteps, status: stepsStatus },
        bloodOxygen: { average: avgBloodOxygen, status: bloodOxygenStatus },
        bodyTemperature: { average: avgBodyTemperature, status: bodyTemperatureStatus }
      },
      exerciseMetrics: {
        exerciseLoad,
        exerciseLoadText,
        recoveryLevel,
        recoveryLevelText
      },
      healthScore: {
        score: healthScore,
        grade: healthGrade
      },
      dailyStats: dailyStats,
      healthRisks,
      bestExerciseTime,
      suggestions
    };
  }

  // 辅助方法：计算每日统计数据
  static calculateDailyStats(values, timestamps) {
    const dailyData = {};
    values.forEach((value, index) => {
      if (value && timestamps[index]) {
        const date = timestamps[index].split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = [];
        }
        dailyData[date].push(value);
      }
    });
    
    const dailyStats = {};
    Object.keys(dailyData).forEach(date => {
      const dayValues = dailyData[date];
      dailyStats[date] = {
        total: dayValues.reduce((sum, val) => sum + val, 0),
        average: dayValues.reduce((sum, val) => sum + val, 0) / dayValues.length
      };
    });
    
    return dailyStats;
  }
  
  // 辅助方法：计算恢复程度
  static calculateRecoveryLevel(heartRates, bloodOxygen) {
    if (heartRates.length < 2 || bloodOxygen.length < 2) return 50;
    
    const heartRateTrend = heartRates[heartRates.length - 1] - heartRates[0];
    const bloodOxygenTrend = bloodOxygen[bloodOxygen.length - 1] - bloodOxygen[0];
    
    // 心率下降，血氧上升表示恢复良好
    const recoveryScore = 50 - heartRateTrend * 2 + bloodOxygenTrend * 10;
    return Math.max(0, Math.min(100, recoveryScore));
  }
  
  // 辅助方法：计算健康得分
  static calculateHealthScore(avgHeartRate, avgBloodOxygen, avgSteps, recoveryLevel) {
    let score = 100;
    
    // 心率得分（60-100为正常）
    if (avgHeartRate < 60) score -= (60 - avgHeartRate) * 2;
    if (avgHeartRate > 100) score -= (avgHeartRate - 100) * 2;
    
    // 血氧得分（95-100为正常）
    if (avgBloodOxygen < 95) score -= (95 - avgBloodOxygen) * 5;
    if (avgBloodOxygen > 100) score -= (avgBloodOxygen - 100) * 2;
    
    // 步数得分（6000-10000为正常）
    if (avgSteps < 6000) score -= (6000 - avgSteps) / 100;
    if (avgSteps > 15000) score -= (avgSteps - 15000) / 200;
    
    // 恢复程度得分
    score += (recoveryLevel - 50) * 0.2;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  
  // 辅助方法：生成详细建议
  static generateDetailedSuggestions(avgHeartRate, avgBloodOxygen, avgSteps, exerciseLoad, fatigueLevel, recoveryLevel, activeDays) {
    const suggestions = [];
    
    // 心率建议
    if (avgHeartRate > 90) {
      suggestions.push('心率偏高，建议适当休息，避免剧烈运动，可选择瑜伽、散步等低强度运动');
    } else if (avgHeartRate < 60 && avgHeartRate > 40) {
      suggestions.push('心率偏低，若没有不适症状属正常现象，运动员群体常见');
    } else if (avgHeartRate <= 40) {
      suggestions.push('心率过低，建议咨询医生，排除心脏疾病风险');
    }
    
    // 血氧建议
    if (avgBloodOxygen < 95) {
      suggestions.push('血氧饱和度偏低，建议增加有氧运动，如慢跑、游泳，提高心肺功能');
      suggestions.push('保持室内通风，避免长时间处于封闭环境中');
    }
    
    // 步数建议
    if (avgSteps < 6000) {
      suggestions.push('日均步数不足，建议每天增加30分钟散步时间，或使用楼梯代替电梯');
      suggestions.push('可尝试使用计步器或运动APP，设定每日目标并逐步增加');
    } else if (avgSteps > 15000) {
      suggestions.push('日均步数较多，注意保护膝盖和关节，运动后可进行拉伸放松');
    }
    
    // 运动负荷建议
    if (exerciseLoad > 80) {
      suggestions.push('运动负荷过高，建议适当降低运动强度，避免过度训练导致疲劳积累');
    } else if (exerciseLoad < 30) {
      suggestions.push('运动负荷较低，可适当增加运动强度和时长，提高身体素质');
    }
    
    // 疲劳度建议
    if (fatigueLevel > 70) {
      suggestions.push('疲劳度较高，建议增加休息时间，保证7-8小时充足睡眠');
      suggestions.push('可尝试冥想、深呼吸等放松技巧，帮助身体恢复');
    }
    
    // 恢复程度建议
    if (recoveryLevel < 40) {
      suggestions.push('恢复程度较差，建议减少高强度训练，增加恢复性训练如瑜伽、普拉提');
    }
    
    // 运动频率建议
    if (activeDays < 3) {
      suggestions.push('运动频率不足，建议每周至少进行3-5次中等强度运动，每次30分钟以上');
    }
    
    // 默认建议
    if (suggestions.length === 0) {
      suggestions.push('各项指标正常，继续保持良好的生活习惯和运动规律');
      suggestions.push('建议定期监测健康数据，保持均衡饮食和充足睡眠');
    }
    
    return suggestions;
  }
  
  // 辅助方法：识别健康风险
  static identifyHealthRisks(avgHeartRate, avgBloodOxygen, avgBodyTemperature) {
    const risks = [];
    
    if (avgHeartRate > 100) {
      risks.push({ type: '心率异常', level: '高', description: '静息心率持续高于100次/分钟，可能存在心脏疾病风险' });
    } else if (avgHeartRate < 50) {
      risks.push({ type: '心率异常', level: '中', description: '静息心率持续低于50次/分钟，建议咨询医生' });
    }
    
    if (avgBloodOxygen < 90) {
      risks.push({ type: '血氧不足', level: '高', description: '血氧饱和度持续低于90%，可能存在呼吸系统问题' });
    } else if (avgBloodOxygen < 95) {
      risks.push({ type: '血氧不足', level: '中', description: '血氧饱和度略低，建议增加有氧运动' });
    }
    
    if (avgBodyTemperature > 37.5) {
      risks.push({ type: '体温异常', level: '中', description: '体温持续偏高，可能存在感染风险' });
    } else if (avgBodyTemperature < 35.5) {
      risks.push({ type: '体温异常', level: '中', description: '体温持续偏低，注意保暖和能量摄入' });
    }
    
    return risks;
  }
  
  // 辅助方法：获取健康状态
  static getHealthStatus(value, minNormal, maxNormal) {
    if (value < minNormal) return '偏低';
    if (value > maxNormal) return '偏高';
    return '正常';
  }
  
  // 辅助方法：获取负荷文本
  static getLoadText(load) {
    if (load < 30) return '低';
    if (load < 60) return '中';
    if (load < 80) return '高';
    return '极高';
  }
  
  // 辅助方法：获取疲劳度文本
  static getFatigueText(fatigue) {
    if (fatigue < 30) return '低';
    if (fatigue < 60) return '中';
    if (fatigue < 80) return '高';
    return '极高';
  }
  
  // 辅助方法：获取恢复程度文本
  static getRecoveryText(recovery) {
    if (recovery < 40) return '差';
    if (recovery < 70) return '一般';
    if (recovery < 90) return '良好';
    return '优秀';
  }
  
  // 辅助方法：获取健康等级
  static getHealthGrade(score) {
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 70) return '一般';
    if (score >= 60) return '及格';
    return '需改善';
  }
  
  // 获取所有设备数据（管理员用）
  static async getAllDeviceData(req, res) {
    try {
      const { page = 1, limit = 50, deviceId, startTime, endTime } = req.query;
      const offset = (page - 1) * limit;
      
      const pool = require('../index').pool;
      if (!pool) {
        return res.status(500).json({ message: '数据库连接池未就绪' });
      }
      
      // 构建查询条件
      let whereClause = 'WHERE 1=1';
      const params = [];
      
      if (deviceId) {
        whereClause += ' AND device_id LIKE ?';
        params.push(`%${deviceId}%`);
      }
      
      if (startTime) {
        whereClause += ' AND record_time >= ?';
        params.push(startTime);
      }
      
      if (endTime) {
        whereClause += ' AND record_time <= ?';
        params.push(endTime);
      }
      
      // 查询数据
      const [rows] = await pool.execute(
        `SELECT * FROM device_data ${whereClause} ORDER BY record_time DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );
      
      // 查询总数
      const [countRows] = await pool.execute(
        `SELECT COUNT(*) as total FROM device_data ${whereClause}`,
        params
      );
      
      const total = countRows[0].total;
      
      // 格式化数据
      const formattedData = rows.map(row => ({
        id: row.id,
        device_id: row.device_id,
        student_id: row.student_id,
        heart_rate: row.heart_rate,
        steps: row.steps,
        blood_oxygen: row.blood_oxygen,
        body_temperature: row.body_temperature,
        blood_pressure_systolic: row.blood_pressure_systolic,
        blood_pressure_diastolic: row.blood_pressure_diastolic,
        blood_sugar: row.blood_sugar,
        fatigue_level: row.fatigue_level,
        exercise_load: row.exercise_load,
        aerobic_stress: row.aerobic_stress,
        anaerobic_stress: row.anaerobic_stress,
        recovery_level: row.recovery_level,
        record_time: row.record_time,
        created_at: row.created_at
      }));
      
      res.json({
        success: true,
        data: formattedData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('获取所有设备数据失败:', error);
      res.status(500).json({ message: '获取设备数据失败', error: error.message });
    }
  }

  // 获取设备数据统计信息
  static async getDeviceDataStats(req, res) {
    try {
      const pool = require('../index').pool;
      if (!pool) {
        return res.status(500).json({ message: '数据库连接池未就绪' });
      }
      
      // 查询总记录数
      const [totalRows] = await pool.execute('SELECT COUNT(*) as total FROM device_data');
      const totalRecords = totalRows[0].total;
      
      // 查询设备数量
      const [deviceRows] = await pool.execute('SELECT COUNT(DISTINCT device_id) as device_count FROM device_data');
      const deviceCount = deviceRows[0].device_count;
      
      // 查询最新记录时间
      const [latestRows] = await pool.execute('SELECT MAX(record_time) as latest_time FROM device_data');
      const latestTime = latestRows[0].latest_time;
      
      // 查询最早记录时间
      const [earliestRows] = await pool.execute('SELECT MIN(record_time) as earliest_time FROM device_data');
      const earliestTime = earliestRows[0].earliest_time;
      
      // 查询数据分布
      const [distributionRows] = await pool.execute(`
        SELECT 
          DATE(record_time) as date,
          COUNT(*) as count
        FROM device_data
        GROUP BY DATE(record_time)
        ORDER BY date DESC
        LIMIT 30
      `);
      
      res.json({
        success: true,
        stats: {
          totalRecords,
          deviceCount,
          latestTime,
          earliestTime,
          dataDistribution: distributionRows
        }
      });
    } catch (error) {
      console.error('获取设备数据统计失败:', error);
      res.status(500).json({ message: '获取设备数据统计失败', error: error.message });
    }
  }
}

module.exports = DeviceDataController;