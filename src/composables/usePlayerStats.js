import { ref, reactive } from 'vue'
import soundManager from '@/utils/SoundManager'

export function usePlayerStats(roomId, stompClient) {
  const startTime = ref(null)
  const playerText = ref('')
  const myProgress = ref(0)
  let lastProgressSentTime = 0  // 上次发送进度的时间
  const PROGRESS_THROTTLE = 500 // 发送进度的最小间隔时间(ms)
  
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

  // 节流函数 - 控制发送进度的频率
  const throttledSendProgress = () => {
    const now = Date.now()
    if (now - lastProgressSentTime >= PROGRESS_THROTTLE) {
      sendProgress()
      lastProgressSentTime = now
    }
  }

  // 发送进度
  const sendProgress = () => {
    if (stompClient.value?.connected) {
      const progressData = {
        type: 'PLAYER_PROGRESS',
        playerId: localStorage.getItem('userId'),
        percentage: myProgress.value,
        stats: {
          wpm: myStats.wpm,
          accuracy: myStats.accuracy,
          errorCount: myStats.errorCount,
          username: myStats.username
        }
      }

      stompClient.value.publish({
        destination: `/app/room/${roomId}/progress`,
        body: JSON.stringify(progressData)
      })

      // 当进度达到100%时，立即发送游戏结束消息
      if (myProgress.value === 100) {
        // 确保在发送结束消息之前有一个短暂延迟，确保进度消息先到达
        setTimeout(() => {
          stompClient.value.publish({
            destination: `/app/room/${roomId}/finish`,
            body: JSON.stringify({
              type: 'GAME_FINISH',
              playerId: localStorage.getItem('userId'),
              timestamp: Date.now()
            })
          })
        }, 100) // 100ms的延迟，确保进度消息先到达
      }
    }
  }

  // 处理输入
  const handleInput = (event, targetText, gameStatus) => {
    // 如果是第一次输入，设置开始时间
    if (!startTime.value && gameStatus === 'playing') {
      startTime.value = Date.now()
    }

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

    // 计算正确字符数
    const correctChars = currentInput.split('').filter((char, index) => 
      char === targetText[index]
    ).length

    // 计算错误数 - 只计算已输入部分的错误
    myStats.errorCount = currentInput.length - correctChars

    // 检查是否完全匹配目标文本
    const isCompleted = currentInput === targetText

    // 进度计算逻辑
    if (isCompleted) {
      // 完成时立即设置100%并发送，不使用节流
      myProgress.value = 100
      sendProgress() // 直接调用sendProgress，跳过节流
    } else {
      // 只有当字符完全匹配时才计入进度
      const isFullyMatched = currentInput === targetText.substring(0, currentInput.length)
      if (isFullyMatched) {
        myProgress.value = Math.round((currentInput.length / targetText.length) * 100)
        // 使用节流函数发送进度
        throttledSendProgress()
      }
    }

    // 修改准确率计算 - 正确字符数除以已输入的总字符数
    if (currentInput.length > 0) {
      myStats.accuracy = Math.round((correctChars / currentInput.length) * 100)
    } else {
      myStats.accuracy = 100 // 未开始输入时保持100%
    }

    // 计算WPM - 使用正确字符数
    if (startTime.value) {
      const timeElapsed = (Date.now() - startTime.value) / 1000 / 60
      const wordsTyped = correctChars / 5
      myStats.wpm = Math.round(wordsTyped / timeElapsed) || 0
    }

    return isCompleted
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
    lastProgressSentTime = 0  // 重置最后发送时间
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
