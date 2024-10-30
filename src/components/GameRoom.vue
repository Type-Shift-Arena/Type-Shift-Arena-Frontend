<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Client } from '@stomp/stompjs'
import { WS_URL, API_BASE_URL } from '@/config'

const router = useRouter()
const route = useRoute()
const roomId = route.params.id

// 核心状态
const stompClient = ref(null)
const gameStatus = ref('waiting') // waiting, ready, playing, finished
const playerText = ref('')
const targetText = ref('The quick brown fox jumps over the lazy dog.') // 测试用文本
const myProgress = ref(0)
const opponentProgress = ref(0)

// 游戏统计
const startTime = ref(null)
const wpm = ref(0) // 每分钟字数
const accuracy = ref(100)
const errorCount = ref(0)

// 添加性能监控
const performanceStats = ref({
  inputLatency: 0,
  renderTime: 0,
  lastInputTime: null
})

// 添加连接状态
const connectionStatus = ref('未连接')

// 添加开发环境判断
const isDev = computed(() => import.meta.env.DEV)

// 添加更多连接状态相关的响应式变量
const connectionTime = ref('')
const connectionLogs = ref([])

// 添加调试面板显示控制
const showDebugPanel = ref(true)

// 添加 Mac 检测
const isMac = computed(() => {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0
})

// 修改玩家状态相关代码
const username = ref(localStorage.getItem('userName'))
const playerId = ref(null)

// 添加获取用户ID的方法
const fetchPlayerId = async () => {
  try {
    if (!username.value) {
      console.error('未找到用户名')
      router.push('/login') // 如果没有用户名，重定向到登录页
      return
    }
    
    const response = await fetch(`${API_BASE_URL}/users/username/${username.value}`)
    if (!response.ok) {
      throw new Error('获取用户ID失败')
    }
    
    const data = await response.json()
    playerId.value = data.id
    localStorage.setItem('userId', playerId.value) // 缓存用户ID
    console.log('获取到用户ID:', playerId.value)
  } catch (error) {
    console.error('获取用户ID时出错:', error)
    router.push('/login') // 出错时重定向到登录页
  }
}

// 连接WebSocket
const connectWebSocket = async () => {
  try {
    // 确保先获取到用户ID
    if (!playerId.value) {
      await fetchPlayerId()
    }
    
    if (!playerId.value) {
      throw new Error('无法获取用户ID')
    }

    connectionStatus.value = '正在连接...'
    
    // 使用原生 WebSocket
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${wsProtocol}//${window.location.hostname}:9090/ws`
    console.log('正在连接到WebSocket服务器:', wsUrl)
    
    const ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log('[WebSocket] 连接已打开')
      connectionStatus.value = '已连接'
      connectionTime.value = new Date().toLocaleTimeString()
    }

    ws.onclose = (event) => {
      console.log('[WebSocket] 连接已关闭:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      })
      connectionStatus.value = '已断开'
    }

    ws.onerror = (error) => {
      console.error('[WebSocket] 错误:', error)
      connectionStatus.value = '连接错误'
    }

    const client = new Client({
      webSocketFactory: () => ws,
      debug: (str) => console.log('[STOMP Debug]:', str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    })

    client.onConnect = (frame) => {
      console.log('[STOMP] 连接成功:', frame)
      connectionStatus.value = '已连接'
      connectionTime.value = new Date().toLocaleTimeString()
      
      // 订阅房间频道
      client.subscribe(`/topic/room/${roomId}`, (message) => {
        try {
          console.log('收到消息:', message.body)
          const data = JSON.parse(message.body)
          
          switch (data.type) {
            case 'ROOM_INFO':
              // 处理房间信息
              console.log('收到房间信息:', data)
              players.value = data.players || []
              gameStatus.value = data.gameStatus || 'waiting'
              console.log('更新后的玩家列表:', players.value)
              
              // 如果房间已满且是准备状态，且自己是房主，则开始游戏
              if (players.value.length >= 2 && gameStatus.value === 'ready' && 
                  players.value[0] === playerId.value) {
                setTimeout(startGame, 3000)
              }
              break
              
            case 'PLAYER_JOIN':
              handlePlayerJoin(data)
              break
              
            case 'PLAYER_LEAVE':
              const index = players.value.indexOf(data.playerId)
              if (index > -1) {
                players.value = players.value.filter(id => id !== data.playerId)
                console.log('玩家离开后的列表:', players.value)
                // 如果对手离开，重置游戏状态
                if (gameStatus.value !== 'waiting') {
                  resetGame()
                  alert('对手已离开游戏')
                }
              }
              break
              
            case 'PLAYER_PROGRESS':
              if (data.playerId !== playerId.value) {
                opponentProgress.value = data.percentage
              }
              break
              
            case 'GAME_START':
              console.log('收到游戏开始消息')
              gameStatus.value = 'playing'
              startTime.value = Date.now()
              playerText.value = ''
              break
              
            case 'GAME_FINISH':
              if (data.playerId !== playerId.value) {
                gameStatus.value = 'finished'
                alert('对手已完成！')
              }
              break
          }
        } catch (error) {
          console.error('处理消息时出错:', error)
        }
      })

      // 获取房间信息
      fetchRoomInfo()
      
      // 延迟发送加入消息
      setTimeout(() => {
        console.log('发送加入房间消息')
        client.publish({
          destination: `/app/room/${roomId}/join`,
          body: JSON.stringify({
            type: 'PLAYER_JOIN',
            playerId: playerId.value,
            timestamp: new Date().toISOString()
          })
        })
      }, 500) // 稍微延迟发送加入消息，确保先收到房间信息
    }

    client.onStompError = (frame) => {
      console.error('[STOMP] 错误:', frame)
      connectionStatus.value = '连接错误'
      connectionTime.value = ''
    }

    console.log('正在激活STOMP客户端...')
    client.activate()
    stompClient.value = client

  } catch (error) {
    console.error('[连接错误]:', error)
    connectionStatus.value = '连接失败'
    console.error('详细错误信息:', {
      error,
      stack: error.stack,
      message: error.message
    })
  }
}

// 添加快捷键处理
const handleKeyboardShortcut = (event) => {
  // Ctrl + Shift + D (Windows) 或 Cmd + Shift + D (Mac)
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
    event.preventDefault()
    showDebugPanel.value = !showDebugPanel.value
  }
}

// 修改发送进度的方法
const sendProgress = () => {
  if (stompClient.value?.connected) {
    stompClient.value.publish({
      destination: `/app/room/${roomId}/progress`,
      body: JSON.stringify({
        type: 'PLAYER_PROGRESS',
        playerId: playerId.value,
        percentage: myProgress.value
      })
    })
  }
}

// 处理输入
const handleInput = (event) => {
  // 计算输入延迟
  if (performanceStats.value.lastInputTime) {
    performanceStats.value.inputLatency = Date.now() - performanceStats.value.lastInputTime
  }
  performanceStats.value.lastInputTime = Date.now()

  const startRender = performance.now()
  if (gameStatus.value !== 'playing') return
  
  const currentInput = event.target.value
  playerText.value = currentInput

  // 计算进度
  const correctChars = currentInput.split('').filter((char, index) => 
    char === targetText.value[index]
  ).length
  
  myProgress.value = Math.round((correctChars / targetText.value.length) * 100)

  // 计算错误
  errorCount.value = currentInput.split('').filter((char, index) => 
    char !== targetText.value[index] && index < targetText.value.length
  ).length

  // 计算准确率
  accuracy.value = Math.round(((currentInput.length - errorCount.value) / currentInput.length) * 100) || 100

  // 计WPM
  if (startTime.value) {
    const timeElapsed = (Date.now() - startTime.value) / 1000 / 60 // 转换为分钟
    const wordsTyped = correctChars / 5 // 假设一个单词平均5个字符
    wpm.value = Math.round(wordsTyped / timeElapsed)
  }

  // 发送进度
  sendProgress()

  // 检查是否完成
  if (myProgress.value === 100) {
    gameStatus.value = 'finished'
    if (stompClient.value && stompClient.value.connected) {
      stompClient.value.publish({
        destination: `/app/room/${roomId}/finish`,
        body: JSON.stringify({})
      })
    }
  }
}

// 添加调试方法
const simulateOpponent = () => {
  opponentProgress.value = Math.min(100, opponentProgress.value + 10)
}

// 修改重置游戏方法
const resetGame = () => {
  playerText.value = ''
  myProgress.value = 0
  opponentProgress.value = 0
  errorCount.value = 0
  accuracy.value = 100
  wpm.value = 0
  startTime.value = null
  gameStatus.value = 'waiting'
  // 保留当前玩家
  players.value = players.value.filter(id => id === playerId.value)
}

const toggleGameStatus = () => {
  const statusMap = {
    'waiting': 'ready',
    'ready': 'playing',
    'playing': 'finished',
    'finished': 'waiting'
  }
  gameStatus.value = statusMap[gameStatus.value]
  if (gameStatus.value === 'playing') {
    startTime.value = Date.now()
  }
}

// 添加重连方法
const reconnectWebSocket = () => {
  if (stompClient.value) {
    stompClient.value.deactivate()
  }
  setTimeout(() => {
    connectWebSocket()
  }, 1000)
}

// 添加复制链接功能
const copyRoomUrl = () => {
  const url = `${window.location.origin}/test-room/${roomId}`
  navigator.clipboard.writeText(url)
    .then(() => alert('房间链接已复制到剪贴板'))
    .catch(err => console.error('复制失败:', err))
}

// 添加连接检查方法
const checkConnection = () => {
  if (stompClient.value?.connected) {
    console.log('WebSocket 连接正常')
    alert('WebSocket 连接正常')
  } else {
    console.log('WebSocket 未连接')
    alert('WebSocket 未连接')
  }
}

// 添加测试连接的方法
const sendTestMessage = () => {
  console.log('Attempting to send test message...');
  console.log('STOMP Client status:', stompClient.value?.connected);
  
  if (stompClient.value && stompClient.value.connected) {
    stompClient.value.publish({
      destination: '/app/test',
      body: JSON.stringify({ message: 'Test message' })
    });
    console.log('Test message sent');
  } else {
    console.error('WebSocket not connected');
    // 尝试重新连接
    connectWebSocket();
  }
}

const players = ref([])
const isRoomFull = computed(() => players.value.length >= 2)

// 修改处理玩家加入的逻辑
const handlePlayerJoin = (data) => {
  console.log('处理玩家加入:', data)
  // 如果玩家不在列表中，添加玩家
  if (!players.value.includes(data.playerId)) {
    players.value = [...players.value, data.playerId]
    console.log('玩家列表更新:', players.value)
  }
  
  // 如果房间满员，自动准备
  if (players.value.length >= 2) {
    console.log('房间满员，准备开始游戏')
    gameStatus.value = 'ready'
    // 房主(第一个玩家)负责开始游戏
    if (players.value[0] === playerId.value) {
      console.log('作为房主开始游戏，3秒后开始')
      setTimeout(() => {
        startGame()
      }, 3000)
    }
  }
}

// 添加房间状态管理
const roomState = ref({
  players: [],
  gameStatus: 'waiting',
  createdAt: null
})

// 添加获取房间信息的方法
const fetchRoomInfo = async () => {
  try {
    if (stompClient.value?.connected) {
      stompClient.value.publish({
        destination: `/app/room/${roomId}/info`,
        body: JSON.stringify({
          type: 'GET_ROOM_INFO',
          playerId: playerId.value
        })
      })
    }
  } catch (error) {
    console.error('获取房间信息失败:', error)
  }
}

// 修改开始游戏方法
const startGame = () => {
  if (stompClient.value?.connected) {
    console.log('发送游戏开始消息')
    stompClient.value.publish({
      destination: `/app/room/${roomId}/start`,
      body: JSON.stringify({
        type: 'GAME_START',
        playerId: playerId.value,
        timestamp: new Date().toISOString()
      })
    })
  } else {
    console.error('无法开始游戏：WebSocket未连接')
  }
}


// 生命周期钩子
onMounted(async () => {
  console.log('组件挂载，开始连接 WebSocket')
  if (!username.value) {
    console.log('未找到用户名，重定向到登录页')
    router.push('/login')
    return
  }
  await connectWebSocket()
  window.addEventListener('keydown', handleKeyboardShortcut)
})


onUnmounted(() => {
  console.log('组件卸载，发送离开消息')
  if (stompClient.value?.connected) {
    stompClient.value.publish({
      destination: `/app/room/${roomId}/leave`,
      body: JSON.stringify({
        type: 'PLAYER_LEAVE',
        playerId: playerId.value,
        timestamp: new Date().toISOString()
      })
    })
  }
  if (stompClient.value) {
    stompClient.value.deactivate()
  }
  // 移除快捷键监听
  window.removeEventListener('keydown', handleKeyboardShortcut)
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
      <div class="status-bar">
        <div class="player-stats">
          <p>玩家数量: {{ players.length }}/2</p>
          <p>你的ID: {{ username }}</p>
          <p>房间状态: {{ gameStatus }}</p>
          <div class="progress-bar">
            <div class="progress" :style="{ width: `${myProgress}%` }"></div>
          </div>

          <div class="stats">
            <span>WPM: {{ wpm }}</span>
            <span>准确率: {{ accuracy }}%</span>
            <span>错误: {{ errorCount }}</span>
          </div>
          
        </div>
        <div class="vs">VS</div>
        <div class="opponent-stats">
          <div class="progress-bar">
            <div class="progress" :style="{ width: `${opponentProgress}%` }"></div>
          </div>
        </div>
      </div>

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
              'current': playerText.length === index
            }"
          >{{ char }}</span>
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

    <!-- 调试面板的条件 -->
    <div v-if="isDev && showDebugPanel" class="debug-panel">
      <div class="debug-info">
          <div class="debug-header">
            <h3>连接信息</h3>
            <div class="keyboard-shortcut">
              <span class="key">{{ isMac ? '⌘' : '⌃' }}</span>
              <span class="key">⇧</span>
              <span class="key">D</span>
            </div>
          </div>
          <p>状态: {{ connectionStatus }}</p>
          <p>房间ID: {{ roomId }}</p>
          <p>连接时间: {{ connectionTime }}</p>
          <p>玩家列表: {{ players.join(', ') }}</p>
          <p>当前玩家: {{ playerId }}</p>
          <p>是否房主: {{ players[0] === playerId }}</p>
          <p>游戏状态: {{ gameStatus }}</p>
          <p>WebSocket状态: {{ stompClient?.connected ? '已连接' : '未连接' }}</p>
        </div>
        <div class="connection-status" :class="connectionStatus">
          {{ connectionStatus }}
        </div>
        <div class="debug-controls">
          <button @click="reconnectWebSocket">重新连接</button>
          <button @click="checkConnection">检查连接</button>
          <button @click="sendTestMessage">发送测试消息</button>
        </div>
    </div>

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

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.player-stats, .opponent-stats {
  flex: 1;
}

.vs {
  padding: 0 1rem;
  font-weight: bold;
  color: #2c3e50;
}

.progress-bar {
  height: 20px;
  background: #eee;
  border-radius: 10px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: #42b983;
  transition: width 0.3s ease;
}

.stats {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #666;
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

.debug-panel {
  position: absolute;
  top: 10rem;
  right: 1rem;
  background: rgba(44, 62, 80, 0.9);
  color: white;
  padding: 1rem;
  border-radius: 8px;
  max-width: 300px;
  z-index: 1000;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.debug-info {
  margin-bottom: 1rem;
}

.debug-info h3 {
  margin: 0 0 0.5rem 0;
  color: #42b983;
}

.debug-info p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
}

.debug-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.debug-controls button {
  background: #42b983;
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.debug-controls button:hover {
  background: #3aa876;
}

/* 加字符状态样式 */
.target-text span {
  display: inline-block;
  position: relative;
}

.target-text span.correct {
  color: #42b983;
}

.target-text span.incorrect {
  color: #ff6b6b;
  text-decoration: underline;
}

.target-text span.current {
  background-color: rgba(66, 185, 131, 0.1);
}

.target-text span.current::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 2px;
  background-color: #42b983;
  animation: blink 1s infinite;
}

@keyframes blink {
  50% { opacity: 0; }
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

.debug-info p {
  margin: 0.25rem 0;
  font-family: monospace;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.debug-header h3 {
  margin: 0;
  color: #42b983;
}

.keyboard-shortcut {
  display: flex;
  gap: 2px;
  font-size: 12px;
}

.keyboard-shortcut .key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  font-family: system-ui, -apple-system, sans-serif;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
}
</style>
