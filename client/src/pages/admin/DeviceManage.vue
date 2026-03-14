<template>
  <div class="device-manage">
    <el-card shadow="hover" class="page-header">
      <h2>设备管理</h2>
      <p>管理系统内所有运动监测设备</p>
    </el-card>
    
    <!-- 搜索和筛选 -->
    <el-card shadow="hover" class="search-card">
      <div class="search-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索设备（MAC地址、设备名称、学生姓名、学号）"
          style="width: 300px; margin-right: 10px;"
          prefix-icon="el-icon-search"
          @keyup.enter="fetchDevices"
        ></el-input>
        
        <el-select
          v-model="deviceStatusFilter"
          placeholder="设备状态"
          style="width: 120px; margin-right: 10px;"
          @change="fetchDevices"
        >
          <el-option label="全部" value=""></el-option>
          <el-option label="在线" value="online"></el-option>
          <el-option label="离线" value="offline"></el-option>
        </el-select>
        
        <el-button type="primary" @click="fetchDevices">
          <i class="el-icon-search"></i> 搜索
        </el-button>
        
        <el-button @click="resetFilters">
          <i class="el-icon-refresh"></i> 重置
        </el-button>
        
        <div class="search-actions">
          <el-button type="primary" @click="showAddDialog">
            <i class="el-icon-plus"></i> 新增设备
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- 设备统计 -->
    <el-card shadow="hover" class="stats-card">
      <div class="stats-container">
        <el-statistic
          title="设备总数"
          :value="deviceStats.total"
          :precision="0"
          class="stat-item"
        >
          <template slot="suffix">
            <i class="el-icon-monitor"></i>
          </template>
        </el-statistic>
        
        <el-statistic
          title="在线设备"
          :value="deviceStats.online"
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
          :value="deviceStats.offline"
          :precision="0"
          class="stat-item"
          value-style="color: #e6a23c;"
        >
          <template slot="suffix">
            <i class="el-icon-video-camera-slash"></i>
          </template>
        </el-statistic>
        
        <el-statistic
          title="已绑定设备"
          :value="deviceStats.bound"
          :precision="0"
          class="stat-item"
          value-style="color: #67c23a;"
        >
          <template slot="suffix">
            <i class="el-icon-user"></i>
          </template>
        </el-statistic>
        
        <el-statistic
          title="未绑定设备"
          :value="deviceStats.unbound"
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
        :data="devices"
        border
        stripe
        style="width: 100%"
        height="600"
        @selection-change="handleSelectionChange"
        v-loading="loading"
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
            <el-button type="info" size="small" @click="editDevice(scope.row)">
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
          :total="pagination.total"
          :page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :current-page="pagination.page"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
    </el-card>
    
    <!-- 批量操作 -->
    <div class="batch-operations" v-if="selectedDevices.length > 0">
      <el-button type="danger" @click="batchDelete">批量删除</el-button>
    </div>
    
    <!-- 新增/编辑设备对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="deviceDialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="deviceForm" :rules="deviceRules" ref="deviceForm" label-width="100px">
        <el-form-item label="MAC地址" prop="mac">
          <el-input v-model="deviceForm.mac" placeholder="请输入MAC地址（格式：00:11:22:33:44:55）"></el-input>
        </el-form-item>
        
        <el-form-item label="设备名称" prop="name">
          <el-input v-model="deviceForm.name" placeholder="请输入设备名称"></el-input>
        </el-form-item>
        
        <el-form-item label="设备状态" prop="status">
          <el-select v-model="deviceForm.status" placeholder="请选择设备状态">
            <el-option label="在线" value="online"></el-option>
            <el-option label="离线" value="offline"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="绑定学生" prop="student_id">
          <el-select
            v-model="deviceForm.student_id"
            placeholder="请选择要绑定的学生"
            filterable
            clearable
          >
            <el-option
              v-for="student in unboundStudents"
              :key="student.student_id"
              :label="`${student.name} (${student.student_id}) - ${student.class_name}`"
              :value="student.student_id"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="deviceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDeviceForm">确定</el-button>
      </div>
    </el-dialog>
    
    <!-- 绑定设备对话框 -->
    <el-dialog
      title="绑定设备到学生"
      :visible.sync="bindDialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="bindForm" :rules="bindRules" ref="bindForm" label-width="100px">
        <el-form-item label="选择学生" prop="student_id">
          <el-select
            v-model="bindForm.student_id"
            placeholder="请选择要绑定的学生"
            filterable
            style="width: 100%;"
          >
            <el-option
              v-for="student in unboundStudents"
              :key="student.student_id"
              :label="`${student.name} (${student.student_id}) - ${student.class_name}`"
              :value="student.student_id"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="bindDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBindForm">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'DeviceManage',
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
      // 未绑定学生列表
      unboundStudents: [],
      // 搜索和筛选
      searchQuery: '',
      deviceStatusFilter: '',
      // 分页
      pagination: {
        page: 1,
        limit: 10,
        total: 0
      },
      // 选择的设备
      selectedDevices: [],
      // 加载状态
      loading: false,
      // 对话框
      deviceDialogVisible: false,
      bindDialogVisible: false,
      // 表单数据
      deviceForm: {
        id: null,
        mac: '',
        name: '',
        status: 'offline',
        student_id: ''
      },
      bindForm: {
        deviceId: null,
        student_id: ''
      },
      // 表单验证规则
      deviceRules: {
        mac: [
          { required: true, message: '请输入MAC地址', trigger: 'blur' },
          { pattern: /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/, message: 'MAC地址格式不正确（格式：00:11:22:33:44:55）', trigger: 'blur' }
        ],
        name: [
          { required: false, message: '请输入设备名称', trigger: 'blur' }
        ],
        status: [
          { required: true, message: '请选择设备状态', trigger: 'change' }
        ]
      },
      bindRules: {
        student_id: [
          { required: true, message: '请选择要绑定的学生', trigger: 'change' }
        ]
      }
    };
  },
  computed: {
    dialogTitle() {
      return this.deviceForm.id ? '编辑设备' : '新增设备';
    }
  },
  mounted() {
    this.fetchDeviceStats();
    this.fetchDevices();
    this.fetchUnboundStudents();
  },
  methods: {
    // 获取设备统计
    async fetchDeviceStats() {
      try {
        const response = await this.$axios.get('/api/devices/stats');
        if (response.data.success) {
          this.deviceStats = response.data.stats;
        }
      } catch (error) {
        console.error('获取设备统计失败:', error);
        this.$message.error('获取设备统计失败');
      }
    },
    
    // 获取设备列表
    async fetchDevices() {
      this.loading = true;
      try {
        const params = {
          page: this.pagination.page,
          limit: this.pagination.limit
        };
        
        if (this.searchQuery) {
          params.search = this.searchQuery;
        }
        
        if (this.deviceStatusFilter) {
          params.status = this.deviceStatusFilter;
        }
        
        const response = await this.$axios.get('/api/devices', { params });
        if (response.data.success) {
          this.devices = response.data.data;
          this.pagination = response.data.pagination;
        }
      } catch (error) {
        console.error('获取设备列表失败:', error);
        this.$message.error('获取设备列表失败');
      } finally {
        this.loading = false;
      }
    },
    
    // 获取未绑定学生列表
    async fetchUnboundStudents() {
      try {
        const response = await this.$axios.get('/api/devices/unbound-students');
        if (response.data.success) {
          this.unboundStudents = response.data.data;
        }
      } catch (error) {
        console.error('获取未绑定学生列表失败:', error);
      }
    },
    
    // 获取设备状态颜色
    getDeviceStatusColor(status) {
      switch (status) {
        case 'online': return 'success';
        case 'offline': return 'warning';
        default: return 'default';
      }
    },
    
    // 获取设备状态文本
    getDeviceStatusText(status) {
      switch (status) {
        case 'online': return '在线';
        case 'offline': return '离线';
        default: return '未知';
      }
    },
    
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN');
    },
    
    // 重置筛选条件
    resetFilters() {
      this.searchQuery = '';
      this.deviceStatusFilter = '';
      this.pagination.page = 1;
      this.fetchDevices();
      this.$message.success('筛选条件已重置');
    },
    
    // 分页相关
    handleSizeChange(val) {
      this.pagination.limit = val;
      this.pagination.page = 1;
      this.fetchDevices();
    },
    
    handleCurrentChange(val) {
      this.pagination.page = val;
      this.fetchDevices();
    },
    
    // 选择设备
    handleSelectionChange(selection) {
      this.selectedDevices = selection;
    },
    
    // 显示新增对话框
    showAddDialog() {
      this.deviceForm = {
        id: null,
        mac: '',
        name: '',
        status: 'offline',
        student_id: ''
      };
      this.deviceDialogVisible = true;
      this.$nextTick(() => {
        if (this.$refs.deviceForm) {
          this.$refs.deviceForm.clearValidate();
        }
      });
    },
    
    // 编辑设备
    editDevice(device) {
      this.deviceForm = {
        id: device.id,
        mac: device.mac,
        name: device.name || '',
        status: device.status,
        student_id: device.student_id || ''
      };
      this.deviceDialogVisible = true;
      this.$nextTick(() => {
        if (this.$refs.deviceForm) {
          this.$refs.deviceForm.clearValidate();
        }
      });
    },
    
    // 提交设备表单
    submitDeviceForm() {
      this.$refs.deviceForm.validate(async (valid) => {
        if (valid) {
          try {
            if (this.deviceForm.id) {
              // 更新设备
              await this.$axios.put(`/api/devices/${this.deviceForm.id}`, this.deviceForm);
              this.$message.success('设备更新成功');
            } else {
              // 新增设备
              await this.$axios.post('/api/devices', this.deviceForm);
              this.$message.success('设备创建成功');
            }
            
            this.deviceDialogVisible = false;
            this.fetchDeviceStats();
            this.fetchDevices();
            this.fetchUnboundStudents();
          } catch (error) {
            console.error('保存设备失败:', error);
            this.$message.error(error.response?.data?.message || '保存设备失败');
          }
        }
      });
    },
    
    // 显示绑定对话框
    showBindDialog(deviceId) {
      this.bindForm = {
        deviceId: deviceId,
        student_id: ''
      };
      this.bindDialogVisible = true;
      this.$nextTick(() => {
        if (this.$refs.bindForm) {
          this.$refs.bindForm.clearValidate();
        }
      });
    },
    
    // 提交绑定表单
    async submitBindForm() {
      this.$refs.bindForm.validate(async (valid) => {
        if (valid) {
          try {
            await this.$axios.post(`/api/devices/${this.bindForm.deviceId}/bind`, {
              student_id: this.bindForm.student_id
            });
            this.$message.success('设备绑定成功');
            this.bindDialogVisible = false;
            this.fetchDeviceStats();
            this.fetchDevices();
            this.fetchUnboundStudents();
          } catch (error) {
            console.error('绑定设备失败:', error);
            this.$message.error(error.response?.data?.message || '绑定设备失败');
          }
        }
      });
    },
    
    // 解绑设备
    async unbindDevice(deviceId) {
      try {
        await this.$confirm('确定要解绑该设备吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        
        await this.$axios.post(`/api/devices/${deviceId}/unbind`);
        this.$message.success('设备解绑成功');
        this.fetchDeviceStats();
        this.fetchDevices();
        this.fetchUnboundStudents();
      } catch (error) {
        if (error !== 'cancel') {
          console.error('解绑设备失败:', error);
          this.$message.error(error.response?.data?.message || '解绑设备失败');
        }
      }
    },
    
    // 删除设备
    async deleteDevice(deviceId) {
      try {
        await this.$confirm('确定要删除该设备吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        
        await this.$axios.delete(`/api/devices/${deviceId}`);
        this.$message.success('设备删除成功');
        this.fetchDeviceStats();
        this.fetchDevices();
        this.fetchUnboundStudents();
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除设备失败:', error);
          this.$message.error(error.response?.data?.message || '删除设备失败');
        }
      }
    },
    
    // 批量删除设备
    async batchDelete() {
      if (this.selectedDevices.length === 0) {
        this.$message.warning('请选择要删除的设备');
        return;
      }
      
      try {
        await this.$confirm(`确定要删除选中的 ${this.selectedDevices.length} 个设备吗？此操作不可恢复！`, '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'danger'
        });
        
        const deviceIds = this.selectedDevices.map(device => device.id);
        await this.$axios.post('/api/devices/batch-delete', { ids: deviceIds });
        this.$message.success(`成功删除 ${deviceIds.length} 个设备`);
        this.selectedDevices = [];
        this.fetchDeviceStats();
        this.fetchDevices();
        this.fetchUnboundStudents();
      } catch (error) {
        if (error !== 'cancel') {
          console.error('批量删除设备失败:', error);
          this.$message.error(error.response?.data?.message || '批量删除设备失败');
        }
      }
    }
  }
};
</script>

<style scoped>
.device-manage {
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

.dialog-footer {
  text-align: center;
}
</style>
