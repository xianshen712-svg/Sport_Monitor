<template>
  <div class="teacher-device-management">
    <el-card shadow="hover" class="page-header">
      <div class="card-header">
          <el-button type="text" @click="$router.back()" class="back-btn">
            <i class="el-icon-arrow-left"></i> 返回
          </el-button>
          <h2>设备管理</h2>
          <p>班级：{{ userInfo.className }}</p>
        </div>
    </el-card>
    
    <!-- 操作工具栏 -->
    <el-card shadow="hover" class="toolbar-card">
      <div class="toolbar-content">
        <div class="search-section">
          <el-input
            v-model="searchQuery"
            placeholder="请输入设备ID/学生姓名"
            clearable
            style="width: 200px; margin-right: 10px;"
          >
            <i slot="prefix" class="el-input__icon el-icon-search"></i>
          </el-input>
          
          <el-select
            v-model="statusFilter"
            placeholder="状态筛选"
            clearable
            style="width: 120px; margin-right: 10px;"
          >
            <el-option label="全部" value=""></el-option>
            <el-option label="在线" value="online"></el-option>
            <el-option label="离线" value="offline"></el-option>
            <el-option label="低电量" value="low-battery"></el-option>
            <el-option label="故障" value="fault"></el-option>
          </el-select>
          
          <el-button type="primary" @click="searchDevices">
            <i class="el-icon-search"></i> 搜索
          </el-button>
          <el-button @click="resetFilters">
            <i class="el-icon-refresh"></i> 重置
          </el-button>
        </div>
        
        <div class="device-operations">
          <el-button type="primary" @click="showAddDeviceDialog">
            <i class="el-icon-plus"></i> 新增设备
          </el-button>
          <el-button @click="refreshDevices">
            <i class="el-icon-refresh"></i> 刷新状态
          </el-button>
          <el-button type="warning" @click="batchAssignDevices" :disabled="selectedDevices.length === 0">
            <i class="el-icon-link"></i> 批量分配
          </el-button>
          <el-button type="danger" @click="batchDeleteDevices" :disabled="selectedDevices.length === 0">
            <i class="el-icon-delete"></i> 批量删除
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- 设备概览 -->
    <el-row :gutter="20" class="overview-row">
      <el-col :xs="24" :sm="24" :md="6" :lg="6">
        <el-card shadow="hover" class="overview-card">
          <div class="overview-content">
            <div class="overview-icon primary">
              <i class="el-icon-cpu"></i>
            </div>
            <div class="overview-info">
              <div class="overview-title">设备总数</div>
              <div class="overview-value">{{ deviceOverview.total }}</div>
              <div class="overview-subtitle">本班手环设备</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="6" :lg="6">
        <el-card shadow="hover" class="overview-card">
          <div class="overview-content">
            <div class="overview-icon success">
              <i class="el-icon-check"></i>
            </div>
            <div class="overview-info">
              <div class="overview-title">在线设备</div>
              <div class="overview-value">{{ deviceOverview.online }}</div>
              <div class="overview-subtitle">
                <el-progress :percentage="(deviceOverview.online / deviceOverview.total) * 100" :show-text="false" :stroke-width="8" size="small"></el-progress>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="6" :lg="6">
        <el-card shadow="hover" class="overview-card">
          <div class="overview-content">
            <div class="overview-icon warning">
              <i class="el-icon-battery-charging"></i>
            </div>
            <div class="overview-info">
              <div class="overview-title">低电量设备</div>
              <div class="overview-value">{{ deviceOverview.lowBattery }}</div>
              <div class="overview-subtitle">电量低于20%</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="6" :lg="6">
        <el-card shadow="hover" class="overview-card">
          <div class="overview-content">
            <div class="overview-icon danger">
              <i class="el-icon-circle-close"></i>
            </div>
            <div class="overview-info">
              <div class="overview-title">故障设备</div>
              <div class="overview-value">{{ deviceOverview.fault }}</div>
              <div class="overview-subtitle">需要维修或更换</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 设备列表 -->
    <el-card shadow="hover" class="devices-card">
      <div class="card-header">
        <h3>设备列表</h3>
        <el-badge :value="filteredDevices.length" type="primary" class="devices-badge"></el-badge>
      </div>
      
      <el-table
        :data="filteredDevices"
        border
        stripe
        style="width: 100%"
        height="600"
        class="device-table"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center"></el-table-column>
        <el-table-column prop="deviceId" label="设备ID" width="120" align="center"></el-table-column>
        <el-table-column prop="studentId" label="学号" width="150" align="center">
          <template v-slot="scope">
            <span :class="scope.row.studentId ? '' : 'text-muted'">
              {{ scope.row.studentId || '未分配' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="studentName" label="学生姓名" width="100" align="center">
          <template v-slot="scope">
            <span :class="scope.row.studentName ? '' : 'text-muted'">
              {{ scope.row.studentName || '未分配' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template v-slot="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="battery" label="电量" width="100" align="center">
          <template v-slot="scope">
            <el-progress
              :percentage="Math.round(scope.row.battery)"
              :color="getBatteryColor(scope.row.battery)"
              :show-text="true"
              :format="(percentage) => `${Math.round(percentage)}%`"
              size="small"
            ></el-progress>
          </template>
        </el-table-column>
        <el-table-column prop="signalStrength" label="信号强度" width="120" align="center">
          <template v-slot="scope">
            <div class="signal-strength">
              <i class="el-icon-signal" :class="getSignalClass(scope.row.signalStrength)"></i>
              <span>{{ Math.round(scope.row.signalStrength) }} dBm</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="lastActive" label="最后活跃" width="160" align="center">
          <template v-slot="scope">
            <span class="text-muted">{{ scope.row.lastActive || '未知' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="firmwareVersion" label="固件版本" width="100" align="center"></el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template v-slot="scope">
            <el-button type="primary" size="small" @click="viewDeviceDetail(scope.row.deviceId)">
              <i class="el-icon-view"></i> 查看
            </el-button>
            <el-button type="info" size="small" @click="editDevice(scope.row.deviceId)">
              <i class="el-icon-edit"></i> 编辑
            </el-button>
            <el-button type="warning" size="small" @click="assignDevice(scope.row.deviceId)">
              <i class="el-icon-link"></i> {{ scope.row.studentId ? '重新分配' : '分配' }}
            </el-button>
            <el-button type="danger" size="small" @click="deleteDevice(scope.row.deviceId)">
              <i class="el-icon-delete"></i> 删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页控件 -->
      <div class="pagination-container">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredDevices.length"
        ></el-pagination>
      </div>
    </el-card>
    
    <!-- 新增设备对话框 -->
    <el-dialog
      title="新增设备"
      :visible.sync="addDialogVisible"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="addForm" :rules="addRules" ref="addForm" label-width="80px">
        <el-form-item label="设备ID" prop="deviceId">
          <el-input v-model="addForm.deviceId" placeholder="请输入设备ID"></el-input>
        </el-form-item>
        <el-form-item label="固件版本" prop="firmwareVersion">
          <el-input v-model="addForm.firmwareVersion" placeholder="请输入固件版本"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="addForm.description" placeholder="请输入设备描述" type="textarea" rows="3"></el-input>
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAddForm">添加</el-button>
      </div>
    </el-dialog>
    
    <!-- 编辑设备对话框 -->
    <el-dialog
      title="编辑设备"
      :visible.sync="editDialogVisible"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" :rules="editRules" ref="editForm" label-width="80px">
        <el-form-item label="设备ID" prop="deviceId">
          <el-input v-model="editForm.deviceId" disabled></el-input>
        </el-form-item>
        <el-form-item label="固件版本" prop="firmwareVersion">
          <el-input v-model="editForm.firmwareVersion" placeholder="请输入固件版本"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="editForm.description" placeholder="请输入设备描述" type="textarea" rows="3"></el-input>
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEditForm">保存</el-button>
      </div>
    </el-dialog>
    
    <!-- 分配设备对话框 -->
    <el-dialog
      title="分配设备"
      :visible.sync="assignDialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="assignForm" :rules="assignRules" ref="assignForm" label-width="80px">
        <el-form-item label="设备ID" prop="deviceId">
          <el-input v-model="assignForm.deviceId" disabled></el-input>
        </el-form-item>
        <el-form-item label="当前分配" prop="currentAssignment">
          <el-input v-model="assignForm.currentAssignment" disabled placeholder="未分配"></el-input>
        </el-form-item>
        <el-form-item label="分配给" prop="studentId">
          <el-select
            v-model="assignForm.studentId"
            placeholder="请选择学生"
            filterable
            remote
            reserve-keyword
            :remote-method="remoteSearchStudent"
            :loading="searchLoading"
            style="width: 100%"
          >
            <el-option
              v-for="student in studentOptions"
              :key="student.studentId"
              :label="`${student.name} (${student.studentId})`"
              :value="student.studentId"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAssignForm">分配</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'TeacherDeviceManagement',
  data() {
    return {
      userInfo: {
        name: '李老师',
        className: '高一1班',
        teacherId: 'Teacher101'
      },
      devices: [
        { deviceId: 'B001', studentId: '2023423320102', studentName: '曹睿焜', status: 'online', battery: 75, signalStrength: -65, lastActive: '2023-11-15 14:45:30', firmwareVersion: '1.0.0', description: '智能手环B001' },
        { deviceId: 'B002', studentId: '2023423320103', studentName: '张小明', status: 'online', battery: 60, signalStrength: -70, lastActive: '2023-11-15 14:44:20', firmwareVersion: '1.0.0', description: '智能手环B002' },
        { deviceId: 'B003', studentId: '2023423320104', studentName: '王小红', status: 'low-battery', battery: 15, signalStrength: -75, lastActive: '2023-11-15 14:43:10', firmwareVersion: '1.0.0', description: '智能手环B003' },
        { deviceId: 'B004', studentId: '2023423320105', studentName: '赵小刚', status: 'online', battery: 90, signalStrength: -60, lastActive: '2023-11-15 14:46:05', firmwareVersion: '1.0.0', description: '智能手环B004' },
        { deviceId: 'B005', studentId: '2023423320106', studentName: '李小丽', status: 'fault', battery: 45, signalStrength: -95, lastActive: '2023-11-15 14:30:40', firmwareVersion: '1.0.0', description: '智能手环B005' },
        { deviceId: 'B006', studentId: '2023423320107', studentName: '陈小强', status: 'online', battery: 85, signalStrength: -62, lastActive: '2023-11-15 14:45:20', firmwareVersion: '1.0.0', description: '智能手环B006' },
        { deviceId: 'B007', studentId: '2023423320109', studentName: '吴小明', status: 'offline', battery: 30, signalStrength: -85, lastActive: '2023-11-15 14:20:15', firmwareVersion: '1.0.0', description: '智能手环B007' },
        { deviceId: 'B008', studentId: '2023423320110', studentName: '郑小红', status: 'online', battery: 55, signalStrength: -72, lastActive: '2023-11-15 14:44:50', firmwareVersion: '1.0.0', description: '智能手环B008' },
        { deviceId: 'B009', studentId: '2023423320111', studentName: '周小强', status: 'online', battery: 68, signalStrength: -68, lastActive: '2023-11-15 14:45:10', firmwareVersion: '1.0.0', description: '智能手环B009' },
        { deviceId: 'B010', studentId: '', studentName: '', status: 'online', battery: 100, signalStrength: -65, lastActive: '2023-11-15 14:46:30', firmwareVersion: '1.0.0', description: '智能手环B010' }
      ],
      deviceOverview: {
        total: 10,
        online: 7,
        offline: 1,
        lowBattery: 1,
        fault: 1
      },
      searchQuery: '',
      statusFilter: '',
      currentPage: 1,
      pageSize: 10,
      selectedDevices: [],
      addDialogVisible: false,
      editDialogVisible: false,
      assignDialogVisible: false,
      addForm: {
        deviceId: '',
        firmwareVersion: '',
        description: ''
      },
      addRules: {
        deviceId: [
          { required: true, message: '请输入设备ID', trigger: 'blur' },
          { pattern: /^[A-Z0-9]+$/, message: '设备ID只能包含大写字母和数字', trigger: 'blur' }
        ],
        firmwareVersion: [
          { required: true, message: '请输入固件版本', trigger: 'blur' }
        ]
      },
      editForm: {
        deviceId: '',
        firmwareVersion: '',
        description: ''
      },
      editRules: {
        firmwareVersion: [
          { required: true, message: '请输入固件版本', trigger: 'blur' }
        ]
      },
      assignForm: {
        deviceId: '',
        currentAssignment: '',
        studentId: ''
      },
      assignRules: {
        studentId: [
          { required: true, message: '请选择学生', trigger: 'change' }
        ]
      },
      studentOptions: [],
      searchLoading: false,
      // 模拟学生数据
      students: [
        { studentId: '2023423320102', name: '曹睿焜' },
        { studentId: '2023423320103', name: '张小明' },
        { studentId: '2023423320104', name: '王小红' },
        { studentId: '2023423320105', name: '赵小刚' },
        { studentId: '2023423320106', name: '李小丽' },
        { studentId: '2023423320107', name: '陈小强' },
        { studentId: '2023423320108', name: '林小花' },
        { studentId: '2023423320109', name: '吴小明' },
        { studentId: '2023423320110', name: '郑小红' },
        { studentId: '2023423320111', name: '周小强' }
      ]
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
          device.studentName?.toLowerCase().includes(query)
        );
      }
      
      // 状态过滤
      if (this.statusFilter) {
        result = result.filter(device => device.status === this.statusFilter);
      }
      
      return result;
    },
    paginatedDevices() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredDevices.slice(start, end);
    }
  },
  mounted() {
    // 初始化数据
    this.updateDeviceOverview();
    // 设置定时刷新设备状态
    this.startStatusRefresh();
  },
  beforeDestroy() {
    // 清除定时器
    if (this.statusRefreshInterval) {
      clearInterval(this.statusRefreshInterval);
    }
  },
  methods: {
    // 开始定时刷新设备状态
    startStatusRefresh() {
      this.statusRefreshInterval = setInterval(() => {
        this.refreshDeviceStatus();
      }, 60000); // 每分钟刷新一次
    },
    
    // 刷新设备状态
    refreshDeviceStatus() {
      // 模拟设备状态变化
      this.devices.forEach(device => {
        if (device.status === 'online') {
          // 模拟电量减少
          device.battery = Math.max(0, Math.round(device.battery - (Math.random() * 2)));
          // 模拟信号强度变化
          device.signalStrength = Math.max(-100, Math.min(-50, Math.round(device.signalStrength + (Math.random() - 0.5) * 10)));
          // 模拟离线概率
          if (Math.random() < 0.05) {
            device.status = 'offline';
          }
        } else if (device.status === 'offline') {
          // 模拟上线概率
          if (Math.random() < 0.1) {
            device.status = 'online';
          }
        }
        
        // 更新状态
        if (device.status === 'online') {
          if (device.battery < 20) {
            device.status = 'low-battery';
          } else if (device.signalStrength < -90) {
            device.status = 'fault';
          }
        }
        
        // 更新最后活跃时间
        if (device.status === 'online' || device.status === 'low-battery') {
          const now = new Date();
          device.lastActive = now.toISOString().replace('T', ' ').substr(0, 19);
        }
      });
      
      // 更新设备概览
      this.updateDeviceOverview();
    },
    
    // 更新设备概览统计
    updateDeviceOverview() {
      this.deviceOverview.total = this.devices.length;
      this.deviceOverview.online = this.devices.filter(d => d.status === 'online').length;
      this.deviceOverview.offline = this.devices.filter(d => d.status === 'offline').length;
      this.deviceOverview.lowBattery = this.devices.filter(d => d.status === 'low-battery').length;
      this.deviceOverview.fault = this.devices.filter(d => d.status === 'fault').length;
    },
    
    // 搜索相关方法
    searchDevices() {
      this.currentPage = 1;
    },
    resetFilters() {
      this.searchQuery = '';
      this.statusFilter = '';
      this.currentPage = 1;
    },
    
    // 分页相关方法
    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1;
    },
    handleCurrentChange(val) {
      this.currentPage = val;
    },
    
    // 选择设备
    handleSelectionChange(selection) {
      this.selectedDevices = selection;
    },
    
    // 状态显示方法
    getStatusType(status) {
      switch (status) {
        case 'online': return 'success';
        case 'low-battery': return 'warning';
        case 'fault': return 'danger';
        case 'offline': return 'info';
        default: return '';
      }
    },
    getStatusText(status) {
      switch (status) {
        case 'online': return '在线';
        case 'low-battery': return '低电量';
        case 'fault': return '故障';
        case 'offline': return '离线';
        default: return status;
      }
    },
    getBatteryColor(battery) {
      if (battery > 50) return '#67C23A';
      if (battery > 20) return '#E6A23C';
      return '#F56C6C';
    },
    getSignalClass(strength) {
      if (strength > -70) return 'strong';
      if (strength > -85) return 'medium';
      return 'weak';
    },
    
    // 设备操作方法
    viewDeviceDetail(deviceId) {
      // 查看设备详情
      this.$message.info('查看设备详情功能开发中');
    },
    
    showAddDeviceDialog() {
      this.addForm = {
        deviceId: '',
        firmwareVersion: '',
        description: ''
      };
      this.addDialogVisible = true;
    },
    
    submitAddForm() {
      this.$refs.addForm.validate((valid) => {
        if (valid) {
          // 检查设备ID是否已存在
          if (this.devices.some(d => d.deviceId === this.addForm.deviceId)) {
            this.$message.error('设备ID已存在');
            return;
          }
          
          // 添加新设备
          this.devices.push({
            ...this.addForm,
            studentId: '',
            studentName: '',
            status: 'online',
            battery: 100,
            signalStrength: -60,
            lastActive: new Date().toISOString().replace('T', ' ').substr(0, 19)
          });
          
          this.addDialogVisible = false;
          this.updateDeviceOverview();
          this.$message.success('设备添加成功');
        }
      });
    },
    
    editDevice(deviceId) {
      const device = this.devices.find(d => d.deviceId === deviceId);
      if (device) {
        this.editForm = {
          deviceId: device.deviceId,
          firmwareVersion: device.firmwareVersion,
          description: device.description
        };
        this.editDialogVisible = true;
      }
    },
    
    submitEditForm() {
      this.$refs.editForm.validate((valid) => {
        if (valid) {
          const index = this.devices.findIndex(d => d.deviceId === this.editForm.deviceId);
          if (index !== -1) {
            this.devices[index] = {
              ...this.devices[index],
              firmwareVersion: this.editForm.firmwareVersion,
              description: this.editForm.description
            };
          }
          this.editDialogVisible = false;
          this.$message.success('设备信息更新成功');
        }
      });
    },
    
    assignDevice(deviceId) {
      const device = this.devices.find(d => d.deviceId === deviceId);
      if (device) {
        this.assignForm = {
          deviceId: device.deviceId,
          currentAssignment: device.studentName || '未分配',
          studentId: ''
        };
        this.assignDialogVisible = true;
      }
    },
    
    // 远程搜索学生
    remoteSearchStudent(query) {
      if (query !== '') {
        this.searchLoading = true;
        setTimeout(() => {
          this.studentOptions = this.students.filter(student => {
            return student.name.toLowerCase().includes(query.toLowerCase()) ||
                   student.studentId.includes(query);
          });
          this.searchLoading = false;
        }, 200);
      } else {
        this.studentOptions = [];
      }
    },
    
    submitAssignForm() {
      this.$refs.assignForm.validate((valid) => {
        if (valid) {
          const deviceIndex = this.devices.findIndex(d => d.deviceId === this.assignForm.deviceId);
          if (deviceIndex !== -1) {
            const student = this.students.find(s => s.studentId === this.assignForm.studentId);
            if (student) {
              this.devices[deviceIndex].studentId = student.studentId;
              this.devices[deviceIndex].studentName = student.name;
            }
          }
          
          this.assignDialogVisible = false;
          this.$message.success('设备分配成功');
        }
      });
    },
    
    deleteDevice(deviceId) {
      this.$confirm(`确定要删除设备 ${deviceId} 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = this.devices.findIndex(d => d.deviceId === deviceId);
        if (index !== -1) {
          this.devices.splice(index, 1);
          this.updateDeviceOverview();
          this.$message.success('设备删除成功');
        }
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    },
    
    // 刷新设备列表
    refreshDevices() {
      this.$message.info('正在刷新设备列表...');
      this.refreshDeviceStatus();
      setTimeout(() => {
        this.$message.success('设备列表已刷新');
      }, 1000);
    },
    
    // 批量操作
    batchAssignDevices() {
      this.$message.info('批量分配功能开发中');
    },
    
    batchDeleteDevices() {
      if (this.selectedDevices.length === 0) {
        this.$message.warning('请选择要删除的设备');
        return;
      }
      
      this.$confirm(`确定要删除选中的 ${this.selectedDevices.length} 个设备吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const deviceIds = this.selectedDevices.map(d => d.deviceId);
        this.devices = this.devices.filter(d => !deviceIds.includes(d.deviceId));
        this.selectedDevices = [];
        this.updateDeviceOverview();
        this.$message.success('设备批量删除成功');
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    }
  }
};
</script>

<style scoped>
.teacher-device-management {
  padding: 24px;
  min-height: calc(100vh - 100px);
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
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

.toolbar-card {
  margin-bottom: 20px;
}

.toolbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.search-section {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.device-operations {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.overview-row {
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

.devices-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.devices-badge {
  margin-left: 10px;
}

.device-table {
  background-color: #fff;
}

.text-muted {
  color: #909399;
}

.signal-strength {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.signal-strength i.strong {
  color: #67C23A;
}

.signal-strength i.medium {
  color: #E6A23C;
}

.signal-strength i.weak {
  color: #F56C6C;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.dialog-footer {
  text-align: center;
}

.back-btn {
  margin-bottom: 10px;
  color: #1890ff;
}

.back-btn:hover {
  color: #40a9ff;
  background-color: rgba(24, 144, 255, 0.1);
}
</style>