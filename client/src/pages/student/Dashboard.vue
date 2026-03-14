<template>
  <div class="student-dashboard">
    <alert-notification></alert-notification>
    <el-card shadow="hover" class="welcome-card">
      <div class="user-info-container">
        <div class="avatar-container">
          <el-upload
            class="avatar-uploader"
            action="/api/users/avatar"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="userInfo.avatar" :src="userInfo.avatar" class="avatar">
            <i v-else class="el-icon-plus avatar-uploader-icon"></i>
          </el-upload>
        </div>
        <div class="welcome-text">
          <h2>欢迎回来，{{ userInfo.name }}同学</h2>
          <p>以下是您的实时健康数据和运动状况</p>
        </div>
      </div>
    </el-card>
    
    <div class="dashboard-content">
      <!-- 实时健康数据卡片 -->
      <div class="health-data-section">
        <h3 class="section-title">实时健康数据</h3>
        <div class="data-cards">
          <el-card shadow="hover" class="data-card" :class="{ 'abnormal': healthData.heartRate && (healthData.heartRate < 60 || healthData.heartRate > 120) }">
            <div class="card-header">
              <span class="card-title">心率</span>
              <el-tag :type="healthData.heartRate && (healthData.heartRate < 60 || healthData.heartRate > 120) ? 'danger' : 'success'" size="small">
                {{ healthData.heartRate ? (healthData.heartRate < 60 || healthData.heartRate > 120 ? '异常' : '正常') : '无数据' }}
              </el-tag>
            </div>
            <div class="card-value">{{ healthData.heartRate || '--' }} <span class="unit">次/分钟</span></div>
          </el-card>
          
          <el-card shadow="hover" class="data-card" :class="{ 'abnormal': healthData.bloodOxygen && healthData.bloodOxygen < 95 }">
            <div class="card-header">
              <span class="card-title">血氧</span>
              <el-tag :type="healthData.bloodOxygen && healthData.bloodOxygen < 95 ? 'danger' : 'success'" size="small">
                {{ healthData.bloodOxygen ? (healthData.bloodOxygen < 95 ? '异常' : '正常') : '无数据' }}
              </el-tag>
            </div>
            <div class="card-value">{{ healthData.bloodOxygen || '--' }} <span class="unit">%</span></div>
          </el-card>
          
          <el-card shadow="hover" class="data-card" :class="{ 'abnormal': healthData.bodyTemperature && (healthData.bodyTemperature < 36 || healthData.bodyTemperature > 37.3) }">
            <div class="card-header">
              <span class="card-title">体温</span>
              <el-tag :type="healthData.bodyTemperature && (healthData.bodyTemperature < 36 || healthData.bodyTemperature > 37.3) ? 'danger' : 'success'" size="small">
                {{ healthData.bodyTemperature ? (healthData.bodyTemperature < 36 || healthData.bodyTemperature > 37.3 ? '异常' : '正常') : '无数据' }}
              </el-tag>
            </div>
            <div class="card-value">{{ healthData.bodyTemperature || '--' }} <span class="unit">℃</span></div>
          </el-card>
          
          <el-card shadow="hover" class="data-card" :class="{ 'abnormal': healthData.bloodPressure && (healthData.bloodPressure.systolic > 140 || healthData.bloodPressure.diastolic > 90) }">
            <div class="card-header">
              <span class="card-title">血压</span>
              <el-tag :type="healthData.bloodPressure && (healthData.bloodPressure.systolic > 140 || healthData.bloodPressure.diastolic > 90) ? 'danger' : 'success'" size="small">
                {{ healthData.bloodPressure ? ((healthData.bloodPressure.systolic > 140 || healthData.bloodPressure.diastolic > 90) ? '异常' : '正常') : '无数据' }}
              </el-tag>
            </div>
            <div class="card-value">
              {{ healthData.bloodPressure ? healthData.bloodPressure.systolic : '--' }}/{{ healthData.bloodPressure ? healthData.bloodPressure.diastolic : '--' }} <span class="unit">mmHg</span>
            </div>
          </el-card>
          
          <el-card shadow="hover" class="data-card">
            <div class="card-header">
              <span class="card-title">血糖</span>
              <el-tag :type="healthData.bloodSugar && (healthData.bloodSugar < 4 || healthData.bloodSugar > 6) ? 'danger' : 'success'" size="small">
                {{ healthData.bloodSugar ? ((healthData.bloodSugar < 4 || healthData.bloodSugar > 6) ? '异常' : '正常') : '无数据' }}
              </el-tag>
            </div>
            <div class="card-value">{{ healthData.bloodSugar || '--' }} <span class="unit">mmol/L</span></div>
          </el-card>
          
          <el-card shadow="hover" class="data-card">
            <div class="card-header">
              <span class="card-title">步数</span>
              <el-tag type="info" size="small">今日</el-tag>
            </div>
            <div class="card-value">{{ healthData.steps || '--' }} <span class="unit">步</span></div>
          </el-card>
        </div>
      </div>
      
      <!-- 运动状况指标 -->
      <div class="exercise-status-section">
        <h3 class="section-title">运动状况评估</h3>
        <div class="status-cards">
          <el-card shadow="hover" class="status-card">
            <div class="card-header">
              <span class="card-title">疲劳度</span>
            </div>
            <div class="card-value">
              <el-progress
                :percentage="exerciseData.fatigueLevel || 0"
                :color="getProgressColor('fatigue', exerciseData.fatigueLevel || 0)"
                :show-text="true"
                :format="(percentage) => `${percentage}分`"
              ></el-progress>
              <div class="status-label">{{ getFatigueLabel(exerciseData.fatigueLevel || 0) }}</div>
            </div>
          </el-card>
          
          <el-card shadow="hover" class="status-card">
            <div class="card-header">
              <span class="card-title">运动负荷</span>
            </div>
            <div class="card-value">
              <el-progress
                :percentage="exerciseData.exerciseLoad || 0"
                :color="getProgressColor('load', exerciseData.exerciseLoad || 0)"
                :show-text="true"
                :format="(percentage) => `${percentage}分/日`"
              ></el-progress>
              <div class="status-label">{{ getLoadLabel(exerciseData.exerciseLoad || 0) }}</div>
            </div>
          </el-card>
          
          <el-card shadow="hover" class="status-card">
            <div class="card-header">
              <span class="card-title">有氧训练压力</span>
            </div>
            <div class="card-value">
              <el-progress
                :percentage="(exerciseData.aerobicStress || 0) / 5 * 100"
                :color="getProgressColor('aerobic', exerciseData.aerobicStress || 0)"
                :show-text="true"
                :format="(percentage) => `${exerciseData.aerobicStress || 0}/5分`"
              ></el-progress>
              <div class="status-label">{{ getAerobicLabel(exerciseData.aerobicStress || 0) }}</div>
            </div>
          </el-card>
          
          <el-card shadow="hover" class="status-card">
            <div class="card-header">
              <span class="card-title">恢复程度</span>
            </div>
            <div class="card-value">
              <el-progress
                :percentage="exerciseData.recoveryLevel || 0"
                :color="getProgressColor('recovery', exerciseData.recoveryLevel || 0)"
                :show-text="true"
              ></el-progress>
              <div class="status-label">{{ getRecoveryLabel(exerciseData.recoveryLevel || 0) }}</div>
            </div>
          </el-card>
        </div>
      </div>
      
      <!-- 个性化运动建议 -->
      <div class="recommendations-section">
        <h3 class="section-title">个性化运动建议</h3>
        <el-card shadow="hover" class="recommendation-card">
          <div class="recommendation-content">
            <h4>今日运动建议</h4>
            <ul>
              <li v-if="exerciseData.fatigueLevel > 60">
                <i class="el-icon-warning"></i> 您的疲劳度较高，建议减少高强度运动，增加休息时间
              </li>
              <li v-if="exerciseData.exerciseLoad < 30">
                <i class="el-icon-check"></i> 今日运动负荷较低，建议增加30分钟以上的有氧运动
              </li>
              <li v-if="exerciseData.recoveryLevel < 50">
                <i class="el-icon-time"></i> 身体恢复程度不足，建议进行15分钟的拉伸放松运动
              </li>
              <li v-if="healthData.heartRate && healthData.heartRate > 100">
                <i class="el-icon-info"></i> 心率偏高，建议适当降低运动强度，保持呼吸平稳
              </li>
              <li v-if="!exerciseData.fatigueLevel && !exerciseData.exerciseLoad && !exerciseData.recoveryLevel">
                <i class="el-icon-data-line"></i> 正在获取运动数据，请稍后查看建议
              </li>
              <li v-else-if="exerciseData.fatigueLevel <= 60 && exerciseData.exerciseLoad >= 30 && exerciseData.recoveryLevel >= 50 && (!healthData.heartRate || healthData.heartRate <= 100)">
                <i class="el-icon-success"></i> 您的身体状态良好，可以继续保持当前运动强度
              </li>
            </ul>
            <div class="recommendation-footer">
              <span>数据更新时间：{{ lastUpdateTime || '暂无' }}</span>
            </div>
          </div>
        </el-card>
      </div>
      
      <!-- 调试面板 -->
      <div class="debug-section" v-if="connectionError || connectionStatus !== 'connected'">
        <h3 class="section-title">系统连接状态</h3>
        <el-card shadow="hover" class="debug-card" :class="getConnectionStatusColor()">
          <div class="debug-content">
            <div class="connection-status">
              <el-alert
                :title="`WebSocket连接状态: ${getConnectionStatusText()}`"
                :type="getConnectionStatusColor() === 'danger' ? 'error' : getConnectionStatusColor()"
                :description="connectionError || '连接正常'"
                :closable="false"
                show-icon>
              </el-alert>
            </div>
            
            <div class="debug-actions">
              <el-button 
                type="primary" 
                size="small" 
                @click="testConnection"
                :loading="debugInfo.mqttStatus === 'checking'">
                测试MQTT连接
              </el-button>
              <el-button 
                type="success" 
                size="small" 
                @click="fetchUserData"
                :loading="debugInfo.lastApiCall && Date.now() - new Date(debugInfo.lastApiCall).getTime() < 5000">
                手动刷新数据
              </el-button>
              <el-button 
                type="info" 
                size="small" 
                @click="toggleDebugInfo">
                {{ showDebugInfo ? '隐藏调试信息' : '显示调试信息' }}
              </el-button>
            </div>
            
            <div class="debug-info" v-if="showDebugInfo">
              <h4>调试信息</h4>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="最后API调用">
                  {{ debugInfo.lastApiCall || '暂无' }}
                </el-descriptions-item>
                <el-descriptions-item label="最后WebSocket消息">
                  {{ debugInfo.lastWebSocketMessage ? debugInfo.lastWebSocketMessage.timestamp : '暂无' }}
                </el-descriptions-item>
                <el-descriptions-item label="MQTT状态">
                  {{ debugInfo.mqttStatus }}
                </el-descriptions-item>
                <el-descriptions-item label="当前心率数据">
                  {{ healthData.heartRate || '无数据' }}
                </el-descriptions-item>
                <el-descriptions-item label="数据源">
                  {{ debugInfo.lastWebSocketMessage ? '实时推送' : 'API轮询' }}
                </el-descriptions-item>
              </el-descriptions>
              
              <div class="debug-tips" v-if="connectionError">
                <h5>故障排除建议:</h5>
                <ul>
                  <li>1. 检查网络连接是否正常</li>
                  <li>2. 确认MQTT服务器是否运行</li>
                  <li>3. 检查设备是否已正确连接并发送数据</li>
                  <li>4. 查看服务器日志获取更多信息</li>
                </ul>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script>
import AlertNotification from '../../components/AlertNotification.vue';
import { alertService } from '../../services/AlertService';
import { useWebSocket } from '../../services/WebSocketService';

export default {
  name: 'StudentDashboard',
  components: { AlertNotification },
  data() {
    return {
      userInfo: JSON.parse(localStorage.getItem('user')) || {},
      healthData: {
        heartRate: null,
        steps: 0,
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
      updateInterval: null,
      // 心跳超时判断（关键）
      lastDataTime: null,
      connectionStatus: 'disconnected',
      connectionError: null,
      showDebugInfo: false,
      debugInfo: {
        lastWebSocketMessage: null,
        lastApiCall: null,
        mqttStatus: 'unknown'
      }
    };
  },
  mounted() {
    // 只监听 WebSocket，不读数据库！
    this.initWebSocket();

    // 每 1 秒检查是否超时断开
    this.updateInterval = setInterval(() => {
      this.checkConnectionTimeout();
    }, 1000);
  },
  beforeDestroy() {
    if (this.updateInterval) clearInterval(this.updateInterval);
    if (this.webSocketDisconnect) this.webSocketDisconnect();
  },
  methods: {
    initWebSocket() {
      const { connect, disconnect, subscribe, connectionStatus } = useWebSocket();
      connect();
      this.webSocketDisconnect = disconnect;

      subscribe('device_data', (data) => {
        console.log('✅ 收到设备实时数据:', data);
        this.debugInfo.lastWebSocketMessage = {
          timestamp: new Date().toISOString(),
          data: data
        };

        // 记录最后收到数据的时间
        this.lastDataTime = Date.now();

        // 更新数据（只认设备推送！）
        this.updateHealthDataFromWebSocket(data.data);
      });
    },

    // 检查设备是否超时断开（3 秒没数据就清空）
    checkConnectionTimeout() {
      if (!this.lastDataTime) return;
      const now = Date.now();
      const diff = now - this.lastDataTime;

      // 超过 3 秒没收到数据 → 判定断开
      if (diff > 3000) {
        console.log('❌ 设备已断开，清空数据');
        this.healthData = {
          heartRate: null,
          steps: null,
          bloodOxygen: null,
          bodyTemperature: null,
          bloodPressure: null,
          bloodSugar: null
        };
        this.lastDataTime = null;
      }
    },

    updateHealthDataFromWebSocket(deviceData) {
      this.healthData = {
        heartRate: deviceData.heartRate || deviceData.heart_rate || null,
        steps: deviceData.steps || 0,
        bloodOxygen: deviceData.bloodOxygen || deviceData.blood_oxygen || null,
        bodyTemperature: deviceData.bodyTemperature || deviceData.body_temperature || null,
        bloodPressure: deviceData.bloodPressure || null,
        bloodSugar: deviceData.bloodSugar || deviceData.blood_sugar || null
      };

      this.lastUpdateTime = new Date().toLocaleTimeString();
      this.checkHealthAlerts();
    },

    // 完全去掉 fetchUserData，不再读数据库！
    // 不再从接口拿历史数据，只看实时推送

    checkHealthAlerts() {
      const studentHealthData = {
        ...this.healthData,
        ...this.userInfo,
        fatigueLevel: this.exerciseData.fatigueLevel
      };
      alertService.checkStudentHealthData(studentHealthData);
    },

    handleAvatarSuccess(res, file) {
      if (res.success) {
        this.userInfo.avatar = res.data.avatarUrl;
        this.$message.success('头像上传成功');
      }
    },
    beforeAvatarUpload(file) {
      const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
      const isLt2M = file.size / 1024 / 1024 < 2;
      return isJPG && isLt2M;
    },
    toggleDebugInfo() { this.showDebugInfo = !this.showDebugInfo; },
    getConnectionStatusText() {
      return this.lastDataTime ? '已连接' : '未连接';
    },
    getConnectionStatusColor() {
      return this.lastDataTime ? 'success' : 'danger';
    },

    // 以下保留你原来的颜色、标签方法
    getProgressColor(type, value) {
      switch (type) {
        case 'fatigue': return value <=30?'#67C23A':value<=60?'#E6A23C':'#F56C6C';
        case 'load': return value <=30?'#67C23A':value<=60?'#E6A23C':'#F56C6C';
        case 'aerobic': return value <=2?'#67C23A':value<=4?'#E6A23C':'#F56C6C';
        case 'recovery': return value <=30?'#F56C6C':value<=70?'#E6A23C':'#67C23A';
        default: return '#409EFF';
      }
    },
    getFatigueLabel(level) {
      return level<=30?'低疲劳度':level<=60?'中等疲劳度':'高疲劳度';
    },
    getLoadLabel(level) {
      return level<=30?'低运动负荷':level<=60?'中等运动负荷':'高运动负荷';
    },
    getAerobicLabel(level) {
      return level<=2?'低有氧压力':level<=4?'中等有氧压力':'高有氧压力';
    },
    getRecoveryLabel(level) {
      return level<=30?'恢复不足':level<=70?'部分恢复':'完全恢复';
    }
  }
};
</script>

<style scoped>
.student-dashboard {
  padding: 20px;
  background-color: #f5f7fa;
  height: 100%;
  overflow-y: auto;
}

.welcome-card {
  margin-bottom: 20px;
}

.user-info-container {
  display: flex;
  align-items: center;
}

.avatar-container {
  margin-right: 20px;
}

.avatar-uploader {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px dashed #d9d9d9;
  background-color: #fafafa;
  cursor: pointer;
  transition: border-color 0.3s;
}

.avatar-uploader:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  line-height: 120px;
  text-align: center;
}

.avatar {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.welcome-text h2 {
  margin: 0 0 10px 0;
  color: #303133;
}

.welcome-text p {
  margin: 0;
  color: #606266;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin: 20px 0 15px 0;
  color: #303133;
  border-left: 4px solid #409EFF;
  padding-left: 10px;
}

.health-data-section,
.exercise-status-section,
.recommendations-section {
  margin-bottom: 30px;
}

.data-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.data-card {
  transition: all 0.3s;
}

.data-card.abnormal {
  border-left: 4px solid #F56C6C;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.card-title {
  font-size: 14px;
  color: #606266;
}

.card-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: baseline;
}

.unit {
  font-size: 14px;
  font-weight: normal;
  color: #606266;
  margin-left: 5px;
}

.status-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.status-card .card-value {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.status-label {
  margin-top: 10px;
  font-size: 14px;
  color: #606266;
}

.recommendation-card {
  height: 100%;
}

.recommendation-content h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.recommendation-content ul {
  padding-left: 20px;
  margin-bottom: 20px;
}

.recommendation-content li {
  margin-bottom: 8px;
  color: #606266;
  display: flex;
  align-items: center;
}

.recommendation-content li i {
  margin-right: 8px;
}

.recommendation-footer {
  border-top: 1px solid #ebeef5;
  padding-top: 10px;
  margin-top: 15px;
  font-size: 12px;
  color: #909399;
  text-align: right;
}

.el-icon-warning {
  color: #E6A23C;
}

.el-icon-check {
  color: #67C23A;
}

.el-icon-time {
  color: #909399;
}

.el-icon-info {
  color: #409EFF;
}

.el-icon-success {
  color: #67C23A;
}

.el-icon-data-line {
  color: #909399;
}
</style>
