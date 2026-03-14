<template>
  <div class="teacher-training-report">
    <el-card shadow="hover" class="page-header">
      <div class="card-header">
        <el-button type="text" @click="$router.back()" class="back-btn">
          <i class="el-icon-arrow-left"></i> 返回
        </el-button>
        <h2>训练报告</h2>
        <p>班级：{{ userInfo.className }}</p>
      </div>
    </el-card>
    
    <!-- 报告筛选条件 -->
    <el-card shadow="hover" class="filter-card">
      <div class="filter-content">
        <div class="filter-section">
          <span class="filter-label">报告类型：</span>
          <el-radio-group v-model="reportType" style="margin-right: 20px;">
            <el-radio label="class">班级报告</el-radio>
            <el-radio label="student">个人报告</el-radio>
          </el-radio-group>
          
          <span class="filter-label" v-if="reportType === 'student'">学生：</span>
          <el-select
            v-if="reportType === 'student'"
            v-model="selectedStudent"
            placeholder="请选择学生"
            filterable
            style="width: 150px; margin-right: 20px;"
          >
            <el-option
              v-for="student in studentOptions"
              :key="student.studentId"
              :label="student.name"
              :value="student.studentId"
            ></el-option>
          </el-select>
        </div>
        
        <div class="filter-section">
          <span class="filter-label">时间范围：</span>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
            style="width: 300px; margin-right: 20px;"
          ></el-date-picker>
        </div>
        
        <div class="filter-section">
          <el-button type="primary" @click="generateReport">
            <i class="el-icon-document-copy"></i> 生成报告
          </el-button>
          <el-button type="success" @click="exportReport" :disabled="!reportGenerated">
            <i class="el-icon-download"></i> 导出报告
          </el-button>
          <el-button @click="printReport" :disabled="!reportGenerated">
            <i class="el-icon-printer"></i> 打印报告
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- 报告生成状态 -->
    <div v-if="generatingReport" class="generating-status">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <span>正在生成报告...</span>
    </div>
    
    <!-- 班级报告内容 -->
    <div v-if="reportGenerated && reportType === 'class'" class="report-content">
      <el-card shadow="hover" class="report-header">
        <div class="report-title">高一1班运动训练报告</div>
        <div class="report-subtitle">报告期间：{{ dateRange[0] }} 至 {{ dateRange[1] }}</div>
        <div class="report-date">生成日期：{{ new Date().toLocaleDateString() }}</div>
      </el-card>
      
      <!-- 班级总体情况 -->
      <el-card shadow="hover" class="report-section">
        <div class="section-header">
          <i class="el-icon-data-line"></i> 班级总体情况
        </div>
        <div class="summary-stats">
          <div class="stat-item">
            <div class="stat-label">班级人数</div>
            <div class="stat-value">{{ classSummary.totalStudents }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">平均心率</div>
            <div class="stat-value">{{ classSummary.avgHeartRate }} bpm</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">平均血氧</div>
            <div class="stat-value">{{ classSummary.avgBloodOxygen }}%</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">平均步数</div>
            <div class="stat-value">{{ classSummary.avgSteps }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">平均疲劳度</div>
            <div class="stat-value">{{ classSummary.avgFatigue }}分</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">平均运动负荷</div>
            <div class="stat-value">{{ classSummary.avgWorkload }}分</div>
          </div>
        </div>
      </el-card>
      
      <!-- 运动负荷分布 -->
      <el-card shadow="hover" class="report-section">
        <div class="section-header">
          <i class="el-icon-pie-chart"></i> 运动负荷分布
        </div>
        <div class="chart-container">
          <el-row :gutter="20">
            <el-col :xs="24" :md="12">
              <div id="workload-distribution-chart" style="height: 300px;"></div>
            </el-col>
            <el-col :xs="24" :md="12">
              <div class="chart-stats">
                <div class="stat-box high" v-if="workloadDistribution.high > 0">
                  <div class="stat-number">{{ workloadDistribution.high }}</div>
                  <div class="stat-desc">高负荷学生</div>
                </div>
                <div class="stat-box medium" v-if="workloadDistribution.medium > 0">
                  <div class="stat-number">{{ workloadDistribution.medium }}</div>
                  <div class="stat-desc">中负荷学生</div>
                </div>
                <div class="stat-box low" v-if="workloadDistribution.low > 0">
                  <div class="stat-number">{{ workloadDistribution.low }}</div>
                  <div class="stat-desc">低负荷学生</div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>
      
      <!-- 健康指标统计 -->
      <el-card shadow="hover" class="report-section">
        <div class="section-header">
          <i class="el-icon-data-analysis"></i> 健康指标统计
        </div>
        <div class="chart-container">
          <div id="health-metrics-chart" style="height: 300px;"></div>
        </div>
      </el-card>
      
      <!-- 学生达标情况 -->
      <el-card shadow="hover" class="report-section">
        <div class="section-header">
          <i class="el-icon-check"></i> 学生达标情况
        </div>
        <el-table
          :data="achievementList"
          border
          style="width: 100%"
          height="300"
        >
          <el-table-column prop="studentName" label="姓名" width="100" align="center"></el-table-column>
          <el-table-column prop="heartRateStatus" label="心率达标" width="100" align="center">
            <template v-slot="scope">
              <el-tag :type="scope.row.heartRateStatus === '达标' ? 'success' : 'danger'">
                {{ scope.row.heartRateStatus }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="bloodOxygenStatus" label="血氧达标" width="100" align="center">
            <template v-slot="scope">
              <el-tag :type="scope.row.bloodOxygenStatus === '达标' ? 'success' : 'danger'">
                {{ scope.row.bloodOxygenStatus }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="stepsStatus" label="步数达标" width="100" align="center">
            <template v-slot="scope">
              <el-tag :type="scope.row.stepsStatus === '达标' ? 'success' : 'danger'">
                {{ scope.row.stepsStatus }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="fatigueStatus" label="疲劳度适中" width="120" align="center">
            <template v-slot="scope">
              <el-tag :type="scope.row.fatigueStatus === '适中' ? 'success' : 'warning'">
                {{ scope.row.fatigueStatus }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="overallStatus" label="综合评价" width="120" align="center">
            <template v-slot="scope">
              <el-tag :type="getStatusType(scope.row.overallStatus)">
                {{ scope.row.overallStatus }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      
      <!-- 班级建议 -->
      <el-card shadow="hover" class="report-section">
        <div class="section-header">
          <i class="el-icon-edit-outline"></i> 班级运动建议
        </div>
        <div class="suggestion-content">
          <ol>
            <li>针对高负荷学生（{{ workloadDistribution.high }}人），建议适当减少训练强度，增加恢复性训练</li>
            <li>鼓励低负荷学生（{{ workloadDistribution.low }}人）增加运动时长，提升运动效果</li>
            <li>整体平均心率{{ classSummary.avgHeartRate }}bpm，在正常训练范围内，可保持现有训练强度</li>
            <li>建议增加有氧训练比例，提升学生的心肺功能</li>
            <li>关注个别学生的疲劳度情况，及时调整训练计划</li>
          </ol>
        </div>
      </el-card>
    </div>
    
    <!-- 个人报告内容 -->
    <div v-if="reportGenerated && reportType === 'student'" class="report-content">
      <el-card shadow="hover" class="report-header">
        <div class="report-title">学生运动训练报告</div>
        <div class="report-subtitle">学生：{{ currentStudentName }} | 学号：{{ selectedStudent }}</div>
        <div class="report-subtitle">报告期间：{{ dateRange[0] }} 至 {{ dateRange[1] }}</div>
        <div class="report-date">生成日期：{{ new Date().toLocaleDateString() }}</div>
      </el-card>
      
      <!-- 个人基本信息 -->
      <el-card shadow="hover" class="report-section">
        <div class="section-header">
          <i class="el-icon-user"></i> 基本信息
        </div>
        <div class="student-info">
          <div class="info-item">
            <span class="info-label">姓名：</span>
            <span class="info-value">{{ currentStudentName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">学号：</span>
            <span class="info-value">{{ selectedStudent }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">班级：</span>
            <span class="info-value">{{ userInfo.className }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">年龄：</span>
            <span class="info-value">16岁</span>
          </div>
          <div class="info-item">
            <span class="info-label">性别：</span>
            <span class="info-value">男</span>
          </div>
        </div>
      </el-card>
      
      <!-- 健康数据趋势 -->
      <el-card shadow="hover" class="report-section">
        <div class="section-header">
          <i class="el-icon-trend-charts"></i> 健康数据趋势
        </div>
        <div class="chart-container">
          <div id="student-health-trend" style="height: 300px;"></div>
        </div>
      </el-card>
      
      <!-- 运动指标分析 -->
      <el-card shadow="hover" class="report-section">
        <div class="section-header">
          <i class="el-icon-chart"></i> 运动指标分析
        </div>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-title">平均心率</div>
            <div class="metric-value">{{ studentMetrics.avgHeartRate }} bpm</div>
            <div class="metric-status">
              <el-tag :type="studentMetrics.heartRateStatus === '正常' ? 'success' : 'danger'">
                {{ studentMetrics.heartRateStatus }}
              </el-tag>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-title">平均血氧</div>
            <div class="metric-value">{{ studentMetrics.avgBloodOxygen }}%</div>
            <div class="metric-status">
              <el-tag :type="studentMetrics.bloodOxygenStatus === '正常' ? 'success' : 'danger'">
                {{ studentMetrics.bloodOxygenStatus }}
              </el-tag>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-title">平均步数</div>
            <div class="metric-value">{{ studentMetrics.avgSteps }}</div>
            <div class="metric-status">
              <el-tag :type="studentMetrics.stepsStatus === '达标' ? 'success' : 'warning'">
                {{ studentMetrics.stepsStatus }}
              </el-tag>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-title">平均疲劳度</div>
            <div class="metric-value">{{ studentMetrics.avgFatigue }}分</div>
            <div class="metric-status">
              <el-tag :type="studentMetrics.fatigueStatus === '适中' ? 'success' : 'warning'">
                {{ studentMetrics.fatigueStatus }}
              </el-tag>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-title">运动负荷</div>
            <div class="metric-value">{{ studentMetrics.workload }}分</div>
            <div class="metric-status">
              <el-tag :type="studentMetrics.workloadStatus === '适中' ? 'success' : 'warning'">
                {{ studentMetrics.workloadStatus }}
              </el-tag>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-title">恢复程度</div>
            <div class="metric-value">{{ studentMetrics.recovery }}%</div>
            <div class="metric-status">
              <el-tag :type="studentMetrics.recoveryStatus === '良好' ? 'success' : 'warning'">
                {{ studentMetrics.recoveryStatus }}
              </el-tag>
            </div>
          </div>
        </div>
      </el-card>
      
      <!-- 个人运动建议 -->
      <el-card shadow="hover" class="report-section">
        <div class="section-header">
          <i class="el-icon-edit-outline"></i> 个性化运动建议
        </div>
        <div class="suggestion-content">
          <h4>运动表现分析</h4>
          <p>在报告期间，您的平均心率为{{ studentMetrics.avgHeartRate }}bpm，平均血氧为{{ studentMetrics.avgBloodOxygen }}%，平均步数为{{ studentMetrics.avgSteps }}步。整体运动表现{{ studentMetrics.overallAssessment }}。</p>
          
          <h4>改进建议</h4>
          <ol>
            <li>建议增加每周运动次数，保持规律的运动习惯</li>
            <li>每次运动前做好热身准备，运动后进行拉伸放松</li>
            <li>根据疲劳度情况，合理安排训练强度和恢复时间</li>
            <li>保持充足的睡眠，有助于身体恢复和运动表现提升</li>
            <li>注意饮食均衡，补充足够的营养物质</li>
          </ol>
          
          <h4>下一阶段目标</h4>
          <p>建议将目标心率控制在{{ studentMetrics.targetHeartRateRange }}bpm，每日步数目标提升至{{ studentMetrics.targetSteps }}步，逐步提高运动负荷至{{ studentMetrics.targetWorkload }}分。</p>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts';
import { Loading } from '@element-plus/icons-vue';

export default {
  name: 'TeacherTrainingReport',
  components: {
    Loading
  },
  data() {
    return {
      userInfo: {
        name: '李老师',
        className: '高一1班',
        teacherId: 'Teacher101'
      },
      reportType: 'class',
      selectedStudent: '',
      dateRange: ['2023-10-16', '2023-11-15'],
      reportGenerated: false,
      generatingReport: false,
      studentOptions: [
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
      ],
      // 班级统计数据
      classSummary: {
        totalStudents: 45,
        avgHeartRate: 75,
        avgBloodOxygen: 97,
        avgSteps: 7500,
        avgFatigue: 45,
        avgWorkload: 65
      },
      workloadDistribution: {
        high: 8,
        medium: 25,
        low: 12
      },
      achievementList: [
        { studentName: '曹睿焜', heartRateStatus: '达标', bloodOxygenStatus: '达标', stepsStatus: '达标', fatigueStatus: '适中', overallStatus: '优秀' },
        { studentName: '张小明', heartRateStatus: '达标', bloodOxygenStatus: '达标', stepsStatus: '达标', fatigueStatus: '适中', overallStatus: '优秀' },
        { studentName: '王小红', heartRateStatus: '达标', bloodOxygenStatus: '达标', stepsStatus: '达标', fatigueStatus: '适中', overallStatus: '优秀' },
        { studentName: '赵小刚', heartRateStatus: '达标', bloodOxygenStatus: '达标', stepsStatus: '达标', fatigueStatus: '适中', overallStatus: '优秀' },
        { studentName: '李小丽', heartRateStatus: '达标', bloodOxygenStatus: '达标', stepsStatus: '达标', fatigueStatus: '适中', overallStatus: '优秀' },
        { studentName: '陈小强', heartRateStatus: '达标', bloodOxygenStatus: '达标', stepsStatus: '未达标', fatigueStatus: '适中', overallStatus: '良好' },
        { studentName: '林小花', heartRateStatus: '达标', bloodOxygenStatus: '达标', stepsStatus: '达标', fatigueStatus: '适中', overallStatus: '优秀' },
        { studentName: '吴小明', heartRateStatus: '达标', bloodOxygenStatus: '达标', stepsStatus: '未达标', fatigueStatus: '适中', overallStatus: '良好' },
        { studentName: '郑小红', heartRateStatus: '达标', bloodOxygenStatus: '达标', stepsStatus: '达标', fatigueStatus: '适中', overallStatus: '优秀' },
        { studentName: '周小强', heartRateStatus: '达标', bloodOxygenStatus: '达标', stepsStatus: '达标', fatigueStatus: '适中', overallStatus: '优秀' }
      ],
      // 学生个人指标
      studentMetrics: {
        avgHeartRate: 72,
        heartRateStatus: '正常',
        avgBloodOxygen: 98,
        bloodOxygenStatus: '正常',
        avgSteps: 8500,
        stepsStatus: '达标',
        avgFatigue: 40,
        fatigueStatus: '适中',
        workload: 70,
        workloadStatus: '适中',
        recovery: 85,
        recoveryStatus: '良好',
        overallAssessment: '优秀',
        targetHeartRateRange: '120-140',
        targetSteps: 10000,
        targetWorkload: 75
      },
      // 图表实例
      workloadChart: null,
      healthMetricsChart: null,
      studentHealthChart: null
    };
  },
  computed: {
    currentStudentName() {
      const student = this.studentOptions.find(s => s.studentId === this.selectedStudent);
      return student ? student.name : '';
    }
  },
  mounted() {
    // 初始化默认日期范围（最近30天）
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    this.dateRange = [
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    ];
  },
  beforeDestroy() {
    // 销毁图表实例
    this.destroyCharts();
  },
  methods: {
    // 生成报告
    generateReport() {
      if (!this.dateRange || this.dateRange.length < 2) {
        this.$message.warning('请选择报告期间');
        return;
      }
      
      if (this.reportType === 'student' && !this.selectedStudent) {
        this.$message.warning('请选择学生');
        return;
      }
      
      // 模拟生成报告的过程
      this.generatingReport = true;
      this.reportGenerated = false;
      
      // 销毁现有图表
      this.destroyCharts();
      
      setTimeout(() => {
        this.generatingReport = false;
        this.reportGenerated = true;
        this.$message.success('报告生成成功');
        
        // 渲染图表
        this.$nextTick(() => {
          if (this.reportType === 'class') {
            this.renderClassCharts();
          } else {
            this.renderStudentCharts();
          }
        });
      }, 2000);
    },
    
    // 导出报告
    exportReport() {
      this.$message.info('报告导出功能开发中');
    },
    
    // 打印报告
    printReport() {
      window.print();
    },
    
    // 获取状态类型
    getStatusType(status) {
      switch(status) {
        case '优秀': return 'success';
        case '良好': return 'primary';
        case '合格': return 'info';
        case '不合格': return 'danger';
        default: return 'warning';
      }
    },
    
    // 渲染班级图表
    renderClassCharts() {
      this.renderWorkloadChart();
      this.renderHealthMetricsChart();
    },
    
    // 渲染个人图表
    renderStudentCharts() {
      this.renderStudentHealthChart();
    },
    
    // 渲染运动负荷分布图表
    renderWorkloadChart() {
      const chartDom = document.getElementById('workload-distribution-chart');
      if (!chartDom) return;
      
      this.workloadChart = echarts.init(chartDom);
      
      const option = {
        title: {
          text: '运动负荷分布',
          left: 'center',
          top: 0
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          top: 'middle'
        },
        series: [
          {
            name: '运动负荷',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['60%', '50%'],
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
                fontSize: '16',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: [
              { value: this.workloadDistribution.high, name: '高负荷', itemStyle: { color: '#F56C6C' } },
              { value: this.workloadDistribution.medium, name: '中负荷', itemStyle: { color: '#E6A23C' } },
              { value: this.workloadDistribution.low, name: '低负荷', itemStyle: { color: '#67C23A' } }
            ]
          }
        ]
      };
      
      this.workloadChart.setOption(option);
    },
    
    // 渲染健康指标统计图表
    renderHealthMetricsChart() {
      const chartDom = document.getElementById('health-metrics-chart');
      if (!chartDom) return;
      
      this.healthMetricsChart = echarts.init(chartDom);
      
      const option = {
        title: {
          text: '班级健康指标统计',
          left: 'center',
          top: 0
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: ['平均值', '达标率'],
          top: 30
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['心率', '血氧', '步数', '疲劳度', '运动负荷']
        },
        yAxis: [
          {
            type: 'value',
            name: '数值',
            axisLabel: {
              formatter: '{value}'
            }
          },
          {
            type: 'value',
            name: '达标率(%)',
            axisLabel: {
              formatter: '{value}%'
            }
          }
        ],
        series: [
          {
            name: '平均值',
            type: 'bar',
            data: [
              this.classSummary.avgHeartRate,
              this.classSummary.avgBloodOxygen,
              this.classSummary.avgSteps,
              this.classSummary.avgFatigue,
              this.classSummary.avgWorkload
            ],
            itemStyle: {
              color: '#606CFF'
            }
          },
          {
            name: '达标率',
            type: 'line',
            yAxisIndex: 1,
            data: [92, 98, 75, 85, 70],
            itemStyle: {
              color: '#67C23A'
            },
            smooth: true
          }
        ]
      };
      
      this.healthMetricsChart.setOption(option);
    },
    
    // 渲染学生健康趋势图表
    renderStudentHealthChart() {
      const chartDom = document.getElementById('student-health-trend');
      if (!chartDom) return;
      
      this.studentHealthChart = echarts.init(chartDom);
      
      // 生成模拟日期数据
      const dates = [];
      const heartRates = [];
      const bloodOxygens = [];
      const steps = [];
      
      const startDate = new Date(this.dateRange[0]);
      const endDate = new Date(this.dateRange[1]);
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        heartRates.push(Math.floor(Math.random() * 20) + 70); // 70-90
        bloodOxygens.push(Math.floor(Math.random() * 3) + 96); // 96-98
        steps.push(Math.floor(Math.random() * 3000) + 6000); // 6000-9000
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      const option = {
        title: {
          text: '健康数据趋势',
          left: 'center',
          top: 0
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['心率', '血氧', '步数'],
          top: 30
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: dates,
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: [
          {
            type: 'value',
            name: '心率/血氧',
            min: 60,
            max: 110
          },
          {
            type: 'value',
            name: '步数',
            min: 0
          }
        ],
        series: [
          {
            name: '心率',
            type: 'line',
            yAxisIndex: 0,
            data: heartRates,
            itemStyle: {
              color: '#F56C6C'
            },
            smooth: true
          },
          {
            name: '血氧',
            type: 'line',
            yAxisIndex: 0,
            data: bloodOxygens,
            itemStyle: {
              color: '#67C23A'
            },
            smooth: true
          },
          {
            name: '步数',
            type: 'line',
            yAxisIndex: 1,
            data: steps,
            itemStyle: {
              color: '#606CFF'
            },
            smooth: true
          }
        ]
      };
      
      this.studentHealthChart.setOption(option);
    },
    
    // 销毁图表实例
    destroyCharts() {
      if (this.workloadChart) {
        this.workloadChart.dispose();
        this.workloadChart = null;
      }
      if (this.healthMetricsChart) {
        this.healthMetricsChart.dispose();
        this.healthMetricsChart = null;
      }
      if (this.studentHealthChart) {
        this.studentHealthChart.dispose();
        this.studentHealthChart = null;
      }
    }
  }
};
</script>

<style scoped>
.teacher-training-report {
  padding: 24px;
  min-height: calc(100vh - 100px);
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
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

.back-btn {
  margin-bottom: 10px;
  color: #1890ff;
}

.back-btn:hover {
  color: #40a9ff;
  background-color: rgba(24, 144, 255, 0.1);
}

.filter-card {
  margin-bottom: 20px;
}

.filter-content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
}

.filter-section {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-label {
  font-weight: 500;
  color: #606266;
}

.generating-status {
  text-align: center;
  padding: 40px 0;
  color: #606CFF;
  font-size: 16px;
}

.loading-icon {
  margin-right: 10px;
  font-size: 20px;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.report-content {
  margin-top: 20px;
}

.report-header {
  text-align: center;
  margin-bottom: 30px;
}

.report-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.report-subtitle {
  font-size: 16px;
  color: #606266;
  margin-bottom: 5px;
}

.report-date {
  font-size: 14px;
  color: #909399;
}

.report-section {
  margin-bottom: 30px;
}

.section-header {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #EBEEF5;
}

.section-header i {
  margin-right: 10px;
  color: #606CFF;
}

.summary-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.stat-item {
  background-color: #F5F7FA;
  padding: 20px;
  border-radius: 8px;
  min-width: 120px;
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  width: 100%;
  height: 300px;
}

.chart-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 30px;
}

.stat-box {
  padding: 30px;
  border-radius: 8px;
  text-align: center;
  width: 150px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.stat-box.high {
  background-color: rgba(245, 108, 108, 0.1);
  color: #F56C6C;
}

.stat-box.medium {
  background-color: rgba(230, 162, 60, 0.1);
  color: #E6A23C;
}

.stat-box.low {
  background-color: rgba(103, 194, 58, 0.1);
  color: #67C23A;
}

.stat-number {
  font-size: 36px;
  font-weight: 600;
  margin-bottom: 10px;
}

.stat-desc {
  font-size: 16px;
}

.student-info {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-label {
  font-weight: 500;
  color: #606266;
  margin-right: 10px;
  min-width: 60px;
}

.info-value {
  color: #303133;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.metric-card {
  background-color: #F5F7FA;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.metric-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.metric-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.metric-status {
  margin-top: 10px;
}

.suggestion-content {
  line-height: 1.6;
  color: #303133;
}

.suggestion-content h4 {
  margin-top: 20px;
  margin-bottom: 10px;
  color: #303133;
}

.suggestion-content p {
  margin-bottom: 15px;
}

.suggestion-content ol {
  margin-left: 20px;
}

.suggestion-content li {
  margin-bottom: 10px;
}
</style>