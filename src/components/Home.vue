<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLoggedIn = ref(false)

onMounted(() => {
  isLoggedIn.value = !!localStorage.getItem('token')
})

const startGame = () => {
  if (isLoggedIn.value) {
    router.push('/game-lobby')
  } else {
    router.push('/login')
  }
}
</script>

<template>
  <div class="home">
    <div class="hero">
      <h1>在线打字对战</h1>
      <p>提升你的打字速度，挑战其他玩家！</p>
      <button @click="startGame" class="cta-button">
        {{ isLoggedIn ? '开始游戏' : '立即登录' }}
      </button>
    </div>

    <div class="features">
      <div class="feature">
        <h3>实时对战</h3>
        <p>与其他玩家实时对战，体验紧张刺激的打字比赛</p>
      </div>
      <div class="feature">
        <h3>技能提升</h3>
        <p>通过练习提高打字速度和准确率</p>
      </div>
      <div class="feature">
        <h3>排行榜</h3>
        <p>查看自己在全球玩家中的排名</p>
      </div>
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
</style>
