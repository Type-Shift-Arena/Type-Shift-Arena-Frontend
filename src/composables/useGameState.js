/*
 * @Author: hiddenSharp429 z404878860@163.com
 * @Date: 2024-11-14 19:40:25
 * @LastEditors: hiddenSharp429 z404878860@163.com
 * @LastEditTime: 2024-11-15 21:41:54
 */
import { ElNotification } from 'element-plus'
import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useGameState(roomId, stompClient) {
  const gameStatus = ref('waiting')
  const players = ref([])
  const targetText = ref('')
  const playerId = ref(localStorage.getItem('userId'))
  const opponentInfo = ref(null)
  const myInfo = ref(null)
  const isMatching = ref(false) // 添加匹配状态
  const processedMessages = ref(new Set()) // 添加消息去重集合
  
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

  // 处理玩家离开
  const handlePlayerLeave = (data) => {
    const leftPlayerId = String(data.playerId)
    // 从玩家列表中移除离开的玩家
    players.value = players.value.filter(id => id !== leftPlayerId)
    // 如果对手离开，重置对手信息
    if (opponentInfo.value?.id === leftPlayerId) {
      opponentInfo.value = null
    }
    // 如果房间变空，重置游戏状态
    if (players.value.length < 2) {
      gameStatus.value = 'waiting'
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

  // 处理房间消息
  const handleRoomInfo = (message) => {
    if (!message) return
    
    console.log('[GameState] 收到房间消息:', message)

    // 防止重复处理相同消息
    const messageKey = `${message.type}_${message.timestamp}`
    if (processedMessages.value.has(messageKey)) {
      console.log('[GameState] 跳过重复消息:', messageKey)
      return
    }
    processedMessages.value.add(messageKey)

    // 清理旧消息（保留最近100条）
    if (processedMessages.value.size > 100) {
      const iterator = processedMessages.value.values()
      processedMessages.value.delete(iterator.next().value)
    }

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
      const isReady = message.isReady
      if (isReady){
        ElNotification({
          title: '玩家准备',
          message: '对手已准备好',
          type: 'success',
          duration: 1500,
        });
      }else{
        ElNotification({
          title: '取消准备',
          message: '对手取消准备',
          type: 'warning',
          duration: 1500,
        });
      }
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

    if (message.type === 'GAME_FINISH') {
      console.log('[GameState] 游戏结束:', message)
      gameStatus.value = 'finished'
      
      // 触发游戏结束事件
      window.dispatchEvent(new CustomEvent('game-finish', {
        detail: {
          winnerId: message.playerId,
          timestamp: message.timestamp
        }
      }))
    }

    if (message.type === 'PLAYER_LEAVE') {
      console.log('[GameState] 玩家离开:', message)
      ElNotification({
        title: '玩家离开',
        message: '对手已离开',
        type: 'warning',
        duration: 1500,
      });
      handlePlayerLeave(message)
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

  // 添加结束游戏的方法
  const finishGame = (playerId) => {
    if (stompClient.value?.connected) {
      stompClient.value.publish({
        destination: `/app/room/${roomId}/finish`,
        body: JSON.stringify({
          type: 'GAME_FINISH',
          playerId: playerId,
          timestamp: Date.now()
        })
      })
    }
  }

  // 离开房间
  const leaveRoom = async (stompClient, subscriptions, router) => {
    try {
      // 发送离开房间消息
      if (stompClient?.connected) {
        stompClient.publish({
          destination: `/app/room/${roomId}/leave`,
          body: JSON.stringify({
            type: 'PLAYER_LEAVE',
            playerId: localStorage.getItem('userId'),
            timestamp: Date.now()
          })
        })
      }

      // 清理订阅
      const playerId = localStorage.getItem('userId')
      if (subscriptions.has(`room_${roomId}`)) {
        subscriptions.get(`room_${roomId}`).unsubscribe()
        subscriptions.delete(`room_${roomId}`)
      }
      if (subscriptions.has(`player_channel_${playerId}`)) {
        subscriptions.get(`player_channel_${playerId}`).unsubscribe()
        subscriptions.delete(`player_channel_${playerId}`)
      }
      if (subscriptions.has(`matchmaking_${playerId}`)) {
        subscriptions.get(`matchmaking_${playerId}`).unsubscribe()
        subscriptions.delete(`matchmaking_${playerId}`)
      }

      // 重置所有状态
      resetGame()
      gameStatus.value = 'waiting'
      players.value = []
      targetText.value = ''
      myInfo.value = null
      opponentInfo.value = null
      isMatching.value = false // 重置匹配状态
      processedMessages.value.clear() // 清理消息记录

      // 等待一小段时间确保状态清理完成
      await new Promise(resolve => setTimeout(resolve, 100))

      // 跳转回大厅
      router.push('/game-lobby')
    } catch (error) {
      console.error('离开房间失败:', error)
      throw error
    }
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
    handlePlayerLeave,
    handleRoomInfo,
    toggleReady,
    requestRoomInfo,
    finishGame,
    leaveRoom,
    isMatching
  }
}
