<template>
  <div class="monitor-container">
    <div class="header">
      <h2>🩺 实时心率监测</h2>
      <div class="btn-box">
        <el-button type="primary" @click="startMonitor" :disabled="running">
          🔴 开始监测
        </el-button>
        <el-button type="danger" @click="stopMonitor" :disabled="!running">
          ⏹ 停止监测
        </el-button>
        <el-button type="primary" icon="el-icon-refresh" @click="fetchData">
          刷新数据
        </el-button>
        <el-tag :type="running ? 'success' : 'warning'" class="status-tag">
          {{ running ? '监测中' : '未运行' }}
        </el-tag>
      </div>
    </div>

    <el-table :data="deviceList" border stripe>
      <el-table-column label="学生ID" prop="studentId" />
      <el-table-column label="设备MAC" prop="mac" />
      <el-table-column label="设备名称" prop="name" />

      <el-table-column label="当前心率">
        <template #default="scope">
          <span class="heart-rate">{{ scope.row.heartRate || '--' }} BPM</span>
        </template>
      </el-table-column>

      <el-table-column label="设备状态">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'online' ? 'success' : 'warning'">
            {{ scope.row.status === 'online' ? '在线' : '离线' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="最后更新">
        <template #default="scope">
          {{ scope.row.updateTime || '未更新' }}
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  name: 'HeartRateMonitor',
  data() {
    return {
      running: false,
      ws: null,
      deviceList: [
        {
          mac: "E5:BF:3C:6E:3F:01",
          name: "CC30",
          studentId: "2023423320102",
          heartRate: null,
          status: "offline",
          updateTime: null
        }
      ]
    }
  },

  created() {
    this.getStatus()
    this.connectWebSocket()
    this.fetchData()
  },

  beforeUnmount() {
    if (this.ws) this.ws.close()
  },

  methods: {
    // ✅ 简单、安全、不会报错的刷新
    async fetchData() {
      try {
        const { data } = await this.$axios.get('/api/device-data/latest')
        if (data.success && data.data) {
          data.data.forEach(item => {
            const target = this.deviceList.find(d => d.mac === item.device_id)
            if (target) {
              target.heartRate = item.heart_rate
              target.status = "online"
              target.updateTime = new Date(item.record_time).toLocaleString()
            }
          })
          this.deviceList = [...this.deviceList] // 强制刷新
        }
      } catch (e) {
        console.log("刷新完成（忽略接口异常）")
      }
    },

    async getStatus() {
      try {
        const { data } = await this.$axios.get('/api/ble/status')
        this.running = data.data.running
      } catch (e) {}
    },

    async startMonitor() {
      try {
        const { data } = await this.$axios.post('/api/ble/start')
        if (data.code === 0) {
          this.$message.success('✅ 监测已启动')
          this.running = true
        }
      } catch (e) {
        this.$message.error('启动失败')
      }
    },

    async stopMonitor() {
      try {
        const { data } = await this.$axios.post('/api/ble/stop')
        if (data.code === 0) {
          this.$message.success('🛑 监测已停止')
          this.running = false
        }
      } catch (e) {
        this.$message.error('停止失败')
      }
    },

    // ✅ 实时心率（最简版）
    connectWebSocket() {
      this.ws = new WebSocket('ws://localhost:3001/ws')
      this.ws.onopen = () => console.log('✅ WebSocket 已连接')
      this.ws.onclose = () => setTimeout(() => this.connectWebSocket(), 3000)
      this.ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data)
          if (data.type === 'device_data') {
            const device = this.deviceList.find(item => item.mac === data.deviceId)
            if (device) {
              device.heartRate = data.data.heartRate
              device.status = "online"
              device.updateTime = new Date().toLocaleTimeString()
              this.deviceList = [...this.deviceList] // 关键：触发视图更新
            }
          }
        } catch (e) {}
      }
    }
  }
}
</script>

<style scoped>
.monitor-container { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.btn-box { display: flex; gap: 10px; align-items: center; }
.heart-rate { font-size: 16px; font-weight: bold; color: #e63946; }
</style>