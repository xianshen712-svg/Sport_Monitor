// 预警服务 - 处理预警规则、触发条件和通知管理

// 预警级别定义
export const ALERT_LEVELS = {
  INFO: 1,      // 提示
  WARNING: 2,   // 警告
  CRITICAL: 3   // 严重
};

// 预警类型定义
export const ALERT_TYPES = {
  HEART_RATE: 'heart_rate',         // 心率异常
  BLOOD_OXYGEN: 'blood_oxygen',     // 血氧异常
  BODY_TEMPERATURE: 'body_temperature', // 体温异常
  FATIGUE_LEVEL: 'fatigue_level',   // 疲劳度异常
  DEVICE_OFFLINE: 'device_offline', // 设备离线
  LOW_BATTERY: 'low_battery',       // 设备低电量
  DATA_ABNORMAL: 'data_abnormal'    // 数据异常
};

// 预警规则配置
const ALERT_RULES = {
  [ALERT_TYPES.HEART_RATE]: {
    warning: { min: 100, max: 160 },
    critical: { min: 60, max: 180 }
  },
  [ALERT_TYPES.BLOOD_OXYGEN]: {
    warning: { min: 95, max: 100 },
    critical: { min: 90, max: 100 }
  },
  [ALERT_TYPES.BODY_TEMPERATURE]: {
    warning: { min: 37.1, max: 37.5 },
    critical: { min: 37.6, max: 42 }
  },
  [ALERT_TYPES.FATIGUE_LEVEL]: {
    warning: { min: 60, max: 80 },
    critical: { min: 80, max: 100 }
  },
  [ALERT_TYPES.LOW_BATTERY]: {
    warning: { min: 0, max: 30 },
    critical: { min: 0, max: 10 }
  }
};

// 预警消息模板
const ALERT_TEMPLATES = {
  [ALERT_TYPES.HEART_RATE]: {
    warning: (studentName, value) => `${studentName}的心率为${value}次/分，超出正常范围，请关注！`,
    critical: (studentName, value) => `${studentName}的心率为${value}次/分，严重异常，需要立即处理！`
  },
  [ALERT_TYPES.BLOOD_OXYGEN]: {
    warning: (studentName, value) => `${studentName}的血氧饱和度为${value}%，低于正常水平，请关注！`,
    critical: (studentName, value) => `${studentName}的血氧饱和度为${value}%，严重偏低，需要立即处理！`
  },
  [ALERT_TYPES.BODY_TEMPERATURE]: {
    warning: (studentName, value) => `${studentName}的体温为${value}℃，超出正常范围，请关注！`,
    critical: (studentName, value) => `${studentName}的体温为${value}℃，发热，需要立即处理！`
  },
  [ALERT_TYPES.FATIGUE_LEVEL]: {
    warning: (studentName, value) => `${studentName}的疲劳度为${value}%，处于疲劳状态，请适当休息！`,
    critical: (studentName, value) => `${studentName}的疲劳度为${value}%，严重疲劳，建议停止训练！`
  },
  [ALERT_TYPES.DEVICE_OFFLINE]: {
    warning: (studentName, deviceId) => `${studentName}的设备（${deviceId}）已离线，请检查设备连接！`,
    critical: (studentName, deviceId) => `${studentName}的设备（${deviceId}）长时间离线，无法监测健康数据！`
  },
  [ALERT_TYPES.LOW_BATTERY]: {
    warning: (studentName, deviceId, battery) => `${studentName}的设备（${deviceId}）电量为${battery}%，请及时充电！`,
    critical: (studentName, deviceId, battery) => `${studentName}的设备（${deviceId}）电量仅为${battery}%，即将关机！`
  },
  [ALERT_TYPES.DATA_ABNORMAL]: {
    warning: (studentName, type) => `${studentName}的${type}数据异常，请检查设备或重新测量！`,
    critical: (studentName, type) => `${studentName}的${type}数据严重异常，无法正常监测！`
  }
};

// 预警服务类
export default class AlertService {
  constructor() {
    this.alerts = [];
    this.alertHistory = [];
    this.listeners = [];
    this.ruleConfig = ALERT_RULES;
  }

  // 注册预警监听器
  registerListener(listener) {
    this.listeners.push(listener);
  }

  // 移除预警监听器
  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  // 触发预警通知
  notifyListeners(alert) {
    this.listeners.forEach(listener => {
      if (typeof listener === 'function') {
        listener(alert);
      }
    });
  }

  // 检查单个指标是否触发预警
  checkSingleMetric(type, value, studentInfo = {}) {
    const rules = this.ruleConfig[type];
    if (!rules) return null;

    let level = null;
    let message = '';

    // 检查是否触发严重预警
    if ((rules.critical.min && value < rules.critical.min) || 
        (rules.critical.max && value > rules.critical.max)) {
      level = ALERT_LEVELS.CRITICAL;
      message = ALERT_TEMPLATES[type].critical(
        studentInfo.name || '未知学生', 
        value, 
        studentInfo.deviceId
      );
    }
    // 检查是否触发警告
    else if ((rules.warning.min && value < rules.warning.min) || 
               (rules.warning.max && value > rules.warning.max)) {
      level = ALERT_LEVELS.WARNING;
      message = ALERT_TEMPLATES[type].warning(
        studentInfo.name || '未知学生', 
        value, 
        studentInfo.deviceId
      );
    }

    if (level) {
      const alert = this.createAlert({
        type,
        level,
        message,
        value,
        studentInfo
      });
      return alert;
    }

    return null;
  }

  // 检查学生健康数据是否触发预警
  checkStudentHealthData(studentData) {
    const alerts = [];

    // 检查心率
    if (studentData.heartRate) {
      const alert = this.checkSingleMetric(
        ALERT_TYPES.HEART_RATE, 
        studentData.heartRate, 
        studentData
      );
      if (alert) alerts.push(alert);
    }

    // 检查血氧
    if (studentData.bloodOxygen) {
      const alert = this.checkSingleMetric(
        ALERT_TYPES.BLOOD_OXYGEN, 
        studentData.bloodOxygen, 
        studentData
      );
      if (alert) alerts.push(alert);
    }

    // 检查体温
    if (studentData.bodyTemperature) {
      const alert = this.checkSingleMetric(
        ALERT_TYPES.BODY_TEMPERATURE, 
        studentData.bodyTemperature, 
        studentData
      );
      if (alert) alerts.push(alert);
    }

    // 检查疲劳度
    if (studentData.fatigueLevel) {
      const alert = this.checkSingleMetric(
        ALERT_TYPES.FATIGUE_LEVEL, 
        studentData.fatigueLevel, 
        studentData
      );
      if (alert) alerts.push(alert);
    }

    // 检查设备状态
    if (studentData.deviceStatus === 'offline') {
      const alert = this.createAlert({
        type: ALERT_TYPES.DEVICE_OFFLINE,
        level: ALERT_LEVELS.WARNING,
        message: ALERT_TEMPLATES[ALERT_TYPES.DEVICE_OFFLINE].warning(
          studentData.name, 
          studentData.deviceId
        ),
        studentInfo: studentData
      });
      alerts.push(alert);
    }

    // 检查设备电量
    if (studentData.battery && studentData.battery < 30) {
      const alert = this.checkSingleMetric(
        ALERT_TYPES.LOW_BATTERY, 
        studentData.battery, 
        studentData
      );
      if (alert) alerts.push(alert);
    }

    // 处理触发的预警
    alerts.forEach(alert => {
      this.addAlert(alert);
    });

    return alerts;
  }

  // 创建预警对象
  createAlert(alertData) {
    const now = new Date();
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: alertData.type,
      level: alertData.level,
      message: alertData.message,
      value: alertData.value,
      studentInfo: alertData.studentInfo || {},
      time: now.toISOString(),
      formattedTime: now.toLocaleString('zh-CN'),
      handled: false,
      handledBy: null,
      handledTime: null
    };
  }

  // 添加预警
  addAlert(alert) {
    // 检查是否已存在相同的未处理预警
    const existingAlert = this.alerts.find(
      a => a.type === alert.type && 
           ((a.studentInfo && a.studentInfo.studentId) === (alert.studentInfo && alert.studentInfo.studentId)) && 
           !a.handled
    );

    if (!existingAlert) {
      this.alerts.unshift(alert);
      this.notifyListeners(alert);
    }
  }

  // 处理预警
  handleAlert(alertId, handledBy = null) {
    const alertIndex = this.alerts.findIndex(a => a.id === alertId);
    if (alertIndex !== -1) {
      const alert = this.alerts[alertIndex];
      alert.handled = true;
      alert.handledBy = handledBy;
      alert.handledTime = new Date().toISOString();
      
      // 将处理后的预警移到历史记录
      this.alerts.splice(alertIndex, 1);
      this.alertHistory.unshift(alert);
      
      return true;
    }
    return false;
  }

  // 批量处理预警
  handleAlerts(alertIds, handledBy = null) {
    return alertIds.map(id => this.handleAlert(id, handledBy));
  }

  // 获取所有未处理预警
  getActiveAlerts() {
    return this.alerts;
  }

  // 获取预警历史
  getAlertHistory(limit = 50) {
    return this.alertHistory.slice(0, limit);
  }

  // 根据级别获取预警
  getAlertsByLevel(level) {
    return this.alerts.filter(alert => alert.level === level);
  }

  // 根据类型获取预警
  getAlertsByType(type) {
    return this.alerts.filter(alert => alert.type === type);
  }

  // 根据学生ID获取预警
  getAlertsByStudentId(studentId) {
    return this.alerts.filter(alert => alert.studentInfo && alert.studentInfo.studentId === studentId);
  }

  // 更新预警规则
  updateRule(type, thresholds) {
    if (this.ruleConfig[type]) {
      this.ruleConfig[type] = { ...this.ruleConfig[type], ...thresholds };
      return true;
    }
    return false;
  }

  // 获取预警规则
  getRules() {
    return { ...this.ruleConfig };
  }

  // 清除所有预警
  clearAllAlerts() {
    this.alerts = [];
  }

  // 导出预警数据
  exportAlertsData() {
    const allAlerts = [...this.alerts, ...this.alertHistory];
    return allAlerts.map(alert => ({
      id: alert.id,
      类型: Object.keys(ALERT_TYPES).find(key => ALERT_TYPES[key] === alert.type) || alert.type,
      级别: alert.level === ALERT_LEVELS.CRITICAL ? '严重' : alert.level === ALERT_LEVELS.WARNING ? '警告' : '提示',
      消息: alert.message,
      学生姓名: alert.studentInfo.name || '未知',
      学生ID: alert.studentInfo.studentId || '未知',
      设备ID: alert.studentInfo.deviceId || '未知',
      数值: alert.value || 'N/A',
      时间: alert.formattedTime,
      处理状态: alert.handled ? '已处理' : '未处理',
      处理人: alert.handledBy || 'N/A',
      处理时间: alert.handledTime ? new Date(alert.handledTime).toLocaleString('zh-CN') : 'N/A'
    }));
  }
}

// 创建全局预警服务实例
const alertService = new AlertService();
export { alertService };