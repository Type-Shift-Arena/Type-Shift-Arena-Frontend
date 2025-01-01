/*
 * @Author: hiddenSharp429 z404878860@163.com
 * @Date: 2024-10-28 19:44:55
 * @LastEditors: hiddenSharp429 z404878860@163.com
 * @LastEditTime: 2024-11-29 16:06:29
 */
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import i18n from './i18n' // 导入新的 i18n 配置
import { API_BASE_URL } from '@/config'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import * as Icons from '@ant-design/icons-vue'

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL
const token = localStorage.getItem('token')
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Create Vue app
const app = createApp(App)
app.use(router)
app.use(i18n)
app.use(ElementPlus)
app.use(router)
app.use(Antd)
Object.keys(Icons).forEach((key) => {
  app.component(key, Icons[key]);
});
app.mount('#app')

console.log('Current Environment:', import.meta.env.MODE)
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL)
console.log('WebSocket URL:', import.meta.env.VITE_WS_URL)
