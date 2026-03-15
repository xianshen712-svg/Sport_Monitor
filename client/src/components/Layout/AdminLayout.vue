<template>
  <div class="admin-layout">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside width="200px" class="sidebar">
        <div class="logo">
          <h3>运动监测系统</h3>
        </div>
        <el-menu
          default-active="/admin/dashboard"
          class="el-menu-vertical-demo"
          @select="handleMenuSelect"
        >
          <el-menu-item index="/admin/dashboard">
            <el-icon><House /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/admin/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-sub-menu index="device-menu">
            <template #title>
              <el-icon><Monitor /></el-icon>
              <span>设备管理</span>
            </template>
            <el-menu-item index="/admin/devices">
              <el-icon><List /></el-icon>
              <span>设备列表</span>
            </el-menu-item>
            <el-menu-item index="/admin/devices/heart-rate">
              <el-icon><Monitor /></el-icon>
              <span>心率监测</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/admin/health-data">
            <el-icon><FirstAidKit /></el-icon>
            <span>健康数据管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/exercise-data">
            <el-icon><Basketball /></el-icon>
            <span>运动数据管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/alerts">
            <el-icon><Bell /></el-icon>
            <span>警告管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/settings">
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </el-menu-item>
          <el-menu-item index="/admin/logs">
            <el-icon><Document /></el-icon>
            <span>日志与监控</span>
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
                {{ currentUser?.name || '管理员' }}
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  House,
  User,
  Monitor,
  Setting,
  Document,
  Menu,
  ArrowDown,
  FirstAidKit,
  Basketball,
  Bell,
  List
} from '@element-plus/icons-vue'

export default {
  name: 'AdminLayout',
  components: {
    House,
    User,
    Monitor,
    Setting,
    Document,
    Menu,
    ArrowDown,
    FirstAidKit,
    Basketball,
    Bell,
    List
  },
  setup() {
    const router = useRouter()
    const currentUser = ref(null)

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
      handleLogout
    }
  }
}
</script>

<style scoped>
.admin-layout {
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
  color: white !important;
  white-space: nowrap;
  overflow: visible;
}

.el-menu-item:hover {
  background-color: #1890ff;
  color: white !important;
}

.el-menu-item.is-active {
  background-color: #1890ff;
  color: white !important;
}

.el-sub-menu__title {
  white-space: nowrap;
  overflow: visible;
  color: white !important;
}

.el-sub-menu__title:hover {
  background-color: #1890ff;
  color: white !important;
}

/* 确保子菜单图标也使用白色 */
.el-sub-menu__title .el-icon {
  color: white !important;
}

.el-sub-menu__title:hover .el-icon {
  color: white !important;
}

/* 确保子菜单标题文字使用白色 */
.el-sub-menu__title span {
  color: white !important;
}

.el-sub-menu__title:hover span {
  color: white !important;
}

/* 子菜单项背景色改为黑色，与其他菜单项一致 */
.el-menu--vertical {
  background-color: #001529 !important;
}

.el-menu--vertical .el-menu-item {
  background-color: #001529 !important;
}

.el-menu--vertical .el-menu-item:hover {
  background-color: #1890ff !important;
}

.el-menu--vertical .el-menu-item.is-active {
  background-color: #1890ff !important;
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