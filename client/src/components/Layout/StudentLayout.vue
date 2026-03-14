<template>
  <div class="student-layout">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside width="200px" class="sidebar">
        <div class="logo">
          <h3>运动监测系统</h3>
        </div>
        <el-menu
          :default-active="activeIndex"
          class="el-menu-vertical-demo"
          @select="handleMenuSelect"
          router
        >
          <el-menu-item index="/student/dashboard">
            <el-icon><House /></el-icon>
            <span>个人首页</span>
          </el-menu-item>
          <el-menu-item index="/student/health-data">
            <el-icon><Document /></el-icon>
            <span>健康数据</span>
          </el-menu-item>
          <el-menu-item index="/student/exercise-report">
            <el-icon><TrendCharts /></el-icon>
            <span>运动报告</span>
          </el-menu-item>
          <el-menu-item index="/student/data-analysis">
            <el-icon><PieChart /></el-icon>
            <span>数据分析</span>
          </el-menu-item>
          <el-menu-item index="/student/profile">
            <el-icon><Setting /></el-icon>
            <span>个人设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <!-- 顶部导航栏 -->
        <el-header class="header">
          <div class="header-left">
            <el-button type="text" class="menu-toggle">
              <el-icon><Menu /></el-icon>
            </el-button>
          </div>
          <div class="header-right">
            <el-dropdown>
              <span class="user-info">
                <el-icon><User /></el-icon>
                {{ currentUser?.name || '学生' }}
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <!-- 主要内容区域 -->
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  House,
  Document,
  TrendCharts,
  PieChart,
  Setting,
  Menu,
  User,
  ArrowDown
} from '@element-plus/icons-vue'

export default {
  name: 'StudentLayout',
  components: {
    House,
    Document,
    TrendCharts,
    PieChart,
    Setting,
    Menu,
    User,
    ArrowDown
  },
  setup() {
    const router = useRouter()
    const currentUser = ref(null)

    // 动态获取当前路由路径作为激活菜单的索引
    const activeIndex = computed(() => router.currentRoute.value.path)

    // 处理菜单选择
    const handleMenuSelect = (key, keyPath) => {
      router.push(key)
    }

    // 处理退出登录
    const handleLogout = () => {
      // 清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // 跳转到登录页
      router.push('/login')
      ElMessage.success('退出登录成功')
    }

    // 初始化用户信息
    const initUserInfo = () => {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        currentUser.value = JSON.parse(userStr)
      }
    }

    onMounted(() => {
      initUserInfo()
    })

    return {
      currentUser,
      handleMenuSelect,
      handleLogout,
      activeIndex
    }
  }
}
</script>

<style scoped>
.student-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.sidebar {
  background-color: #001529;
  color: white;
  height: 100%;
  overflow-y: auto;
}

.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #1f2d3d;
}

.logo h3 {
  margin: 0;
  color: white;
  font-size: 18px;
}

.el-menu-vertical-demo {
  background-color: #001529;
  border-right: none;
}

.el-menu-item {
  color: rgba(255, 255, 255, 0.8);
}

.el-menu-item:hover {
  background-color: #1890ff;
  color: white;
}

.el-menu-item.is-active {
  background-color: #1890ff;
  color: white;
}

.header {
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-left .menu-toggle {
  font-size: 20px;
}

.header-right .user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.header-right .user-info:hover {
  background-color: #f5f5f5;
}

.main-content {
  padding: 20px;
  background-color: #f5f7fa;
  overflow-y: auto;
}
</style>