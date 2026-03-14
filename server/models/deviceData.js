// 使用模拟数据替代数据库和Redis连接

// 生成模拟的设备数据
function generateMockDeviceData(deviceId, startDate, endDate, numRecords = 100) {
  const data = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const interval = Math.floor((end - start) / numRecords);

  for (let i = 0; i < numRecords; i++) {
    const timestamp = new Date(start.getTime() + i * interval);
    
    // 生成随机的健康数据
    const heartRate = Math.floor(Math.random() * 40) + 70; // 70-110
    const steps = Math.floor(Math.random() * 1000) + 500; // 500-1500
    const bloodOxygen = Math.floor(Math.random() * 5) + 95; // 95-100
    const bodyTemperature = (Math.random() * 0.5 + 36.5).toFixed(1); // 36.5-37.0

    data.push({
      id: i + 1,
      device_id: deviceId,
      heart_rate: heartRate,
      steps: steps,
      blood_oxygen: bloodOxygen,
      body_temperature: parseFloat(bodyTemperature),
      blood_pressure: JSON.stringify({ systolic: Math.floor(Math.random() * 20) + 110, diastolic: Math.floor(Math.random() * 20) + 70 }),
      blood_sugar: (Math.random() * 1.5 + 4.5).toFixed(1),
      timestamp: timestamp.toISOString()
    });
  }

  return data;
}

// 模拟设备数据
const mockDeviceData = {
  device_001: generateMockDeviceData('device_001', '2025-12-01T00:00:00Z', '2025-12-15T23:59:59Z', 150),
  device_002: generateMockDeviceData('device_002', '2025-12-01T00:00:00Z', '2025-12-15T23:59:59Z', 150)
};

// 模拟用户设备映射
const mockUserDeviceMap = {
  1: 'device_001',
  2: 'device_002'
};

class DeviceData {
  // 获取设备实时数据
  static async getDeviceRealtimeData(deviceId) {
    const deviceData = mockDeviceData[deviceId] || [];
    return deviceData[deviceData.length - 1] || null;
  }

  // 获取设备历史数据
  static async getDeviceHistoryData(deviceId, startTime, endTime, limit = 100) {
    const deviceData = mockDeviceData[deviceId] || [];
    return deviceData
      .filter(data => data.timestamp >= startTime && data.timestamp <= endTime)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  // 获取用户的设备数据
  static async getUserDeviceData(userId, startTime, endTime, limit = 100) {
    try {
      const deviceId = mockUserDeviceMap[userId];
      if (deviceId) {
        const data = await this.getDeviceHistoryData(deviceId, startTime, endTime, limit);
        if (data && data.length > 0) {
          return data;
        }
      }
      
      // 如果没有设备或设备数据为空，生成模拟数据
      return this.generateMockDeviceData(userId, startTime, endTime, limit);
    } catch (error) {
      console.error('Error getting user device data:', error);
      // 出错时返回模拟数据
      return this.generateMockDeviceData(userId, startTime, endTime, limit);
    }
  }
  
  // 生成模拟设备数据
  static generateMockDeviceData(userId, startTime, endTime, limit = 100) {
    const mockData = [];
    const start = new Date(startTime);
    const end = new Date(endTime);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    // 每天生成3-5条数据
    for (let i = 0; i < days && mockData.length < limit; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dataCount = Math.floor(Math.random() * 3) + 3;
      
      for (let j = 0; j < dataCount && mockData.length < limit; j++) {
        // 随机时间点
        const timestamp = new Date(date);
        timestamp.setHours(Math.floor(Math.random() * 24));
        timestamp.setMinutes(Math.floor(Math.random() * 60));
        timestamp.setSeconds(Math.floor(Math.random() * 60));
        
        // 生成随机健康数据
        mockData.push({
          id: mockData.length + 1,
          device_id: `DEV${userId}`,
          heart_rate: Math.floor(Math.random() * 30) + 65, // 65-95
          steps: Math.floor(Math.random() * 5000) + 2000, // 2000-7000
          blood_oxygen: Math.floor(Math.random() * 5) + 95, // 95-100
          body_temperature: (Math.random() * 1.2 + 36.0).toFixed(1), // 36.0-37.2
          blood_pressure: JSON.stringify({ systolic: Math.floor(Math.random() * 20) + 110, diastolic: Math.floor(Math.random() * 15) + 70 }),
          blood_sugar: (Math.random() * 2.0 + 4.0).toFixed(1), // 4.0-6.0
          timestamp: timestamp.toISOString()
        });
      }
    }
    
    return mockData;
  }

  // 保存设备数据
  static async saveDeviceData(deviceId, data) {
    const newData = {
      id: (mockDeviceData[deviceId]?.length || 0) + 1,
      device_id: deviceId,
      heart_rate: data.heartRate,
      steps: data.steps,
      blood_oxygen: data.bloodOxygen,
      body_temperature: data.bodyTemperature,
      blood_pressure: JSON.stringify(data.bloodPressure),
      blood_sugar: data.bloodSugar,
      timestamp: new Date().toISOString()
    };

    if (!mockDeviceData[deviceId]) {
      mockDeviceData[deviceId] = [];
    }

    mockDeviceData[deviceId].push(newData);
    return { insertId: newData.id };
  }

  // 获取班级设备数据
  static async getClassDeviceData(className, startTime, endTime, limit = 100) {
    // 简单模拟，返回所有学生设备数据
    return Object.values(mockDeviceData)
      .flat()
      .filter(data => data.timestamp >= startTime && data.timestamp <= endTime)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }
}

module.exports = DeviceData;