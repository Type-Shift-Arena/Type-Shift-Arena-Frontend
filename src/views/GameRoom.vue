<script setup>
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWebSocket } from '@/composables/useWebSocket'
import { useGameState } from '@/composables/useGameState'
import { usePlayerStats } from '@/composables/usePlayerStats'
import DebugPanel from '@/components/GameRoom/DebugPanel.vue'
import StatusBar from '@/components/GameRoom/StatusBar.vue'
import GameArea from '@/components/GameRoom/GameArea.vue'
import GameResultDialog from '@/components/GameRoom/GameResultDialog.vue'

const route = useRoute()
const router = useRouter()
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
  subscribeToRoomBroadcast,
  subscribeToPlayerChannel,
  subscriptions,
  hasSubscription,
} = useWebSocket(roomId)

// 游戏状态相关
const {
  gameStatus,
  players,
  targetText,
  isHost,
  startGame,
  myInfo,
  opponentInfo,
  handleRoomInfo,
  toggleReady,
  requestRoomInfo,
  leaveRoom,
  recordMatchResult
} = useGameState(roomId, stompClient)

// 玩家统计相关
const {
  playerText,
  myStats,
  opponentStats,
  handleInput,
  updateOpponentStats,
  resetStats
} = usePlayerStats(roomId, stompClient)

/*
  调试面板组件
*/
const isDev = computed(() => import.meta.env.DEV)  // 开发环境判断
const showDebugPanel = ref(false) // 调试面板显示控制
// 快捷键处理
const handleKeyboardShortcut = (event) => {
  // Ctrl + Shift + D (Windows) 或 Cmd + Shift + D (Mac)
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
    event.preventDefault()
    showDebugPanel.value = !showDebugPanel.value
  }
}

/*
  倒计时状态
*/
const countdown = ref(3)
const showCountdown = ref(false)
const gameEvents = ref([]) // 用于记录游戏事件

/*
  游戏结果对话框
*/
const showGameResult = ref(false)
const matchResult = ref(null)
const oldScore = ref(null)
const scoreChange = ref(null)

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
      await subscribeToRoomBroadcast(roomId)
    }

    // 2. 检查并订阅个人房间信息
    if (!hasSubscription(`player_channel_${playerId}`)) {
      await subscribeToPlayerChannel(playerId)
    }

    // 3. 请求初始房间信息
    requestRoomInfo(roomId, playerId, playerName)

  } catch (error) {
    console.error('[GameRoom] 初始化失败:', error)
  }

  // 监听玩家频道消息
  window.addEventListener('player-channel', (event) => {
    handleRoomInfo(event.detail)
  })

  // 监听房间广播消息
  window.addEventListener('room-broadcast', (event) => {
    handleRoomInfo(event.detail)
  })

  // 监听游戏开始事件
  window.addEventListener('game-start', (event) => {
    // 保存游戏开始时间
    localStorage.setItem('startTime', event.detail.startTime)
    showCountdown.value = true
    countdown.value = 3
    
    // 开始倒计时
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
        showCountdown.value = false
        // 重置游戏统计
        resetStats()
      }
    }, 1000)
  })

  // 监听游戏进度事件
  window.addEventListener('game-progress', (event) => {
    const { playerId, stats } = event.detail
    // 如果不是自己的进度，则更新对手状态
    if (playerId !== localStorage.getItem('userId')) {
      updateOpponentStats({
        progress: stats.progress,
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        errorCount: stats.errorCount,
        username: stats.username
      })
    }
  })

  // 监听游戏结束事件
  window.addEventListener('game-finish', (event) => {
    const { winnerId } = event.detail
    
    // 获胜者发送比赛结果
    if (winnerId === localStorage.getItem('userId')) {
      // 准备比赛记录数据
      const roomOptions = JSON.parse(localStorage.getItem('roomOptions')) // 从localStorage中获取匹配选项
      const startTime = localStorage.getItem('startTime')
      const endTime = Date.now()
      const matchData = {
        roomId: roomId,
        player1Id: myInfo.value?.id,
        player2Id: opponentInfo.value?.id,
        winnerId: winnerId,
        language: roomOptions.language,
        category: roomOptions.category,
        difficulty: roomOptions.difficulty,
        player1Wpm: myStats.wpm,
        player2Wpm: opponentStats.wpm,
        player1Accuracy: myStats.accuracy,
        player2Accuracy: opponentStats.accuracy,
        startTime: startTime, 
        endTime: endTime,
        isRanked: false, // 根据实际情况设置
        targetText: targetText.value
      }
      recordMatchResult(matchData)

    } else {
      // 显示失败信息
      logGameEvent('对手获胜！')
    }
  })

  // 监听游戏结果事件
  window.addEventListener('game-result', (event) => {
    handleGameResult(event.detail)
  })

  window.addEventListener('keydown', handleKeyboardShortcut)
})

// 组件卸载时的清理
onUnmounted(() => {
  console.log('[GameRoom] 组件卸载')
  leaveRoom(subscriptions.value)
  window.removeEventListener('keydown', handleKeyboardShortcut)
  
  // 清理订阅
  const playerId = localStorage.getItem('userId')
  if (subscriptions.value.has(`room_${roomId}`)) {
    subscriptions.value.get(`room_${roomId}`).unsubscribe()
    subscriptions.value.delete(`room_${roomId}`)
  }
 
  if (subscriptions.value.has(`player_channel_${playerId}`)) {
    subscriptions.value.get(`player_channel_${playerId}`).unsubscribe()
    subscriptions.value.delete(`player_channel_${playerId}`)
  }

  if (subscriptions.value.has(`matchmaking_${playerId}`)) {
    subscriptions.value.get(`matchmaking_${playerId}`).unsubscribe()
    subscriptions.value.delete(`matchmaking_${playerId}`)
  }
})

// 处理输入
const handleGameInput = (event) => {
  // 调用 usePlayerStats 中的 handleInput 方法处理输入
  const isCompleted = handleInput(event, targetText.value, gameStatus.value)
  
  // 如果完成了游戏
  if (isCompleted) {
    gameStatus.value = 'FINISHED'
  }
}

// 处理离开房间
const handleLeaveRoom = async () => {
  try {
    // 离开房间逻辑
    await leaveRoom(subscriptions.value)
   
    // 断开WebSocket连接
    await disconnect()

    // 跳转回大厅
    router.push('/game-lobby')
  } catch (error) {
    console.error('离开房间失败:', error)
  }
}

// 处理游戏结果
const handleGameResult = (result) => {
  showGameResult.value = true
  console.log('[GameRoom] 处理游戏结果:', result)
  matchResult.value = result.match
  oldScore.value = result.oldScore
  scoreChange.value = result.scoreChange
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
      <div class="room-info">
        <div class="room-id">
          <span>房间ID:</span>
          <span class="id-value">{{ roomId }}</span>
        </div>
        <div class="room-controls">
          <button class="control-btn copy-btn" @click="copyRoomUrl">
            <span class="material-icons">content_copy</span>
            复制房间链接
          </button>
          <button class="control-btn leave-btn" @click="handleLeaveRoom">
            <span class="material-icons">exit_to_app</span>
            离开房间
          </button>
        </div>
      </div>
    

      <!-- 状态栏 -->
      <StatusBar
        :my-stats="myStats"
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
          gameStatus === 'WAITING' ? '等待对手加入...' : '',
          gameStatus === 'FINISHED' ? '游戏结束！' : '',
          gameStatus === 'READY' ? '准备开始...' : '',
          gameStatus === 'PLAYING' ? '游戏中...' : ''
        }}
      </div>

      <!-- 游戏控制区域 -->
      <div class="game-controls" v-if="gameStatus === 'READY'">
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

    <!-- 游戏结果对话框 -->
    <GameResultDialog
      v-if="showGameResult"
      :visible="showGameResult"
      :match="matchResult"
      :old-score="oldScore"
      :score-change="scoreChange"
      @close="handleCloseResult"
      @rematch="handleRematch"
      @leaveRoom="handleLeaveRoom"
    />
  </div>
</template>

<style scoped>
.game-room {
  width: 100%;
  min-height: 100vh;
  color: #fff;
}

.game-room-container {
  position: relative;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  top: 20px;
}

.game-status {
  text-align: center;
  font-size: 1.5rem;
  color: #e4e4e4;
  margin-top: 2rem;
}

.room-info {
  margin-bottom: 1rem;
  padding: 1rem 1.5rem;
  background: var(--secondary-dark);
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid var(--border-color);
}

.room-id {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  color: var(--text-primary);
}

.id-value {
  font-weight: 500;
  color: var(--accent-color);
}

.room-controls {
  display: flex;
  gap: 1rem;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-primary);
}

.copy-btn {
  background: var(--accent-color);
}

.copy-btn:hover {
  background: var(--accent-hover);
}

.leave-btn {
  background: var(--danger-color);
}

.leave-btn:hover {
  background: #dc2626;
}

.material-icons {
  font-size: 1.2rem;
}

.countdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.countdown {
  font-size: 8rem;
  color: #4f46e5;
  animation: countdownPulse 1s infinite;
  text-shadow: 0 0 20px rgba(79, 70, 229, 0.5);
}

.game-controls {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.start-game-btn,
.ready-btn {
  padding: 0.75rem 2rem;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.start-game-btn {
  background: #4f46e5;
  color: white;
  border: none;
}

.start-game-btn:hover:not(:disabled) {
  background: #4338ca;
  transform: translateY(-2px);
}

.ready-btn {
  background: rgba(79, 70, 229, 0.1);
  color: #4f46e5;
  border: 1px solid #4f46e5;
}

.ready-btn:hover:not(:disabled) {
  background: rgba(79, 70, 229, 0.2);
  transform: translateY(-2px);
}

.ready-btn.ready {
  background: #4f46e5;
  color: white;
}

.start-game-btn:disabled,
.ready-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

@keyframes countdownPulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
