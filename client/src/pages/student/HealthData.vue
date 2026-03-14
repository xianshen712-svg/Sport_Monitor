<template>
  <div class="health-data-page">
    <el-card shadow="hover" class="page-header">
      <h2>健康数据详情</h2>
      <p>实时监测您的身体状况</p>
    </el-card>
    
    <div class="health-data-content">
      
      <!-- 运动状况评估 -->
      <el-card shadow="hover" class="exercise-assessment-card">
        <div class="card-header">
          <h3>运动状况评估</h3>
        </div>
        <div class="assessment-grid">
          <div class="assessment-item">
            <span class="assessment-label">疲劳度</span>
            <div class="assessment-value">
              <el-progress
                :percentage="exerciseData.fatigueLevel || 0"
                :color="getProgressColor('fatigue', exerciseData.fatigueLevel || 0)"
                :show-text="true"
                :format="(percentage) => `${percentage}分`"
                class="assessment-progress"
              ></el-progress>
              <div class="assessment-desc">{{ getFatigueLabel(exerciseData.fatigueLevel || 0) }}</div>
            </div>
          </div>
          
          <div class="assessment-item">
            <span class="assessment-label">运动负荷</span>
            <div class="assessment-value">
              <el-progress
                :percentage="exerciseData.exerciseLoad || 0"
                :color="getProgressColor('load', exerciseData.exerciseLoad || 0)"
                :show-text="true"
                :format="(percentage) => `${percentage}分/日`"
                class="assessment-progress"
              ></el-progress>
              <div class="assessment-desc">{{ getLoadLabel(exerciseData.exerciseLoad || 0) }}</div>
            </div>
          </div>
          
          <div class="assessment-item">
            <span class="assessment-label">有氧训练压力</span>
            <div class="assessment-value">
              <el-progress
                :percentage="(exerciseData.aerobicStress || 0) / 5 * 100"
                :color="getProgressColor('aerobic', exerciseData.aerobicStress || 0)"
                :show-text="true"
                :format="(percentage) => `${exerciseData.aerobicStress || 0}/5分`"
                class="assessment-progress"
              ></el-progress>
              <div class="assessment-desc">{{ getAerobicLabel(exerciseData.aerobicStress || 0) }}</div>
            </div>
          </div>
          
          <div class="assessment-item">
            <span class="assessment-label">无氧训练压力</span>
            <div class="assessment-value">
              <el-progress
                :percentage="(exerciseData.anaerobicStress || 0) / 3 * 100"
                :color="getProgressColor('anaerobic', exerciseData.anaerobicStress || 0)"
                :show-text="true"
                :format="(percentage) => `${exerciseData.anaerobicStress || 0}/3分`"
                class="assessment-progress"
              ></el-progress>
              <div class="assessment-desc">{{ getAnaerobicLabel(exerciseData.anaerobicStress || 0) }}</div>
            </div>
          </div>
          
          <div class="assessment-item">
            <span class="assessment-label">恢复程度</span>
            <div class="assessment-value">
              <el-progress
                :percentage="exerciseData.recoveryLevel || 0"
                :color="getProgressColor('recovery', exerciseData.recoveryLevel || 0)"
                :show-text="true"
                class="assessment-progress"
              ></el-progress>
              <div class="assessment-desc">{{ getRecoveryLabel(exerciseData.recoveryLevel || 0) }}</div>
            </div>
          </div>
        </div>
      </el-card>
      
      <!-- 个性化建议 -->
      <el-card shadow="hover" class="suggestions-card">
        <div class="card-header">
          <h3>个性化运动建议</h3>
        </div>
        <div class="suggestions-content">
          <div class="suggestion-item" v-if="exerciseData.fatigueLevel > 60">
            <div class="suggestion-icon warning">
              <i class="el-icon-warning"></i>
            </div>
            <div class="suggestion-text">
              <h4>疲劳度警告</h4>
              <p>您的疲劳度较高，建议减少高强度运动，增加休息时间，保证充足睡眠。</p>
            </div>
          </div>
          
          <div class="suggestion-item" v-if="exerciseData.exerciseLoad < 30">
            <div class="suggestion-icon info">
              <i class="el-icon-info"></i>
            </div>
            <div class="suggestion-text">
              <h4>运动不足建议</h4>
              <p>今日运动负荷较低，建议增加30分钟以上的有氧运动，如快走、慢跑等。</p>
            </div>
          </div>
          
          <div class="suggestion-item" v-if="exerciseData.recoveryLevel < 50">
            <div class="suggestion-icon notice">
              <i class="el-icon-time"></i>
            </div>
            <div class="suggestion-text">
              <h4>恢复建议</h4>
              <p>身体恢复程度不足，建议进行15分钟的拉伸放松运动，促进身体恢复。</p>
            </div>
          </div>
          
          <div class="suggestion-item" v-if="healthData.heartRate && healthData.heartRate > 100">
            <div class="suggestion-icon warning">
              <i class="el-icon-warning"></i>
            </div>
            <div class="suggestion-text">
              <h4>心率警告</h4>
              <p>心率偏高，建议适当降低运动强度，保持呼吸平稳，避免过度劳累。</p>
            </div>
          </div>
          
          <div class="suggestion-item" v-if="healthData.bloodOxygen && healthData.bloodOxygen < 95">
            <div class="suggestion-icon warning">
              <i class="el-icon-warning"></i>
            </div>
            <div class="suggestion-text">
              <h4>血氧警告</h4>
              <p>血氧偏低，建议到空气流通的地方休息，必要时咨询医生。</p>
            </div>
          </div>
          
          <div class="suggestion-item" v-if="!exerciseData.fatigueLevel && !exerciseData.exerciseLoad && !exerciseData.recoveryLevel">
            <div class="suggestion-icon info">
              <i class="el-icon-data-line"></i>
            </div>
            <div class="suggestion-text">
              <h4>数据获取中</h4>
              <p>正在获取运动数据，请稍后查看建议。</p>
            </div>
          </div>
          
          <div class="suggestion-item" v-else-if="exerciseData.fatigueLevel <= 60 && exerciseData.exerciseLoad >= 30 && exerciseData.recoveryLevel >= 50 && (!healthData.heartRate || healthData.heartRate <= 100) && (!healthData.bloodOxygen || healthData.bloodOxygen >= 95)">
            <div class="suggestion-icon success">
              <i class="el-icon-success"></i>
            </div>
            <div class="suggestion-text">
              <h4>状态良好</h4>
              <p>您的身体状态良好，可以继续保持当前运动强度和生活习惯。</p>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HealthData',
  data() {
    return {
      healthData: {
        heartRate: null,
        steps: null,
        bloodOxygen: null,
        bodyTemperature: null,
        bloodPressure: null,
        bloodSugar: null
      },
      exerciseData: {
        fatigueLevel: null,
        exerciseLoad: null,
        aerobicStress: null,
        anaerobicStress: null,
        recoveryLevel: null
      },
      lastUpdateTime: null,
      updateInterval: null
    };
  },
  mounted() {
    // 获取初始数据
    this.fetchUserData();
    // 设置定时更新
    this.updateInterval = setInterval(() => {
      this.fetchUserData();
    }, 10000); // 每10秒更新一次
  },
  beforeDestroy() {
    // 清除定时器
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  },
  methods: {
    async fetchUserData() {
      try {
        console.log('开始获取HealthData页面数据...');
        
        // 获取用户实时健康数据
        const healthResponse = await this.$axios.get('/api/device-data/user/realtime');
        console.log('实时健康数据响应:', healthResponse.data);
        
        if (healthResponse.data.success) {
          this.healthData = healthResponse.data.data;
          console.log('设置healthData:', this.healthData);
        } else {
          // 如果API返回失败，使用默认值
          this.healthData = {
            heartRate: null,
            steps: null,
            bloodOxygen: null,
            bodyTemperature: null,
            bloodPressure: null,
            bloodSugar: null
          };
          console.log('使用默认healthData');
        }
        
        // 获取用户运动状况数据
        const today = new Date().toISOString().split('T')[0];
        console.log('请求历史数据，日期:', today);
        
        const exerciseResponse = await this.$axios.get('/api/device-data/user/history', {
          params: { date: today }
        });
        console.log('历史数据响应:', exerciseResponse.data);
        
        if (exerciseResponse.data.success && exerciseResponse.data.data.length > 0) {
          const latestData = exerciseResponse.data.data[exerciseResponse.data.data.length - 1];
          console.log('最新历史数据:', latestData);
          
          this.exerciseData = {
            fatigueLevel: latestData.fatigue_level || 0,
            exerciseLoad: latestData.exercise_load || 0,
            aerobicStress: latestData.aerobic_stress || 0,
            anaerobicStress: latestData.anaerobic_stress || 0,
            recoveryLevel: latestData.recovery_level || 0
          };
          console.log('设置exerciseData:', this.exerciseData);
        } else {
          // 如果没有数据，使用默认值
          this.exerciseData = {
            fatigueLevel: 50, // 默认值，避免显示0
            exerciseLoad: 50,
            aerobicStress: 2,
            anaerobicStress: 1,
            recoveryLevel: 50
          };
          console.log('使用默认exerciseData:', this.exerciseData);
        }
        
        this.lastUpdateTime = new Date().toLocaleTimeString();
        console.log('数据获取完成，更新时间:', this.lastUpdateTime);
      } catch (error) {
        console.error('获取用户数据错误:', error);
        // 出错时使用默认值
        this.healthData = {
          heartRate: null,
          steps: null,
          bloodOxygen: null,
          bodyTemperature: null,
          bloodPressure: null,
          bloodSugar: null
        };
        this.exerciseData = {
          fatigueLevel: 50,
          exerciseLoad: 50,
          aerobicStress: 2,
          anaerobicStress: 1,
          recoveryLevel: 50
        };
        console.log('出错后使用默认值');
      }
    },
    refreshData() {
      this.fetchUserData();
      this.$message.success('数据已刷新');
    },
    getProgressColor(type, value) {
      // 根据不同指标类型和值返回颜色
      switch (type) {
        case 'fatigue':
          if (value <= 30) return '#67C23A';
          if (value <= 60) return '#E6A23C';
          return '#F56C6C';
        case 'load':
          if (value <= 30) return '#67C23A';
          if (value <= 60) return '#E6A23C';
          return '#F56C6C';
        case 'aerobic':
          if (value <= 2) return '#67C23A';
          if (value <= 4) return '#E6A23C';
          return '#F56C6C';
        case 'anaerobic':
          if (value <= 1) return '#67C23A';
          if (value <= 2) return '#E6A23C';
          return '#F56C6C';
        case 'recovery':
          if (value <= 30) return '#F56C6C';
          if (value <= 70) return '#E6A23C';
          return '#67C23A';
        default:
          return '#409EFF';
      }
    },
    getFatigueLabel(level) {
      if (level <= 30) return '低疲劳度';
      if (level <= 60) return '中等疲劳度';
      return '高疲劳度';
    },
    getLoadLabel(level) {
      if (level <= 30) return '低运动负荷';
      if (level <= 60) return '中等运动负荷';
      return '高运动负荷';
    },
    getAerobicLabel(level) {
      if (level <= 2) return '低有氧压力';
      if (level <= 4) return '中等有氧压力';
      return '高有氧压力';
    },
    getAnaerobicLabel(level) {
      if (level <= 1) return '低无氧压力';
      if (level <= 2) return '中等无氧压力';
      return '高无氧压力';
    },
    getRecoveryLabel(level) {
      if (level <= 30) return '恢复不足';
      if (level <= 70) return '部分恢复';
      return '完全恢复';
    }
  }
};
</script>

<style scoped>
.health-data-page {
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

.health-data-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.data-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.data-label {
  font-size: 14px;
  color: #606266;
}

.data-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.unit {
  font-size: 14px;
  font-weight: normal;
  color: #606266;
}

.update-info {
  text-align: right;
  font-size: 12px;
  color: #909399;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.assessment-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.assessment-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.assessment-label {
  font-size: 14px;
  color: #606266;
}

.assessment-progress {
  margin-bottom: 5px;
}

.assessment-desc {
  font-size: 12px;
  color: #909399;
}

.suggestions-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.suggestion-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.suggestion-item:hover {
  background-color: #ecf5ff;
}

.suggestion-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.suggestion-icon.success {
  background-color: rgba(103, 194, 58, 0.1);
  color: #67C23A;
}

.suggestion-icon.warning {
  background-color: rgba(230, 162, 60, 0.1);
  color: #E6A23C;
}

.suggestion-icon.info {
  background-color: rgba(64, 158, 255, 0.1);
  color: #409EFF;
}

.suggestion-icon.notice {
  background-color: rgba(144, 147, 153, 0.1);
  color: #909399;
}

.suggestion-text h4 {
  margin: 0 0 5px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.suggestion-text p {
  margin: 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.5;
}
</style>
