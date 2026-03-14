<template>
  <div class="data-statistics-page">
    <div class="page-header">
      <el-button type="text" @click="$router.back()" class="back-btn">
        <i class="el-icon-arrow-left"></i> 返回
      </el-button>
      <h2 class="page-title">运动数据统计详情</h2>
      <div class="page-actions">
        <el-button type="primary" size="small">导出报告</el-button>
      </div>
    </div>

    <div class="page-content">
      <!-- 筛选条件 -->
      <div class="filter-section">
        <el-form :inline="true" class="filter-form">
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              size="small"
            ></el-date-picker>
          </el-form-item>
          <el-form-item label="班级">
            <el-select v-model="selectedClass" placeholder="请选择班级" size="small">
              <el-option label="2023级1班" value="class1"></el-option>
              <el-option label="2023级2班" value="class2"></el-option>
              <el-option label="2023级3班" value="class3"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small">查询</el-button>
            <el-button size="small">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 统计概览 -->
      <div class="stats-overview">
        <el-row :gutter="24">
          <el-col :xs="24" :sm="12" :md="12" :lg="6" class="stat-col">
            <div class="stat-card">
              <div class="stat-content">
                <span class="stat-label">总运动次数</span>
                <span class="stat-value">2,345</span>
              </div>
              <div class="stat-icon">
                <i class="el-icon-s-data"></i>
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="12" :lg="6" class="stat-col">
            <div class="stat-card">
              <div class="stat-content">
                <span class="stat-label">平均运动时长</span>
                <span class="stat-value">45分钟</span>
              </div>
              <div class="stat-icon">
                <i class="el-icon-time"></i>
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="12" :lg="6" class="stat-col">
            <div class="stat-card">
              <div class="stat-content">
                <span class="stat-label">总卡路里消耗</span>
                <span class="stat-value">123,456</span>
              </div>
              <div class="stat-icon">
                <i class="el-icon-fire"></i>
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="12" :lg="6" class="stat-col">
            <div class="stat-card">
              <div class="stat-content">
                <span class="stat-label">参与率</span>
                <span class="stat-value">89.5%</span>
              </div>
              <div class="stat-icon">
                <i class="el-icon-user"></i>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 图表区域 -->
      <div class="charts-section">
        <el-row :gutter="24">
          <el-col :xs="24" class="chart-col">
            <div class="chart-card">
              <div class="card-header">
                <span class="card-title">运动数据趋势图</span>
              </div>
              <div class="card-content">
                <div id="trendChart" class="chart-container"></div>
              </div>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :xs="24" :lg="12" class="chart-col">
            <div class="chart-card">
              <div class="card-header">
                <span class="card-title">运动类型分布</span>
              </div>
              <div class="card-content">
                <div id="typeChart" class="chart-container"></div>
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :lg="12" class="chart-col">
            <div class="chart-card">
              <div class="card-header">
                <span class="card-title">班级运动对比</span>
              </div>
              <div class="card-content">
                <div id="classChart" class="chart-container"></div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 数据表格 -->
      <div class="table-section">
        <div class="chart-card">
          <div class="card-header">
            <span class="card-title">运动数据明细</span>
          </div>
          <div class="card-content">
            <el-table :data="tableData" stripe style="width: 100%">
              <el-table-column prop="date" label="日期" width="120"></el-table-column>
              <el-table-column prop="class" label="班级" width="120"></el-table-column>
              <el-table-column prop="type" label="运动类型" width="120"></el-table-column>
              <el-table-column prop="duration" label="运动时长(分钟)"></el-table-column>
              <el-table-column prop="calories" label="卡路里消耗"></el-table-column>
              <el-table-column prop="participants" label="参与人数"></el-table-column>
              <el-table-column prop="averageHeartRate" label="平均心率"></el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template slot-scope="scope">
                  <el-tag :type="scope.row.status === '正常' ? 'success' : 'danger'" size="small">
                    {{ scope.row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" fixed="right">
                <template slot-scope="scope">
                  <el-button type="text" size="small">详情</el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="pagination-container">
              <el-pagination
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
                :current-page="currentPage"
                :page-sizes="[10, 20, 50, 100]"
                :page-size="pageSize"
                layout="total, sizes, prev, pager, next, jumper"
                :total="total"
              ></el-pagination>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'DataStatistics',
  data() {
    return {
      dateRange: [],
      selectedClass: '',
      tableData: [
        { date: '2023-06-10', class: '2023级1班', type: '跑步', duration: 45, calories: 350, participants: 45, averageHeartRate: 135, status: '正常' },
        { date: '2023-06-10', class: '2023级2班', type: '篮球', duration: 60, calories: 480, participants: 38, averageHeartRate: 142, status: '正常' },
        { date: '2023-06-09', class: '2023级1班', type: '跳绳', duration: 30, calories: 220, participants: 45, averageHeartRate: 128, status: '正常' },
        { date: '2023-06-09', class: '2023级3班', type: '足球', duration: 70, calories: 520, participants: 42, averageHeartRate: 145, status: '正常' },
        { date: '2023-06-08', class: '2023级2班', type: '跑步', duration: 50, calories: 380, participants: 38, averageHeartRate: 138, status: '正常' }
      ],
      currentPage: 1,
      pageSize: 10,
      total: 50,
      trendChart: null,
      typeChart: null,
      classChart: null
    }
  },
  mounted() {
    this.initCharts()
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    this.destroyCharts()
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    handleSizeChange(val) {
      this.pageSize = val
    },
    handleCurrentChange(val) {
      this.currentPage = val
    },
    initCharts() {
      // 初始化趋势图
      const trendChartDom = document.getElementById('trendChart')
      if (trendChartDom) {
        this.trendChart = echarts.init(trendChartDom)
        const trendOption = {
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            data: ['运动次数', '卡路里消耗'],
            textStyle: {
              color: '#606266'
            }
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            axisLabel: {
              color: '#606266'
            }
          },
          yAxis: [
            {
              type: 'value',
              name: '运动次数',
              axisLabel: {
                color: '#606266'
              }
            },
            {
              type: 'value',
              name: '卡路里消耗',
              axisLabel: {
                color: '#606266'
              }
            }
          ],
          series: [
            {
              name: '运动次数',
              type: 'line',
              data: [120, 132, 101, 134, 90, 230, 210],
              itemStyle: {
                color: '#409eff'
              }
            },
            {
              name: '卡路里消耗',
              type: 'line',
              yAxisIndex: 1,
              data: [220, 182, 191, 234, 290, 330, 310],
              itemStyle: {
                color: '#67c23a'
              }
            }
          ]
        }
        this.trendChart.setOption(trendOption)
      }

      // 初始化运动类型分布饼图
      const typeChartDom = document.getElementById('typeChart')
      if (typeChartDom) {
        this.typeChart = echarts.init(typeChartDom)
        const typeOption = {
          tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
          },
          legend: {
            orient: 'vertical',
            left: 10,
            data: ['跑步', '篮球', '足球', '跳绳', '其他'],
            textStyle: {
              color: '#606266'
            }
          },
          series: [
            {
              name: '运动类型',
              type: 'pie',
              radius: ['40%', '70%'],
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
              },
              label: {
                show: false,
                position: 'center'
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: 20,
                  fontWeight: 'bold'
                }
              },
              labelLine: {
                show: false
              },
              data: [
                { value: 35, name: '跑步' },
                { value: 25, name: '篮球' },
                { value: 20, name: '足球' },
                { value: 15, name: '跳绳' },
                { value: 5, name: '其他' }
              ]
            }
          ]
        }
        this.typeChart.setOption(typeOption)
      }

      // 初始化班级运动对比柱状图
      const classChartDom = document.getElementById('classChart')
      if (classChartDom) {
        this.classChart = echarts.init(classChartDom)
        const classOption = {
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            }
          },
          legend: {
            data: ['运动次数', '平均时长'],
            textStyle: {
              color: '#606266'
            }
          },
          xAxis: {
            type: 'category',
            data: ['2023级1班', '2023级2班', '2023级3班', '2023级4班', '2023级5班'],
            axisLabel: {
              color: '#606266',
              rotate: 30
            }
          },
          yAxis: {
            type: 'value',
            axisLabel: {
              color: '#606266'
            }
          },
          series: [
            {
              name: '运动次数',
              type: 'bar',
              data: [120, 200, 150, 80, 70],
              itemStyle: {
                color: '#409eff'
              }
            },
            {
              name: '平均时长',
              type: 'bar',
              data: [45, 50, 42, 38, 40],
              itemStyle: {
                color: '#67c23a'
              }
            }
          ]
        }
        this.classChart.setOption(classOption)
      }
    },
    destroyCharts() {
      if (this.trendChart) {
        this.trendChart.dispose()
        this.trendChart = null
      }
      if (this.typeChart) {
        this.typeChart.dispose()
        this.typeChart = null
      }
      if (this.classChart) {
        this.classChart.dispose()
        this.classChart = null
      }
    },
    handleResize() {
      if (this.trendChart) {
        this.trendChart.resize()
      }
      if (this.typeChart) {
        this.typeChart.resize()
      }
      if (this.classChart) {
        this.classChart.resize()
      }
    }
  }
}
</script>

<style scoped>
.data-statistics-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 10px 0;
}

.back-btn {
  font-size: 14px;
  color: #606266;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.page-actions {
  display: flex;
  gap: 10px;
}

.filter-section {
  background-color: #fff;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.filter-form {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stats-overview {
  margin-bottom: 24px;
}

.stat-col {
  margin-bottom: 24px;
}

.stat-card {
  background-color: #fff;
  border-radius: 4px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-content {
  flex: 1;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-icon {
  font-size: 32px;
  color: #409eff;
}

.charts-section {
  margin-bottom: 24px;
}

.chart-col {
  margin-bottom: 24px;
}

.chart-card {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.chart-card .card-header {
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
}

.chart-card .card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-card .card-content {
  padding: 20px;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.table-section {
  margin-bottom: 24px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>