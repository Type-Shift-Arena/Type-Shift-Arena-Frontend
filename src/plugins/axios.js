/*
 * @Author: hiddenSharp429 z404878860@163.com
 * @Date: 2024-12-26 06:38:20
 */
import axios from 'axios'
import { ElNotification } from 'element-plus'

// 创建 axios 实例
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  withCredentials: true,  // 允许跨域请求携带认证信息
})

// 请求拦截器
instance.interceptors.request.use(
  config => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
      // console.log('Request headers:', config.headers)
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未认证，跳转到登录页
          ElNotification({
            title: '认证失败',
            message: '请重新登录',
            type: 'info'
          })
          router.push('/login')
          break
        case 403:
          // 权限不足
          ElNotification({
            title: '错误',
            message: '您没有权限执行此操作',
            type: 'error'
          })
          break
      }
    }
    return Promise.reject(error)
  }
)

export default instance