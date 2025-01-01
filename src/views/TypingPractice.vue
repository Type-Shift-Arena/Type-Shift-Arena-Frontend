<template>
  <div class="typing-practice">
    <!-- 页面标题 -->
    <div class="practice-header">
      <div class="header-title">
        <h1>个人练习</h1>
      </div>
    </div>

    <!-- 状态栏 -->
    <GameStatusBar
      :max-health="maxHealth"
      :health="health"
      :score="score"
      :combo="combo"
      :is-damaged="isDamaged"
      :score-animating="scoreAnimating"
    />

    <!-- 游戏区域 -->
    <div class="practice-content" v-if="!gameOver">
      <div class="bubble-container">
        <GameBubble
          v-for="(bubble, index) in activeBubbles"
          :key="index"
          :text="bubble.text"
          :start-time="bubble.startTime"
          :bursting="bubble.bursting"
          :bubble-config="bubbleConfig"
        />
      </div>
      
      <div class="input-container">
        <input
          ref="inputField"
          v-model="userInput"
          @input="checkInput"
          @keydown.enter="submitInput"
          placeholder="输入文字..."
          class="input-field"
        />
      </div>
    </div>

    <!-- 游戏结束界面 -->
    <div class="game-over" v-if="gameOver">
      <h2>游戏结束</h2>
      <p>最终得分: {{ score }}</p>
      <ScopeButton 
        :size="160"
        themeColor="#4f8cff"
        :sound="true"
        @click="restartGame"
      >
        重新开始
      </ScopeButton>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import GameBubble from '../components/GameRoom/GameBubble.vue'
import GameStatusBar from '../components/BubbleMode/StatusBar.vue'
import ScopeButton from '@/components/ScopeButton.vue'

// 气泡相关配置
const bubbleConfig = {
  initialSize: 80, // 初始大小
  maxSize: 150, // 最大大小
  growthTime: 5000, // 5秒到最大
  spawnInterval: 5500 // 每5.5秒生成新气泡
}

// 词组库
const wordList = ['hello', 'world', 'coding', 'bubble', 'type', 'ppp', 'ooo', 'qqq']

// 游戏配置
const gameConfig = {
  maxHealth: 3,
  scorePerBubble: 10,
  comboBonus: 2, // 连击加分倍数
  difficultyIncrease: {
    interval: 30000, // 每30秒增加难度
    spawnRateDecrease: 100, // 生成间隔减少的毫秒数
    minSpawnInterval: 1000 // 最小生成间隔
  }
}

// 游戏状态
const maxHealth = ref(gameConfig.maxHealth)
const health = ref(maxHealth.value)
const score = ref(0)
const combo = ref(0)
const isDamaged = ref(false)
const scoreAnimating = ref(false)
const gameOver = ref(false)
const userInput = ref('')
const activeBubbles = ref([])
const gameInterval = ref(null)
const updateInterval = ref(null)
const currentSpawnInterval = ref(bubbleConfig.spawnInterval)
const lastMatchTime = ref(0) // 新增：上次匹配成功的时间

// 修改扣血逻辑
const takeDamage = () => {
  isDamaged.value = true
  health.value--
  
  setTimeout(() => {
    isDamaged.value = false
  }, 300)
  
  if (health.value <= 0) {
    endGame()
  }
}

// 修改加分逻辑
const addScore = (points) => {
  scoreAnimating.value = true
  score.value += points
  
  setTimeout(() => {
    scoreAnimating.value = false
  }, 300)
}

// 修改生成气泡的函数
const spawnBubble = () => {
  // 如果已经有气泡，就不再生成新的
  if (activeBubbles.value.length > 0) {
    return;
  }
  const text = wordList[Math.floor(Math.random() * wordList.length)];
  
  activeBubbles.value.unshift({
    text,
    startTime: Date.now(),
    bursting: false
  });
};

// 检查输入逻辑优化
const checkInput = () => {
  const input = userInput.value.trim()
  if (!input) return
  
  const bubbleIndex = [...activeBubbles.value].reverse()
    .findIndex(b => b.text === input && !b.bursting)
  
  if (bubbleIndex !== -1) {
    const actualIndex = activeBubbles.value.length - 1 - bubbleIndex
    const bubble = activeBubbles.value[actualIndex]
    bubble.bursting = true
    
    const now = Date.now()
    if (now - lastMatchTime.value < 2000) {
      combo.value++
    } else {
      combo.value = 1
    }
    lastMatchTime.value = now
    
    const points = gameConfig.scorePerBubble * 
      (1 + Math.floor((combo.value - 1) * gameConfig.comboBonus))
    
    userInput.value = ''
    addScore(points) // 使用新的加分函数
  }
}

// 更新游戏状态
const updateGame = () => {
  const now = Date.now()
  
  activeBubbles.value = activeBubbles.value.filter(bubble => {
    const elapsed = now - bubble.startTime;
    // 给予一点额外时间来显示最终状态
    const alive = elapsed <= bubbleConfig.growthTime && !bubble.bursting;
    
    if (elapsed > bubbleConfig.growthTime && !bubble.bursting) {
      takeDamage() // 使用新的扣血函数
    }
    return alive
  })
}

// 难度递增
const increaseDifficulty = () => {
  currentSpawnInterval.value = Math.max(
    gameConfig.difficultyIncrease.minSpawnInterval,
    currentSpawnInterval.value - gameConfig.difficultyIncrease.spawnRateDecrease
  )
  
  // 重新设置生成间隔
  clearInterval(gameInterval.value)
  gameInterval.value = setInterval(spawnBubble, currentSpawnInterval.value)
}

// 开始游戏优化
const startGame = () => {
  health.value = maxHealth.value
  score.value = 0
  combo.value = 0
  gameOver.value = false
  activeBubbles.value = []
  currentSpawnInterval.value = bubbleConfig.spawnInterval
  lastMatchTime.value = 0
  
  gameInterval.value = setInterval(spawnBubble, currentSpawnInterval.value)
  updateInterval.value = setInterval(updateGame, 100)
  
  // 设置难度递增
  setInterval(increaseDifficulty, gameConfig.difficultyIncrease.interval)
}

// 结束游戏
const endGame = () => {
  gameOver.value = true
  clearInterval(gameInterval.value)
  clearInterval(updateInterval.value)  // 清除显示更新计时器
}

// 重新开始
const restartGame = () => {
  startGame()
}

onMounted(() => {
  startGame()
})

onUnmounted(() => {
  clearInterval(gameInterval.value)
  clearInterval(updateInterval.value)  // 清除显示更新计时器
})
</script>

<style scoped>
.typing-practice {
  min-height: calc(100vh - 140px);
  padding: 1.5rem;
  color: #fff;
  overflow-x: hidden;
}

.practice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.header-title h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 0 10px rgba(79, 140, 255, 0.5);
}

.practice-content {
  position: relative;
  height: calc(100vh - 340px);
  border-radius: 16px;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.input-container {
  position: absolute;
  bottom: 2rem;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
}

.input-field {
  width: 300px;
  padding: 0.8rem 1.5rem;
  font-size: 1.2rem;
  color: #fff;
  background: rgba(26, 32, 44, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  backdrop-filter: blur(5px);
  text-align: center;
  transition: all 0.3s ease;
}

.input-field:focus {
  outline: none;
  border-color: #4f8cff;
  box-shadow: 0 0 15px rgba(79, 140, 255, 0.3);
}

.game-over {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 2rem;
  background: rgba(26, 32, 44, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  text-align: center;
  min-width: 300px;
}

.game-over h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  text-shadow: 0 0 10px rgba(79, 140, 255, 0.5);
}

.bubble-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* 确保不会影响子组件的定位 */
  pointer-events: none;
  /* 移除可能影响子组件的样式 */
  transform: none;
  transition: none;
}

.bubble {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--accent-color);
  border-radius: 50%;
  backdrop-filter: blur(2px);
  box-shadow: 0 0 15px rgba(79, 70, 229, 0.2);
  transition: all 5s linear;
  will-change: width, height, background, border-color;
  min-width: 80px;
  min-height: 80px;
  padding: 10px;
}

.bubble span {
  font-size: 1.2rem;
  color: var(--text-primary);
  font-weight: 500;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
}

/* 添加气泡生长动画 */
@keyframes grow {
  from {
    transform: scale(0.8);
    opacity: 0.2;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* 添加脉冲动画 */
@keyframes pulse {
  0% {
    box-shadow: 0 0 15px rgba(79, 70, 229, 0.2);
  }
  50% {
    box-shadow: 0 0 25px rgba(79, 70, 229, 0.4);
  }
  100% {
    box-shadow: 0 0 15px rgba(79, 70, 229, 0.2);
  }
}

.bubble {
  animation: pulse 5s infinite ease-in-out;
}

.bubble-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  /* 确保文字内容不会被压缩 */
  width: fit-content;
  height: fit-content;
}

.bubble-text {
  font-size: 1.2rem;
  color: var(--text-primary);
  font-weight: 500;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
  white-space: nowrap; /* 防止文字换行 */
}

.bubble-timer {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: bold;
}
</style>