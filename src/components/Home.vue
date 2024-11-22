<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLoggedIn = ref(false)
const testRoomId = ref('')
const isDev = computed(() => import.meta.env.DEV)

onMounted(() => {
  isLoggedIn.value = !!localStorage.getItem('token')
})

const startGame = () => {
  if (isLoggedIn.value) {
    router.push('/game-lobby')
  } else {
    router.push('/auth')
  }
}

const testGame = () => {
  const roomId = Math.random().toString(36).substring(7)
  testRoomId.value = roomId  // 保存房间ID以便复制
  router.push({
    name: 'testRoom',
    params: { id: roomId }
  })
}

const joinTestRoom = () => {
  if (testRoomId.value) {
    router.push({
      name: 'testRoom',
      params: { id: testRoomId.value }
    })
  } else {
    alert('请输入房间ID')
  }
}

// 技能提升按钮的点击事件处理函数
const startTypingPractice = () => {
  router.push('/typing-practice')
}
</script>

<template>
  <div class="home">
    <div class="hero">
      <h1>在线打字对战</h1>
      <p>提升你的打字速度，挑战其他玩家！</p>
      <div class="button-group">
        <button @click="startGame" class="cta-button">
          {{ isLoggedIn ? '开始游戏' : '立即登录' }}
        </button>
        <button @click="testGame" class="test-button">
          测试游戏
        </button>
      </div>
    </div>

    <div class="features">
      <div class="feature">
        <h3>实时对战</h3>
        <p>与其他玩家实时对战，体验紧张刺激的打字比赛</p>
      </div>
      <div class="feature">

        <button @click="startTypingPractice" class="practice-button">
        技能提升
      </button>
        <p>通过练习提高打字速度和准确率</p>
        <!-- 将“技能提升”字样改造成跳转按钮 -->

      </div>
      <div class="feature">
        <h3>排行榜</h3>
        <p>查看自己在全球玩家中的排名</p>
      </div>
    </div>

    <div class="test-buttons" v-if="isDev">
      <button @click="testGame">创建测试房间</button>
      <button @click="joinTestRoom">加入测试房间</button>
      <input v-model="testRoomId" placeholder="输入房间ID" />
    </div>
  </div>
</template>

<style scoped>
.home {
  text-align: center;
  padding: 2rem;
}

.hero {
  padding: 4rem 2rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 3rem;
}

.hero h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.hero p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 2rem;
}

.cta-button {
  padding: 1rem 2rem;
  font-size: 1.2rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.cta-button:hover {
  background-color: #3aa876;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  padding: 2rem;
}

.feature {
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.feature h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.feature p {
  color: #666;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.test-button {
  background-color: #2c3e50;
  color: white;
  padding: 0.8rem 2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.test-button:hover {
  background-color: #34495e;
}

.test-buttons {
  margin-top: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.practice-button {
  font-size: 1.2rem; /* 增大字体大小 */
}


.test-buttons input {
  padding: 0.5rem;
  margin: 0 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>
