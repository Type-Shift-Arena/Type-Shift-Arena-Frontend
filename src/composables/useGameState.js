/*
 * @Author: hiddenSharp429 z404878860@163.com
 * @Date: 2024-11-14 19:40:25
 * @LastEditors: hiddenSharp429 z404878860@163.com
 * @LastEditTime: 2024-11-15 19:38:28
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useGameState(roomId, stompClient) {
  const gameStatus = ref('waiting') // waiting, ready, playing, finished
  const players = ref([])
  const targetText = ref('') // 目标文本
  const playerId = ref(localStorage.getItem('userId'))
  const opponentInfo = ref(null)  // 对手信息
  const myInfo = ref(null)        // 我的信息
  
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

  // 获取房间信息
  const fetchRoomInfo = () => {
    if (stompClient.value?.connected) {
      stompClient.value.publish({
        destination: `/app/room/${roomId}/info`,
        body: JSON.stringify({
          type: 'GET_ROOM_INFO',
          playerId: String(playerId.value),
          username: localStorage.getItem('userName')
        })
      })
    }
  }

  // 处理房间信息
  const handleRoomInfo = (message) => {    
    if (message.type === 'GAME_INFO') {
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
      if (message.playerId === opponentInfo.value?.id) {
        opponentInfo.value = {
          ...opponentInfo.value,
          isReady: message.isReady
        }
      } else if (message.playerId === myInfo.value?.id) {
        myInfo.value = {
          ...myInfo.value,
          isReady: message.isReady
        }
      }
    }
  }

  // 切换准备状态
  const toggleReady = () => {
    if (!stompClient.value?.connected) return
    
    const ready = !myInfo.value?.isReady
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

  // 监听房间信息事件
  onMounted(() => {
    window.addEventListener('room-info', (event) => {
      handleRoomInfo(event.detail)
    })
  })

  onUnmounted(() => {
    window.removeEventListener('room-info', handleRoomInfo)
  })

  return {
    gameStatus,
    players,
    targetText,
    playerId,
    isHost,
    isRoomFull,
    opponentInfo,  // 新增
    myInfo,        // 新增
    resetGame,
    toggleGameStatus,
    startGame,
    handlePlayerJoin,
    fetchRoomInfo,
    handleRoomInfo,  // 新增
    toggleReady
  }
}
