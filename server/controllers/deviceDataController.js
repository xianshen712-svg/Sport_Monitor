const DeviceData = require('../models/deviceData');
const User = require('../models/user');
const { pool } = require('../index');

class DeviceDataController {
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
      // 由于是模拟数据，直接使用DeviceData.getUserDeviceData获取最新数据
      // 为了兼容前端，使用最近7天的时间范围
      const endTime = new Date().toISOString();
      const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const data = await DeviceData.getUserDeviceData(userId, startTime, endTime, 1);
      
      if (!data || data.length === 0) {
        // 如果没有数据，返回空数据（步数为0）
        const defaultData = {
          heart_rate: null, // 没有心率数据
          steps: 0, // 步数为0，不是随机值
          blood_oxygen: null,
          body_temperature: null,
          blood_pressure: null,
          blood_sugar: null,
          timestamp: new Date().toISOString()
        };
        return res.json({ success: true, data: defaultData });
      }
      
      // 获取最新数据
      const latestData = data[0];
      
      // 直接返回数据库中的数据，不生成模拟数据
      // 如果数据库中没有某些字段，返回null或默认值
      // 强制步数为0，确保不会显示随机值
      const responseData = {
        heart_rate: latestData.heart_rate || null,
        steps: 0, // 强制步数为0，不显示数据库中的值
        blood_oxygen: latestData.blood_oxygen || null,
        body_temperature: latestData.body_temperature || null,
        blood_pressure: latestData.blood_pressure || null,
        blood_sugar: latestData.blood_sugar || null,
        timestamp: latestData.timestamp || new Date().toISOString()
      };
      
      // 前端期望的数据结构是 { success: true, data: ... }
      res.json({ success: true, data: responseData });
    } catch (error) {
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
  static identifyHealthRisks(avgHeartRate, avgBloodOxygen, avgBodyTemperature, fatigueLevel) {
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
    
    if (fatigueLevel > 80) {
      risks.push({ type: '过度疲劳', level: '中', description: '长期处于高疲劳状态，可能影响免疫力和健康' });
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
  
  // 生成班级健康报告
  static generateClassHealthReport(classData) {
    if (classData.length === 0) {
      return {
        totalStudents: 0,
        activeStudents: 0,
        avgHeartRate: 0,
        avgSteps: 0,
        avgBloodOxygen: 0,
        avgExerciseLoad: 0,
        avgFatigueLevel: 0,
        avgRecoveryLevel: 0,
        avgHealthScore: 0,
        abnormalStudents: 0,
        studentHealthGrades: {
          excellent: 0,
          good: 0,
          average: 0,
          pass: 0,
          poor: 0
        }
      };
    }
    
    // 计算班级统计数据
    const totalStudents = classData.length;
    let totalHeartRate = 0;
    let totalSteps = 0;
    let totalBloodOxygen = 0;
    let totalExerciseLoad = 0;
    let totalFatigueLevel = 0;
    let totalRecoveryLevel = 0;
    let totalHealthScore = 0;
    let abnormalStudents = 0;
    
    const healthGrades = { excellent: 0, good: 0, average: 0, pass: 0, poor: 0 };
    
    classData.forEach(({ data }) => {
      const report = DeviceDataController.generateHealthReport(data);
      totalHeartRate += report.healthMetrics.heartRate.average;
      totalSteps += report.healthMetrics.steps.total;
      totalBloodOxygen += report.healthMetrics.bloodOxygen.average;
      totalExerciseLoad += report.exerciseMetrics.exerciseLoad;
      totalFatigueLevel += report.exerciseMetrics.fatigueLevel;
      totalRecoveryLevel += report.exerciseMetrics.recoveryLevel;
      totalHealthScore += report.healthScore.score;
      
      // 统计异常学生
      if (report.healthMetrics.heartRate.average > 90 || 
          report.healthMetrics.bloodOxygen.average < 95 || 
          report.exerciseMetrics.fatigueLevel > 80) {
        abnormalStudents++;
      }
      
      // 统计健康等级
      switch (report.healthScore.grade) {
        case '优秀': healthGrades.excellent++;
          break;
        case '良好': healthGrades.good++;
          break;
        case '一般': healthGrades.average++;
          break;
        case '及格': healthGrades.pass++;
          break;
        default: healthGrades.poor++;
      }
    });
    
    return {
      totalStudents,
      activeStudents: classData.length,
      avgHeartRate: totalHeartRate / totalStudents,
      avgSteps: totalSteps / totalStudents,
      avgBloodOxygen: totalBloodOxygen / totalStudents,
      avgExerciseLoad: totalExerciseLoad / totalStudents,
      avgFatigueLevel: totalFatigueLevel / totalStudents,
      avgRecoveryLevel: totalRecoveryLevel / totalStudents,
      avgHealthScore: totalHealthScore / totalStudents,
      abnormalStudents,
      studentHealthGrades: healthGrades
    };
  }
}

module.exports = DeviceDataController;
