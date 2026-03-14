<template>
  <div class="data-analysis-page">
    <div class="page-header">
      <el-button type="text" @click="$router.back()" class="back-btn">
        <i class="el-icon-arrow-left"></i> 返回
      </el-button>
      <h2 class="page-title">数据分析详情</h2>
      <div class="test-element" style="padding: 20px; background-color: #409eff; color: white; margin: 10px;">
        测试元素：如果能看到这个元素，说明页面模板基本正常
      </div>
      <div class="page-actions">
        <el-button type="primary" size="small" @click="generateAnalysis">重新分析</el-button>
        <el-button type="primary" size="small">生成报告</el-button>
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
          <el-form-item label="分析类型">
            <el-select v-model="analysisType" placeholder="请选择分析类型" size="small">
              <el-option label="运动表现分析" value="performance"></el-option>
              <el-option label="体能趋势分析" value="trend"></el-option>
              <el-option label="运动效果分析" value="effect"></el-option>
              <el-option label="班级对比分析" value="comparison"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="学生群体">
            <el-select v-model="studentGroup" placeholder="请选择学生群体" size="small">
              <el-option label="全体学生" value="all"></el-option>
              <el-option label="男生" value="male"></el-option>
              <el-option label="女生" value="female"></el-option>
              <el-option label="体育特长生" value="special"></el-option>
              <el-option label="普通学生" value="normal"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="运动类型">
            <el-select v-model="sportType" placeholder="请选择运动类型" size="small">
              <el-option label="全部类型" value="all"></el-option>
              <el-option label="跑步" value="running"></el-option>
              <el-option label="篮球" value="basketball"></el-option>
              <el-option label="足球" value="football"></el-option>
              <el-option label="羽毛球" value="badminton"></el-option>
              <el-option label="乒乓球" value="table_tennis"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="表现水平">
            <el-select v-model="performanceLevel" placeholder="请选择表现水平" size="small">
              <el-option label="全部水平" value="all"></el-option>
              <el-option label="优秀" value="excellent"></el-option>
              <el-option label="良好" value="good"></el-option>
              <el-option label="及格" value="pass"></el-option>
              <el-option label="不及格" value="fail"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" @click="applyFilter">应用</el-button>
            <el-button size="small" @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 分析概览 -->
      <div class="overview-section">
        <div class="chart-card">
          <div class="card-header">
            <span class="card-title">分析概览</span>
          </div>
          <div class="card-content">
            <el-row :gutter="24">
              <el-col :xs="24" :sm="12" :md="6" class="overview-col">
                <div class="overview-item">
                  <div class="overview-title">平均运动时长</div>
                  <div class="overview-value">45分钟</div>
                  <div class="overview-change">
                    <i class="el-icon-caret-top"></i>
                    <span class="increase">+5%</span>
                    <span class="change-text">较上周</span>
                  </div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6" class="overview-col">
                <div class="overview-item">
                  <div class="overview-title">平均卡路里消耗</div>
                  <div class="overview-value">380 kcal</div>
                  <div class="overview-change">
                    <i class="el-icon-caret-top"></i>
                    <span class="increase">+8%</span>
                    <span class="change-text">较上周</span>
                  </div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6" class="overview-col">
                <div class="overview-item">
                  <div class="overview-title">优秀率</div>
                  <div class="overview-value">75%</div>
                  <div class="overview-change">
                    <i class="el-icon-caret-top"></i>
                    <span class="increase">+3%</span>
                    <span class="change-text">较上周</span>
                  </div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6" class="overview-col">
                <div class="overview-item">
                  <div class="overview-title">参与率</div>
                  <div class="overview-value">92%</div>
                  <div class="overview-change">
                    <i class="el-icon-caret-bottom"></i>
                    <span class="decrease">-1%</span>
                    <span class="change-text">较上周</span>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </div>
      </div>

      <!-- 数据分析图表 -->
      <div class="charts-section">
        <el-row :gutter="24">
          <el-col :xs="24" :md="12" class="chart-col">
            <div class="chart-card">
              <div class="card-header">
                <span class="card-title">运动表现对比</span>
                <div class="card-actions">
                  <el-button size="mini" type="success" @click="exportChartData('performance')">导出数据</el-button>
                </div>
              </div>
              <div class="card-content">
                <div id="performanceChart" class="chart-container"></div>
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :md="12" class="chart-col">
            <div class="chart-card">
              <div class="card-header">
                <span class="card-title">体能趋势分析</span>
                <div class="card-actions">
                  <el-button size="mini" type="success" @click="exportChartData('fitness')">导出数据</el-button>
                </div>
              </div>
              <div class="card-content">
                <div id="fitnessChart" class="chart-container"></div>
              </div>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :xs="24" :md="12" class="chart-col">
            <div class="chart-card">
              <div class="card-header">
                <span class="card-title">运动效果分析</span>
                <div class="card-actions">
                  <el-button size="mini" type="success" @click="exportChartData('effect')">导出数据</el-button>
                </div>
              </div>
              <div class="card-content">
                <div id="effectChart" class="chart-container"></div>
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :md="12" class="chart-col">
            <div class="chart-card">
              <div class="card-header">
                <span class="card-title">班级对比分析</span>
                <div class="card-actions">
                  <el-button size="mini" type="success" @click="exportChartData('comparison')">导出数据</el-button>
                </div>
              </div>
              <div class="card-content">
                <div id="comparisonChart" class="chart-container"></div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 分析报告配置 -->
      <div class="report-config-section">
        <div class="chart-card">
          <div class="card-header">
            <span class="card-title">报告配置</span>
          </div>
          <div class="card-content">
            <div class="config-form">
              <el-row :gutter="20">
                <el-col :xs="24" :sm="12">
                  <el-form-item label="报告标题">
                    <el-input v-model="reportConfig.title" placeholder="请输入报告标题" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="6">
                  <el-form-item label="报告格式">
                    <el-select v-model="reportConfig.format" placeholder="请选择报告格式">
                      <el-option label="详细版" value="detailed" />
                      <el-option label="精简版" value="simple" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="6">
                  <el-form-item label="导出格式">
                    <el-select v-model="reportConfig.exportFormat" placeholder="请选择导出格式">
                      <el-option label="Excel" value="excel" />
                      <el-option label="PDF" value="pdf" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-row>
                <el-col :xs="24">
                  <el-form-item label="报告内容">
                    <el-checkbox-group v-model="reportConfig.content">
                      <el-checkbox label="关键发现">关键发现</el-checkbox>
                      <el-checkbox label="建议措施">建议措施</el-checkbox>
                      <el-checkbox label="运动表现数据">运动表现数据</el-checkbox>
                      <el-checkbox label="体能趋势分析">体能趋势分析</el-checkbox>
                      <el-checkbox label="运动效果评估">运动效果评估</el-checkbox>
                      <el-checkbox label="班级对比分析">班级对比分析</el-checkbox>
                    </el-checkbox-group>
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-row>
                <el-col :xs="24" style="text-align: right;">
                  <el-button type="primary" @click="generateReport">生成分析报告</el-button>
                  <el-button type="success" @click="exportReport" :disabled="!reportGenerated">导出报告</el-button>
                </el-col>
              </el-row>
            </div>
          </div>
        </div>
      </div>

      <!-- 分析报告 -->
      <div class="report-section" v-if="reportGenerated">
        <div class="chart-card">
          <div class="card-header">
            <span class="card-title">{{ reportData.title }}</span>
            <span class="report-date">{{ reportData.date }}</span>
          </div>
          <div class="card-content">
            <div class="report-content">
              <div class="report-summary">
                <p>本报告基于所选时间范围内的运动数据生成，共分析了{{ reportData.summary.studentCount }}名学生的运动记录，涵盖{{ reportData.summary.sportTypeCount }}种运动类型。</p>
              </div>
              
              <h3 v-if="reportConfig.content.includes('关键发现')">关键发现</h3>
              <ul class="findings-list" v-if="reportConfig.content.includes('关键发现')">
                <li v-for="(finding, index) in reportData.findings" :key="index">
                  <span class="finding-title">{{ finding.title }}</span>
                  <span class="finding-content">{{ finding.content }}</span>
                </li>
              </ul>

              <h3 v-if="reportConfig.content.includes('建议措施')">建议措施</h3>
              <ul class="recommendations-list" v-if="reportConfig.content.includes('建议措施')">
                <li v-for="(recommendation, index) in reportData.recommendations" :key="index">
                  <span class="recommendation-title">{{ recommendation.title }}</span>
                  <span class="recommendation-content">{{ recommendation.content }}</span>
                </li>
              </ul>
              
              <h3 v-if="reportConfig.content.includes('运动表现数据')">运动表现数据</h3>
              <div class="report-data" v-if="reportConfig.content.includes('运动表现数据')">
                <el-table :data="reportData.performanceData" stripe style="width: 100%">
                  <el-table-column prop="className" label="班级" width="120" />
                  <el-table-column prop="excellentRate" label="优秀率" width="100" />
                  <el-table-column prop="participationRate" label="参与率" width="100" />
                  <el-table-column prop="avgDuration" label="平均时长" />
                  <el-table-column prop="avgCalories" label="平均卡路里" />
                </el-table>
              </div>
              
              <h3 v-if="reportConfig.content.includes('体能趋势分析') && reportConfig.format === 'detailed'">体能趋势分析</h3>
              <div class="report-chart" v-if="reportConfig.content.includes('体能趋势分析') && reportConfig.format === 'detailed'">
                <div id="reportFitnessChart" class="chart-container-small"></div>
              </div>
              
              <h3 v-if="reportConfig.content.includes('班级对比分析') && reportConfig.format === 'detailed'">班级对比分析</h3>
              <div class="report-chart" v-if="reportConfig.content.includes('班级对比分析') && reportConfig.format === 'detailed'">
                <div id="reportComparisonChart" class="chart-container-small"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import DataAnalysisService from '../../services/DataAnalysisService'

export default {
  name: 'DataAnalysis',
  data() {
    return {
      dateRange: [],
      selectedClass: '',
      analysisType: 'performance',
      studentGroup: '', // 学生群体筛选
      sportType: '', // 运动类型筛选
      performanceLevel: '', // 表现水平筛选
      performanceChart: null,
      fitnessChart: null,
      effectChart: null,
      comparisonChart: null,
      loading: false,
      // 存储图表数据
      chartData: {
        performance: null,
        fitness: null,
        effect: null,
        comparison: null
      },
      reportConfig: {
        title: '学生运动数据分析报告',
        format: 'detailed',
        exportFormat: 'excel',
        content: ['关键发现', '建议措施', '运动表现数据']
      },
      reportData: {
        title: '',
        date: '',
        summary: {
          studentCount: 0,
          sportTypeCount: 0
        },
        findings: [],
        recommendations: [],
        performanceData: []
      },
      reportGenerated: false,
      reportFitnessChart: null,
      reportComparisonChart: null
    }
  },
  mounted() {
    this.fetchAllChartsData()
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    this.destroyCharts()
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    // 获取所有图表数据
    async fetchAllChartsData() {
      this.loading = true
      console.log('开始获取图表数据...')
      try {
        // 并行获取所有图表数据
        const [performanceData, fitnessData, effectData, comparisonData] = await Promise.all([
          DataAnalysisService.getPerformanceData(this.getRequestParams()),
          DataAnalysisService.getFitnessTrendData(this.getRequestParams()),
          DataAnalysisService.getEffectAnalysisData(this.getRequestParams()),
          DataAnalysisService.getComparisonData(this.getRequestParams())
        ])
        
        console.log('获取图表数据成功:', performanceData, fitnessData, effectData, comparisonData)
        
        // 初始化所有图表
        this.initPerformanceChart(performanceData)
        this.initFitnessChart(fitnessData)
        this.initEffectChart(effectData)
        this.initComparisonChart(comparisonData)
      } catch (error) {
        console.error('获取图表数据失败:', error)
        console.error('错误详情:', error.message)
        console.error('错误堆栈:', error.stack)
      } finally {
        this.loading = false
        console.log('数据获取流程结束')
      }
    },
    
    // 获取请求参数
    getRequestParams() {
      return {
        dateRange: this.dateRange,
        className: this.selectedClass,
        analysisType: this.analysisType,
        studentGroup: this.studentGroup,
        sportType: this.sportType,
        performanceLevel: this.performanceLevel
      }
    },
    
    // 应用筛选条件
    applyFilter() {
      this.fetchAllChartsData()
    },
    
    // 重置筛选条件
    resetFilter() {
      this.dateRange = []
      this.selectedClass = ''
      this.analysisType = 'performance'
      this.studentGroup = ''
      this.sportType = ''
      this.performanceLevel = ''
      this.fetchAllChartsData()
    },
    
    // 初始化运动表现对比图
    initPerformanceChart(data) {
      this.chartData.performance = data
      const performanceDom = document.getElementById('performanceChart')
      if (performanceDom) {
        this.performanceChart = echarts.init(performanceDom)
        const performanceOption = {
          grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            containLabel: true
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            },
            formatter: function(params) {
              let result = params[0].axisValue + '<br/>'
              let total = 0
              params.forEach(item => {
                result += `${item.marker}${item.seriesName}: ${item.value}人<br/>`
                total += item.value
              })
              result += `总计: ${total}人`
              return result
            }
          },
          legend: {
            data: ['优秀', '良好', '及格', '不及格'],
            textStyle: {
              color: '#606266'
            },
            selectMode: 'multiple' // 启用图例筛选
          },
          xAxis: {
            type: 'category',
            data: data.categories,
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
          dataZoom: [
            {
              type: 'inside',
              start: 0,
              end: 100
            },
            {
              show: true,
              type: 'slider',
              bottom: '5%',
              start: 0,
              end: 100,
              handleStyle: {
                color: '#409eff'
              }
            }
          ],
          series: [
            {
              name: '优秀',
              type: 'bar',
              stack: 'total',
              data: data.series[0].data,
              itemStyle: {
                color: '#67c23a'
              }
            },
            {
              name: '良好',
              type: 'bar',
              stack: 'total',
              data: data.series[1].data,
              itemStyle: {
                color: '#409eff'
              }
            },
            {
              name: '及格',
              type: 'bar',
              stack: 'total',
              data: data.series[2].data,
              itemStyle: {
                color: '#e6a23c'
              }
            },
            {
              name: '不及格',
              type: 'bar',
              stack: 'total',
              data: data.series[3].data,
              itemStyle: {
                color: '#f56c6c'
              }
            }
          ]
        }
        this.performanceChart.setOption(performanceOption)
      }
    },
    
    // 初始化体能趋势分析图
    initFitnessChart(data) {
      this.chartData.fitness = data
      const fitnessDom = document.getElementById('fitnessChart')
      if (fitnessDom) {
        this.fitnessChart = echarts.init(fitnessDom)
        const fitnessOption = {
          grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            containLabel: true
          },
          tooltip: {
            trigger: 'axis',
            formatter: function(params) {
              let result = params[0].axisValue + '<br/>'
              params.forEach(item => {
                result += `${item.marker}${item.seriesName}: ${item.value}分<br/>`
              })
              return result
            }
          },
          legend: {
            data: ['耐力', '速度', '力量', '柔韧性'],
            textStyle: {
              color: '#606266'
            },
            selectMode: 'multiple' // 启用图例筛选
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: data.categories,
            axisLabel: {
              color: '#606266'
            }
          },
          yAxis: {
            type: 'value',
            axisLabel: {
              color: '#606266'
            }
          },
          dataZoom: [
            {
              type: 'inside',
              start: 0,
              end: 100
            },
            {
              show: true,
              type: 'slider',
              bottom: '5%',
              start: 0,
              end: 100,
              handleStyle: {
                color: '#409eff'
              }
            }
          ],
          series: [
            {
              name: '耐力',
              type: 'line',
              data: data.series[0].data,
              itemStyle: {
                color: '#67c23a'
              },
              smooth: true,
              emphasis: {
                focus: 'series'
              }
            },
            {
              name: '速度',
              type: 'line',
              data: data.series[1].data,
              itemStyle: {
                color: '#409eff'
              },
              smooth: true,
              emphasis: {
                focus: 'series'
              }
            },
            {
              name: '力量',
              type: 'line',
              data: data.series[2].data,
              itemStyle: {
                color: '#e6a23c'
              },
              smooth: true,
              emphasis: {
                focus: 'series'
              }
            },
            {
              name: '柔韧性',
              type: 'line',
              data: data.series[3].data,
              itemStyle: {
                color: '#f56c6c'
              },
              smooth: true,
              emphasis: {
                focus: 'series'
              }
            }
          ]
        }
        this.fitnessChart.setOption(fitnessOption)
      }
    },
    
    // 初始化运动效果分析图
    initEffectChart(data) {
      this.chartData.effect = data
      const effectDom = document.getElementById('effectChart')
      if (effectDom) {
        this.effectChart = echarts.init(effectDom)
        const effectOption = {
          grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            containLabel: true
          },
          tooltip: {
            trigger: 'axis',
            formatter: function(params) {
              let result = params[0].axisValue + '<br/>'
              params.forEach(item => {
                if (item.seriesName === '体脂率变化') {
                  result += `${item.marker}${item.seriesName}: ${item.value}%<br/>`
                } else {
                  result += `${item.marker}${item.seriesName}: ${item.value}kg<br/>`
                }
              })
              return result
            }
          },
          legend: {
            data: ['体重变化', '体脂率变化'],
            textStyle: {
              color: '#606266'
            },
            selectMode: 'multiple' // 启用图例筛选
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: data.categories,
            axisLabel: {
              color: '#606266'
            }
          },
          yAxis: [
            {
              type: 'value',
              name: '体重变化(kg)',
              axisLabel: {
                color: '#606266'
              }
            },
            {
              type: 'value',
              name: '体脂率变化(%)',
              axisLabel: {
                color: '#606266'
              }
            }
          ],
          dataZoom: [
            {
              type: 'inside',
              start: 0,
              end: 100
            },
            {
              show: true,
              type: 'slider',
              bottom: '5%',
              start: 0,
              end: 100,
              handleStyle: {
                color: '#409eff'
              }
            }
          ],
          series: [
            {
              name: '体重变化',
              type: 'line',
              data: data.series[0].data,
              itemStyle: {
                color: '#409eff'
              },
              smooth: true,
              emphasis: {
                focus: 'series'
              }
            },
            {
              name: '体脂率变化',
              type: 'line',
              yAxisIndex: 1,
              data: data.series[1].data,
              itemStyle: {
                color: '#67c23a'
              },
              smooth: true,
              emphasis: {
                focus: 'series'
              }
            }
          ]
        }
        this.effectChart.setOption(effectOption)
      }
    },
    
    // 初始化班级对比分析图
    initComparisonChart(data) {
      this.chartData.comparison = data
      const comparisonDom = document.getElementById('comparisonChart')
      if (comparisonDom) {
        this.comparisonChart = echarts.init(comparisonDom)
        const comparisonOption = {
          grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            containLabel: true
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            },
            formatter: function(params) {
              let result = params[0].axisValue + '<br/>'
              params.forEach(item => {
                if (item.seriesName === '平均时长') {
                  result += `${item.marker}${item.seriesName}: ${item.value}分钟<br/>`
                } else if (item.seriesName === '卡路里消耗') {
                  result += `${item.marker}${item.seriesName}: ${item.value}卡路里<br/>`
                } else {
                  result += `${item.marker}${item.seriesName}: ${item.value}次<br/>`
                }
              })
              return result
            }
          },
          legend: {
            data: ['运动次数', '平均时长', '卡路里消耗'],
            textStyle: {
              color: '#606266'
            },
            selectMode: 'multiple' // 启用图例筛选
          },
          xAxis: {
            type: 'value',
            axisLabel: {
              color: '#606266'
            }
          },
          yAxis: {
            type: 'category',
            data: data.categories,
            axisLabel: {
              color: '#606266'
            }
          },
          dataZoom: [
            {
              type: 'inside',
              start: 0,
              end: 100
            },
            {
              show: true,
              type: 'slider',
              bottom: '5%',
              start: 0,
              end: 100,
              handleStyle: {
                color: '#409eff'
              }
            }
          ],
          series: [
            {
              name: '运动次数',
              type: 'bar',
              data: data.series[0].data,
              itemStyle: {
                color: '#409eff'
              },
              emphasis: {
                focus: 'series'
              }
            },
            {
              name: '平均时长',
              type: 'bar',
              data: data.series[1].data,
              itemStyle: {
                color: '#67c23a'
              },
              emphasis: {
                focus: 'series'
              }
            },
            {
              name: '卡路里消耗',
              type: 'bar',
              data: data.series[2].data,
              itemStyle: {
                color: '#e6a23c'
              },
              emphasis: {
                focus: 'series'
              }
            }
          ]
        }
        this.comparisonChart.setOption(comparisonOption)
      }

    },
    destroyCharts() {
      if (this.performanceChart) {
        this.performanceChart.dispose()
        this.performanceChart = null
      }
      if (this.fitnessChart) {
        this.fitnessChart.dispose()
        this.fitnessChart = null
      }
      if (this.effectChart) {
        this.effectChart.dispose()
        this.effectChart = null
      }
      if (this.comparisonChart) {
        this.comparisonChart.dispose()
        this.comparisonChart = null
      }
    },
    handleResize() {
      if (this.performanceChart) {
        this.performanceChart.resize()
      }
      if (this.fitnessChart) {
        this.fitnessChart.resize()
      }
      if (this.effectChart) {
        this.effectChart.resize()
      }
      if (this.comparisonChart) {
        this.comparisonChart.resize()
      }
    },
    generateAnalysis() {
      // 模拟重新分析数据
      this.$message.success('数据分析完成')
      // 实际应用中需要调用API重新生成分析数据
    },
    
    // 生成分析报告
    async generateReport() {
      this.loading = true
      try {
        const reportData = await DataAnalysisService.generateReport({
          ...this.getRequestParams(),
          reportConfig: this.reportConfig
        })
        
        this.reportData = reportData
        this.reportGenerated = true
        
        // 初始化报告中的图表
        if (this.reportConfig.content.includes('体能趋势分析') && this.reportConfig.format === 'detailed') {
          this.initReportFitnessChart()
        }
        
        if (this.reportConfig.content.includes('班级对比分析') && this.reportConfig.format === 'detailed') {
          this.initReportComparisonChart()
        }
        
        this.$message.success('分析报告生成成功')
      } catch (error) {
        console.error('生成报告失败:', error)
        this.$message.error('生成报告失败，请重试')
      } finally {
        this.loading = false
      }
    },
    
    // 初始化报告中的体能趋势图
    initReportFitnessChart() {
      const chartDom = document.getElementById('reportFitnessChart')
      if (chartDom) {
        this.reportFitnessChart = echarts.init(chartDom)
        const option = {
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
            data: ['耐力', '速度', '力量'],
            textStyle: {
              fontSize: 12
            }
          },
          xAxis: {
            type: 'category',
            data: ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周']
          },
          yAxis: {
            type: 'value'
          },
          series: [
            {
              name: '耐力',
              type: 'line',
              data: [65, 68, 72, 75, 78, 82],
              itemStyle: {
                color: '#67c23a'
              }
            },
            {
              name: '速度',
              type: 'line',
              data: [70, 72, 75, 76, 78, 80],
              itemStyle: {
                color: '#409eff'
              }
            },
            {
              name: '力量',
              type: 'line',
              data: [60, 63, 65, 68, 70, 72],
              itemStyle: {
                color: '#e6a23c'
              }
            }
          ]
        }
        this.reportFitnessChart.setOption(option)
      }
    },
    
    // 初始化报告中的班级对比图
    initReportComparisonChart() {
      const chartDom = document.getElementById('reportComparisonChart')
      if (chartDom) {
        this.reportComparisonChart = echarts.init(chartDom)
        const option = {
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
              fontSize: 12
            }
          },
          xAxis: {
            type: 'value'
          },
          yAxis: {
            type: 'category',
            data: ['2023级1班', '2023级2班', '2023级3班']
          },
          series: [
            {
              name: '运动次数',
              type: 'bar',
              data: [120, 150, 110],
              itemStyle: {
                color: '#409eff'
              }
            },
            {
              name: '平均时长',
              type: 'bar',
              data: [42, 50, 40],
              itemStyle: {
                color: '#67c23a'
              }
            }
          ]
        }
        this.reportComparisonChart.setOption(option)
      }
    },
    
    // 导出分析报告
    exportReport() {
      DataAnalysisService.exportReport(this.reportData, this.reportConfig.exportFormat)
        .then(() => {
          this.$message.success(`报告已成功导出为${this.reportConfig.exportFormat === 'excel' ? 'Excel' : 'PDF'}格式`)
        })
        .catch(error => {
          console.error('导出报告失败:', error)
          this.$message.error('导出报告失败，请重试')
        })
    },
    
    // 导出图表数据
    exportChartData(chartType) {
      const data = this.chartData[chartType]
      if (!data) {
        this.$message.warning('当前图表数据不可用')
        return
      }
      
      // 调用服务导出图表数据
      DataAnalysisService.exportChartData(data, chartType, 'excel')
        .then(() => {
          this.$message.success('图表数据导出成功')
        })
        .catch(error => {
          console.error('导出图表数据失败:', error)
          this.$message.error('导出图表数据失败，请重试')
        })
    }
  }
}
</script>

<style scoped>
.data-analysis-page {
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
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.filter-form .el-form-item {
  margin-bottom: 16px;
  width: calc(50% - 8px);
}

@media (max-width: 768px) {
  .filter-form .el-form-item {
    width: 100%;
  }
}

.overview-section {
  margin-bottom: 24px;
}

.overview-col {
  margin-bottom: 20px;
}

.overview-item {
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  text-align: center;
}

.overview-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.overview-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.overview-change {
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.overview-change i {
  color: #f56c6c;
}

.overview-change .increase {
  color: #f56c6c;
}

.overview-change .decrease {
  color: #67c23a;
}

.overview-change .change-text {
  color: #909399;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-card .card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  margin-right: 10px;
}

.chart-card .card-actions {
  white-space: nowrap;
}

.chart-card .card-content {
  padding: 20px;
}

.chart-container {
  height: 300px;
  width: 100%;
  min-height: 250px;
}

@media (max-width: 768px) {
  .chart-container {
    height: 250px;
  }
}

@media (min-width: 1200px) {
  .chart-container {
    height: 350px;
  }
}

.report-section {
  margin-bottom: 24px;
}

.report-content {
  line-height: 1.8;
  color: #303133;
}

.report-content h3 {
  font-size: 18px;
  font-weight: 600;
  margin-top: 20px;
  margin-bottom: 16px;
  color: #303133;
}

.findings-list, .recommendations-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.findings-list li, .recommendations-list li {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  gap: 12px;
}

.finding-title, .recommendation-title {
  font-weight: 600;
  color: #409eff;
  min-width: 120px;
}

.finding-content, .recommendation-content {
  color: #606266;
  flex: 1;
}
</style>