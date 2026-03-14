<template>
  <div class="student-profile">
    <el-card shadow="hover" class="page-header">
      <h2>个人设置</h2>
      <p>管理个人信息和账户设置</p>
    </el-card>

    <!-- 模块导航 -->
    <div class="profile-modules" v-if="!selectedModule">
      <div class="module-card" @click="selectModule('profile')">
        <div class="module-icon">
          <i class="el-icon-user"></i>
        </div>
        <div class="module-title">个人信息</div>
        <div class="module-desc">管理个人基本信息和头像</div>
      </div>
      
      <div class="module-card" @click="selectModule('security')">
        <div class="module-icon">
          <i class="el-icon-lock"></i>
        </div>
        <div class="module-title">账户安全</div>
        <div class="module-desc">修改登录密码和账户安全设置</div>
      </div>
      
      <div class="module-card" @click="selectModule('preferences')">
        <div class="module-icon">
          <i class="el-icon-running"></i>
        </div>
        <div class="module-title">运动偏好</div>
        <div class="module-desc">设置个人运动偏好和目标</div>
      </div>
    </div>

    <!-- 个人信息模块 -->
    <div v-if="selectedModule === 'profile'" class="module-content">
      <div class="module-header">
        <el-button type="text" @click="backToList" class="back-btn">
          <i class="el-icon-back"></i> 返回
        </el-button>
        <h3>个人信息</h3>
      </div>
      
      <el-card shadow="hover" class="profile-card">
        <div class="card-header">
          <h3>个人信息</h3>
          <el-button 
            type="primary" 
            size="small" 
            @click="toggleEditProfile"
            :icon="isEditProfile ? 'el-icon-check' : 'el-icon-edit'"
          >
            {{ isEditProfile ? '保存' : '编辑' }}
          </el-button>
        </div>

        <el-form :model="userProfile" label-width="120px" class="profile-form">
          <!-- 头像上传 -->
          <el-form-item label="头像">
            <div class="avatar-container">
              <el-upload
                ref="avatarUpload"
                class="avatar-uploader"
                action="#"
                :show-file-list="false"
                :before-upload="beforeAvatarUpload"
                :http-request="uploadAvatar"
                :disabled="!isEditProfile"
              >
                <img v-if="userProfile.avatar" :src="userProfile.avatar" class="avatar">
                <i v-else class="el-icon-plus avatar-uploader-icon"></i>
              </el-upload>
              <el-button 
                type="text" 
                class="avatar-selector-btn"
                @click="selectAvatar"
                :disabled="!isEditProfile"
              >
                <i class="el-icon-picture-outline"></i>
              </el-button>
            </div>
            <div class="upload-tips">建议上传 200x200 像素的图片，支持 PNG、JPG 格式</div>
          </el-form-item>

          <!-- 基本信息 -->
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="姓名">
                <el-input v-model="userProfile.name" :disabled="!isEditProfile"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="学号">
                <el-input v-model="userProfile.studentId" :disabled="!isEditProfile"></el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="性别">
                <el-select v-model="userProfile.gender" :disabled="!isEditProfile" placeholder="请选择性别">
                  <el-option label="男" value="male"></el-option>
                  <el-option label="女" value="female"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="年龄">
                <el-input v-model="userProfile.age" type="number" :disabled="!isEditProfile" placeholder="请输入年龄"></el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="班级">
            <el-input v-model="userProfile.className" :disabled="!isEditProfile"></el-input>
          </el-form-item>

          <el-form-item label="联系电话">
            <el-input v-model="userProfile.phone" :disabled="!isEditProfile" placeholder="请输入联系电话"></el-input>
          </el-form-item>

          <el-form-item label="邮箱">
            <el-input v-model="userProfile.email" type="email" :disabled="!isEditProfile" placeholder="请输入邮箱"></el-input>
          </el-form-item>

          <el-form-item label="个人简介">
            <el-input
              v-model="userProfile.bio"
              type="textarea"
              :rows="4"
              :disabled="!isEditProfile"
              placeholder="请输入个人简介"
            ></el-input>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 账户安全模块 -->
    <div v-if="selectedModule === 'security'" class="module-content">
      <div class="module-header">
        <el-button type="text" @click="backToList" class="back-btn">
          <i class="el-icon-back"></i> 返回
        </el-button>
        <h3>账户安全</h3>
      </div>
      
      <el-card shadow="hover" class="profile-card">
        <div class="card-header">
          <h3>账户安全</h3>
        </div>

        <el-form :model="securityForm" label-width="120px" class="security-form">
          <el-form-item label="当前密码">
            <el-input v-model="securityForm.currentPassword" type="password" placeholder="请输入当前密码"></el-input>
          </el-form-item>

          <el-form-item label="新密码">
            <el-input v-model="securityForm.newPassword" type="password" placeholder="请输入新密码"></el-input>
          </el-form-item>

          <el-form-item label="确认新密码">
            <el-input v-model="securityForm.confirmPassword" type="password" placeholder="请再次输入新密码"></el-input>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="changePassword">修改密码</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 运动偏好模块 -->
    <div v-if="selectedModule === 'preferences'" class="module-content">
      <div class="module-header">
        <el-button type="text" @click="backToList" class="back-btn">
          <i class="el-icon-back"></i> 返回
        </el-button>
        <h3>运动偏好</h3>
      </div>
      
      <el-card shadow="hover" class="profile-card">
        <div class="card-header">
          <h3>运动偏好</h3>
          <el-button 
            type="primary" 
            size="small" 
            @click="toggleEditPreferences"
            :icon="isEditPreferences ? 'el-icon-check' : 'el-icon-edit'"
          >
            {{ isEditPreferences ? '保存' : '编辑' }}
          </el-button>
        </div>

        <el-form :model="exercisePreferences" label-width="120px" class="preferences-form">
          <el-form-item label="偏好运动类型">
            <el-select v-model="exercisePreferences.sportTypes" multiple placeholder="请选择偏好的运动类型" :disabled="!isEditPreferences">
              <el-option label="跑步" value="running"></el-option>
              <el-option label="游泳" value="swimming"></el-option>
              <el-option label="篮球" value="basketball"></el-option>
              <el-option label="足球" value="football"></el-option>
              <el-option label="羽毛球" value="badminton"></el-option>
              <el-option label="乒乓球" value="pingpong"></el-option>
              <el-option label="健身" value="fitness"></el-option>
              <el-option label="瑜伽" value="yoga"></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="运动目标">
            <el-input
              v-model="exercisePreferences.goal"
              type="textarea"
              :rows="3"
              :disabled="!isEditPreferences"
              placeholder="请输入您的运动目标（如：每周跑步3次，每次5公里）"
            ></el-input>
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="每日目标步数">
                <el-input-number 
                  v-model="exercisePreferences.dailyStepGoal" 
                  :min="0" 
                  :disabled="!isEditPreferences"
                  placeholder="请输入每日目标步数"
                ></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="每周运动时长">
                <el-input-number 
                  v-model="exercisePreferences.weeklyExerciseTime" 
                  :min="0" 
                  :disabled="!isEditPreferences"
                  placeholder="请输入每周运动时长（分钟）"
                ></el-input-number>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="心率预警阈值">
            <el-slider 
              v-model="exercisePreferences.heartRateThreshold" 
              :min="100" 
              :max="220" 
              :disabled="!isEditPreferences"
            >
              <template #tooltip>
                <div class="slider-tooltip">{{ exercisePreferences.heartRateThreshold }}次/分钟</div>
              </template>
            </el-slider>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script>
import request from '../../utils/request'
export default {
  name: 'StudentProfile',
  data() {
    return {
      // 模块选择
      selectedModule: null,
      
      // 个人信息
      userProfile: {
        avatar: '',
        name: '',
        studentId: '',
        gender: '',
        age: null,
        className: '',
        phone: '',
        email: '',
        bio: ''
      },
      // 编辑状态
      isEditProfile: false,
      isEditPreferences: false,
      // 密码修改
      securityForm: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      // 运动偏好
      exercisePreferences: {
        sportTypes: [],
        goal: '',
        dailyStepGoal: 0,
        weeklyExerciseTime: 0,
        heartRateThreshold: 180
      }
    };
  },
  mounted() {
    // 初始化数据
    this.loadUserProfile();
    this.loadExercisePreferences();
  },
  methods: {
    // 模块选择
    selectModule(module) {
      this.selectedModule = module;
    },
    
    backToList() {
      this.selectedModule = null;
    },
    
    // 加载用户信息
    loadUserProfile() {
      // 实际项目中应该从API获取
      // 这里模拟数据
      const userInfo = JSON.parse(localStorage.getItem('user')) || {};
      this.userProfile = {
        avatar: userInfo.avatar || '',
        name: userInfo.name || '',
        studentId: userInfo.studentId || userInfo.student_id || '',
        gender: userInfo.gender || '',
        age: userInfo.age || null,
        className: userInfo.className || userInfo.class_name || '',
        phone: userInfo.phone || '',
        email: userInfo.email || '',
        bio: userInfo.bio || ''
      };
    },

    // 加载运动偏好
    loadExercisePreferences() {
      // 实际项目中应该从API获取
      // 这里从localStorage获取模拟数据
      const preferences = JSON.parse(localStorage.getItem('exercisePreferences')) || {};
      this.exercisePreferences = {
        sportTypes: preferences.sportTypes || [],
        goal: preferences.goal || '',
        dailyStepGoal: preferences.dailyStepGoal || 8000,
        weeklyExerciseTime: preferences.weeklyExerciseTime || 150,
        heartRateThreshold: preferences.heartRateThreshold || 180
      };
    },

    // 选择头像按钮点击事件
    selectAvatar() {
      // 触发文件选择对话框
      this.$refs.avatarUpload.$refs.input.click();
    },
    
    // 头像上传前验证
    beforeAvatarUpload(file) {
      const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
      const isLt2M = file.size / 1024 / 1024 < 2;
      
      if (!isJPG) {
        this.$message.error('上传头像图片只能是 JPG/PNG 格式!');
      }
      if (!isLt2M) {
        this.$message.error('上传头像图片大小不能超过 2MB!');
      }
      return isJPG && isLt2M;
    },

    // 自定义头像上传
    uploadAvatar(options) {
      const file = options.file;
      const reader = new FileReader();
      
      reader.onload = (e) => {
        // 将图片转换为base64格式保存到localStorage
        this.userProfile.avatar = e.target.result;
        const user = JSON.parse(localStorage.getItem('user')) || {};
        user.avatar = e.target.result;
        user.avatarUrl = e.target.result;
        localStorage.setItem('user', JSON.stringify(user));
        this.$message.success('头像上传成功');
      };
      
      reader.onerror = () => {
        this.$message.error('头像上传失败');
      };
      
      reader.readAsDataURL(file);
    },

    // 切换个人信息编辑状态
    toggleEditProfile() {
      if (this.isEditProfile) {
        // 保存个人信息
        const user = JSON.parse(localStorage.getItem('user')) || {};
        const updatedUser = {
          ...user,
          ...this.userProfile,
          student_id: this.userProfile.studentId,
          class_name: this.userProfile.className
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        this.$message.success('个人信息保存成功');
      }
      this.isEditProfile = !this.isEditProfile;
    },

    // 切换运动偏好编辑状态
    toggleEditPreferences() {
      if (this.isEditPreferences) {
        // 保存运动偏好
        localStorage.setItem('exercisePreferences', JSON.stringify(this.exercisePreferences));
        this.$message.success('运动偏好保存成功');
      }
      this.isEditPreferences = !this.isEditPreferences;
    },

    // 修改密码
    changePassword() {
      // 表单验证
      if (!this.securityForm.currentPassword) {
        this.$message.error('请输入当前密码');
        return;
      }
      if (!this.securityForm.newPassword) {
        this.$message.error('请输入新密码');
        return;
      }
      if (this.securityForm.newPassword !== this.securityForm.confirmPassword) {
        this.$message.error('两次输入的新密码不一致');
        return;
      }

      // 调用服务器端重置密码API
      request.put('/users/reset-password', {
        oldPassword: this.securityForm.currentPassword,
        newPassword: this.securityForm.newPassword
      })
      .then(response => {
        // 密码修改成功
        this.$message.success('密码修改成功');
        // 清空表单
        this.securityForm = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
      })
      .catch(error => {
        console.error('密码修改失败:', error);
        this.$message.error(error.response?.data?.message || '密码修改失败');
      });
    }
  }
};
</script>

<style scoped>
.student-profile {
  padding: 20px;
  background-color: #f5f7fa;
  height: 100%;
  overflow-y: auto;
}

.page-header {
  margin-bottom: 32px;
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #eef2f7 100%);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #409eff;
}

.page-header h2 {
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  letter-spacing: 0.5px;
}

.page-header p {
  margin: 0;
  font-size: 15px;
  color: #606266;
  line-height: 1.6;
}

.profile-card {
  margin-bottom: 28px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  overflow: hidden;
}

.profile-card:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f2f5;
  background-color: #fafafa;
  padding: 20px 24px;
  margin: 0 -24px 24px -24px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  letter-spacing: 0.3px;
}

.profile-form,
.security-form,
.preferences-form {
  padding: 10px 0;
  max-width: 700px;
}

.profile-form .el-form-item,
.security-form .el-form-item,
.preferences-form .el-form-item {
  margin-bottom: 24px;
}

/* 优化输入框样式 */
.el-input__inner,
.el-select__wrapper,
.el-textarea__inner {
  border-radius: 8px;
  border: 1px solid #dcdfe6;
  transition: all 0.3s ease;
}

.el-input__inner:focus,
.el-select__wrapper.is-focus .el-select__input,
.el-textarea__inner:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* 优化按钮样式 */
.el-button {
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.el-button--primary {
  background-color: #409eff;
  border-color: #409eff;
}

.el-button--primary:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

/* 头像上传 */
.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
  width: 150px;
  height: 150px;
}

.avatar-uploader .el-upload:hover {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 150px;
  height: 150px;
  line-height: 150px;
  text-align: center;
}

.avatar {
  width: 150px;
  height: 150px;
  display: block;
}

/* 模块导航样式 */
.profile-modules {
  display: flex;
  gap: 24px;
  margin-bottom: 30px;
  flex-wrap: wrap;
  justify-content: center;
}

.module-card {
  flex: 0 0 350px;
  max-width: 400px;
  padding: 40px 32px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.12);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  text-align: center;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.module-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #409eff 0%, #67c23a 100%);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.module-card:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-4px) scale(1.02);
  border-color: #409eff;
}

.module-card:hover::before {
  transform: scaleX(1);
}

.module-card:nth-child(1) .module-icon {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: white;
}

.module-card:nth-child(2) .module-icon {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  color: white;
}

.module-card:nth-child(3) .module-icon {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
  color: white;
}

.module-icon {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 28px;
  font-size: 44px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.module-card:hover .module-icon {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.module-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #303133;
}

.module-desc {
  font-size: 16px;
  color: #909399;
  line-height: 1.6;
}

/* 模块内容样式 */
.module-content {
  margin-top: 20px;
}

.module-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f2f5;
}

.back-btn {
  margin-right: 16px;
  padding: 8px 16px;
  border-radius: 6px;
  background-color: #f5f7fa;
  color: #606266;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background-color: #ecf5ff;
  color: #409eff;
  transform: translateX(-2px);
}

.module-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

/* 头像选择器样式 */
.avatar-container {
  display: flex;
  align-items: center;
  position: relative;
}

.avatar-uploader {
  margin-right: 15px;
}

/* 头像选择按钮 */
.avatar-selector-btn {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dcdfe6;
  color: #606266;
  transition: all 0.3s;
}

.avatar-selector-btn:hover {
  border-color: #409eff;
  color: #409eff;
  background-color: #ecf5ff;
}

.avatar-selector-btn i {
  font-size: 20px;
}

.upload-tips {
  margin-top: 10px;
  color: #909399;
  font-size: 12px;
}

/* 表单样式 */
.profile-form .el-form-item,
.security-form .el-form-item,
.preferences-form .el-form-item {
  margin-bottom: 20px;
}

.slider-tooltip {
  font-size: 12px;
  color: #606266;
}
</style>