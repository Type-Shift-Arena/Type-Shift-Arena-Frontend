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
import { createI18n } from 'vue-i18n' // Use vue-i18n for Vue 3
import { API_BASE_URL } from '@/config'
import en from './locales/en.json'
import zh from './locales/zh.json'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL
const token = localStorage.getItem('token')
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Create i18n instance
const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: 'zh',
  messages: {
    en,
    zh
  }
})

// Create Vue app
const app = createApp(App)
app.use(router)
app.use(i18n)
app.use(ElementPlus)
app.mount('#app')

console.log('Current Environment:', import.meta.env.MODE)
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL)
console.log('WebSocket URL:', import.meta.env.VITE_WS_URL)

