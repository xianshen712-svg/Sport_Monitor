<template>
  <div class="teacher-training-module">
    <el-card shadow="hover" class="page-header">
      <div class="card-header">
        <el-button type="text" @click="$router.back()" class="back-btn">
          <i class="el-icon-arrow-left"></i> 返回
        </el-button>
        <h2>训练模块</h2>
        <p>班级：{{ userInfo.className }}</p>
      </div>
    </el-card>
    
    <!-- 功能标签页 -->
    <el-card shadow="hover" class="tab-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="训练计划管理" name="plans">
          <div class="tab-content">
            <div class="plans-header">
              <el-button type="primary" @click="showAddPlanDialog">
                <i class="el-icon-plus"></i> 新建训练计划
              </el-button>
              <el-button @click="importTrainingTemplate">
                <i class="el-icon-upload2"></i> 导入模板
              </el-button>
              <el-button @click="exportTrainingTemplate">
                <i class="el-icon-download"></i> 导出模板
              </el-button>
            </div>
            
            <el-table
              :data="trainingPlans"
              border
              stripe
              style="width: 100%"
              height="500"
            >
              <el-table-column prop="planId" label="计划ID" width="100" align="center"></el-table-column>
              <el-table-column prop="planName" label="计划名称" width="200"></el-table-column>
              <el-table-column prop="trainingType" label="训练类型" width="120" align="center">
                <template v-slot="scope">
                  <el-tag :type="getTrainingTypeColor(scope.row.trainingType)">
                    {{ scope.row.trainingType }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="targetDuration" label="目标时长" width="120" align="center">
                <template v-slot="scope">
                  {{ scope.row.targetDuration }}分钟
                </template>
              </el-table-column>
              <el-table-column prop="targetIntensity" label="目标强度" width="120" align="center">
                <template v-slot="scope">
                  <el-progress
                    :percentage="getIntensityValue(scope.row.targetIntensity)"
                    :color="getIntensityColor(scope.row.targetIntensity)"
                    :show-text="false"
                    :stroke-width="8"
                    size="small"
                  ></el-progress>
                  <span class="intensity-text">{{ scope.row.targetIntensity }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="startDate" label="开始日期" width="120" align="center"></el-table-column>
              <el-table-column prop="endDate" label="结束日期" width="120" align="center"></el-table-column>
              <el-table-column prop="status" label="状态" width="100" align="center">
                <template v-slot="scope">
                  <el-tag :type="getStatusColor(scope.row.status)">
                    {{ scope.row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="students" label="参与学生" width="100" align="center">
                <template v-slot="scope">
                  {{ scope.row.students.length }}人
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200" align="center">
                <template v-slot="scope">
                  <el-button type="primary" size="small" @click="viewPlanDetail(scope.row.planId)">
                    <i class="el-icon-view"></i> 查看
                  </el-button>
                  <el-button type="info" size="small" @click="editPlan(scope.row.planId)" :disabled="scope.row.status !== '未开始'">
                    <i class="el-icon-edit"></i> 编辑
                  </el-button>
                  <el-button type="success" size="small" @click="assignPlan(scope.row.planId)" :disabled="scope.row.status !== '未开始'">
                    <i class="el-icon-link"></i> 分配
                  </el-button>
                  <el-button type="danger" size="small" @click="deletePlan(scope.row.planId)" :disabled="scope.row.status !== '未开始'">
                    <i class="el-icon-delete"></i> 删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="实时训练监测" name="monitor">
          <div class="tab-content">
            <div class="monitor-header">
              <el-select
                v-model="selectedPlan"
                placeholder="选择训练计划"
                style="width: 200px; margin-right: 10px;"
              >
                <el-option
                  v-for="plan in activeTrainingPlans"
                  :key="plan.planId"
                  :label="plan.planName"
                  :value="plan.planId"
                ></el-option>
              </el-select>
              
              <el-button type="primary" @click="refreshMonitoringData">
                <i class="el-icon-refresh"></i> 刷新数据
              </el-button>
            </div>
            
            <!-- 训练概览 -->
            <el-row :gutter="20" class="monitor-overview">
              <el-col :xs="24" :sm="24" :md="6" :lg="6">
                <el-card shadow="hover" class="overview-card">
                  <div class="overview-content">
                    <div class="overview-icon primary">
                      <i class="el-icon-user"></i>
                    </div>
                    <div class="overview-info">
                      <div class="overview-title">参与学生</div>
                      <div class="overview-value">{{ monitoringStats.totalStudents }}</div>
                      <div class="overview-subtitle">
                        <span class="text-success">{{ monitoringStats.activeStudents }}</span> 人正在训练
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              
              <el-col :xs="24" :sm="24" :md="6" :lg="6">
                <el-card shadow="hover" class="overview-card">
                  <div class="overview-content">
                    <div class="overview-icon success">
                      <i class="el-icon-data-line"></i>
                    </div>
                    <div class="overview-info">
                      <div class="overview-title">平均心率</div>
                      <div class="overview-value">{{ monitoringStats.avgHeartRate }} bpm</div>
                      <div class="overview-subtitle">
                        <el-progress :percentage="getHeartRatePercentage(monitoringStats.avgHeartRate)" :show-text="false" :stroke-width="8" size="small"></el-progress>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              
              <el-col :xs="24" :sm="24" :md="6" :lg="6">
                <el-card shadow="hover" class="overview-card">
                  <div class="overview-content">
                    <div class="overview-icon warning">
                      <i class="el-icon-time"></i>
                    </div>
                    <div class="overview-info">
                      <div class="overview-title">平均时长</div>
                      <div class="overview-value">{{ monitoringStats.avgDuration }} 分钟</div>
                      <div class="overview-subtitle">目标时长：{{ currentPlan?.targetDuration }} 分钟</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              
              <el-col :xs="24" :sm="24" :md="6" :lg="6">
                <el-card shadow="hover" class="overview-card">
                  <div class="overview-content">
                    <div class="overview-icon danger">
                      <i class="el-icon-warning"></i>
                    </div>
                    <div class="overview-info">
                      <div class="overview-title">异常提醒</div>
                      <div class="overview-value">{{ monitoringStats.alerts }}</div>
                      <div class="overview-subtitle">
                        <span class="text-danger">{{ monitoringStats.criticalAlerts }}</span> 个紧急提醒
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
            
            <!-- 实时监测表格 -->
            <el-table
              :data="studentTrainingData"
              border
              stripe
              style="width: 100%"
              height="500"
            >
              <el-table-column prop="studentName" label="姓名" width="100" align="center"></el-table-column>
              <el-table-column prop="studentId" label="学号" width="150" align="center"></el-table-column>
              <el-table-column prop="status" label="状态" width="100" align="center">
                <template v-slot="scope">
                  <el-tag :type="scope.row.status === '正在训练' ? 'success' : 'warning'">
                    {{ scope.row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="heartRate" label="心率" width="100" align="center">
                <template v-slot="scope">
                  <el-tag :type="getHeartRateTagType(scope.row.heartRate)">
                    {{ scope.row.heartRate }} bpm
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="bloodOxygen" label="血氧" width="100" align="center">
                <template v-slot="scope">
                  <el-tag :type="scope.row.bloodOxygen < 95 ? 'danger' : 'success'">
                    {{ scope.row.bloodOxygen }}%
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="duration" label="训练时长" width="120" align="center">
                <template v-slot="scope">
                  <div class="progress-container">
                    <el-progress
                      :percentage="(scope.row.duration / (currentPlan?.targetDuration || 60)) * 100"
                      :color="getDurationColor(scope.row.duration, currentPlan?.targetDuration)"
                      :show-text="false"
                      :stroke-width="10"
                      size="small"
                    ></el-progress>
                    <span class="duration-text">{{ scope.row.duration }}/{{ currentPlan?.targetDuration }} 分钟</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="fatigueLevel" label="疲劳度" width="100" align="center">
                <template v-slot="scope">
                  <el-progress
                    :percentage="scope.row.fatigueLevel"
                    :color="getFatigueColor(scope.row.fatigueLevel)"
                    :show-text="true"
                    size="small"
                  ></el-progress>
                </template>
              </el-table-column>
              <el-table-column prop="recoveryStatus" label="恢复状态" width="120" align="center">
                <template v-slot="scope">
                  <el-tag :type="getRecoveryStatusType(scope.row.recoveryStatus)">
                    {{ scope.row.recoveryStatus }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150" align="center">
                <template v-slot="scope">
                  <el-button type="primary" size="small" @click="viewStudentTrainingDetail(scope.row.studentId)">
                    <i class="el-icon-view"></i> 详情
                  </el-button>
                  <el-button type="warning" size="small" @click="sendReminder(scope.row.studentId)">
                    <i class="el-icon-message"></i> 提醒
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="训练模板库" name="templates">
          <div class="tab-content">
            <div class="templates-header">
              <el-button type="primary" @click="showAddTemplateDialog">
                <i class="el-icon-plus"></i> 新建模板
              </el-button>
              <el-input
                v-model="templateSearchQuery"
                placeholder="搜索模板"
                style="width: 200px; margin-left: 10px;"
              >
                <i slot="prefix" class="el-input__icon el-icon-search"></i>
              </el-input>
            </div>
            
            <div class="templates-grid">
              <el-card
                v-for="template in filteredTemplates"
                :key="template.templateId"
                shadow="hover"
                class="template-card"
              >
                <div class="template-header">
                  <h3 class="template-name">{{ template.templateName }}</h3>
                  <el-tag :type="getTrainingTypeColor(template.trainingType)">
                    {{ template.trainingType }}
                  </el-tag>
                </div>
                
                <div class="template-info">
                  <div class="info-item">
                    <i class="el-icon-time"></i> 时长：{{ template.duration }}分钟
                  </div>
                  <div class="info-item">
                    <i class="el-icon-fire"></i> 强度：{{ template.intensity }}
                  </div>
                  <div class="info-item">
                    <i class="el-icon-user"></i> 适用年级：{{ template.targetGrade }}
                  </div>
                  <div class="info-item">
                    <i class="el-icon-document"></i> 描述：{{ template.description }}
                  </div>
                </div>
                
                <div class="template-actions">
                  <el-button type="primary" size="small" @click="useTemplate(template.templateId)">
                    <i class="el-icon-check"></i> 使用模板
                  </el-button>
                  <el-button type="info" size="small" @click="viewTemplateDetail(template.templateId)">
                    <i class="el-icon-view"></i> 查看
                  </el-button>
                  <el-button type="danger" size="small" @click="deleteTemplate(template.templateId)">
                    <i class="el-icon-delete"></i> 删除
                  </el-button>
                </div>
              </el-card>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 新建训练计划对话框 -->
    <el-dialog
      title="新建训练计划"
      :visible.sync="addPlanDialogVisible"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="newPlanForm" :rules="newPlanRules" ref="newPlanForm" label-width="100px">
        <el-form-item label="计划名称" prop="planName">
          <el-input v-model="newPlanForm.planName" placeholder="请输入训练计划名称"></el-input>
        </el-form-item>
        
        <el-form-item label="训练类型" prop="trainingType">
          <el-select v-model="newPlanForm.trainingType" placeholder="请选择训练类型">
            <el-option label="有氧运动" value="有氧运动"></el-option>
            <el-option label="无氧运动" value="无氧运动"></el-option>
            <el-option label="力量训练" value="力量训练"></el-option>
            <el-option label="耐力训练" value="耐力训练"></el-option>
            <el-option label="柔韧性训练" value="柔韧性训练"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="目标时长" prop="targetDuration">
          <el-input-number v-model="newPlanForm.targetDuration" :min="1" :max="180" :step="5" placeholder="分钟"></el-input-number>
        </el-form-item>
        
        <el-form-item label="目标强度" prop="targetIntensity">
          <el-select v-model="newPlanForm.targetIntensity" placeholder="请选择目标强度">
            <el-option label="低强度" value="低强度"></el-option>
            <el-option label="中强度" value="中强度"></el-option>
            <el-option label="高强度" value="高强度"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker
            v-model="newPlanForm.startDate"
            type="date"
            placeholder="选择开始日期"
            value-format="yyyy-MM-dd"
          ></el-date-picker>
        </el-form-item>
        
        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker
            v-model="newPlanForm.endDate"
            type="date"
            placeholder="选择结束日期"
            value-format="yyyy-MM-dd"
          ></el-date-picker>
        </el-form-item>
        
        <el-form-item label="参与学生" prop="selectedStudents">
          <el-select
            v-model="newPlanForm.selectedStudents"
            multiple
            placeholder="请选择参与学生"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="student in studentOptions"
              :key="student.studentId"
              :label="student.name"
              :value="student.studentId"
            ></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="计划描述" prop="description">
          <el-input v-model="newPlanForm.description" type="textarea" rows="3" placeholder="请输入训练计划描述"></el-input>
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="addPlanDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitNewPlan">创建计划</el-button>
      </div>
    </el-dialog>
    
    <!-- 新建训练模板对话框 -->
    <el-dialog
      title="新建训练模板"
      :visible.sync="addTemplateDialogVisible"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="newTemplateForm" :rules="newTemplateRules" ref="newTemplateForm" label-width="100px">
        <el-form-item label="模板名称" prop="templateName">
          <el-input v-model="newTemplateForm.templateName" placeholder="请输入训练模板名称"></el-input>
        </el-form-item>
        
        <el-form-item label="训练类型" prop="trainingType">
          <el-select v-model="newTemplateForm.trainingType" placeholder="请选择训练类型">
            <el-option label="有氧运动" value="有氧运动"></el-option>
            <el-option label="无氧运动" value="无氧运动"></el-option>
            <el-option label="力量训练" value="力量训练"></el-option>
            <el-option label="耐力训练" value="耐力训练"></el-option>
            <el-option label="柔韧性训练" value="柔韧性训练"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="训练时长" prop="duration">
          <el-input-number v-model="newTemplateForm.duration" :min="1" :max="180" :step="5" placeholder="分钟"></el-input-number>
        </el-form-item>
        
        <el-form-item label="训练强度" prop="intensity">
          <el-select v-model="newTemplateForm.intensity" placeholder="请选择训练强度">
            <el-option label="低强度" value="低强度"></el-option>
            <el-option label="中强度" value="中强度"></el-option>
            <el-option label="高强度" value="高强度"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="适用年级" prop="targetGrade">
          <el-input v-model="newTemplateForm.targetGrade" placeholder="如：高一、高二"></el-input>
        </el-form-item>
        
        <el-form-item label="模板描述" prop="description">
          <el-input v-model="newTemplateForm.description" type="textarea" rows="3" placeholder="请输入训练模板描述"></el-input>
        </el-form-item>
        
        <el-form-item label="训练内容" prop="content">
          <el-input v-model="newTemplateForm.content" type="textarea" rows="5" placeholder="请输入详细训练内容"></el-input>
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="addTemplateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitNewTemplate">创建模板</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'TeacherTrainingModule',
  data() {
    return {
      userInfo: {
        name: '李老师',
        className: '高一1班',
        teacherId: 'Teacher101'
      },
      activeTab: 'plans',
      // 训练计划数据
      trainingPlans: [
        {
          planId: 'P001',
          planName: '高一1班晨跑计划',
          trainingType: '有氧运动',
          targetDuration: 30,
          targetIntensity: '中强度',
          startDate: '2023-11-01',
          endDate: '2023-11-30',
          status: '进行中',
          students: ['2023423320102', '2023423320103', '2023423320104', '2023423320105', '2023423320106'],
          description: '高一1班每周一至周五晨跑训练计划'
        },
        {
          planId: 'P002',
          planName: '800米训练计划',
          trainingType: '耐力训练',
          targetDuration: 45,
          targetIntensity: '高强度',
          startDate: '2023-11-15',
          endDate: '2023-12-15',
          status: '进行中',
          students: ['2023423320102', '2023423320103', '2023423320104', '2023423320105', '2023423320106'],
          description: '针对800米测试的专项训练计划'
        },
        {
          planId: 'P003',
          planName: '力量训练计划',
          trainingType: '力量训练',
          targetDuration: 60,
          targetIntensity: '高强度',
          startDate: '2023-12-01',
          endDate: '2023-12-31',
          status: '未开始',
          students: ['2023423320102', '2023423320103', '2023423320104', '2023423320105', '2023423320106'],
          description: '提升学生力量素质的训练计划'
        }
      ],
      // 学生选项
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
      // 训练模板数据
      trainingTemplates: [
        {
          templateId: 'T001',
          templateName: '标准晨跑模板',
          trainingType: '有氧运动',
          duration: 30,
          intensity: '中强度',
          targetGrade: '高一至高三',
          description: '适合日常晨跑训练的标准模板',
          content: '1. 热身运动：5分钟\n2. 匀速跑步：20分钟\n3. 放松运动：5分钟'
        },
        {
          templateId: 'T002',
          templateName: '800米专项训练',
          trainingType: '耐力训练',
          duration: 45,
          intensity: '高强度',
          targetGrade: '高一至高三',
          description: '针对800米测试的专项训练模板',
          content: '1. 热身运动：10分钟\n2. 间歇跑训练：3组×400米\n3. 速度训练：2组×200米\n4. 放松运动：10分钟'
        },
        {
          templateId: 'T003',
          templateName: '力量训练基础模板',
          trainingType: '力量训练',
          duration: 60,
          intensity: '高强度',
          targetGrade: '高二至高三',
          description: '提升基础力量的训练模板',
          content: '1. 热身运动：10分钟\n2. 上肢训练：20分钟\n3. 下肢训练：20分钟\n4. 核心训练：10分钟'
        }
      ],
      // 实时监测数据
      selectedPlan: '',
      monitoringStats: {
        totalStudents: 30,
        activeStudents: 25,
        avgHeartRate: 135,
        avgDuration: 18,
        alerts: 3,
        criticalAlerts: 1
      },
      studentTrainingData: [
        { studentId: '2023423320102', studentName: '曹睿焜', status: '正在训练', heartRate: 145, bloodOxygen: 98, duration: 20, fatigueLevel: 45, recoveryStatus: '良好' },
        { studentId: '2023423320103', studentName: '张小明', status: '正在训练', heartRate: 138, bloodOxygen: 97, duration: 18, fatigueLevel: 40, recoveryStatus: '良好' },
        { studentId: '2023423320104', studentName: '王小红', status: '正在训练', heartRate: 142, bloodOxygen: 96, duration: 22, fatigueLevel: 50, recoveryStatus: '一般' },
        { studentId: '2023423320105', studentName: '赵小刚', status: '正在训练', heartRate: 135, bloodOxygen: 98, duration: 15, fatigueLevel: 35, recoveryStatus: '良好' },
        { studentId: '2023423320106', studentName: '李小丽', status: '正在训练', heartRate: 148, bloodOxygen: 95, duration: 19, fatigueLevel: 55, recoveryStatus: '一般' },
        { studentId: '2023423320107', studentName: '陈小强', status: '休息中', heartRate: 85, bloodOxygen: 99, duration: 12, fatigueLevel: 65, recoveryStatus: '需要休息' }
      ],
      // 对话框状态
      addPlanDialogVisible: false,
      addTemplateDialogVisible: false,
      // 表单数据
      newPlanForm: {
        planName: '',
        trainingType: '',
        targetDuration: 30,
        targetIntensity: '中强度',
        startDate: '',
        endDate: '',
        selectedStudents: [],
        description: ''
      },
      newPlanRules: {
        planName: [
          { required: true, message: '请输入计划名称', trigger: 'blur' }
        ],
        trainingType: [
          { required: true, message: '请选择训练类型', trigger: 'change' }
        ],
        targetDuration: [
          { required: true, message: '请输入目标时长', trigger: 'change' }
        ],
        targetIntensity: [
          { required: true, message: '请选择目标强度', trigger: 'change' }
        ],
        startDate: [
          { required: true, message: '请选择开始日期', trigger: 'change' }
        ],
        endDate: [
          { required: true, message: '请选择结束日期', trigger: 'change' }
        ],
        selectedStudents: [
          { required: true, message: '请选择参与学生', trigger: 'change' }
        ]
      },
      newTemplateForm: {
        templateName: '',
        trainingType: '',
        duration: 30,
        intensity: '中强度',
        targetGrade: '',
        description: '',
        content: ''
      },
      newTemplateRules: {
        templateName: [
          { required: true, message: '请输入模板名称', trigger: 'blur' }
        ],
        trainingType: [
          { required: true, message: '请选择训练类型', trigger: 'change' }
        ],
        duration: [
          { required: true, message: '请输入训练时长', trigger: 'change' }
        ],
        intensity: [
          { required: true, message: '请选择训练强度', trigger: 'change' }
        ],
        targetGrade: [
          { required: true, message: '请输入适用年级', trigger: 'blur' }
        ],
        description: [
          { required: true, message: '请输入模板描述', trigger: 'blur' }
        ],
        content: [
          { required: true, message: '请输入训练内容', trigger: 'blur' }
        ]
      },
      // 搜索和筛选
      templateSearchQuery: ''
    };
  },
  computed: {
    activeTrainingPlans() {
      return this.trainingPlans.filter(plan => plan.status === '进行中');
    },
    filteredTemplates() {
      if (!this.templateSearchQuery) {
        return this.trainingTemplates;
      }
      const query = this.templateSearchQuery.toLowerCase();
      return this.trainingTemplates.filter(template => 
        template.templateName.toLowerCase().includes(query) ||
        template.trainingType.toLowerCase().includes(query) ||
        template.targetGrade.toLowerCase().includes(query)
      );
    },
    currentPlan() {
      if (!this.selectedPlan) return null;
      return this.trainingPlans.find(plan => plan.planId === this.selectedPlan);
    }
  },
  mounted() {
    // 默认选择第一个进行中的训练计划
    if (this.activeTrainingPlans.length > 0) {
      this.selectedPlan = this.activeTrainingPlans[0].planId;
    }
    
    // 开始定时刷新监测数据
    this.startMonitoringRefresh();
  },
  beforeDestroy() {
    // 清除定时器
    if (this.monitoringRefreshInterval) {
      clearInterval(this.monitoringRefreshInterval);
    }
  },
  methods: {
    // 开始定时刷新监测数据
    startMonitoringRefresh() {
      this.monitoringRefreshInterval = setInterval(() => {
        if (this.activeTab === 'monitor' && this.selectedPlan) {
          this.refreshMonitoringData();
        }
      }, 10000); // 每10秒刷新一次
    },
    
    // 刷新监测数据
    refreshMonitoringData() {
      // 模拟数据刷新
      this.studentTrainingData.forEach(student => {
        if (student.status === '正在训练') {
          // 更新心率（模拟波动）
          student.heartRate = Math.max(120, Math.min(160, student.heartRate + Math.floor((Math.random() - 0.5) * 10)));
          // 更新训练时长
          student.duration += 1;
          // 更新疲劳度
          student.fatigueLevel = Math.min(100, student.fatigueLevel + Math.random() * 2);
          // 随机更新恢复状态
          if (Math.random() < 0.1) {
            const statuses = ['良好', '一般', '需要休息'];
            student.recoveryStatus = statuses[Math.floor(Math.random() * statuses.length)];
          }
        }
      });
      
      // 更新统计数据
      this.monitoringStats.avgHeartRate = Math.floor(
        this.studentTrainingData
          .filter(s => s.status === '正在训练')
          .reduce((sum, s) => sum + s.heartRate, 0) / this.studentTrainingData.length
      );
      
      this.monitoringStats.avgDuration = Math.floor(
        this.studentTrainingData
          .reduce((sum, s) => sum + s.duration, 0) / this.studentTrainingData.length
      );
      
      this.$message.success('监测数据已刷新');
    },
    
    // 获取训练类型颜色
    getTrainingTypeColor(type) {
      switch (type) {
        case '有氧运动': return 'primary';
        case '无氧运动': return 'success';
        case '耐力训练': return 'warning';
        case '力量训练': return 'danger';
        case '柔韧性训练': return 'info';
        default: return 'default';
      }
    },
    
    // 获取状态颜色
    getStatusColor(status) {
      switch (status) {
        case '未开始': return 'info';
        case '进行中': return 'success';
        case '已结束': return 'default';
        default: return 'default';
      }
    },
    
    // 获取强度值
    getIntensityValue(intensity) {
      switch (intensity) {
        case '低强度': return 30;
        case '中强度': return 60;
        case '高强度': return 90;
        default: return 0;
      }
    },
    
    // 获取强度颜色
    getIntensityColor(intensity) {
      switch (intensity) {
        case '低强度': return '#67C23A';
        case '中强度': return '#E6A23C';
        case '高强度': return '#F56C6C';
        default: return '#909399';
      }
    },
    
    // 获取心率百分比
    getHeartRatePercentage(heartRate) {
      return Math.min(100, Math.max(0, ((heartRate - 60) / 140) * 100));
    },
    
    // 获取心率标签类型
    getHeartRateTagType(heartRate) {
      if (heartRate < 120) return 'success';
      if (heartRate < 150) return 'warning';
      return 'danger';
    },
    
    // 获取时长颜色
    getDurationColor(duration, targetDuration) {
      const percentage = (duration / (targetDuration || 60)) * 100;
      if (percentage < 30) return '#67C23A';
      if (percentage < 70) return '#E6A23C';
      return '#F56C6C';
    },
    
    // 获取疲劳度颜色
    getFatigueColor(fatigue) {
      if (fatigue < 30) return '#67C23A';
      if (fatigue < 60) return '#E6A23C';
      return '#F56C6C';
    },
    
    // 获取恢复状态类型
    getRecoveryStatusType(status) {
      switch (status) {
        case '良好': return 'success';
        case '一般': return 'warning';
        case '需要休息': return 'danger';
        default: return 'default';
      }
    },
    
    // 计划管理操作
    showAddPlanDialog() {
      this.newPlanForm = {
        planName: '',
        trainingType: '',
        targetDuration: 30,
        targetIntensity: '中强度',
        startDate: '',
        endDate: '',
        selectedStudents: [],
        description: ''
      };
      this.addPlanDialogVisible = true;
    },
    
    submitNewPlan() {
      this.$refs.newPlanForm.validate((valid) => {
        if (valid) {
          // 检查日期范围
          if (new Date(this.newPlanForm.startDate) > new Date(this.newPlanForm.endDate)) {
            this.$message.error('结束日期不能早于开始日期');
            return;
          }
          
          // 创建新计划
          const newPlan = {
            planId: `P${String(this.trainingPlans.length + 1).padStart(3, '0')}`,
            planName: this.newPlanForm.planName,
            trainingType: this.newPlanForm.trainingType,
            targetDuration: this.newPlanForm.targetDuration,
            targetIntensity: this.newPlanForm.targetIntensity,
            startDate: this.newPlanForm.startDate,
            endDate: this.newPlanForm.endDate,
            status: '未开始',
            students: this.newPlanForm.selectedStudents,
            description: this.newPlanForm.description
          };
          
          this.trainingPlans.push(newPlan);
          this.addPlanDialogVisible = false;
          this.$message.success('训练计划创建成功');
        }
      });
    },
    
    viewPlanDetail(planId) {
      this.$message.info('查看计划详情功能开发中');
    },
    
    editPlan(planId) {
      this.$message.info('编辑计划功能开发中');
    },
    
    assignPlan(planId) {
      this.$message.info('分配计划功能开发中');
    },
    
    deletePlan(planId) {
      this.$confirm(`确定要删除该训练计划吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = this.trainingPlans.findIndex(plan => plan.planId === planId);
        if (index !== -1) {
          this.trainingPlans.splice(index, 1);
          this.$message.success('训练计划删除成功');
        }
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    },
    
    importTrainingTemplate() {
      this.$message.info('导入训练模板功能开发中');
    },
    
    exportTrainingTemplate() {
      this.$message.info('导出训练模板功能开发中');
    },
    
    // 监测操作
    viewStudentTrainingDetail(studentId) {
      this.$message.info('查看学生训练详情功能开发中');
    },
    
    sendReminder(studentId) {
      this.$message.success('提醒已发送');
    },
    
    // 模板管理操作
    showAddTemplateDialog() {
      this.newTemplateForm = {
        templateName: '',
        trainingType: '',
        duration: 30,
        intensity: '中强度',
        targetGrade: '',
        description: '',
        content: ''
      };
      this.addTemplateDialogVisible = true;
    },
    
    submitNewTemplate() {
      this.$refs.newTemplateForm.validate((valid) => {
        if (valid) {
          // 创建新模板
          const newTemplate = {
            templateId: `T${String(this.trainingTemplates.length + 1).padStart(3, '0')}`,
            templateName: this.newTemplateForm.templateName,
            trainingType: this.newTemplateForm.trainingType,
            duration: this.newTemplateForm.duration,
            intensity: this.newTemplateForm.intensity,
            targetGrade: this.newTemplateForm.targetGrade,
            description: this.newTemplateForm.description,
            content: this.newTemplateForm.content
          };
          
          this.trainingTemplates.push(newTemplate);
          this.addTemplateDialogVisible = false;
          this.$message.success('训练模板创建成功');
        }
      });
    },
    
    useTemplate(templateId) {
      // 使用模板创建计划
      const template = this.trainingTemplates.find(t => t.templateId === templateId);
      if (template) {
        this.newPlanForm = {
          planName: `${this.userInfo.className} - ${template.templateName}`,
          trainingType: template.trainingType,
          targetDuration: template.duration,
          targetIntensity: template.intensity,
          startDate: '',
          endDate: '',
          selectedStudents: [],
          description: template.description
        };
        this.addPlanDialogVisible = true;
      }
    },
    
    viewTemplateDetail(templateId) {
      this.$message.info('查看模板详情功能开发中');
    },
    
    deleteTemplate(templateId) {
      this.$confirm(`确定要删除该训练模板吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = this.trainingTemplates.findIndex(template => template.templateId === templateId);
        if (index !== -1) {
          this.trainingTemplates.splice(index, 1);
          this.$message.success('训练模板删除成功');
        }
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    }
  }
};
</script>

<style scoped>
.teacher-training-module {
  padding: 24px;
  min-height: calc(100vh - 100px);
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
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

.back-btn {
  margin-bottom: 10px;
  color: #1890ff;
}

.back-btn:hover {
  color: #40a9ff;
  background-color: rgba(24, 144, 255, 0.1);
}

.tab-card {
  margin-bottom: 20px;
}

.tab-content {
  padding: 20px 0;
}

.plans-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 20px;
  gap: 10px;
}

.monitor-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 20px;
  gap: 10px;
}

.monitor-overview {
  margin-bottom: 20px;
}

.overview-card {
  height: 100%;
}

.overview-content {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.overview-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 20px;
}

.overview-icon.primary {
  background-color: rgba(96, 108, 255, 0.1);
  color: #606CFF;
}

.overview-icon.success {
  background-color: rgba(103, 194, 58, 0.1);
  color: #67C23A;
}

.overview-icon.warning {
  background-color: rgba(230, 162, 60, 0.1);
  color: #E6A23C;
}

.overview-icon.danger {
  background-color: rgba(245, 108, 108, 0.1);
  color: #F56C6C;
}

.overview-info {
  flex: 1;
}

.overview-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.overview-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 5px;
}

.overview-subtitle {
  font-size: 12px;
  color: #909399;
}

.progress-container {
  width: 100%;
}

.duration-text {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  color: #606266;
  text-align: center;
}

.intensity-text {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  color: #606266;
  text-align: center;
}

.templates-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 20px;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.template-card {
  height: 100%;
  transition: transform 0.3s;
}

.template-card:hover {
  transform: translateY(-5px);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.template-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.template-info {
  margin-bottom: 20px;
}

.info-item {
  margin-bottom: 10px;
  font-size: 14px;
  color: #606266;
  display: flex;
  align-items: center;
}

.info-item i {
  margin-right: 8px;
  color: #606CFF;
}

.template-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.dialog-footer {
  text-align: center;
}

.text-success {
  color: #67C23A;
}

.text-danger {
  color: #F56C6C;
}
</style>