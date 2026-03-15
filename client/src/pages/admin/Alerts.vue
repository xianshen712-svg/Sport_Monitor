<template>
  <div class="admin-alerts">
    <el-card shadow="hover" class="page-header">
      <h2>警告管理</h2>
      <p>管理系统内所有警告信息</p>
    </el-card>

    <!-- 搜索栏 -->
    <el-card shadow="hover" class="search-panel">
      <div class="search-row">
        <el-input
          v-model="searchKey"
          placeholder="搜索：用户ID/姓名/设备ID/警告内容"
          style="width: 300px"
          prefix-icon="el-icon-search"
          clearable
        />

        <el-select v-model="filter.alertType" placeholder="警告类型" style="width: 150px">
          <el-option label="全部" value="" />
          <el-option label="心率异常" value="heart_rate" />
          <el-option label="血氧异常" value="blood_oxygen" />
          <el-option label="体温异常" value="body_temperature" />
          <el-option label="血压异常" value="blood_pressure" />
          <el-option label="设备离线" value="device_offline" />
          <el-option label="运动过量" value="over_exercise" />
          <el-option label="其他" value="other" />
        </el-select>

        <el-select v-model="filter.alertLevel" placeholder="警告级别" style="width: 150px">
          <el-option label="全部" value="" />
          <el-option label="低" value="low" />
          <el-option label="中" value="medium" />
          <el-option label="高" value="high" />
          <el-option label="紧急" value="critical" />
        </el-select>

        <el-select v-model="filter.status" placeholder="处理状态" style="width: 150px">
          <el-option label="全部" value="" />
          <el-option label="未处理" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="已处理" value="resolved" />
          <el-option label="已忽略" value="ignored" />
        </el-select>

        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 300px"
        />

        <el-button type="primary" @click="doSearch">
          <i class="el-icon-search"></i> 搜索
        </el-button>
        <el-button @click="resetSearch">
          <i class="el-icon-refresh"></i> 重置
        </el-button>
      </div>
    </el-card>

    <!-- 警告统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon total">
            <i class="el-icon-bell"></i>
          </div>
          <div class="stat-content">
            <h3>总警告数</h3>
            <p class="stat-value">{{ stats.totalAlerts || 0 }}</p>
            <p class="stat-desc">条</p>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon pending">
            <i class="el-icon-time"></i>
          </div>
          <div class="stat-content">
            <h3>未处理</h3>
            <p class="stat-value">{{ stats.pendingAlerts || 0 }}</p>
            <p class="stat-desc">条</p>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon critical">
            <i class="el-icon-warning"></i>
          </div>
          <div class="stat-content">
            <h3>紧急警告</h3>
            <p class="stat-value">{{ stats.criticalAlerts || 0 }}</p>
            <p class="stat-desc">条</p>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon resolved">
            <i class="el-icon-success"></i>
          </div>
          <div class="stat-content">
            <h3>已处理</h3>
            <p class="stat-value">{{ stats.resolvedAlerts || 0 }}</p>
            <p class="stat-desc">条</p>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 批量操作栏 -->
    <div class="batch-bar" v-if="selected.length > 0">
      <span>已选 {{ selected.length }} 项</span>
      <el-button type="primary" size="small" @click="batchMarkProcessing">标记为处理中</el-button>
      <el-button type="success" size="small" @click="batchMarkResolved">标记为已处理</el-button>
      <el-button type="warning" size="small" @click="batchMarkIgnored">标记为已忽略</el-button>
      <el-button type="danger" size="small" @click="batchDelete">批量删除</el-button>
    </div>

    <!-- 警告列表 -->
    <el-card shadow="hover" class="table-panel">
      <div class="table-header">
        <h3>警告列表</h3>
        <div class="table-actions">
          <el-button type="primary" icon="el-icon-download" @click="exportData">导出数据</el-button>
          <el-button type="warning" icon="el-icon-refresh" @click="refreshData">刷新</el-button>
        </div>
      </div>

      <el-table
        :data="alertList"
        border
        stripe
        height="500"
        v-loading="loading"
        @selection-change="handleSelect"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="user_name" label="用户" width="120" />
        <el-table-column prop="device_id" label="设备ID" width="150" />
        <el-table-column label="警告类型" width="120" align="center">
          <template #default="{row}">
            <el-tag :type="getAlertTypeTag(row.alert_type)" size="small">
              {{ getAlertTypeText(row.alert_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="警告级别" width="100" align="center">
          <template #default="{row}">
            <el-tag :type="getAlertLevelTag(row.alert_level)" size="small">
              {{ getAlertLevelText(row.alert_level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="alert_content" label="警告内容" width="200" />
        <el-table-column prop="alert_time" label="警告时间" width="180" />
        <el-table-column label="处理状态" width="100" align="center">
          <template #default="{row}">
            <el-tag :type="getStatusTag(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="handler_name" label="处理人" width="120" />
        <el-table-column prop="handle_time" label="处理时间" width="180" />
        <el-table-column label="操作" width="180" align="center">
          <template #default="{row}">
            <el-button type="text" @click="viewDetail(row)">详情</el-button>
            <el-button type="text" @click="handleAlert(row)" style="color: #409eff;">处理</el-button>
            <el-button type="text" @click="deleteAlert(row)" style="color: #f56c6c;">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

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

    <!-- 警告详情对话框 -->
    <el-dialog
      title="警告详情"
      :visible.sync="detailVisible"
      width="600px"
    >
      <div v-if="currentAlert" class="detail-content">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="用户">{{ currentAlert.user_name }}</el-descriptions-item>
          <el-descriptions-item label="设备ID">{{ currentAlert.device_id }}</el-descriptions-item>
          <el-descriptions-item label="警告类型">
            <el-tag :type="getAlertTypeTag(currentAlert.alert_type)" size="small">
              {{ getAlertTypeText(currentAlert.alert_type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="警告级别">
            <el-tag :type="getAlertLevelTag(currentAlert.alert_level)" size="small">
              {{ getAlertLevelText(currentAlert.alert_level) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="警告内容">{{ currentAlert.alert_content }}</el-descriptions-item>
          <el-descriptions-item label="警告时间">{{ currentAlert.alert_time }}</el-descriptions-item>
          <el-descriptions-item label="处理状态">
            <el-tag :type="getStatusTag(currentAlert.status)" size="small">
              {{ getStatusText(currentAlert.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="处理人">{{ currentAlert.handler_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="处理时间">{{ currentAlert.handle_time || '-' }}</el-descriptions-item>
          <el-descriptions-item label="处理备注">{{ currentAlert.handle_remark || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentAlert.created_at }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 处理警告对话框 -->
    <el-dialog
      title="处理警告"
      :visible.sync="handleVisible"
      width="500px"
    >
      <div v-if="currentAlert" class="handle-content">
        <el-form :model="handleForm" label-width="100px">
          <el-form-item label="处理状态">
            <el-select v-model="handleForm.status" placeholder="请选择处理状态">
              <el-option label="处理中" value="processing" />
              <el-option label="已处理" value="resolved" />
              <el-option label="已忽略" value="ignored" />
            </el-select>
          </el-form-item>
          <el-form-item label="处理备注">
            <el-input
              v-model="handleForm.remark"
              type="textarea"
              rows="4"
              placeholder="请输入处理备注"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="handleVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmHandle">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'AdminAlerts',
  data() {
    return {
      loading: false,
      searchKey: '',
      filter: {
        alertType: '',
        alertLevel: '',
        status: ''
      },
      dateRange: [],
      pageSize: 10,
      currentPage: 1,
      total: 0,
      selected: [],
      stats: {
        totalAlerts: 156,
        pendingAlerts: 23,
        criticalAlerts: 8,
        resolvedAlerts: 125
      },
      alertList: [
        {
          id: 1,
          user_name: '曹睿焜',
          device_id: 'device001',
          alert_type: 'heart_rate',
          alert_level: 'high',
          alert_content: '心率异常：心率达到165 BPM，超过安全阈值',
          alert_time: '2025-12-20 15:30:00',
          status: 'pending',
          handler_name: '',
          handle_time: '',
          handle_remark: '',
          created_at: '2025-12-20 15:30:00'
        },
        {
          id: 2,
          user_name: '张小明',
          device_id: 'device002',
          alert_type: 'device_offline',
          alert_level: 'medium',
          alert_content: '设备离线：设备已离线超过2小时',
          alert_time: '2025-12-20 14:45:00',
          status: 'processing',
          handler_name: '管理员',
          handle_time: '2025-12-20 15:00:00',
          handle_remark: '已通知用户检查设备',
          created_at: '2025-12-20 14:45:00'
        },
        {
          id: 3,
          user_name: '李老师',
          device_id: 'device003',
          alert_type: 'over_exercise',
          alert_level: 'critical',
          alert_content: '运动过量：连续运动超过3小时，建议休息',
          alert_time: '2025-12-20 13:20:00',
          status: 'resolved',
          handler_name: '管理员',
          handle_time: '2025-12-20 13:30:00',
          handle_remark: '已通知用户休息，用户已确认',
          created_at: '2025-12-20 13:20:00'
        }
      ],
      detailVisible: false,
      currentAlert: null,
      handleVisible: false,
      handleForm: {
        status: '',
        remark: ''
      }
    }
  },
  mounted() {
    this.fetchStats()
    this.fetchAlerts()
  },
  methods: {
    async fetchStats() {
      this.stats = {
        totalAlerts: 156,
        pendingAlerts: 23,
        criticalAlerts: 8,
        resolvedAlerts: 125
      }
    },
    async fetchAlerts() {
      this.loading = true
      this.total = this.alertList.length
      this.loading = false
    },
    doSearch() {
      this.$message.success('搜索完成')
    },
    resetSearch() {
      this.searchKey = ''
      this.filter = { alertType: '', alertLevel: '', status: '' }
      this.dateRange = []
      this.$message.success('已重置')
    },
    handleSizeChange(val) {
      this.pageSize = val
    },
    handlePageChange(val) {
      this.currentPage = val
    },
    handleSelect(val) {
      this.selected = val
    },
    getAlertTypeTag(type) {
      const map = {
        heart_rate: 'danger',
        blood_oxygen: 'warning',
        body_temperature: 'warning',
        blood_pressure: 'danger',
        device_offline: 'info',
        over_exercise: 'danger'
      }
      return map[type] || ''
    },
    getAlertTypeText(type) {
      const map = {
        heart_rate: '心率异常',
        blood_oxygen: '血氧异常',
        body_temperature: '体温异常',
        blood_pressure: '血压异常',
        device_offline: '设备离线',
        over_exercise: '运动过量',
        other: '其他'
      }
      return map[type] || '未知'
    },
    getAlertLevelTag(level) {
      const map = { low: 'info', medium: 'warning', high: 'danger', critical: 'danger' }
      return map[level] || ''
    },
    getAlertLevelText(level) {
      const map = { low: '低', medium: '中', high: '高', critical: '紧急' }
      return map[level] || '未知'
    },
    getStatusTag(status) {
      const map = { pending: 'warning', processing: 'primary', resolved: 'success', ignored: 'info' }
      return map[status] || ''
    },
    getStatusText(status) {
      const map = { pending: '未处理', processing: '处理中', resolved: '已处理', ignored: '已忽略' }
      return map[status] || '未知'
    },
    viewDetail(row) {
      this.currentAlert = row
      this.detailVisible = true
    },
    handleAlert(row) {
      this.currentAlert = row
      this.handleForm = { status: row.status, remark: row.handle_remark || '' }
      this.handleVisible = true
    },
    confirmHandle() {
      if (!this.handleForm.status) return this.$message.warning('请选择处理状态')
      const idx = this.alertList.findIndex(i => i.id === this.currentAlert.id)
      if (idx !== -1) {
        this.alertList[idx].status = this.handleForm.status
        this.alertList[idx].handler_name = '管理员'
        this.alertList[idx].handle_time = new Date().toLocaleString()
        this.alertList[idx].handle_remark = this.handleForm.remark
        this.$message.success('处理成功')
        this.handleVisible = false
        this.fetchStats()
      }
    },
    deleteAlert(row) {
      this.$confirm('确定删除这条警告吗？', '警告', { type: 'warning' }).then(() => {
        this.alertList = this.alertList.filter(i => i.id !== row.id)
        this.$message.success('删除成功')
        this.fetchStats()
      }).catch(() => {})
    },
    batchMarkProcessing() {
      this.selected.forEach(item => {
        const i = this.alertList.findIndex(a => a.id === item.id)
        if (i !== -1) {
          this.alertList[i].status = 'processing'
          this.alertList[i].handler_name = '管理员'
          this.alertList[i].handle_time = new Date().toLocaleString()
        }
      })
      this.selected = []
      this.$message.success('批量标记成功')
      this.fetchStats()
    },
    batchMarkResolved() {
      this.selected.forEach(item => {
        const i = this.alertList.findIndex(a => a.id === item.id)
        if (i !== -1) {
          this.alertList[i].status = 'resolved'
          this.alertList[i].handler_name = '管理员'
          this.alertList[i].handle_time = new Date().toLocaleString()
        }
      })
      this.selected = []
      this.$message.success('批量标记成功')
      this.fetchStats()
    },
    batchMarkIgnored() {
      this.selected.forEach(item => {
        const i = this.alertList.findIndex(a => a.id === item.id)
        if (i !== -1) {
          this.alertList[i].status = 'ignored'
          this.alertList[i].handler_name = '管理员'
          this.alertList[i].handle_time = new Date().toLocaleString()
        }
      })
      this.selected = []
      this.$message.success('批量标记成功')
      this.fetchStats()
    },
    batchDelete() {
      this.$confirm('确定删除选中项？', '提示', { type: 'warning' }).then(() => {
        this.alertList = this.alertList.filter(i => !this.selected.some(s => s.id === i.id))
        this.selected = []
        this.$message.success('删除成功')
        this.fetchStats()
      }).catch(() => {})
    },
    exportData() {
      this.$message.success('导出功能已就绪')
    },
    refreshData() {
      this.fetchStats()
      this.fetchAlerts()
      this.$message.success('刷新成功')
    }
  }
}
</script>

<style scoped>
.admin-alerts {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}
.page-header { margin-bottom: 20px; }
.search-panel { margin-bottom: 20px; }
.search-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.stats-row { margin-bottom: 20px; }
.stat-card { display: flex; flex-direction: column; align-items: center; padding: 15px 0; }
.stat-icon {
  width: 50px; height: 50px; border-radius: 50%; display: flex;
  align-items: center; justify-content: center; font-size: 20px;
  color: #fff; margin-bottom: 10px;
}
.stat-icon.total { background: #409eff; }
.stat-icon.pending { background: #e6a23c; }
.stat-icon.critical { background: #f56c6c; }
.stat-icon.resolved { background: #67c23a; }
.stat-content h3 { font-size: 16px; margin: 0 0 5px; }
.stat-value { font-size: 22px; font-weight: bold; color: #409eff; }
.stat-desc { font-size: 12px; color: #909399; }
.batch-bar {
  background: #fff; padding: 12px 16px; border-radius: 12px;
  margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  display: flex; gap: 12px; align-items: center;
}
.table-panel { margin-bottom: 20px; }
.table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.pagination { display: flex; justify-content: flex-end; padding: 15px 0; }
</style>