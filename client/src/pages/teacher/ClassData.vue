<template>
  <div class="teacher-class-data">
    <el-card shadow="hover" class="page-header">
      <el-button type="text" @click="$router.back()" class="back-btn">
        <i class="el-icon-arrow-left"></i> 返回
      </el-button>
      <h2>班级数据</h2>
      <p>班级：{{ userInfo.className }}</p>
    </el-card>
    
    <!-- 数据概览 -->
    <el-row :gutter="20" class="overview-row">
      <el-col :xs="24" :sm="24" :md="12" :lg="6">
        <el-card shadow="hover" class="overview-card">
          <div class="overview-content">
            <div class="overview-icon primary">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="overview-info">
              <div class="overview-title">本周平均步数</div>
              <div class="overview-value">{{ overviewData.weeklyAvgSteps }}</div>
              <div class="overview-subtitle">较上周 +{{ overviewData.weeklyStepGrowth }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="12" :lg="6">
        <el-card shadow="hover" class="overview-card">
          <div class="overview-content">
            <div class="overview-icon success">
              <el-icon><Timer /></el-icon>
            </div>
            <div class="overview-info">
              <div class="overview-title">本周平均运动时长</div>
              <div class="overview-value">{{ overviewData.weeklyAvgExerciseTime }}</div>
              <div class="overview-subtitle">较上周 +{{ overviewData.weeklyExerciseTimeGrowth }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="12" :lg="6">
        <el-card shadow="hover" class="overview-card">
          <div class="overview-content">
            <div class="overview-icon warning">
              <el-icon><HotWater /></el-icon>
            </div>
            <div class="overview-info">
              <div class="overview-title">本周平均卡路里</div>
              <div class="overview-value">{{ overviewData.weeklyAvgCalories }}</div>
              <div class="overview-subtitle">较上周 +{{ overviewData.weeklyCaloriesGrowth }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="12" :lg="6">
        <el-card shadow="hover" class="overview-card">
          <div class="overview-content">
            <div class="overview-icon info">
              <el-icon><Check /></el-icon>
            </div>
            <div class="overview-info">
              <div class="overview-title">达标学生比例</div>
              <div class="overview-value">{{ overviewData.studentComplianceRate }}%</div>
              <div class="overview-subtitle">{{ overviewData.compliantStudents }}/{{ userInfo.totalStudents }} 人</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 数据图表 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <div class="card-header">
            <h3>班级每周运动数据趋势</h3>
            <el-select v-model="selectedWeek" placeholder="选择周次" @change="handleWeekChange">
              <el-option v-for="week in weeks" :key="week.value" :label="week.label" :value="week.value"></el-option>
            </el-select>
          </div>
          <div class="chart-container">
            <!-- 使用 ECharts 实现运动数据趋势图表 -->
            <div ref="trendChartRef" class="chart"></div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <div class="card-header">
            <h3>学生运动数据分布</h3>
            <el-select v-model="selectedMetric" placeholder="选择指标" @change="handleMetricChange">
              <el-option label="步数" value="steps"></el-option>
              <el-option label="运动时长" value="exerciseTime"></el-option>
              <el-option label="卡路里" value="calories"></el-option>
            </el-select>
          </div>
          <div class="chart-container">
            <!-- 使用 ECharts 实现学生运动数据分布图表 -->
            <div ref="distributionChartRef" class="chart"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 学生详细数据列表 -->
    <el-card shadow="hover" class="data-list-card">
      <div class="card-header">
        <h3>学生详细数据</h3>
        <div class="card-actions">
          <el-button type="primary" size="small" @click="refreshData">
            <el-icon><Refresh /></el-icon> 刷新数据
          </el-button>
          <el-button size="small" @click="exportData">
            <el-icon><Download /></el-icon> 导出数据
          </el-button>
        </div>
      </div>
      
      <el-table :data="studentData" border stripe style="width: 100%" height="500" class="student-table">
        <el-table-column prop="studentId" label="学号" width="120" align="center"></el-table-column>
        <el-table-column prop="name" label="姓名" width="100" align="center"></el-table-column>
        <el-table-column prop="gender" label="性别" width="80" align="center">
          <template v-slot="scope">
            <span>{{ scope.row.gender === 'male' ? '男' : '女' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="age" label="年龄" width="80" align="center"></el-table-column>
        <el-table-column prop="weeklySteps" label="本周步数" width="120" align="center">
          <template v-slot="scope">
            <span :class="getComplianceClass(scope.row.weeklySteps, 'steps')">
              {{ scope.row.weeklySteps.toLocaleString() }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="weeklyExerciseTime" label="本周运动时长" width="120" align="center">
          <template v-slot="scope">
            <span :class="getComplianceClass(scope.row.weeklyExerciseTime, 'exerciseTime')">
              {{ scope.row.weeklyExerciseTime }} 分钟
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="weeklyCalories" label="本周卡路里" width="120" align="center">
          <template v-slot="scope">
            <span :class="getComplianceClass(scope.row.weeklyCalories, 'calories')">
              {{ scope.row.weeklyCalories }} 千卡
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="complianceStatus" label="达标状态" width="100" align="center">
          <template v-slot="scope">
            <el-tag :type="scope.row.complianceStatus === 'compliant' ? 'success' : 'warning'">{{ scope.row.complianceStatus === 'compliant' ? '达标' : '未达标' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="complianceRate" label="达标率" width="100" align="center">
          <template v-slot="scope">
            <el-progress :percentage="scope.row.complianceRate" :show-text="true" size="small"></el-progress>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  TrendCharts, Timer, HotWater, Check, 
  Refresh, Download, Filter, ArrowLeft
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

export default {
  name: 'TeacherClassData',
  components: {
    TrendCharts, Timer, HotWater, Check, 
    Refresh, Download, Filter, ArrowLeft
  },
  setup() {
    const userInfo = reactive({
      className: '2023级体育教育1班',
      totalStudents: 45
    })
    
    // 数据概览
    const overviewData = reactive({
      weeklyAvgSteps: 8542,
      weeklyStepGrowth: 5.2,
      weeklyAvgExerciseTime: 125,
      weeklyExerciseTimeGrowth: 8.7,
      weeklyAvgCalories: 1850,
      weeklyCaloriesGrowth: 6.3,
      studentComplianceRate: 78,
      compliantStudents: 35
    })
    
    // 周次选择
    const selectedWeek = ref('week1')
    const weeks = [
      { label: '第1周', value: 'week1' },
      { label: '第2周', value: 'week2' },
      { label: '第3周', value: 'week3' },
      { label: '第4周', value: 'week4' },
      { label: '第5周', value: 'week5' }
    ]
    
    // 指标选择
    const selectedMetric = ref('steps')
    
    // 图表引用
    const trendChartRef = ref(null)
    const distributionChartRef = ref(null)
    
    // 图表实例
    let trendChart = null
    let distributionChart = null
    
    // 模拟运动数据趋势
    const mockTrendData = {
      week1: { steps: [8500, 8800, 9200, 8900, 9500, 10200, 9800], exerciseTime: [110, 115, 125, 120, 130, 140, 135], calories: [1650, 1720, 1800, 1750, 1880, 2000, 1920] },
      week2: { steps: [9200, 9500, 9800, 9600, 10100, 10500, 10200], exerciseTime: [120, 125, 135, 130, 140, 150, 145], calories: [1800, 1880, 1950, 1900, 2020, 2100, 2050] },
      week3: { steps: [9800, 10200, 10500, 10300, 10800, 11200, 10900], exerciseTime: [130, 135, 145, 140, 150, 160, 155], calories: [1950, 2020, 2100, 2050, 2180, 2250, 2180] },
      week4: { steps: [10200, 10500, 10800, 10600, 11300, 11700, 11400], exerciseTime: [140, 145, 155, 150, 160, 170, 165], calories: [2050, 2120, 2200, 2150, 2300, 2400, 2350] },
      week5: { steps: [10500, 10800, 11200, 11000, 11600, 12000, 11700], exerciseTime: [145, 150, 160, 155, 170, 180, 175], calories: [2120, 2200, 2300, 2250, 2400, 2500, 2450] }
    }
    
    // 模拟学生数据分布
    const mockDistributionData = {
      steps: [
        { name: '6000以下', value: 3 },
        { name: '6000-8000', value: 8 },
        { name: '8000-10000', value: 15 },
        { name: '10000-12000', value: 12 },
        { name: '12000以上', value: 7 }
      ],
      exerciseTime: [
        { name: '60分钟以下', value: 2 },
        { name: '60-90分钟', value: 7 },
        { name: '90-120分钟', value: 15 },
        { name: '120-150分钟', value: 13 },
        { name: '150分钟以上', value: 8 }
      ],
      calories: [
        { name: '1000以下', value: 1 },
        { name: '1000-1500', value: 6 },
        { name: '1500-2000', value: 18 },
        { name: '2000-2500', value: 12 },
        { name: '2500以上', value: 8 }
      ]
    }
    
    // 学生数据
    const studentData = ref([
      { studentId: '2023423320102', name: '张三', gender: 'male', age: 19, weeklySteps: 12500, weeklyExerciseTime: 180, weeklyCalories: 2300, complianceStatus: 'compliant', complianceRate: 100 },
      { studentId: '2023423320103', name: '李四', gender: 'female', age: 18, weeklySteps: 9800, weeklyExerciseTime: 130, weeklyCalories: 1950, complianceStatus: 'compliant', complianceRate: 85 },
      { studentId: '2023423320104', name: '王五', gender: 'male', age: 19, weeklySteps: 6500, weeklyExerciseTime: 85, weeklyCalories: 1200, complianceStatus: 'non-compliant', complianceRate: 55 },
      { studentId: '2023423320105', name: '赵六', gender: 'female', age: 18, weeklySteps: 10500, weeklyExerciseTime: 150, weeklyCalories: 2100, complianceStatus: 'compliant', complianceRate: 90 },
      { studentId: '2023423320106', name: '孙七', gender: 'male', age: 19, weeklySteps: 8500, weeklyExerciseTime: 110, weeklyCalories: 1650, complianceStatus: 'non-compliant', complianceRate: 70 }
    ])
    
    // 初始化趋势图表
    const initTrendChart = () => {
      if (trendChartRef.value) {
        trendChart = echarts.init(trendChartRef.value)
        updateTrendChart()
      }
    }
    
    // 更新趋势图表
    const updateTrendChart = () => {
      if (!trendChart) return
      
      const weekData = mockTrendData[selectedWeek.value]
      const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      
      const option = {
        title: { show: false },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#6a7985'
            }
          }
        },
        legend: {
          data: ['步数', '运动时长', '卡路里'],
          top: 0
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: days
        },
        yAxis: [
          {
            type: 'value',
            name: '步数',
            position: 'left',
            axisLabel: {
              formatter: '{value} 步'
            }
          },
          {
            type: 'value',
            name: '运动时长',
            position: 'right',
            axisLabel: {
              formatter: '{value} 分钟'
            }
          },
          {
            type: 'value',
            name: '卡路里',
            position: 'right',
            offset: 80,
            axisLabel: {
              formatter: '{value} 千卡'
            }
          }
        ],
        series: [
          {
            name: '步数',
            type: 'line',
            smooth: true,
            data: weekData.steps,
            itemStyle: { color: '#1890ff' },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(24, 144, 255, 0.5)' },
                { offset: 1, color: 'rgba(24, 144, 255, 0.1)' }
              ])
            }
          },
          {
            name: '运动时长',
            type: 'line',
            smooth: true,
            yAxisIndex: 1,
            data: weekData.exerciseTime,
            itemStyle: { color: '#52c41a' },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(82, 196, 26, 0.5)' },
                { offset: 1, color: 'rgba(82, 196, 26, 0.1)' }
              ])
            }
          },
          {
            name: '卡路里',
            type: 'line',
            smooth: true,
            yAxisIndex: 2,
            data: weekData.calories,
            itemStyle: { color: '#faad14' },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(250, 173, 20, 0.5)' },
                { offset: 1, color: 'rgba(250, 173, 20, 0.1)' }
              ])
            }
          }
        ]
      }
      
      trendChart.setOption(option)
    }
    
    // 初始化分布图表
    const initDistributionChart = () => {
      if (distributionChartRef.value) {
        distributionChart = echarts.init(distributionChartRef.value)
        updateDistributionChart()
      }
    }
    
    // 更新分布图表
    const updateDistributionChart = () => {
      if (!distributionChart) return
      
      const metricData = mockDistributionData[selectedMetric.value]
      const metricNames = {
        steps: '步数',
        exerciseTime: '运动时长',
        calories: '卡路里'
      }
      
      const option = {
        title: { show: false },
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} 人 ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          data: metricData.map(item => item.name)
        },
        series: [
          {
            name: metricNames[selectedMetric.value] + '分布',
            type: 'pie',
            radius: '55%',
            center: ['60%', '50%'],
            data: metricData,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      }
      
      distributionChart.setOption(option)
    }
    
    // 处理周次变化
    const handleWeekChange = () => {
      updateTrendChart()
      ElMessage.info(`已切换到${selectedWeek.value}`)
    }
    
    // 处理指标变化
    const handleMetricChange = () => {
      updateDistributionChart()
      ElMessage.info(`已切换到${selectedMetric.value}指标`)
    }
    
    // 获取达标状态样式
    const getComplianceClass = (value, metric) => {
      // 根据不同指标的达标标准返回不同的样式类
      const thresholds = {
        steps: 10000,
        exerciseTime: 120,
        calories: 2000
      }
      
      return value >= thresholds[metric] ? 'compliant-value' : 'non-compliant-value'
    }
    
    // 刷新数据
    const refreshData = () => {
      // 调用API刷新数据
      ElMessage.success('数据已刷新')
    }
    
    // 导出数据
    const exportData = () => {
      // 实现数据导出功能
      ElMessage.success('数据导出成功')
    }
    
    // 初始化
    onMounted(() => {
      // 这里可以调用API获取班级数据
      console.log('班级数据页面已加载')
      
      // 延迟初始化图表，确保DOM元素已经渲染完成
      nextTick(() => {
        initTrendChart()
        initDistributionChart()
      })
      
      // 监听窗口大小变化，调整图表大小
      window.addEventListener('resize', () => {
        trendChart?.resize()
        distributionChart?.resize()
      })
    })
    
    return {
      userInfo,
      overviewData,
      selectedWeek,
      weeks,
      selectedMetric,
      studentData,
      trendChartRef,
      distributionChartRef,
      handleWeekChange,
      handleMetricChange,
      getComplianceClass,
      refreshData,
      exportData
    }
  }
}
</script>

<style scoped>
.teacher-class-data {
  padding: 24px;
  min-height: calc(100vh - 100px);
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
}

.page-header {
  margin-bottom: 20px;
}

.overview-row {
  margin-bottom: 20px;
}

.overview-card {
  margin-bottom: 20px;
}

.overview-content {
  display: flex;
  align-items: center;
}

.overview-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 16px;
}

.overview-icon.primary {
  background-color: #e6f7ff;
  color: #1890ff;
}

.overview-icon.success {
  background-color: #f6ffed;
  color: #52c41a;
}

.overview-icon.warning {
  background-color: #fffbe6;
  color: #faad14;
}

.overview-icon.info {
  background-color: #e6f7ff;
  color: #1890ff;
}

.overview-info {
  flex: 1;
}

.overview-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.overview-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.overview-subtitle {
  font-size: 12px;
  color: #999;
}

.charts-row {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.chart-container {
  height: 350px;
  background-color: #fafafa;
  border-radius: 4px;
}

.chart {
  width: 100%;
  height: 100%;
}

.chart-placeholder {
  color: #999;
  font-size: 16px;
}

.data-list-card {
  margin-bottom: 20px;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.student-table {
  margin-top: 16px;
}

.compliant-value {
  color: #52c41a;
  font-weight: 500;
}

.non-compliant-value {
  color: #faad14;
}

.back-btn {
  margin-bottom: 10px;
  color: #1890ff;
}

.back-btn:hover {
  color: #40a9ff;
  background-color: rgba(24, 144, 255, 0.1);
}
</style>