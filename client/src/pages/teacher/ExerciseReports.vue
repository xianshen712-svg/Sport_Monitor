<template>
  <div class="teacher-exercise-reports">
    <el-card shadow="hover" class="page-header">
      <el-button type="text" @click="$router.back()" class="back-btn">
        <i class="el-icon-arrow-left"></i> 返回
      </el-button>
      <h2>运动报告</h2>
      <p>班级：{{ userInfo.className }}</p>
    </el-card>
    
    <!-- 报告生成工具 -->
    <el-card shadow="hover" class="report-tool-card">
      <div class="tool-content">
        <h3>生成运动报告</h3>
        <el-form :model="reportForm" :rules="reportRules" ref="reportFormRef" inline>
          <el-form-item label="报告类型" prop="reportType">
            <el-select v-model="reportForm.reportType" placeholder="请选择报告类型" style="width: 180px">
              <el-option label="个人周报告" value="personal-weekly"></el-option>
              <el-option label="个人月报告" value="personal-monthly"></el-option>
              <el-option label="班级周报告" value="class-weekly"></el-option>
              <el-option label="班级月报告" value="class-monthly"></el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item label="学生" prop="studentId" v-if="['personal-weekly', 'personal-monthly'].includes(reportForm.reportType)">
            <el-select v-model="reportForm.studentId" placeholder="请选择学生" style="width: 200px">
              <el-option v-for="student in students" :key="student.studentId" :label="student.name" :value="student.studentId"></el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item label="时间范围" prop="timeRange">
            <el-date-picker
              v-model="reportForm.timeRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 300px"
            ></el-date-picker>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="generateReport">
              <el-icon><DocumentAdd /></el-icon> 生成报告
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
    
    <!-- 报告列表 -->
    <el-card shadow="hover" class="report-list-card">
      <div class="card-header">
        <h3>已生成报告</h3>
        <el-input
          v-model="searchReport"
          placeholder="搜索报告"
          clearable
          style="width: 250px"
          prefix-icon="el-icon-search"
        ></el-input>
      </div>
      
      <el-table :data="filteredReports" border stripe style="width: 100%" class="report-table">
        <el-table-column prop="reportId" label="报告ID" width="120" align="center"></el-table-column>
        <el-table-column prop="reportType" label="报告类型" width="140" align="center">
          <template v-slot="scope">
            <span>{{ getReportTypeText(scope.row.reportType) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="studentName" label="学生" width="100" align="center"></el-table-column>
        <el-table-column prop="dateRange" label="时间范围" width="180" align="center"></el-table-column>
        <el-table-column prop="generateTime" label="生成时间" width="180" align="center"></el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template v-slot="scope">
            <el-tag :type="scope.row.status === 'generated' ? 'success' : 'warning'">{{ scope.row.status === 'generated' ? '已生成' : '生成中' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center">
          <template v-slot="scope">
            <el-button type="primary" size="small" @click="viewReport(scope.row)" :disabled="scope.row.status !== 'generated'">
              <el-icon><View /></el-icon> 查看
            </el-button>
            <el-button type="success" size="small" @click="downloadReport(scope.row)" :disabled="scope.row.status !== 'generated'">
              <el-icon><Download /></el-icon> 下载
            </el-button>
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
          :total="filteredReports.length"
        ></el-pagination>
      </div>
    </el-card>
    
    <!-- 报告详情对话框 -->
    <el-dialog
      v-model="reportDialogVisible"
      title="运动报告详情"
      width="80%"
      :close-on-click-modal="false"
    >
      <div v-if="selectedReport" class="report-detail">
        <div class="report-header">
          <h3>{{ getReportTypeText(selectedReport.reportType) }}</h3>
          <p>{{ selectedReport.studentName }} - {{ selectedReport.dateRange }}</p>
        </div>
        
        <div class="report-content">
          <el-card shadow="hover" class="report-summary-card">
            <h4>报告摘要</h4>
            <div class="summary-content">
              {{ selectedReport.summary }}
            </div>
          </el-card>
          
          <el-card shadow="hover" class="report-data-card">
            <h4>运动数据</h4>
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12" :md="8">
                <div class="data-item">
                  <div class="data-label">总步数</div>
                  <div class="data-value">{{ selectedReport.data.totalSteps }}</div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8">
                <div class="data-item">
                  <div class="data-label">总运动时长</div>
                  <div class="data-value">{{ selectedReport.data.totalExerciseTime }} 分钟</div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8">
                <div class="data-item">
                  <div class="data-label">总卡路里消耗</div>
                  <div class="data-value">{{ selectedReport.data.totalCalories }} 千卡</div>
                </div>
              </el-col>
            </el-row>
          </el-card>
          
          <el-card shadow="hover" class="report-chart-card">
            <h4>运动趋势</h4>
            <div class="chart-container">
              <!-- 这里可以使用 ECharts 或其他图表库实现 -->
              <div class="chart-placeholder">运动趋势图表</div>
            </div>
          </el-card>
          
          <el-card shadow="hover" class="report-recommendation-card">
            <h4>运动建议</h4>
            <ul class="recommendation-list">
              <li v-for="(item, index) in selectedReport.recommendations" :key="index">{{ item }}</li>
            </ul>
          </el-card>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="reportDialogVisible = false">关闭</el-button>
          <el-button type="success" @click="downloadReport(selectedReport)">
            <el-icon><Download /></el-icon> 下载报告
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { DocumentAdd, View, Download, Search, ArrowLeft } from '@element-plus/icons-vue'

export default {
  name: 'TeacherExerciseReports',
  components: {
    DocumentAdd, View, Download, Search, ArrowLeft
  },
  setup() {
    const userInfo = reactive({
      className: '2023级体育教育1班'
    })
    
    // 报告生成表单
    const reportForm = reactive({
      reportType: 'class-weekly',
      studentId: '',
      timeRange: []
    })
    
    // 表单验证规则
    const reportRules = reactive({
      reportType: [{ required: true, message: '请选择报告类型', trigger: 'change' }],
      studentId: [{ required: ['personal-weekly', 'personal-monthly'].includes(reportForm.reportType), message: '请选择学生', trigger: 'change' }],
      timeRange: [{ required: true, message: '请选择时间范围', trigger: 'change' }]
    })
    
    const reportFormRef = ref(null)
    
    // 学生列表
    const students = ref([
      { studentId: '2023423320102', name: '张三' },
      { studentId: '2023423320103', name: '李四' },
      { studentId: '2023423320104', name: '王五' },
      { studentId: '2023423320105', name: '赵六' },
      { studentId: '2023423320106', name: '孙七' }
    ])
    
    // 报告列表
    const reports = ref([
      {
        reportId: 'R20231120001',
        reportType: 'class-weekly',
        studentName: '',
        dateRange: '2023-11-13 至 2023-11-19',
        generateTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString(),
        status: 'generated',
        summary: '本周班级整体运动情况良好，平均步数达到9235步，较上周增长8.5%。32名学生达到运动目标，达标率71.1%。',
        data: {
          totalSteps: 415575,
          totalExerciseTime: 5625,
          totalCalories: 82500
        },
        recommendations: [
          '增加班级集体运动活动，提高学生运动积极性',
          '关注未达标的学生，制定个性化运动计划',
          '鼓励学生每天坚持至少30分钟中等强度运动'
        ]
      },
      {
        reportId: 'R20231120002',
        reportType: 'personal-weekly',
        studentName: '张三',
        dateRange: '2023-11-13 至 2023-11-19',
        generateTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toLocaleString(),
        status: 'generated',
        summary: '张三同学本周运动表现优秀，总步数达到14528步，超过班级平均值57.3%，各项运动指标均达标。',
        data: {
          totalSteps: 14528,
          totalExerciseTime: 185,
          totalCalories: 2850
        },
        recommendations: [
          '继续保持当前的运动强度和频率',
          '可以尝试增加一些力量训练，提高身体素质',
          '注意运动前后的热身和拉伸，避免运动损伤'
        ]
      }
    ])
    
    // 搜索报告
    const searchReport = ref('')
    
    // 筛选后的报告列表
    const filteredReports = computed(() => {
      if (!searchReport.value) return reports.value
      return reports.value.filter(report => 
        report.reportId.includes(searchReport.value) ||
        getReportTypeText(report.reportType).includes(searchReport.value) ||
        (report.studentName && report.studentName.includes(searchReport.value))
      )
    })
    
    // 分页
    const currentPage = ref(1)
    const pageSize = ref(10)
    
    // 报告详情对话框
    const reportDialogVisible = ref(false)
    const selectedReport = ref(null)
    
    // 生成报告
    const generateReport = async () => {
      if (!reportFormRef.value) return
      
      await reportFormRef.value.validate(async (valid) => {
        if (valid) {
          try {
            // 调用后端API生成报告
            ElMessage.success('报告生成成功')
            
            // 模拟添加新报告
            const newReport = {
              reportId: 'R' + Date.now(),
              reportType: reportForm.reportType,
              studentName: reportForm.studentId ? students.value.find(s => s.studentId === reportForm.studentId)?.name : '',
              dateRange: `${reportForm.timeRange[0]} 至 ${reportForm.timeRange[1]}`,
              generateTime: new Date().toLocaleString(),
              status: 'generated',
              summary: '这是一份新生成的运动报告摘要。',
              data: {
                totalSteps: Math.floor(Math.random() * 100000) + 50000,
                totalExerciseTime: Math.floor(Math.random() * 2000) + 1000,
                totalCalories: Math.floor(Math.random() * 30000) + 10000
              },
              recommendations: [
                '根据个人情况调整运动计划',
                '保持规律的运动习惯',
                '注意饮食和休息，保持良好的身体状态'
              ]
            }
            
            reports.value.unshift(newReport)
            
            // 重置表单
            reportForm.reportType = 'class-weekly'
            reportForm.studentId = ''
            reportForm.timeRange = []
          } catch (error) {
            ElMessage.error('报告生成失败：' + error.message)
          }
        }
      })
    }
    
    // 查看报告
    const viewReport = (report) => {
      selectedReport.value = report
      reportDialogVisible.value = true
    }
    
    // 下载报告
    const downloadReport = (report) => {
      // 实现报告下载功能
      ElMessage.success('报告下载成功')
    }
    
    // 获取报告类型文本
    const getReportTypeText = (type) => {
      const typeMap = {
        'personal-weekly': '个人周报告',
        'personal-monthly': '个人月报告',
        'class-weekly': '班级周报告',
        'class-monthly': '班级月报告'
      }
      return typeMap[type] || type
    }
    
    // 分页处理
    const handleSizeChange = (size) => {
      pageSize.value = size
      currentPage.value = 1
    }
    
    const handleCurrentChange = (current) => {
      currentPage.value = current
    }
    
    // 初始化
    onMounted(() => {
      // 调用API获取学生列表和报告列表
      console.log('运动报告页面已加载')
    })
    
    return {
      userInfo,
      reportForm,
      reportRules,
      reportFormRef,
      students,
      reports,
      searchReport,
      filteredReports,
      currentPage,
      pageSize,
      reportDialogVisible,
      selectedReport,
      generateReport,
      viewReport,
      downloadReport,
      getReportTypeText,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.teacher-exercise-reports {
  padding: 24px;
  min-height: calc(100vh - 100px);
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
}

.page-header {
  margin-bottom: 20px;
}

.back-btn {
  margin-bottom: 10px;
  color: #1890ff;
}

.back-btn:hover {
  color: #40a9ff;
  background-color: rgba(24, 144, 255, 0.1);
}

.report-tool-card {
  margin-bottom: 20px;
}

.tool-content h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
}

.report-list-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.report-table {
  margin-top: 16px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.report-detail {
  padding: 16px 0;
}

.report-header {
  text-align: center;
  margin-bottom: 24px;
}

.report-header h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}

.report-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.report-summary-card, .report-data-card, .report-chart-card, .report-recommendation-card {
  margin-bottom: 0;
}

.summary-content {
  line-height: 1.6;
  color: #666;
}

.data-item {
  text-align: center;
  padding: 16px 0;
}

.data-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.data-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.chart-container {
  height: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  border-radius: 4px;
}

.chart-placeholder {
  color: #999;
  font-size: 16px;
}

.recommendation-list {
  list-style-type: disc;
  padding-left: 20px;
  line-height: 1.8;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>