<template>
  <div class="admin-settings">
    <el-card shadow="hover" class="page-header">
      <h2>系统设置</h2>
      <p>配置系统参数和管理系统功能</p>
    </el-card>
    
    <!-- 标签页切换 -->
    <el-card shadow="hover" class="settings-card">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <!-- 系统参数设置 -->
        <el-tab-pane label="系统参数" name="systemParams">
          <el-form :model="systemParams" label-width="180px" class="settings-form">
            <el-form-item label="系统名称">
              <el-input v-model="systemParams.systemName" placeholder="请输入系统名称"></el-input>
            </el-form-item>
            
            <el-form-item label="系统版本">
              <el-input v-model="systemParams.version" disabled placeholder="系统版本"></el-input>
            </el-form-item>
            
            <el-form-item label="系统Logo">
              <el-upload
                class="avatar-uploader"
                action="#"
                :show-file-list="false"
                :before-upload="beforeAvatarUpload"
                @success="handleAvatarSuccess"
              >
                <img v-if="systemParams.logo" :src="systemParams.logo" class="avatar">
                <i v-else class="el-icon-plus avatar-uploader-icon"></i>
              </el-upload>
              <div class="upload-tips">建议上传 200x200 像素的图片，支持 PNG、JPG 格式</div>
            </el-form-item>
            
            <el-form-item label="默认语言">
              <el-select v-model="systemParams.language" placeholder="请选择默认语言">
                <el-option label="简体中文" value="zh-CN"></el-option>
                <el-option label="English" value="en-US"></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="时区">
              <el-select v-model="systemParams.timezone" placeholder="请选择时区">
                <el-option label="UTC+8 (中国标准时间)" value="Asia/Shanghai"></el-option>
                <el-option label="UTC-5 (美国东部时间)" value="America/New_York"></el-option>
                <el-option label="UTC+0 (格林威治标准时间)" value="Europe/London"></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="数据自动备份">
              <el-switch v-model="systemParams.autoBackup"></el-switch>
            </el-form-item>
            
            <el-form-item label="备份频率" v-if="systemParams.autoBackup">
              <el-select v-model="systemParams.backupFrequency" placeholder="请选择备份频率">
                <el-option label="每天" value="daily"></el-option>
                <el-option label="每周" value="weekly"></el-option>
                <el-option label="每月" value="monthly"></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="备份时间" v-if="systemParams.autoBackup">
              <el-time-picker
                v-model="systemParams.backupTime"
                placeholder="选择时间"
                style="width: 100%;"
              ></el-time-picker>
            </el-form-item>
            
            <el-form-item label="系统公告">
              <el-input
                v-model="systemParams.notice"
                type="textarea"
                :rows="4"
                placeholder="输入系统公告"
              ></el-input>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="saveSystemParams">保存设置</el-button>
              <el-button @click="resetSystemParams">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <!-- MQTT 配置 -->
        <el-tab-pane label="MQTT配置" name="mqtt">
          <el-form :model="mqttConfig" label-width="160px" class="settings-form">
            <el-form-item label="Broker 地址">
              <el-input v-model="mqttConfig.broker" placeholder="例如: mqtt://broker.hivemq.com"></el-input>
            </el-form-item>

            <el-form-item label="端口">
              <el-input-number v-model="mqttConfig.port" :min="1" :max="65535"></el-input-number>
            </el-form-item>

            <el-form-item label="用户名">
              <el-input v-model="mqttConfig.username" placeholder="可选"></el-input>
            </el-form-item>

            <el-form-item label="密码">
              <el-input v-model="mqttConfig.password" type="password" placeholder="可选"></el-input>
            </el-form-item>

            <el-form-item label="Client ID">
              <el-input v-model="mqttConfig.clientId" placeholder="客户端标识"></el-input>
            </el-form-item>

            <el-form-item label="主题前缀">
              <el-input v-model="mqttConfig.topicPrefix" placeholder="例如: sport/monitor/"></el-input>
            </el-form-item>

            <el-form-item label="重连间隔(ms)">
              <el-input-number v-model="mqttConfig.reconnectPeriod" :min="1000"></el-input-number>
            </el-form-item>

            <el-form-item label="连接超时(ms)">
              <el-input-number v-model="mqttConfig.connectTimeout" :min="1000"></el-input-number>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="saveMQTTConfig">保存MQTT配置</el-button>
              <el-button type="info" @click="testMQTTConfig" style="margin-left:8px">测试连接</el-button>
              <el-button @click="loadMQTTConfig" style="margin-left:8px">刷新</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 权限管理 -->
        <el-tab-pane label="权限管理" name="permission">
          <div class="permission-container">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-card shadow="hover">
                  <div slot="header">
                    <span>角色列表</span>
                    <el-button
                      type="primary"
                      size="small"
                      @click="showAddRoleDialog"
                      style="float: right;"
                    >
                      <i class="el-icon-plus"></i> 新增角色
                    </el-button>
                  </div>
                  <el-tree
                    :data="roles"
                    :props="roleTreeProps"
                    :expand-on-click-node="false"
                    @node-click="handleRoleClick"
                    ref="roleTree"
                  >
                    <template v-slot="{node, data}">
                      <span class="role-item">
                        <span>{{ node.label }}</span>
                        <el-button
                          type="text"
                          size="small"
                          @click.stop="editRole(data)"
                        >
                          <i class="el-icon-edit"></i>
                        </el-button>
                        <el-button
                          type="text"
                          size="small"
                          @click.stop="deleteRole(data)"
                          style="color: #f56c6c;"
                        >
                          <i class="el-icon-delete"></i>
                        </el-button>
                      </span>
                    </template>
                  </el-tree>
                </el-card>
              </el-col>
              
              <el-col :span="16">
                <el-card shadow="hover">
                  <div slot="header">
                    <span>权限设置</span>
                    <el-button
                      type="primary"
                      size="small"
                      @click="savePermission"
                      style="float: right;"
                      :disabled="!selectedRole"
                    >
                      保存权限
                    </el-button>
                  </div>
                  
                  <div v-if="!selectedRole" class="no-role-selected">
                    请选择一个角色进行权限设置
                  </div>
                  
                  <el-tree
                    v-else
                    :data="permissionTree"
                    show-checkbox
                    node-key="id"
                    :default-checked-keys="selectedPermissions"
                    :props="permissionTreeProps"
                    @check-change="handlePermissionChange"
                  ></el-tree>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
        
        <!-- 日志管理 -->
        <el-tab-pane label="日志管理" name="log">
          <div class="log-container">
            <div class="log-filter">
              <el-select
                v-model="logTypeFilter"
                placeholder="日志类型"
                style="width: 150px; margin-right: 10px;"
              >
                <el-option label="全部" value=""></el-option>
                <el-option label="登录日志" value="login"></el-option>
                <el-option label="操作日志" value="operation"></el-option>
                <el-option label="系统日志" value="system"></el-option>
                <el-option label="错误日志" value="error"></el-option>
              </el-select>
              
              <el-input
                v-model="logUserFilter"
                placeholder="操作人"
                style="width: 150px; margin-right: 10px;"
              ></el-input>
              
              <el-date-picker
                v-model="logDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 300px; margin-right: 10px;"
              ></el-date-picker>
              
              <el-button type="primary" @click="searchLogs">
                <i class="el-icon-search"></i> 搜索
              </el-button>
              
              <el-button @click="resetLogFilters">
                <i class="el-icon-refresh"></i> 重置
              </el-button>
              
              <el-button type="warning" @click="exportLogs" style="margin-left: auto;">
                <i class="el-icon-download"></i> 导出日志
              </el-button>
            </div>
            
            <el-table
              :data="logs"
              border
              stripe
              style="width: 100%; margin-top: 20px;"
              height="600"
            >
              <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
              <el-table-column prop="type" label="类型" width="100" align="center">
                <template v-slot="scope">
                  <el-tag :type="getLogTypeColor(scope.row.type)">
                    {{ getLogTypeText(scope.row.type) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="operator" label="操作人" width="120" align="center"></el-table-column>
              <el-table-column prop="content" label="操作内容" min-width="300"></el-table-column>
              <el-table-column prop="ip" label="IP地址" width="150" align="center"></el-table-column>
              <el-table-column prop="userAgent" label="用户代理" min-width="200"></el-table-column>
              <el-table-column prop="createTime" label="操作时间" width="180" align="center"></el-table-column>
            </el-table>
            
            <!-- 分页 -->
            <div class="pagination-container">
              <el-pagination
                background
                layout="total, sizes, prev, pager, next, jumper"
                :total="logs.length"
                :page-size="logPageSize"
                :page-sizes="[10, 20, 50, 100]"
                @size-change="handleLogSizeChange"
                @current-change="handleLogCurrentChange"
              ></el-pagination>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 数据维护 -->
        <el-tab-pane label="数据维护" name="dataMaintenance">
          <el-card shadow="hover" class="maintenance-card">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-card shadow="hover" class="maintenance-item">
                  <div class="maintenance-icon backup">
                    <i class="el-icon-document-copy"></i>
                  </div>
                  <h3>数据备份</h3>
                  <p>定期备份系统数据，防止数据丢失</p>
                  <el-button type="primary" @click="showBackupDialog">立即备份</el-button>
                </el-card>
              </el-col>
              
              <el-col :span="8">
                <el-card shadow="hover" class="maintenance-item">
                  <div class="maintenance-icon restore">
                    <i class="el-icon-upload2"></i>
                  </div>
                  <h3>数据恢复</h3>
                  <p>从备份文件恢复系统数据</p>
                  <el-button type="success" @click="showRestoreDialog">恢复数据</el-button>
                </el-card>
              </el-col>
              
              <el-col :span="8">
                <el-card shadow="hover" class="maintenance-item">
                  <div class="maintenance-icon clean">
                    <i class="el-icon-delete"></i>
                  </div>
                  <h3>数据清理</h3>
                  <p>清理过期数据，提高系统性能</p>
                  <el-button type="warning" @click="showCleanDialog">清理数据</el-button>
                </el-card>
              </el-col>
            </el-row>
            
            <div class="maintenance-info">
              <h4>备份记录</h4>
              <el-table
                :data="backupRecords"
                border
                stripe
                style="width: 100%; margin-top: 10px;"
              >
                <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
                <el-table-column prop="fileName" label="备份文件名" min-width="200"></el-table-column>
                <el-table-column prop="size" label="文件大小" width="100" align="center"></el-table-column>
                <el-table-column prop="createTime" label="备份时间" width="180" align="center"></el-table-column>
                <el-table-column prop="status" label="状态" width="100" align="center">
                  <template v-slot="scope">
                    <el-tag :type="scope.row.status === 'success' ? 'success' : 'danger'">
                      {{ scope.row.status === 'success' ? '成功' : '失败' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="150" align="center">
                  <template v-slot="scope">
                    <el-button type="primary" size="small" @click="downloadBackup(scope.row)">
                      <i class="el-icon-download"></i> 下载
                    </el-button>
                    <el-button type="danger" size="small" @click="deleteBackup(scope.row)">
                      <i class="el-icon-delete"></i> 删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 新增角色对话框 -->
    <el-dialog
      title="新增角色"
      :visible.sync="addRoleDialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="newRoleForm" :rules="newRoleRules" ref="newRoleForm" label-width="100px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="newRoleForm.name" placeholder="请输入角色名称"></el-input>
        </el-form-item>
        
        <el-form-item label="角色标识" prop="code">
          <el-input v-model="newRoleForm.code" placeholder="请输入角色标识"></el-input>
        </el-form-item>
        
        <el-form-item label="角色描述" prop="description">
          <el-input
            v-model="newRoleForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
          ></el-input>
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="addRoleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitNewRole">创建角色</el-button>
      </div>
    </el-dialog>
    
    <!-- 数据备份对话框 -->
    <el-dialog
      title="数据备份"
      :visible.sync="backupDialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="backup-dialog">
        <el-form :model="backupForm" label-width="100px">
          <el-form-item label="备份名称">
            <el-input v-model="backupForm.name" placeholder="请输入备份名称"></el-input>
          </el-form-item>
          
          <el-form-item label="备份描述">
            <el-input
              v-model="backupForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入备份描述"
            ></el-input>
          </el-form-item>
          
          <el-form-item label="备份内容">
            <el-checkbox-group v-model="backupForm.content">
              <el-checkbox label="用户数据">用户数据</el-checkbox>
              <el-checkbox label="设备数据">设备数据</el-checkbox>
              <el-checkbox label="运动数据">运动数据</el-checkbox>
              <el-checkbox label="系统设置">系统设置</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
      </div>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="backupDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="startBackup">开始备份</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import request from '../../utils/request'

export default {
  name: 'AdminSettings',
  data() {
    return {
      // 激活的标签页
      activeTab: 'systemParams',
      // 系统参数
      systemParams: {
        systemName: '运动监测管理系统',
        version: '1.0.0',
        logo: '',
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
        autoBackup: true,
        backupFrequency: 'daily',
        backupTime: new Date(2023, 11, 1, 2, 0, 0),
        notice: '欢迎使用运动监测管理系统！'
      },
      // MQTT 配置
      mqttConfig: {
        broker: 'mqtt://localhost',
        port: 1883,
        username: '',
        password: '',
        clientId: 'sport-monitor-server',
        topicPrefix: 'sport/monitor/#',
        reconnectPeriod: 5000,
        connectTimeout: 10000
      },
      // 原始系统参数（用于重置）
      originalSystemParams: {},
      // 角色管理
      roles: [
        {
          id: 1,
          name: '超级管理员',
          code: 'admin',
          description: '拥有系统所有权限',
          children: []
        },
        {
          id: 2,
          name: '教师',
          code: 'teacher',
          description: '教师角色，管理学生和课程',
          children: []
        },
        {
          id: 3,
          name: '学生',
          code: 'student',
          description: '学生角色，查看个人运动数据',
          children: []
        }
      ],
      roleTreeProps: {
        label: 'name',
        children: 'children'
      },
      // 权限树
      permissionTree: [
        {
          id: 1,
          label: '系统管理',
          children: [
            { id: 11, label: '用户管理' },
            { id: 12, label: '设备管理' },
            { id: 13, label: '系统设置' },
            { id: 14, label: '日志管理' }
          ]
        },
        {
          id: 2,
          label: '教学管理',
          children: [
            { id: 21, label: '班级管理' },
            { id: 22, label: '学生管理' },
            { id: 23, label: '训练计划' },
            { id: 24, label: '训练报告' }
          ]
        },
        {
          id: 3,
          label: '数据中心',
          children: [
            { id: 31, label: '运动数据' },
            { id: 32, label: '健康数据' },
            { id: 33, label: '统计分析' },
            { id: 34, label: '数据导出' }
          ]
        }
      ],
      permissionTreeProps: {
        label: 'label',
        children: 'children'
      },
      // 选中的角色和权限
      selectedRole: null,
      selectedPermissions: [1, 11, 12, 13, 14],
      // 日志管理
      logs: [
        {
          id: 1,
          type: 'login',
          operator: 'admin',
          content: '管理员登录系统',
          ip: '127.0.0.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          createTime: '2023-11-25 14:30:00'
        },
        {
          id: 2,
          type: 'operation',
          operator: 'admin',
          content: '创建新用户：student001',
          ip: '127.0.0.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          createTime: '2023-11-25 14:35:00'
        },
        {
          id: 3,
          type: 'system',
          operator: 'system',
          content: '系统自动备份完成',
          ip: '127.0.0.1',
          userAgent: 'system',
          createTime: '2023-11-25 02:00:00'
        },
        {
          id: 4,
          type: 'error',
          operator: 'student001',
          content: '设备连接失败：DEV001',
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          createTime: '2023-11-25 10:15:00'
        }
      ],
      logTypeFilter: '',
      logUserFilter: '',
      logDateRange: null,
      logPageSize: 10,
      logCurrentPage: 1,
      // 备份记录
      backupRecords: [
        {
          id: 1,
          fileName: 'backup_20231124_020000.sql',
          size: '12.5 MB',
          createTime: '2023-11-24 02:00:00',
          status: 'success'
        },
        {
          id: 2,
          fileName: 'backup_20231123_020000.sql',
          size: '12.3 MB',
          createTime: '2023-11-23 02:00:00',
          status: 'success'
        }
      ],
      // 对话框
      addRoleDialogVisible: false,
      backupDialogVisible: false,
      // 表单数据
      newRoleForm: {
        name: '',
        code: '',
        description: ''
      },
      newRoleRules: {
        name: [
          { required: true, message: '请输入角色名称', trigger: 'blur' }
        ],
        code: [
          { required: true, message: '请输入角色标识', trigger: 'blur' }
        ]
      },
      backupForm: {
        name: '',
        description: '',
        content: ['用户数据', '设备数据', '运动数据', '系统设置']
      }
    };
  },
  methods: {
    // 标签页切换
    handleTabClick(tab) {
      console.log('切换到标签页：', tab.name);
    },
    
    // 系统参数设置
    saveSystemParams() {
      this.$message.success('系统参数保存成功');
    },

    // 加载 MQTT 配置
    async loadMQTTConfig() {
      try {
        const res = await request.get('/mqtt/config');
        if (res.data && res.data.success) {
          this.mqttConfig = { ...this.mqttConfig, ...res.data.data };
        }
      } catch (err) {
        console.error('加载MQTT配置失败', err);
        this.$message.error('加载MQTT配置失败');
      }
    },

    // 保存 MQTT 配置
    async saveMQTTConfig() {
      try {
        await request.post('/mqtt/config', this.mqttConfig);
        this.$message.success('MQTT 配置已保存');
      } catch (err) {
        console.error('保存MQTT配置失败', err);
        this.$message.error('保存MQTT配置失败');
      }
    },

    // 测试 MQTT 连接
    async testMQTTConfig() {
      try {
        const res = await request.post('/mqtt/test', this.mqttConfig);
        if (res.data && res.data.success) {
          this.$message.success(res.data.message || '测试连接成功');
        } else {
          const msg = res.data?.message || '测试连接失败';
          this.$message.error(msg);
        }
      } catch (err) {
        console.error('测试MQTT连接失败', err);
        const msg = err.response?.data?.message || err.message || '测试连接出现错误';
        this.$message.error(msg);
      }
    },
    
    resetSystemParams() {
      this.systemParams = { ...this.originalSystemParams };
      this.$message.info('已重置系统参数');
    },
    
    // 图片上传
    beforeAvatarUpload(file) {
      const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
      const isLt2M = file.size / 1024 / 1024 < 2;
      
      if (!isJPG) {
        this.$message.error('上传头像图片只能是 JPG/PNG 格式!');
      }
      if (!isLt2M) {
        this.$message.error('上传头像图片大小不能超过 2MB!');
      }
      return isJPG && isLt2M;
    },
    
    handleAvatarSuccess(res, file) {
      this.systemParams.logo = URL.createObjectURL(file.raw);
    },
    
    // 角色管理
    showAddRoleDialog() {
      this.newRoleForm = {
        name: '',
        code: '',
        description: ''
      };
      this.addRoleDialogVisible = true;
    },
    
    submitNewRole() {
      this.$refs.newRoleForm.validate((valid) => {
        if (valid) {
          const newRole = {
            id: this.roles.length + 1,
            ...this.newRoleForm,
            children: []
          };
          this.roles.push(newRole);
          this.addRoleDialogVisible = false;
          this.$message.success('角色创建成功');
        }
      });
    },
    
    handleRoleClick(data) {
      this.selectedRole = data;
      // 加载角色权限
      console.log('选择角色：', data);
    },
    
    editRole(data) {
      this.$message.info('编辑角色功能开发中');
    },
    
    deleteRole(data) {
      this.$confirm(`确定要删除角色 ${data.name} 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = this.roles.findIndex(role => role.id === data.id);
        if (index !== -1) {
          this.roles.splice(index, 1);
        }
        this.$message.success('角色删除成功');
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    },
    
    // 权限管理
    handlePermissionChange(data, checked, indeterminate) {
      console.log('权限变更：', data, checked, indeterminate);
    },
    
    savePermission() {
      this.$message.success('权限设置保存成功');
    },
    
    // 日志管理
    searchLogs() {
      this.$message.info('搜索日志功能开发中');
    },
    
    resetLogFilters() {
      this.logTypeFilter = '';
      this.logUserFilter = '';
      this.logDateRange = null;
      this.$message.success('筛选条件已重置');
    },
    
    handleLogSizeChange(val) {
      this.logPageSize = val;
    },
    
    handleLogCurrentChange(val) {
      this.logCurrentPage = val;
    },
    
    getLogTypeColor(type) {
      switch (type) {
        case 'login': return 'primary';
        case 'operation': return 'success';
        case 'system': return 'info';
        case 'error': return 'danger';
        default: return 'default';
      }
    },
    
    getLogTypeText(type) {
      switch (type) {
        case 'login': return '登录日志';
        case 'operation': return '操作日志';
        case 'system': return '系统日志';
        case 'error': return '错误日志';
        default: return '未知日志';
      }
    },
    
    // 数据维护
    showBackupDialog() {
      this.backupForm = {
        name: `backup_${new Date().toISOString().slice(0, 10)}`,
        description: '',
        content: ['用户数据', '设备数据', '运动数据', '系统设置']
      };
      this.backupDialogVisible = true;
    },
    
    startBackup() {
      this.backupDialogVisible = false;
      this.$message.success('数据备份任务已开始');
      
      // 模拟备份完成
      setTimeout(() => {
        const newBackup = {
          id: this.backupRecords.length + 1,
          fileName: `${this.backupForm.name}_${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.sql`,
          size: '12.6 MB',
          createTime: new Date().toLocaleString(),
          status: 'success'
        };
        this.backupRecords.unshift(newBackup);
        this.$message.success('数据备份完成');
      }, 2000);
    },
    
    downloadBackup(record) {
      this.$message.info('下载备份文件功能开发中');
    },
    
    deleteBackup(record) {
      this.$confirm(`确定要删除备份文件 ${record.fileName} 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = this.backupRecords.findIndex(r => r.id === record.id);
        if (index !== -1) {
          this.backupRecords.splice(index, 1);
        }
        this.$message.success('备份文件删除成功');
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    }
  },
  mounted() {
    // 保存原始系统参数
    this.originalSystemParams = { ...this.systemParams };
    // 加载 MQTT 配置
    this.loadMQTTConfig();
  }
};
</script>

<style scoped>
.admin-settings {
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

.settings-card {
  margin-bottom: 20px;
}

.settings-form {
  padding: 20px 0;
}

/* 头像上传 */
.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
  width: 150px;
  height: 150px;
}

.avatar-uploader .el-upload:hover {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 150px;
  height: 150px;
  line-height: 150px;
  text-align: center;
}

.avatar {
  width: 150px;
  height: 150px;
  display: block;
}

.upload-tips {
  margin-top: 10px;
  color: #909399;
  font-size: 12px;
}

/* 权限管理 */
.permission-container {
  padding: 20px 0;
}

.role-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.no-role-selected {
  text-align: center;
  padding: 50px 0;
  color: #909399;
  font-size: 16px;
}

/* 日志管理 */
.log-container {
  padding: 20px 0;
}

.log-filter {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

/* 数据维护 */
.maintenance-card {
  padding: 20px 0;
}

.maintenance-item {
  text-align: center;
}

.maintenance-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 32px;
  color: #fff;
}

.maintenance-icon.backup {
  background-color: #409eff;
}

.maintenance-icon.restore {
  background-color: #67c23a;
}

.maintenance-icon.clean {
  background-color: #e6a23c;
}

.maintenance-item h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
}

.maintenance-item p {
  margin: 0 0 20px 0;
  color: #606266;
}

.maintenance-info {
  margin-top: 30px;
}

.maintenance-info h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #303133;
}

/* 对话框 */
.dialog-footer {
  text-align: center;
}

.backup-dialog {
  max-height: 400px;
  overflow-y: auto;
}
</style>