/*
 * @Author: hiddenSharp429 z404878860@163.com
 * @Date: 2024-11-14 19:40:25
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2024-12-30 22:29:05
 */
import { ElNotification } from 'element-plus'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePlayerStats } from './usePlayerStats'

export function useGameState(roomId, stompClient) {
  // 初始化 playerStats
  const playerStats = usePlayerStats(roomId, stompClient)
  const gameStatus = ref('')
  const players = ref([])
  const targetText = ref('')
  const playerId = ref(localStorage.getItem('userId'))
  const isMatching = ref(false) // 添加匹配状态
  const processedMessages = ref(new Set())
  const myInfo = playerStats.myInfo
  const opponentInfo = playerStats.opponentInfo

  // 计算是否为房主
  const isHost = computed(() => {
    const currentPlayerId = String(playerId.value)
    const firstPlayer = String(players.value[0])
    return currentPlayerId === firstPlayer
  })

  // 计算房间是否满员
  const isRoomFull = computed(() => players.value.length >= 2)

  // 处理玩家加入
  const handlePlayerJoin = (data) => {
    // 更新玩家信息
    playerStats.updatePlayerInfo(data)
  }

  // 处理玩家离开
  const handlePlayerLeave = (data) => {
    // const leftPlayerId = String(data.playerId)
    // // 从玩家列表中移除离开的玩家
    // players.value = players.value.filter(id => id !== leftPlayerId)
    // // 如果对手离开，重置对手信息
    // if (opponentInfo.value?.id === leftPlayerId) {
    //   opponentInfo.value = null
    // }
    // // 如果房间变空，重置游戏状态
    // if (players.value.length < 2) {
    //   gameStatus.value = 'waiting'
    // }

    // 更新玩家信息
    playerStats.updatePlayerInfo(data)
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
      
      // 使用 playerStats 的方法更新玩家信息
      playerStats.updatePlayerInfo(message)

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
      
      // 设置房间状态
      gameStatus.value = message.roomStatus
      console.log("[GameState] 设置房间状态:", gameStatus.value)

      const isReady = message.isReady
      
      opponentInfo.value = {
        ...opponentInfo.value,
        isReady: isReady
      }
      
      // 显示通知
      ElNotification({
        title: isReady ? '玩家准备' : '取消准备',
        message: isReady ? '对手已准备好' : '对手取消准备',
        type: isReady ? 'success' : 'warning',
        duration: 1500,
      });
    }

    if (message.type === 'GAME_START') {
      console.log('[GameState] 处理游戏开始消息:', message)
      
      // 设置房间状态
      gameStatus.value = message.roomStatus
      console.log("[GameState] 设置房间状态:", gameStatus.value)
      
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
          startTime: message.timestamp
        }
      }))
    }

    if (message.type === "PLAYER_PROGRESS") {
      console.log('[GameState] 更新玩家进度:', message)
      window.dispatchEvent(new CustomEvent('game-progress', {
        detail: {
          playerId: message.playerId,
          stats: message.stats
        }
      }))
    }

    if (message.type === 'GAME_FINISH') {
      console.log('[GameState] 游戏结束:', message)

      // 设置房间状态
      gameStatus.value = message.roomStatus
      console.log("[GameState] 设置房间状态:", gameStatus.value)
      
      // 触发游戏结束事件
      window.dispatchEvent(new CustomEvent('game-finish', {
        detail: {
          winnerId: message.playerId,
          timestamp: message.timestamp
        }
      }))
    }

    if (message.type === 'GAME_RESULT') {
      console.log('[GameState] 处理游戏结果:', message)
      window.dispatchEvent(new CustomEvent('game-result', {
        detail: {
          match: message.match,
          oldScore: message.oldScore,
          scoreChange: message.scoreChange
        }
      }))
    }

    if (message.type === 'PLAYER_LEAVE') {
      console.log('[GameState] 玩家离开:', message)
      
      // 设置房间状态
      gameStatus.value = message.roomStatus
      console.log("[GameState] 设置房间状态:", gameStatus.value)

      ElNotification.closeAll() // 清除所有通知
      ElNotification({
        title: '玩家离开',
        message: `对手已离开`,
        type: 'info',
        duration: 1500,
      });
      handlePlayerLeave(message)
    }

    if (message.type === 'PLAYER_JOIN') {
      console.log('[GameState] 玩家加入:', message)

      // 设置房间状态
      gameStatus.value = message.roomStatus
      console.log("[GameState] 设置房间状态:", gameStatus.value)

      ElNotification.closeAll() // 清除所有通知
      ElNotification({
        title: '玩家加入',
        message: `玩家：${message.opponentName}，已加入`,
        type: 'info',
        duration: 1500,
      });
      handlePlayerJoin(message)
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

  // 结束游戏
  const finishGame = (playerId) => {
    if (stompClient.value?.connected) {
      console.log('发送游戏结束消息')
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

  // 加入房间
  const joinRoom = async (roomId, playerId, playerName) => {
    try {
      // 发送加入房间消息
      if (stompClient.value?.connected) {
        stompClient.value.publish({
          destination: `/app/room/${roomId}/join`,
          body: JSON.stringify({
            type: 'PLAYER_JOIN',
            playerId: playerId,
            playerName: playerName,
          })
        })
      }
    } catch (error) {
      console.error('加入房间失败:', error)
      throw error
    }
  }

  // 离开房间
  const leaveRoom = async (subscriptions) => {
    try {
      // 发送离开房间消息
      const playerId = localStorage.getItem('userId')
      const playerName = localStorage.getItem('userName')
      if (stompClient.value?.connected) {
        console.log(`[GameState] 发送离开房间消息: playerId=${playerId}, playerName=${playerName}`)
        stompClient.value.publish({
          destination: `/app/room/${roomId}/leave`,
          body: JSON.stringify({
            type: 'PLAYER_LEAVE',
            playerId: playerId,
            playerName: playerName,
          })
        })
      }

      // 清理订阅
      if (subscriptions) {
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
      }

      // 等待一小段时间确保状态清理完成
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error('离开房间失败:', error)
      throw error
    }
  }

  // 记录比赛结果
  const recordMatchResult = (matchData) => {
    if (!stompClient.value?.connected) {
      console.error('WebSocket未连接，无法记录比赛结果')
      return
    }
  
    console.log('[GameState] 记录比赛结果:', matchData)
    stompClient.value.publish({
      destination: `/app/room/${roomId}/record`,
      body: JSON.stringify(matchData)
    })
  }

  return {
    gameStatus,
    players,
    targetText,
    playerId,
    isHost,
    isRoomFull,
    isMatching,
    opponentInfo: playerStats.opponentInfo,
    myInfo: playerStats.myInfo,
    startGame,
    handlePlayerJoin,
    handlePlayerLeave,
    handleRoomInfo,
    toggleReady,
    requestRoomInfo,
    finishGame,
    joinRoom,
    leaveRoom,
    recordMatchResult
  }
}
