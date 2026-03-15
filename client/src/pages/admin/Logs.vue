<template>
  <div class="admin-logs">
    <el-card shadow="hover" class="page-header">
      <h2>日志与监控</h2>
      <p>管理系统日志和实时监控</p>
    </el-card>

    <!-- 搜索栏 -->
    <el-card shadow="hover" class="search-panel">
      <div class="search-row">
        <el-input
          v-model="searchKey"
          placeholder="搜索：用户ID/操作内容/IP地址"
          style="width: 300px"
          prefix-icon="el-icon-search"
          clearable
        />

        <el-select v-model="filter.logType" placeholder="日志类型" style="width: 150px">
          <el-option label="全部" value="" />
          <el-option label="登录日志" value="login" />
          <el-option label="操作日志" value="operation" />
          <el-option label="系统日志" value="system" />
          <el-option label="错误日志" value="error" />
          <el-option label="安全日志" value="security" />
        </el-select>

        <el-select v-model="filter.logLevel" placeholder="日志级别" style="width: 150px">
          <el-option label="全部" value="" />
          <el-option label="信息" value="info" />
          <el-option label="警告" value="warning" />
          <el-option label="错误" value="error" />
          <el-option label="调试" value="debug" />
        </el-select>

        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 300px"
        />

        <el-button type="primary" @click="doSearch">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>
    </el-card>

    <!-- 系统监控 -->
    <el-card shadow="hover" class="monitor-panel">
      <div class="panel-header">
        <h3>系统监控</h3>
        <div class="panel-actions">
          <el-button type="primary" icon="el-icon-refresh" @click="refreshMonitor">刷新</el-button>
        </div>
      </div>

      <el-row :gutter="20" class="monitor-stats">
        <el-col :span="6">
          <div class="monitor-item">
            <div class="monitor-icon cpu">
              <el-icon><Cpu /></el-icon>
            </div>
            <div class="monitor-content">
              <h4>CPU使用率</h4>
              <p class="monitor-value">{{ monitorData.cpuUsage || 0 }}%</p>
              <p class="monitor-status" :class="getCpuStatusClass(monitorData.cpuUsage)">
                {{ getCpuStatusText(monitorData.cpuUsage) }}
              </p>
            </div>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="monitor-item">
            <div class="monitor-icon memory">
              <el-icon><Memory /></el-icon>
            </div>
            <div class="monitor-content">
              <h4>内存使用率</h4>
              <p class="monitor-value">{{ monitorData.memoryUsage || 0 }}%</p>
              <p class="monitor-status" :class="getMemoryStatusClass(monitorData.memoryUsage)">
                {{ getMemoryStatusText(monitorData.memoryUsage) }}
              </p>
            </div>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="monitor-item">
            <div class="monitor-icon disk">
              <el-icon><HardDisk /></el-icon>
            </div>
            <div class="monitor-content">
              <h4>磁盘使用率</h4>
              <p class="monitor-value">{{ monitorData.diskUsage || 0 }}%</p>
              <p class="monitor-status" :class="getDiskStatusClass(monitorData.diskUsage)">
                {{ getDiskStatusText(monitorData.diskUsage) }}
              </p>
            </div>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="monitor-item">
            <div class="monitor-icon network">
              <el-icon><Connection /></el-icon>
            </div>
            <div class="monitor-content">
              <h4>在线用户</h4>
              <p class="monitor-value">{{ monitorData.onlineUsers || 0 }}</p>
              <p class="monitor-status">当前在线</p>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 日志列表 -->
    <el-card shadow="hover" class="table-panel">
      <div class="table-header">
        <h3>系统日志</h3>
        <div class="table-actions">
          <el-button type="primary" icon="el-icon-download" @click="exportLogs">导出日志</el-button>
          <el-button type="danger" icon="el-icon-delete" @click="clearLogs">清空日志</el-button>
          <el-button type="warning" icon="el-icon-refresh" @click="refreshLogs">刷新</el-button>
        </div>
      </div>

      <el-table
        :data="logList"
        border
        stripe
        height="500"
        v-loading="loading"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column label="日志级别" width="100" align="center">
          <template #default="{row}">
            <el-tag :type="getLogLevelTag(row.log_level)" size="small">
              {{ getLogLevelText(row.log_level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="日志类型" width="120" align="center">
          <template #default="{row}">
            <el-tag :type="getLogTypeTag(row.log_type)" size="small">
              {{ getLogTypeText(row.log_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="user_name" label="用户" width="120" />
        <el-table-column prop="operation" label="操作内容" width="200" />
        <el-table-column prop="ip_address" label="IP地址" width="150" />
        <el-table-column prop="log_time" label="日志时间" width="180" />
        <el-table-column prop="details" label="详细信息" />
        <el-table-column label="操作" width="100" align="center">
          <template #default="{row}">
            <el-button type="text" @click="viewLogDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-size="pageSize"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 日志详情对话框 -->
    <el-dialog
      title="日志详情"
      :visible.sync="detailVisible"
      width="700px"
    >
      <div v-if="currentLog" class="detail-content">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="日志ID">{{ currentLog.id }}</el-descriptions-item>
          <el-descriptions-item label="日志级别">
            <el-tag :type="getLogLevelTag(currentLog.log_level)" size="small">
              {{ getLogLevelText(currentLog.log_level) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="日志类型">
            <el-tag :type="getLogTypeTag(currentLog.log_type)" size="small">
              {{ getLogTypeText(currentLog.log_type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="用户">{{ currentLog.user_name || '系统' }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ currentLog.ip_address }}</el-descriptions-item>
          <el-descriptions-item label="操作内容">{{ currentLog.operation }}</el-descriptions-item>
          <el-descriptions-item label="日志时间">{{ currentLog.log_time }}</el-descriptions-item>
          <el-descriptions-item label="详细信息" :span="2">
            <pre class="log-details">{{ currentLog.details }}</pre>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentLog.created_at }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { Cpu, Document, Connection } from '@element-plus/icons-vue'

export default {
  name: 'AdminLogs',
  components: {
    Cpu,
    Memory: Document,
    HardDisk: Document,
    Connection
  },
  data() {
    return {
      loading: false,
      searchKey: '',
      filter: {
        logType: '',
        logLevel: ''
      },
      dateRange: [],
      pageSize: 10,
      currentPage: 1,
      total: 0,
      // 监控数据
      monitorData: {
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        onlineUsers: 0
      },
      // 日志列表
      logList: [],
      // 详情
      detailVisible: false,
      currentLog: null
    }
  },
  mounted() {
    this.fetchMonitorData()
    this.fetchLogs()
    // 每30秒刷新一次监控数据
    this.monitorInterval = setInterval(() => {
      this.fetchMonitorData()
    }, 30000)
  },
  beforeUnmount() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval)
    }
  },
  methods: {
    // 获取监控数据
    async fetchMonitorData() {
      try {
        // 这里应该调用API获取监控数据
        // 暂时使用模拟数据
        this.monitorData = {
          cpuUsage: Math.floor(Math.random() * 30) + 20, // 20-50%
          memoryUsage: Math.floor(Math.random() * 40) + 30, // 30-70%
          diskUsage: Math.floor(Math.random() * 20) + 40, // 40-60%
          onlineUsers: Math.floor(Math.random() * 50) + 10 // 10-60
        }
      } catch (error) {
        console.error('获取监控数据失败:', error)
      }
    },
    // 获取日志数据
    async fetchLogs() {
      this.loading = true
      try {
        // 这里应该调用API获取日志数据
        // 暂时使用模拟数据
        this.logList = [
          {
            id: 1,
            log_level: 'info',
            log_type: 'login',
            user_name: '曹睿焜',
            operation: '用户登录',
            ip_address: '192.168.1.100',
            log_time: '2025-12-20 15:30:00',
            details: '用户曹睿焜成功登录系统，登录IP：192.168.1.100',
            created_at: '2025-12-20 15:30:00'
          },
          {
            id: 2,
            log_level: 'warning',
            log_type: 'operation',
            user_name: '管理员',
            operation: '删除用户',
            ip_address: '192.168.1.1',
            log_time: '2025-12-20 14:45:00',
            details: '管理员删除了用户ID为U005的用户，操作IP：192.168.1.1',
            created_at: '2025-12-20 14:45:00'
          },
          {
            id: 3,
            log_level: 'error',
            log_type: 'system',
            user_name: '系统',
            operation: '数据库连接失败',
            ip_address: '127.0.0.1',
            log_time: '2025-12-20 13:20:00',
            details: '数据库连接失败，错误信息：Connection refused',
            created_at: '2025-12-20 13:20:00'
          },
          {
            id: 4,
            log_level: 'info',
            log_type: 'security',
            user_name: '张小明',
            operation: '密码修改',
            ip_address: '192.168.1.101',
            log_time: '2025-12-20 12:10:00',
            details: '用户张小明成功修改密码，操作IP：192.168.1.101',
            created_at: '2025-12-20 12:10:00'
          },
          {
            id: 5,
            log_level: 'debug',
            log_type: 'system',
            user_name: '系统',
            operation: '系统启动',
            ip_address: '127.0.0.1',
            log_time: '2025-12-20 08:00:00',
            details: '系统启动完成，启动时间：2025-12-20 08:00:00',
            created_at: '2025-12-20 08:00:00'
          }
        ]
        this.total = this.logList.length
      } catch (error) {
        console.error('获取日志数据失败:', error)
        this.$message.error('获取日志数据失败')
      } finally {
        this.loading = false
      }
    },
    // 搜索
    doSearch() {
      this.currentPage = 1
      this.fetchLogs()
      this.$message.success('搜索完成')
    },
    // 重置搜索
    resetSearch() {
      this.searchKey = ''
      this.filter = {
        logType: '',
        logLevel: ''
      }
      this.dateRange = []
      this.currentPage = 1
      this.fetchLogs()
    },
    // 分页
    handleSizeChange(val) {
      this.pageSize = val
      this.fetchLogs()
    },
    handlePageChange(val) {
      this.currentPage = val
      this.fetchLogs()
    },
    // 获取日志级别标签
    getLogLevelTag(level) {
      const levelMap = {
        info: 'success',
        warning: 'warning',
        error: 'danger',
        debug: 'info'
      }
      return levelMap[level] || ''
    },
    // 获取日志级别文本
    getLogLevelText(level) {
      const levelMap = {
        info: '信息',
        warning: '警告',
        error: '错误',
        debug: '调试'
      }
      return levelMap[level] || '未知'
    },
    // 获取日志类型标签
    getLogTypeTag(type) {
      const typeMap = {
        login: 'primary',
        operation: 'success',
        system: 'warning',
        error: 'danger',
        security: 'info'
      }
      return typeMap[type] || ''
    },
    // 获取日志类型文本
    getLogTypeText(type) {
      const typeMap = {
        login: '登录日志',
        operation: '操作日志',
        system: '系统日志',
        error: '错误日志',
        security: '安全日志'
      }
      return typeMap[type] || '未知'
    },
    // 获取CPU状态
    getCpuStatusClass(usage) {
      if (usage >= 80) return 'status-danger'
      if (usage >= 60) return 'status-warning'
      return 'status-normal'
    },
    getCpuStatusText(usage) {
      if (usage >= 80) return '过高'
      if (usage >= 60) return '偏高'
      return '正常'
    },
    // 获取内存状态
    getMemoryStatusClass(usage) {
      if (usage >= 85) return 'status-danger'
      if (usage >= 70) return 'status-warning'
      return 'status-normal'
    },
    getMemoryStatusText(usage) {
      if (usage >= 85) return '过高'
      if (usage >= 70) return '偏高'
      return '正常'
    },
    // 获取磁盘状态
    getDiskStatusClass(usage) {
      if (usage >= 90) return 'status-danger'
      if (usage >= 80) return 'status-warning'
      return 'status-normal'
    },
    getDiskStatusText(usage) {
      if (usage >= 90) return '过高'
      if (usage >= 80) return '偏高'
      return '正常'
    },
    // 查看日志详情
    viewLogDetail(row) {
      this.currentLog = row
      this.detailVisible = true
    },
    // 刷新监控
    refreshMonitor() {
      this.fetchMonitorData()
      this.$message.success('监控数据已刷新')
    },
    // 导出日志
    exportLogs() {
      this.$message.success('导出功能开发中')
    },
    // 清空日志
    clearLogs() {
      this.$confirm('确定清空所有日志吗？此操作不可恢复', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.logList = []
        this.total = 0
        this.$message.success('日志已清空')
      }).catch(() => {
        this.$message.info('已取消清空')
      })
    },
    // 刷新日志
    refreshLogs() {
      this.fetchLogs()
      this.$message.success('日志数据已刷新')
    }
  }
}
</script>

<style scoped>
.admin-logs {
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

.search-panel {
  margin-bottom: 20px;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.monitor-panel {
  margin-bottom: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-header h3 {
  margin: 0;
  color: #303133;
}

.panel-actions {
  display: flex;
  gap: 10px;
}

.monitor-stats {
  margin-bottom: 10px;
}

.monitor-item {
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  height: 120px;
}

.monitor-icon {
  width: 60px;
  height: 60px;
  margin-right: 20px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 28px;
  color: #fff;
}

.monitor-icon.cpu {
  background-color: #409eff;
}

.monitor-icon.memory {
  background-color: #67c23a;
}

.monitor-icon.disk {
  background-color: #e6a23c;
}

.monitor-icon.network {
  background-color: #f56c6c;
}

.monitor-content h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #303133;
}

.monitor-value {
  margin: 0 0 5px 0;
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.monitor-status {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.monitor-status.status-normal {
  color: #67c23a;
}

.monitor-status.status-warning {
  color: #e6a23c;
}

.monitor-status.status-danger {
  color: #f56c6c;
}

.table-panel {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-header h3 {
  margin: 0;
  color: #303133;
}

.table-actions {
  display: flex;
  gap: 10px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
}

.detail-content {
  padding: 10px 0;
}

.log-details {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}
</style>
