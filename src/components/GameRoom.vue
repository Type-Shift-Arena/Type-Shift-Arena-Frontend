<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import SockJS from 'sockjs-client'
import Stomp from 'webstomp-client'

const router = useRouter()
const stompClient = ref(null)
const playerText = ref('')
const targetText = ref('这是一段测试文字，用来测试打字速度。')
const opponentProgress = ref(0)
const myProgress = ref(0)

const connectWebSocket = () => {
  const socket = new SockJS('http://localhost:8080/ws')
  stompClient.value = Stomp.over(socket)
  
  stompClient.value.connect({}, frame => {
    console.log('Connected: ' + frame)
    
    // 订阅对手进度更新
    stompClient.value.subscribe('/topic/game/progress', message => {
      const progress = JSON.parse(message.body)
      if (progress.playerId !== 'currentPlayerId') {
        opponentProgress.value = progress.percentage
      }
    })
  })
}

const updateProgress = () => {
  const progress = (playerText.value.length / targetText.value.length) * 100
  myProgress.value = progress
  
  // 发送进度到服务器
  if (stompClient.value && stompClient.value.connected) {
    stompClient.value.send('/app/game/progress', JSON.stringify({
      playerId: 'currentPlayerId',
      percentage: progress
    }))
  }
}

onMounted(() => {
  connectWebSocket()
})

onUnmounted(() => {
  if (stompClient.value) {
    stompClient.value.disconnect()
  }
})
</script>

<template>
  <div class="game-room">
    <div class="target-text">
      {{ targetText }}
    </div>
    
    <div class="progress-area">
      <div class="player-progress">
        你的进度: {{ myProgress.toFixed(1) }}%
        <div class="progress-bar" :style="{ width: myProgress + '%' }"></div>
      </div>
      <div class="opponent-progress">
        对手进度: {{ opponentProgress.toFixed(1) }}%
        <div class="progress-bar" :style="{ width: opponentProgress + '%' }"></div>
      </div>
    </div>
    
    <textarea
      v-model="playerText"
      @input="updateProgress"
      placeholder="开始输入..."
      class="input-area"
    ></textarea>
  </div>
</template>

<style scoped>
.game-room {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.target-text {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.progress-area {
  margin: 20px 0;
}

.progress-bar {
  height: 20px;
  background: #4CAF50;
  transition: width 0.3s ease;
}

.input-area {
  width: 100%;
  height: 150px;
  padding: 10px;
  border-radius: 8px;
}
</style>
