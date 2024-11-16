import { ref, reactive } from 'vue'
import soundManager from '@/utils/SoundManager'

export function usePlayerStats(roomId, stompClient) {
  const startTime = ref(null)
  const playerText = ref('')
  const myProgress = ref(0)
  
  const myStats = reactive({
    wpm: 0,
    accuracy: 100,
    errorCount: 0,
    username: localStorage.getItem('userName')
  })

  const opponentStats = reactive({
    playerName: '未知玩家',
    wpm: 0,
    accuracy: 100,
    errorCount: 0,
    progress: 0,
    username: ''
  })

  // 性能监控
  const performanceStats = reactive({
    inputLatency: 0,
    renderTime: 0,
    lastInputTime: null
  })

  // 发送进度
  const sendProgress = () => {
    if (stompClient.value?.connected) {
      stompClient.value.publish({
        destination: `/app/room/${roomId}/progress`,
        body: JSON.stringify({
          type: 'PLAYER_PROGRESS',
          playerId: localStorage.getItem('userId'),
          percentage: myProgress.value,
          stats: {
            wpm: myStats.wpm,
            accuracy: myStats.accuracy,
            errorCount: myStats.errorCount,
            username: myStats.username
          }
        })
      })
    }
  }

  // 处理输入
  const handleInput = (event, targetText, gameStatus) => {
    // 播放打字音效
    soundManager.playTypeSound()

    // 计算输入延迟
    if (performanceStats.lastInputTime) {
      performanceStats.inputLatency = Date.now() - performanceStats.lastInputTime
    }
    performanceStats.lastInputTime = Date.now()

    if (gameStatus !== 'playing') return
    
    const currentInput = event.target.value
    playerText.value = currentInput

    // 计算进度
    const correctChars = currentInput.split('').filter((char, index) => 
      char === targetText[index]
    ).length
    
    myProgress.value = Math.round((correctChars / targetText.length) * 100)

    // 计算错误
    myStats.errorCount = currentInput.split('').filter((char, index) => 
      char !== targetText[index] && index < targetText.length
    ).length

    // 计算准确率
    myStats.accuracy = Math.round(
      ((currentInput.length - myStats.errorCount) / currentInput.length) * 100
    ) || 100

    // 计算WPM
    if (startTime.value) {
      const timeElapsed = (Date.now() - startTime.value) / 1000 / 60
      const wordsTyped = correctChars / 5
      myStats.wpm = Math.round(wordsTyped / timeElapsed)
    }

    // 发送进度
    sendProgress()

    return myProgress.value === 100
  }

  // 更新对手状态
  const updateOpponentStats = (data) => {
    opponentStats.playerName = data.playerName || '未知玩家'
    opponentStats.wpm = data.wpm
    opponentStats.accuracy = data.accuracy
    opponentStats.errorCount = data.errorCount
    opponentStats.progress = data.progress
    opponentStats.username = data.username
  }

  // 重置统计
  const resetStats = () => {
    startTime.value = null
    playerText.value = ''
    myProgress.value = 0
    myStats.wpm = 0
    myStats.accuracy = 100
    myStats.errorCount = 0
  }

  return {
    startTime,
    playerText,
    myProgress,
    myStats,
    opponentStats,
    performanceStats,
    handleInput,
    updateOpponentStats,
    resetStats
  }
}
