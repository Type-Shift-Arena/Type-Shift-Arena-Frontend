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


h1 {
  font-weight: bold;
  margin: 0;
}


p {
  font-size: 14px;
  font-weight: 100;
  line-height: 20px;
  letter-spacing: 0.5px;
  margin: 20px 0 30px;
}

span {
  font-size: 12px;
}

a {
  color: #333;
  font-size: 14px;
  text-decoration: none;
  margin: 15px 0;
}

button {
  border-radius: 20px;
  border: 1px solid #ADC2B5;
  background-color: #2c3e50;;
  color: #FFFFFF;
  font-size: 12px;
  font-weight: bold;
  padding: 12px 65px;
  margin-top: 2rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: transform 80ms ease-in;
}

button:active {
  transform: scale(0.95);
}

button:focus {
  outline: none;
}

button.ghost {
  background-color: transparent;
  border-color: #FFFFFF;
}

form {
  background-color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 0 50px;
  height: 100%;
  text-align: center;
}


.form-input {
  margin-top: 1rem;
  margin-bottom: 1rem;
  position: relative;
  display: block;
}

.form-input>.material-icons {
  position: absolute;
  font-size: 1.5rem;
  top: 1.2rem;
  left: -2.2rem;
}

.form-input input {
  border: none;
  box-shadow: none;
  padding-top: 1.5rem;
  padding-right: 0;
  padding-bottom: .5rem;
  padding-left: 0;
  outline-style: none;
  width: 100%;
  border-bottom: 2px solid #2c292a;
}

.form-input input~.label {
  color: #868e96;
  font-size: 1rem;
  margin: 0;
  pointer-events: none;
  position: absolute;
  top: 1.5rem;
  left: 0;
  transition: top .2s, font .2s;
  z-index: 1;
}


.form-input input:hover,
.form-input input:focus {
  outline: none;
}

.form-input input:focus~.underline {
  background-color: color("irenic");
  /* Note: replace with the actual color value */
}

.form-input input:focus~.label,
.form-input input:valid~.label {
  top: 0;
  font-size: .85rem;
}


.sign {
  background: #f6f5f7;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  font-family: 'Montserrat', sans-serif;
  height: 95vh;
  margin: -20px 0 50px;
}

.container {
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25),
    0 10px 10px rgba(0, 0, 0, 0.22);
  position: relative;
  overflow: hidden;
  width: 768px;
  max-width: 100%;
  min-height: 480px;
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

.container.right-panel-active .sign-in-container {
  transform: translateX(100%);
}

.sign-up-container {
  left: 0;
  width: 50%;
  opacity: 0;
  z-index: 1;
}

.container.right-panel-active .sign-up-container {
  transform: translateX(100%);
  opacity: 1;
  z-index: 5;
  animation: show 0.6s;
}

@keyframes show {

  0%,
  49.99% {
    opacity: 0;
    z-index: 1;
  }

  50%,
  100% {
    opacity: 1;
    z-index: 5;
  }
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

.container.right-panel-active .overlay-container {
  transform: translateX(-100%);
}

.overlay {
  background: #2c3e50;
  background: -webkit-linear-gradient(to right, #2c3e50, #abacac);
  background: linear-gradient(to right, #2c3e50, #abacac);
  background-repeat: no-repeat;
  background-size: cover;
  background-position: 0 0;
  color: #FFFFFF;
  position: relative;
  left: -100%;
  height: 100%;
  width: 200%;
  transform: translateX(0);
  transition: transform 0.6s ease-in-out;
}

.container.right-panel-active .overlay {
  transform: translateX(50%);
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

.container.right-panel-active .overlay-left {
  transform: translateX(0);
}

.overlay-right {
  right: 0;
  transform: translateX(0);
}

.container.right-panel-active .overlay-right {
  transform: translateX(20%);
}

.social-container {
  margin: 20px 0;
}

.social-container a {
  border: 1px solid #DDDDDD;
  border-radius: 50%;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  margin: 0 5px;
  height: 40px;
  width: 40px;
}

.auth {
  background: #f6f5f7;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  font-family: 'Montserrat', sans-serif;
  height: 90vh;
  margin: 0;
}

.title {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #2c3e50;
}

/* 其余样式保持不变 */
</style>
