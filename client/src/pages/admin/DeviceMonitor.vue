<template>
  <div class="admin-device-monitor">
    <div class="header">
      <h2>设备实时监控</h2>
      <div class="header-actions">
        <el-button type="primary" size="small" @click="refreshDevices">
          <i class="el-icon-refresh"></i> 刷新设备
        </el-button>
        <el-button type="success" size="small" @click="showAddDeviceDialog = true">
          <i class="el-icon-plus"></i> 添加设备
        </el-button>
        <el-button type="warning" size="small" @click="showImportDialog = true">
          <i class="el-icon-upload2"></i> 批量导入
        </el-button>
        <el-button type="info" size="small" @click="toggleAutoRefresh">
          <i class="el-icon-timer"></i> {{ autoRefresh ? '停止自动刷新' : '开启自动刷新' }}
        </el-button>
        <el-button type="danger" size="small" @click="showAlertSettings">
          <i class="el-icon-warning"></i> 预警设置
        </el-button>
      </div>
    </div>

    <!-- 状态统计 -->
    <div class="status-stats">
      <el-row :gutter="20">
        <el-col :span="4">
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
        <el-col :span="4">
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
        <el-col :span="4">
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
        <el-col :span="4">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #F56C6C;">
                <i class="el-icon-error"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ abnormalDevices }}</div>
                <div class="stat-label">异常设备</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
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
        <el-col :span="4">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #8E44AD;">
                <i class="el-icon-data-line"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ totalDataPoints }}</div>
                <div class="stat-label">数据点数</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-section">
      <el-card shadow="hover">
        <div class="filter-container">
          <el-input
            v-model="searchQuery"
            placeholder="搜索设备（设备ID、学生姓名、学号）"
            style="width: 300px; margin-right: 10px;"
            prefix-icon="el-icon-search"
            clearable
          ></el-input>
          
          <el-select
            v-model="statusFilter"
            placeholder="设备状态"
            style="width: 120px; margin-right: 10px;"
            clearable
          >
            <el-option label="全部" value=""></el-option>
            <el-option label="已连接" value="connected"></el-option>
            <el-option label="未连接" value="disconnected"></el-option>
            <el-option label="异常" value="abnormal"></el-option>
          </el-select>
          
          <el-select
            v-model="classFilter"
            placeholder="班级筛选"
            style="width: 150px; margin-right: 10px;"
            clearable
          >
            <el-option label="全部班级" value=""></el-option>
            <el-option label="计算机1班" value="computer1"></el-option>
            <el-option label="计算机2班" value="computer2"></el-option>
            <el-option label="软件工程1班" value="software1"></el-option>
          </el-select>
          
          <el-button type="primary" @click="searchDevices">
            <i class="el-icon-search"></i> 搜索
          </el-button>
          
          <el-button @click="resetFilters">
            <i class="el-icon-refresh"></i> 重置
          </el-button>
          
          <div class="view-toggle">
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button label="grid">网格视图</el-radio-button>
              <el-radio-button label="list">列表视图</el-radio-button>
              <el-radio-button label="map">地图视图</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 设备网格视图 -->
    <div class="devices-grid" v-if="viewMode === 'grid'">
      <div v-for="device in filteredDevices" :key="device.deviceId" class="device-card">
        <el-card shadow="hover" :class="getDeviceCardClass(device)">
          <div class="device-header">
            <div class="device-info">
              <h3>{{ device.name || device.deviceId }}</h3>
              <div class="device-meta">
                <span class="device-id">{{ device.deviceId }}</span>
                <span class="student-info" v-if="device.studentName">
                  <i class="el-icon-user"></i> {{ device.studentName }} ({{ device.studentId }})
                </span>
                <span class="class-info" v-if="device.className">
                  <i class="el-icon-school"></i> {{ device.className }}
                </span>
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
            <div class="heart-rate-trend" v-if="device.heartRateHistory && device.heartRateHistory.length > 1">
              <span :class="getTrendClass(device.heartRateHistory)">
                <i :class="getTrendIcon(device.heartRateHistory)"></i>
                {{ getTrendText(device.heartRateHistory) }}
              </span>
            </div>
          </div>

          <div class="additional-metrics">
            <div class="metric-item">
              <div class="metric-label">血氧</div>
              <div class="metric-value">{{ device.bloodOxygen || '--' }}%</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">体温</div>
              <div class="metric-value">{{ device.bodyTemperature || '--' }}℃</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">步数</div>
              <div class="metric-value">{{ device.steps || '--' }}</div>
            </div>
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
              @click="sendCommand(device.deviceId)"
              :disabled="device.status !== 'connected'">
              <i class="el-icon-s-promotion"></i> 指令
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

    <!-- 设备列表视图 -->
    <div class="devices-list" v-if="viewMode === 'list'">
      <el-card shadow="hover">
        <el-table
          :data="filteredDevices"
          border
          stripe
          style="width: 100%"
          height="600"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" align="center"></el-table-column>
          <el-table-column prop="deviceId" label="设备ID" width="150" align="center"></el-table-column>
          <el-table-column prop="name" label="设备名称" width="120" align="center"></el-table-column>
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template v-slot="scope">
              <el-tag :type="getStatusTagType(scope.row.status)" size="small">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="heartRate" label="心率" width="100" align="center">
            <template v-slot="scope">
              <span :class="{ 'abnormal-text': isHeartRateAbnormal(scope.row.heartRate) }">
                {{ scope.row.heartRate || '--' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="bloodOxygen" label="血氧" width="100" align="center">
            <template v-slot="scope">
              {{ scope.row.bloodOxygen || '--' }}%
            </template>
          </el-table-column>
          <el-table-column prop="bodyTemperature" label="体温" width="100" align="center">
            <template v-slot="scope">
              {{ scope.row.bodyTemperature || '--' }}℃
            </template>
          </el-table-column>
          <el-table-column prop="steps" label="步数" width="100" align="center">
            <template v-slot="scope">
              {{ scope.row.steps || '--' }}
            </template>
          </el-table-column>
          <el-table-column prop="studentName" label="学生姓名" width="120" align="center">
            <template v-slot="scope">
              {{ scope.row.studentName || '未绑定' }}
            </template>
          </el-table-column>
          <el-table-column prop="studentId" label="学号" width="150" align="center">
            <template v-slot="scope">
              {{ scope.row.studentId || '--' }}
            </template>
          </el-table-column>
          <el-table-column prop="className" label="班级" width="120" align="center">
            <template v-slot="scope">
              {{ scope.row.className || '--' }}
            </template>
          </el-table-column>
          <el-table-column prop="lastUpdate" label="最后更新" width="180" align="center">
            <template v-slot="scope">
              {{ formatTime(scope.row.lastUpdate) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" align="center">
            <template v-slot="scope">
              <el-button type="primary" size="small" @click="showDeviceDetails(scope.row)">
                <i class="el-icon-view"></i> 详情
              </el-button>
              <el-button type="info" size="small" @click="editDevice(scope.row)">
                <i class="el-icon-edit"></i> 编辑
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredDevices.length"
            :page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          ></el-pagination>
        </div>
      </el-card>
    </div>

    <!-- 批量操作 -->
    <div class="batch-operations" v-if="selectedDevices.length > 0">
      <span class="batch-info">已选择 {{ selectedDevices.length }} 个设备</span>
      <el-button type="primary" @click="batchExport">批量导出</el-button>
      <el-button type="success" @click="batchBind">批量绑定</el-button>
      <el-button type="warning" @click="batchUnbind">批量解绑</el-button>
      <el-button type="danger" @click="batchDelete">批量删除</el-button>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredDevices.length === 0" class="empty-state">
      <el-empty description="暂无设备">
        <el-button type="primary" @click="showAddDeviceDialog = true">添加第一个设备</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script>
import { useWebSocket } from '../../services/WebSocketService';

export default {
  name: 'AdminDeviceMonitor',
  data() {
    return {
      devices: [],
      searchQuery: '',
      statusFilter: '',
      classFilter: '',
      viewMode: 'grid',
      showAddDeviceDialog: false,
      showImportDialog: false,
      selectedDevices: [],
      autoRefresh: true,
      refreshInterval: null,
      lastUpdateTime: null,
      pageSize: 10,
      currentPage: 1,
      totalDataPoints: 0,
      newDevice: {
        deviceId: '',
        name: '',
        type: 'heartRateBand',
        studentName: '',
        studentId: '',
        className: ''
      },
      deviceRules: {
        deviceId: [
          { required: true, message: '请输入设备MAC地址', trigger: 'blur' },
          { pattern: /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/, message: '请输入有效的MAC地址格式', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入设备名称', trigger: 'blur' }
        ]
      }
    };
  },
  computed: {
    filteredDevices() {
      let result = [...this.devices];
      
      // 搜索过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        result = result.filter(device => 
          device.deviceId.toLowerCase().includes(query) ||
          (device.name && device.name.toLowerCase().includes(query)) ||
          (device.studentName && device.studentName.toLowerCase().includes(query)) ||
          (device.studentId && device.studentId.toLowerCase().includes(query))
        );
      }
      
      // 状态过滤
      if (this.statusFilter) {
        result = result.filter(device => device.status === this.statusFilter);
      }
      
      // 班级过滤
      if (this.classFilter) {
        result = result.filter(device => device.className === this.classFilter);
      }
      
      return result;
    },
    
    totalDevices() {
      return this.devices.length;
    },
    
    connectedDevices() {
      return this.devices.filter(d => d.status === 'connected').length;
    },
    
    disconnectedDevices() {
      return this.devices.filter(d => d.status === 'disconnected').length;
    },
    
    abnormalDevices() {
      return this.devices.filter(d => this.isHeartRateAbnormal(d.heartRate)).length;
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
      this.totalDataPoints++;
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
      const savedDevices = localStorage.getItem('admin_device_monitor');
      if (savedDevices) {
        try {
          this.devices = JSON.parse(savedDevices);
        } catch (e) {
          console.error('加载设备列表失败:', e);
        }
      }
    },

    saveDevices() {
      localStorage.setItem('admin_device_monitor', JSON.stringify(this.devices));
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

    searchDevices() {
      this.$message.info('搜索完成');
    },

    resetFilters() {
      this.searchQuery = '';
      this.statusFilter = '';
      this.classFilter = '';
      this.$message.success('筛选条件已重置');
    },

    handleSelectionChange(selection) {
      this.selectedDevices = selection;
    },

    handleSizeChange(val) {
      this.pageSize = val;
    },

    handleCurrentChange(val) {
      this.currentPage = val;
    },

    showDeviceDetails(device) {
      this.$message.info(`查看设备详情: ${device.deviceId}`);
    },

    editDevice(device) {
      this.$message.info(`编辑设备: ${device.deviceId}`);
    },

    sendCommand(deviceId) {
      this.$message.info(`发送指令到设备: ${deviceId}`);
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

    batchExport() {
      this.$message.info('批量导出功能开发中');
    },

    batchBind() {
      this.$message.info('批量绑定功能开发中');
    },

    batchUnbind() {
      this.$message.info('批量解绑功能开发中');
    },

    batchDelete() {
      this.$message.info('批量删除功能开发中');
    },

    showAlertSettings() {
      this.$message.info('预警设置功能开发中');
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
    },

    getTrendClass(history) {
      if (history.length < 2) return '';
      const current = history[0].heartRate;
      const previous = history[1].heartRate;
      if (current > previous) return 'trend-up';
      if (current < previous) return 'trend-down';
      return 'trend-stable';
    },

    getTrendIcon(history) {
      if (history.length < 2) return '';
      const current = history[0].heartRate;
      const previous = history[1].heartRate;
      if (current > previous) return 'el-icon-top';
      if (current < previous) return 'el-icon-bottom';
      return 'el-icon-minus';
    },

    getTrendText(history) {
      if (history.length < 2) return '';
      const current = history[0].heartRate;
      const previous = history[1].heartRate;
      const diff = current - previous;
      if (diff > 0) return `+${diff}`;
      if (diff < 0) return `${diff}`;
      return '0';
    }
  }
};
</script>

<style scoped>
.admin-device-monitor {
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

.filter-section {
  margin-bottom: 30px;
}

.filter-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.view-toggle {
  margin-left: auto;
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

.student-info, .class-info {
  font-size: 12px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 3px;
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

.heart-rate-trend {
  font-size: 12px;
  margin-top: 5px;
}

.trend-up {
  color: #F56C6C;
}

.trend-down {
  color: #67C23A;
}

.trend-stable {
  color: #909399;
}

.additional-metrics {
  display: flex;
  justify-content: space-around;
  margin: 20px 0;
  padding: 15px 0;
  border-top: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
}

.metric-item {
  text-align: center;
}

.metric-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.metric-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.device-actions {
  display: flex;
  justify-content: space-between;
  padding-top: 15px;
}

.devices-list {
  margin-bottom: 30px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.batch-operations {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.batch-info {
  font-size: 14px;
  color: #606266;
  margin-right: 10px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.abnormal-text {
  color: #F56C6C;
  font-weight: 600;
}
</style>
