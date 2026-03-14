/**
 * 数据分析服务 - 处理数据分析相关的API请求和业务逻辑
 * @author Sport Monitor Team
 * @version 1.0.0
 */
import request from '../utils/request';
import { formatDate } from '../utils/DateUtils';

/**
 * 数据分析服务类
 */
class DataAnalysisService {
  /**
   * 获取用户健康数据分析
   * @param {Object} params - 请求参数
   * @param {string} params.dataType - 数据类型 (heartRate, steps, bloodOxygen, bodyTemperature)
   * @param {string} params.startDate - 开始日期 (YYYY-MM-DD)
   * @param {string} params.endDate - 结束日期 (YYYY-MM-DD)
   * @param {string} params.period - 统计周期 (day, week, month)
   * @returns {Promise<Object>} 分析结果
   */
  static async getHealthDataAnalysis(params) {
    try {
      const response = await request.get('/api/analysis/health-data', { params });
      return response.data;
    } catch (error) {
      console.error('获取健康数据分析失败:', error);
      throw new Error('获取健康数据分析失败，请稍后重试');
    }
  }

  /**
   * 获取统计指标
   * @param {Object} params - 请求参数
   * @param {string} params.dataType - 数据类型
   * @param {string} params.startDate - 开始日期
   * @param {string} params.endDate - 结束日期
   * @returns {Promise<Object>} 统计指标
   */
  static async getStatistics(params) {
    try {
      const response = await request.get('/api/analysis/statistics', { params });
      return response.data;
    } catch (error) {
      console.error('获取统计指标失败:', error);
      throw new Error('获取统计指标失败，请稍后重试');
    }
  }

  /**
   * 获取数据分布
   * @param {Object} params - 请求参数
   * @param {string} params.dataType - 数据类型
   * @param {string} params.startDate - 开始日期
   * @param {string} params.endDate - 结束日期
   * @param {number} params.bins - 分布区间数量
   * @returns {Promise<Object>} 数据分布
   */
  static async getDataDistribution(params) {
    try {
      const response = await request.get('/api/analysis/distribution', { params });
      return response.data;
    } catch (error) {
      console.error('获取数据分布失败:', error);
      throw new Error('获取数据分布失败，请稍后重试');
    }
  }

  /**
   * 获取用户运动报告
   * @param {Object} params - 请求参数
   * @returns {Promise<Object>} 用户运动报告
   */
  static async getUserExerciseReport(params) {
    try {
      const response = await request.get('/api/device-data/user/report', { params });
      return response.data;
    } catch (error) {
      console.error('获取用户运动报告失败:', error);
      throw new Error('获取用户运动报告失败，请稍后重试');
    }
  }


  /**
   * 导出分析数据
   * @param {Object} params - 请求参数
   * @param {string} params.dataType - 数据类型
   * @param {string} params.startDate - 开始日期
   * @param {string} params.endDate - 结束日期
   * @param {string} params.format - 导出格式 (excel, pdf, csv)
   * @returns {Promise<Blob>} 导出文件的Blob数据
   */
  static async exportAnalysisData(params) {
    try {
      const response = await request.get('/api/analysis/export', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('导出分析数据失败:', error);
      throw new Error('导出分析数据失败，请稍后重试');
    }
  }

  /**
   * 获取异常数据
   * @param {Object} params - 请求参数
   * @param {string} params.dataType - 数据类型
   * @param {string} params.startDate - 开始日期
   * @param {string} params.endDate - 结束日期
   * @returns {Promise<Object[]>} 异常数据列表
   */
  static async getAbnormalData(params) {
    try {
      const response = await request.get('/api/analysis/abnormal-data', { params });
      return response.data;
    } catch (error) {
      console.error('获取异常数据失败:', error);
      throw new Error('获取异常数据失败，请稍后重试');
    }
  }

  /**
   * 生成健康报告
   * @param {Object} params - 请求参数
   * @param {string} params.userId - 用户ID
   * @param {string} params.period - 报告周期
   * @returns {Promise<Object>} 健康报告
   */
  static async generateHealthReport(params) {
    try {
      const response = await request.post('/api/analysis/generate-report', params);
      return response.data;
    } catch (error) {
      console.error('生成健康报告失败:', error);
      throw new Error('生成健康报告失败，请稍后重试');
    }
  }

  /**
   * 计算数据趋势
   * @param {Array} data - 原始数据数组
   * @param {string} period - 统计周期
   * @returns {Object} 趋势分析结果
   */
  static calculateTrend(data, period = 'day') {
    if (!Array.isArray(data) || data.length === 0) {
      return { categories: [], values: [], trend: 'stable' };
    }

    // 按时间排序
    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    const categories = sortedData.map(item => formatDate(item.date, 'YYYY-MM-DD'));
    const values = sortedData.map(item => item.value);

    // 计算趋势
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    let trend = 'stable';
    
    if (lastValue > firstValue) {
      trend = 'increasing';
    } else if (lastValue < firstValue) {
      trend = 'decreasing';
    }

    return { categories, values, trend };
  }

  /**
   * 计算统计指标
   * @param {Array} values - 数值数组
   * @returns {Object} 统计指标
   */
  static calculateStatistics(values) {
    if (!Array.isArray(values) || values.length === 0) {
      return {
        totalCount: 0,
        average: 0,
        max: 0,
        min: 0,
        standardDeviation: 0,
        variance: 0,
        median: 0
      };
    }

    const numericValues = values.map(v => Number(v)).filter(v => !isNaN(v));
    const totalCount = numericValues.length;
    const sum = numericValues.reduce((acc, val) => acc + val, 0);
    const average = sum / totalCount;
    const max = Math.max(...numericValues);
    const min = Math.min(...numericValues);

    // 计算方差和标准差
    const variance = numericValues.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / totalCount;
    const standardDeviation = Math.sqrt(variance);

    // 计算中位数
    const sortedValues = [...numericValues].sort((a, b) => a - b);
    const medianIndex = Math.floor(sortedValues.length / 2);
    const median = sortedValues.length % 2 === 0 
      ? (sortedValues[medianIndex - 1] + sortedValues[medianIndex]) / 2 
      : sortedValues[medianIndex];

    return {
      totalCount,
      average: parseFloat(average.toFixed(2)),
      max,
      min,
      standardDeviation: parseFloat(standardDeviation.toFixed(2)),
      variance: parseFloat(variance.toFixed(2)),
      median: parseFloat(median.toFixed(2))
    };
  }

  /**
   * 检测异常值（使用Z-score方法）
   * @param {Array} values - 数值数组
   * @param {number} threshold - Z-score阈值
   * @returns {Array} 异常值索引数组
   */
  static detectOutliers(values, threshold = 2) {
    if (!Array.isArray(values) || values.length < 3) {
      return [];
    }

    const numericValues = values.map(v => Number(v)).filter(v => !isNaN(v));
    const stats = this.calculateStatistics(numericValues);
    const outliers = [];

    numericValues.forEach((value, index) => {
      const zScore = Math.abs((value - stats.average) / stats.standardDeviation);
      if (zScore > threshold) {
        outliers.push(index);
      }
    });

    return outliers;
  }
}

export default DataAnalysisService;
