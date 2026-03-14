<template>
  <div class="multi-heart-monitor">
    <div class="header">
      <h2>多人实时心率监测</h2>
      <div class="header-actions">
        <el-button type="primary" size="small" @click="refreshDevices">
          <i class="el-icon-refresh"></i> 刷新设备
        </el-button>
        <el-button type="success" size="small" @click="showAddDeviceDialog = true">
          <i class="el-icon-plus"></i> 添加设备
        </el-button>
        <el-button type="info" size="small" @click="toggleAutoRefresh">
          <i class="el-icon-timer"></i> {{ autoRefresh ? '停止自动刷新' : '开启自动刷新' }}
        </el-button>
      </div>
    </div>

    <!-- 状态统计 -->
    <div class="status-stats">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #409EFF;">
                <i class="el-icon-monitor"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ totalDevices }}</div>
                <div class="stat-label">总设备数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #67C23A;">
                <i class="el-icon-success"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ connectedDevices }}</div>
                <div class="stat-label">已连接</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #E6A23C;">
                <i class="el-icon-warning"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ disconnectedDevices }}</div>
                <div class="stat-label">未连接</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #909399;">
                <i class="el-icon-time"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ lastUpdateTime || '--' }}</div>
                <div class="stat-label">最后更新</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 设备网格 -->
    <div class="devices-grid">
      <div v-for="device in devices" :key="device.deviceId" class="device-card">
        <el-card shadow="hover" :class="getDeviceCardClass(device)">
          <div class="device-header">
            <div class="device-info">
              <h3>{{ device.name || device.deviceId }}</h3>
              <div class="device-meta">
                <span class="device-id">{{ device.deviceId }}</span>
                <span class="student-id" v-if="device.studentId">学生: {{ device.studentId }}</span>
              </div>
            </div>
            <div class="device-status">
              <el-tag :type="getStatusTagType(device.status)" size="small">
                {{ getStatusText(device.status) }}
              </el-tag>
              <div class="last-update">
                更新: {{ formatTime(device.lastUpdate) }}
              </div>
            </div>
          </div>

          <div class="heart-rate-section">
            <div class="heart-rate-value" :class="{ 'abnormal': isHeartRateAbnormal(device.heartRate) }">
              {{ device.heartRate || '--' }}
            </div>
            <div class="heart-rate-unit">次/分钟</div>
          </div>

          <div class="device-actions">
            <el-button 
              type="text" 
              size="small" 
              @click="showDeviceDetails(device)"
              :disabled="!device.heartRate">
              <i class="el-icon-view"></i> 详情
            </el-button>
            <el-button 
              type="text" 
              size="small" 
              @click="editDevice(device)">
              <i class="el-icon-edit"></i> 编辑
            </el-button>
            <el-button 
              type="text" 
              size="small" 
              @click="removeDevice(device.deviceId)"
              style="color: #F56C6C;">
              <i class="el-icon-delete"></i> 删除
            </el-button>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 添加设备对话框 -->
    <el-dialog
      title="添加设备"
      :visible.sync="showAddDeviceDialog"
      width="500px"
      @close="resetAddDeviceForm">
      <el-form :model="newDevice" :rules="deviceRules" ref="addDeviceForm">
        <el-form-item label="设备MAC地址" prop="deviceId">
          <el-input 
            v-model="newDevice.deviceId" 
            placeholder="如: E5:BF:3C:6E:3F:01"
            clearable>
          </el-input>
        </el-form-item>
        <el-form-item label="设备名称" prop="name">
          <el-input 
            v-model="newDevice.name" 
            placeholder="如: CC30"
            clearable>
          </el-input>
        </el-form-item>
        <el-form-item label="学生ID" prop="studentId">
          <el-input 
            v-model="newDevice.studentId" 
            placeholder="如: 2023423320102"
            clearable>
          </el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showAddDeviceDialog = false">取消</el-button>
        <el-button type="primary" @click="addDevice" :loading="addingDevice">确定</el-button>
      </span>
    </el-dialog>

    <!-- 设备详情对话框 -->
    <el-dialog
      :title="`设备详情 - ${selectedDevice?.name || selectedDevice?.deviceId}`"
      :visible.sync="showDeviceDetailsDialog"
      width="600px">
      <div v-if="selectedDevice" class="device-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备ID">{{ selectedDevice.deviceId }}</el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ selectedDevice.name || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="学生ID">{{ selectedDevice.studentId || '未绑定' }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusTagType(selectedDevice.status)" size="small">
              {{ getStatusText(selectedDevice.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="当前心率">
            <span :class="{ 'abnormal-text': isHeartRateAbnormal(selectedDevice.heartRate) }">
              {{ selectedDevice.heartRate || '无数据' }} 次/分钟
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="最后更新">{{ formatTime(selectedDevice.lastUpdate) }}</el-descriptions-item>
        </el-descriptions>

        <div class="heart-rate-history" v-if="selectedDevice.heartRateHistory && selectedDevice.heartRateHistory.length > 0">
          <h4>心率历史</h4>
          <el-table :data="selectedDevice.heartRateHistory.slice(0, 5)" size="small">
            <el-table-column prop="timestamp" label="时间" width="180">
              <template slot-scope="scope">
                {{ formatTime(scope.row.timestamp) }}
              </template>
            </el-table-column>
            <el-table-column prop="heartRate" label="心率">
              <template slot-scope="scope">
                <span :class="{ 'abnormal-text': isHeartRateAbnormal(scope.row.heartRate) }">
                  {{ scope.row.heartRate }} 次/分钟
                </span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showDeviceDetailsDialog = false">关闭</el-button>
      </span>
    </el-dialog>

    <!-- 空状态 -->
    <div v-if="devices.length === 0" class="empty-state">
      <el-empty description="暂无设备">
        <el-button type="primary" @click="showAddDeviceDialog = true">添加第一个设备</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script>
import { useWebSocket } from '../../services/WebSocketService';

export default {
  name: 'MultiHeartMonitor',
  data() {
    return {
      devices: [],
      showAddDeviceDialog: false,
      showDeviceDetailsDialog: false,
      selectedDevice: null,
      addingDevice: false,
      autoRefresh: true,
      refreshInterval: null,
      lastUpdateTime: null,
      newDevice: {
        deviceId: '',
        name: '',
        studentId: ''
      },
      deviceRules: {
        deviceId: [
          { required: true, message: '请输入设备MAC地址', trigger: 'blur' },
          { pattern: /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/, message: '请输入有效的MAC地址格式', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入设备名称', trigger: 'blur' }
        ],
        studentId: [
          { required: true, message: '请输入学生ID', trigger: 'blur' }
        ]
      }
    };
  },
  computed: {
    totalDevices() {
      return this.devices.length;
    },
    connectedDevices() {
      return this.devices.filter(d => d.status === 'connected').length;
    },
    disconnectedDevices() {
      return this.devices.filter(d => d.status === 'disconnected').length;
    }
  },
  mounted() {
    this.initWebSocket();
    this.loadDevices();
    this.startAutoRefresh();
  },
  beforeDestroy() {
    this.stopAutoRefresh();
  },
  methods: {
    initWebSocket() {
      const { connect, subscribe } = useWebSocket();
      connect();

      // 订阅设备数据
      subscribe('device_data', (data) => {
        this.handleDeviceData(data.data);
      });

      // 订阅设备状态
      subscribe('device_status', (data) => {
        this.handleDeviceStatus(data.data);
      });
    },

    handleDeviceData(deviceData) {
      const deviceId = deviceData.deviceId;
      const deviceIndex = this.devices.findIndex(d => d.deviceId === deviceId);
      
      if (deviceIndex >= 0) {
        // 更新现有设备
        const device = this.devices[deviceIndex];
        device.heartRate = deviceData.heartRate;
        device.lastUpdate = Date.now();
        device.status = 'connected';
        
        // 保存心率历史
        if (!device.heartRateHistory) {
          device.heartRateHistory = [];
        }
        device.heartRateHistory.unshift({
          heartRate: deviceData.heartRate,
          timestamp: Date.now()
        });
        
        // 限制历史记录数量
        if (device.heartRateHistory.length > 100) {
          device.heartRateHistory = device.heartRateHistory.slice(0, 100);
        }
        
        this.$set(this.devices, deviceIndex, { ...device });
      } else {
        // 添加新设备
        const newDevice = {
          deviceId: deviceId,
          name: deviceData.deviceId,
          studentId: deviceData.studentId || '',
          heartRate: deviceData.heartRate,
          status: 'connected',
          lastUpdate: Date.now(),
          heartRateHistory: [{
            heartRate: deviceData.heartRate,
            timestamp: Date.now()
          }]
        };
        this.devices.push(newDevice);
      }
      
      this.lastUpdateTime = new Date().toLocaleTimeString();
    },

    handleDeviceStatus(statusData) {
      const deviceId = statusData.deviceId;
      const deviceIndex = this.devices.findIndex(d => d.deviceId === deviceId);
      
      if (deviceIndex >= 0) {
        const device = this.devices[deviceIndex];
        device.status = statusData.status;
        device.lastUpdate = Date.now();
        
        if (statusData.status === 'disconnected') {
          device.heartRate = null;
        }
        
        this.$set(this.devices, deviceIndex, { ...device });
      }
    },

    loadDevices() {
      // 从本地存储加载设备列表
      const savedDevices = localStorage.getItem('multi_heart_devices');
      if (savedDevices) {
        try {
          this.devices = JSON.parse(savedDevices);
        } catch (e) {
          console.error('加载设备列表失败:', e);
        }
      }
    },

    saveDevices() {
      localStorage.setItem('multi_heart_devices', JSON.stringify(this.devices));
    },

    refreshDevices() {
      this.devices.forEach(device => {
        // 模拟刷新设备状态
        if (device.status === 'connected' && device.lastUpdate) {
          const timeDiff = Date.now() - device.lastUpdate;
          if (timeDiff > 60000) { // 超过60秒无更新
            device.status = 'disconnected';
            device.heartRate = null;
          }
        }
      });
      this.lastUpdateTime = new Date().toLocaleTimeString();
    },

    toggleAutoRefresh() {
      this.autoRefresh = !this.autoRefresh;
      if (this.autoRefresh) {
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
      }
    },

    startAutoRefresh() {
      this.stopAutoRefresh();
      this.refreshInterval = setInterval(() => {
        this.refreshDevices();
      }, 10000); // 每10秒刷新一次
    },

    stopAutoRefresh() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
      }
    },

    addDevice() {
      this.$refs.addDeviceForm.validate((valid) => {
        if (valid) {
          this.addingDevice = true;
          
          // 检查设备是否已存在
          const existingIndex = this.devices.findIndex(d => d.deviceId === this.newDevice.deviceId);
          
          if (existingIndex >= 0) {
            this.$message.warning('设备已存在');
            this.addingDevice = false;
            return;
          }
          
          // 添加新设备
          const newDevice = {
            deviceId: this.newDevice.deviceId,
            name: this.newDevice.name,
            studentId: this.newDevice.studentId,
            heartRate: null,
            status: 'disconnected',
            lastUpdate: null,
            heartRateHistory: []
          };
          
          this.devices.push(newDevice);
          this.saveDevices();
          
          this.$message.success('设备添加成功');
          this.showAddDeviceDialog = false;
          this.resetAddDeviceForm();
          this.addingDevice = false;
        }
      });
    },

    resetAddDeviceForm() {
      this.newDevice = {
        deviceId: '',
        name: '',
        studentId: ''
      };
      if (this.$refs.addDeviceForm) {
        this.$refs.addDeviceForm.clearValidate();
      }
    },

    editDevice(device) {
      this.selectedDevice = { ...device };
      this.newDevice = {
        deviceId: device.deviceId,
        name: device.name,
        studentId: device.studentId
      };
      this.showAddDeviceDialog = true;
    },

    removeDevice(deviceId) {
      this.$confirm('确定要删除这个设备吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = this.devices.findIndex(d => d.deviceId === deviceId);
        if (index >= 0) {
          this.devices.splice(index, 1);
          this.saveDevices();
          this.$message.success('设备删除成功');
        }
      }).catch(() => {});
    },

    showDeviceDetails(device) {
      this.selectedDevice = { ...device };
      this.showDeviceDetailsDialog = true;
    },

    getDeviceCardClass(device) {
      if (device.status === 'connected') {
        return device.heartRate ? 'device-card-connected' : 'device-card-no-data';
      } else {
        return 'device-card-disconnected';
      }
    },

    getStatusTagType(status) {
      switch (status) {
        case 'connected': return 'success';
        case 'connecting': return 'warning';
        case 'disconnected': return 'danger';
        default: return 'info';
      }
    },

    getStatusText(status) {
      switch (status) {
        case 'connected': return '已连接';
        case 'connecting': return '连接中';
        case 'disconnected': return '未连接';
        default: return '未知';
      }
    },

    isHeartRateAbnormal(heartRate) {
      if (!heartRate) return false;
      return heartRate < 60 || heartRate > 120;
    },

    formatTime(timestamp) {
      if (!timestamp) return '--';
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    }
  }
};
</script>

<style scoped>
.multi-heart-monitor {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.status-stats {
  margin-bottom: 30px;
}

.stat-card {
  height: 100%;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.stat-icon i {
  font-size: 24px;
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.devices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.device-card {
  transition: all 0.3s;
}

.device-card-connected {
  border-left: 4px solid #67C23A;
}

.device-card-disconnected {
  border-left: 4px solid #F56C6C;
}

.device-card-no-data {
  border-left: 4px solid #E6A23C;
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.device-info h3 {
  margin: 0 0 5px 0;
  color: #303133;
  font-size: 16px;
}

.device-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.device-id {
  font-size: 12px;
  color: #909399;
  font-family: monospace;
}

.student-id {
  font-size: 12px;
  color: #606266;
}

.device-status {
  text-align: right;
}

.last-update {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.heart-rate-section {
  text-align: center;
  margin: 20px 0;
}

.heart-rate-value {
  font-size: 48px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
  margin-bottom: 5px;
}

.heart-rate-value.abnormal {
  color: #F56C6C;
}

.heart-rate-unit {
  font-size: 14px;
  color: #606266;
}

.device-actions {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #ebeef5;
  padding-top: 15px;
}

.device-details {
  padding: 10px 0;
}

.heart-rate-history {
  margin-top: 20px;
}

.heart-rate-history h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.abnormal-text {
  color: #F56C6C;
  font-weight: 600;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style>
