<script setup>
import { onMounted, ref, reactive } from 'vue';
import gifImg from '@/assets/images/merged.gif';
import axios from '@/plugins/axios.js';
import { API_BASE_URL, IMG_BB_API_KEY } from '@/config'
import {store} from "../stores/store.js";
import { ElNotification } from 'element-plus';
import MatchHistoryCard from '@/components/MatchHistoryCard.vue';

const userId = localStorage.getItem('userId');
const fileInput = ref(null); // 添加文件输入引用

const userInfo = reactive({
  username: '',
  password: '',
  email: '',
  imgSrc: '',
  createdAt: '',
  updatedAt: '',
});

const playerProfile = reactive({
  userLevel: '',
  win: '',
  speed: '',
  winRate: '',
  accuracyRate: '',
  totalMatchesPlayed: '',
  totalWins: '',
  highestWpm: '',
  casualWinRate: '',
  casualAvgWpm: '',
  casualAvgAccuracy: '',
  rankScore: '',
});

const newUserInfo = reactive({
  username: '',
  email: '',
});

const nPassword = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const isEditing = ref(false);
const isEditingP = ref(false);

const errorMessages = reactive({
  errorOne: false,
  errorTwo: false,
});

const matchHistory = reactive({
  matches: []
});

const getData = async () => {
  try {
    if (!userId) {
      throw new Error('无法获取用户ID');
    }
    // 获取用户数据
    const userResponse = await axios.get(`${API_BASE_URL}/users/${userId}`);
    const userData = userResponse.data.data;
    console.log(userData);
    Object.assign(userInfo, userData);
    Object.assign(newUserInfo, userInfo);

    // 获取玩家数据
    const playerResponse = await axios.get(`${API_BASE_URL}/players/${userId}`);
    const playerData = playerResponse.data.data;
    console.log(playerData);
    Object.assign(playerProfile, playerData);

    // 获取历史比赛数据
    const matchResponse = await axios.get(`${API_BASE_URL}/matches/player/${userId}`);
    const matchData = matchResponse.data.data;
    console.log('Match history:', matchData);
    matchHistory.matches = matchData;
  } catch (error) {
    console.error(error);
  }
};

const triggerFileInput = () => {
  // 触发文件输入元素的点击事件
  fileInput.value.click();
  console.log(1)
}

const handleFileChange = async (event) => {
  const file = event.target.files[0]; //获取用户选择的文件
  if (file) {
    console.log('上传');
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      userInfo.imgSrc = e.target.result;
    };
    await handleAvatarUpload(file);
  }
}

const handleAvatarUpload = async (file) => {
  if (!file || !userId) return;
  try {
    userInfo.imgSrc = URL.createObjectURL(file);
    
    const formData = new FormData();
    formData.append('image', file);

    console.log('Uploading file:', file.name, file.type, file.size);
    ElNotification({
      title: '上传头像文件中',
      message: `Uploading file: ${file.name}, ${file.type}, ${file.size}`,
      type: 'info',
      duration: 4000,
    });

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMG_BB_API_KEY}`, {
      method: 'POST',
      body: formData,
      headers: {
          'Accept': 'application/json'
      }
    });


    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed:', response.status, errorText);
      ElNotification({
        title: '上传头像失败',
        message: `Upload failed: ${response.status}, ${errorText}`,
        type: 'error',
        duration: 3000,
      });
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();

    console.log(data)

    if (data.success) {
      ElNotification({
        title: '上传图床成功',
        message: `Upload success: ${data.data.status}, ${data.data.url}`,
        type: 'success',
        duration: 1500,
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      ElNotification.closeAll();
      ElNotification({
        title: '更新头像URL中',
        message: 'Updating imgSrc',
        type: 'info',
        duration: 2000,
      });

      const backend_response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...userInfo,
          imgSrc: data.data.url
        })
      })

      const backend_data = await backend_response.json()
      console.log(backend_data.id)
      // 更新localStorage中的imgSrc
      localStorage.setItem('imgSrc', backend_data.imgSrc)
      store.avatarUrl = backend_data.imgSrc
      ElNotification({
        title: '更新头像URL成功',
        message: 'Update imgSrc success',
        type: 'success',
        duration: 1500,
      });
    } 
    else {
        throw new Error('Upload failed: ' + (data.error?.message || 'Unknown error'));
    }
  } 
  catch (error) {
    console.error('头像上传失败:', error);
    alert('头像上传失败，请重试');
  }
}

const handleClick = (event) => {
  document.querySelectorAll('.box-right').forEach(item => item.classList.remove('active'));
  document.querySelectorAll('.box-left li').forEach(item => item.classList.remove('active'));

  const targetId = event.target.getAttribute('data-target');
  const targetContent = document.getElementById(targetId);

  if (targetContent) {
    event.target.classList.add('active');
    targetContent.classList.add('active');
  }
}

const editUserInfo = (value) => {
  if (value==='info') {
    newUserInfo={...userInfo};// 初始化 newUserInfo
    isEditing=true;
  }
  else if(value==='password'){
    nPassword= {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    isEditingP=true;
  }
}

const closeEdit = () => {
  isEditing=false;
  isEditingP=false;
}

const saveUserInfo = async (value) => {
  try {
    if (value==='info') {
      const updateData = {
        username: newUserInfo.username,
        email: newUserInfo.email,
      };
      await axios.put(`${API_BASE_URL}/users/${userId}`, updateData);
      
      userInfo = { ...updateData };
      alert('更新成功！')
      isEditing = false;
    } 
    else if(value==='password'){
      const updatePassword = {
        oldPassword: nPassword.oldPassword,
        newPassword: nPassword.newPassword,
        confirmPassword: nPassword.confirmPassword,
      };
      await axios.put(`${API_BASE_URL}/users/${userId}/password`, updatePassword);
      
      alert("更新密码成功！")
      isEditingP = false;
    } 
    window.location.reload(); // 刷新页面
  }
  catch (error) {
    const responseP = error.response.data
    if (responseP === '旧密码不正确') {
      errorMessages.errorOne=true
    }else if (responseP === '两次新密码不一致') {
      errorMessages.errorTwo=true
    }
    validateInputs(responseP);
  }
}

const validateInputs = (responseP) => {
  // 检查旧密码是否正确
  if (responseP==='旧密码不正确') {
    errorMessages.errorOne = true
    const oldInput=document.getElementById('oldPassword');
    let previousLength = oldInput.value.length;
    oldInput.addEventListener('input',()=>{
      const currentLength = oldInput.value.length;
      if (currentLength !== previousLength) {
        errorMessages.errorOne = false
        previousLength = currentLength;
      }
    })
  }
  // 检查新密码和确认密码是否一致
  if (responseP==='两次新密码不一致') {
    errorMessages.errorTwo=true
    const newInput=document.getElementById('newPasswor');
    let previousLengthN = newInput.value.length;
    newInput.addEventListener('input',()=>{
      const currentLengthN = newInput.value.length;
      if (currentLengthN !== previousLengthN) {
        errorMessages.errorTwo = false
        previousLengthN = currentLengthN; // 更新为当前长度
      }
    })

    const conInput=document.getElementById('confirmPassword');
    let previousLengthC = conInput.value.length;
    conInput.addEventListener('input',()=>{
      const currentLengthC = conInput.value.length;
      if (currentLengthC !== previousLengthC) {
        errorMessages.errorTwo = false
        previousLengthC = currentLengthC;
      }
    })
  }
}

// 格式化百分比
const formatPercentage = (value) => {
  return value ? Number(value).toFixed(1) : '0.0';
};

// 格式化数字
const formatNumber = (value) => {
  return value ? Number(value).toFixed(1) : '0.0';
};

onMounted(() => {
  getData();
});
</script>

<template>
  <div class="personal">
    <div class="head">
      <div class="all">

        <div class="left">
          <!-- @click="triggerFileInput" -->
          <img :src="userInfo.imgSrc" @click="triggerFileInput">
          <!-- @change="handleFileChange" -->
          <input type="file" ref="fileInput" style="display: none;" @change="handleFileChange">
        </div>

        <div class="middle">
          <div class="up">
            <span class="name">{{ userInfo.username }}</span>
            <span class="level">{{ playerProfile.userLevel}}</span>
          </div>

          <div class="down">
            ID: {{ userId }}
          </div>
        </div>

        <div class="right">
          <button @click="" class="friend"><span class="num">45</span><span>好友</span></button>
        </div>
      </div>
    </div>

    <div class="main">
      <div class="box-left">
        <ul>
          <li class="active" data-target="target1" @click="handleClick">我的资料</li>
          <li data-target="target2" @click="handleClick">历史战绩</li>
        </ul>
      </div>

      <div class="box-right modify active" id="target1">
        <div class="info">
          <!-- 用户信息展示 -->
          <div class="modifymore">
            <span>用户名：{{ userInfo.username }}</span>
            <i class="material-icons">person</i>
          </div>
          <div class="modifymore">
            <span>账号ID：{{ userId }}</span>
            <i class="material-icons">badge</i>
          </div>
          <div class="modifymore">
            <span>邮箱：{{ userInfo.email }}</span>
            <i class="material-icons">email</i>
          </div>
          <div class="modifymore">
            <span>密码</span>
            <i class="material-icons">lock</i>
          </div>

          <!-- 按钮组 -->
          <div class="button-group">
            <button @click="editUserInfo('info')" class="action-button changeInfo">
              <i class="material-icons">edit</i>
              修改信息
            </button>
            <button @click="editUserInfo('password')" class="action-button changePsw">
              <i class="material-icons">key</i>
              修改密码
            </button>
          </div>
        </div>
        
        <!-- GIF 展示区域 -->
        <div class="gif">
          <img :src="gifImg" alt="Animated GIF" loading="lazy">
        </div>

      </div>

      <div class="box-right fight" id="target2">
        <div class="stats-summary">
        <!-- 第一行：总体统计 -->
        <div class="stats-section">
          <h3 class="section-title">总体统计</h3>
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-label">等级</span>
              <span class="stat-value">{{ playerProfile.userLevel }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">总场次</span>
              <span class="stat-value">{{ playerProfile.totalMatchesPlayed }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">总胜场</span>
              <span class="stat-value">{{ playerProfile.totalWins }}</span>
            </div>
            <div class="stat-item highlight">
              <span class="stat-label">最高速度</span>
              <span class="stat-value">{{ playerProfile.highestWpm }} WPM</span>
            </div>
          </div>
        </div>

        <!-- 第二行：排位表现 -->
        <div class="stats-section">
          <h3 class="section-title">排位表现</h3>
          <div class="stats-row">
            <div class="stat-item ranked">
              <span class="stat-label">排位分数</span>
              <span class="stat-value">{{ playerProfile.rankScore }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">排位场次</span>
              <span class="stat-value">{{ playerProfile.rankedMatchesPlayed }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">排位胜率</span>
              <span class="stat-value">{{ formatPercentage(playerProfile.rankedWinRate) }}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">排位均速</span>
              <span class="stat-value">{{ formatNumber(playerProfile.rankedAvgWpm) }} WPM</span>
            </div>
          </div>
        </div>

        <!-- 第三行：休闲表现 -->
        <div class="stats-section">
          <h3 class="section-title">休闲表现</h3>
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-label">休闲场次</span>
              <span class="stat-value">{{ playerProfile.casualMatchesPlayed }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">休闲胜率</span>
              <span class="stat-value">{{ formatPercentage(playerProfile.casualWinRate) }}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平均速度</span>
              <span class="stat-value">{{ formatNumber(playerProfile.casualAvgWpm) }} WPM</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平均准确率</span>
              <span class="stat-value">{{ formatPercentage(playerProfile.casualAvgAccuracy) }}%</span>
            </div>
          </div>
        </div>
      </div>

        <div class="match-history">
          <h3>最近比赛</h3>
          <div class="match-list">
            <MatchHistoryCard 
              v-for="match in matchHistory.matches" 
              :key="match.id" 
              :match="match"
            />
          </div>
        </div>
      </div>

      <!-- 修改信息弹窗  -->
      <div class="modal" v-if="isEditing">
        <div class="modal-content">
          <h2>修改用户信息</h2>
          <div class="form-group">
            <p>用户名</p>
            <input 
              v-model="newUserInfo.username" 
              placeholder="请输入用户名" 
              type="text"
            />
          </div>
          <div class="form-group">
            <p>邮箱</p>
            <input 
              v-model="newUserInfo.email" 
              placeholder="请输入邮箱" 
              type="email"
            />
          </div>
          <div class="modal-buttons">
            <button class="cancel" @click="closeEdit">取消</button>
            <button class="save" @click="saveUserInfo('info')">保存</button>
          </div>
          <button class="close" @click="closeEdit">×</button>
        </div>
      </div>
      <!-- 修改密码弹窗 -->
      <div class="modal" v-if="isEditingP">
        <div class="modal-content">
          <h2>修改用户密码</h2>
          <div class="form-group">
            <p>旧密码</p>
            <input 
              type="password" 
              v-model="nPassword.oldPassword" 
              @input="validateInputs" 
              id="oldPassword" 
              placeholder="请输入旧密码" 
            />
            <span v-show="errorMessages.errorOne" class="error">密码输入错误</span>
          </div>
          <div class="form-group">
            <p>新密码</p>
            <input 
              type="password" 
              v-model="nPassword.newPassword" 
              @input="validateInputs" 
              id="newPasswor" 
              placeholder="请输入新密码" 
            />
            <span v-show="errorMessages.errorTwo" class="error">两次密码不一致</span>
          </div>
          <div class="form-group">
            <p>确认新密码</p>
            <input 
              type="password" 
              v-model="nPassword.confirmPassword" 
              @input="validateInputs" 
              id="confirmPassword" 
              placeholder="请再次输入新密码" 
            />
          </div>
          <div class="modal-buttons">
            <button class="cancel" @click="closeEdit">取消</button>
            <button class="save" @click="saveUserInfo('password')">保存</button>
          </div>
          <button class="close" @click="closeEdit">×</button>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: #f4f4f4;
}

.personal {
  padding: 2rem;
  min-height: calc(100vh - 140px);
  color: var(--text-primary);
  background: var(--primary-dark);
}

.head {
  background: var(--secondary-dark);
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
}

.all {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 2rem;
  align-items: center;
}

.left {
  width: 120px;
  height: 120px;
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--accent-color);
  transition: all 0.3s ease;
}

.left:hover {
  transform: scale(1.05);
  border-color: var(--accent-hover);
}

.left img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  transition: filter 0.3s ease;
}

.left img:hover {
  filter: brightness(0.8);
}

.middle {
  text-align: left;
}

.middle .up {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.name {
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.level {
  padding: 0.3rem 0.8rem;
  background: var(--accent-color);
  border-radius: 20px;
  font-size: 0.9rem;
  color: white;
}

.down {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.friend {
  background: var(--accent-dark);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 0.8rem 1.5rem;
  border-radius: 25px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.friend:hover {
  background: var(--accent-color);
  transform: translateY(-2px);
}

.friend .num {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
}

.main {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 2rem;
  position: relative;
}

.box-left {
  background: var(--secondary-dark);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.box-left ul li {
  padding: 1rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.box-left ul li {
  margin-bottom: 10px;
  padding: 15px;
  text-align: center;
  font-size: large;
  font-family: serif;
  border-bottom: 1px solid #a4a6a9;
  cursor: pointer;
}

.box-left li:hover {
  background: var(--accent-dark);
  color: var(--text-primary);
}

.box-left li.active {
  background: var(--accent-dark);
  color: var(--accent-color);
  border-left-color: var(--accent-color);
}

.box-right {
  background: var(--secondary-dark);
  border-radius: 12px;
  padding: 2rem;
  min-height: 500px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  display: none;

}

.box-right.active {
  display: block;
  animation: fadeIn 0.3s ease;
}

/* 信息展示区域 */
.info {
  max-width: 600px;
  margin-bottom: 2rem;
  float: left;
  width: 70%;
}

/* 信息项样式 */
.modifymore {
  padding: 1.2rem;
  margin-bottom: 1rem;
  background: var(--accent-dark);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modifymore:hover {
  transform: translateX(5px);
  border-color: var(--accent-color);
  background: rgba(99, 102, 241, 0.1);
}

/* 按钮容器 */
.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

/* 按钮基础样式 */
.action-button {
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

/* 按钮样式 */
.changeInfo {
  background: var(--accent-dark);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.changeInfo:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: var(--accent-color);
  transform: translateY(-2px);
}

/* 次要按钮样式 */
.changePsw {
  background: var(--accent-dark);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.changePsw:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: var(--accent-color);
  transform: translateY(-2px);
}

/* 图标样式 */
.material-icons {
  font-size: 1.2rem;
  color: var(--accent-color);
}

/* GIF 区域样式 */
.gif {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
  position: relative;
  float: right;
  width: 30%;
}

.gif img {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.3s ease;
}

.gif:hover img {
  transform: scale(1.02);
}

/* 模态框基础样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

/* 模态框内容样式 */
.modal-content {
  background: var(--secondary-dark);
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 450px;
  position: relative;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
  animation: slideUp 0.3s ease;
}

/* 表单组样式 */
.form-group {
  margin-bottom: 1.5rem;
}

/* 标题样式 */
.modal-content h2 {
  color: var(--text-primary);
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* 标签样式 */
.modal-content p {
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

/* 输入框样式 */
.modal-content input {
  width: 100%;
  background: var(--accent-dark);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: 8px;
  padding: 0.8rem 1rem;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
}

.modal-content input:focus {
  border-color: var(--accent-color);
  outline: none;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.error::before {
  content: "⚠";
  font-size: 1rem;
}

/* 错误消息样式 */
.error {
  color: var(--danger-color);
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 按钮容器 */
.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

/* 关闭按钮 */
.close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close:hover {
  background: var(--accent-dark);
  color: var(--text-primary);
}

/* 保存按钮 */
.save {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.save:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
}

/* 取消按钮 */
.cancel {
  background: var(--accent-dark);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  padding: 0.8rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.cancel:hover {
  background: var(--secondary-dark);
  color: var(--text-primary);
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .modal-content {
    padding: 1.5rem;
  }
  
  .modal-buttons {
    flex-direction: column;
  }
  
  .save, .cancel {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .button-group {
    flex-direction: column;
  }
  
  .action-button {
    width: 100%;
    justify-content: center;
  }
  
  .modifymore {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
}

.stats-summary {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--secondary-dark);
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.stat-item {
  text-align: center;
  padding: 1.2rem;
  background: var(--primary-dark);
  border-radius: 8px;
  transition: transform 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
}

.stat-item.highlight {
  background: var(--accent-dark);
  border: 1px solid var(--accent-color);
}

.stat-label {
  display: block;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-primary);
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.highlight .stat-value {
  color: var(--accent-color);
  background: none;
  -webkit-background-clip: initial;
  background-clip: initial;
}

.match-history {
  padding: 1rem;
}

.match-history h3 {
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>