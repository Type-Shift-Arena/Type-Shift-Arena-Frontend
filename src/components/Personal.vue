<script>
import gifImg from '@/assets/images/merged.gif';
import axios from 'axios';
import { API_BASE_URL } from '@/config'

export default {
  name: 'MyComponent',
  data() {
    return {
      userId: localStorage.getItem('userId'),

      userInfo:{
        username: '',//用户名
        password: '',//密码
        email: '',//邮箱
        imgSrc: '',//头像
        createdAt: '',//注册时间
        updatedAt: '',//更新信息时间
      },

      playerProfile:{//玩家信息
        userLevel: '',//等级
        win: '', //胜场
        speed: '',//均速
        winRate: '', //胜率
        accuracyRate: '', //准确率
      },
      
      newUserInfo:{
        username: '',
        email: '',
      },

      nPassword:{
        oldPassword: '',
        newPassword:'',
        confirmPassword:''
      },

      isEditing: false,
      isEditingP: false,
      gifImg,

      errorMessages: {
        errorOne: false, // 对应旧密码错误信息
        errorTwo: false, // 对应新密码不一致错误信息
      }
    };
  },
  mounted() {
    this.getData();
  },
  methods: {
    async getData() {
      try {
        if (!this.userId) {
          throw new Error('无法获取用户ID');
        }
        const userResponse = await axios.get(`${API_BASE_URL}/users/${this.userId}`);
        const userData = userResponse.data.data;
        
        this.userInfo = { ...userData };
        this.newUserInfo = { ...this.userInfo };

        const playerResponse = await axios.get(`${API_BASE_URL}/players/${this.userId}`);
        const playerData = playerResponse.data.data;

        this.playerProfile = { ...playerData }; // 更新 
      } catch (error) {
        console.error(error);
      }
    },

    triggerFileInput() {
      // 触发文件输入元素的点击事件
      this.$refs.fileInput.click();
    },

    async handleFileChange(event){
      const file = event.target.files[0]; //获取用户选择的文件
      if (file) {
        console.log('上传');
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
          this.imgSrc = e.target.result;
        };
         
      }
    },
    
    friendlist() {
      this.$router.push('/friend-list');
    },

    handleClick(event) {
      document.querySelectorAll('.box-right').forEach(item => item.classList.remove('active'));
      document.querySelectorAll('.box-left li').forEach(item => item.classList.remove('active'));

      const targetId = event.target.getAttribute('data-target');
      const targetContent = document.getElementById(targetId);

      if (targetContent) {
        event.target.classList.add('active');
        targetContent.classList.add('active');
      }
    },

    editUserInfo(value){
      if (value==='info') {
        this.newUserInfo={...this.userInfo};// 初始化 newUserInfo
        this.isEditing=true;
      }else if(value==='password'){
        this.nPassword= {
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
        this.isEditingP=true;
      }
    },

    closeEdit(){
      this.isEditing=false;
      this.isEditingP=false;
    },

    async saveUserInfo(value){
      try {
        if (value==='info') {
          const updateData = {
            username: this.newUserInfo.username,
            email: this.newUserInfo.email,
          };
          await axios.put(`${API_BASE_URL}/users/${this.userId}`, updateData);
          
          this.userInfo = { ...updateData };
          alert('更新成功！')
          this.isEditing = false;
        } else if(value==='password'){
          const updatePassword = {
            oldPassword: this.nPassword.oldPassword,
            newPassword: this.nPassword.newPassword,
            confirmPassword: this.nPassword.confirmPassword,
          };
          await axios.put(`${API_BASE_URL}/users/${this.userId}/password`, updatePassword);
          
          alert("更新密码成功！")
          this.isEditingP = false;
        } 
        window.location.reload(); // 刷新页面
      }catch (error) {
        const responseP = error.response.data
        if (responseP === '旧密码不正确') {
          this.errorMessages.errorOne=true
        }else if (responseP === '两次新密码不一致') {
          this.errorMessages.errorTwo=true
        }
        this.validateInputs(responseP);
      }
    },

    validateInputs(responseP) {
      // 检查旧密码是否正确
      if (responseP==='旧密码不正确') {
        this.errorMessages.errorOne = true
        const oldInput=document.getElementById('oldPassword');
        let previousLength = oldInput.value.length;
        oldInput.addEventListener('input',()=>{
          const currentLength = oldInput.value.length;
          if (currentLength !== previousLength) {
            this.errorMessages.errorOne = false
            previousLength = currentLength;
          }
        })
      }
      // 检查新密码和确认密码是否一致
      if (responseP==='两次新密码不一致') {
        this.errorMessages.errorTwo=true
        const newInput=document.getElementById('newPasswor');
        let previousLengthN = newInput.value.length;
        newInput.addEventListener('input',()=>{
          const currentLengthN = newInput.value.length;
          if (currentLengthN !== previousLengthN) {
            this.errorMessages.errorTwo = false
            previousLengthN = currentLengthN; // 更新为当前长度
          }
        })

        const conInput=document.getElementById('confirmPassword');
        let previousLengthC = conInput.value.length;
        conInput.addEventListener('input',()=>{
          const currentLengthC = conInput.value.length;
          if (currentLengthC !== previousLengthC) {
            this.errorMessages.errorTwo = false
            previousLengthC = currentLengthC;
          }
        })
      }
    },
  },
};
</script>
<template>
  <div class="personal">
    <div class="head">
      <div class="all">

        <div class="left">
          <!-- @click="triggerFileInput" -->
          <img :src="userInfo.imgSrc">
          <!-- @change="handleFileChange" -->
          <input type="file" ref="fileInput" style="display: none;">
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
          <button @click="friendlist" class="friend"><span class="num">45</span><span>好友</span></button>
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
          <div class="modifymore">用户名：{{ userInfo.username }}</div>
          <div class="modifymore">账号ID：{{ userId }}</div>
          <div class="modifymore">邮&nbsp;箱：{{ userInfo.email }}</div>
          <div class="modifymore">密&nbsp;码：<i class="material-icons">lock</i></div>

          <button @click="editUserInfo('info')" class="changeInfo">修改信息</button>
          <div class="modal" v-if="isEditing">
            <div class="modal-content">
              <h2>修改用户信息</h2>
              <p>用户名：</p><input v-model="newUserInfo.username" placeholder="姓名" />
              <br>
              <p>邮箱：</p><input v-model="newUserInfo.email" placeholder="邮箱" />
              <br>
              <button class="close" @click="closeEdit">X</button>
              <button class="save" @click="saveUserInfo('info')">保存</button>
            </div>
          </div>

          <button @click="editUserInfo('password')" class="changePsw">修改密码</button>
          <div class="modal" v-if="isEditingP">
            <div class="modal-content">
              <h2>修改用户密码</h2>
              <p>旧密码：</p>
              <input type="password" v-model="nPassword.oldPassword" @input="validateInputs"  id="oldPassword" placeholder="旧密码" />
              <span v-show="errorMessages.errorOne" class="error" id="error-one">密码输入错误</span>
              <br>
              <p>新密码：</p>
              <input type="password" v-model="nPassword.newPassword" @input="validateInputs"  id="newPasswor" placeholder="新密码" />
              <span v-show="errorMessages.errorTwo" class="error" id="error-two">两次密码不一致</span>
              <br>
              <p>确认新密码：</p>
              <input type="password" v-model="nPassword.confirmPassword" @input="validateInputs"  id="confirmPassword" placeholder="确认新密码" />
              <br>
              <button class="close" @click="closeEdit">X</button>
              <button class="save" @click="saveUserInfo('password')">保存</button>
            </div>
          </div>
        </div>

        <div class="gif">
          <img :src="gifImg" alt="gif image" srcset="">
        </div>
      </div>

      <div class="box-right fight" id="target2">
        <div class="board">
          <img src="/src/assets/images/keyboard.png" alt="" srcset="">
        </div>

        <div class="contents">
          <div class="win">胜场：{{ playerProfile.win }}</div>
          <div class="speed">均速：{{ playerProfile.speed }}</div>
          <div class="winrate">胜率：{{ playerProfile.winRate }}</div>
          <div class="accuracyrate">准确率：{{ playerProfile.accuracyRate }}</div>
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
  list-style: none;
}

body {
  background-color: #f4f4f4;
}

.personal {
  padding: 2rem;
  height: 700px;
  color: #333;
}

.head {
  min-width: 300px;
  padding: 1rem 0.5rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-top: 3rem;
  margin-bottom: 1rem;
  text-align: center;
}

.all {
  width: 90%;
  display: inline-block;
  position: relative;
}

.head .all .left {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-size: cover;
}

.left img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  cursor: pointer;
}

.head .all .middle {
  position: absolute;
  top: 0;
  left: 145px;
  text-align: left;
}

.middle .up {
  position: relative;
  margin-top: 1rem;
}

.middle .up .name {
  font-size: 24px;
  margin-right: 5rem;
}

.middle .up .level {
  position: absolute;
  top: 5px;
  right: -5px;
  font-size: 15px;
  padding: 2px 5px;
  background-color: skyblue;
  border-radius: 5px;
}

.middle .down {
  margin-top: 1rem;
  font-family: serif;
}

.head .all .right {
  position: absolute;
  right: 0;
  bottom: 10px;
  position: absolute;
}

.right button {
  padding: 15px;
  border-radius: 20px;
  border: 0;
  font-size: 16px;
  color: #eee;
  transition: all 0.5s ease;
}

.right .friend {
  background-color: #999494;
}

.right .friend:active {
  background-color: #6c6666;
  transform: scale(0.95);
  box-shadow: 0 5px #999494;
}

.right .talk {
  margin-left: 25px;
  background-color: #44607c;
}

.right .talk:active {
  background-color: #2c3e50;
  transform: scale(0.95);
  box-shadow: 0 5px #44607c;
}

.right .num {
  font-size: 12px;
  margin-right: 5px;
}

.main {
  position: relative;
}

.box-left {
  background-color: #fff;
  border-radius: 15px;
  width: 15%;
}

.box-left ul {
  padding: 5px;
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

.box-left ul li:last-child {
  margin-bottom: 0;
  border-bottom: 0;
}

.box-left li.active {
  color: #f03f04;
  box-shadow: 5px 5px 5px 5px rgba(0, 0, 0, 0.2);
  transform: scale3d(1, 1.2, 1.2)
}

.box-right {
  width: 80%;
  height: 400px;
  position: absolute;
  top: 0;
  right: 0;
  background-color: #fff;
  border-radius: 15px;
  display: none;
}

.box-right.active {
  display: block;
}

.modify .gif {
  width: 300px;
  height: 300px;
  position: absolute;
  right: 20px;
  bottom: 50px;
  border-radius: 25px;
}

.gif img {
  width: 100%;
  height: 100%;
  border-radius: 50px;
}

.modify .info {
  position: absolute;
  left: 15%;
  top: 60%;
  transform: translateY(-50%);
  width: 500px;
  height: 300px;
  z-index: 2;
}

.info .modifymore {
  position: relative;
  margin-bottom: 20px;
  padding-left: 20px;
  font-size: 20px;
  font-family: serif;
  font-weight: 700;
  border-bottom: 1px solid #2c3e50;
}

.info button {
  font-size: 16px;
  background-color: #44607c;
  color: #eee;
  padding: 10px 20px;
  border-radius: 10px;
  border: 0;
  transition: all 0.5s ease;
}

.info .changeInfo{
  position: absolute;
  top: -10px;
  right: 5%;
}

.info .changePsw{
  position: absolute;
  bottom: 111px;
  right: 5%;
}

.info .changeInfo:hover,
.info .changePsw:hover,
.info .changeInfo:active,
.info .changePsw:active{
  text-decoration: none;
  cursor: pointer;
  background-color: #2c3e50;
  transform: scale(0.95);
}

.modal {
  display: flex;
  position: fixed;
  z-index: 1;
  left: 0;
  top: -40px;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  background-color: #fff;
  margin: 3% auto;
  padding: 20px 30px;
  border: 1px solid #888;
  width: 80%;
  height: 90%;
}

.modal-content input {
  margin-left: 15px;
  margin-bottom: 3px;
  padding: 8px;
  width: 250px;
  font-size: 18px;
}

.modal-content .close {
  position: absolute;
  top: 5px;
  right: 5%;
  color: #aaa;
  float: right;
  font-size: 18px;
  font-weight: bold;
  width: 20px;
  padding: 5px;
  background-color: rgba(0, 0, 0, 0);
}

.modal-content .close:hover,
.modal-content .close:active {
  color: black;
  text-decoration: none;
  cursor: pointer;
}

.modal-content .save {
  position: absolute;
  top: 200px;
  right: 5%;
  transition: all 0.5s ease;
}

.modal-content .save:hover,
.modal-content .save:active{
  text-decoration: none;
  cursor: pointer;
  background-color: #2c3e50;
  transform: scale(0.95);
}

.modal-content .error{
  position: absolute;
  font-size: 12px;
  color: red;
}

.modal-content #error-one{
  top: 95px;
  right: 20px;
}

.modal-content #error-two{
  top: 165px;
  right: 10px;
}

.fight .board {
  position: absolute;
  top: 50%;
  left: 5%;
  transform: translateY(-50%);
}

.fight .contents {
  width: 400px;
  height: 400px;
  position: absolute;
  top: 50%;
  right: 15%;
  transform: translateY(-50%);
}

.contents div {
  width: 150px;
  height: 150px;
  text-align: center;
  line-height: 150px;
  border-radius: 15px;
  font-size: 20px;
}

.contents .win {
  position: absolute;
  top: 5%;
  left: 0;
  background-color: #f9c0c0;
}

.contents .speed {
  position: absolute;
  top: 5%;
  right: 0;
  background-color: #dcbcf8;
}

.contents .winrate {
  position: absolute;
  bottom: 5%;
  left: 0;
  background-color: #aeb0ad;
}

.contents .accuracyrate {
  position: absolute;
  bottom: 5%;
  right: 0;
  background-color: #4c7f5c;
}

</style>