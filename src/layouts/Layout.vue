<!--
 * @Author: hiddenSharp429 z404878860@163.com
 * @Date: 2024-10-28 20:13:49
 * @LastEditors: hiddenSharp429 z404878860@163.com
 * @LastEditTime: 2024-11-03 16:23:30
-->
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const isLoggedIn = ref(false)

// 在组件挂载时检查登录状态
onMounted(() => {
  isLoggedIn.value = !!localStorage.getItem('token')
})

const logout = () => {
  localStorage.removeItem('token')
  // 清除 axios 默认 header
  delete axios.defaults.headers.common['Authorization']
  isLoggedIn.value = false
  router.push('/auth')
}
</script>

<template>
  <div class="app-container">
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
            <router-link to="/game-lobby">游戏大厅</router-link>
            <a @click="logout" class="logout-btn">退出</a>
            <router-link to="/settings" class="settings-link">
              <span class="material-icons">settings</span>
            </router-link>
          </template>
        </div>
      </nav>
    </header>

    <main class="main-content">
      <router-view></router-view>
    </main>

    <footer class="footer">
      <p>© Type Shift Arena 2024</p>
    </footer>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: #2c3e50;
  padding: 1rem;
  color: white;
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
  background: linear-gradient(to right, #ffffff, #f3f3f3, #ffffff);
  -webkit-background-clip: text;
  background-clip: text;
  background-size: 200% auto;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 2px;
  position: relative;
  transition: all 0.3s ease;
}


.logo:hover {
  transform: scale(1.05);
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.6));
  background: linear-gradient(
    to right, 
    #f3f3f3,
    #ffffff
  );
  -webkit-background-clip: text;
  background-clip: text;
}

.nav-links {
  display: flex;
  gap: 1rem;
}

.nav-links a {
  text-decoration: none;
  color: white;
}

.nav-links a:hover {
  text-decoration: underline;
}

.footer {
  background-color: #2c3e50;
  padding: 1rem;
  color: white;
  text-align: center;
  position: fixed;
  bottom: 0;
  width: 100%;
}

.logout-btn {
  color: white;
}

.settings-link {
  display: flex;
  align-items: center;
  padding: 0 15px;
  color: #666;
  transition: color 0.2s;
  text-decoration: none !important;
}

.settings-link:hover {
  color: #333;
  text-decoration: none !important;
  opacity: 0.5; /* 可以添加一个透明度变化来表示悬停效果 */
}

.settings-link .material-icons {
  font-size: 24px;
  color: white;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 20px;
}
</style>
