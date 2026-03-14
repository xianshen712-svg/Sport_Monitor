// 数据质量控制模块

// 物理范围过滤配置
const PHYSICAL_RANGES = {
  heartRate: { min: 30, max: 220 }, // 心率范围（次/分钟）
  steps: { min: 0, max: 20000 }, // 步数范围（步）
  bloodOxygen: { min: 80, max: 100 }, // 血氧范围（%）
  bodyTemperature: { min: 35, max: 45 }, // 体温范围（℃）
  bloodPressureSystolic: { min: 50, max: 250 }, // 收缩压范围（mmHg）
  bloodPressureDiastolic: { min: 30, max: 150 }, // 舒张压范围（mmHg）
  bloodSugar: { min: 2, max: 20 } // 血糖范围（mmol/L）
};

// 滑动窗口数据缓存（每个设备一个窗口）
const slidingWindows = {};

// 物理范围过滤
function applyPhysicalRangeFilter(data) {
  const filteredData = { ...data };
  
  // 心率过滤
  if (data.heartRate < PHYSICAL_RANGES.heartRate.min || data.heartRate > PHYSICAL_RANGES.heartRate.max) {
    filteredData.heartRate = null;
  }
  
  // 步数过滤
  if (data.steps < PHYSICAL_RANGES.steps.min || data.steps > PHYSICAL_RANGES.steps.max) {
    filteredData.steps = null;
  }
  
  // 血氧过滤
  if (data.bloodOxygen < PHYSICAL_RANGES.bloodOxygen.min || data.bloodOxygen > PHYSICAL_RANGES.bloodOxygen.max) {
    filteredData.bloodOxygen = null;
  }
  
  // 体温过滤
  if (data.bodyTemperature < PHYSICAL_RANGES.bodyTemperature.min || data.bodyTemperature > PHYSICAL_RANGES.bodyTemperature.max) {
    filteredData.bodyTemperature = null;
  }
  
  // 血压过滤
  if (data.bloodPressure) {
    if (data.bloodPressure.systolic < PHYSICAL_RANGES.bloodPressureSystolic.min || 
        data.bloodPressure.systolic > PHYSICAL_RANGES.bloodPressureSystolic.max) {
      filteredData.bloodPressure.systolic = null;
    }
    
    if (data.bloodPressure.diastolic < PHYSICAL_RANGES.bloodPressureDiastolic.min || 
        data.bloodPressure.diastolic > PHYSICAL_RANGES.bloodPressureDiastolic.max) {
      filteredData.bloodPressure.diastolic = null;
    }
    
    // 如果收缩压或舒张压都无效，则整个血压数据无效
    if (filteredData.bloodPressure.systolic === null && filteredData.bloodPressure.diastolic === null) {
      filteredData.bloodPressure = null;
    }
  }
  
  // 血糖过滤
  if (data.bloodSugar < PHYSICAL_RANGES.bloodSugar.min || data.bloodSugar > PHYSICAL_RANGES.bloodSugar.max) {
    filteredData.bloodSugar = null;
  }
  
  return filteredData;
}

// 计算滑动平均值
function calculateSlidingAverage(deviceId, data) {
  // 初始化设备的滑动窗口
  if (!slidingWindows[deviceId]) {
    slidingWindows[deviceId] = {
      heartRate: [],
      steps: [],
      bloodOxygen: [],
      bodyTemperature: [],
      bloodPressureSystolic: [],
      bloodPressureDiastolic: [],
      bloodSugar: []
    };
  }
  
  const window = slidingWindows[deviceId];
  const windowSize = 3; // 3次采样滑动平均
  const averagedData = { ...data };
  
  // 心率滑动平均
  if (data.heartRate !== null) {
    window.heartRate.push(data.heartRate);
    if (window.heartRate.length > windowSize) window.heartRate.shift();
    if (window.heartRate.length === windowSize) {
      averagedData.heartRate = Math.round(window.heartRate.reduce((sum, val) => sum + val, 0) / windowSize);
    }
  }
  
  // 步数滑动平均
  if (data.steps !== null) {
    window.steps.push(data.steps);
    if (window.steps.length > windowSize) window.steps.shift();
    if (window.steps.length === windowSize) {
      averagedData.steps = Math.round(window.steps.reduce((sum, val) => sum + val, 0) / windowSize);
    }
  }
  
  // 血氧滑动平均
  if (data.bloodOxygen !== null) {
    window.bloodOxygen.push(data.bloodOxygen);
    if (window.bloodOxygen.length > windowSize) window.bloodOxygen.shift();
    if (window.bloodOxygen.length === windowSize) {
      averagedData.bloodOxygen = parseFloat((window.bloodOxygen.reduce((sum, val) => sum + val, 0) / windowSize).toFixed(1));
    }
  }
  
  // 体温滑动平均
  if (data.bodyTemperature !== null) {
    window.bodyTemperature.push(data.bodyTemperature);
    if (window.bodyTemperature.length > windowSize) window.bodyTemperature.shift();
    if (window.bodyTemperature.length === windowSize) {
      averagedData.bodyTemperature = parseFloat((window.bodyTemperature.reduce((sum, val) => sum + val, 0) / windowSize).toFixed(1));
    }
  }
  
  // 血压滑动平均
  if (data.bloodPressure) {
    if (data.bloodPressure.systolic !== null) {
      window.bloodPressureSystolic.push(data.bloodPressure.systolic);
      if (window.bloodPressureSystolic.length > windowSize) window.bloodPressureSystolic.shift();
      if (window.bloodPressureSystolic.length === windowSize) {
        averagedData.bloodPressure.systolic = Math.round(window.bloodPressureSystolic.reduce((sum, val) => sum + val, 0) / windowSize);
      }
    }
    
    if (data.bloodPressure.diastolic !== null) {
      window.bloodPressureDiastolic.push(data.bloodPressure.diastolic);
      if (window.bloodPressureDiastolic.length > windowSize) window.bloodPressureDiastolic.shift();
      if (window.bloodPressureDiastolic.length === windowSize) {
        averagedData.bloodPressure.diastolic = Math.round(window.bloodPressureDiastolic.reduce((sum, val) => sum + val, 0) / windowSize);
      }
    }
  }
  
  // 血糖滑动平均
  if (data.bloodSugar !== null) {
    window.bloodSugar.push(data.bloodSugar);
    if (window.bloodSugar.length > windowSize) window.bloodSugar.shift();
    if (window.bloodSugar.length === windowSize) {
      averagedData.bloodSugar = parseFloat((window.bloodSugar.reduce((sum, val) => sum + val, 0) / windowSize).toFixed(1));
    }
  }
  
  return averagedData;
}

// 数据质量控制主函数
function applyDataQualityControl(deviceId, rawData) {
  // 1. 应用物理范围过滤
  const filteredData = applyPhysicalRangeFilter(rawData);
  
  // 2. 计算滑动平均值
  const averagedData = calculateSlidingAverage(deviceId, filteredData);
  
  return averagedData;
}

module.exports = { applyDataQualityControl };