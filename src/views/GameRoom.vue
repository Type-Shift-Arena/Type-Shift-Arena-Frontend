<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useWebSocket } from '@/composables/useWebSocket'
import { useGameState } from '@/composables/useGameState'
import { usePlayerStats } from '@/composables/usePlayerStats'
import DebugPanel from '@/components/GameRoom/DebugPanel.vue'
import StatusBar from '@/components/GameRoom/StatusBar.vue'
import GameArea from '@/components/GameRoom/GameArea.vue'

const route = useRoute()
const roomId = route.params.id

// WebSocket 相关
const {
  stompClient,
  connectionStatus,
  connectionTime,
  connectionLogs,
  connectWebSocket,
  reconnectWebSocket,
  checkConnection,
  sendTestMessage,
  disconnect,
  subscribeToRoom,
  subscribeToRoomInfo,
  requestRoomInfo,
  subscriptions,
  hasSubscription,
} = useWebSocket(roomId)

// 游戏状态相关
const {
  gameStatus,
  players,
  targetText,
  isHost,
  isRoomFull,
  startGame,
  handlePlayerJoin,
  myInfo,
  opponentInfo,
  handleRoomInfo,
  toggleReady
} = useGameState(roomId, stompClient)

// 玩家统计相关
const {
  playerText,
  myProgress,
  myStats,
  opponentStats,
  handleInput,
  updateOpponentStats,
  resetStats
} = usePlayerStats(roomId, stompClient)

// 开发环境判断
const isDev = computed(() => import.meta.env.DEV)

// 调试面板显示控制
const showDebugPanel = ref(false)

// 快捷键处理
const handleKeyboardShortcut = (event) => {
  // Ctrl + Shift + D (Windows) 或 Cmd + Shift + D (Mac)
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
    event.preventDefault()
    showDebugPanel.value = !showDebugPanel.value
  }
}

// 倒计时状态
const countdown = ref(3)
const showCountdown = ref(false)
const gameEvents = ref([]) // 用于记录游戏事件

// 添加事件记录函数
const logGameEvent = (event) => {
  const timestamp = new Date().toLocaleTimeString()
  gameEvents.value.push({
    time: timestamp,
    event: event
  })
  // 只保留最近的20条记录
  if (gameEvents.value.length > 20) {
    gameEvents.value.shift()
  }
}

// 监听匹配成功事件
onMounted(async () => {
  console.log('[GameRoom] 组件挂载')
  
  try {
    // 检查是否已经有连接和订阅
    if (!stompClient.value?.connected) {
      console.log('[GameRoom] 建立新的WebSocket连接')
      await connectWebSocket()
    }

    const playerId = localStorage.getItem('userId')
    const playerName = localStorage.getItem('userName')

    // 1. 检查并订阅房间广播消息
    if (!hasSubscription(`room_${roomId}`)){
      console.log('[GameRoom] 订阅房间广播消息')
      await subscribeToRoom(roomId)
    } else {
      console.log('[GameRoom] 已存在房间广播订阅，复用现有订阅')
    }

    // 2. 检查并订阅个人房间信息
    if (!hasSubscription(`room_info_${playerId}`)) {
      console.log('[GameRoom] 订阅个人房间信息')
      await subscribeToRoomInfo(playerId)
    } else {
      console.log('[GameRoom] 已存在个人房间信息订阅，复用现有订阅')
    }

    // 3. 请求初始房间信息
    requestRoomInfo(roomId, playerId, playerName)

    // startGame() // 开始游戏
  } catch (error) {
    console.error('[GameRoom] 初始化失败:', error)
  }
  window.addEventListener('room-info', (event) => {
    console.log('[GameState] 收到房间信息事件:', event.detail)
    handleRoomInfo(event.detail)
  })

  window.addEventListener('player-ready', (event) => {
    console.log('[GameState] 收到玩家准备事件:', event.detail)
    handleRoomInfo(event.detail)
  })

  window.addEventListener('game-start', (event) => {
    console.log('[GameRoom] 收到游戏开始事件:', event.detail)
    showCountdown.value = true
    countdown.value = 3
    
    // 开始倒计时
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
        showCountdown.value = false
        gameStatus.value = 'playing'
        // 重置游戏统计
        resetStats()
      }
  }, 1000)
})

  window.addEventListener('keydown', handleKeyboardShortcut)

  window.addEventListener('game-progress', (event) => {
    const { playerId, percentage, stats } = event.detail
    // 如果不是自己的进度，则更新对手状态
    if (playerId !== localStorage.getItem('userId')) {
      updateOpponentStats({
        progress: percentage,
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        errorCount: stats.errorCount,
        username: stats.username
      })
    }
  })
})

// 组件卸载时的清理
onUnmounted(() => {
  console.log('[GameRoom] 组件卸载')
  window.removeEventListener('keydown', handleKeyboardShortcut)
  
  // 清理订阅
  const playerId = localStorage.getItem('userId')
  if (subscriptions.value.has(`room_${roomId}`)) {
    subscriptions.value.get(`room_${roomId}`).unsubscribe()
    subscriptions.value.delete(`room_${roomId}`)
  }
  if (subscriptions.value.has(`room_info_${playerId}`)) {
    subscriptions.value.get(`room_info_${playerId}`).unsubscribe()
    subscriptions.value.delete(`room_info_${playerId}`)
  }
  window.removeEventListener('game-progress', handleGameProgress)
})

// 处理输入
const handleGameInput = (event) => {
  // 调用 usePlayerStats 中的 handleInput 方法处理输入
  const isCompleted = handleInput(event, targetText.value, gameStatus.value)
  
  // 如果完成了游戏
  if (isCompleted) {
    gameStatus.value = 'finished'
  }
}
</script>

<template>
  <div class="game-room">
    <!-- 添加倒计时显示 -->
    <div v-if="showCountdown" class="countdown-overlay">
      <div class="countdown">
        {{ countdown }}
      </div>
    </div>
    
    <div class="game-room-container">
      <!-- 添加房间信息 -->
      <div v-if="isDev" class="room-info">
        <p>房间ID: {{ roomId }}</p>
        <button @click="copyRoomUrl">复制房间链接</button>
      </div>
    

      <!-- 状态栏 -->
      <StatusBar
        :my-stats="myStats"
        :my-progress="myProgress"
        :opponent-stats="opponentStats"
        :players="players"
        :my-info="myInfo"
        :opponent-info="opponentInfo"
      />

      <!-- 游戏区域 -->
      <GameArea
        :target-text="targetText"
        :game-status="gameStatus"
        v-model:player-text="playerText"
        @input="handleGameInput"
      />

      <!-- 游戏状态 -->
      <div class="game-status" v-if="gameStatus !== 'playing'">
        {{ 
          gameStatus === 'WAITING' ? '等待对手加入...' :
          gameStatus === 'finished' ? '游戏结束！' : '准备开始...'
        }}
      </div>

      <!-- 游戏控制区域 -->
      <div class="game-controls" v-if="gameStatus === 'WAITING'">
        <!-- 房主显示开始游戏按钮 -->
        <template v-if="myInfo.isHost">
          <button 
            class="start-game-btn"
            :disabled="!opponentInfo || !opponentInfo.isReady"
            @click="startGame"
          >
            {{ !opponentInfo ? '等待玩家加入...' : 
               !opponentInfo.isReady ? '等待对手准备...' : 
               '开始游戏' }}
          </button>
        </template>
        <!-- 非房主显示准备按钮 -->
        <template v-else>
          <button 
            class="ready-btn"
            :class="{ 'ready': myInfo?.isReady }"
            @click="toggleReady"
          >
            {{ myInfo?.isReady ? '已准备' : '准备' }}
          </button>
        </template>
      </div>
    </div>

    <!-- 调试面板 -->
    <DebugPanel
      v-if="isDev && showDebugPanel"
      :room-id="roomId"
      :connection-status="connectionStatus"
      :connection-time="connectionTime"
      :stomp-client="stompClient"
      :players="players"
      :player-id="playerId"
      :is-host="isHost"
      :game-status="gameStatus"
      v-on="handleDebugPanelEvents"
    />
  </div>
</template>

<style scoped>
.game-room {
  width: 100%;
}

.game-room-container {
  position: relative;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.game-status {
  text-align: center;
  font-size: 1.5rem;
  color: #2c3e50;
  margin-top: 2rem;
}

.room-info {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-info button {
  padding: 0.5rem 1rem;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.room-info button:hover {
  background: #3aa876;
}

.connection-status {
  padding: 0.5rem;
  margin: 0.5rem 0;
  border-radius: 4px;
  text-align: center;
  font-weight: bold;
}

.connection-status.已连接 {
  background: #42b983;
  color: white;
}

.connection-status.正在连接 {
  background: #e6a23c;
  color: white;
}

.connection-status.连接错误, .connection-status.已断开 {
  background: #f56c6c;
  color: white;
}

.countdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.countdown {
  font-size: 8rem;
  color: white;
  animation: countdownPulse 1s infinite;
}

@keyframes countdownPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.game-controls {
  margin: 2rem 0;
  display: flex;
  justify-content: center;
}

.start-game-btn,
.ready-btn {
  padding: 0.8rem 2rem;
  font-size: 1.2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.start-game-btn {
  background: #42b983;
  color: white;
}

.start-game-btn:disabled {
  background: #a8d5c2;
  cursor: not-allowed;
}

.ready-btn {
  background: #e6a23c;
  color: white;
}

.ready-btn.ready {
  background: #42b983;
}

.ready-btn:hover,
.start-game-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
</style>
