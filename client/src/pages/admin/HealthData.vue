<template>
  <div class="admin-health-data">
    <el-card shadow="hover" class="page-header">
      <h2>健康数据管理</h2>
      <p>管理系统内所有用户的健康数据</p>
    </el-card>

    <!-- 搜索栏 -->
    <el-card shadow="hover" class="search-panel">
      <div class="search-row">
        <el-input
          v-model="searchKey"
          placeholder="搜索：用户ID/姓名/设备ID"
          style="width: 300px"
          prefix-icon="el-icon-search"
          clearable
        />

        <el-select
          v-model="filter.dataType"
          placeholder="数据类型"
          style="width: 150px"
        >
          <el-option label="全部" value="" />
          <el-option label="心率" value="heart_rate" />
          <el-option label="血氧" value="blood_oxygen" />
          <el-option label="体温" value="body_temperature" />
          <el-option label="血压" value="blood_pressure" />
          <el-option label="血糖" value="blood_sugar" />
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
          <div class="stat-icon heart">
            <i class="el-icon-star-on"></i>
          </div>
          <div class="stat-content">
            <h3>心率数据</h3>
            <p class="stat-value">{{ stats.heartRateCount || 0 }}</p>
            <p class="stat-desc">条记录</p>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon oxygen">
            <i class="el-icon-data-line"></i>
          </div>
          <div class="stat-content">
            <h3>血氧数据</h3>
            <p class="stat-value">{{ stats.bloodOxygenCount || 0 }}</p>
            <p class="stat-desc">条记录</p>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon temp">
            <i class="el-icon-sunny"></i>
          </div>
          <div class="stat-content">
            <h3>体温数据</h3>
            <p class="stat-value">{{ stats.temperatureCount || 0 }}</p>
            <p class="stat-desc">条记录</p>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon pressure">
            <i class="el-icon-trend-charts"></i>
          </div>
          <div class="stat-content">
            <h3>血压数据</h3>
            <p class="stat-value">{{ stats.bloodPressureCount || 0 }}</p>
            <p class="stat-desc">条记录</p>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 健康数据列表 -->
    <el-card shadow="hover" class="table-panel">
      <div class="table-header">
        <h3>健康数据列表</h3>
        <div class="table-actions">
          <el-button type="primary" icon="el-icon-download" @click="exportData">
            导出数据
          </el-button>
          <el-button type="warning" icon="el-icon-refresh" @click="refreshData">
            刷新
          </el-button>
        </div>
      </div>

      <el-table
        :data="filteredList"
        border
        stripe
        height="500"
        v-loading="loading"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="user_name" label="用户" width="120" />
        <el-table-column prop="device_id" label="设备ID" width="150" />
        <el-table-column label="心率" width="100" align="center">
          <template v-slot="scope">
            <span v-if="scope.row.heart_rate" class="heart-rate">
              {{ scope.row.heart_rate }} BPM
            </span>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        <el-table-column label="血氧" width="100" align="center">
          <template v-slot="scope">
            <span v-if="scope.row.blood_oxygen" class="blood-oxygen">
              {{ scope.row.blood_oxygen }}%
            </span>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        <el-table-column label="体温" width="100" align="center">
          <template v-slot="scope">
            <span v-if="scope.row.body_temperature" class="temperature">
              {{ scope.row.body_temperature }}°C
            </span>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        <el-table-column label="血压" width="150" align="center">
          <template v-slot="scope">
            <span v-if="scope.row.blood_pressure_systolic && scope.row.blood_pressure_diastolic">
              {{ scope.row.blood_pressure_systolic }}/{{ scope.row.blood_pressure_diastolic }}
            </span>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="record_time" label="记录时间" width="180" />
        <el-table-column label="状态" width="100" align="center">
          <template v-slot="scope">
            <el-tag :type="getHealthStatus(scope.row).type">
              {{ getHealthStatus(scope.row).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center">
          <template v-slot="scope">
            <el-button type="text" @click="viewDetail(scope.row)">
              查看
            </el-button>
            <el-button type="text" danger @click="deleteData(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredList.length"
          :page-sizes="[10, 20, 50, 100]"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog title="健康数据详情" :visible.sync="detailVisible" width="700px">
      <div v-if="currentData" class="detail-content">
        <el-descriptions :column="2" border label-width="120px">
          <el-descriptions-item label="用户">{{ currentData.user_name }}</el-descriptions-item>
          <el-descriptions-item label="设备ID">{{ currentData.device_id }}</el-descriptions-item>
          <el-descriptions-item label="心率">
            {{ currentData.heart_rate || '-' }} BPM
          </el-descriptions-item>
          <el-descriptions-item label="血氧">
            {{ currentData.blood_oxygen || '-' }} %
          </el-descriptions-item>
          <el-descriptions-item label="体温">
            {{ currentData.body_temperature || '-' }} °C
          </el-descriptions-item>
          <el-descriptions-item label="血压">
            {{ currentData.blood_pressure_systolic || '-' }} / {{ currentData.blood_pressure_diastolic || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="血糖">
            {{ currentData.blood_sugar || '-' }} mmol/L
          </el-descriptions-item>
          <el-descriptions-item label="记录时间">
            {{ currentData.record_time }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "AdminHealthData",
  data() {
    return {
      loading: false,
      searchKey: "",
      filter: { dataType: "" },
      dateRange: [],
      pageSize: 10,
      currentPage: 1,
      detailVisible: false,
      currentData: null,
      stats: {
        heartRateCount: 12543,
        bloodOxygenCount: 9876,
        temperatureCount: 6543,
        bloodPressureCount: 4321
      },
      healthDataList: [
        {
          id: 1,
          user_name: "曹睿焜",
          device_id: "device001",
          heart_rate: 72,
          blood_oxygen: 98,
          body_temperature: 36.5,
          blood_pressure_systolic: 120,
          blood_pressure_diastolic: 80,
          blood_sugar: 5.2,
          record_time: "2025-12-20 15:30:00"
        },
        {
          id: 2,
          user_name: "张小明",
          device_id: "device002",
          heart_rate: 68,
          blood_oxygen: 97,
          body_temperature: 36.8,
          blood_pressure_systolic: 118,
          blood_pressure_diastolic: 78,
          blood_sugar: 5.0,
          record_time: "2025-12-20 14:45:00"
        },
        {
          id: 3,
          user_name: "李老师",
          device_id: "device003",
          heart_rate: 75,
          blood_oxygen: 96,
          body_temperature: 36.6,
          blood_pressure_systolic: 125,
          blood_pressure_diastolic: 82,
          blood_sugar: 5.5,
          record_time: "2025-12-20 13:20:00"
        }
      ]
    };
  },
  computed: {
    filteredList() {
      let result = [...this.healthDataList];
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        result = result.filter(
          (item) =>
            item.user_name.toLowerCase().includes(q) ||
            item.device_id.toLowerCase().includes(q)
        );
      }
      if (this.filter.dataType) {
        result = result.filter((item) => {
          switch (this.filter.dataType) {
            case "heart_rate":
              return item.heart_rate != null;
            case "blood_oxygen":
              return item.blood_oxygen != null;
            case "body_temperature":
              return item.body_temperature != null;
            case "blood_pressure":
              return item.blood_pressure_systolic != null;
            default:
              return true;
          }
        });
      }
      return result;
    }
  },
  methods: {
    doSearch() {
      this.$message.success("搜索完成");
    },
    resetSearch() {
      this.searchKey = "";
      this.filter.dataType = "";
      this.dateRange = [];
    },
    getHealthStatus(row) {
      if (row.heart_rate && (row.heart_rate < 60 || row.heart_rate > 100)) {
        return { type: "danger", text: "异常" };
      }
      if (row.blood_oxygen && row.blood_oxygen < 95) {
        return { type: "warning", text: "偏低" };
      }
      if (
        row.body_temperature &&
        (row.body_temperature < 36 || row.body_temperature > 37.5)
      ) {
        return { type: "warning", text: "异常" };
      }
      return { type: "success", text: "正常" };
    },
    viewDetail(row) {
      this.currentData = row;
      this.detailVisible = true;
    },
    deleteData(row) {
      this.$confirm("确定删除该健康数据？", "提示", { type: "warning" })
        .then(() => {
          this.healthDataList = this.healthDataList.filter(
            (item) => item.id !== row.id
          );
          this.$message.success("删除成功");
        })
        .catch(() => {});
    },
    exportData() {
      this.$message.success("导出功能已就绪");
    },
    refreshData() {
      this.$message.success("数据已刷新");
    },
    handleSizeChange(val) {
      this.pageSize = val;
    },
    handleCurrentChange(val) {
      this.currentPage = val;
    }
  }
};
</script>

<style scoped>
.admin-health-data {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header { margin-bottom: 20px; }
.page-header h2 { margin: 0 0 10px; color: #303133; }
.page-header p { margin: 0; color: #606266; }

.search-panel { margin-bottom: 20px; }
.search-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

.stats-row { margin-bottom: 20px; }
.stat-card { display: flex; flex-direction: column; align-items: center; padding: 15px 0; }
.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #fff;
  margin-bottom: 10px;
}
.stat-icon.heart { background: #f56c6c; }
.stat-icon.oxygen { background: #409eff; }
.stat-icon.temp { background: #e6a23c; }
.stat-icon.pressure { background: #67c23a; }

.stat-content h3 { font-size: 16px; margin: 0 0 5px; }
.stat-value { font-size: 22px; font-weight: bold; color: #409eff; }
.stat-desc { font-size: 12px; color: #909399; }

.table-panel { margin-bottom: 20px; }
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 15px 0;
}

.heart-rate { color: #f56c6c; font-weight: bold; }
.blood-oxygen { color: #409eff; font-weight: bold; }
.temperature { color: #e6a23c; font-weight: bold; }
.no-data { color: #909399; }
</style>