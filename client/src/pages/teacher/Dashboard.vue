<template>
  <div class="teacher-dashboard">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">实时监控</h1>
    </div>

    <!-- 左右分栏布局 -->
    <div class="dashboard-layout">
      <!-- 左侧主要内容区（绿色框） -->
      <div class="main-content">
        <!-- 实时监控数据卡片 -->
        <el-row :gutter="24" class="cards-row">
          <!-- 在线人数 -->
          <el-col :xs="24" :sm="12" :md="12" :lg="12" class="card-col">
            <div class="metric-card online-card">
              <div class="card-header">
                <span class="card-title">学生在线人数</span>
                <el-tag type="success" size="small" class="status-tag">数据正常</el-tag>
              </div>
              <div class="card-content">
                <div class="chart-container">
                  <div id="onlineGaugeChart" class="gauge-chart"></div>
                </div>
                <div class="stat-values">
                  <div class="stat-item">
                    <span class="stat-number">544</span>
                    <span class="stat-label">在线</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">744</span>
                    <span class="stat-label">总人数</span>
                  </div>
                </div>
              </div>
            </div>
          </el-col>

          <!-- 训练模块 -->
          <el-col :xs="24" :sm="12" :md="12" :lg="12" class="card-col">
            <div class="metric-card training-card" @click="viewTrainingModule" style="cursor: pointer;">
              <div class="card-header">
                <span class="card-title">训练任务进度</span>
                <el-tag type="success" size="small" class="status-tag">进行中</el-tag>
              </div>
              <div class="card-content">
                <div class="progress-container">
                  <div class="progress-info">
                    <div class="progress-title">完成进度</div>
                    <div class="progress-percentage">{{ Math.round((completedTasks / totalTasks) * 100) }}%</div>
                  </div>
                  <div class="progress-bar-wrapper">
                    <div class="progress-bar" :style="{ width: (completedTasks / totalTasks) * 100 + '%' }"></div>
                  </div>
                  <div class="progress-stats">
                    <div class="stat">
                      <span class="stat-value">{{ completedTasks }}</span>
                      <span class="stat-label">已完成</span>
                    </div>
                    <div class="stat">
                      <span class="stat-value">{{ totalTasks - completedTasks }}</span>
                      <span class="stat-label">未完成</span>
                    </div>
                    <div class="stat">
                      <span class="stat-value">{{ totalTasks }}</span>
                      <span class="stat-label">总任务</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>

        <!-- 数据可视化区域 -->
        <el-row :gutter="24" class="cards-row">
          <!-- 运动数据管理 -->
          <el-col :xs="24" :lg="12" class="card-col">
            <div class="metric-card management-card" @click="viewDataManagement" style="cursor: pointer;">
              <div class="card-header">
                <span class="card-title">运动数据管理</span>
                <div class="card-actions">
                  <el-button type="text" size="small" class="action-btn" @click.stop="viewDataManagement">查看</el-button>
                  <el-button type="text" size="small" class="action-btn" @click.stop="analyzeData">分析</el-button>
                </div>
              </div>
              <div class="card-content">
                <div class="chart-container">
                  <div id="managementChart" class="line-chart"></div>
                </div>
              </div>
            </div>
          </el-col>

          <!-- 实时监测指标 -->
          <el-col :xs="24" :lg="12">
            <div class="metric-card realtime-card" @click="viewRealtimeMonitoring" style="cursor: pointer;">
              <div class="card-header">
                <span class="card-title">实时监测指标</span>
                <div class="card-actions">
                  <el-radio-group v-model="monitorType" size="small">
                    <el-radio-button label="预设"></el-radio-button>
                    <el-radio-button label="智能"></el-radio-button>
                  </el-radio-group>
                </div>
              </div>
              <div class="card-content">
                <div class="chart-container">
                  <div id="realtimeChart" class="bar-chart"></div>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 右侧快捷操作区（红色框） -->
      <div class="quick-actions-sidebar">
        <div class="quick-actions-card">
          <div class="card-header">
            <span class="card-title">快捷操作</span>
            <el-button type="text" size="small" class="close-btn">
              <i class="el-icon-close"></i>
            </el-button>
          </div>
          <div class="quick-actions-list">
            <div class="action-item" @click="generateReport">
              <div class="action-icon health-icon">
                <i class="el-icon-document"></i>
              </div>
              <div class="action-info">
                <span class="action-title">生成报告</span>
              </div>
            </div>
            <div class="action-item" @click="exportData">
              <div class="action-icon export-icon">
                <i class="el-icon-download"></i>
              </div>
              <div class="action-info">
                <span class="action-title">数据导出</span>
              </div>
            </div>
            <div class="action-item" @click="deviceManage">
              <div class="action-icon device-icon">
                <i class="el-icon-video-camera"></i>
              </div>
              <div class="action-info">
                <span class="action-title">设备管理</span>
              </div>
            </div>
            <div class="action-item" @click="studentManage">
              <div class="action-icon student-icon">
                <i class="el-icon-user"></i>
              </div>
              <div class="action-info">
                <span class="action-title">学生管理</span>
              </div>
            </div>
            <div class="action-item" @click="exercisePlan">
              <div class="action-icon plan-icon">
                <i class="el-icon-date"></i>
              </div>
              <div class="action-info">
                <span class="action-title">运动计划</span>
              </div>
            </div>
            <div class="action-item" @click="realTimeMonitor">
              <div class="action-icon monitor-icon">
                <i class="el-icon-view"></i>
              </div>
              <div class="action-info">
                <span class="action-title">实时监控</span>
              </div>
            </div>
            <div class="action-item" @click="healthAnalysis">
              <div class="action-icon analysis-icon">
                <i class="el-icon-data-analysis"></i>
              </div>
              <div class="action-info">
                <span class="action-title">健康分析</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts';

export default {
  name: 'TeacherDashboard',
  data() {
    return {
      monitorType: '预设',
      onlineGaugeChart: null,
      trainingProgressChart: null,
      managementChart: null,
      realtimeChart: null,
      completedTasks: 12,
      totalTasks: 20
    };
  },
  mounted() {
    this.initCharts();
    this.startRealTimeUpdate();
  },
  beforeDestroy() {
    if (this.onlineGaugeChart) this.onlineGaugeChart.dispose();
      if (this.trainingProgressChart) this.trainingProgressChart.dispose();
    if (this.managementChart) this.managementChart.dispose();
    if (this.realtimeChart) this.realtimeChart.dispose();
  },
  methods: {
    // 初始化图表
    initCharts() {
      this.initOnlineGaugeChart();
      this.initTrainingProgressChart();
      this.initManagementChart();
      this.initRealtimeChart();
    },
    
    // 初始化在线人数仪表盘
    initOnlineGaugeChart() {
      const chartDom = document.getElementById('onlineGaugeChart');
      if (!chartDom) return;
      
      this.onlineGaugeChart = echarts.init(chartDom);
      const option = {
        tooltip: {
          formatter: '{b}: {c}人'
        },
        series: [
          {
            name: '在线人数',
            type: 'gauge',
            radius: '70%',
            center: ['50%', '70%'],
            startAngle: 180,
            endAngle: 0,
            min: 0,
            max: 1000,
            splitNumber: 5,
            axisLine: {
              lineStyle: {
                width: 20,
                color: [
                  [0.3, '#22d3ee'],
                  [0.7, '#06b6d4'],
                  [1, '#ef4444']
                ]
              }
            },
            pointer: {
              icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
              length: '45%',
              width: 8,
              offsetCenter: [0, '-50%'],
              itemStyle: {
                color: '#ffffff'
              }
            },
            axisTick: {
              length: 10,
              lineStyle: {
                color: '#ffffff',
                width: 2
              }
            },
            splitLine: {
              length: 15,
              lineStyle: {
                color: '#ffffff',
                width: 3
              }
            },
            axisLabel: {
              color: '#ffffff',
              fontSize: 12,
              distance: -60,
              formatter: function (value) {
                return value + '人';
              }
            },
            title: {
              offsetCenter: [0, '-10%'],
              fontSize: 14,
              color: '#ffffff'
            },
            detail: {
              fontSize: 24,
              offsetCenter: [0, '20%'],
              valueAnimation: true,
              formatter: function (value) {
                return Math.round(value) + '人';
              },
              color: '#ffffff'
            },
            data: [
              {
                value: 544,
                name: '在线人数'
              }
            ]
          }
        ]
      };
      
      this.onlineGaugeChart.setOption(option);
      
      window.addEventListener('resize', () => {
        this.onlineGaugeChart.resize();
      });
    },
    
    // 训练任务进度已改为进度条展示，不再需要图表初始化
    initTrainingProgressChart() {
      // 进度条由Vue响应式数据直接控制，无需额外初始化
    },
    
    // 初始化运动数据管理图表
    initManagementChart() {
      const chartDom = document.getElementById('managementChart');
      if (!chartDom) return;
      
      this.managementChart = echarts.init(chartDom);
      const option = {
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'line',
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.3)',
              width: 1
            }
          },
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          textStyle: {
            color: '#334155'
          }
        },
        legend: {
          data: ['运动时长', '运动强度', '卡路里消耗'],
          top: '10px',
          textStyle: {
            color: '#ffffff'
          }
        },
        xAxis: {
          type: 'category',
          data: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
          axisLine: {
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.5)'
            }
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            color: 'rgba(255, 255, 255, 0.8)'
          }
        },
        yAxis: {
          type: 'value',
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            color: 'rgba(255, 255, 255, 0.8)'
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.2)',
              type: 'dashed'
            }
          }
        },
        series: [          {            name: '运动时长',            type: 'line',            data: [120, 200, 150, 80, 70, 110, 130],            lineStyle: {              color: '#ffffff',              width: 3            },            areaStyle: {              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [                {                  offset: 0,                  color: 'rgba(255, 255, 255, 0.3)'                },                {                  offset: 1,                  color: 'rgba(255, 255, 255, 0.05)'                }              ])            },            itemStyle: {              color: '#ffffff'            },            symbol: 'circle',            symbolSize: 8          }        ]
      };
      
      this.managementChart.setOption(option);
      
      window.addEventListener('resize', () => {
        this.managementChart.resize();
      });
    },
    
    // 初始化实时监测指标图表
    initRealtimeChart() {
      const chartDom = document.getElementById('realtimeChart');
      if (!chartDom) return;
      
      this.realtimeChart = echarts.init(chartDom);
      const option = {
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          textStyle: {
            color: '#334155'
          }
        },
        xAxis: {
          type: 'category',
          data: ['心率', '血氧', '血压', '体温'],
          axisLine: {
            lineStyle: {
              color: '#e2e8f0'
            }
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            color: '#64748b'
          }
        },
        yAxis: {
          type: 'value',
          axisLine: {
            lineStyle: {
              color: '#e2e8f0'
            }
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            color: '#64748b'
          },
          splitLine: {
            lineStyle: {
              color: '#f1f5f9',
              type: 'dashed'
            }
          }
        },
        series: [
          {
            name: '心率',
            type: 'bar',
            data: [85],
            itemStyle: {
              color: '#3b82f6'
            },
            barWidth: '30%'
          },
          {
            name: '血氧',
            type: 'bar',
            data: [98],
            itemStyle: {
              color: '#10b981'
            },
            barWidth: '30%'
          },
          {
            name: '血压',
            type: 'bar',
            data: [120],
            itemStyle: {
              color: '#3b82f6'
            },
            barWidth: '30%'
          },
          {
            name: '体温',
            type: 'bar',
            data: [36.5],
            itemStyle: {
              color: '#ef4444'
            },
            barWidth: '30%'
          }
        ]
      };
      
      this.realtimeChart.setOption(option);
      
      window.addEventListener('resize', () => {
        this.realtimeChart.resize();
      });
    },
    
    // 开始实时更新数据
    startRealTimeUpdate() {
      // 模拟实时数据更新
      setInterval(() => {
        this.updateCharts();
      }, 10000);
    },
    
    // 更新图表数据
    updateCharts() {
      // 模拟数据更新
      if (this.onlineGaugeChart) {
        this.onlineGaugeChart.setOption({
          series: [
            {
              data: [
                {
                  value: Math.floor(Math.random() * 200) + 450
                }
              ]
            }
          ]
        });
      }
      
      // 更新训练任务进度图
      if (this.trainingProgressChart) {
        // 模拟训练任务完成情况的随机变化
        const baseCompleted = 12;
        const baseTotal = 20;
        const completedVariation = Math.floor(Math.random() * 3) - 1; // -1, 0, 或 1
        const newCompleted = Math.max(0, Math.min(baseCompleted + completedVariation, baseTotal));
        
        // 更新数据属性，确保与图表同步
        this.completedTasks = newCompleted;
        
        this.trainingProgressChart.setOption({
          series: [
            {
              data: [
                {
                  value: newCompleted,
                  name: '已完成',
                  itemStyle: {
                    color: '#67C23A'
                  }
                },
                {
                  value: baseTotal - newCompleted,
                  name: '未完成',
                  itemStyle: {
                    color: '#E6A23C'
                  }
                }
              ]
            }
          ]
        });
      }
      
      // 更新运动数据管理图表
      if (this.managementChart) {
        const newData = [
          Math.floor(Math.random() * 100) + 100,
          Math.floor(Math.random() * 100) + 100,
          Math.floor(Math.random() * 100) + 100,
          Math.floor(Math.random() * 100) + 100,
          Math.floor(Math.random() * 100) + 100,
          Math.floor(Math.random() * 100) + 100,
          Math.floor(Math.random() * 100) + 100
        ];
        this.managementChart.setOption({
          series: [
            {
              data: newData
            }
          ]
        });
      }
      
      // 更新实时监测指标图表
      if (this.realtimeChart) {
        this.realtimeChart.setOption({
          series: [
            {
              name: '心率',
              data: [Math.floor(Math.random() * 30) + 70]
            },
            {
              name: '血氧',
              data: [Math.floor(Math.random() * 5) + 95]
            },
            {
              name: '血压',
              data: [Math.floor(Math.random() * 20) + 110]
            },
            {
              name: '体温',
              data: [Math.random() * 1 + 36]
            }
          ]
        });
      }
    },
    
    // 生成报告
    generateReport() {
      this.$message.success('跳转到训练报告页面');
      this.$router.push('/teacher/training-report');
    },
    
    // 数据导出
    exportData() {
      this.$message.success('数据导出功能');
    },
    
    // 设备管理
    deviceManage() {
      this.$message.success('跳转到设备管理页面');
      this.$router.push('/teacher/device-management');
    },
    
    // 学生管理
    studentManage() {
      this.$message.success('跳转到学生管理页面');
      this.$router.push('/teacher/student-management');
    },
    
    // 运动计划
    exercisePlan() {
      this.$message.success('跳转到训练模块页面');
      this.$router.push('/teacher/training-module');
    },
    
    // 实时监控
    realTimeMonitor() {
      this.$message.success('跳转到实时监测页面');
      this.$router.push('/teacher/realtime-monitoring');
    },
    
    // 查看训练模块
    viewTrainingModule() {
      this.$message.success('跳转到训练模块页面');
      this.$router.push('/teacher/training-module');
    },
    
    // 查看运动数据管理详情
    viewDataManagement() {
      this.$message.success('跳转到运动数据管理详情页面');
      this.$router.push('/teacher/data-management');
    },
    
    // 数据分析
    analyzeData() {
      this.$message.success('跳转到数据分析页面');
      this.$router.push('/teacher/data-analysis');
    },
    
    // 查看实时监测指标详情
    viewRealtimeMonitoring() {
      this.$message.success('跳转到实时监测指标详情页面');
      this.$router.push('/teacher/realtime-monitoring');
    },
    
    // 健康分析
    healthAnalysis() {
      this.$message.success('跳转到数据分析页面');
      this.$router.push('/teacher/data-analysis');
    }
  }
};
</script>

<style scoped>
.teacher-dashboard {
  padding: 24px;
  min-height: calc(100vh - 100px);
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 指标卡片样式 */
.metric-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
}

.metric-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.metric-card .card-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}

.metric-card .status-tag {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  border: none;
}

.metric-card .card-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.metric-card .action-btn {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.metric-card .action-btn:hover {
  color: #ffffff;
}

.metric-card .card-content {
  padding: 24px;
}

/* 图表容器 */
.chart-container {
  height: 320px; /* 进一步增加图表高度以显示完整仪表盘 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
}

/* 指标卡片高度统一 */
.metric-card {
  height: 400px; /* 增加卡片高度，确保图表有足够空间完整显示 */
}

/* 运动数据统计卡片特殊处理，添加底部间距确保与在线人数卡片对齐 */
.data-card .card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100% - 60px); /* 减去头部高度 */
}

.gauge-chart {
  width: 100%;
  height: 100%;
}

.line-chart {
  width: 100%;
  height: 100%;
}

.bar-chart {
  width: 100%;
  height: 100%;
}

/* 统计数据 */
.stat-values {
  display: flex;
  justify-content: space-around;
  margin-top: 16px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #1e3a8a;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}

/* 卡片颜色主题 */
.online-card {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.training-card {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.data-card {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
}

.management-card {
  background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
}

.realtime-card {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.realtime-card .card-title {
  color: #334155;
}

/* 快捷操作卡片 */
.quick-actions-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  transition: all 0.3s ease;
}

.quick-actions-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
}

.quick-actions-card .card-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quick-actions-card .card-title {
  font-size: 18px;
  font-weight: 600;
  color: #334155;
  margin: 0;
}

.quick-actions-card .close-btn {
  color: #64748b;
  padding: 0;
}

.quick-actions-list {
  padding: 16px;
}

.action-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 16px;
}

/* 新增快捷操作图标样式 */
.student-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.plan-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.monitor-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.notification-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.analysis-icon {
  background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
}

.monitoring-icon {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.action-item:hover {
  background-color: rgba(59, 130, 246, 0.1);
  transform: translateX(8px);
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #ffffff;
}

.health-icon {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.export-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.settings-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.device-icon {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.action-info {
  flex: 1;
}

.action-title {
  font-size: 16px;
  font-weight: 600;
  color: #334155;
}

/* 左右分栏布局 */
.dashboard-layout {
  display: flex;
  gap: 24px;
  margin-top: 24px;
  height: auto; /* 改为自动高度，避免强制滚动 */
}

/* 左侧主要内容区 */
.main-content {
  flex: 1; /* 左侧占主要空间 */
  overflow-y: auto;
}

/* 右侧快捷操作区 */
.quick-actions-sidebar {
  width: 300px; /* 右侧固定宽度 */
  display: flex;
  flex-direction: column;
}

/* 卡片行样式 */
.cards-row {
  margin-top: 0;
  margin-bottom: 24px;
  height: auto;
  min-height: 280px;
}

/* 卡片列样式 */
.card-col {
  height: 100%;
}

/* 快捷操作卡片高度自适应 */
.quick-actions-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.quick-actions-list {
  flex: 1;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .dashboard-layout {
    flex-direction: column;
    height: auto;
  }
  
  .quick-actions-sidebar {
    width: 100%;
    height: auto;
  }
  
  .quick-actions-card {
    height: auto;
  }
}

.progress-container {
    padding: 10px 20px;
  }
  
  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .progress-title {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
  }
  
  .progress-percentage {
    font-size: 24px;
    font-weight: bold;
    color: #ffffff;
  }
  
  .progress-bar-wrapper {
    width: 100%;
    height: 12px;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 15px;
  }
  
  .progress-bar {
    height: 100%;
    background-color: #ffffff;
    border-radius: 6px;
    transition: width 0.3s ease;
  }
  
  .progress-stats {
    display: flex;
    justify-content: space-around;
    align-items: center;
  }
  
  .progress-stats .stat {
    text-align: center;
  }
  
  .progress-stats .stat-value {
    display: block;
    font-size: 20px;
    font-weight: bold;
    color: #ffffff;
  }
  
  .progress-stats .stat-label {
    display: block;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    margin-top: 2px;
  }

@media (max-width: 768px) {
  .teacher-dashboard {
    padding: 16px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .dashboard-layout {
    gap: 16px;
    margin-top: 16px;
  }
  
  .metric-card .card-header {
    padding: 16px 20px;
  }
  
  .metric-card .card-content {
    padding: 20px;
  }
  
  .chart-container {
    height: 200px;
  }
  
  .action-item {
    padding: 12px;
  }
  
  .action-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
}
</style>