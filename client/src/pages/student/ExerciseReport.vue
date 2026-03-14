<template>
  <div class="exercise-report-page">
    <el-card shadow="hover" class="page-header">
      <h2>运动报告</h2>
      <p>查看历史运动数据与趋势分析</p>
    </el-card>
    
    <!-- 数据筛选 -->
    <el-card shadow="hover" class="filter-card">
      <div class="filter-content">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="yyyy-MM-dd"
              value-format="yyyy-MM-dd"
              @change="handleDateChange"
            ></el-date-picker>
          </el-form-item>
          
          <el-form-item label="报告类型">
            <el-select v-model="filterForm.reportType" placeholder="选择报告类型" @change="handleReportTypeChange">
              <el-option label="个人报告" value="personal"></el-option>
              <el-option label="班级对比" value="class"></el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item label="数据维度">
            <el-select v-model="filterForm.dataDimension" placeholder="选择数据维度" multiple>
              <el-option label="健康数据" value="health"></el-option>
              <el-option label="运动负荷" value="load"></el-option>
              <el-option label="恢复程度" value="recovery"></el-option>
              <el-option label="疲劳度" value="fatigue"></el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="queryData">
              <i class="el-icon-search"></i> 查询
            </el-button>
            <el-button @click="resetFilter">
              <i class="el-icon-refresh-right"></i> 重置
            </el-button>
            <el-button type="success" @click="exportReport">
              <i class="el-icon-download"></i> 导出报告
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
    
    <!-- 报告概览 -->
    <el-card shadow="hover" class="overview-card">
      <div class="card-header">
        <h3>报告概览</h3>
      </div>
      <div class="overview-stats">
        <div class="overview-item">
          <div class="overview-value">{{ totalDays }}<span class="unit">天</span></div>
          <div class="overview-label">监测天数</div>
        </div>
        <div class="overview-item">
          <div class="overview-value">{{ averageSteps }}<span class="unit">步/天</span></div>
          <div class="overview-label">日均步数</div>
        </div>
        <div class="overview-item">
          <div class="overview-value">{{ averageHeartRate }}<span class="unit">次/分钟</span></div>
          <div class="overview-label">平均心率</div>
        </div>
        <div class="overview-item">
          <div class="overview-value">{{达标天数}}<span class="unit">天</span></div>
          <div class="overview-label">运动达标</div>
        </div>
        <div class="overview-item">
          <div class="overview-value">{{ healthScore }}<span class="unit">分</span></div>
          <div class="overview-label">健康得分</div>
        </div>
        <div class="overview-item">
          <div class="overview-value">
            <el-tag :type="healthGradeType" size="large">{{ healthGrade }}</el-tag>
          </div>
          <div class="overview-label">健康等级</div>
        </div>
        <div class="overview-item">
          <div class="overview-value">{{ exerciseLoad }}<span class="unit">%</span></div>
          <div class="overview-label">平均运动负荷</div>
        </div>
        <div class="overview-item">
          <div class="overview-value">{{ recoveryLevel }}<span class="unit">%</span></div>
          <div class="overview-label">恢复程度</div>
        </div>
      </div>
    </el-card>
    
    <!-- 个人报告详情 -->
    <el-card shadow="hover" v-if="filterForm.reportType === 'personal'" class="report-card">
      <div class="card-header">
        <h3>个人运动分析报告</h3>
        <el-tabs v-model="activeTab" class="report-tabs" @tab-click="handleTabClick">
          <el-tab-pane label="健康数据趋势" name="health-trend"></el-tab-pane>
          <el-tab-pane label="运动负荷分析" name="load-analysis"></el-tab-pane>
          <el-tab-pane label="恢复状况" name="recovery-status"></el-tab-pane>
          <el-tab-pane label="综合评估" name="comprehensive"></el-tab-pane>
          <el-tab-pane label="健康风险评估" name="health-risks"></el-tab-pane>
          <el-tab-pane label="每日统计详情" name="daily-stats"></el-tab-pane>
        </el-tabs>
      </div>
      
      <div v-if="activeTab === 'health-trend'" class="tab-content">
        <div class="chart-container">
          <h4>心率与血氧趋势</h4>
          <div id="healthTrendChart" style="height: 300px; width: 100%;"></div>
        </div>
      </div>
      
      <div v-if="activeTab === 'load-analysis'" class="tab-content">
        <div class="chart-container">
          <h4>每日运动负荷</h4>
          <div id="loadTrendChart" style="height: 300px; width: 100%;"></div>
        </div>
      </div>
      
      <div v-if="activeTab === 'recovery-status'" class="tab-content">
        <div class="chart-container">
          <h4>恢复程度趋势</h4>
          <div id="recoveryChart" style="height: 300px; width: 100%;"></div>
        </div>
      </div>
      
      <div v-show="activeTab === 'comprehensive'" class="tab-content">
        <div class="comprehensive-content">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="整体状态评估">
              <el-rate :value="4" disabled show-score text-color="#ff9900" score-template="{value}分"></el-rate>
            </el-descriptions-item>
            <el-descriptions-item label="运动规律">
              <el-tag type="success">良好</el-tag>
              <span style="margin-left: 10px;">平均每周运动5天</span>
            </el-descriptions-item>
            <el-descriptions-item label="主要问题">
              <el-tag type="warning">偶尔过度训练</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="改进建议">
              <el-tag type="info">增加休息日</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="最佳运动时间" :span="2">
              <span>周一至周五 16:00-18:00</span>
            </el-descriptions-item>
          </el-descriptions>
          
          <div class="recommendation-section">
            <h4>个性化改进建议</h4>
            <ul class="recommendation-list">
              <li>建议在高强度训练后增加1-2天的轻度活动或休息</li>
              <li>保持日均步数在6000-10000步之间，避免久坐</li>
              <li>注意监测心率变化，高强度运动时保持心率在最大心率的60%-80%之间</li>
              <li>保证充足的睡眠和水分摄入，促进身体恢复</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div v-show="activeTab === 'health-risks'" class="tab-content">
        <div class="health-risks-container">
          <h4>潜在健康风险</h4>
          <div class="risks-list">
            <el-empty v-if="healthRisks.length === 0" description="暂无健康风险" />
            <div v-else class="risk-item" v-for="(risk, index) in healthRisks" :key="index">
              <el-alert :title="risk.title" :type="risk.type" :description="risk.description" show-icon />
            </div>
          </div>
          
          <h4 style="margin-top: 20px;">最佳运动时间</h4>
          <div class="best-time">
            <el-empty v-if="!bestExerciseTime" description="暂无最佳运动时间建议" />
            <div v-else class="time-suggestion">
              <el-tag type="success" size="large">{{ bestExerciseTime }}</el-tag>
              <p>建议在这个时间段进行运动，效果最佳</p>
            </div>
          </div>
        </div>
      </div>
      
      <div v-show="activeTab === 'daily-stats'" class="tab-content">
        <div class="daily-stats-container">
          <el-table :data="dailyStats" stripe style="width: 100%">
            <el-table-column prop="date" label="日期" width="180" />
            <el-table-column prop="steps" label="步数" width="120" />
            <el-table-column prop="heartRate" label="心率" width="120" />
            <el-table-column prop="exerciseLoad" label="运动负荷" width="120" />
            <el-table-column prop="recoveryLevel" label="恢复程度" width="120" />
            <el-table-column prop="healthStatus" label="健康状态">
              <template v-slot="scope">
                <el-tag :type="scope.row.healthStatusType" size="small">{{ scope.row.healthStatus }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-card>
    
    <!-- 班级对比报告 -->
    <el-card shadow="hover" v-if="filterForm.reportType === 'class'" class="report-card">
      <div class="card-header">
        <h3>班级对比报告</h3>
      </div>
      <div class="class-comparison-content">
        <div class="chart-container">
          <h4>班级运动负荷对比</h4>
          <div id="classLoadChart" style="height: 300px;"></div>
        </div>
        
        <div class="chart-container">
          <h4>班级达标率对比</h4>
          <div id="classComplianceChart" style="height: 300px;"></div>
        </div>
        
        <div class="ranking-section">
          <h4>班级排名</h4>
          <el-table :data="classRanking" style="width: 100%" stripe>
            <el-table-column prop="rank" label="排名" width="80" align="center"></el-table-column>
            <el-table-column prop="className" label="班级" width="150"></el-table-column>
            <el-table-column prop="averageLoad" label="平均运动负荷" align="center">
              <template v-slot="scope">{{ scope.row.averageLoad }}分/日</template>
            </el-table-column>
            <el-table-column prop="complianceRate" label="达标率" align="center">
              <template v-slot="scope">
                <el-progress :percentage="scope.row.complianceRate" :show-text="true" :format="(percentage) => `${percentage}%`" size="small"></el-progress>
              </template>
            </el-table-column>
            <el-table-column prop="averageSteps" label="日均步数" align="center">
              <template v-slot="scope">{{ scope.row.averageSteps }}步</template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-card>
    
    <!-- 历史报告列表 -->
    <el-card shadow="hover" class="history-card">
      <div class="card-header">
        <h3>历史报告</h3>
      </div>
      <el-table :data="reportHistory" style="width: 100%" stripe>
        <el-table-column prop="reportDate" label="报告日期" width="180"></el-table-column>
        <el-table-column prop="reportType" label="报告类型" width="120">
          <template v-slot="scope">
            <el-tag :type="scope.row.reportType === 'daily' ? 'primary' : 'success'">{{ scope.row.reportType === 'daily' ? '日报' : '周报' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="报告标题"></el-table-column>
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template v-slot="scope">
            <el-tag :type="scope.row.status === 'completed' ? 'success' : 'warning'">{{ scope.row.status === 'completed' ? '已生成' : '生成中' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作" width="200" align="center">
          <template v-slot="scope">
            <el-button type="primary" size="small" @click="viewReport(scope.row.id)">
              <i class="el-icon-view"></i> 查看
            </el-button>
            <el-button type="success" size="small" @click="exportSingleReport(scope.row.id)">
              <i class="el-icon-download"></i> 导出
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="100"
          :page-size="10"
          @current-change="handlePageChange"
        ></el-pagination>
      </div>
    </el-card>
  </div>
</template>

<script>
import DataAnalysisService from '../../services/DataAnalysisService';

export default {
  name: 'ExerciseReport',
  data() {
      return {
        filterForm: {
          dateRange: [],
          reportType: 'personal',
          dataDimension: ['health', 'load', 'recovery', 'fatigue']
        },
        activeTab: 'health-trend',
        totalDays: 30,
        averageSteps: 7850,
        averageHeartRate: 75,
       达标天数: 24,
        healthScore: 85,
        healthGrade: '良好',
        healthGradeType: 'success',
        exerciseLoad: 75,
        recoveryLevel: 80,
        healthRisks: [],
        bestExerciseTime: '',
        dailyStats: [],
        reportHistory: [
          {
            id: 1,
            reportDate: '2023-11-15',
            reportType: 'daily',
            title: '11月15日运动报告',
            status: 'completed'
          },
          {
            id: 2,
            reportDate: '2023-11-14',
            reportType: 'daily',
            title: '11月14日运动报告',
            status: 'completed'
          },
          {
            id: 3,
            reportDate: '2023-11-08',
            reportType: 'weekly',
            title: '11月第2周运动报告',
            status: 'completed'
          }
        ],
        classRanking: [
          {
            rank: 1,
            className: '高一1班',
            averageLoad: 68,
            complianceRate: 85,
            averageSteps: 8230
          },
          {
            rank: 2,
            className: '高一2班',
            averageLoad: 62,
            complianceRate: 78,
            averageSteps: 7650
          },
          {
            rank: 3,
            className: '高一3班',
            averageLoad: 59,
            complianceRate: 75,
            averageSteps: 7320
          }
        ],
        healthTrendChart: null,
        loadTrendChart: null,
        recoveryChart: null,
        classLoadChart: null,
        classComplianceChart: null,
        
        // 模拟图表数据
        mockChartData: {
          dates: ['09-01', '09-02', '09-03', '09-04', '09-05', '09-06', '09-07'],
          heartRate: [75, 78, 73, 80, 76, 79, 74],
          bloodOxygen: [97, 96, 98, 97, 96, 97, 98],
          load: [65, 72, 58, 75, 68, 78, 62],
          recovery: [85, 78, 90, 82, 88, 75, 86]
        }
      };
    },
  mounted() {
    // 使用setTimeout确保DOM已经完全渲染，直接初始化所有图表，不管当前激活的是哪个标签页
    setTimeout(() => {
      this.initAllCharts();
    }, 200);
    
    // 设置默认日期范围为最近7天
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6);
    this.filterForm.dateRange = [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]];
    
    // 自动查询数据
    this.queryData();
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      if (this.healthTrendChart) this.healthTrendChart.resize();
      if (this.loadTrendChart) this.loadTrendChart.resize();
      if (this.recoveryChart) this.recoveryChart.resize();
      if (this.classLoadChart) this.classLoadChart.resize();
      if (this.classComplianceChart) this.classComplianceChart.resize();
    });
  },
  beforeDestroy() {
    // 销毁图表
    if (this.healthTrendChart) this.healthTrendChart.dispose();
    if (this.loadTrendChart) this.loadTrendChart.dispose();
    if (this.recoveryChart) this.recoveryChart.dispose();
    if (this.classLoadChart) this.classLoadChart.dispose();
    if (this.classComplianceChart) this.classComplianceChart.dispose();
  },
  methods: {
      // 根据健康等级返回标签类型
    getHealthGradeType(grade) {
        const gradeMap = {
          '优秀': 'success',
          '良好': 'success',
          '中等': 'warning',
          '较差': 'danger',
          '差': 'danger'
        }
        return gradeMap[grade] || 'info'
      },
    
    // 初始化所有图表
    initAllCharts() {
      console.log('初始化所有图表');
      const { mockChartData } = this;
      
      // 健康数据趋势图
      const healthTrendDom = document.getElementById('healthTrendChart');
      if (healthTrendDom) {
        if (this.healthTrendChart) {
          this.healthTrendChart.dispose();
        }
        this.healthTrendChart = this.$echarts.init(healthTrendDom);
        this.healthTrendChart.setOption({
          title: { show: false },
          tooltip: {
            trigger: 'axis',
            formatter: '{b}<br/>{a}: {c} {unit}'
          },
          legend: {
            data: ['心率', '血氧'],
            top: 0
          },
          xAxis: {
            type: 'category',
            data: mockChartData.dates
          },
          yAxis: [
            {
              type: 'value',
              name: '心率 (次/分钟)',
              min: 60,
              max: 100
            },
            {
              type: 'value',
              name: '血氧 (%)',
              min: 90,
              max: 100
            }
          ],
          series: [
            {
              name: '心率',
              type: 'line',
              data: mockChartData.heartRate,
              itemStyle: { color: '#409EFF' },
              smooth: true
            },
            {
              name: '血氧',
              type: 'line',
              yAxisIndex: 1,
              data: mockChartData.bloodOxygen,
              itemStyle: { color: '#67C23A' },
              smooth: true
            }
          ]
        });
        this.healthTrendChart.resize();
      }
      
      // 运动负荷趋势图
      const loadTrendDom = document.getElementById('loadTrendChart');
      if (loadTrendDom) {
        if (this.loadTrendChart) {
          this.loadTrendChart.dispose();
        }
        this.loadTrendChart = this.$echarts.init(loadTrendDom);
        this.loadTrendChart.setOption({
          title: { show: false },
          tooltip: {
            trigger: 'axis',
            formatter: '{b}: {c} 分/日'
          },
          xAxis: {
            type: 'category',
            data: mockChartData.dates
          },
          yAxis: {
            type: 'value',
            name: '运动负荷 (分/日)'
          },
          series: [{
            data: mockChartData.load,
            type: 'bar',
            itemStyle: {
              color: new this.$echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#67C23A' },
                { offset: 1, color: '#85CE61' }
              ])
            }
          }]
        });
        this.loadTrendChart.resize();
      }
      
      // 恢复状况趋势图
      const recoveryDom = document.getElementById('recoveryChart');
      if (recoveryDom) {
        if (this.recoveryChart) {
          this.recoveryChart.dispose();
        }
        this.recoveryChart = this.$echarts.init(recoveryDom);
        this.recoveryChart.setOption({
          title: { show: false },
          tooltip: {
            trigger: 'axis',
            formatter: '{b}: {c}%'
          },
          xAxis: {
            type: 'category',
            data: mockChartData.dates
          },
          yAxis: {
            type: 'value',
            name: '恢复程度 (%)'
          },
          series: [{
            data: mockChartData.recovery,
            type: 'line',
            smooth: true,
            itemStyle: { color: '#E6A23C' },
            areaStyle: {
              color: new this.$echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(230, 162, 60, 0.5)' },
                { offset: 1, color: 'rgba(230, 162, 60, 0.1)' }
              ])
            }
          }]
        });
        this.recoveryChart.resize();
      }
      
      // 初始化班级对比图表
      this.initClassCharts();
    },
    
    // 初始化班级对比图表
    initClassCharts() {
      // 班级运动负荷对比图
      const classLoadChartElement = document.getElementById('classLoadChart');
      if (classLoadChartElement) {
        if (this.classLoadChart) {
          this.classLoadChart.dispose();
        }
        this.classLoadChart = this.$echarts.init(classLoadChartElement);
        
        const classNames = this.classRanking.map(item => item.className);
        const averageLoads = this.classRanking.map(item => item.averageLoad);
        
        this.classLoadChart.setOption({
          title: { show: false },
          tooltip: {
            trigger: 'axis',
            formatter: '{b}: {c} 分'
          },
          xAxis: {
            type: 'category',
            data: classNames
          },
          yAxis: {
            type: 'value',
            name: '平均运动负荷 (分)'
          },
          series: [{
            data: averageLoads,
            type: 'bar',
            itemStyle: {
              color: new this.$echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#409EFF' },
                { offset: 1, color: '#66B1FF' }
              ])
            }
          }]
        });
        
        this.classLoadChart.resize();
      }
      
      // 班级达标率对比图
      const classComplianceChartElement = document.getElementById('classComplianceChart');
      if (classComplianceChartElement) {
        if (this.classComplianceChart) {
          this.classComplianceChart.dispose();
        }
        this.classComplianceChart = this.$echarts.init(classComplianceChartElement);
        
        const complianceRates = this.classRanking.map(item => item.complianceRate);
        const classNames = this.classRanking.map(item => item.className);
        
        this.classComplianceChart.setOption({
          title: { show: false },
          tooltip: {
            trigger: 'axis',
            formatter: '{b}: {c}%'
          },
          xAxis: {
            type: 'category',
            data: classNames
          },
          yAxis: {
            type: 'value',
            name: '达标率 (%)'
          },
          series: [{
            data: complianceRates,
            type: 'bar',
            itemStyle: {
              color: new this.$echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#E6A23C' },
                { offset: 1, color: '#EEBC6C' }
              ])
            }
          }]
        });
        
        this.classComplianceChart.resize();
      }
    },
    
    // 初始化当前activeTab对应的图表
    initCurrentChart() {
      console.log('初始化所有图表，activeTab:', this.activeTab);
      const { mockChartData } = this;
      
      // 健康数据趋势图
      const healthTrendDom = document.getElementById('healthTrendChart');
      if (healthTrendDom) {
        console.log('健康趋势图容器尺寸:', healthTrendDom.offsetWidth, 'x', healthTrendDom.offsetHeight);
        // 先销毁旧实例
        if (this.healthTrendChart) {
          this.healthTrendChart.dispose();
          this.healthTrendChart = null;
        }
        // 重新初始化图表
        this.healthTrendChart = this.$echarts.init(healthTrendDom);
        
        // 直接使用模拟数据设置图表
        this.healthTrendChart.setOption({
          title: { text: '健康数据趋势', left: 'center' },
          tooltip: {
            trigger: 'axis',
            formatter: '{b}<br/>{a}: {c} {unit}',
            axisPointer: {
              type: 'cross',
              label: {
                backgroundColor: '#6a7985'
              }
            }
          },
          legend: {
            data: ['心率', '血氧'],
            top: 30
          },
          xAxis: {
            type: 'category',
            data: mockChartData.dates
          },
          yAxis: [
            {
              type: 'value',
              name: '心率 (次/分钟)',
              min: 60,
              max: 100
            },
            {
              type: 'value',
              name: '血氧 (%)',
              min: 90,
              max: 100
            }
          ],
          series: [
            {
              name: '心率',
              type: 'line',
              data: mockChartData.heartRate,
              itemStyle: { color: '#409EFF' },
              smooth: true
            },
            {
              name: '血氧',
              type: 'line',
              yAxisIndex: 1,
              data: mockChartData.bloodOxygen,
              itemStyle: { color: '#67C23A' },
              smooth: true
            }
          ]
        });
        
        // 确保图表能正确显示
        setTimeout(() => {
          this.healthTrendChart.resize();
        }, 0);
      }
      
      // 运动负荷趋势图
      const loadTrendDom = document.getElementById('loadTrendChart');
      if (loadTrendDom) {
        console.log('运动负荷趋势图容器尺寸:', loadTrendDom.offsetWidth, 'x', loadTrendDom.offsetHeight);
        // 先销毁旧实例
        if (this.loadTrendChart) {
          this.loadTrendChart.dispose();
          this.loadTrendChart = null;
        }
        // 重新初始化图表
        this.loadTrendChart = this.$echarts.init(loadTrendDom);
        
        // 直接使用模拟数据设置图表
        this.loadTrendChart.setOption({
          title: { text: '运动负荷趋势', left: 'center' },
          tooltip: {
            trigger: 'axis',
            formatter: '{b}: {c} 分/日'
          },
          xAxis: {
            type: 'category',
            data: mockChartData.dates
          },
          yAxis: {
            type: 'value',
            name: '运动负荷 (分/日)'
          },
          series: [{
            data: mockChartData.load,
            type: 'bar',
            itemStyle: {
              color: new this.$echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#67C23A' },
                { offset: 1, color: '#85CE61' }
              ])
            }
          }]
        });
        
        // 确保图表能正确显示
        setTimeout(() => {
          this.loadTrendChart.resize();
        }, 0);
      }
      
      // 恢复状况趋势图
      const recoveryDom = document.getElementById('recoveryChart');
      if (recoveryDom) {
        console.log('恢复程度趋势图容器尺寸:', recoveryDom.offsetWidth, 'x', recoveryDom.offsetHeight);
        // 先销毁旧实例
        if (this.recoveryChart) {
          this.recoveryChart.dispose();
          this.recoveryChart = null;
        }
        // 重新初始化图表
        this.recoveryChart = this.$echarts.init(recoveryDom);
        
        // 直接使用模拟数据设置图表
        this.recoveryChart.setOption({
          title: { text: '恢复状况趋势', left: 'center' },
          tooltip: {
            trigger: 'axis',
            formatter: '{b}: {c}%'
          },
          xAxis: {
            type: 'category',
            data: mockChartData.dates
          },
          yAxis: {
            type: 'value',
            name: '恢复程度 (%)'
          },
          series: [{
            data: mockChartData.recovery,
            type: 'line',
            smooth: true,
            itemStyle: { color: '#E6A23C' },
            areaStyle: {
              color: new this.$echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(230, 162, 60, 0.5)' },
                { offset: 1, color: 'rgba(230, 162, 60, 0.1)' }
              ])
            }
          }]
        });
        
        // 确保图表能正确显示
        setTimeout(() => {
          this.recoveryChart.resize();
        }, 0);
      }
    },
    
    handleTabClick(tab) {
      // 当切换tab时，等待DOM更新后重新初始化当前tab对应的图表
      this.$nextTick(() => {
        // 增加延迟时间，确保DOM元素完全渲染
        setTimeout(() => {
          // 根据当前activeTab初始化对应的图表
          this.initCurrentChart();
        }, 100); // 增加延迟时间到100毫秒
      });
    },
    updateCharts() {
      // 模拟最近7天的数据
      const dates = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0].slice(5));
      }
      
      // 健康数据趋势图
      if (this.healthTrendChart) {
        this.healthTrendChart.setOption({
          title: { show: false },
          tooltip: {
            trigger: 'axis',
            formatter: '{b}<br/>{a}: {c} {unit}',
            axisPointer: {
              type: 'cross',
              label: {
                backgroundColor: '#6a7985'
              }
            }
          },
          legend: {
            data: ['心率', '血氧'],
            top: 0
          },
          xAxis: {
            type: 'category',
            data: dates
          },
          yAxis: [
            {
              type: 'value',
              name: '心率 (次/分钟)',
              min: 60,
              max: 100
            },
            {
              type: 'value',
              name: '血氧 (%)',
              min: 90,
              max: 100
            }
          ],
          series: [
            {
              name: '心率',
              type: 'line',
              data: [75, 78, 73, 80, 76, 79, 74],
              itemStyle: { color: '#409EFF' },
              smooth: true
            },
            {
              name: '血氧',
              type: 'line',
              yAxisIndex: 1,
              data: [97, 96, 98, 97, 96, 97, 98],
              itemStyle: { color: '#67C23A' },
              smooth: true
            }
          ]
        });
      }
      
      // 运动负荷趋势图
      if (this.loadTrendChart) {
        this.loadTrendChart.setOption({
          title: { show: false },
          tooltip: {
            trigger: 'axis',
            formatter: '{b}: {c} 分/日'
          },
          xAxis: {
            type: 'category',
            data: dates
          },
          yAxis: {
            type: 'value',
            name: '运动负荷 (分/日)'
          },
          series: [{
            data: [65, 72, 58, 75, 68, 78, 62],
            type: 'bar',
            itemStyle: {
              color: new this.$echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#67C23A' },
                { offset: 1, color: '#85CE61' }
              ])
            }
          }]
        });
        this.loadTrendChart.resize();
      }
      
      // 恢复程度趋势图
      if (this.recoveryChart) {
        this.recoveryChart.setOption({
          title: { show: false },
          tooltip: {
            trigger: 'axis',
            formatter: '{b}: {c}%'
          },
          xAxis: {
            type: 'category',
            data: dates
          },
          yAxis: {
            type: 'value',
            name: '恢复程度 (%)'
          },
          series: [{
            data: [85, 78, 90, 82, 88, 75, 86],
            type: 'line',
            smooth: true,
            itemStyle: { color: '#E6A23C' },
            areaStyle: {
              color: new this.$echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(230, 162, 60, 0.5)' },
                { offset: 1, color: 'rgba(230, 162, 60, 0.1)' }
              ])
            }
          }]
        });
        this.recoveryChart.resize();
      }
      
      // 恢复程度趋势图
      if (this.recoveryChart) {
        this.recoveryChart.setOption({
          title: { show: false },
          tooltip: {
            trigger: 'axis',
            formatter: '{b}: {c}%'
          },
          xAxis: {
            type: 'category',
            data: dates
          },
          yAxis: {
            type: 'value',
            name: '恢复程度 (%)'
          },
          series: [{
            data: [85, 78, 90, 82, 88, 75, 86],
            type: 'line',
            smooth: true,
            itemStyle: { color: '#E6A23C' },
            areaStyle: {
              color: new this.$echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(230, 162, 60, 0.5)' },
                { offset: 1, color: 'rgba(230, 162, 60, 0.1)' }
              ])
            }
          }]
        });
      }
      
      // 班级运动负荷对比图
      if (this.classLoadChart) {
        this.classLoadChart.setOption({
          title: { show: false },
          tooltip: {
            trigger: 'axis',
            formatter: '{b}: {c} 分/日'
          },
          legend: {
            data: dates,
            top: 0
          },
          xAxis: {
            type: 'category',
            data: ['高一1班', '高一2班', '高一3班']
          },
          yAxis: {
            type: 'value',
            name: '运动负荷 (分/日)'
          },
          series: dates.map((date, index) => ({
            name: date,
            type: 'bar',
            data: [
              Math.floor(Math.random() * 30) + 60,
              Math.floor(Math.random() * 30) + 55,
              Math.floor(Math.random() * 30) + 50
            ]
          }))
        });
      }
      
      // 班级达标率对比图
      if (this.classComplianceChart) {
        this.classComplianceChart.setOption({
          title: { show: false },
          tooltip: {
            trigger: 'item',
            formatter: '{b}: {c}% ({d}%)'
          },
          legend: {
            data: ['高一1班', '高一2班', '高一3班'],
            orient: 'vertical',
            left: 'left'
          },
          series: [{
            name: '达标率',
            type: 'pie',
            radius: '50%',
            data: [
              { value: 85, name: '高一1班' },
              { value: 78, name: '高一2班' },
              { value: 75, name: '高一3班' }
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }]
        });
      }
    },
    async handleDateChange() {
      // 处理日期范围变化
      await this.queryData();
      this.$nextTick(() => {
        this.initCurrentChart();
      });
    },
    handleReportTypeChange() {
      // 处理报告类型变化
      this.$nextTick(() => {
        if (this.filterForm.reportType === 'class') {
          // 确保班级对比图表已经初始化
          if (!this.classLoadChart) this.classLoadChart = this.$echarts.init(document.getElementById('classLoadChart'));
          if (!this.classComplianceChart) this.classComplianceChart = this.$echarts.init(document.getElementById('classComplianceChart'));
          this.updateCharts();
        }
      });
    },
    async queryData() {
      // 查询数据
      if (!this.filterForm.dateRange || this.filterForm.dateRange.length !== 2) {
        this.$message.error('请选择时间范围');
        return;
      }
      
      this.$message.info('正在查询数据...');
      
      try {
        // 调用API获取数据
        // 从localStorage获取用户信息
        const userInfo = JSON.parse(localStorage.getItem('user'));
        const params = {
          userId: userInfo?.id || 1, // 使用默认值1以防localStorage中没有数据
          startDate: this.filterForm.dateRange[0],
          endDate: this.filterForm.dateRange[1]
        };
        
        const response = await DataAnalysisService.getUserExerciseReport(params);
        
        // 更新页面数据
        const data = response.data;
        const report = data.report;
        
        // 更新概览数据
        this.totalDays = report.period?.days || 0;
        this.averageSteps = report.healthMetrics?.steps?.average || 0;
        this.averageHeartRate = report.healthMetrics?.heartRate?.average || 0;
        this.达标天数 = report.period?.days || 0; // 使用活动天数作为达标天数的默认值
        this.healthScore = report.healthScore?.score || 0;
        this.healthGrade = report.healthScore?.grade || '未知';
        this.healthGradeType = this.getHealthGradeType(report.healthScore?.grade || '未知');
        this.exerciseLoad = report.exerciseMetrics?.exerciseLoad || 0;
        this.recoveryLevel = report.exerciseMetrics?.recoveryLevel || 0;
        
        // 更新健康风险和最佳运动时间
        this.healthRisks = report.healthRisks || [];
        this.bestExerciseTime = report.bestExerciseTime || '';
        
        // 更新每日统计数据
        this.dailyStats = report.dailyStats || {};
        
        // 更新图表数据
        this.updateChartsWithRealData(data);
        
        this.$message.success('数据查询完成');
      } catch (error) {
        console.error('获取运动报告失败:', error);
        this.$message.error('获取运动报告失败，请稍后重试');
      }
    },
    
    calculateDays(startDate, endDate) {
      // 计算两个日期之间的天数
      const start = new Date(startDate);
      const end = new Date(endDate);
      return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    },
    
    updateChartsWithRealData(data) {
      // 使用真实数据更新图表
      console.log('updateChartsWithRealData called with data:', data);
      
      const report = data.report;
      const dailyStats = (report && report.dailyStats) || {};
      console.log('dailyStats:', dailyStats);
      
      let dates = Object.keys(dailyStats).sort(); // 确保按日期排序
      console.log('dates from dailyStats:', dates);
      
      // 如果没有dailyStats数据，使用模拟日期
      if (dates.length === 0) {
        // 使用时间范围内的日期
        const startDate = new Date(this.filterForm.dateRange[0]);
        const endDate = new Date(this.filterForm.dateRange[1]);
        dates = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          dates.push(d.toISOString().split('T')[0]);
        }
        console.log('dates from dateRange:', dates);
      }
      
      const formattedDates = dates.map(date => date.slice(5)); // 格式化为MM-DD
      console.log('formattedDates:', formattedDates);
      
      // 提取心率和血氧数据
      let heartRateData = [];
      let bloodOxygenData = [];
      let loadData = [];
      let recoveryData = [];
      
      if (Object.keys(dailyStats).length > 0) {
        // 如果有dailyStats数据，从dailyStats中提取
        heartRateData = dates.map(date => Math.round(dailyStats[date]?.heartRate?.average || 0));
        bloodOxygenData = dates.map(date => Math.round(dailyStats[date]?.bloodOxygen?.average || 0));
        
        // 计算运动负荷数据
        loadData = dates.map(date => Math.round(dailyStats[date]?.heartRate?.average * 0.8 || 0));
        
        // 计算恢复程度数据
        recoveryData = dates.map(date => Math.round(dailyStats[date]?.bloodOxygen?.average - 90) * 10 || 0);
      } else {
        // 如果没有dailyStats数据，使用report.exerciseMetrics中的数据
        heartRateData = dates.map(() => Math.round(report?.healthMetrics?.heartRate?.average || 0));
        bloodOxygenData = dates.map(() => Math.round(report?.healthMetrics?.bloodOxygen?.average || 0));
        loadData = dates.map(() => Math.round(report?.exerciseMetrics?.exerciseLoad || 0));
        recoveryData = dates.map(() => Math.round(report?.exerciseMetrics?.recoveryLevel || 0));
      }
      
      console.log('heartRateData:', heartRateData);
      console.log('bloodOxygenData:', bloodOxygenData);
      console.log('loadData:', loadData);
      console.log('recoveryData:', recoveryData);
      
      // 更新健康数据趋势图
      if (this.healthTrendChart) {
        this.healthTrendChart.setOption({
          xAxis: {
            type: "category",
            data: formattedDates
          },
          series: [
            {
              name: "心率",
              data: heartRateData
            },
            {
              name: "血氧",
              data: bloodOxygenData
            }
          ]
        });
      }
      
      // 更新运动负荷趋势图
      if (this.loadTrendChart) {
        this.loadTrendChart.setOption({
          xAxis: {
            type: "category",
            data: formattedDates
          },
          series: [
            {
              data: loadData
            }
          ]
        });
      }
      
      // 更新恢复程度趋势图
      if (this.recoveryChart) {
        this.recoveryChart.setOption({
          xAxis: {
            type: "category",
            data: formattedDates
          },
          series: [
            {
              data: recoveryData
            }
          ]
        });
      }
    },
    resetFilter() {
      // 重置筛选条件
      this.filterForm = {
        dateRange: [],
        reportType: 'personal',
        dataDimension: ['health', 'load', 'recovery', 'fatigue']
      };
      // 设置默认日期范围为最近7天
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 6);
      this.filterForm.dateRange = [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]];
    },
    exportReport() {
      // 导出报告
      this.$message.info('正在导出报告...');
      setTimeout(() => {
        this.$message.success('报告导出成功');
      }, 1500);
    },
    viewReport(reportId) {
      // 查看报告详情
      this.$message.info(`查看报告ID: ${reportId}`);
    },
    exportSingleReport(reportId) {
      // 导出单个报告
      this.$message.info(`正在导出报告ID: ${reportId}...`);
      setTimeout(() => {
        this.$message.success('报告导出成功');
      }, 1000);
    },
    handlePageChange(val) {
      // 分页处理
      console.log(`当前页: ${val}`);
    }
  }
};
</script>

<style scoped>
.exercise-report-page {
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

.filter-card {
  margin-bottom: 20px;
}

.filter-content {
  padding: 0;
}

.filter-form {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.report-card {
  margin-bottom: 20px;
}

.card-header {
  margin-bottom: 20px;
}

.card-header h3 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.report-tabs {
  margin-top: 10px;
}

.tab-content {
  padding: 10px 0;
  width: 100%;
  box-sizing: border-box;
}

.chart-container {
  margin-bottom: 20px;
  width: 100%;
  height: 400px;
  box-sizing: border-box;
}

.chart-container h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.comprehensive-content {
  padding: 10px 0;
}

.recommendation-section {
  margin-top: 20px;
}

.recommendation-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.recommendation-list {
  padding-left: 20px;
  margin: 0;
}

.recommendation-list li {
  color: #606266;
  font-size: 13px;
  line-height: 1.8;
  margin-bottom: 5px;
}

.class-comparison-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ranking-section {
  margin-top: 20px;
}

.ranking-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.history-card {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 统计概览样式 */
.overview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.overview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.overview-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 5px;
}

.unit {
  font-size: 14px;
  font-weight: normal;
  color: #606266;
}

.overview-label {
  font-size: 14px;
  color: #606266;
}
</style>