<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useWebSocket } from '@/composables/useWebSocket'
import { useGameState } from '@/composables/useGameState'
import { usePlayerStats } from '@/composables/usePlayerStats'
import DebugPanel from '@/components/GameRoom/DebugPanel.vue'
import StatusBar from '@/components/GameRoom/StatusBar.vue'

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
  disconnect
} = useWebSocket(roomId)

// 游戏状态相关
const {
  gameStatus,
  players,
  targetText,
  isHost,
  isRoomFull,
  startGame,
  handlePlayerJoin
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
const showDebugPanel = ref(true)

// 快捷键处理
const handleKeyboardShortcut = (event) => {
  // Ctrl + Shift + D (Windows) 或 Cmd + Shift + D (Mac)
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
    event.preventDefault()
    showDebugPanel.value = !showDebugPanel.value
  }
}

// 生命周期钩子
onMounted(() => {
  window.addEventListener('keydown', handleKeyboardShortcut)
  connectWebSocket()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyboardShortcut)
  disconnect()
})
</script>

<template>
  <div class="game-room">
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
      />

      <!-- 游戏区域 -->
      <div class="game-content">
        <!-- 目标文本 -->
        <div class="target-text">
          <span 
            v-for="(char, index) in targetText" 
            :key="index"
            :class="{
              'correct': playerText[index] === char,
              'incorrect': playerText[index] && playerText[index] !== char,
              'current': playerText.length === index,
              'space': char === ' '
            }"
          >{{ char === ' ' ? '␣' : char }}</span>
        </div>

        <!-- 输入区域 -->
        <textarea
          v-model="playerText"
          @input="handleInput"
          :disabled="gameStatus === 'finished'"
          :placeholder="gameStatus === 'playing' ? '开始输入...' : '等待对手加入...'"
          class="input-area"
        ></textarea>
      </div>

      <!-- 游戏状态 -->
      <div class="game-status" v-if="gameStatus !== 'playing'">
        {{ 
          gameStatus === 'waiting' ? '等待对手加入...' :
          gameStatus === 'finished' ? '游戏结束！' : '准备开始...'
        }}
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

.game-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.target-text {
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  color: #2c3e50;
}

.input-area {
  width: 100%;
  min-height: 100px;
  padding: 1rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 1.2rem;
  line-height: 1.6;
  resize: vertical;
}

.input-area:focus {
  outline: none;
  border-color: #42b983;
}

.input-area:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
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

.target-text span.space {
  /* 为空格字符添加特殊样式 */
  border-radius: 2px;
  margin: 0 1px;
  color: #c7c7c7;
  font-size: 0.9em;
}

.target-text span.space.correct {
  background-color: rgba(66, 185, 131, 0.1);
}

.target-text span.space.incorrect {
  background-color: rgba(255, 107, 107, 0.1);
}
</style>
