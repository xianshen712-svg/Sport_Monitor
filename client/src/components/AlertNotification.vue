<template>
  <div class="alert-notification-container" :class="{ 'show': showNotifications }">
    <div class="notification-header">
      <h3>预警通知</h3>
      <div class="header-actions">
        <el-button type="text" @click="toggleNotifications">
          {{ showNotifications ? '收起' : '展开' }}
        </el-button>
        <el-button type="text" @click="clearAllAlerts">
          清空
        </el-button>
      </div>
    </div>
    
    <div class="notification-content" v-if="showNotifications">
      <div v-if="activeAlerts.length === 0" class="no-alerts">
        <i class="el-icon-success"></i>
        <span>当前没有预警信息</span>
      </div>
      
      <div v-else class="alerts-list">
        <el-timeline>
          <el-timeline-item
            v-for="(alert, index) in activeAlerts"
            :key="alert.id"
            :type="getAlertType(alert.level)"
            :timestamp="alert.formattedTime"
            placement="top"
          >
            <div class="alert-item">
              <div class="alert-header">
                <span class="alert-title">{{ getAlertTypeName(alert.type) }}</span>
                <el-tag :type="getAlertType(alert.level)" size="small">
                  {{ getAlertLevelName(alert.level) }}
                </el-tag>
              </div>
              <div class="alert-content">{{ alert.message }}</div>
              <div class="alert-meta">
                <span class="student-info">
                  <i class="el-icon-user"></i> {{ alert.studentInfo.name || '未知学生' }}
                </span>
                <span class="device-info" v-if="alert.studentInfo.deviceId">
                  <i class="el-icon-cpu"></i> {{ alert.studentInfo.deviceId }}
                </span>
              </div>
              <div class="alert-actions">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="handleAlert(alert.id)"
                  :disabled="alert.handled"
                >
                  {{ alert.handled ? '已处理' : '处理' }}
                </el-button>
                <el-button 
                  type="text" 
                  size="small" 
                  @click="viewDetails(alert)"
                >
                  查看详情
                </el-button>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </div>
    
    <!-- 预警数量提示 -->
    <el-badge 
      v-if="activeAlerts.length > 0" 
      :value="activeAlerts.length" 
      type="danger" 
      class="alerts-badge"
    >
      <i class="el-icon-bell"></i>
    </el-badge>
    
    <!-- 详情抽屉 -->
    <el-drawer
      :visible.sync="showDetailDrawer"
      direction="rtl"
      size="400px"
      title="预警详情"
    >
      <div v-if="selectedAlert" class="alert-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="预警ID">{{ selectedAlert.id }}</el-descriptions-item>
          <el-descriptions-item label="预警类型">{{ getAlertTypeName(selectedAlert.type) }}</el-descriptions-item>
          <el-descriptions-item label="预警级别">{{ getAlertLevelName(selectedAlert.level) }}</el-descriptions-item>
          <el-descriptions-item label="预警消息">{{ selectedAlert.message }}</el-descriptions-item>
          <el-descriptions-item label="涉及数值">{{ selectedAlert.value || 'N/A' }}</el-descriptions-item>
          <el-descriptions-item label="学生姓名">{{ selectedAlert.studentInfo.name || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="学生ID">{{ selectedAlert.studentInfo.studentId || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="设备ID">{{ selectedAlert.studentInfo.deviceId || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="发生时间">{{ selectedAlert.formattedTime }}</el-descriptions-item>
          <el-descriptions-item label="处理状态">
            <el-tag :type="selectedAlert.handled ? 'success' : 'warning'">
              {{ selectedAlert.handled ? '已处理' : '未处理' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="处理人" v-if="selectedAlert.handledBy">
            {{ selectedAlert.handledBy }}
          </el-descriptions-item>
          <el-descriptions-item label="处理时间" v-if="selectedAlert.handledTime">
            {{ new Date(selectedAlert.handledTime).toLocaleString('zh-CN') }}
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="drawer-actions">
          <el-button type="primary" @click="handleAlert(selectedAlert.id)" :disabled="selectedAlert.handled">
            {{ selectedAlert.handled ? '已处理' : '标记为已处理' }}
          </el-button>
          <el-button @click="showDetailDrawer = false">关闭</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { alertService, ALERT_LEVELS, ALERT_TYPES } from '../services/AlertService';

export default {
  name: 'AlertNotification',
  data() {
    return {
      activeAlerts: [],
      showNotifications: false,
      showDetailDrawer: false,
      selectedAlert: null,
      alertService: alertService
    };
  },
  
  mounted() {
    // 初始化预警数据
    this.activeAlerts = this.alertService.getActiveAlerts();
    
    // 注册预警监听器
    this.alertService.registerListener(this.handleNewAlert);
  },
  
  beforeDestroy() {
    // 移除预警监听器
    this.alertService.removeListener(this.handleNewAlert);
  },
  
  methods: {
    // 处理新的预警
    handleNewAlert(alert) {
      this.activeAlerts = this.alertService.getActiveAlerts();
      
      // 显示桌面通知（如果浏览器支持）
      this.showDesktopNotification(alert);
    },
    
    // 显示桌面通知
    showDesktopNotification(alert) {
      if (!('Notification' in window)) {
        console.log('此浏览器不支持桌面通知');
        return;
      }
      
      if (Notification.permission === 'granted') {
        new Notification('运动监测系统预警', {
          body: alert.message,
          icon: '/favicon.ico'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('运动监测系统预警', {
              body: alert.message,
              icon: '/favicon.ico'
            });
          }
        });
      }
    },
    
    // 获取预警类型对应的颜色
    getAlertType(level) {
      switch (level) {
        case ALERT_LEVELS.CRITICAL: return 'danger';
        case ALERT_LEVELS.WARNING: return 'warning';
        case ALERT_LEVELS.INFO: return 'info';
        default: return 'info';
      }
    },
    
    // 获取预警级别名称
    getAlertLevelName(level) {
      switch (level) {
        case ALERT_LEVELS.CRITICAL: return '严重';
        case ALERT_LEVELS.WARNING: return '警告';
        case ALERT_LEVELS.INFO: return '提醒';
        default: return '未知';
      }
    },
    
    // 获取预警类型名称
    getAlertTypeName(type) {
      const typeNames = {
        [ALERT_TYPES.HEART_RATE]: '心率异常',
        [ALERT_TYPES.BLOOD_OXYGEN]: '血氧异常',
        [ALERT_TYPES.BODY_TEMPERATURE]: '体温异常',
        [ALERT_TYPES.FATIGUE_LEVEL]: '疲劳度异常',
        [ALERT_TYPES.DEVICE_OFFLINE]: '设备离线',
        [ALERT_TYPES.LOW_BATTERY]: '设备低电量',
        [ALERT_TYPES.DATA_ABNORMAL]: '数据异常'
      };
      return typeNames[type] || '未知类型';
    },
    
    // 切换通知显示状态
    toggleNotifications() {
      this.showNotifications = !this.showNotifications;
    },
    
    // 处理预警
    handleAlert(alertId) {
      this.alertService.handleAlert(alertId, this.$store.state.userInfo?.name || '未知用户');
      this.activeAlerts = this.alertService.getActiveAlerts();
      this.$message.success('预警已处理');
      
      if (this.selectedAlert && this.selectedAlert.id === alertId) {
        this.selectedAlert.handled = true;
      }
    },
    
    // 查看详情
    viewDetails(alert) {
      this.selectedAlert = alert;
      this.showDetailDrawer = true;
    },
    
    // 清空所有预警
    clearAllAlerts() {
      this.$confirm('确定要清空所有预警信息吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.alertService.clearAllAlerts();
        this.activeAlerts = [];
        this.$message.success('所有预警已清空');
      }).catch(() => {
        // 取消清空操作
      });
    },
    
    // 刷新预警数据
    refreshAlerts() {
      this.activeAlerts = this.alertService.getActiveAlerts();
    }
  }
};
</script>

<style scoped>
.alert-notification-container {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 400px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow: hidden;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  cursor: pointer;
}

.notification-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.notification-content {
  max-height: 500px;
  overflow-y: auto;
}

.no-alerts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #909399;
}

.no-alerts i {
  font-size: 48px;
  color: #67c23a;
  margin-bottom: 10px;
}

.alerts-list {
  padding: 16px;
}

.alert-item {
  padding: 12px;
  background-color: #fafafa;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.alert-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.alert-content {
  color: #606266;
  margin-bottom: 8px;
  line-height: 1.4;
}

.alert-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.student-info, .device-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.alert-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.alerts-badge {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 48px;
  height: 48px;
  background-color: white;
  border-radius: 50%;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  z-index: 1000;
}

.alerts-badge:hover {
  background-color: #f5f7fa;
}

.alert-detail {
  padding: 20px 0;
}

.drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>