<template>
  <div class="login-container">
    <div class="login-form-wrapper">
      <h2 class="login-title">校园运动监测系统</h2>
      <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" label-width="80px">

        <!-- 登录方式切换 -->
        <div class="login-method-switch">
          <el-radio-group v-model="loginMethod" size="large">
            <el-radio-button label="账号密码登录"></el-radio-button>
            <el-radio-button label="手环ID登录"></el-radio-button>
          </el-radio-group>
        </div>

        <!-- 账号密码登录方式 -->
        <template v-if="loginMethod === '账号密码登录'">
          <el-form-item label="账号" prop="username">
            <el-input v-model="loginForm.username" placeholder="请输入学号/账号"></el-input>
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" show-password></el-input>
          </el-form-item>
        </template>

        <!-- 手环ID登录方式 -->
        <template v-else>
          <el-form-item label="手环ID" prop="deviceId">
            <el-input v-model="loginForm.deviceId" placeholder="请输入手环ID"></el-input>
          </el-form-item>
          <el-form-item label="验证码" prop="verificationCode">
            <div class="verification-code">
              <el-input v-model="loginForm.verificationCode" placeholder="请输入验证码"></el-input>
              <el-button type="primary" class="send-code-btn" @click="sendVerificationCode">发送验证码</el-button>
            </div>
          </el-form-item>
        </template>

        <!-- 记住我 -->
        <el-form-item>
          <el-checkbox v-model="rememberMe">记住我</el-checkbox>
        </el-form-item>

        <!-- 登录按钮 -->
        <el-form-item>
          <el-button type="primary" class="login-btn" @click="handleLogin" :loading="loginLoading">登录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const loginFormRef = ref()
    const loginLoading = ref(false)
    const rememberMe = ref(false)
    const loginMethod = ref('账号密码登录')

    const loginForm = reactive({
      username: '',
      password: '',
      deviceId: '',
      verificationCode: '',
      rememberMe: false
    })

    const loginRules = reactive({
      username: [
        { required: loginMethod.value === '账号密码登录', message: '请输入账号', trigger: 'blur' }
      ],
      password: [
        { required: loginMethod.value === '账号密码登录', message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
      ],
      deviceId: [
        { required: loginMethod.value === '手环ID登录', message: '请输入手环ID', trigger: 'blur' }
      ],
      verificationCode: [
        { required: loginMethod.value === '手环ID登录', message: '请输入验证码', trigger: 'blur' },
        { len: 6, message: '验证码长度为 6 个字符', trigger: 'blur' }
      ]
    })

    const sendVerificationCode = () => {
      // 发送验证码逻辑
      ElMessage.success('验证码已发送')
    }

    const handleLogin = async () => {
      if (!loginFormRef.value) return
      
      loginLoading.value = true
      
      try {
        // 使用Promise方式处理表单验证
        await loginFormRef.value.validate()
        
        // 调用后端登录API
        let response
        console.log('开始发送登录请求:', loginForm.username, loginForm.password)
        if (loginMethod.value === '账号密码登录') {
          // 调用后端登录接口
          console.log('发送请求到:', 'http://localhost:3001/api/users/login')
          console.log('请求数据:', {
            username: loginForm.username,
            password: loginForm.password
          })
          
          response = await axios.post('http://localhost:3001/api/users/login', {
            username: loginForm.username,
            password: loginForm.password
          }, {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 10000
          })
          console.log('登录请求成功，响应:', response.data)
        } else {
          // 手环ID登录逻辑
          throw new Error('手环ID登录功能暂未实现')
        }

        // 保存登录信息
        localStorage.setItem('token', response.data.token)
        
        // 合并用户信息，确保包含必要的字段
        const userInfo = {
          ...response.data.user,
          name: response.data.user.name || (response.data.user.role === 'admin' ? '管理员' : response.data.user.role === 'teacher' ? '老师' : '学生'),
          class: response.data.user.class_name || '', // 映射后端的class_name为前端的class
          password: loginForm.password // 保存密码以便后续密码修改验证
        }
        
        console.log('保存到localStorage的用户信息:', userInfo)
        localStorage.setItem('user', JSON.stringify(userInfo))

        if (rememberMe.value) {
          localStorage.setItem('rememberMe', 'true')
          localStorage.setItem('loginForm', JSON.stringify({
            username: loginForm.username,
            password: loginForm.password,
            deviceId: loginForm.deviceId
          }))
        } else {
          localStorage.removeItem('rememberMe')
          localStorage.removeItem('loginForm')
        }
        
        // 根据角色跳转到对应首页
        console.log('前端选择的角色:', loginForm.role)
        console.log('后端返回的用户角色:', response.data.user.role)
        switch (response.data.user.role) {
          case 'student':
            router.push('/student/dashboard')
            break
          case 'teacher':
            router.push('/teacher/dashboard')
            break
          case 'admin':
            router.push('/admin/dashboard')
            break
          default:
            router.push('/login')
        }

        ElMessage.success(`登录成功！当前角色：${response.data.user.role}`)
      } catch (error) {
        // 处理登录错误，提取后端返回的错误信息
        if (error.name === 'Error' && error.message.includes('请')) {
          // 表单验证错误
          console.log('表单验证失败:', error)
          ElMessage.error(error.message)
        } else {
          console.error('登录请求失败:', error)
          
          // 输出完整的错误对象
          console.error('完整错误对象:', JSON.stringify(error, null, 2))
          
          const errorMsg = error.response?.data?.message || error.message || '登录失败'
          const errorDetails = {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers,
            config: error.config,
            message: error.message,
            code: error.code
          }
          console.log('登录错误详情:', JSON.stringify(errorDetails, null, 2))
          ElMessage.error(errorMsg)
        }
      } finally {
        loginLoading.value = false
      }
    }

    // 初始化登录表单
    const initLoginForm = () => {
      const rememberMeFlag = localStorage.getItem('rememberMe') === 'true'
      const savedLoginForm = JSON.parse(localStorage.getItem('loginForm'))

      if (rememberMeFlag && savedLoginForm) {
        rememberMe.value = true
        // 只恢复用户名、密码和手环ID，不恢复角色
        loginForm.username = savedLoginForm.username || ''
        loginForm.password = savedLoginForm.password || ''
        loginForm.deviceId = savedLoginForm.deviceId || ''
      }
    }

    initLoginForm()

    return {
      loginFormRef,
      loginLoading,
      rememberMe,
      loginMethod,
      loginForm,
      loginRules,
      sendVerificationCode,
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-form-wrapper {
  width: 400px;
  padding: 30px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #303133;
  font-size: 24px;
  font-weight: bold;
}

.login-method-switch {
  margin-bottom: 20px;
  text-align: center;
}

.verification-code {
  display: flex;
  gap: 10px;
}

.send-code-btn {
  white-space: nowrap;
}

.login-btn {
  width: 100%;
  height: 40px;
  font-size: 16px;
}
</style>