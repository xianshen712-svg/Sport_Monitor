<template>
  <div class="dashboard-container">
    <!-- 顶部标题栏 -->
    <div class="dashboard-header">
      <div class="header-left">
        <h1>📊 系统仪表盘</h1>
        <p>{{ currentDate }} | 实时健康监控中心</p>
      </div>
      <div class="header-right">
        <el-button type="primary" icon="el-icon-refresh" @click="fetchData">
          刷新数据
        </el-button>
        <el-tag :type="wsConnected ? 'success' : 'danger'" class="ws-tag">
          {{ wsConnected ? 'WebSocket 已连接' : '已断开' }}
        </el-tag>
      </div>
    </div>

    <!-- 数据概览卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6" v-for="(item, idx) in statCards" :key="idx">
        <div class="stat-card" :style="{ background: item.bg }">
          <div class="icon">{{ item.icon }}</div>
          <div class="info">
            <p class="title">{{ item.title }}</p>
            <h2 class="value">{{ item.value }}</h2>
            <p class="sub">{{ item.sub }}</p>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 实时设备心率表格（核心） -->
    <el-card shadow="never" class="device-card">
      <template #header>
        <div class="card-title">
          <span>🩺 实时设备心率监测</span>
          <el-tag type="success" v-if="!loading">实时更新中</el-tag>
        </div>
      </template>

      <el-table :data="deviceList" border stripe height="400" v-loading="loading">
        <el-table-column label="学生ID" prop="studentId" width="140" />
        <el-table-column label="设备MAC" prop="mac" width="180" />
        <el-table-column label="设备名称" prop="name" width="120" />

        <el-table-column label="当前心率" width="130">
          <template #default="scope">
            <span class="heart-rate">
              {{ scope.row.heartRate || '--' }} BPM
            </span>
          </template>
        </el-table-column>

        <el-table-column label="设备状态" width="110">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'online' ? 'success' : 'warning'">
              {{ scope.row.status === 'online' ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="最后更新" prop="updateTime" />
      </el-table>
    </el-card>

    <!-- 图表区域 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="chart-card">
          <h3>📈 近7天健康异常趋势</h3>
          <div class="fake-chart">
            <div class="bar" style="height:22px"></div>
            <div class="bar" style="height:44px"></div>
            <div class="bar" style="height:30px"></div>
            <div class="bar" style="height:55px"></div>
            <div class="bar" style="height:38px"></div>
            <div class="bar" style="height:60px"></div>
            <div class="bar" style="height:40px"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <h3>🏃 运动类型分布</h3>
          <div class="fake-pie">
            <div>🏃‍♂️ 跑步 42%</div>
            <div>🚴 骑行 28%</div>
            <div>🏊 游泳 16%</div>
            <div>🏋️ 力量 14%</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: "Dashboard",
  data() {
    return {
      currentDate: "",
      loading: false,
      wsConnected: false,
      ws: null,
      // 设备列表（和心率监测页完全一致）
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
    };
  },

  computed: {
    statCards() {
      return [
        {
          title: "在线设备",
          value: this.deviceList.filter((d) => d.status === "online").length,
          sub: "台在线",
          bg: "linear-gradient(135deg,#00C48C,#5AE8A0)",
          icon: "🟢",
        },
        {
          title: "离线设备",
          value: this.deviceList.filter((d) => d.status !== "online").length,
          sub: "台离线",
          bg: "linear-gradient(135deg,#FF9F00,#FFBC3C)",
          icon: "🟠",
        },
        {
          title: "今日数据",
          value: "12,680",
          sub: "条上报",
          bg: "linear-gradient(135deg,#409EFF,#64A8FF)",
          icon: "📊",
        },
        {
          title: "告警总数",
          value: "0",
          sub: "条未处理",
          bg: "linear-gradient(135deg,#FF4D4F,#FF7875)",
          icon: "⚠️",
        },
      ];
    },
  },

  mounted() {
    this.setTime();
    this.connectWebSocket();
    this.fetchData();
    setInterval(() => this.fetchData(), 10000); // 每10秒自动刷新
  },

  beforeUnmount() {
    if (this.ws) this.ws.close();
  },

  methods: {
    setTime() {
      this.currentDate = new Date().toLocaleString("zh-CN");
    },

    // ------------- 以下完全复制你的心率监测页逻辑 -------------
    async fetchData() {
      try {
        const { data } = await this.$axios.get("/api/device-data/latest");
        if (data.success && data.data) {
          data.data.forEach((item) => {
            const target = this.deviceList.find((d) => d.mac === item.device_id);
            if (target) {
              target.heartRate = item.heart_rate;
              target.status = "online";
              target.updateTime = new Date(item.record_time).toLocaleString();
            }
          });
          this.deviceList = [...this.deviceList];
        }
      } catch (e) {
        // 接口异常不报错
      }
    },

    connectWebSocket() {
      this.ws = new WebSocket("ws://localhost:3001/ws");
      this.ws.onopen = () => (this.wsConnected = true);
      this.ws.onclose = () => (this.wsConnected = false);
      this.ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.type === "device_data") {
            const device = this.deviceList.find((it) => it.mac === data.deviceId);
            if (device) {
              device.heartRate = data.data.heartRate;
              device.status = "online";
              device.updateTime = new Date().toLocaleString();
              this.deviceList = [...this.deviceList];
            }
          }
        } catch (e) {}
      };
    },
  },
};
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

/* 头部 */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 20px 24px;
  border-radius: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}
.header-left h1 {
  margin: 0;
  font-size: 22px;
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
.ws-tag {
  padding: 6px 12px;
  border-radius: 20px;
}

/* 统计卡片 */
.stat-row {
  margin-bottom: 20px;
}
.stat-card {
  padding: 24px;
  border-radius: 16px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.stat-card .icon {
  font-size: 32px;
}
.stat-card .info p {
  margin: 0;
}
.stat-card .value {
  font-size: 26px;
  margin: 4px 0;
}

/* 设备卡片 */
.device-card {
  border-radius: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}
.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.heart-rate {
  font-size: 16px;
  font-weight: bold;
  color: #ff3636;
}

/* 图表 */
.chart-card {
  border-radius: 16px;
  padding: 20px;
  height: 320px;
}
.chart-card h3 {
  font-size: 16px;
  margin: 0 0 16px;
}
.fake-chart {
  display: flex;
  gap: 10px;
  height: 200px;
  align-items: flex-end;
  padding: 10px;
  background: #f9fafb;
  border-radius: 12px;
}
.fake-chart .bar {
  width: 30px;
  background: #409eff;
  border-radius: 4px;
}
.fake-pie {
  background: #f9fafb;
  padding: 20px;
  border-radius: 12px;
  line-height: 2.2;
  font-size: 15px;
}
</style>