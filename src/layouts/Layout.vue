<!--
 * @Author: hiddenSharp429 z404878860@163.com
 * @Date: 2024-10-28 20:13:49
 * @LastEditors: hiddenSharp429 z404878860@163.com
 * @LastEditTime: 2024-11-29 17:01:08
-->
<script setup>
import { store } from "../stores/store";
import { toRef, onMounted, onBeforeUnmount, ref, reactive, provide, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import axios from "axios";
import { ElNotification } from "element-plus";
import Friends from "../components/Friends/Friends.vue";

const router = useRouter();
const route = useRoute();
const isLoggedIn = toRef(store, "isLoggedIn");
const avatarUrl = toRef(store, "avatarUrl");
const nickname = toRef(store, "nickname");
const userInfo = reactive({
  isLoggedIn,
  avatarUrl,
  nickname
})
let isShow=ref(false)
provide('userInfo',userInfo)

const checkTokenExpiration = () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    // JWT token consists of three parts separated by dots
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds

    if (Date.now() >= expirationTime) {
      logout();
      ElNotification({
        title: "会话过期",
        message: "登录已过期，请重新登录",
        type: "warning",
        duration: 3000,
      });
    }
  } catch (error) {
    console.error('Token validation error:', error);
    logout();
  }
}

// Check token every minute
let tokenCheckInterval;

onMounted(() => {
  // Initial check
  checkTokenExpiration();
  // Set up periodic checks
  tokenCheckInterval = setInterval(checkTokenExpiration, 60000);
});

onBeforeUnmount(() => {
  if (tokenCheckInterval) {
    clearInterval(tokenCheckInterval);
  }
});

const logout = () => {
  localStorage.removeItem('token')
  delete axios.defaults.headers.common['Authorization']
  store.isLoggedIn = false
  ElNotification({
    title: '退出账号',
    message: '你成功的退出的账号',
    type: 'success',
    duration: 1500,
  });
  router.push('/auth')
}

const isSidebarExpanded = ref(false)
const showSidebar = ref(false) // 控制侧边栏是否显示

// 监听登录状态变化
watch(() => store.isLoggedIn, (newValue) => {
  if (newValue) {
    // 登录后，延迟显示侧边栏，配合动画效果
    setTimeout(() => {
      showSidebar.value = true
    }, 100)
  } else {
    // 登出时立即隐藏侧边栏
    showSidebar.value = false
    isSidebarExpanded.value = false
  }
}, { immediate: true })

const currentRoute = computed(() => route.path)

const menuItems = [
  { path: '/game-lobby', label: '游戏大厅', icon: 'sports_esports' },
  { path: '/personal', label: '个人中心', icon: 'person' },
  { path: '/settings', label: '设置', icon: 'settings' },
]

const expandSidebar = () => {
  isSidebarExpanded.value = true
}

const collapseSidebar = () => {
  isSidebarExpanded.value = false
}
</script>

<template>
  <div class="app-layout">
    <!-- Header -->
    <header class="header">
      <nav>
        <router-link to="/" class="logo" data-text="Type Shi(f)t Arena">
          Type Shi(f)t Arena
        </router-link>
        <div class="nav-links">
          <template v-if="!isLoggedIn">
            <router-link to="/auth">登录/注册</router-link>
          </template>
          <template v-else>
            <div class="user-info">
                <div class="user-avatar">
                  <img id="userAvatar" :src="avatarUrl" :alt="nickname" />
                </div>
                <span class="user-nickname">{{ nickname }}</span>
              </div>

            <a @click="logout" class="logout-btn">注销</a>
            <div class="friends" @click="isShow = !isShow">
              <span>好友列表</span>
              <right-outlined class="friends-svg" />                         
            </div>
            <Friends v-if="isShow" ></Friends>  
          </template> 
        </div>
      </nav>
    </header>

    <!-- Main Content with Sidebar -->
    <div class="main-container">
      <!-- Collapsible Sidebar -->
      <transition name="sidebar">
        <div 
          v-if="showSidebar"
          class="sidebar" 
          :class="{ 'expanded': isSidebarExpanded }"
          @mouseenter="expandSidebar"
          @mouseleave="collapseSidebar"
        >
          <div class="sidebar-content">
            <router-link 
              v-for="item in menuItems" 
              :key="item.path"
              :to="item.path"
              class="menu-item"
              :class="{ active: currentRoute === item.path }"
            >
              <span class="material-icons">{{ item.icon }}</span>
              <span class="menu-text">{{ item.label }}</span>
            </router-link>
          </div>
        </div>
      </transition>

      <!-- Main Content Area -->
      <main class="content" :class="{ 'with-sidebar': showSidebar }">
        <router-view></router-view>
      </main>
    </div>

    <!-- Footer -->
    <footer class="footer">
      <span class="footer-logo">Type Shift Arena</span>
      <span class="footer-cr">Copyright (c) 2024 Type Shift Arena</span>
      <a href="https://beian.miit.gov.cn/" target="_blank" class="footer-link">粤ICP备2024219097号-3</a>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--primary-dark);
}

/* Header Styles */
.header {
  position: fixed; /* 固定定位 */
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000; /* 确保在最上层 */
  background-color: var(--secondary-dark);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  padding: 1rem;
  color: var(--text-primary);
}

nav {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.8rem;
  font-weight: bold;
  font-family: 'Russo One', sans-serif;
  color: transparent;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  background-size: 200% auto;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 2px;
  position: relative;
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--gradient-secondary);
    -webkit-background-clip: text;
    background-clip: text;
    filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.3));
  }
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-links a {
  text-decoration: none;
  color: white;
}

.nav-links a:hover {
  text-decoration: underline;
}

.logout-btn {
  color: white;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  position: relative;
}

.user-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--accent-color);
  box-shadow: var(--shadow-sm);
  
  &:hover {
    border-color: var(--accent-hover);
  }
}

.user-nickname {
  color: #fff;
  font-weight: bold;
}

/* Sidebar Styles */
.main-container {
  display: flex;
  flex: 1;
  position: relative;
}

.sidebar {
  position: fixed;
  height: 80vh;
  top: 90px;
  left: 0;
  width: 70px;
  background-color: var(--secondary-dark);
  transition: all 0.3s ease;
  overflow: hidden;
  box-shadow: var(--shadow-md);
  z-index: 100;
}

.sidebar.expanded {
  width: 240px;
}

.sidebar-content {
  padding: 1rem 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  color: var(--text-secondary);
  transition: all 0.3s ease;
  margin: 0.5rem;
  border-radius: 8px;
  
  &:hover {
    background-color: var(--accent-dark);
  }
  
  &.active {
    background: var(--gradient-primary);
    box-shadow: var(--shadow-sm);
  }
}

.menu-item .material-icons {
  margin-right: 1rem;
  font-size: 24px;
  transition: transform 0.3s ease;
}

.menu-item:hover .material-icons {
  transform: scale(1.1);
}

.menu-text {
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.sidebar.expanded .menu-text {
  opacity: 1;
}

/* Content Area */
.content {
  flex: 1;
  transition: all 0.5s ease;
  padding: 2rem;
}

.content.with-sidebar {
  margin-left: 60px; /* 默认侧边栏宽度 */
}

.sidebar.expanded + .content.with-sidebar {
  margin-left: 240px; /* 展开时的侧边栏宽度 */
}

/* Footer Styles */
.footer {
  background-color: var(--secondary-dark);
  border-top: 1px solid var(--border-color);
  backdrop-filter: blur(10px);
  padding: 0.3rem;
  color: white;
  text-align: center;
  position: fixed;
  bottom: 0;
  width: 100%;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .footer-logo {
    font-family: "Lobster", cursive;
    color: transparent;
    font-size: 1rem;
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    background-clip: text;
  }
  
  .footer-cr {
    font-size: 0.5rem;
  }
  
  .footer-link {
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 0.5rem;
    margin-top: 0.1rem;
    
    &:hover {
      color: var(--accent-color);
    }
  }
}

/* 添加全局过渡效果 */
* {
  transition: all 0.3s ease;
}

/* 添加毛玻璃效果 */
.header, .sidebar, .footer {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.menu-item {
  .material-icons {
    transition: transform 0.3s ease;
  }
  
  &:hover .material-icons {
    transform: scale(1.1);
  }
}

/* 侧边栏过渡动画 */
.sidebar-enter-active,
.sidebar-leave-active {
  transition: all 0.5s ease;
}

.sidebar-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.sidebar-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .content.with-sidebar {
    margin-left: 0;
  }
  
  .sidebar {
    transform: translateX(-100%);
  }
  
  .sidebar.expanded {
    transform: translateX(0);
  }
}
</style>
