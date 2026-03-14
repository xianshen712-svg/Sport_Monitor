<template>
  <div class="admin-dashboard">
    <alert-notification></alert-notification>
    <el-card shadow="hover" class="page-header">
      <h2>系统仪表盘</h2>
      <p>欢迎回来，{{ userInfo.name }} | {{ currentDate }}</p>
    </el-card>
    
    <!-- 顶部数据概览区 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="12" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon online">
              <i class="el-icon-monitor"></i>
            </div>
            <div class="stat-info">
              <div class="stat-title">在线设备数</div>
              <div class="stat-value">{{ onlineCount }}</div>
              <div class="stat-subtitle">
                设备总数：{{ totalDevices }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="12" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon heart">
              <i class="el-icon-medal"></i>
            </div>
            <div class="stat-info">
              <div class="stat-title">平均心率</div>
              <div class="stat-value">{{ avgHeartRate }} <span class="unit">bpm</span></div>
              <div class="stat-subtitle">
                正常范围：60-120 bpm
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="12" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon data">
              <i class="el-icon-data-line"></i>
            </div>
            <div class="stat-info">
              <div class="stat-title">今日数据量</div>
              <div class="stat-value">{{ todayDataCount }}</div>
              <div class="stat-subtitle">
                条设备数据记录
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="12" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon warning">
              <i class="el-icon-warning"></i>
            </div>
            <div class="stat-info">
              <div class="stat-title">异常告警</div>
              <div class="stat-value warning">{{ warningCount }}</div>
              <div class="stat-subtitle">
                心率异常设备
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 实时设备监控 -->
    <el-card shadow="hover" class="monitor-card" style="margin-top:20px">
      <template #header>
        <span>实时设备监控</span>
        <el-button type="primary" size="small" @click="fetchData">
          <i class="el-icon-refresh"></i> 刷新
        </el-button>
      </template>
      <el-table 
        :data="deviceList" 
        style="width:100%" 
        height="400"
        v-loading="loading"
      >
        <el-table-column prop="mac" label="设备地址" width="180" />
        <el-table-column prop="student_name" label="学生姓名" width="120">
          <template #default="{ row }">
            {{ row.student_name || '未绑定' }}
          </template>
        </el-table-column>
        <el-table-column prop="heartRate" label="实时心率" width="120">
          <template #default="{ row }">
            <span :class="{ 'abnormal': row.heartRate && (row.heartRate < 60 || row.heartRate > 120) }">
              {{ row.heartRate || '--' }} <span class="unit">bpm</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'online' ? 'success' : 'danger'">
              {{ row.status === 'online' ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastUpdateTime" label="最后更新" width="180">
          <template #default="{ row }">
            {{ formatDate(row.lastUpdateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="text" size="small" @click="viewDeviceDetail(row.id)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 数据统计图表 -->
    <el-row :gutter="20" class="charts-section">
      <el-col :xs="24" :sm="24" :md="12" :lg="8">
        <el-card shadow="hover" class="chart-card">
          <div class="chart-header">
            <h3>用户增长趋势</h3>
            <el-select v-model="timeRange" placeholder="时间范围" size="small">
              <el-option label="最近7天" value="7"></el-option>
              <el-option label="最近30天" value="30"></el-option>
              <el-option label="最近90天" value="90"></el-option>
            </el-select>
          </div>
          <div class="chart-container">
            <div id="userGrowthChart" ref="userGrowthChart" style="width: 100%; height: 250px;"></div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="12" :lg="8">
        <el-card shadow="hover" class="chart-card">
          <div class="chart-header">
            <h3>设备在线状态</h3>
          </div>
          <div class="chart-container">
            <div id="deviceStatusChart" ref="deviceStatusChart" style="width: 100%; height: 250px;"></div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="24" :lg="8">
        <el-card shadow="hover" class="chart-card">
          <div class="chart-header">
            <h3>用户角色分布</h3>
          </div>
          <div class="chart-container">
            <div id="userRoleChart" ref="userRoleChart" style="width: 100%; height: 250px;"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 最新动态 -->
    <el-row :gutter="20" class="activity-section">
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <el-card shadow="hover" class="activity-card">
          <div class="activity-header">
            <h3>系统日志</h3>
            <el-button type="primary" size="small" @click="refreshLogs">
              <i class="el-icon-refresh"></i> 刷新
            </el-button>
          </div>
          <div class="activity-list">
            <el-timeline>
              <el-timeline-item
                v-for="(log, index) in systemLogs"
                :key="index"
                :timestamp="log.time"
                :type="log.type"
                placement="top"
              >
                {{ log.content }}
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <el-card shadow="hover" class="activity-card">
          <div class="activity-header">
            <h3>设备异常信息</h3>
            <el-button type="primary" size="small" @click="refreshDeviceAlerts">
              <i class="el-icon-refresh"></i> 刷新
            </el-button>
          </div>
          <div class="activity-list">
            <el-table
              :data="deviceAlerts"
              border
              stripe
              style="width: 100%"
              height="250"
            >
              <el-table-column prop="deviceId" label="设备ID" width="120" align="center"></el-table-column>
              <el-table-column prop="studentName" label="学生姓名" width="100" align="center"></el-table-column>
              <el-table-column prop="alertType" label="异常类型" width="100" align="center">
                <template v-slot="scope">
                  <el-tag :type="getAlertTypeColor(scope.row.alertType)">
                    {{ scope.row.alertType }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="alertTime" label="发生时间" width="180" align="center"></el-table-column>
              <el-table-column prop="status" label="状态" width="100" align="center">
                <template v-slot="scope">
                  <el-tag :type="scope.row.status === '未处理' ? 'danger' : 'success'">
                    {{ scope.row.status }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as echarts from 'echarts';
import AlertNotification from '../../components/AlertNotification.vue';
import { alertService } from '../../services/AlertService';

export default {
  name: 'AdminDashboard',
  components: {
    AlertNotification
  },
  data() {
    return {
      userInfo: {
        name: '管理员',
        adminId: 'Admin001',
        role: 'super_admin'
      },
      currentDate: '',
      timeRange: '7',
      // 实时监控数据
      onlineCount: 0,
      avgHeartRate: 0,
      todayDataCount: 0,
      warningCount: 0,
      totalDevices: 0,
      deviceList: [],
      loading: false,
      // 系统日志
      systemLogs: [
        { time: '2023-11-01 14:30:25', content: '用户Admin001登录系统', type: 'primary' },
        { time: '2023-11-01 14:25:10', content: '设备DEVICE1001离线', type: 'danger' },
        { time: '2023-11-01 14:20:45', content: '新增用户Student001', type: 'success' },
        { time: '2023-11-01 14:15:30', content: '系统备份完成', type: 'info' },
        { time: '2023-11-01 14:10:15', content: '教师Teacher001更新班级信息', type: 'warning' }
      ],
      // 设备异常信息
      deviceAlerts: [
        { deviceId: 'DEVICE1001', studentName: '曹睿焜', alertType: '设备离线', alertTime: '2023-11-01 14:25:10', status: '未处理' },
        { deviceId: 'DEVICE1002', studentName: '张小明', alertType: '数据异常', alertTime: '2023-11-01 14:20:05', status: '已处理' },
        { deviceId: 'DEVICE1003', studentName: '王小红', alertType: '低电量', alertTime: '2023-11-01 14:15:40', status: '未处理' },
        { deviceId: 'DEVICE1004', studentName: '赵小刚', alertType: '心率异常', alertTime: '2023-11-01 14:10:25', status: '已处理' },
        { deviceId: 'DEVICE1005', studentName: '李小丽', alertType: '血氧异常', alertTime: '2023-11-01 14:05:10', status: '未处理' }
      ],
      // 图表实例
      userGrowthChart: null,
      deviceStatusChart: null,
      userRoleChart: null,
      // 自动刷新定时器
      autoRefreshInterval: null
    };
  },
  mounted() {
    // 设置当前日期
    this.setCurrentDate();
    
    // 初始化图表
    this.initCharts();
    
    // 开始定时刷新数据
    this.startAutoRefresh();
    
    // 初始化检查设备预警
    this.checkDeviceAlerts();
    
    // 首次加载数据
    this.fetchData();
  },
  beforeDestroy() {
    // 销毁图表实例
    if (this.userGrowthChart) {
      this.userGrowthChart.dispose();
    }
    if (this.deviceStatusChart) {
      this.deviceStatusChart.dispose();
    }
    if (this.userRoleChart) {
      this.userRoleChart.dispose();
    }
    
    // 清除定时器
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
  },
  watch: {
    timeRange() {
      // 时间范围变化时重新加载用户增长图表
      this.loadUserGrowthChart();
    }
  },
  methods: {
    // 设置当前日期
    setCurrentDate() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      this.currentDate = `${year}-${month}-${day} ${hours}:${minutes}`;
    },
    
    // 获取数据
    async fetchData() {
      this.loading = true;
      try {
        // 1. 获取设备列表
        const deviceRes = await this.$axios.get('/api/devices');
        const devices = deviceRes.data.data || [];
        this.totalDevices = devices.length;
        
        // 2. 获取设备最新数据
        const dataRes = await this.$axios.get('/api/device-data/latest');
        const latestData = dataRes.data.data || [];
        
        // 3. 合并数据
        this.deviceList = devices.map(device => {
          const deviceData = latestData.find(d => d.device_id === device.mac);
          return {
            ...device,
            heartRate: deviceData?.heart_rate || null,
            lastUpdateTime: deviceData?.record_time || null
          };
        });
        
        // 4. 计算统计数据
        this.onlineCount = this.deviceList.filter(d => d.status === 'online').length;
        
        const validHeartRates = this.deviceList
          .map(d => d.heartRate)
          .filter(rate => rate !== null && rate !== undefined);
        
        if (validHeartRates.length > 0) {
          const sum = validHeartRates.reduce((a, b) => a + b, 0);
          this.avgHeartRate = (sum / validHeartRates.length).toFixed(1);
        } else {
          this.avgHeartRate = 0;
        }
        
        this.warningCount = this.deviceList.filter(d => 
          d.heartRate && (d.heartRate < 60 || d.heartRate > 120)
        ).length;
        
        // 5. 获取今日数据量
        const today = new Date().toISOString().split('T')[0];
        const countRes = await this.$axios.get(`/api/device-data/count?date=${today}`);
        this.todayDataCount = countRes.data.count || 0;
        
        this.$message.success('数据刷新成功');
      } catch (error) {
        console.error('获取数据失败:', error);
        this.$message.error('获取数据失败');
        
        // 使用模拟数据
        this.useMockData();
      } finally {
        this.loading = false;
      }
    },
    
    // 使用模拟数据
    useMockData() {
      // 模拟设备数据
      this.deviceList = [
        { id: 1, mac: '00:11:22:33:44:55', student_name: '曹睿焜', status: 'online', heartRate: 78, lastUpdateTime: new Date().toISOString() },
        { id: 2, mac: '00:11:22:33:44:56', student_name: '张小明', status: 'online', heartRate: 85, lastUpdateTime: new Date().toISOString() },
        { id: 3, mac: '00:11:22:33:44:57', student_name: '李小红', status: 'offline', heartRate: null, lastUpdateTime: null },
        { id: 4, mac: '00:11:22:33:44:58', student_name: '王大明', status: 'online', heartRate: 125, lastUpdateTime: new Date().toISOString() },
        { id: 5, mac: '00:11:22:33:44:59', student_name: null, status: 'online', heartRate: 92, lastUpdateTime: new Date().toISOString() }
      ];
      
      this.totalDevices = this.deviceList.length;
      this.onlineCount = this.deviceList.filter(d => d.status === 'online').length;
      
      const validHeartRates = this.deviceList
        .map(d => d.heartRate)
        .filter(rate => rate !== null && rate !== undefined);
      
      if (validHeartRates.length > 0) {
        const sum = validHeartRates.reduce((a, b) => a + b, 0);
        this.avgHeartRate = (sum / validHeartRates.length).toFixed(1);
      } else {
        this.avgHeartRate = 0;
      }
      
      this.warningCount = this.deviceList.filter(d => 
        d.heartRate && (d.heartRate < 60 || d.heartRate > 120)
      ).length;
      
      this.todayDataCount = 12580;
    },
    
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '--';
      try {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN');
      } catch (error) {
        return dateString;
      }
    },
    
    // 查看设备详情
    viewDeviceDetail(deviceId) {
      this.$router.push(`/admin/device-manage`);
    },
    
    // 初始化图表
    initCharts() {
      this.$nextTick(() => {
        this.loadUserGrowthChart();
        this.loadDeviceStatusChart();
        this.loadUserRoleChart();
      });
    },
    
    // 加载用户增长图表
    loadUserGrowthChart() {
      // 模拟数据
      const dates = [];
      const counts = [];
      const now = new Date();
      const days = parseInt(this.timeRange);
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        dates.push(`${date.getMonth() + 1}/${date.getDate()}`);
        counts.push(Math.floor(Math.random() * 20) + 5);
      }
      
      // 初始化图表
      if (!this.userGrowthChart) {
        this.userGrowthChart = echarts.init(this.$refs.userGrowthChart);
      }
      
      const option = {
        tooltip: {
          trigger: 'axis'
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
          data: dates
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '新增用户',
            type: 'line',
            stack: '总量',
            data: counts,
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [{
                  offset: 0, color: 'rgba(64, 158, 255, 0.5)'
                }, {
                  offset: 1, color: 'rgba(64, 158, 255, 0.1)'
                }]
              }
            },
            lineStyle: {
              color: '#409EFF'
            },
            itemStyle: {
              color: '#409EFF'
            }
          }
        ]
      };
      
      this.userGrowthChart.setOption(option);
      
      // 监听窗口大小变化，调整图表大小
      window.addEventListener('resize', () => {
        this.userGrowthChart.resize();
      });
    },
    
    // 加载设备状态图表
    loadDeviceStatusChart() {
      // 模拟数据
      const data = [
        { value: 485, name: '在线设备' },
        { value: 15, name: '离线设备' }
      ];
      
      // 初始化图表
      if (!this.deviceStatusChart) {
        this.deviceStatusChart = echarts.init(this.$refs.deviceStatusChart);
      }
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          data: ['在线设备', '离线设备']
        },
        series: [
          {
            name: '设备状态',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: data
          }
        ]
      };
      
      this.deviceStatusChart.setOption(option);
      
      // 监听窗口大小变化，调整图表大小
      window.addEventListener('resize', () => {
        this.deviceStatusChart.resize();
      });
    },
    
    // 加载用户角色分布图表
    loadUserRoleChart() {
      // 模拟数据
      const data = [
        { value: 500, name: '学生' },
        { value: 20, name: '教师' },
        { value: 3, name: '管理员' }
      ];
      
      // 初始化图表
      if (!this.userRoleChart) {
        this.userRoleChart = echarts.init(this.$refs.userRoleChart);
      }
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          data: ['学生', '教师', '管理员']
        },
        series: [
          {
            name: '用户角色',
            type: 'pie',
            radius: '50%',
            data: data,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      };
      
      this.userRoleChart.setOption(option);
      
      // 监听窗口大小变化，调整图表大小
      window.addEventListener('resize', () => {
        this.userRoleChart.resize();
      });
    },
    
    // 刷新系统日志
    refreshLogs() {
      this.$message.success('系统日志已刷新');
    },
    
    // 刷新设备异常信息
    refreshDeviceAlerts() {
      this.$message.success('设备异常信息已刷新');
    },
    
    // 获取预警类型颜色
    getAlertTypeColor(type) {
      switch (type) {
        case '设备离线': return 'danger';
        case '数据异常': return 'warning';
        case '低电量': return 'info';
        case '心率异常': return 'danger';
        case '血氧异常': return 'danger';
        default: return 'default';
      }
    },
    
    // 开始定时刷新数据
    startAutoRefresh() {
      this.autoRefreshInterval = setInterval(() => {
        // 自动刷新数据
        this.fetchData();
        
        // 更新当前时间
        this.setCurrentDate();
        
        // 检查设备异常预警
        this.checkDeviceAlerts();
      }, 30000); // 每30秒刷新一次
    },
    
    // 检查设备异常预警
    checkDeviceAlerts() {
      // 遍历设备异常信息，添加预警
      this.deviceAlerts.forEach(alert => {
        if (alert.status === '未处理') {
          alertService.addAlert({
            type: 'device',
            level: this.getAlertTypeColor(alert.alertType) === 'danger' ? 'critical' : 'warning',
            title: '设备异常告警',
            message: `设备 ${alert.deviceId} - ${alert.studentName}：${alert.alertType}`,
            deviceId: alert.deviceId,
            timestamp: alert.alertTime
          });
        }
      });
    },
    
    // 组件挂载时初始化
    mounted() {
      // 初始化检查设备预警
      this.checkDeviceAlerts();
    }
  },
  
  beforeDestroy() {
    // 清除定时器
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    
    // 清除图表实例
    if (this.userGrowthChart) {
      this.userGrowthChart.dispose();
    }
    if (this.deviceStatusChart) {
      this.deviceStatusChart.dispose();
    }
    if (this.userRoleChart) {
      this.userRoleChart.dispose();
    }
  }
};
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
  background-color: #f5f7fa;
  height: 100%;
  overflow-y: auto;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 10px 0;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #606266;
}

.overview-section {
  margin-bottom: 20px;
}

.overview-card {
  height: 100%;
}

.overview-content {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.overview-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 20px;
}

.overview-icon.primary {
  background-color: rgba(96, 108, 255, 0.1);
  color: #606CFF;
}

.overview-icon.success {
  background-color: rgba(103, 194, 58, 0.1);
  color: #67C23A;
}

.overview-icon.warning {
  background-color: rgba(230, 162, 60, 0.1);
  color: #E6A23C;
}

.overview-icon.danger {
  background-color: rgba(245, 108, 108, 0.1);
  color: #F56C6C;
}

.overview-info {
  flex: 1;
}

.overview-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.overview-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 5px;
}

.overview-subtitle {
  font-size: 12px;
  color: #909399;
}

.charts-section {
  margin-bottom: 20px;
}

.chart-card {
  height: 100%;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.chart-container {
  width: 100%;
  height: 250px;
}

.activity-section {
  margin-bottom: 20px;
}

.activity-card {
  height: 100%;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.activity-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.activity-list {
  max-height: 300px;
  overflow-y: auto;
}

.text-success {
  color: #67C23A;
}

.text-danger {
  color: #F56C6C;
}
</style>