import axios from 'axios'
import router from '../router'

// 创建axios实例
const request = axios.create({
  baseURL: '', // 使用相对路径，Vite代理会处理
  timeout: 10000 // 请求超时时间
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    console.log('Request:', config.method.toUpperCase(), config.url, 'Params:', config.params, 'Headers:', config.headers)
    // 添加token到请求头
    const token = localStorage.getItem('token')
    console.log('Token from localStorage:', token)
    token && (config.headers.Authorization = `Bearer ${token}`)
    return config
  },
  error => {
    console.error('Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    console.log('Response:', response.status, response.data)
    return response
  },
  error => {
    console.error('Response Error:', error.response?.status, error.response?.data, error.message)
    if (error.response?.status === 401) {
      // token过期或无效，跳转到登录页
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

export default request
