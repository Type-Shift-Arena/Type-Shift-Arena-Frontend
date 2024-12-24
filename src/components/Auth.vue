<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '@/config'
import axios from 'axios'
import { store } from '../stores/store'
import { ElNotification } from 'element-plus';

const router = useRouter()
const isRightPanelActive = ref(false)

const signin = ref({
  username: '',
  password: ''
})

const signup = ref({
  username: '',
  password: '',
  password_confirm: '',
  email: ''
})

const signUp = () => {
  document.getElementById('container').classList.add("right-panel-active")
  isRightPanelActive.value = true
}

const signIn = () => {
  document.getElementById('container').classList.remove("right-panel-active")
  isRightPanelActive.value = false
}

const doSignIn = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: signin.value.username,
        password: signin.value.password
      })
    })
    const data = await response.json()
    if (data.token) {
      console.log(data)
      localStorage.setItem('token', data.token)
      localStorage.setItem('userName', data.username)
      localStorage.setItem('userId', data.userId)
      localStorage.setItem('imgSrc', data.imgSrc)
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
      store.isLoggedIn = true
      ElNotification({
        title: '登录成功',
        message: '您已成功登录',
        type: 'success',
        duration: 1500,
      });
      router.push('/')
    } else {
      ElNotification({
        title: '登录失败',
        message: data.message,
        type: 'error',
        duration: 1500,
      });
    }
  } catch (error) {
    console.error('Login failed:', error)
    ElNotification({
        title: '登录失败，请稍后再试',
        message: error,
        type: 'error',
        duration: 1500,
    });
  }
}

const doSignUp = async () => {
  if (signup.value.password !== signup.value.password_confirm) {
    ElNotification({
        title: '两次输入的密码不一致',
        type: 'error',
        duration: 1500,
    });
    return
  }
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: signup.value.username,
        password: signup.value.password,
        email: signup.value.email
      })
    })
    const data = await response.json()
    if (response.ok) {
      ElNotification({
        title: '注册成功',
        message: '您已成功注册，正在自动登录',
        type: 'success',
        duration: 1500,
      });
      signin.value.username = signup.value.username
      signin.value.password = signup.value.password
      await doSignIn()
    }else {
      ElNotification({
        title: '注册失败',
        message: data.message,
        type: 'error',
        duration: 1500,
      });
    }
  } catch (error) {
    console.error('Registration failed:', error)
    ElNotification({
        title: '注册失败，请稍后重试',
        message: error,
        type: 'error',
        duration: 1500,
    });
  }
}
</script>

<template>
  <div class="auth">
    <div class="container" id="container">
      <div class="form-container sign-up-container">
        <form @submit.prevent="doSignUp">
          <h1>创建新账号</h1>
          <span>请填写下面的信息开始游戏吧 &#128512;</span>
          
          <label class="form-input">
            <i class="material-icons">person</i>
            <input type="text" required v-model="signup.username" />
            <span class="label">用户名</span>
            <span class="underline"></span>
          </label>

          <label class="form-input">
            <i class="material-icons">email</i>
            <input type="email" required v-model="signup.email" />
            <span class="label">邮箱</span>
            <span class="underline"></span>
          </label>

          <label class="form-input">
            <i class="material-icons">lock</i>
            <input type="password" required v-model="signup.password" />
            <span class="label">密码</span>
            <div class="underline"></div>
          </label>

          <label class="form-input">
            <i class="material-icons">lock</i>
            <input type="password" required v-model="signup.password_confirm" />
            <span class="label">确认密码</span>
            <div class="underline"></div>
          </label>

          <button type="submit">注册</button>
        </form>
      </div>

      <div class="form-container sign-in-container">
        <form @submit.prevent="doSignIn">
          <h1>登录</h1>
          <span>请输入您的账号密码 &#128516;</span>

          <label class="form-input">
            <i class="material-icons">person</i>
            <input type="text" required v-model="signin.username" />
            <span class="label">用户名</span>
            <span class="underline"></span>
          </label>

          <label class="form-input">
            <i class="material-icons">lock</i>
            <input type="password" required v-model="signin.password" />
            <span class="label">密码</span>
            <div class="underline"></div>
          </label>

          <a href="#">忘记密码?</a>
          <button type="submit">登录</button>
        </form>
      </div>

      <div class="overlay-container">
        <div class="overlay">
          <div class="overlay-panel overlay-left">
            <h1>欢迎回来！</h1>
            <p>请登录您的账号开始游戏吧</p>
            <button class="ghost" @click="signIn">登录</button>
          </div>
          <div class="overlay-panel overlay-right">
            <h1>你好！</h1>
            <p>注册一个新账号开始打字对战吧！</p>
            <button class="ghost" @click="signUp">注册</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css?family=Montserrat:400,800');
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

* {
  box-sizing: border-box;
}

.auth {
  background: var(--primary-dark);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  font-family: 'Montserrat', sans-serif;
  height: 80vh;
  margin: 0;
}

.container {
  background-color: var(--secondary-dark);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;
  width: 768px;
  max-width: 100%;
  min-height: 600px;
  border: 1px solid var(--border-color);
}

.form-container {
  position: absolute;
  top: 0;
  height: 100%;
  transition: all 0.6s ease-in-out;
}

.sign-in-container {
  left: 0;
  width: 50%;
  z-index: 2;
}

.sign-up-container {
  left: 0;
  width: 50%;
  opacity: 0;
  z-index: 1;
}

form {
  background-color: var(--secondary-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 0 50px;
  height: 100%;
  text-align: center;
}

h1 {
  color: var(--text-primary);
  margin: 0;
  font-weight: bold;
}

p, span {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0.5px;
  margin: 20px 0 30px;
}

.form-input {
  position: relative;
  margin: 1rem 0;
  width: 100%;
}

.form-input input {
  background-color: var(--accent-dark);
  border: none;
  border-radius: 8px;
  padding: 12px 15px;
  padding-left: 40px;
  margin: 8px 0;
  width: 100%;
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.form-input input:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--accent-color);
}

.form-input .material-icons {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--accent-color);
  font-size: 20px;
  z-index: 1;
}

button {
  border-radius: 20px;
  border: 1px solid var(--accent-color);
  background-color: var(--accent-color);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: bold;
  padding: 12px 45px;
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: transform 80ms ease-in;
  cursor: pointer;
}

button:active {
  transform: scale(0.95);
}

button:focus {
  outline: none;
}

button.ghost {
  background-color: transparent;
  border-color: var(--text-primary);
}

button:hover {
  background-color: var(--accent-hover);
  border-color: var(--accent-hover);
}

button.ghost:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.overlay-container {
  position: absolute;
  top: 0;
  left: 50%;
  width: 50%;
  height: 100%;
  overflow: hidden;
  transition: transform 0.6s ease-in-out;
  z-index: 100;
}

.overlay {
  background: var(--gradient-primary);
  background-repeat: no-repeat;
  background-size: cover;
  background-position: 0 0;
  color: var(--text-primary);
  position: relative;
  left: -100%;
  height: 100%;
  width: 200%;
  transform: translateX(0);
  transition: transform 0.6s ease-in-out;
}

.overlay-panel {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 0 40px;
  text-align: center;
  top: 0;
  height: 100%;
  width: 50%;
  transform: translateX(0);
  transition: transform 0.6s ease-in-out;
}

.overlay-left {
  transform: translateX(-20%);
}

.overlay-right {
  right: 0;
  transform: translateX(0);
}

.container.right-panel-active .sign-in-container {
  transform: translateX(100%);
}

.container.right-panel-active .sign-up-container {
  transform: translateX(100%);
  opacity: 1;
  z-index: 5;
  animation: show 0.6s;
}

.container.right-panel-active .overlay-container {
  transform: translateX(-100%);
}

.container.right-panel-active .overlay {
  transform: translateX(50%);
}

.container.right-panel-active .overlay-left {
  transform: translateX(0);
}

.container.right-panel-active .overlay-right {
  transform: translateX(20%);
}

@keyframes show {
  0%, 49.99% {
    opacity: 0;
    z-index: 1;
  }
  50%, 100% {
    opacity: 1;
    z-index: 5;
  }
}

a {
  color: var(--accent-color);
  font-size: 14px;
  text-decoration: none;
  margin: 15px 0;
  transition: color 0.3s ease;
}

a:hover {
  color: var(--accent-hover);
}

.form-input .label {
  position: absolute;
  left: 40px; /* 与图标对齐 */
  top: 20%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  transition: all 0.3s ease;
  pointer-events: none;
  padding: 0 4px;
  background-color: transparent;
  font-size: 14px;
}

.form-input input:focus ~ .label,
.form-input input:valid ~ .label {
  top: 0;
  font-size: 12px;
  color: var(--accent-color);
  background-color: var(--accent-dark);
  transform: translateY(-50%) scale(0.85);
}

.error-message {
  color: var(--danger-color);
  font-size: 12px;
  margin-top: 5px;
}

button.loading {
  position: relative;
  color: transparent;
}

button.loading::after {
  content: "";
  position: absolute;
  width: 16px;
  height: 16px;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: auto;
  border: 3px solid transparent;
  border-top-color: var(--text-primary);
  border-radius: 50%;
  animation: button-loading-spinner 1s ease infinite;
}

@keyframes button-loading-spinner {
  from {
    transform: rotate(0turn);
  }
  to {
    transform: rotate(1turn);
  }
}
</style>
