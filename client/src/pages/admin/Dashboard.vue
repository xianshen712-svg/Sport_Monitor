<template>
  <div class="dashboard-container">
    <!-- 顶部通知 -->
    <alert-notification></alert-notification>

    <!-- 头部 -->
    <div class="dashboard-header">
      <div class="header-left">
        <h1>系统仪表盘</h1>
        <p>{{ currentDate }} | 实时监控中心</p>
      </div>
      <div class="header-right">
        <el-button type="success" icon="el-icon-download" @click="exportExcel">
          导出 Excel
        </el-button>
        <el-button type="primary" icon="el-icon-refresh" @click="fetchData">
          刷新数据
        </el-button>
        <div class="ws-status" :class="wsConnected ? 'online' : 'offline'">
          <span class="dot"></span>
          {{ wsConnected ? 'WebSocket 已连接' : 'WebSocket 断开' }}
        </div>
      </div>
    </div>

    <!-- 数据概览卡片 -->
    <el-row :gutter="24" class="stats-row">
      <el-col :lg="6" :md="12" :sm="12" :xs="24" v-for="(item, idx) in statCards" :key="idx">
        <div class="stat-card" :style="{ background: item.bg }" @click="goPage(item.to)">
          <div class="icon">{{ item.icon }}</div>
          <div class="info">
            <p class="title">{{ item.title }}</p>
            <p class="value">{{ item.value }}</p>
            <p class="sub">{{ item.sub }}</p>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 实时设备监控 -->
    <el-card shadow="never" class="panel-card device-table-card">
      <template #header>
        <div class="card-header">
          <span>实时设备监控</span>
          <el-tag type="success" v-if="!loading">实时更新中</el-tag>
        </div>
      </template>
      <el-table :data="deviceList" height="420" v-loading="loading" border stripe>
        <el-table-column prop="mac" label="设备MAC" width="180" />
        <el-table-column prop="student_name" label="学生姓名" width="130" />
        <el-table-column prop="heartRate" label="实时心率" width="130">
          <template #default="{ row }">
            <span :class="row.heartRate < 60 || row.heartRate > 120 ? 'text-danger' : 'text-normal'">
              {{ row.heartRate || '--' }} bpm
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="设备状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'online' ? 'success' : row.status === 'error' ? 'danger' : 'info'">
              {{ row.status === 'online' ? '在线' : row.status === 'error' ? '故障' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastUpdateTime" label="最后心跳" width="200" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="text" @click="viewDeviceDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 图表区域 -->
    <el-row :gutter="24" class="chart-row">
      <el-col :lg="8" :md="24" :sm="24" :xs="24">
        <el-card shadow="never" class="panel-card">
          <h3 class="card-title">健康异常趋势</h3>
          <div ref="chartHealth" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :lg="8" :md="24" :sm="24" :xs="24">
        <el-card shadow="never" class="panel-card">
          <h3 class="card-title">运动类型分布</h3>
          <div ref="chartSport" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :lg="8" :md="24" :sm="24" :xs="24">
        <el-card shadow="never" class="panel-card">
          <h3 class="card-title">设备状态分布</h3>
          <div ref="chartDevice" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 告警列表 -->
    <el-card shadow="never" class="panel-card alert-card">
      <template #header>
        <div class="card-header">
          <span>待处理告警（紧急优先）</span>
          <el-button type="danger" plain size="small" @click="refreshAlerts">刷新</el-button>
        </div>
      </template>
      <el-table :data="sortedAlerts" height="280" border stripe>
        <el-table-column label="级别" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.level === 'critical' ? 'danger' : 'warning'">
              {{ row.level === 'critical' ? '紧急' : '提醒' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deviceId" label="设备ID" width="160" />
        <el-table-column prop="studentName" label="学生姓名" width="130" />
        <el-table-column prop="alertType" label="异常类型" />
        <el-table-column prop="alertTime" label="时间" width="200" />
        <el-table-column label="操作" width="120" align="center">
          <el-button type="text" @click="handleAlert(row)">处理告警</el-button>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import AlertNotification from '../../components/AlertNotification.vue'
import { alertService } from '../../services/AlertService'
import * as XLSX from 'xlsx'

export default {
  name: 'DashboardAdvanced',
  components: { AlertNotification },
  data() {
    return {
      userInfo: { name: '管理员' },
      currentDate: '',
      loading: false,
      ws: null,
      wsConnected: false,
      stats: {
        totalUsers: 523,
        dailyActiveUsers: 156,
        monthlyActiveUsers: 423,
        onlineDevices: 0,
        offlineDevices: 0,
        errorDevices: 0,
        todayDataCount: 12580,
        totalAlerts: 28,
        pendingAlerts: 0,
        criticalAlerts: 0
      },
      deviceList: [],
      deviceAlerts: [
        { level: 'critical', deviceId: 'DEVICE001', studentName: '曹睿焜', alertType: '心率异常', alertTime: '2025-12-20 14:22:11', status: '未处理' },
        { level: 'warning', deviceId: 'DEVICE002', studentName: '张小明', alertType: '睡眠异常', alertTime: '2025-12-20 13:15:00', status: '未处理' },
        { level: 'critical', deviceId: 'DEVICE005', studentName: '王小红', alertType: '设备离线', alertTime: '2025-12-20 12:10:33', status: '未处理' },
      ],
      charts: {},
      autoRefresh: null
    }
  },
  computed: {
    sortedAlerts() {
      return [...this.deviceAlerts].sort((a, b) => a.level === 'critical' ? -1 : 1)
    },
    statCards() {
      return [
        { title: '总用户数', value: this.stats.totalUsers, sub: `日活 ${this.stats.dailyActiveUsers}`, bg: 'linear-gradient(135deg,#409EFF,#64a8ff)', icon: '👤', to: 'users' },
        { title: '在线设备', value: this.stats.onlineDevices, sub: `离线 ${this.stats.offlineDevices}`, bg: 'linear-gradient(135deg,#67C23A,#85d655)', icon: '🖥️', to: 'devices' },
        { title: '今日数据', value: this.stats.todayDataCount, sub: `总告警 ${this.stats.totalAlerts}`, bg: 'linear-gradient(135deg,#E6A23C,#f8b85e)', icon: '📊', to: 'data' },
        { title: '待处理告警', value: this.stats.pendingAlerts, sub: `紧急 ${this.stats.criticalAlerts}`, bg: 'linear-gradient(135deg,#F56C6C,#ff8888)', icon: '⚠️', to: 'alerts' },
      ]
    }
  },
  mounted() {
    this.setTime()
    this.initCharts()
    this.initWebSocket()
    this.fetchData()
    this.startTimer()
  },
  beforeDestroy() {
    clearInterval(this.autoRefresh)
    if (this.ws) this.ws.close()
    Object.values(this.charts).forEach(c => c.dispose())
  },
  methods: {
    setTime() {
      this.currentDate = new Date().toLocaleString('zh-CN')
    },
    startTimer() {
      this.autoRefresh = setInterval(() => this.setTime(), 1000)
    },

    // WebSocket 实时心跳
    initWebSocket() {
      try {
        // 可替换为你的后端 WS 地址
        this.ws = new WebSocket('ws://localhost:3001/ws')
        this.ws.onopen = () => {
          this.wsConnected = true
          console.log('WebSocket 连接成功')
        }
        this.ws.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data)
            this.handleWsMessage(data)
          } catch (e) {}
        }
        this.ws.onclose = () => {
          this.wsConnected = false
          setTimeout(() => this.initWebSocket(), 5000)
        }
        this.ws.onerror = () => {
          this.wsConnected = false
        }
      } catch (e) {
        this.wsConnected = false
      }
    },
    handleWsMessage(data) {
      if (!data.mac) return
      const idx = this.deviceList.findIndex(d => d.mac === data.mac)
      if (idx === -1) return
      this.deviceList[idx].heartRate = data.heartRate
      this.deviceList[idx].lastUpdateTime = new Date().toLocaleString()
      this.deviceList[idx].status = 'online'
      this.calcStats()
    },

    // 导出 Excel
    exportExcel() {
      const exportData = this.deviceList.map(d => ({
        '设备MAC': d.mac,
        '学生姓名': d.student_name || '未绑定',
        '实时心率': d.heartRate || '--',
        '设备状态': d.status === 'online' ? '在线' : d.status === 'error' ? '故障' : '离线',
        '最后心跳时间': d.lastUpdateTime || '--'
      }))
      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '设备实时数据')
      XLSX.writeFile(wb, `设备监控数据_${new Date().toLocaleDateString()}.xlsx`)
      this.$message.success('Excel 导出成功')
    },

    async fetchData() {
      this.loading = true
      try {
        // 尝试从后端API获取数据
        const [deviceRes, statsRes] = await Promise.allSettled([
          this.$axios.get('/api/device-data/latest'),
          this.$axios.get('/api/device-data/stats')
        ]);
        
        let apiDevices = [];
        let apiStats = null;
        
        // 处理设备数据响应
        if (deviceRes.status === 'fulfilled' && deviceRes.value.data && deviceRes.value.data.success) {
          apiDevices = deviceRes.value.data.data || [];
        }
        
        // 处理统计数据响应
        if (statsRes.status === 'fulfilled' && statsRes.value.data && statsRes.value.data.success) {
          apiStats = statsRes.value.data.data;
        }
        
        if (apiDevices.length > 0 || apiStats) {
          // 使用API数据
          if (apiDevices.length > 0) {
            this.deviceList = apiDevices.map(device => ({
              id: device.device_id,
              mac: device.device_id,
              student_name: device.student_name,
              heartRate: device.heart_rate,
              status: device.status || (device.heart_rate ? 'online' : 'offline'),
              lastUpdateTime: device.record_time ? new Date(device.record_time).toLocaleString() : '--'
            }));
          }
          
          if (apiStats) {
            this.stats = {
              ...this.stats,
              ...apiStats
            };
          }
          
          this.$message.success('数据刷新成功');
        } else {
          // 如果没有API数据，使用模拟数据
          this.useMockData();
          this.$message.info('使用模拟数据展示');
        }
      } catch (error) {
        console.error('获取数据失败:', error);
        // 使用模拟数据
        this.useMockData();
        this.$message.warning('使用模拟数据展示');
      } finally {
        this.calcStats();
        this.updateCharts();
        this.loading = false;
      }
    },
    useMockData() {
      const list = []
      const names = ['曹睿焜', '张小明', '王小红', '李小丽', '赵小刚', '刘华', '陈军', '杨芳', '黄伟', '周强']
      for (let i = 1; i <= 12; i++) {
        const status = i <= 8 ? 'online' : i <= 10 ? 'offline' : 'error'
        list.push({
          id: i,
          mac: `00:1A:2B:3C:4D:${i + 50}`,
          student_name: names[i % names.length],
          heartRate: 60 + Math.floor(Math.random() * 60),
          status,
          lastUpdateTime: new Date().toLocaleString()
        })
      }
      this.deviceList = list
    },
    calcStats() {
      this.stats.onlineDevices = this.deviceList.filter(d => d.status === 'online').length
      this.stats.offlineDevices = this.deviceList.filter(d => d.status === 'offline').length
      this.stats.errorDevices = this.deviceList.filter(d => d.status === 'error').length
      this.stats.pendingAlerts = this.deviceAlerts.length
      this.stats.criticalAlerts = this.deviceAlerts.filter(a => a.level === 'critical').length
    },

    // 图表
    initCharts() {
      this.$nextTick(() => {
        this.charts.health = echarts.init(this.$refs.chartHealth)
        this.charts.sport = echarts.init(this.$refs.chartSport)
        this.charts.device = echarts.init(this.$refs.chartDevice)
        this.updateCharts()
      })
    },
    updateCharts() {
      this.charts.health.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: 10, right: 10, bottom: 10, top: 20 },
        xAxis: { data: ['12-13', '12-14', '12-15', '12-16', '12-17', '12-18', '12-19'] },
        yAxis: { type: 'value' },
        series: [
          { name: '心率异常', type: 'line', data: [3, 5, 2, 7, 4, 8, 5], itemStyle: { color: '#F56C6C' } },
          { name: '睡眠异常', type: 'line', data: [2, 3, 1, 4, 2, 5, 3], itemStyle: { color: '#409EFF' } }
        ]
      })
      this.charts.sport.setOption({
        tooltip: { trigger: 'item' },
        series: [{
          type: 'pie', radius: ['40%', '70%'],
          data: [
            { value: 420, name: '跑步' },
            { value: 280, name: '骑行' },
            { value: 160, name: '游泳' },
            { value: 110, name: '力量' }
          ]
        }]
      })
      this.charts.device.setOption({
        tooltip: { trigger: 'item' },
        series: [{
          type: 'pie', radius: ['40%', '70%'],
          data: [
            { value: this.stats.onlineDevices, name: '在线' },
            { value: this.stats.offlineDevices, name: '离线' },
            { value: this.stats.errorDevices, name: '故障' }
          ]
        }]
      })
    },

    // 告警
    handleAlert(row) {
      this.$confirm('确认已处理该告警？').then(() => {
        this.deviceAlerts = this.deviceAlerts.filter(a => a.deviceId !== row.deviceId)
        this.calcStats()
        this.$message.success('处理成功')
      })
    },
    refreshAlerts() {
      this.$message.success('告警已刷新')
    },

    // 路由
    goPage(to) {
      this.$router.push('/admin/' + to)
    },
    viewDeviceDetail(row) {
      this.$router.push('/admin/device-manage')
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
}

/* 头部 */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: #fff;
  padding: 20px 24px;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.header-left h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: #1f2329;
}
.header-left p {
  margin: 4px 0 0;
  color: #909399;
}
.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}
.ws-status {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  background: #f5f7fa;
}
.ws-status .dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}
.ws-status.online .dot {
  background: #00c48c;
}
.ws-status.offline .dot {
  background: #f56c6c;
}

/* 统计卡片 */
.stats-row {
  margin-bottom: 24px;
}
.stat-card {
  padding: 24px;
  border-radius: 16px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}
.stat-card .icon {
  font-size: 36px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-card .info .title {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}
.stat-card .info .value {
  font-size: 28px;
  font-weight: bold;
  margin: 4px 0;
}
.stat-card .info .sub {
  font-size: 12px;
  opacity: 0.85;
  margin: 0;
}

/* 面板卡片 */
.panel-card {
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 24px;
  overflow: hidden;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px;
  color: #303133;
}
.chart-box {
  width: 100%;
  height: 260px;
}

/* 设备表格 */
.device-table-card {
  margin-bottom: 24px;
}
.text-danger {
  color: #f56c6c;
  font-weight: bold;
}
.text-normal {
  color: #303133;
}

/* 告警卡片 */
.alert-card {
  border-radius: 16px;
}
</style>