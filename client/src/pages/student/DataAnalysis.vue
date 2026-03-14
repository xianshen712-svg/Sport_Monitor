<template>
  <div class="data-analysis-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">数据分析中心</h1>
        <p class="page-description">全面分析您的健康数据，洞察身体变化趋势</p>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 数据筛选卡片 -->
      <el-card shadow="hover" class="filter-card">
        <div class="filter-content">
          <el-form :inline="true" :model="filterForm" class="filter-form">
            <el-form-item label="数据类型">
              <el-select v-model="filterForm.dataType" placeholder="请选择数据类型" @change="onFilterChange">
                <el-option label="心率" value="heartRate" icon="el-icon-heart"></el-option>
                <el-option label="步数" value="steps" icon="el-icon-data-line"></el-option>
                <el-option label="血氧" value="bloodOxygen" icon="el-icon-success"></el-option>
                <el-option label="体温" value="bodyTemperature" icon="el-icon-heat-map"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="filterForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="yyyy-MM-dd"
                value-format="yyyy-MM-dd"
                @change="onFilterChange"
              ></el-date-picker>
            </el-form-item>
            <el-form-item label="统计周期">
              <el-select v-model="filterForm.period" placeholder="请选择统计周期" @change="onFilterChange">
                <el-option label="按日" value="day"></el-option>
                <el-option label="按周" value="week"></el-option>
                <el-option label="按月" value="month"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="fetchAnalysisData" icon="el-icon-search">查询</el-button>
              <el-button @click="resetFilter" icon="el-icon-refresh">重置</el-button>
            </el-form-item>
          </el-form>
          <div class="export-actions">
            <el-button type="success" @click="exportData('excel')" icon="el-icon-download">导出Excel</el-button>
            <el-button type="info" @click="exportData('pdf')" icon="el-icon-document">导出PDF</el-button>
          </div>
        </div>
      </el-card>

      <!-- 核心数据概览 -->
      <div class="stats-grid">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-header">
              <div class="stat-icon blue">
                <i class="el-icon-s-data"></i>
              </div>
              <div class="stat-title">数据总数</div>
            </div>
            <div class="stat-value">{{ statistics.totalCount }}</div>
            <div class="stat-unit">条记录</div>
          </div>
        </el-card>

        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-header">
              <div class="stat-icon green">
                <i class="el-icon-s-operation"></i>
              </div>
              <div class="stat-title">平均值</div>
            </div>
            <div class="stat-value">{{ statistics.average.toFixed(1) }}</div>
            <div class="stat-unit">{{ getUnit(filterForm.dataType) }}</div>
          </div>
        </el-card>

        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-header">
              <div class="stat-icon red">
                <i class="el-icon-top"></i>
              </div>
              <div class="stat-title">最大值</div>
            </div>
            <div class="stat-value">{{ statistics.max }}</div>
            <div class="stat-unit">{{ getUnit(filterForm.dataType) }}</div>
          </div>
        </el-card>

        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-header">
              <div class="stat-icon orange">
                <i class="el-icon-bottom"></i>
              </div>
              <div class="stat-title">最小值</div>
            </div>
            <div class="stat-value">{{ statistics.min }}</div>
            <div class="stat-unit">{{ getUnit(filterForm.dataType) }}</div>
          </div>
        </el-card>

        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-header">
              <div class="stat-icon purple">
                <i class="el-icon-sort"></i>
              </div>
              <div class="stat-title">标准差</div>
            </div>
            <div class="stat-value">{{ statistics.standardDeviation.toFixed(2) }}</div>
            <div class="stat-unit">{{ getUnit(filterForm.dataType) }}</div>
          </div>
        </el-card>

        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-header">
              <div class="stat-icon yellow">
                <i class="el-icon-warning"></i>
              </div>
              <div class="stat-title">异常值</div>
            </div>
            <div class="stat-value">{{ statistics.abnormalCount }}</div>
            <div class="stat-unit">条记录</div>
          </div>
        </el-card>
      </div>

      <!-- 数据可视化区域 -->
      <div class="visualization-section">
        <!-- 趋势分析图表 -->
        <el-card shadow="hover" class="chart-card">
          <div class="card-header">
            <h3 class="card-title">数据趋势分析</h3>
            <el-dropdown trigger="click">
              <el-button type="text" size="small">
                操作 <i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item @click.native="exportChart('trend')">导出图表</el-dropdown-item>
                <el-dropdown-item @click.native="openFullScreenChart('trend')">全屏查看</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
          <div class="chart-container">
            <line-chart
              height="400px"
              :data="chartData.values"
              :categories="chartData.categories"
              :title="getChartTitle()"
              x-axis-name="时间"
              :y-axis-name="getUnit(filterForm.dataType)"
              line-color="#409EFF"
              :show-area="true"
              :smooth="true"
              :show-mark-line="true"
            />
          </div>
        </el-card>

        <!-- 数据分布图表 -->
        <el-card shadow="hover" class="chart-card">
          <div class="card-header">
            <h3 class="card-title">数据分布分析</h3>
            <el-dropdown trigger="click">
              <el-button type="text" size="small">
                操作 <i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item @click.native="exportChart('distribution')">导出图表</el-dropdown-item>
                <el-dropdown-item @click.native="openFullScreenChart('distribution')">全屏查看</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
          <div class="chart-container">
            <div class="distribution-charts">
              <div class="pie-chart-wrapper">
                <pie-chart
                  height="350px"
                  :data="distributionData"
                  :title="getDistributionTitle()"
                  :show-legend="true"
                  :show-label="true"
                  legend-position="bottom"
                />
              </div>
              <div class="distribution-summary">
                <div class="summary-item" v-for="(item, index) in distributionData" :key="index">
                  <div class="summary-color" :style="{ backgroundColor: item.itemStyle.color }"></div>
                  <div class="summary-info">
                    <div class="summary-name">{{ item.name }}</div>
                    <div class="summary-count">{{ item.value }} ({{ ((item.value / statistics.totalCount) * 100).toFixed(1) }}%)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 详细数据表格 -->
      <el-card shadow="hover" class="table-card">
        <div class="card-header">
          <h3 class="card-title">详细数据记录</h3>
          <div class="table-actions">
            <el-input
              v-model="tableFilter"
              placeholder="搜索数据..."
              prefix-icon="el-icon-search"
              class="table-search"
              size="small"
            />
            <el-button type="primary" size="small" @click="exportData('excel')">
              <i class="el-icon-download"></i> 导出数据
            </el-button>
          </div>
        </div>
        <div class="table-container">
          <el-table
            :data="paginatedTableData"
            stripe
            style="width: 100%"
            v-loading="tableLoading"
            :header-cell-style="{ background: '#f5f7fa', fontWeight: 'bold' }"
          >
            <el-table-column prop="date" label="日期" width="150" sortable></el-table-column>
            <el-table-column prop="value" :label="getDataTypeLabel(filterForm.dataType)" width="150" sortable>
              <template #default="scope">
                <span class="value-text">{{ scope.row.value }}{{ getUnit(filterForm.dataType) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="scope">
                <el-tag v-if="scope.row.status === 'normal'" type="success" size="small">正常</el-tag>
                <el-tag v-else type="danger" size="small">异常</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="notes" label="备注" min-width="200"></el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="scope">
                <el-button type="text" size="small" @click="viewDetails(scope.row)">
                  <i class="el-icon-view"></i> 详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页控件 -->
          <div class="pagination-container">
            <el-pagination
              v-model="currentPage"
              :page-size="pageSize"
              :total="filteredTableData.length"
              layout="total, prev, pager, next, jumper"
              :page-sizes="[10, 20, 50, 100]"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            ></el-pagination>
          </div>
        </div>
      </el-card>
    </div>



    <!-- 数据详情对话框 -->
    <el-dialog
      title="数据详情"
      v-model="showDetailDialog"
      width="50%"
      :close-on-click-modal="false"
    >
      <div v-if="selectedData" class="data-detail-content">
        <div class="detail-item">
          <span class="detail-label">日期：</span>
          <span class="detail-value">{{ selectedData.date }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">{{ getDataTypeLabel(filterForm.dataType) }}：</span>
          <span class="detail-value">{{ selectedData.value }}{{ getUnit(filterForm.dataType) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">状态：</span>
          <span class="detail-value">
            <el-tag v-if="selectedData.status === 'normal'" type="success">正常</el-tag>
            <el-tag v-else type="danger">异常</el-tag>
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">备注：</span>
          <span class="detail-value">{{ selectedData.notes || '无' }}</span>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import LineChart from '../../components/Charts/LineChart.vue';
import BarChart from '../../components/Charts/BarChart.vue';
import PieChart from '../../components/Charts/PieChart.vue';
import DataAnalysisService from '../../services/DataAnalysisService';

// 日期工具函数
const dateUtils = {
  date(value = new Date()) {
    const date = new Date(value);
    
    const formatDate = (formatStr) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      let result = formatStr;
      result = result.replace(/YYYY/g, year);
      result = result.replace(/MM/g, month);
      result = result.replace(/DD/g, day);
      return result;
    };
    
    return {
      subtract(days, unit) {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() - days);
        return dateUtils.date(newDate);
      },
      format(format = 'YYYY-MM-DD') {
        return formatDate(format);
      },
      toDate() {
        return date;
      }
    };
  },
  formatDate(date, format) {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day);
  }
};

export default {
  name: 'DataAnalysis',
  components: {
    LineChart,
    BarChart,
    PieChart
  },
  data() {
    return {
      filterForm: {
        dataType: 'heartRate',
        dateRange: [
          dateUtils.date().subtract(30, 'day').format('YYYY-MM-DD'),
          dateUtils.date().format('YYYY-MM-DD')
        ],
        period: 'day'
      },
      statistics: {
        totalCount: 0,
        average: 0,
        max: 0,
        min: 0,
        standardDeviation: 0,
        abnormalCount: 0
      },
      chartData: {
        categories: [],
        values: []
      },
      distributionData: [],
      detailedData: [],
      tableFilter: '',
      tableLoading: false,
      currentPage: 1,
      pageSize: 4,
      showDetailDialog: false,
      selectedData: null,
  
    };
  },
  computed: {
    // 筛选后的表格数据
    filteredTableData() {
      if (!this.tableFilter) {
        return this.detailedData;
      }
      const filter = this.tableFilter.toLowerCase();
      return this.detailedData.filter(item => {
        return item.date.toLowerCase().includes(filter) ||
               item.value.toString().includes(filter) ||
               item.status.toLowerCase().includes(filter) ||
               item.notes.toLowerCase().includes(filter);
      });
    },
    // 分页后的数据
    paginatedTableData() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredTableData.slice(start, end);
    }
  },
  mounted() {
    this.fetchAnalysisData();
  },
  methods: {
    // 获取分析数据
    fetchAnalysisData() {
      this.tableLoading = true;
      
      // 模拟API请求延迟
      setTimeout(() => {
        this.generateMockData();
        this.calculateStatistics();
        this.generateDistributionData();

        this.tableLoading = false;
      }, 800);
    },
    
    // 生成模拟数据
    generateMockData() {
      const { dataType, dateRange, period } = this.filterForm;
      const [startDate, endDate] = dateRange;
      const categories = [];
      const values = [];
      const detailedData = [];
      
      // 计算日期范围内的天数
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      for (let i = 0; i < days; i++) {
        const currentDateObj = new Date(start);
        currentDateObj.setDate(start.getDate() + i);
        const currentDateStr = dateUtils.formatDate(currentDateObj, 'YYYY-MM-DD');
        
        // 根据数据类型生成不同范围的随机值
        let value;
        switch (dataType) {
          case 'heartRate':
            value = Math.floor(Math.random() * 60) + 60;
            break;
          case 'steps':
            value = Math.floor(Math.random() * 10000) + 5000;
            break;
          case 'bloodOxygen':
            value = parseFloat((Math.random() * 5 + 95).toFixed(1));
            break;
          case 'bodyTemperature':
            value = parseFloat((Math.random() * 0.8 + 36.2).toFixed(1));
            break;
          default:
            value = Math.floor(Math.random() * 100);
        }
        
        // 判断是否为异常值
        const status = this.isAbnormalValue(dataType, value) ? 'abnormal' : 'normal';
        
        categories.push(dateUtils.formatDate(currentDateObj, 'MM-DD'));
        values.push(value);
        
        detailedData.push({
          date: currentDateStr,
          value: value,
          status: status,
          notes: status === 'abnormal' ? `${this.getDataTypeLabel(dataType)}异常` : ''
        });
      }
      
      this.chartData = { categories, values };
      this.detailedData = detailedData;
    },
    
    // 计算统计指标
    calculateStatistics() {
      const values = this.chartData.values;
      if (values.length === 0) {
        this.statistics = {
          totalCount: 0,
          average: 0,
          max: 0,
          min: 0,
          standardDeviation: 0,
          abnormalCount: 0
        };
        return;
      }
      
      const totalCount = values.length;
      const sum = values.reduce((acc, val) => acc + Number(val), 0);
      const average = sum / totalCount;
      const max = Math.max(...values);
      const min = Math.min(...values);
      
      // 计算标准差
      const variance = values.reduce((acc, val) => acc + Math.pow(Number(val) - average, 2), 0) / totalCount;
      const standardDeviation = Math.sqrt(variance);
      
      // 计算异常值数量
      const abnormalCount = this.detailedData.filter(item => item.status === 'abnormal').length;
      
      this.statistics = {
        totalCount,
        average,
        max,
        min,
        standardDeviation,
        abnormalCount
      };
    },
    
    // 生成分布数据
    generateDistributionData() {
      const { dataType } = this.filterForm;
      const values = this.chartData.values;
      
      // 根据不同数据类型设置不同的分布区间
      let ranges;
      
      switch (dataType) {
        case 'heartRate':
          ranges = [
            { name: '60以下', min: 0, max: 60 },
            { name: '60-70', min: 60, max: 70 },
            { name: '70-80', min: 70, max: 80 },
            { name: '80-90', min: 80, max: 90 },
            { name: '90以上', min: 90, max: Infinity }
          ];
          break;
        case 'steps':
          ranges = [
            { name: '5000以下', min: 0, max: 5000 },
            { name: '5000-8000', min: 5000, max: 8000 },
            { name: '8000-12000', min: 8000, max: 12000 },
            { name: '12000-15000', min: 12000, max: 15000 },
            { name: '15000以上', min: 15000, max: Infinity }
          ];
          break;
        case 'bloodOxygen':
          ranges = [
            { name: '90以下', min: 0, max: 90 },
            { name: '90-95', min: 90, max: 95 },
            { name: '95-98', min: 95, max: 98 },
            { name: '98以上', min: 98, max: Infinity }
          ];
          break;
        case 'bodyTemperature':
          ranges = [
            { name: '36以下', min: 0, max: 36 },
            { name: '36-36.5', min: 36, max: 36.5 },
            { name: '36.5-37', min: 36.5, max: 37 },
            { name: '37-37.5', min: 37, max: 37.5 },
            { name: '37.5以上', min: 37.5, max: Infinity }
          ];
          break;
        default:
          ranges = [
            { name: '低', min: 0, max: 33 },
            { name: '中', min: 33, max: 66 },
            { name: '高', min: 66, max: Infinity }
          ];
      }
      
      // 设置现代化的颜色方案
      const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#722ED1'];
      
      // 统计每个区间的数量
      const distribution = ranges.map((range, index) => {
        const count = values.filter(val => 
          Number(val) >= range.min && Number(val) < range.max
        ).length;
        return {
          name: range.name,
          value: count,
          itemStyle: {
            color: colors[index % colors.length]
          }
        };
      });
      
      this.distributionData = distribution;
    },
    

    
    // 判断是否为异常值
    isAbnormalValue(dataType, value) {
      const numValue = Number(value);
      
      switch (dataType) {
        case 'heartRate':
          return numValue < 60 || numValue > 120;
        case 'steps':
          return numValue < 1000 || numValue > 30000;
        case 'bloodOxygen':
          return numValue < 90;
        case 'bodyTemperature':
          return numValue < 36.0 || numValue > 37.3;
        default:
          return false;
      }
    },
    
    // 获取数据类型标签
    getDataTypeLabel(type) {
      const labels = {
        heartRate: '心率',
        steps: '步数',
        bloodOxygen: '血氧',
        bodyTemperature: '体温'
      };
      return labels[type] || type;
    },
    
    // 获取数据单位
    getUnit(type) {
      const units = {
        heartRate: '次/分钟',
        steps: '步',
        bloodOxygen: '%',
        bodyTemperature: '℃'
      };
      return units[type] || '';
    },
    
    // 获取图表标题
    getChartTitle() {
      const { dataType, dateRange } = this.filterForm;
      return `${this.getDataTypeLabel(dataType)}趋势分析 (${dateRange[0]} 至 ${dateRange[1]})`;
    },
    
    // 获取分布图表标题
    getDistributionTitle() {
      const { dataType } = this.filterForm;
      return `${this.getDataTypeLabel(dataType)}分布`;
    },
    
    // 重置筛选条件
    resetFilter() {
      this.filterForm = {
        dataType: 'heartRate',
        dateRange: [
          dateUtils.date().subtract(30, 'day').format('YYYY-MM-DD'),
          dateUtils.date().format('YYYY-MM-DD')
        ],
        period: 'day'
      };
      this.fetchAnalysisData();
    },
    
    // 筛选条件变化
    onFilterChange() {
      this.currentPage = 1; // 重置到第一页
      this.fetchAnalysisData();
    },
    
    // 导出数据
    exportData(type) {
      this.$message.success(`正在导出${type.toUpperCase()}文件...`);
      setTimeout(() => {
        this.$message.success('数据导出成功');
      }, 1000);
    },
    
    // 导出图表
    exportChart(chartType) {
      this.$message.success(`正在导出${chartType}图表...`);
      setTimeout(() => {
        this.$message.success('图表导出成功');
      }, 800);
    },
    
    // 全屏查看图表
    openFullScreenChart(chartType) {
      this.$message.info(`全屏查看${chartType}图表功能开发中...`);
    },
    
    // 查看数据详情
    viewDetails(data) {
      this.selectedData = data;
      this.showDetailDialog = true;
    },
    
    // 分页大小变化
    handleSizeChange(size) {
      this.pageSize = size;
      this.currentPage = 1;
    },
    
    // 当前页码变化
    handleCurrentChange(current) {
      this.currentPage = current;
    }
  }
};
</script>

<style scoped>
/* 页面整体样式 */
.data-analysis-page {
  background-color: #f5f7fa;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 页面头部样式 */
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px 0;
  text-align: left;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  width: 100%;
}

.header-content {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 12px;
  width: 100%;
  box-sizing: border-box;
}

.page-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 4px;
  letter-spacing: -0.3px;
}

.page-description {
  font-size: 0.8rem;
  opacity: 0.9;
  margin: 0;
}

/* 主要内容区域 */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px;
}

/* 筛选卡片样式 */
.filter-card {
  margin-bottom: 16px;
  border-radius: 8px;
  border: none;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.08);
}

.filter-content {
  padding: 12px;
}

.filter-form {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-form .el-form-item {
  margin-bottom: 0;
}

.filter-form .el-select,
.filter-form .el-date-picker {
  min-width: 140px;
  font-size: 13px;
}

.export-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.export-actions .el-button {
  font-size: 12px;
  padding: 5px 10px;
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  border-radius: 8px;
  border: none;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.stat-content {
  padding: 12px;
}

.stat-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.stat-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: white;
  margin-right: 8px;
}

.stat-icon.blue {
  background-color: #409EFF;
}

.stat-icon.green {
  background-color: #67C23A;
}

.stat-icon.red {
  background-color: #F56C6C;
}

.stat-icon.orange {
  background-color: #E6A23C;
}

.stat-icon.purple {
  background-color: #909399;
}

.stat-icon.yellow {
  background-color: #F7BA2A;
}

.stat-title {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 2px;
}

.stat-unit {
  font-size: 12px;
  color: #909399;
}

/* 数据可视化区域 */
.visualization-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.chart-card {
  border-radius: 8px;
  border: none;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.card-header .el-button {
  font-size: 12px;
  padding: 4px 8px;
}

.chart-container {
  padding: 12px;
}

/* 分布图表容器 */
.distribution-charts {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.pie-chart-wrapper {
  flex: 1;
  min-width: 220px;
}

.distribution-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 160px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-color {
  width: 14px;
  height: 14px;
  border-radius: 3px;
}

.summary-info {
  flex: 1;
}

.summary-name {
  font-size: 12px;
  color: #606266;
  margin-bottom: 2px;
}

.summary-count {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

/* 表格卡片样式 */
.table-card {
  border-radius: 8px;
  border: none;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.08);
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
}

.table-actions .el-button {
  font-size: 12px;
  padding: 5px 10px;
}

.table-search {
  width: 180px;
  font-size: 13px;
}

.table-container {
  padding: 12px 16px;
}

.pagination-container {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.pagination-container .el-pagination {
    font-size: 13px;
  }

/* 数据详情对话框 */
.data-detail-content {
  padding: 12px 0;
}

.detail-item {
  display: flex;
  margin-bottom: 8px;
}

.detail-label {
  width: 70px;
  font-weight: 600;
  color: #606266;
  font-size: 13px;
}

.detail-value {
  flex: 1;
  color: #303133;
  font-size: 13px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }
  
  .filter-form {
    flex-direction: column;
    align-items: stretch;
  }
  
  .export-actions {
    justify-content: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .visualization-section {
    grid-template-columns: 1fr;
  }
  
  .distribution-charts {
    flex-direction: column;
    align-items: stretch;
  }
  
  .table-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .table-search {
    width: 100%;
  }
}
</style>