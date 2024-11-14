/*
 * @Author: hiddenSharp429 z404878860@163.com
 * @Date: 2024-11-14 19:40:25
 * @LastEditors: hiddenSharp429 z404878860@163.com
 * @LastEditTime: 2024-11-14 19:40:45
 */
import { ref, computed } from 'vue'

export function useGameState(roomId, stompClient) {
  const gameStatus = ref('waiting') // waiting, ready, playing, finished
  const players = ref([])
  const targetText = ref('') // 目标文本
  const playerId = ref(localStorage.getItem('userId'))
  
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

  return {
    gameStatus,
    players,
    targetText,
    playerId,
    isHost,
    isRoomFull,
    resetGame,
    toggleGameStatus,
    startGame,
    handlePlayerJoin,
    fetchRoomInfo
  }
}
