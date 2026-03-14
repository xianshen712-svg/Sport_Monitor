import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/Login.vue')
  },
  // 学生端路由
  {
    path: '/student',
    name: 'StudentLayout',
    component: () => import('../components/Layout/StudentLayout.vue'),
    meta: { requiresAuth: true, roles: ['student'] },
    children: [
      {
        path: 'dashboard',
        name: 'StudentDashboard',
        component: () => import('../pages/student/Dashboard.vue')
      },
      {
        path: 'health-data',
        name: 'StudentHealthData',
        component: () => import('../pages/student/HealthData.vue')
      },
      {
        path: 'exercise-report',
        name: 'StudentExerciseReport',
        component: () => import('../pages/student/ExerciseReport.vue')
      },
      {
        path: 'data-analysis',
        name: 'StudentDataAnalysis',
        component: () => import('../pages/student/DataAnalysis.vue')
      },
      {
        path: 'profile',
        name: 'StudentProfile',
        component: () => import('../pages/student/Profile.vue')
      },
      {
        path: 'multi-heart-monitor',
        name: 'MultiHeartMonitor',
        component: () => import('../pages/student/MultiHeartMonitor.vue')
      }
    ]
  },
  // 班主任端路由
  {
    path: '/teacher',
    name: 'TeacherLayout',
    component: () => import('../components/Layout/TeacherLayout.vue'),
    meta: { requiresAuth: true, roles: ['teacher'] },
    children: [
      {
        path: 'dashboard',
        name: 'TeacherDashboard',
        component: () => import('../pages/teacher/Dashboard.vue')
      },
      {
        path: 'class-data',
        name: 'TeacherClassData',
        component: () => import('../pages/teacher/ClassData.vue')
      },
      {
        path: 'exercise-reports',
        name: 'TeacherExerciseReports',
        component: () => import('../pages/teacher/ExerciseReports.vue')
      },
      {
        path: 'student-management',
        name: 'TeacherStudentManagement',
        component: () => import('../pages/teacher/StudentManagement.vue')
      },
      {
        path: 'device-management',
        name: 'TeacherDeviceManagement',
        component: () => import('../pages/teacher/DeviceManagement.vue')
      },
      {
        path: 'training-module',
        name: 'TeacherTrainingModule',
        component: () => import('../pages/teacher/TrainingModule.vue')
      },
      {        path: 'training-report',        name: 'TeacherTrainingReport',        component: () => import('../pages/teacher/TrainingReport.vue')      },      {        path: 'data-statistics',        name: 'TeacherDataStatistics',        component: () => import('../pages/teacher/data-statistics.vue')      },      {        path: 'data-management',        name: 'TeacherDataManagement',        component: () => import('../pages/teacher/data-management.vue')      },      {        path: 'realtime-monitoring',        name: 'TeacherRealtimeMonitoring',        component: () => import('../pages/teacher/realtime-monitoring.vue')      },      {        path: 'data-analysis',        name: 'TeacherDataAnalysis',        component: () => import('../pages/teacher/data-analysis.vue')      }    ]
  },
  // 管理员端路由
  {
    path: '/admin',
    name: 'AdminLayout',
    component: () => import('../components/Layout/AdminLayout.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../pages/admin/Dashboard.vue')
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../pages/admin/Users.vue')
      },
      {
        path: 'devices',
        name: 'AdminDevices',
        component: () => import('../pages/admin/Devices.vue')
      },
      {
        path: 'device-manage',
        name: 'AdminDeviceManage',
        component: () => import('../pages/admin/DeviceManage.vue')
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('../pages/admin/Settings.vue')
      },
      {
        path: 'device-monitor',
        name: 'AdminDeviceMonitor',
        component: () => import('../pages/admin/DeviceMonitor.vue')
      },
      {
        path: 'data-storage',
        name: 'AdminDataStorage',
        component: () => import('../pages/admin/DataStorage.vue')
      },
      {
        // 兼容旧路径 /admin/system-settings -> 重定向到 /admin/settings
        path: 'system-settings',
        redirect: 'settings'
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../pages/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const currentUser = JSON.parse(localStorage.getItem('user'))
  console.log('路由守卫检查:', { to: to.path, requiresAuth, currentUser: currentUser ? currentUser.role : null })

  if (requiresAuth && !currentUser) {
    console.log('未登录，重定向到登录页')
    next('/login')
  } else if (requiresAuth && to.meta.roles && currentUser && !to.meta.roles.includes(currentUser.role)) {
    console.log('角色不匹配，重定向到对应首页')
    // 根据角色重定向到对应首页
    switch (currentUser.role) {
      case 'student':
        next('/student/dashboard')
        break
      case 'teacher':
        next('/teacher/dashboard')
        break
      case 'admin':
        next('/admin/dashboard')
        break
      default:
        next('/login')
    }
  } else {
    console.log('通过路由守卫检查')
    next()
  }
})

export default router