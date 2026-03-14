<template>
  <div class="realtime-monitoring-page">
    <div class="page-header">
      <el-button type="text" @click="$router.back()" class="back-btn">
        <i class="el-icon-arrow-left"></i> 返回
      </el-button>
      <h2 class="page-title">实时监测指标详情</h2>
      <div class="page-actions">
        <el-button type="primary" size="small" @click="toggleMonitoring">
          {{ isMonitoring ? '暂停监测' : '开始监测' }}
        </el-button>
        <el-button type="warning" size="small" @click="clearAlerts">清除告警</el-button>
      </div>
    </div>

    <div class="page-content">
      <!-- 学生选择 -->
      <div class="student-section">
        <div class="chart-card">
          <div class="card-header">
            <span class="card-title">选择监测学生</span>
          </div>
          <div class="card-content">
            <el-select v-model="selectedStudent" placeholder="请选择学生" size="large" style="width: 100%">
              <el-option
                v-for="student in students"
                :key="student.id"
                :label="`${student.studentId} - ${student.name}`"
                :value="student"
              ></el-option>
            </el-select>
          </div>
        </div>
      </div>

      <!-- 实时监测指标 -->
      <div class="metrics-section">
        <el-row :gutter="24">
          <el-col :xs="24" :sm="12" :lg="6" class="metric-col">
            <div class="metric-card">
              <div class="card-header">
                <span class="card-title">心率</span>
                <span class="unit">bpm</span>
              </div>
              <div class="card-content">
                <div class="gauge-container">
                  <div id="heartRateGauge" class="gauge"></div>
                </div>
                <div class="metric-value">
                  <span class="current-value">{{ monitoringData.heartRate }}</span>
                  <span class="status-indicator" :class="heartRateStatus"></span>
                </div>
              </div>
              <div class="card-footer">
                <span class="range">正常范围：60-100 bpm</span>
              </div>
            </div>
          </el-col>

          <el-col :xs="24" :sm="12" :lg="6" class="metric-col">
            <div class="metric-card">
              <div class="card-header">
                <span class="card-title">血氧</span>
                <span class="unit">%</span>
              </div>
              <div class="card-content">
                <div class="gauge-container">
                  <div id="spo2Gauge" class="gauge"></div>
                </div>
                <div class="metric-value">
                  <span class="current-value">{{ monitoringData.spo2 }}</span>
                  <span class="status-indicator" :class="spo2Status"></span>
                </div>
              </div>
              <div class="card-footer">
                <span class="range">正常范围：95-100 %</span>
              </div>
            </div>
          </el-col>

          <el-col :xs="24" :sm="12" :lg="6" class="metric-col">
            <div class="metric-card">
              <div class="card-header">
                <span class="card-title">收缩压</span>
                <span class="unit">mmHg</span>
              </div>
              <div class="card-content">
                <div class="gauge-container">
                  <div id="systolicGauge" class="gauge"></div>
                </div>
                <div class="metric-value">
                  <span class="current-value">{{ monitoringData.systolic }}</span>
                  <span class="status-indicator" :class="systolicStatus"></span>
                </div>
              </div>
              <div class="card-footer">
                <span class="range">正常范围：90-140 mmHg</span>
              </div>
            </div>
          </el-col>

          <el-col :xs="24" :sm="12" :lg="6" class="metric-col">
            <div class="metric-card">
              <div class="card-header">
                <span class="card-title">体温</span>
                <span class="unit">°C</span>
              </div>
              <div class="card-content">
                <div class="gauge-container">
                  <div id="temperatureGauge" class="gauge"></div>
                </div>
                <div class="metric-value">
                  <span class="current-value">{{ monitoringData.temperature }}</span>
                  <span class="status-indicator" :class="temperatureStatus"></span>
                </div>
              </div>
              <div class="card-footer">
                <span class="range">正常范围：36.0-37.2 °C</span>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 实时趋势图 -->
      <div class="charts-section">
        <el-row :gutter="24">
          <el-col :xs="24" class="chart-col">
            <div class="chart-card">
              <div class="card-header">
                <span class="card-title">生理指标趋势图</span>
              </div>
              <div class="card-content">
                <div id="trendChart" class="chart-container"></div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 告警信息 -->
      <div class="alerts-section">
        <div class="chart-card">
          <div class="card-header">
            <span class="card-title">告警信息</span>
            <span class="alert-count" v-if="alerts.length > 0">{{ alerts.length }}</span>
          </div>
          <div class="card-content">
            <el-empty v-if="alerts.length === 0" description="暂无告警信息"></el-empty>
            <el-timeline v-else>
              <el-timeline-item
                v-for="(alert, index) in alerts"
                :key="index"
                :timestamp="alert.time"
                :type="alert.type === 'warning' ? 'warning' : 'danger'"
                placement="top"
              >
                <div class="alert-item">
                  <div class="alert-content">
                    <strong>{{ alert.studentName }}</strong> - {{ alert.metric }} {{ alert.message }}
                  </div>
                  <div class="alert-value">
                    当前值: {{ alert.value }}{{ alert.unit }} ({{ alert.range }})
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'RealtimeMonitoring',
  data() {
    return {
      students: [
        { id: 1, studentId: '2023423320101', name: '张三' },
        { id: 2, studentId: '2023423320102', name: '李四' },
        { id: 3, studentId: '2023423320103', name: '王五' },
        { id: 4, studentId: '2023423320104', name: '赵六' },
        { id: 5, studentId: '2023423320105', name: '孙七' }
      ],
      selectedStudent: null,
      isMonitoring: true,
      monitoringData: {
        heartRate: 75,
        spo2: 98,
        systolic: 118,
        diastolic: 78,
        temperature: 36.8
      },
      alerts: [
        {
          time: '10:30:25',
          studentName: '李四',
          metric: '心率',
          message: '高于正常范围',
          value: 105,
          unit: 'bpm',
          range: '正常: 60-100 bpm',
          type: 'warning'
        },
        {
          time: '10:28:15',
          studentName: '张三',
          metric: '血氧',
          message: '低于正常范围',
          value: 94,
          unit: '%',
          range: '正常: 95-100 %',
          type: 'danger'
        }
      ],
      heartRateGauge: null,
      spo2Gauge: null,
      systolicGauge: null,
      temperatureGauge: null,
      trendChart: null,
      monitoringInterval: null,
      // 趋势图数据
      trendData: {
        time: [],
        heartRate: [],
        spo2: [],
        systolic: [],
        temperature: []
      },
      maxDataPoints: 20 // 最多显示20个数据点
    }
  },
  computed: {
    heartRateStatus() {
      const value = this.monitoringData.heartRate
      if (value < 60 || value > 100) return 'abnormal'
      return 'normal'
    },
    spo2Status() {
      const value = this.monitoringData.spo2
      if (value < 95) return 'abnormal'
      return 'normal'
    },
    systolicStatus() {
      const value = this.monitoringData.systolic
      if (value < 90 || value > 140) return 'abnormal'
      return 'normal'
    },
    temperatureStatus() {
      const value = this.monitoringData.temperature
      if (value < 36.0 || value > 37.2) return 'abnormal'
      return 'normal'
    }
  },
  mounted() {
    // 默认选择第一个学生
    if (this.students.length > 0) {
      this.selectedStudent = this.students[0]
    }
    this.initCharts()
    this.startMonitoring()
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    this.stopMonitoring()
    this.destroyCharts()
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    initCharts() {
      // 初始化心率仪表盘
      const heartRateDom = document.getElementById('heartRateGauge')
      if (heartRateDom) {
        this.heartRateGauge = echarts.init(heartRateDom)
        this.updateGauge(this.heartRateGauge, this.monitoringData.heartRate, 40, 180, '#409eff')
      }

      // 初始化血氧仪表盘
      const spo2Dom = document.getElementById('spo2Gauge')
      if (spo2Dom) {
        this.spo2Gauge = echarts.init(spo2Dom)
        this.updateGauge(this.spo2Gauge, this.monitoringData.spo2, 80, 100, '#67c23a')
      }

      // 初始化收缩压仪表盘
      const systolicDom = document.getElementById('systolicGauge')
      if (systolicDom) {
        this.systolicGauge = echarts.init(systolicDom)
        this.updateGauge(this.systolicGauge, this.monitoringData.systolic, 60, 200, '#e6a23c')
      }

      // 初始化体温仪表盘
      const temperatureDom = document.getElementById('temperatureGauge')
      if (temperatureDom) {
        this.temperatureGauge = echarts.init(temperatureDom)
        this.updateGauge(this.temperatureGauge, this.monitoringData.temperature, 35.0, 42.0, '#f56c6c')
      }

      // 初始化趋势图
      const trendChartDom = document.getElementById('trendChart')
      if (trendChartDom) {
        this.trendChart = echarts.init(trendChartDom)
        this.initTrendChart()
      }
    },
    destroyCharts() {
      if (this.heartRateGauge) this.heartRateGauge.dispose()
      if (this.spo2Gauge) this.spo2Gauge.dispose()
      if (this.systolicGauge) this.systolicGauge.dispose()
      if (this.temperatureGauge) this.temperatureGauge.dispose()
      if (this.trendChart) this.trendChart.dispose()
    },
    handleResize() {
      if (this.heartRateGauge) this.heartRateGauge.resize()
      if (this.spo2Gauge) this.spo2Gauge.resize()
      if (this.systolicGauge) this.systolicGauge.resize()
      if (this.temperatureGauge) this.temperatureGauge.resize()
      if (this.trendChart) this.trendChart.resize()
    },
    updateGauge(chart, value, min, max, color) {
      const option = {
        series: [
          {
            type: 'gauge',
            startAngle: 180,
            endAngle: 0,
            min: min,
            max: max,
            splitNumber: 10,
            axisLine: {
              lineStyle: {
                width: 20,
                color: [
                  [0.3, '#909399'],
                  [0.7, '#409eff'],
                  [1, color]
                ]
              }
            },
            pointer: {
              icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
              length: '12%',
              width: 20,
              offsetCenter: [0, '-60%'],
              itemStyle: {
                color: 'auto'
              }
            },
            axisTick: {
              length: 12,
              lineStyle: {
                color: 'auto',
                width: 2
              }
            },
            splitLine: {
              length: 20,
              lineStyle: {
                color: 'auto',
                width: 5
              }
            },
            axisLabel: {
              color: '#606266',
              fontSize: 12,
              distance: -60,
              formatter: function (value) {
                return value
              }
            },
            detail: {
              fontSize: 20,
              offsetCenter: [0, '-10%'],
              valueAnimation: true,
              formatter: function (value) {
                return value
              },
              color: 'auto'
            },
            data: [
              {
                value: value,
                name: ''
              }
            ]
          }
        ]
      }
      chart.setOption(option, true)
    },
    initTrendChart() {
      const option = {
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['心率', '血氧', '收缩压', '体温'],
          textStyle: {
            color: '#606266'
          }
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: this.trendData.time,
          axisLabel: {
            color: '#606266'
          }
        },
        yAxis: [
          {
            type: 'value',
            name: '心率',
            position: 'left',
            min: 40,
            max: 120,
            axisLabel: {
              color: '#606266'
            }
          },
          {
            type: 'value',
            name: '血氧',
            position: 'right',
            min: 90,
            max: 100,
            axisLabel: {
              color: '#606266'
            }
          },
          {
            type: 'value',
            name: '血压/体温',
            position: 'right',
            offset: 80,
            axisLabel: {
              color: '#606266'
            }
          }
        ],
        series: [
          {
            name: '心率',
            type: 'line',
            data: this.trendData.heartRate,
            yAxisIndex: 0,
            itemStyle: {
              color: '#409eff'
            },
            lineStyle: {
              width: 2
            }
          },
          {
            name: '血氧',
            type: 'line',
            data: this.trendData.spo2,
            yAxisIndex: 1,
            itemStyle: {
              color: '#67c23a'
            },
            lineStyle: {
              width: 2
            }
          },
          {
            name: '收缩压',
            type: 'line',
            data: this.trendData.systolic,
            yAxisIndex: 2,
            itemStyle: {
              color: '#e6a23c'
            },
            lineStyle: {
              width: 2
            }
          },
          {
            name: '体温',
            type: 'line',
            data: this.trendData.temperature,
            yAxisIndex: 2,
            itemStyle: {
              color: '#f56c6c'
            },
            lineStyle: {
              width: 2
            }
          }
        ]
      }
      this.trendChart.setOption(option)
    },
    updateTrendChart() {
      // 获取当前时间
      const now = new Date()
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

      // 添加新数据
      this.trendData.time.push(timeStr)
      this.trendData.heartRate.push(this.monitoringData.heartRate)
      this.trendData.spo2.push(this.monitoringData.spo2)
      this.trendData.systolic.push(this.monitoringData.systolic)
      this.trendData.temperature.push(this.monitoringData.temperature)

      // 保持数据点数量
      if (this.trendData.time.length > this.maxDataPoints) {
        this.trendData.time.shift()
        this.trendData.heartRate.shift()
        this.trendData.spo2.shift()
        this.trendData.systolic.shift()
        this.trendData.temperature.shift()
      }

      // 更新图表
      if (this.trendChart) {
        this.trendChart.setOption({
          xAxis: {
            data: this.trendData.time
          },
          series: [
            {
              data: this.trendData.heartRate
            },
            {
              data: this.trendData.spo2
            },
            {
              data: this.trendData.systolic
            },
            {
              data: this.trendData.temperature
            }
          ]
        })
      }
    },
    updateMonitoringData() {
      // 模拟实时数据变化
      this.monitoringData.heartRate = Math.round(60 + Math.random() * 60)
      this.monitoringData.spo2 = Math.round(90 + Math.random() * 10)
      this.monitoringData.systolic = Math.round(90 + Math.random() * 60)
      this.monitoringData.temperature = parseFloat((36.0 + Math.random() * 1.5).toFixed(1))

      // 更新仪表盘
      if (this.heartRateGauge) {
        this.updateGauge(this.heartRateGauge, this.monitoringData.heartRate, 40, 180, '#409eff')
      }
      if (this.spo2Gauge) {
        this.updateGauge(this.spo2Gauge, this.monitoringData.spo2, 80, 100, '#67c23a')
      }
      if (this.systolicGauge) {
        this.updateGauge(this.systolicGauge, this.monitoringData.systolic, 60, 200, '#e6a23c')
      }
      if (this.temperatureGauge) {
        this.updateGauge(this.temperatureGauge, this.monitoringData.temperature, 35.0, 42.0, '#f56c6c')
      }

      // 更新趋势图
      this.updateTrendChart()

      // 检查异常并生成告警
      this.checkAbnormalData()
    },
    checkAbnormalData() {
      // 检查心率
      if (this.monitoringData.heartRate < 60 || this.monitoringData.heartRate > 100) {
        this.addAlert('心率', this.monitoringData.heartRate, 'bpm', '正常: 60-100 bpm', 'warning')
      }
      // 检查血氧
      if (this.monitoringData.spo2 < 95) {
        this.addAlert('血氧', this.monitoringData.spo2, '%', '正常: 95-100 %', 'danger')
      }
      // 检查收缩压
      if (this.monitoringData.systolic < 90 || this.monitoringData.systolic > 140) {
        this.addAlert('收缩压', this.monitoringData.systolic, 'mmHg', '正常: 90-140 mmHg', 'warning')
      }
      // 检查体温
      if (this.monitoringData.temperature < 36.0 || this.monitoringData.temperature > 37.2) {
        this.addAlert('体温', this.monitoringData.temperature, '°C', '正常: 36.0-37.2 °C', 'warning')
      }
    },
    addAlert(metric, value, unit, range, type) {
      // 获取当前时间
      const now = new Date()
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

      // 创建告警
      const alert = {
        time: timeStr,
        studentName: this.selectedStudent?.name || '未知',
        metric: metric,
        message: metric === '心率' ? (value < 60 ? '低于正常范围' : '高于正常范围') :
                 metric === '血氧' ? '低于正常范围' :
                 metric === '收缩压' ? (value < 90 ? '低于正常范围' : '高于正常范围') :
                 metric === '体温' ? (value < 36.0 ? '低于正常范围' : '高于正常范围') : '异常',
        value: value,
        unit: unit,
        range: range,
        type: type
      }

      // 添加到告警列表（限制最多10条）
      this.alerts.unshift(alert)
      if (this.alerts.length > 10) {
        this.alerts.pop()
      }
    },
    startMonitoring() {
      if (!this.monitoringInterval) {
        this.monitoringInterval = setInterval(() => {
          this.updateMonitoringData()
        }, 3000) // 每3秒更新一次
      }
      this.isMonitoring = true
    },
    stopMonitoring() {
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval)
        this.monitoringInterval = null
      }
      this.isMonitoring = false
    },
    toggleMonitoring() {
      if (this.isMonitoring) {
        this.stopMonitoring()
        this.$message.success('已暂停监测')
      } else {
        this.startMonitoring()
        this.$message.success('已开始监测')
      }
    },
    clearAlerts() {
      this.alerts = []
      this.$message.success('告警已清除')
    }
  }
}
</script>

<style scoped>
.realtime-monitoring-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 10px 0;
}

.back-btn {
  font-size: 14px;
  color: #606266;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.page-actions {
  display: flex;
  gap: 10px;
}

.student-section {
  margin-bottom: 24px;
}

.metrics-section {
  margin-bottom: 24px;
}

.metric-col {
  margin-bottom: 24px;
}

.metric-card {
  background-color: #fff;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
}

.metric-card .card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.metric-card .card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.metric-card .unit {
  font-size: 14px;
  color: #909399;
}

.metric-card .card-content {
  text-align: center;
  margin-bottom: 16px;
}

.metric-card .gauge-container {
  height: 150px;
  margin-bottom: 10px;
}

.metric-card .gauge {
  width: 100%;
  height: 100%;
}

.metric-card .metric-value {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.metric-card .current-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.metric-card .status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #67c23a;
}

.metric-card .status-indicator.abnormal {
  background-color: #f56c6c;
}

.metric-card .card-footer {
  text-align: center;
}

.metric-card .range {
  font-size: 12px;
  color: #909399;
}

.charts-section {
  margin-bottom: 24px;
}

.chart-col {
  margin-bottom: 24px;
}

.chart-card {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.chart-card .card-header {
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chart-card .card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-card .alert-count {
  background-color: #f56c6c;
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.chart-card .card-content {
  padding: 20px;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.alerts-section {
  margin-bottom: 24px;
}

.alert-item {
  padding: 10px;
  background-color: #fdf6ec;
  border-radius: 4px;
  border-left: 4px solid #e6a23c;
}

.alert-item .alert-content {
  font-weight: 600;
  margin-bottom: 5px;
}

.alert-item .alert-value {
  font-size: 12px;
  color: #909399;
}
</style>