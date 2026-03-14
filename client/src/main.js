import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as echarts from 'echarts'

import request from './utils/request'

const app = createApp(App)

// 将axios挂载到Vue原型
app.config.globalProperties.$axios = request
// 将echarts挂载到Vue原型
app.config.globalProperties.$echarts = echarts

app.use(router)
app.use(ElementPlus)
app.mount('#app')