<template>
  <div class="admin-data-storage">
    <el-card shadow="hover" class="page-header">
      <h2>数据存储管理</h2>
      <p>管理系统设备数据存储、统计和清理</p>
    </el-card>
    
    <!-- 数据统计概览 -->
    <el-card shadow="hover" class="overview-card">
      <div class="overview-container">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-icon total">
                <i class="el-icon-document"></i>
              </div>
              <div class="stat-content">
                <h3>总数据量</h3>
                <p class="stat-value">{{ stats.totalRecords || 0 }}</p>
                <p class="stat-desc">条设备数据记录</p>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-icon used">
                <i class="el-icon-monitor"></i>
              </div>
              <div class="stat-content">
                <h3>设备数量</h3>
                <p class="stat-value">{{ stats.deviceCount || 0 }}</p>
                <p class="stat-desc">台设备有数据记录</p>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-icon available">
                <i class="el-icon-user"></i>
              </div>
              <div class="stat-content">
                <h3>学生数量</h3>
                <p class="stat-value">{{ stats.studentCount || 0 }}</p>
                <p class="stat-desc">名学生有数据记录</p>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-icon backup">
                <i class="el-icon-time"></i>
              </div>
              <div class="stat-content">
                <h3>最新数据</h3>
                <p class="stat-value">{{ formatDate(stats.latestRecord) }}</p>
                <p class="stat-desc">最近记录时间</p>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
    
    <!-- 标签页切换 -->
    <el-card shadow="hover" class="tabs-card">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <!-- 数据备份 -->
        <el-tab-pane label="数据备份" name="backup">
          <div class="backup-container">
            <div class="backup-actions">
              <el-button type="primary" @click="showBackupDialog">
                <i class="el-icon-document-copy"></i> 立即备份
              </el-button>
              <el-button type="success" @click="showScheduleDialog">
                <i class="el-icon-alarm-clock"></i> 设置备份计划
              </el-button>
              <el-button type="info" @click="refreshBackupList">
                <i class="el-icon-refresh"></i> 刷新列表
              </el-button>
            </div>
            
            <el-table
              :data="backupList"
              border
              stripe
              style="width: 100%; margin-top: 20px;"
              height="400"
            >
              <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
              <el-table-column prop="name" label="备份名称" min-width="200"></el-table-column>
              <el-table-column prop="type" label="备份类型" width="120" align="center">
                <template v-slot="scope">
                  <el-tag :type="scope.row.type === 'full' ? 'primary' : 'success'">
                    {{ scope.row.type === 'full' ? '完整备份' : '增量备份' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="size" label="大小" width="120" align="center"></el-table-column>
              <el-table-column prop="createTime" label="创建时间" width="180" align="center"></el-table-column>
              <el-table-column prop="status" label="状态" width="100" align="center">
                <template v-slot="scope">
                  <el-tag :type="scope.row.status === 'success' ? 'success' : 'danger'">
                    {{ scope.row.status === 'success' ? '成功' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200" align="center">
                <template v-slot="scope">
                  <el-button type="primary" size="small" @click="downloadBackup(scope.row)">
                    <i class="el-icon-download"></i> 下载
                  </el-button>
                  <el-button type="success" size="small" @click="restoreBackup(scope.row)">
                    <i class="el-icon-upload2"></i> 恢复
                  </el-button>
                  <el-button type="danger" size="small" @click="deleteBackup(scope.row)">
                    <i class="el-icon-delete"></i> 删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
        
        <!-- 数据恢复 -->
        <el-tab-pane label="数据恢复" name="restore">
          <div class="restore-container">
            <div class="restore-info">
              <el-alert
                title="数据恢复注意事项"
                type="warning"
                description="数据恢复操作会覆盖当前系统中的数据，请在操作前确认已做好数据备份。建议在系统维护时段进行数据恢复操作。"
                show-icon
                :closable="false"
              ></el-alert>
            </div>
            
            <div class="restore-actions" style="margin-top: 20px;">
              <el-button type="primary" @click="showRestoreDialog">
                <i class="el-icon-upload2"></i> 选择备份文件恢复
              </el-button>
              <el-button type="success" @click="showPointInTimeDialog">
                <i class="el-icon-time"></i> 时间点恢复
              </el-button>
            </div>
            
            <div class="restore-history" style="margin-top: 30px;">
              <h4>恢复历史记录</h4>
              <el-table
                :data="restoreHistory"
                border
                stripe
                style="width: 100%; margin-top: 10px;"
                height="300"
              >
                <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
                <el-table-column prop="backupName" label="备份名称" min-width="200"></el-table-column>
                <el-table-column prop="restoreTime" label="恢复时间" width="180" align="center"></el-table-column>
                <el-table-column prop="operator" label="操作人" width="120" align="center"></el-table-column>
                <el-table-column prop="status" label="状态" width="100" align="center">
                  <template v-slot="scope">
                    <el-tag :type="scope.row.status === 'success' ? 'success' : 'danger'">
                      {{ scope.row.status === 'success' ? '成功' : '失败' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="remark" label="备注" min-width="200"></el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 数据清理 -->
        <el-tab-pane label="数据清理" name="cleanup">
          <div class="cleanup-container">
            <div class="cleanup-info">
              <el-alert
                title="数据清理注意事项"
                type="warning"
                description="数据清理操作会永久删除过期数据，请在操作前确认已做好数据备份。建议根据业务需求设置合理的清理策略。"
                show-icon
                :closable="false"
              ></el-alert>
            </div>
            
            <div class="cleanup-strategy" style="margin-top: 30px;">
              <h4>清理策略设置</h4>
              <el-form :model="cleanupStrategy" label-width="180px" class="strategy-form">
                <el-form-item label="用户操作日志保留">
                  <el-input-number v-model="cleanupStrategy.userLogDays" :min="30" :max="365"></el-input-number>
                  <span style="margin-left: 10px;">天</span>
                </el-form-item>
                
                <el-form-item label="设备数据保留">
                  <el-input-number v-model="cleanupStrategy.deviceDataDays" :min="90" :max="730"></el-input-number>
                  <span style="margin-left: 10px;">天</span>
                </el-form-item>
                
                <el-form-item label="运动数据保留">
                  <el-input-number v-model="cleanupStrategy.exerciseDataDays" :min="180" :max="1095"></el-input-number>
                  <span style="margin-left: 10px;">天</span>
                </el-form-item>
                
                <el-form-item label="系统日志保留">
                  <el-input-number v-model="cleanupStrategy.systemLogDays" :min="30" :max="180"></el-input-number>
                  <span style="margin-left: 10px;">天</span>
                </el-form-item>
                
                <el-form-item label="自动清理">
                  <el-switch v-model="cleanupStrategy.autoCleanup"></el-switch>
                </el-form-item>
                
                <el-form-item label="清理时间" v-if="cleanupStrategy.autoCleanup">
                  <el-time-picker
                    v-model="cleanupStrategy.cleanupTime"
                    placeholder="选择时间"
                    style="width: 100%;"
                  ></el-time-picker>
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="saveCleanupStrategy">保存策略</el-button>
                  <el-button type="warning" @click="executeCleanupNow">立即清理</el-button>
                </el-form-item>
              </el-form>
            </div>
            
            <div class="cleanup-history" style="margin-top: 30px;">
              <h4>清理历史记录</h4>
              <el-table
                :data="cleanupHistory"
                border
                stripe
                style="width: 100%; margin-top: 10px;"
                height="200"
              >
                <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
                <el-table-column prop="cleanupTime" label="清理时间" width="180" align="center"></el-table-column>
                <el-table-column prop="dataType" label="数据类型" width="150" align="center"></el-table-column>
                <el-table-column prop="deletedCount" label="删除记录数" width="120" align="center"></el-table-column>
                <el-table-column prop="freedSpace" label="释放空间" width="120" align="center"></el-table-column>
                <el-table-column prop="operator" label="操作人" width="120" align="center"></el-table-column>
                <el-table-column prop="status" label="状态" width="100" align="center">
                  <template v-slot="scope">
                    <el-tag :type="scope.row.status === 'success' ? 'success' : 'danger'">
                      {{ scope.row.status === 'success' ? '成功' : '失败' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 存储设置 -->
        <el-tab-pane label="存储设置" name="settings">
          <div class="storage-settings-container">
            <el-form :model="storageSettings" label-width="180px" class="settings-form">
              <el-form-item label="主存储路径">
                <el-input v-model="storageSettings.mainPath" placeholder="请输入主存储路径"></el-input>
              </el-form-item>
              
              <el-form-item label="备份存储路径">
                <el-input v-model="storageSettings.backupPath" placeholder="请输入备份存储路径"></el-input>
              </el-form-item>
              
              <el-form-item label="临时文件路径">
                <el-input v-model="storageSettings.tempPath" placeholder="请输入临时文件路径"></el-input>
              </el-form-item>
              
              <el-form-item label="最大存储空间">
                <el-input-number v-model="storageSettings.maxStorage" :min="100" :max="10000"></el-input-number>
                <span style="margin-left: 10px;">GB</span>
              </el-form-item>
              
              <el-form-item label="存储告警阈值">
                <el-input-number v-model="storageSettings.warningThreshold" :min="70" :max="95"></el-input-number>
                <span style="margin-left: 10px;">%</span>
              </el-form-item>
              
              <el-form-item label="压缩算法">
                <el-select v-model="storageSettings.compressionAlgorithm" placeholder="请选择压缩算法">
                  <el-option label="GZIP" value="gzip"></el-option>
                  <el-option label="ZIP" value="zip"></el-option>
                  <el-option label="7-Zip" value="7zip"></el-option>
                  <el-option label="不压缩" value="none"></el-option>
                </el-select>
              </el-form-item>
              
              <el-form-item label="加密存储">
                <el-switch v-model="storageSettings.encryptionEnabled"></el-switch>
              </el-form-item>
              
              <el-form-item label="加密算法" v-if="storageSettings.encryptionEnabled">
                <el-select v-model="storageSettings.encryptionAlgorithm" placeholder="请选择加密算法">
                  <el-option label="AES-256" value="aes256"></el-option>
                  <el-option label="RSA-2048" value="rsa2048"></el-option>
                  <el-option label="SM4" value="sm4"></el-option>
                </el-select>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="saveStorageSettings">保存设置</el-button>
                <el-button @click="resetStorageSettings">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 立即备份对话框 -->
    <el-dialog
      title="立即备份"
      :visible.sync="backupDialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="backupForm" label-width="100px">
        <el-form-item label="备份名称">
          <el-input v-model="backupForm.name" placeholder="请输入备份名称"></el-input>
        </el-form-item>
        
        <el-form-item label="备份描述">
          <el-input
            v-model="backupForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入备份描述"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="备份类型">
          <el-radio-group v-model="backupForm.type">
            <el-radio label="full">完整备份</el-radio>
            <el-radio label="incremental">增量备份</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="备份内容">
          <el-checkbox-group v-model="backupForm.content">
            <el-checkbox label="用户数据">用户数据</el-checkbox>
            <el-checkbox label="设备数据">设备数据</el-checkbox>
            <el-checkbox label="运动数据">运动数据</el-checkbox>
            <el-checkbox label="健康数据">健康数据</el-checkbox>
            <el-checkbox label="系统配置">系统配置</el-checkbox>
            <el-checkbox label="日志文件">日志文件</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="压缩备份">
          <el-switch v-model="backupForm.compression"></el-switch>
        </el-form-item>
        
        <el-form-item label="加密备份" v-if="storageSettings.encryptionEnabled">
          <el-switch v-model="backupForm.encryption"></el-switch>
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="backupDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="startBackup">开始备份</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'AdminDataStorage',
  data() {
    return {
      // 激活的标签页
      activeTab: 'data',
      // 数据统计
      stats: {
        totalRecords: 0,
        deviceCount: 0,
        studentCount: 0,
        latestRecord: null
      },
      // 设备数据列表
      deviceDataList: [],
      // 分页
      pagination: {
        page: 1,
        limit: 20,
        total: 0
      },
      // 搜索条件
      searchForm: {
        device_id: '',
        student_id: '',
        start_date: '',
        end_date: ''
      },
      // 加载状态
      loading: false,
      // 备份列表
      backupList: [],
      // 恢复历史
      restoreHistory: [],
      // 清理策略
      cleanupStrategy: {
        deviceDataDays: 365,
        autoCleanup: true,
        cleanupTime: new Date(2023, 10, 1, 2, 0, 0)
      },
      // 清理历史
      cleanupHistory: [],
      // 存储设置
      storageSettings: {
        mainPath: '/data/sport_monitor',
        backupPath: '/backup/sport_monitor',
        tempPath: '/tmp/sport_monitor',
        maxStorage: 1000,
        warningThreshold: 80,
        compressionAlgorithm: 'gzip',
        encryptionEnabled: true,
        encryptionAlgorithm: 'aes256'
      },
      // 备份表单
      backupForm: {
        name: `backup_${new Date().toISOString().slice(0, 10)}`,
        description: '',
        type: 'full',
        content: ['用户数据', '设备数据', '运动数据', '健康数据', '系统配置', '日志文件'],
        compression: true,
        encryption: true
      },
      // 对话框
      backupDialogVisible: false
    };
  },
  mounted() {
    this.fetchStats();
    this.fetchDeviceData();
  },
  methods: {
    // 获取数据统计
    async fetchStats() {
      try {
        const response = await this.$axios.get('/api/device-data/stats');
        if (response.data.success) {
          this.stats = response.data.stats;
        }
      } catch (error) {
        console.error('获取数据统计失败:', error);
        this.$message.error('获取数据统计失败');
      }
    },
    
    // 获取设备数据列表
    async fetchDeviceData() {
      this.loading = true;
      try {
        const params = {
          page: this.pagination.page,
          limit: this.pagination.limit
        };
        
        if (this.searchForm.device_id) {
          params.device_id = this.searchForm.device_id;
        }
        
        if (this.searchForm.student_id) {
          params.student_id = this.searchForm.student_id;
        }
        
        if (this.searchForm.start_date) {
          params.start_date = this.searchForm.start_date;
        }
        
        if (this.searchForm.end_date) {
          params.end_date = this.searchForm.end_date;
        }
        
        const response = await this.$axios.get('/api/device-data/all', { params });
        if (response.data.success) {
          this.deviceDataList = response.data.data;
          this.pagination = response.data.pagination;
        }
      } catch (error) {
        console.error('获取设备数据失败:', error);
        this.$message.error('获取设备数据失败');
      } finally {
        this.loading = false;
      }
    },
    
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '-';
      try {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN');
      } catch (error) {
        return dateString;
      }
    },
    
    // 标签页切换
    handleTabClick(tab) {
      console.log('切换到标签页：', tab.name);
      if (tab.name === 'data') {
        this.fetchStats();
        this.fetchDeviceData();
      }
    },
    
    // 显示备份对话框
    showBackupDialog() {
      this.backupForm = {
        name: `backup_${new Date().toISOString().slice(0, 10)}`,
        description: '',
        type: 'full',
        content: ['用户数据', '设备数据', '运动数据', '健康数据', '系统配置', '日志文件'],
        compression: true,
        encryption: true
      };
      this.backupDialogVisible = true;
    },
    
    // 开始备份
    startBackup() {
      this.backupDialogVisible = false;
      this.$message.success('数据备份任务已开始');
      
      // 模拟备份完成
      setTimeout(() => {
        const newBackup = {
          id: this.backupList.length + 1,
          name: `${this.backupForm.name}_${new Date().toISOString().slice(11, 19).replace(/:/g, '')}`,
          type: this.backupForm.type,
          size: this.backupForm.type === 'full' ? '12.6 GB' : '1.3 GB',
          createTime: new Date().toLocaleString(),
          status: 'success'
        };
        this.backupList.unshift(newBackup);
        this.$message.success('数据备份完成');
      }, 2000);
    },
    
    // 刷新备份列表
    refreshBackupList() {
      this.$message.success('备份列表已刷新');
    },
    
    // 设置备份计划
    showScheduleDialog() {
      this.$message.info('设置备份计划功能开发中');
    },
    
    // 下载备份
    downloadBackup(backup) {
      this.$message.info(`开始下载备份：${backup.name}`);
    },
    
    // 恢复备份
    restoreBackup(backup) {
      this.$confirm(`确定要恢复备份 ${backup.name} 吗？此操作会覆盖当前数据！`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message.success(`开始恢复备份：${backup.name}`);
        
        // 模拟恢复完成
        setTimeout(() => {
          const newRestore = {
            id: this.restoreHistory.length + 1,
            backupName: backup.name,
            restoreTime: new Date().toLocaleString(),
            operator: 'admin',
            status: 'success',
            remark: '手动恢复操作'
          };
          this.restoreHistory.unshift(newRestore);
          this.$message.success('数据恢复完成');
        }, 3000);
      }).catch(() => {
        this.$message.info('已取消恢复操作');
      });
    },
    
    // 删除备份
    deleteBackup(backup) {
      this.$confirm(`确定要删除备份 ${backup.name} 吗？此操作不可恢复！`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }).then(() => {
        const index = this.backupList.findIndex(b => b.id === backup.id);
        if (index !== -1) {
          this.backupList.splice(index, 1);
        }
        this.$message.success('备份删除成功');
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    },
    
    // 显示恢复对话框
    showRestoreDialog() {
      this.$message.info('选择备份文件恢复功能开发中');
    },
    
    // 显示时间点恢复对话框
    showPointInTimeDialog() {
      this.$message.info('时间点恢复功能开发中');
    },
    
    // 保存清理策略
    saveCleanupStrategy() {
      this.$message.success('清理策略保存成功');
    },
    
    // 立即清理
    executeCleanupNow() {
      this.$confirm('确定要立即执行数据清理吗？此操作会永久删除过期数据！', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message.success('数据清理任务已开始');
        
        // 模拟清理完成
        setTimeout(() => {
          const newCleanup = {
            id: this.cleanupHistory.length + 1,
            cleanupTime: new Date().toLocaleString(),
            dataType: '综合清理',
            deletedCount: '156,780',
            freedSpace: '8.2 GB',
            operator: 'admin',
            status: 'success'
          };
          this.cleanupHistory.unshift(newCleanup);
          this.$message.success('数据清理完成');
        }, 2000);
      }).catch(() => {
        this.$message.info('已取消清理操作');
      });
    },
    
    // 保存存储设置
    saveStorageSettings() {
      this.$message.success('存储设置保存成功');
    },
    
    // 重置存储设置
    resetStorageSettings() {
      this.storageSettings = {
        mainPath: '/data/sport_monitor',
        backupPath: '/backup/sport_monitor',
        tempPath: '/tmp/sport_monitor',
        maxStorage: 1000,
        warningThreshold: 80,
        compressionAlgorithm: 'gzip',
        encryptionEnabled: true,
        encryptionAlgorithm: 'aes256'
      };
      this.$message.success('存储设置已重置');
    }
  }
};
</script>

<style scoped>
.admin-data-storage {
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

.overview-card {
  margin-bottom: 20px;
}

.overview-container {
  padding: 10px 0;
}

.stat-card {
  text-align: center;
  height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 15px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 28px;
  color: #fff;
}

.stat-icon.total {
  background-color: #409eff;
}

.stat-icon.used {
  background-color: #67c23a;
}

.stat-icon.available {
  background-color: #e6a23c;
}

.stat-icon.backup {
  background-color: #f56c6c;
}

.stat-content h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #303133;
}

.stat-value {
  margin: 0 0 5px 0;
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.stat-desc {
  margin: 0;
  color: #909399;
  font-size: 12px;
}

.tabs-card {
  margin-bottom: 20px;
}

.backup-container,
.restore-container,
.cleanup-container,
.storage-settings-container {
  padding: 20px 0;
}

.backup-actions,
.restore-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.restore-info,
.cleanup-info {
  margin-bottom: 20px;
}

.strategy-form,
.settings-form {
  padding: 20px 0;
}

.dialog-footer {
  text-align: center;
}
</style>
     