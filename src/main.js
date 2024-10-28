/*
 * @Author: hiddenSharp429 z404878860@163.com
 * @Date: 2024-10-28 19:44:55
 * @LastEditors: hiddenSharp429 z404878860@163.com
 * @LastEditTime: 2024-10-28 21:37:58
 */
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import { API_BASE_URL } from '@/config'

// 配置 axios 默认值
axios.defaults.baseURL = API_BASE_URL
const token = localStorage.getItem('token')
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

const app = createApp(App)
app.use(router)
app.mount('#app')
