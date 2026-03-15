<template>
  <div class="admin-exercise-data">
    <el-card shadow="hover" class="page-header">
      <h2>运动数据管理</h2>
      <p>管理系统内所有用户的运动数据</p>
    </el-card>

    <!-- 搜索栏 -->
    <el-card shadow="hover" class="search-panel">
      <div class="search-row">
        <el-input
          v-model="searchKey"
          placeholder="搜索：用户ID/姓名/运动类型"
          style="width: 300px"
          prefix-icon="el-icon-search"
          clearable
        />

        <el-select v-model="filter.exerciseType" placeholder="运动类型" style="width: 150px">
          <el-option label="全部" value="" />
          <el-option label="跑步" value="running" />
          <el-option label="游泳" value="swimming" />
          <el-option label="篮球" value="basketball" />
          <el-option label="足球" value="football" />
          <el-option label="健身" value="fitness" />
          <el-option label="其他" value="other" />
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

    <!-- 数据统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon running">
            <i class="el-icon-position"></i>
          </div>
          <div class="stat-content">
            <h3>运动次数</h3>
            <p class="stat-value">{{ stats.exerciseCount || 0 }}</p>
            <p class="stat-desc">次</p>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon distance">
            <i class="el-icon-location"></i>
          </div>
          <div class="stat-content">
            <h3>总距离</h3>
            <p class="stat-value">{{ stats.totalDistance || 0 }}</p>
            <p class="stat-desc">公里</p>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon time">
            <i class="el-icon-time"></i>
          </div>
          <div class="stat-content">
            <h3>总时长</h3>
            <p class="stat-value">{{ stats.totalDuration || 0 }}</p>
            <p class="stat-desc">小时</p>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon calorie">
            <i class="el-icon-star-on"></i>
          </div>
          <div class="stat-content">
            <h3>总消耗</h3>
            <p class="stat-value">{{ stats.totalCalories || 0 }}</p>
            <p class="stat-desc">千卡</p>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 运动数据列表 -->
    <el-card shadow="hover" class="table-panel">
      <div class="table-header">
        <h3>运动数据列表</h3>
        <div class="table-actions">
          <el-button type="primary" icon="el-icon-download" @click="exportData">导出数据</el-button>
          <el-button type="warning" icon="el-icon-refresh" @click="refreshData">刷新</el-button>
        </div>
      </div>

      <el-table
        :data="exerciseDataList"
        border
        stripe
        height="500"
        v-loading="loading"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="user_name" label="用户" width="120" />
        <el-table-column label="运动类型" width="120" align="center">
          <template #default="{row}">
            <el-tag :type="getExerciseTypeTag(row.exercise_type)">
              {{ getExerciseTypeText(row.exercise_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="距离" width="100" align="center">
          <template #default="{row}">
            <span v-if="row.distance" class="distance">{{ row.distance }} km</span>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        <el-table-column label="时长" width="100" align="center">
          <template #default="{row}">
            <span v-if="row.duration" class="duration">{{ formatDuration(row.duration) }}</span>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        <el-table-column label="消耗" width="100" align="center">
          <template #default="{row}">
            <span v-if="row.calories" class="calories">{{ row.calories }} kcal</span>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        <el-table-column label="平均心率" width="120" align="center">
          <template #default="{row}">
            <span v-if="row.avg_heart_rate" class="heart-rate">{{ row.avg_heart_rate }} BPM</span>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        <el-table-column label="最大心率" width="120" align="center">
          <template #default="{row}">
            <span v-if="row.max_heart_rate" class="heart-rate">{{ row.max_heart_rate }} BPM</span>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="start_time" label="开始时间" width="180" />
        <el-table-column prop="end_time" label="结束时间" width="180" />
        <el-table-column label="操作" width="120" align="center">
          <template #default="{row}">
            <el-button type="text" @click="viewDetail(row)">详情</el-button>
            <el-button type="text" danger @click="deleteData(row)">删除</el-button>
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

    <!-- 数据详情对话框 -->
    <el-dialog
      title="运动数据详情"
      :visible.sync="detailVisible"
      width="700px"
    >
      <div v-if="currentData" class="detail-content">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="用户">{{ currentData.user_name }}</el-descriptions-item>
          <el-descriptions-item label="运动类型">
            <el-tag :type="getExerciseTypeTag(currentData.exercise_type)">
              {{ getExerciseTypeText(currentData.exercise_type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="距离">{{ currentData.distance || 0 }} km</el-descriptions-item>
          <el-descriptions-item label="时长">{{ formatDuration(currentData.duration) }}</el-descriptions-item>
          <el-descriptions-item label="消耗">{{ currentData.calories || 0 }} kcal</el-descriptions-item>
          <el-descriptions-item label="平均心率">{{ currentData.avg_heart_rate || 0 }} BPM</el-descriptions-item>
          <el-descriptions-item label="最大心率">{{ currentData.max_heart_rate || 0 }} BPM</el-descriptions-item>
          <el-descriptions-item label="平均速度">{{ currentData.avg_speed || 0 }} km/h</el-descriptions-item>
          <el-descriptions-item label="最大速度">{{ currentData.max_speed || 0 }} km/h</el-descriptions-item>
          <el-descriptions-item label="步数">{{ currentData.steps || 0 }}</el-descriptions-item>
          <el-descriptions-item label="步频">{{ currentData.cadence || 0 }} 步/分钟</el-descriptions-item>
          <el-descriptions-item label="海拔变化">{{ currentData.elevation_gain || 0 }} m</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ currentData.start_time }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ currentData.end_time }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'AdminExerciseData',
  data() {
    return {
      loading: false,
      searchKey: '',
      filter: {
        exerciseType: ''
      },
      dateRange: [],
      pageSize: 10,
      currentPage: 1,
      total: 0,
      stats: {
        exerciseCount: 856,
        totalDistance: 1250.5,
        totalDuration: 320,
        totalCalories: 125000
      },
      exerciseDataList: [
        {
          id: 1,
          user_name: '曹睿焜',
          exercise_type: 'running',
          distance: 5.2,
          duration: 1800,
          calories: 320,
          avg_heart_rate: 145,
          max_heart_rate: 165,
          avg_speed: 10.4,
          max_speed: 12.5,
          steps: 6500,
          cadence: 180,
          elevation_gain: 50,
          start_time: '2025-12-20 07:30:00',
          end_time: '2025-12-20 08:00:00'
        },
        {
          id: 2,
          user_name: '张小明',
          exercise_type: 'basketball',
          distance: 3.5,
          duration: 3600,
          calories: 450,
          avg_heart_rate: 140,
          max_heart_rate: 160,
          avg_speed: 3.5,
          max_speed: 8.0,
          steps: 4200,
          cadence: 140,
          elevation_gain: 20,
          start_time: '2025-12-20 16:00:00',
          end_time: '2025-12-20 17:00:00'
        },
        {
          id: 3,
          user_name: '李老师',
          exercise_type: 'swimming',
          distance: 1.0,
          duration: 2700,
          calories: 280,
          avg_heart_rate: 130,
          max_heart_rate: 150,
          avg_speed: 1.3,
          max_speed: 2.0,
          steps: 0,
          cadence: 0,
          elevation_gain: 0,
          start_time: '2025-12-20 18:30:00',
          end_time: '2025-12-20 19:15:00'
        }
      ],
      detailVisible: false,
      currentData: null
    }
  },
  methods: {
    async fetchStats() {
      this.stats = {
        exerciseCount: 856,
        totalDistance: 1250.5,
        totalDuration: 320,
        totalCalories: 125000
      }
    },
    async fetchExerciseData() {
      this.loading = true
      this.total = this.exerciseDataList.length
      this.loading = false
    },
    doSearch() {
      this.$message.success('搜索完成')
    },
    resetSearch() {
      this.searchKey = ''
      this.filter.exerciseType = ''
      this.dateRange = []
      this.$message.success('已重置')
    },
    handleSizeChange(val) {
      this.pageSize = val
    },
    handlePageChange(val) {
      this.currentPage = val
    },
    getExerciseTypeTag(type) {
      const map = { running: 'primary', swimming: 'success', basketball: 'warning', football: 'danger', fitness: 'info' }
      return map[type] || ''
    },
    getExerciseTypeText(type) {
      const map = { running: '跑步', swimming: '游泳', basketball: '篮球', football: '足球', fitness: '健身', other: '其他' }
      return map[type] || '未知'
    },
    formatDuration(sec) {
      if (!sec) return '-'
      const h = Math.floor(sec / 3600)
      const m = Math.floor((sec % 3600) / 60)
      return h ? `${h}小时${m}分钟` : `${m}分钟`
    },
    viewDetail(row) {
      this.currentData = row
      this.detailVisible = true
    },
    deleteData(row) {
      this.$confirm('确定删除？').then(() => {
        this.exerciseDataList = this.exerciseDataList.filter(x => x.id !== row.id)
        this.$message.success('删除成功')
      }).catch(() => {})
    },
    exportData() {
      this.$message.success('导出功能已就绪')
    },
    refreshData() {
      this.$message.success('刷新成功')
    }
  },
  mounted() {
    this.fetchStats()
    this.fetchExerciseData()
  }
}
</script>

<style scoped>
.admin-exercise-data {
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
.stat-icon.running { background: #409eff; }
.stat-icon.distance { background: #67c23a; }
.stat-icon.time { background: #e6a23c; }
.stat-icon.calorie { background: #f56c6c; }
.stat-content h3 { font-size: 16px; margin: 0 0 5px; }
.stat-value { font-size: 22px; font-weight: bold; color: #409eff; }
.stat-desc { font-size: 12px; color: #909399; }
.table-panel { margin-bottom: 20px; }
.table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.pagination { display: flex; justify-content: flex-end; padding: 15px 0; }
.distance { color: #67c23a; font-weight: bold; }
.duration { color: #e6a23c; font-weight: bold; }
.calories { color: #f56c6c; font-weight: bold; }
.heart-rate { color: #f56c6c; font-weight: bold; }
.no-data { color: #909399; }
</style>