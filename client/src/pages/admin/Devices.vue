<template>
  <div class="device-manager-page">
    <!-- 头部 -->
    <div class="page-header">
      <h2>设备管理中心</h2>
      <p>运动监测设备 · 实时监控 · 配置 · 升级 · 警告</p>
    </div>

    <!-- 搜索栏 -->
    <el-card shadow="never" class="search-card">
      <div class="search-row">
        <el-input v-model="searchKey" placeholder="搜索：MAC地址 / 设备型号 / 用户名" style="width:320px" prefix-icon="el-icon-search" clearable />

        <el-select v-model="filter.status" placeholder="设备状态" style="width:130px">
          <el-option label="全部" value="" />
          <el-option label="在线" value="online" />
          <el-option label="离线" value="offline" />
          <el-option label="未绑定" value="unbound" />
          <el-option label="异常" value="error" />
        </el-select>

        <el-select v-model="filter.model" placeholder="设备型号" style="width:150px">
          <el-option label="全部" value="" />
          <el-option label="心率手环" value="心率手环" />
          <el-option label="运动手表" value="运动手表" />
          <el-option label="运动传感器" value="运动传感器" />
        </el-select>

        <el-button type="primary" @click="doSearch">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>

        <div class="right-actions">
          <el-button type="primary" icon="el-icon-plus" @click="openAddDialog">新增设备</el-button>
          <el-button type="success" icon="el-icon-download" @click="exportAll">导出 Excel</el-button>
          <el-button type="warning" icon="el-icon-setting" @click="openBatchConfig">批量配置</el-button>
        </div>
      </div>
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="4" v-for="(item,i) in stats" :key="i">
        <div class="stat-card" :style="{background:item.bg}">
          <p class="title">{{item.title}}</p>
          <p class="value">{{item.value}}</p>
        </div>
      </el-col>
    </el-row>

    <!-- 批量操作栏 -->
    <div class="batch-bar" v-if="selected.length>0">
      <span>已选 {{selected.length}} 台</span>
      <el-button size="small" type="primary" @click="exportSelected">导出所选</el-button>
      <el-button size="small" type="success" @click="batchRestart">远程重启</el-button>
      <el-button size="small" type="warning" @click="batchUnbind">批量解绑</el-button>
      <el-button size="small" type="danger" @click="batchDelete">批量删除</el-button>
    </div>

    <!-- 设备列表 -->
    <el-card shadow="never" class="table-card">
      <el-table :data="deviceList" border stripe height="600" v-loading="loading" @selection-change="handleSelect">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="mac" label="MAC 地址" width="180" />
        <el-table-column prop="model" label="设备型号" width="130" />
        <el-table-column prop="firmware" label="固件版本" width="130" />
        <el-table-column prop="bindUser" label="绑定用户" width="120" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{row}">
            <el-tag :type="row.status === 'online' ? 'success' : row.status === 'offline' ? 'warning' : row.status === 'error' ? 'danger' : 'info'">
              {{ row.status === 'online' ? '在线' : row.status === 'offline' ? '离线' : row.status === 'error' ? '异常' : '未绑定' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="activateTime" label="激活时间" width="180" />
        <el-table-column label="操作" width="340" align="center">
          <template #default="{row}">
            <el-button type="text" @click="openDetail(row)">查看</el-button>
            <el-button type="text" @click="openConfig(row)">配置</el-button>
            <el-button type="text" @click="remoteRestart(row)">重启</el-button>
            <el-button type="text" @click="unbindDevice(row)">解绑</el-button>
            <el-button type="text" @click="openUpgrade(row)">升级</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="total" @size-change="handleSizeChange" @current-change="handlePageChange" />
      </div>
    </el-card>

    <!-- 实时监控 -->
    <el-card shadow="never" class="monitor-card">
      <template #header>
        <div class="card-header">
          <span>设备实时状态监控</span>
          <el-button type="text" icon="el-icon-refresh" @click="refreshMonitor" />
        </div>
      </template>
      <div class="monitor-grid">
        <div class="monitor-item" v-for="d in onlineDevices" :key="d.mac">
          <div class="top">
            <p class="mac">{{d.mac}}</p>
            <el-tag type="success">在线</el-tag>
          </div>
          <div class="info">
            <div>信号: {{d.signal}}%</div>
            <div>电量: {{d.battery}}%</div>
            <div>定位: {{d.location}}</div>
          </div>
          <el-progress :percentage="d.battery" :stroke-width="6" :color="d.battery>70?'#00c48c':d.battery>30?'#ff9f00':'#ff4d4f'" />
        </div>
      </div>
    </el-card>

    <!-- ==================== 弹窗 ==================== -->
    <!-- 设备配置中心 -->
    <el-dialog title="设备配置中心" :visible.sync="configVisible" width="700px">
      <el-form :model="configForm" label-width="150px" :inline="false">
        <el-form-item label="心率监测间隔(秒)">
          <el-slider v-model="configForm.heartRateInterval" :min="5" :max="120" :step="5" />
        </el-form-item>
        <el-form-item label="步数灵敏度">
          <el-slider v-model="configForm.stepSensitivity" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="久坐提醒(分钟)">
          <el-input-number v-model="configForm.sitRemind" :min="0" :max="120" />
        </el-form-item>
        <el-form-item label="睡眠监测开关">
          <el-switch v-model="configForm.sleepMonitor" />
        </el-form-item>
        <el-form-item label="最高心率告警">
          <el-input-number v-model="configForm.maxHeart" :min="100" :max="220" />
        </el-form-item>
        <el-form-item label="最低心率告警">
          <el-input-number v-model="configForm.minHeart" :min="40" :max="80" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="configVisible = false">取消</el-button>
        <el-button type="primary" @click="saveConfig">保存并下发</el-button>
      </template>
    </el-dialog>

    <!-- 固件升级 -->
    <el-dialog title="固件升级" :visible.sync="upgradeVisible" width="500px">
      <el-form label-width="100px">
        <el-form-item label="当前版本">
          <el-input disabled v-model="upgradeForm.current" />
        </el-form-item>
        <el-form-item label="目标版本">
          <el-input v-model="upgradeForm.target" />
        </el-form-item>
        <el-form-item label="固件文件">
          <el-upload drag :auto-upload="false">
            <i class="el-icon-upload" />
            <div class="el-upload__text">点击或拖拽上传</div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="upgradeVisible = false">取消</el-button>
        <el-button type="primary" @click="doUpgrade">开始升级</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import * as XLSX from 'xlsx'
export default {
  name: 'AdminDevices',
  data() {
    return {
      loading: false,
      searchKey: '',
      filter: { status: '', model: '' },
      selected: [],
      configVisible: false,
      upgradeVisible: false,
      configForm: { heartRateInterval: 30, stepSensitivity: 5, sitRemind: 45, sleepMonitor: true, maxHeart: 160, minHeart: 60 },
      upgradeForm: { current: '', target: '' },
      deviceList: [
        { mac: '00:1A:2B:3C:4D:01', model: '心率手环', firmware: 'V2.1.5', bindUser: '曹睿焜', status: 'online', signal: 92, battery: 86, location: '已开启', activateTime: '2025-09-01 10:00:00' },
        { mac: '00:1A:2B:3C:4D:02', model: '运动手表', firmware: 'V3.0.2', bindUser: '张小明', status: 'online', signal: 85, battery: 62, location: '已开启', activateTime: '2025-09-01 10:00:00' },
        { mac: '00:1A:2B:3C:4D:03', model: '运动传感器', firmware: 'V1.2.3', bindUser: '-', status: 'unbound', signal: 0, battery: 100, location: '关闭', activateTime: '2025-09-02 11:00:00' },
        { mac: '00:1A:2B:3C:4D:04', model: '心率手环', firmware: 'V2.1.5', bindUser: '李老师', status: 'offline', signal: 0, battery: 20, location: '关闭', activateTime: '2025-09-03 09:00:00' },
      ]
    }
  },
  computed: {
    total() { return this.deviceList.length },
    onlineDevices() { return this.deviceList.filter(d=>d.status==='online') },
    stats() {
      return [
        { title:'设备总数', value:this.deviceList.length, bg:'linear-gradient(135deg,#409EFF,#64a8ff)' },
        { title:'在线设备', value:this.onlineDevices.length, bg:'linear-gradient(135deg,#00c48c,#5ae8a0)' },
        { title:'离线设备', value:this.deviceList.filter(d=>d.status==='offline').length, bg:'linear-gradient(135deg,#ff9f00,#ffbc3c)' },
        { title:'异常设备', value:this.deviceList.filter(d=>d.status==='error').length, bg:'linear-gradient(135deg,#ff4d4f,#ff7875)' },
        { title:'未绑定设备', value:this.deviceList.filter(d=>d.status==='unbound').length, bg:'linear-gradient(135deg,#909399,#b1b3b8)' },
      ]
    }
  },
  methods: {
    doSearch(){ this.$message.success('搜索完成') },
    resetSearch(){ this.searchKey=''; this.filter={status:'',model:''} },
    handleSelect(val){ this.selected=val },
    handleSizeChange(){},
    handlePageChange(){},
    openAddDialog(){ this.$message.success('新增设备') },
    openBatchConfig(){ this.$message.success('批量配置') },
    refreshMonitor(){ this.$message.success('实时数据已刷新') },
    openDetail(row){ this.$message.info('查看：'+row.mac) },
    remoteRestart(row){ this.$message.success(row.mac+' 远程重启成功') },
    unbindDevice(row){ row.bindUser='-'; row.status='unbound'; this.$message.success('解绑成功') },
    openConfig(row){ this.configVisible=true },
    saveConfig(){ this.configVisible=false; this.$message.success('配置已下发') },
    openUpgrade(row){ this.upgradeForm.current=row.firmware; this.upgradeVisible=true },
    doUpgrade(){ this.upgradeVisible=false; this.$message.success('升级任务已启动') },
    batchRestart(){ this.$message.success('批量重启成功') },
    batchUnbind(){ this.selected.forEach(d=>{d.bindUser='-';d.status='unbound'}); this.selected=[]; this.$message.success('批量解绑成功') },
    batchDelete(){ this.deviceList=this.deviceList.filter(d=>!this.selected.some(s=>s.mac===d.mac)); this.selected=[]; this.$message.success('删除成功') },
    exportAll(){
      const data = this.deviceList.map(d=>({
        MAC地址:d.mac, 设备型号:d.model, 固件版本:d.firmware, 绑定用户:d.bindUser, 状态:d.status==='online'?'在线':d.status==='offline'?'离线':d.status==='error'?'异常':'未绑定', 激活时间:d.activateTime
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb,ws,'设备列表')
      XLSX.writeFile(wb,'设备管理列表.xlsx')
      this.$message.success('导出成功')
    },
    exportSelected(){
      const data = this.selected.map(d=>({
        MAC地址:d.mac, 设备型号:d.model, 固件版本:d.firmware, 绑定用户:d.bindUser, 状态:d.status==='online'?'在线':d.status==='offline'?'离线':d.status==='error'?'异常':'未绑定', 激活时间:d.activateTime
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb,ws,'所选设备')
      XLSX.writeFile(wb,'所选设备列表.xlsx')
      this.$message.success('导出成功')
    }
  }
}
</script>

<style scoped>
.device-manager-page {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
}
.page-header {
  background: #fff;
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.page-header h2 {
  margin: 0 0 6px;
  font-size: 22px;
  color: #1f2329;
}
.page-header p {
  margin: 0;
  color: #909399;
}
.search-card {
  border-radius: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.search-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.right-actions {
  margin-left: auto;
  display: flex;
  gap: 10px;
}
.stats-row {
  margin-bottom: 20px;
}
.stat-card {
  padding: 20px;
  border-radius: 16px;
  color: #fff;
  text-align: center;
}
.stat-card .title {
  font-size: 14px;
  margin: 0 0 8px;
  opacity: 0.9;
}
.stat-card .value {
  font-size: 26px;
  font-weight: bold;
  margin: 0;
}
.batch-bar {
  background: #fff;
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  display: flex;
  gap: 12px;
  align-items: center;
}
.table-card {
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  margin-bottom: 20px;
}
.pagination {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
}
.monitor-card {
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.monitor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
.monitor-item {
  background: #f7f8fa;
  padding: 16px;
  border-radius: 12px;
}
.monitor-item .top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.monitor-item .mac {
  font-weight: bold;
  margin: 0;
}
.monitor-item .info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
}
</style>