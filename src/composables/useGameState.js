/*
 * @Author: hiddenSharp429 z404878860@163.com
 * @Date: 2024-11-14 19:40:25
 * @LastEditors: hiddenSharp429 z404878860@163.com
 * @LastEditTime: 2024-11-15 21:41:54
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useGameState(roomId, stompClient) {
  const gameStatus = ref('waiting')
  const players = ref([])
  const targetText = ref('')
  const playerId = ref(localStorage.getItem('userId'))
  const opponentInfo = ref(null)
  const myInfo = ref(null)
  
  // 计算是否为房主
  const isHost = computed(() => {
    const currentPlayerId = String(playerId.value)
    const firstPlayer = String(players.value[0])
    return currentPlayerId === firstPlayer
  })

  // 计算房间是否满员
  const isRoomFull = computed(() => players.value.length >= 2)

  // 重置游戏
  const resetGame = () => {
    gameStatus.value = 'waiting'
    // 保留当前玩家
    players.value = players.value.filter(id => id === playerId.value)
  }

  // 切换游戏状态
  const toggleGameStatus = () => {
    const statusMap = {
      'waiting': 'ready',
      'ready': 'playing',
      'playing': 'finished',
      'finished': 'waiting'
    }
    gameStatus.value = statusMap[gameStatus.value]
  }

  // 处理玩家加入
  const handlePlayerJoin = (data) => {
    const joinedPlayerId = String(data.playerId)
    
    if (!players.value.includes(joinedPlayerId)) {
      players.value = [...players.value, joinedPlayerId]
      
      if (players.value.length >= 2) {
        console.log('房间满员，准备开始游戏')
        gameStatus.value = 'ready'
        if (isHost.value) {
          console.log('作为房主开始游戏，3秒后开始')
          setTimeout(startGame, 3000)
        }
      }
    }
  }

  // 开始游戏
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

  // 请求房间信息的函数
  const requestRoomInfo = (roomId, playerId, playerName) => {
    if (!stompClient.value?.connected) {
      console.error('WebSocket未连接，无法请求房间信息')
      return
    }

    console.log(`[GameState] 请求房间信息: roomId=${roomId}, playerId=${playerId}`)
    
    stompClient.value.publish({
      destination: `/app/room/${roomId}/info`,
      body: JSON.stringify({
        type: "REQUEST_ROOM_INFO",
        roomId: roomId,
        playerId: playerId,
        playerName: playerName,
        timestamp: Date.now()
      })
    })
  }

  // 处理房间信息
  const handleRoomInfo = (message) => {    
    if (message.type === 'GAME_INFO') {
      console.log("[GameState] 处理房间信息:", message)
      // 更新玩家信息
      if (message.playerId === playerId.value) {
        myInfo.value = {
          id: message.playerId,
          name: message.playerName,
          avatar: message.playerAvatar,
          isHost: message.isHost
        }
        opponentInfo.value = {
          id: message.opponentId,
          name: message.opponentName,
          avatar: message.opponentAvatar
        }
      }
      // 更新玩家列表
      if (message.playersId) {
        players.value = message.playersId
      }
      // 更新游戏状态
      if (message.roomStatus) {
        gameStatus.value = message.roomStatus
      }
      // 更新目标文本
      if (message.targetText) {
        targetText.value = message.targetText
      }
    }

    if (message.type === 'PLAYER_READY') {
      console.log("[GameState] 处理玩家准备消息:", message)
      opponentInfo.value = { 
        ...opponentInfo.value,
        isReady: message.isReady 
      }
    }

    if (message.type === 'GAME_START') {
      console.log('[GameState] 处理游戏开始消息:', message)

      gameStatus.value = 'playing'
      
      if (message.targetText) {
        targetText.value = message.targetText
      }
      
      myInfo.value = {
        ...myInfo.value,
        isReady: false
      }
      
      opponentInfo.value = {
        ...opponentInfo.value,
        isReady: false
      }
      
      // 创建触发游戏开始事件
      window.dispatchEvent(new CustomEvent('game-start', {
        detail: {
          targetText: message.targetText,
          startTime: message.startTime || new Date().getTime()
        }
      }))
    }

    if (message.type === "PLAYER_PROGRESS") {
      console.log('[GameState] 更新玩家进度:', message)
      window.dispatchEvent(new CustomEvent('game-progress', {
        detail: {
          playerId: message.playerId,
          percentage: message.percentage,
          stats: message.stats
        }
      }))
    }
  }

  // 切换准备状态
  const toggleReady = () => {
    if (!stompClient.value?.connected) return
    
    const ready = !myInfo.value?.isReady
    myInfo.value = {
      ...myInfo.value,
      isReady: ready
    }
    
    stompClient.value.publish({
      destination: `/app/room/${roomId}/ready`,
      body: JSON.stringify({
        type: 'PLAYER_READY',
        playerId: playerId.value,
        isReady: ready,
        timestamp: Date.now()
      })
    })
  }

  return {
    gameStatus,
    players,
    targetText,
    playerId,
    isHost,
    isRoomFull,
    opponentInfo,
    myInfo,       
    resetGame,
    toggleGameStatus,
    startGame,
    handlePlayerJoin,
    handleRoomInfo,  
    toggleReady,
    requestRoomInfo
  }
}
