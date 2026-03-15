<template>
  <div class="admin-settings">
    <el-card shadow="hover" class="page-header-card">
      <div class="header-content">
        <div>
          <h2>系统设置</h2>
          <p>全局配置、权限、日志、设备与数据维护</p>
        </div>
        <el-button type="primary" icon="el-icon-save" @click="saveAllConfig">
          保存全部设置
        </el-button>
      </div>
    </el-card>

    <el-card class="tab-card" shadow="hover">
      <el-tabs v-model="activeTab" class="settings-tabs">
        <!-- 系统参数 -->
        <el-tab-pane label="系统参数" name="systemParams">
          <el-form :model="systemParams" label-width="160px" class="p-6">
            <el-form-item label="系统名称">
              <el-input v-model="systemParams.systemName" placeholder="请输入" />
            </el-form-item>
            <el-form-item label="系统版本">
              <el-input v-model="systemParams.version" disabled />
            </el-form-item>
            <el-form-item label="系统Logo">
              <el-upload
                class="avatar-uploader"
                action="#"
                :show-file-list="false"
                :before-upload="beforeAvatarUpload"
                @success="handleAvatarSuccess"
              >
                <img v-if="systemParams.logo" :src="systemParams.logo" class="avatar" />
                <i v-else class="el-icon-plus avatar-uploader-icon"></i>
              </el-upload>
              <div class="tip">支持 PNG/JPG，建议 200×200，≤2MB</div>
            </el-form-item>
            <el-form-item label="默认语言">
              <el-select v-model="systemParams.language" style="width:240px">
                <el-option label="简体中文" value="zh-CN" />
                <el-option label="English" value="en-US" />
              </el-select>
            </el-form-item>
            <el-form-item label="时区">
              <el-select v-model="systemParams.timezone" style="width:280px">
                <el-option label="UTC+8 中国标准时间" value="Asia/Shanghai" />
                <el-option label="UTC+0 格林威治" value="Europe/London" />
              </el-select>
            </el-form-item>
            <el-form-item label="自动备份">
              <el-switch v-model="systemParams.autoBackup" />
            </el-form-item>
            <el-form-item label="备份频率" v-if="systemParams.autoBackup">
              <el-select v-model="systemParams.backupFrequency" style="width:160px">
                <el-option label="每天" value="daily" />
                <el-option label="每周" value="weekly" />
              </el-select>
            </el-form-item>
            <el-form-item label="备份时间" v-if="systemParams.autoBackup">
              <el-time-picker v-model="systemParams.backupTime" style="width:220px" />
            </el-form-item>
            <el-form-item label="系统公告">
              <el-input v-model="systemParams.notice" type="textarea" rows="4" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveSystemParams">保存</el-button>
              <el-button @click="resetSystemParams">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- MQTT 配置 -->
        <el-tab-pane label="MQTT 配置" name="mqttConfig">
          <el-form :model="mqttConfig" label-width="160px" class="p-6">
            <el-form-item label="Broker 地址"><el-input v-model="mqttConfig.broker" style="width:340px" /></el-form-item>
            <el-form-item label="端口"><el-input-number v-model="mqttConfig.port" :min="1" :max="65535" style="width:180px" /></el-form-item>
            <el-form-item label="用户名"><el-input v-model="mqttConfig.username" /></el-form-item>
            <el-form-item label="密码"><el-input v-model="mqttConfig.password" type="password" /></el-form-item>
            <el-form-item label="客户端ID"><el-input v-model="mqttConfig.clientId" /></el-form-item>
            <el-form-item label="主题前缀"><el-input v-model="mqttConfig.topicPrefix" /></el-form-item>
            <el-form-item label="重连间隔(ms)"><el-input-number v-model="mqttConfig.reconnectPeriod" :min="1000" style="width:180px" /></el-form-item>
            <el-form-item label="超时时间(ms)"><el-input-number v-model="mqttConfig.connectTimeout" :min="1000" style="width:180px" /></el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveMQTTConfig">保存配置</el-button>
              <el-button type="success" @click="testMQTTConfig">测试连接</el-button>
              <el-button @click="loadMQTTConfig">刷新</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 权限管理 -->
        <el-tab-pane label="权限管理" name="permission">
          <div class="p-6">
            <el-row :gutter="24">
              <el-col :span="6">
                <el-card shadow="hover" class="full-height">
                  <div class="card-title">
                    <span>角色列表</span>
                    <el-button size="small" type="primary" @click="showAddRoleDialog">新增</el-button>
                  </div>
                  <el-tree :data="roles" :props="roleTreeProps" @node-click="handleRoleClick" class="mt-4" />
                </el-card>
              </el-col>
              <el-col :span="18">
                <el-card shadow="hover" class="full-height">
                  <div class="card-title">
                    <span>权限配置</span>
                    <el-button size="small" type="primary" :disabled="!selectedRole" @click="savePermission">保存权限</el-button>
                  </div>
                  <div v-if="!selectedRole" class="no-role-tip">请先选择一个角色</div>
                  <el-tree
                    v-else
                    :data="permissionTree"
                    show-checkbox
                    node-key="id"
                    :default-checked-keys="selectedPermissions"
                    :props="permissionTreeProps"
                    class="mt-4"
                  />
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <!-- 日志管理 -->
        <el-tab-pane label="日志管理" name="logs">
          <div class="p-6">
            <div class="log-filter">
              <el-select v-model="logTypeFilter" placeholder="日志类型" style="width:140px">
                <el-option label="全部" value="" />
                <el-option label="登录" value="login" />
                <el-option label="操作" value="operation" />
                <el-option label="系统" value="system" />
                <el-option label="错误" value="error" />
              </el-select>
              <el-input v-model="logUserFilter" placeholder="操作人" style="width:160px" />
              <el-date-picker v-model="logDateRange" type="daterange" range-separator="至" style="width:300px" />
              <el-button type="primary" @click="searchLogs">搜索</el-button>
              <el-button @click="resetLogFilters">重置</el-button>
              <el-button type="warning" @click="exportLogs">导出日志</el-button>
            </div>
            <el-table v-if="logs && logs.length > 0" :data="logs" border stripe height="500" class="mt-4">
              <el-table-column prop="id" label="ID" width="70" align="center" />
              <el-table-column prop="type" label="类型" width="100" align="center">
                <template slot-scope="scope = {}">
                  <el-tag :type="getLogTypeColor(scope?.row?.type)">{{ getLogTypeText(scope?.row?.type) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="operator" label="操作人" width="120" />
              <el-table-column prop="content" label="内容" min-width="280" />
              <el-table-column prop="ip" label="IP" width="150" />
              <el-table-column prop="createTime" label="时间" width="180" />
            </el-table>
            <div class="pagination-right mt-4">
              <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="logs.length" />
            </div>
          </div>
        </el-tab-pane>

        <!-- 数据维护 -->
        <el-tab-pane label="数据维护" name="dataMaintenance">
          <div class="p-6">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-card class="tool-card" @click="showBackupDialog">
                  <i class="el-icon-document-copy"></i>
                  <h3>数据备份</h3>
                  <p>备份系统所有数据</p>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="tool-card" @click="showRestoreDialog">
                  <i class="el-icon-upload2"></i>
                  <h3>数据恢复</h3>
                  <p>从备份恢复</p>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="tool-card" @click="showCleanDialog">
                  <i class="el-icon-delete"></i>
                  <h3>数据清理</h3>
                  <p>清理过期日志</p>
                </el-card>
              </el-col>
            </el-row>
            <el-card class="mt-6" shadow="hover">
              <div class="card-title"><span>备份记录</span></div>
              <el-table v-if="backupRecords && backupRecords.length > 0" :data="backupRecords" border stripe class="mt-4">
                <el-table-column prop="fileName" label="文件名" />
                <el-table-column prop="size" label="大小" width="100" />
                <el-table-column prop="createTime" label="时间" width="180" />
                <el-table-column prop="status" label="状态" width="100">
                  <template slot-scope="scope = {}">
                    <el-tag :type="scope?.row?.status=='success'?'success':'danger'">{{ scope?.row?.status=='success'?'成功':'失败' }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="180">
                  <template slot-scope="scope = {}">
                    <el-button size="small" type="primary" @click="downloadBackup(scope?.row)">下载</el-button>
                    <el-button size="small" type="danger" @click="deleteBackup(scope?.row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 新增角色弹窗 -->
    <el-dialog title="新增角色" :visible.sync="addRoleDialogVisible" width="520px">
      <el-form :model="newRoleForm" :rules="newRoleRules" ref="newRoleForm" label-width="100px">
        <el-form-item label="角色名称" prop="name"><el-input v-model="newRoleForm.name" /></el-form-item>
        <el-form-item label="角色标识" prop="code"><el-input v-model="newRoleForm.code" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="newRoleForm.description" type="textarea" rows="3" /></el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="addRoleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitNewRole">创建</el-button>
      </div>
    </el-dialog>

    <!-- 备份弹窗 -->
    <el-dialog title="数据备份" :visible.sync="backupDialogVisible" width="520px">
      <el-form :model="backupForm" label-width="100px">
        <el-form-item label="备份名称"><el-input v-model="backupForm.name" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="backupForm.description" type="textarea" rows="3" /></el-form-item>
        <el-form-item label="备份内容">
          <el-checkbox-group v-model="backupForm.content">
            <el-checkbox label="用户数据" />
            <el-checkbox label="设备数据" />
            <el-checkbox label="运动数据" />
            <el-checkbox label="系统配置" />
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="backupDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="startBackup">开始备份</el-button>
      </div>
    </el-dialog>

    <!-- 恢复弹窗 -->
    <el-dialog title="数据恢复" :visible.sync="restoreDialogVisible" width="500px">
      <div style="padding:20px">请上传备份文件进行恢复</div>
      <el-upload class="upload-demo" drag action="/">
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将文件拖到此处，或点击上传</div>
      </el-upload>
      <div slot="footer">
        <el-button @click="restoreDialogVisible = false">取消</el-button>
        <el-button type="success" @click="confirmRestore">开始恢复</el-button>
      </div>
    </el-dialog>

    <!-- 清理弹窗 -->
    <el-dialog title="数据清理" :visible.sync="cleanDialogVisible" width="500px">
      <div style="padding:20px">清理 3 个月前的日志、临时文件、无效记录</div>
      <div slot="footer">
        <el-button @click="cleanDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmClean">确认清理</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "AdminSettings",
  data() {
    return {
      activeTab: "systemParams",
      systemParams: {
        systemName: "运动健康监测系统",
        version: "2.0.0",
        logo: "",
        language: "zh-CN",
        timezone: "Asia/Shanghai",
        autoBackup: true,
        backupFrequency: "daily",
        backupTime: new Date(2025, 2, 15, 2, 0, 0),
        notice: "欢迎使用运动健康监测管理系统"
      },
      mqttConfig: {
        broker: "mqtt://localhost",
        port: 1883,
        username: "",
        password: "",
        clientId: "sport-monitor-server",
        topicPrefix: "sport/monitor/#",
        reconnectPeriod: 5000,
        connectTimeout: 10000
      },
      originalSystemParams: {},
      roles: [
        { id: 1, name: "超级管理员", code: "admin", description: "全部权限" },
        { id: 2, name: "教师", code: "teacher", description: "管理学生" },
        { id: 3, name: "学生", code: "student", description: "查看个人数据" }
      ],
      roleTreeProps: { label: "name" },
      permissionTree: [
        { id: 1, label: "系统管理", children: [
          { id: 11, label: "用户管理" },
          { id: 12, label: "设备管理" },
          { id: 13, label: "系统设置" },
          { id: 14, label: "日志管理" }
        ]},
        { id: 2, label: "教学管理", children: [
          { id: 21, label: "班级管理" },
          { id: 22, label: "训练计划" }
        ]},
        { id: 3, label: "数据中心", children: [
          { id: 31, label: "运动数据" },
          { id: 32, label: "健康数据" }
        ]}
      ],
      permissionTreeProps: { label: "label" },
      selectedRole: null,
      selectedPermissions: [1, 11, 12, 13, 14],
      logs: [
        { id: 1, type: "login", operator: "admin", content: "管理员登录", ip: "127.0.0.1", createTime: "2026-03-15 13:50:00" },
        { id: 2, type: "operation", operator: "admin", content: "修改MQTT配置", ip: "127.0.0.1", createTime: "2026-03-15 13:51:00" },
        { id: 3, type: "system", operator: "system", content: "自动备份完成", ip: "127.0.0.1", createTime: "2026-03-15 02:00:00" }
      ],
      logTypeFilter: "",
      logUserFilter: "",
      logDateRange: null,
      backupRecords: [
        { id: 1, fileName: "backup_20260315.sql", size: "12.8MB", createTime: "2026-03-15 02:00:00", status: "success" }
      ],
      addRoleDialogVisible: false,
      backupDialogVisible: false,
      restoreDialogVisible: false,
      cleanDialogVisible: false,
      newRoleForm: { name: "", code: "", description: "" },
      newRoleRules: {
        name: [{ required: true, message: "请输入角色名称", trigger: "blur" }],
        code: [{ required: true, message: "请输入角色标识", trigger: "blur" }]
      },
      backupForm: { name: "", description: "", content: [] }
    };
  },
  mounted() {
    this.originalSystemParams = JSON.parse(JSON.stringify(this.systemParams));
  },
  methods: {
    saveAllConfig() { this.$message.success("全部设置已保存"); },
    saveSystemParams() { this.$message.success("系统参数保存成功"); },
    resetSystemParams() { this.systemParams = JSON.parse(JSON.stringify(this.originalSystemParams)); this.$message.info("已重置"); },
    beforeAvatarUpload(f) { const t = f.type === "image/png" || f.type === "image/jpeg"; const s = f.size < 2 * 1024 * 1024; if (!t) this.$message.error("仅支持PNG/JPG"); if (!s) this.$message.error("≤2MB"); return t && s; },
    handleAvatarSuccess(r, f) { this.systemParams.logo = URL.createObjectURL(f.raw); },
    saveMQTTConfig() { this.$message.success("MQTT配置已保存"); },
    testMQTTConfig() { this.$message.success("连接测试成功"); },
    loadMQTTConfig() {},
    showAddRoleDialog() { this.addRoleDialogVisible = true; },
    submitNewRole() { this.$refs.newRoleForm.validate(v => { if (v) { this.roles.push({ id: this.roles.length + 1, ...this.newRoleForm }); this.addRoleDialogVisible = false; this.$message.success("创建成功"); } }); },
    handleRoleClick(d) { this.selectedRole = d; },
    savePermission() { this.$message.success("权限保存成功"); },
    searchLogs() { this.$message.info("搜索完成"); },
    resetLogFilters() { this.logTypeFilter = ""; this.logUserFilter = ""; this.logDateRange = null; },
    exportLogs() { this.$message.success("导出成功"); },
    getLogTypeColor(t) { return { login: "primary", operation: "success", system: "info", error: "danger" }[t] || "default"; },
    getLogTypeText(t) { return { login: "登录", operation: "操作", system: "系统", error: "错误" }[t] || "未知"; },
    showBackupDialog() { this.backupForm.name = `backup_${new Date().toISOString().slice(0,10)}`; this.backupDialogVisible = true; },
    startBackup() { this.backupDialogVisible = false; setTimeout(() => { this.backupRecords.unshift({ id: this.backupRecords.length + 1, fileName: this.backupForm.name + ".sql", size: "12.8MB", createTime: new Date().toLocaleString(), status: "success" }); this.$message.success("备份完成"); }, 1500); },
    showRestoreDialog() { this.restoreDialogVisible = true; },
    confirmRestore() { this.$message.success("恢复成功，系统即将重启"); this.restoreDialogVisible = false; },
    showCleanDialog() { this.cleanDialogVisible = true; },
    confirmClean() { this.$message.success("清理完成"); this.cleanDialogVisible = false; },
    downloadBackup() { this.$message.success("开始下载"); },
    deleteBackup(r) { this.$confirm("确认删除？").then(() => { this.backupRecords = this.backupRecords.filter(x => x.id !== r.id); this.$message.success("删除成功"); }); }
  }
};
</script>

<style scoped>
.admin-settings {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}
.page-header-card {
  margin-bottom: 20px;
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-content h2 {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 600;
}
.header-content p {
  margin: 0;
  color: #909399;
}
.tab-card {
  border-radius: 12px;
  overflow: hidden;
}
.p-6 {
  padding: 24px;
}
.avatar-uploader .el-upload {
  width: 140px;
  height: 140px;
  border-radius: 8px;
  border: 1px dashed #eee;
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar {
  width: 140px;
  height: 140px;
  object-fit: cover;
  border-radius: 8px;
}
.tip {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}
.full-height {
  height: 100%;
}
.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  margin-bottom: 12px;
}
.no-role-tip {
  padding: 60px 0;
  text-align: center;
  color: #999;
}
.log-filter {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}
.pagination-right {
  display: flex;
  justify-content: flex-end;
}
.tool-card {
  text-align: center;
  padding: 32px 20px;
  cursor: pointer;
  transition: all 0.3s;
}
.tool-card i {
  font-size: 36px;
  color: #409eff;
  margin-bottom: 16px;
}
.tool-card h3 {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
}
.tool-card p {
  margin: 0;
  color: #999;
}
.tool-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.05);
}
.mt-4 {
  margin-top: 16px;
}
.mt-6 {
  margin-top: 24px;
}
</style>