<!--
 * @Author: hiddenSharp429 z404878860@163.com
 * @Date: 2024-10-28 20:13:49
 * @LastEditors: hiddenSharp429 z404878860@163.com
 * @LastEditTime: 2024-11-29 16:09:52
-->
<script setup>
import { store } from '../stores/store';
import { toRef } from 'vue';
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElNotification } from 'element-plus';

const router = useRouter()
const isLoggedIn = toRef(store, 'isLoggedIn');

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
            <router-link to="/personal">个人中心</router-link>
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
      <span class="footer-logo">Type Shift Arena</span>
      <span class="footer-cr">Copyright (c) 2024 Type Shift Arena</span>
      <a href="https://beian.miit.gov.cn/" target="_blank" class="footer-link">粤ICP备2024219097号-3</a>
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
}

.footer-logo {
  font-family: 'Lobster', cursive;
  color: #ffffff;
  font-size: 1.0rem;
}

.footer-cr {
  font-size: 0.5rem;
}


.footer-link {
  color: gray;
  text-decoration: none;
  font-size: 0.5rem;
  margin-top: 0.1rem;
}

.footer-link:hover {
  text-decoration: underline;
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
