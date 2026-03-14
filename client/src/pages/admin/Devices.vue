<template>
  <div class="admin-devices">
    <el-card shadow="hover" class="page-header">
      <h2>设备管理</h2>
      <p>管理系统内所有运动监测设备</p>
    </el-card>
    
    <!-- 搜索和筛选 -->
    <el-card shadow="hover" class="search-card">
      <div class="search-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索设备（设备ID、学生姓名、学号）"
          style="width: 300px; margin-right: 10px;"
          prefix-icon="el-icon-search"
        ></el-input>
        
        <el-select
          v-model="deviceStatusFilter"
          placeholder="设备状态"
          style="width: 120px; margin-right: 10px;"
        >
          <el-option label="全部" value=""></el-option>
          <el-option label="在线" value="online"></el-option>
          <el-option label="离线" value="offline"></el-option>
          <el-option label="异常" value="error"></el-option>
          <el-option label="未绑定" value="unbound"></el-option>
        </el-select>
        
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 300px; margin-right: 10px;"
        ></el-date-picker>
        
        <el-button type="primary" @click="searchDevices">
          <i class="el-icon-search"></i> 搜索
        </el-button>
        
        <el-button @click="resetFilters">
          <i class="el-icon-refresh"></i> 重置
        </el-button>
        
        <div class="search-actions">
          <el-button type="primary" @click="showAddDeviceDialog">
            <i class="el-icon-plus"></i> 新增设备
          </el-button>
          <el-button @click="importDevices">
            <i class="el-icon-upload2"></i> 导入设备
          </el-button>
          <el-button @click="exportDevices">
            <i class="el-icon-download"></i> 导出设备
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- 设备统计 -->
    <el-card shadow="hover" class="stats-card">
      <div class="stats-container">
        <el-statistic
          title="设备总数"
          :value="totalDevices"
          :precision="0"
          class="stat-item"
        >
          <template slot="suffix">
            <i class="el-icon-monitor"></i>
          </template>
        </el-statistic>
        
        <el-statistic
          title="在线设备"
          :value="onlineDevices"
          :precision="0"
          class="stat-item"
          value-style="color: #36cfc9;"
        >
          <template slot="suffix">
            <i class="el-icon-video-camera"></i>
          </template>
        </el-statistic>
        
        <el-statistic
          title="离线设备"
          :value="offlineDevices"
          :precision="0"
          class="stat-item"
          value-style="color: #e6a23c;"
        >
          <template slot="suffix">
            <i class="el-icon-video-camera-slash"></i>
          </template>
        </el-statistic>
        
        <el-statistic
          title="异常设备"
          :value="errorDevices"
          :precision="0"
          class="stat-item"
          value-style="color: #f56c6c;"
        >
          <template slot="suffix">
            <i class="el-icon-warning"></i>
          </template>
        </el-statistic>
        
        <el-statistic
          title="未绑定设备"
          :value="unboundDevices"
          :precision="0"
          class="stat-item"
          value-style="color: #909399;"
        >
          <template slot="suffix">
            <i class="el-icon-link"></i>
          </template>
        </el-statistic>
      </div>
    </el-card>
    
    <!-- 设备列表 -->
    <el-card shadow="hover" class="table-card">
      <el-table
        :data="filteredDevices"
        border
        stripe
        style="width: 100%"
        height="600"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center"></el-table-column>
        <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
        <el-table-column prop="mac" label="MAC地址" width="180" align="center"></el-table-column>
        <el-table-column prop="name" label="设备名称" width="150" align="center">
          <template v-slot="scope">
            {{ scope.row.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="student_name" label="绑定学生" width="120" align="center">
          <template v-slot="scope">
            {{ scope.row.student_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="student_id" label="学号" width="150" align="center">
          <template v-slot="scope">
            {{ scope.row.student_id || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template v-slot="scope">
            <el-tag :type="getDeviceStatusColor(scope.row.status)">
              {{ getDeviceStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" align="center">
          <template v-slot="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="180" align="center">
          <template v-slot="scope">
            {{ formatDate(scope.row.updated_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template v-slot="scope">
            <el-button type="info" size="small" @click="editDevice(scope.row.id)">
              <i class="el-icon-edit"></i> 编辑
            </el-button>
            <el-button 
              :type="scope.row.student_id ? 'warning' : 'success'" 
              size="small" 
              @click="scope.row.student_id ? unbindDevice(scope.row.id) : showBindDialog(scope.row.id)"
            >
              <i :class="scope.row.student_id ? 'el-icon-unlink' : 'el-icon-link'"></i> 
              {{ scope.row.student_id ? '解绑' : '绑定' }}
            </el-button>
            <el-button type="danger" size="small" @click="deleteDevice(scope.row.id)">
              <i class="el-icon-delete"></i> 删除
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
    
    <!-- 批量操作 -->
    <div class="batch-operations" v-if="selectedDevices.length > 0">
      <el-button type="primary" @click="batchExport">批量导出</el-button>
      <el-button type="success" @click="batchBind">批量绑定</el-button>
      <el-button type="warning" @click="batchUnbind">批量解绑</el-button>
      <el-button type="danger" @click="batchDelete">批量删除</el-button>
    </div>
    
    <!-- 新增设备对话框 -->
    <el-dialog
      title="新增设备"
      :visible.sync="addDeviceDialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="newDeviceForm" :rules="newDeviceRules" ref="newDeviceForm" label-width="100px">
        <el-form-item label="设备ID" prop="deviceId">
          <el-input v-model="newDeviceForm.deviceId" placeholder="请输入设备ID"></el-input>
        </el-form-item>
        
        <el-form-item label="设备类型" prop="deviceType">
          <el-select v-model="newDeviceForm.deviceType" placeholder="请选择设备类型">
            <el-option label="心率手环" value="heartRateBand"></el-option>
            <el-option label="运动手表" value="sportWatch"></el-option>
            <el-option label="运动传感器" value="sportSensor"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="序列号" prop="serialNumber">
          <el-input v-model="newDeviceForm.serialNumber" placeholder="请输入设备序列号"></el-input>
        </el-form-item>
        
        <el-form-item label="位置" prop="location">
          <el-input v-model="newDeviceForm.location" placeholder="请输入设备位置"></el-input>
        </el-form-item>
        
        <el-form-item label="备注" prop="remarks">
          <el-input v-model="newDeviceForm.remarks" type="textarea" placeholder="请输入备注信息"></el-input>
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="addDeviceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitNewDevice">创建设备</el-button>
      </div>
    </el-dialog>
    
    <!-- 设备状态实时监控 -->
    <el-card shadow="hover" class="monitor-card">
      <div slot="header">
        <span>设备状态实时监控</span>
        <el-button
          type="text"
          size="small"
          @click="refreshMonitor"
          style="float: right;"
        >
          <i class="el-icon-refresh"></i> 刷新
        </el-button>
      </div>
      <div class="monitor-container">
        <div class="monitor-item" v-for="device in recentActiveDevices" :key="device.deviceId">
          <div class="device-info">
            <div class="device-id">{{ device.deviceId }}</div>
            <div class="device-type">{{ getDeviceTypeText(device.deviceType) }}</div>
          </div>
          <div class="device-status">
            <el-tag :type="getDeviceStatusColor(device.status)">
              {{ getDeviceStatusText(device.status) }}
            </el-tag>
          </div>
          <div class="device-battery">
            <el-progress
              :percentage="Math.round(device.battery)"
              :stroke-width="6"
              :color="getBatteryColor(device.battery)"
              status="active"
            ></el-progress>
            <span>{{ Math.round(device.battery) }}%</span>
          </div>
          <div class="device-student" v-if="device.studentName">
            <i class="el-icon-user"></i>
            <span>{{ device.studentName }}</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'AdminDevices',
  data() {
    return {
      // 设备数据
      devices: [],
      // 设备统计
      deviceStats: {
        total: 0,
        online: 0,
        offline: 0,
        bound: 0,
        unbound: 0
      },
      // 搜索和筛选
      searchQuery: '',
      deviceStatusFilter: '',
      dateRange: null,
      // 分页
      pageSize: 10,
      currentPage: 1,
      // 选择的设备
      selectedDevices: [],
      // 对话框
      addDeviceDialogVisible: false,
      // 表单数据
      newDeviceForm: {
        deviceId: '',
        deviceType: 'heartRateBand',
        serialNumber: '',
        location: '',
        remarks: ''
      },
      newDeviceRules: {
        deviceId: [
          { required: true, message: '请输入设备ID', trigger: 'blur' },
          { min: 5, max: 20, message: '设备ID长度在 5 到 20 个字符', trigger: 'blur' }
        ],
        deviceType: [
          { required: true, message: '请选择设备类型', trigger: 'change' }
        ],
        serialNumber: [
          { required: true, message: '请输入设备序列号', trigger: 'blur' }
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
          device.mac.toLowerCase().includes(query) ||
          (device.name && device.name.toLowerCase().includes(query)) ||
          (device.student_name && device.student_name.toLowerCase().includes(query)) ||
          (device.student_id && device.student_id.toLowerCase().includes(query))
        );
      }
      
      // 设备状态过滤
      if (this.deviceStatusFilter) {
        result = result.filter(device => device.status === this.deviceStatusFilter);
      }
      
      return result;
    },
    
    // 统计数据
    totalDevices() {
      return this.deviceStats.total || 0;
    },
    
    onlineDevices() {
      return this.deviceStats.online || 0;
    },
    
    offlineDevices() {
      return this.deviceStats.offline || 0;
    },
    
    errorDevices() {
      return 0; // 后端没有error状态，只有online/offline
    },
    
    unboundDevices() {
      return this.deviceStats.unbound || 0;
    },
    
    // 最近活跃设备
    recentActiveDevices() {
      return this.devices.filter(device => device.status === 'online').slice(0, 6);
    }
  },
  methods: {
    // 获取设备状态颜色
    getDeviceStatusColor(status) {
      switch (status) {
        case 'online': return 'success';
        case 'offline': return 'warning';
        case 'error': return 'danger';
        case 'unbound': return 'info';
        default: return 'default';
      }
    },
    
    // 获取设备状态文本
    getDeviceStatusText(status) {
      switch (status) {
        case 'online': return '在线';
        case 'offline': return '离线';
        case 'error': return '异常';
        case 'unbound': return '未绑定';
        default: return '未知';
      }
    },
    
    // 获取设备类型文本
    getDeviceTypeText(type) {
      switch (type) {
        case 'heartRateBand': return '心率手环';
        case 'sportWatch': return '运动手表';
        case 'sportSensor': return '运动传感器';
        default: return type;
      }
    },
    
    // 获取电池颜色
    getBatteryColor(level) {
      if (level > 70) return '#67c23a';
      if (level > 30) return '#e6a23c';
      return '#f56c6c';
    },
    
    // 搜索设备
    searchDevices() {
      this.$message.info('搜索功能开发中');
    },
    
    // 重置筛选条件
    resetFilters() {
      this.searchQuery = '';
      this.deviceStatusFilter = '';
      this.dateRange = null;
      this.$message.success('筛选条件已重置');
    },
    
    // 分页相关
    handleSizeChange(val) {
      this.pageSize = val;
    },
    
    handleCurrentChange(val) {
      this.currentPage = val;
    },
    
    // 选择设备
    handleSelectionChange(selection) {
      this.selectedDevices = selection;
    },
    
    // 刷新监控
    refreshMonitor() {
      this.$message.success('监控数据已刷新');
      // 模拟实时数据更新
      this.devices.forEach(device => {
        if (device.status === 'online') {
          // 随机更新电量
          device.battery = Math.max(0, Math.min(100, device.battery + Math.floor(Math.random() * 5) - 3));
        }
      });
    },
    
    // 设备管理操作
    showAddDeviceDialog() {
      this.newDeviceForm = {
        deviceId: '',
        deviceType: 'heartRateBand',
        serialNumber: '',
        location: '',
        remarks: ''
      };
      this.addDeviceDialogVisible = true;
    },
    
    submitNewDevice() {
      this.$refs.newDeviceForm.validate((valid) => {
        if (valid) {
          // 创建新设备
          const newDevice = {
            ...this.newDeviceForm,
            status: 'unbound',
            battery: 100,
            studentName: '',
            studentId: '',
            lastOnline: ''
          };
          
          this.devices.push(newDevice);
          this.addDeviceDialogVisible = false;
          this.$message.success('设备创建成功');
        }
      });
    },
    
    viewDeviceDetail(deviceId) {
      this.$message.info('查看设备详情功能开发中');
    },
    
    editDevice(deviceId) {
      this.$message.info('编辑设备功能开发中');
    },
    
    bindDevice(deviceId) {
      this.$message.info('绑定设备功能开发中');
    },
    
    unbindDevice(deviceId) {
      this.$confirm(`确定要解绑该设备吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const device = this.devices.find(d => d.deviceId === deviceId);
        if (device) {
          device.status = 'unbound';
          device.studentName = '';
          device.studentId = '';
          this.$message.success('设备解绑成功');
        }
      }).catch(() => {
        this.$message.info('已取消解绑');
      });
    },
    
    deleteDevice(deviceId) {
      this.$confirm(`确定要删除该设备吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = this.devices.findIndex(d => d.deviceId === deviceId);
        if (index !== -1) {
          this.devices.splice(index, 1);
          this.$message.success('设备删除成功');
        }
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    },
    
    // 批量操作
    batchExport() {
      this.$message.info('批量导出功能开发中');
    },
    
    batchBind() {
      if (this.selectedDevices.length === 0) {
        this.$message.warning('请选择要操作的设备');
        return;
      }
      this.$message.info('批量绑定功能开发中');
    },
    
    batchUnbind() {
      if (this.selectedDevices.length === 0) {
        this.$message.warning('请选择要操作的设备');
        return;
      }
      
      this.$confirm(`确定要解绑选中的 ${this.selectedDevices.length} 个设备吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.selectedDevices.forEach(device => {
          device.status = 'unbound';
          device.studentName = '';
          device.studentId = '';
        });
        this.$message.success('设备批量解绑成功');
        this.selectedDevices = [];
      }).catch(() => {
        this.$message.info('已取消操作');
      });
    },
    
    batchDelete() {
      if (this.selectedDevices.length === 0) {
        this.$message.warning('请选择要操作的设备');
        return;
      }
      
      this.$confirm(`确定要删除选中的 ${this.selectedDevices.length} 个设备吗？此操作不可恢复！`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }).then(() => {
        this.selectedDevices.forEach(device => {
          const index = this.devices.findIndex(d => d.deviceId === device.deviceId);
          if (index !== -1) {
            this.devices.splice(index, 1);
          }
        });
        this.$message.success('设备批量删除成功');
        this.selectedDevices = [];
      }).catch(() => {
        this.$message.info('已取消操作');
      });
    },
    
    // 导入导出
    importDevices() {
      this.$message.info('导入设备功能开发中');
    },
    
    exportDevices() {
      this.$message.info('导出设备功能开发中');
    }
  },
  mounted() {
    // 定时刷新监控数据
    this.refreshTimer = setInterval(() => {
      this.refreshMonitor();
    }, 30000); // 每30秒刷新一次
  },
  beforeDestroy() {
    // 清除定时器
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }
};
</script>

<style scoped>
.admin-devices {
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

.search-card {
  margin-bottom: 20px;
}

.search-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.search-actions {
  margin-left: auto;
  display: flex;
  gap: 10px;
}

.stats-card {
  margin-bottom: 20px;
}

.stats-container {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 20px;
}

.stat-item {
  text-align: center;
}

.table-card {
  margin-bottom: 20px;
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

.monitor-card {
  margin-bottom: 20px;
}

.monitor-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.monitor-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  background-color: #fafafa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.device-info {
  margin-bottom: 10px;
  text-align: center;
}

.device-id {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 5px;
}

.device-type {
  font-size: 14px;
  color: #606266;
}

.device-status {
  margin-bottom: 10px;
}

.device-battery {
  width: 100%;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.device-student {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
}

.dialog-footer {
  text-align: center;
}
</style>