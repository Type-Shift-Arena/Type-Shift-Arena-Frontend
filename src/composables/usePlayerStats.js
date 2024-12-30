import { ref, reactive } from 'vue'
import soundManager from '@/utils/SoundManager'
import { useGameState } from '@/composables/useGameState'

export function usePlayerStats(roomId, stompClient) {
  const startTime = ref(null)
  const playerText = ref('')

  let lastProgressSentTime = 0  // 上次发送进度的时间
  const PROGRESS_THROTTLE = 500 // 发送进度的最小间隔时间(ms)
  
  const myStats = reactive({
    wpm: 0,
    accuracy: 0,
    errorCount: 0,
    progress: 0,
    username: localStorage.getItem('userName')
  })

  const opponentStats = reactive({
    wpm: 0,
    accuracy: 0,
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

  // 添加玩家信息状态
  const myInfo = ref(null)
  const opponentInfo = ref(null)

  // 发送进度的节流函数
  const throttledSendProgress = () => {
    const now = Date.now()
    if (now - lastProgressSentTime >= PROGRESS_THROTTLE) {
      console.log('[PlayerStats] 发送进度更新')
      sendProgress()
      lastProgressSentTime = now
    }
  }

  // 发送进度
  const sendProgress = () => {
    if (!stompClient.value?.connected) {
      console.warn('[PlayerStats] WebSocket未连接，无法发送进度')
      return
    }
    const playerId = localStorage.getItem('userId')
    const progressData = {
      type: 'PLAYER_PROGRESS',
      playerId: playerId,
      stats: {
        wpm: myStats.wpm,
        accuracy: myStats.accuracy,
        errorCount: myStats.errorCount,
        progress: myStats.progress,
        username: myStats.username
      }
    }

    console.log('[PlayerStats] 发送进度数据:', progressData)

    stompClient.value.publish({
      destination: `/app/room/${roomId}/progress`,
      body: JSON.stringify(progressData)
    })

    // 当进度达到100%时发送游戏结束消息
    if (myStats.progress === 100) {
      const gameState = useGameState(roomId, stompClient)
      setTimeout(() => {
        gameState.finishGame(playerId)
      }, 100)
    }
  }

  // 处理输入
  const handleInput = (event, targetText, gameStatus) => {
    console.log('[PlayerStats] 输入处理开始', {
      gameStatus,
      targetTextLength: targetText?.length,
      hasStartTime: !!startTime.value
    })

    // 如果游戏未开始，不进行计算
    if (gameStatus !== 'PLAYING') {
      console.log('[PlayerStats] 游戏未在进行中，跳过计算')
      console.log('[PlayerStats] 游戏状态:', gameStatus)
      return false
    }

    const currentInput = event.target.value
    playerText.value = currentInput

    // 如果是第一次输入，设置开始时间
    if (!startTime.value) {
      startTime.value = Date.now()
      console.log('[PlayerStats] 设置开始时间:', startTime.value)
    }

    // 计算正确字符数和错误数
    let correctChars = 0
    let errors = 0
    const inputLength = Math.min(currentInput.length, targetText.length)

    console.log('[PlayerStats] 开始字符比对', {
      currentInput,
      targetText,
      inputLength
    })

    // 逐字符比对
    for (let i = 0; i < inputLength; i++) {
      if (currentInput[i] === targetText[i]) {
        correctChars++
      } else {
        errors++
      }
    }

   
    // 额外的字符也算作错误
    if (currentInput.length > targetText.length) {
      const extraChars = currentInput.length - targetText.length
      errors += extraChars
      console.log('[PlayerStats] 检测到额外字符:', extraChars)
    }

    console.log('[PlayerStats] 字符统计结果:', {
      correctChars,
      errors,
      totalInput: currentInput.length,
      targetLength: targetText.length
    })

    // 更新错误计数
    myStats.errorCount = errors

    // 计算准确率
    if (currentInput.length > 0) {
      myStats.accuracy = Math.round((correctChars / currentInput.length) * 100)
      console.log('[PlayerStats] 准确率计算:', {
        correctChars,
        inputLength: currentInput.length,
        accuracy: myStats.accuracy
      })
    } else {
      myStats.accuracy = 100
    }

   // 计算 WPM
    if (startTime.value) {
      const now = Date.now()
      const timeElapsed = (now - startTime.value) / 1000 / 60 // 转换为分钟
      const wordsTyped = correctChars / 5 // 每5个字符算作一个单词

      console.log('[PlayerStats] WPM计算:', {
        timeElapsedMs: now - startTime.value,
        timeElapsedMinutes: timeElapsed,
        correctChars,
        wordsTyped
      })

      myStats.wpm = Math.max(0, Math.round(wordsTyped / timeElapsed))
      console.log('[PlayerStats] 最终WPM:', myStats.wpm)
    }

    // 计算进度 - 修复进度计算逻辑
    const isCompleted = currentInput === targetText
    if (isCompleted) {
      console.log('[PlayerStats] 文本完全匹配')
      myStats.progress = 100
      sendProgress()
    } else {
      // 1. 只计算到当前输入长度
      // 2. 确保分母使用目标文本的实际长度
      const matchedChars = currentInput.split('').reduce((count, char, index) => {
        return count + (char === targetText[index] ? 1 : 0)
      }, 0)

      // 使用实际输入长度与目标长度的比例来计算进度
      const inputProgress = (currentInput.length / targetText.length) * 100
      const accuracyProgress = (matchedChars / targetText.length) * 100
      
      // 取两者的较小值作为最终进度
      myStats.progress = Math.min(
        Math.round(inputProgress), 
        Math.round(accuracyProgress)
      )

      console.log('[PlayerStats] 进度计算详情:', {
        currentLength: currentInput.length,
        targetLength: targetText.length,
        matchedChars,
        inputProgress,
        accuracyProgress,
        finalProgress: myStats.progress
      })

      throttledSendProgress()
    }

    // 打印当前所有统计数据
    console.log('[PlayerStats] 当前统计数据:', {
      wpm: myStats.wpm,
      accuracy: myStats.accuracy,
      errorCount: myStats.errorCount,
      progress: myStats.progress,
      isCompleted
    })

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

  // 添加更新玩家信息的方法
  const updatePlayerInfo = (message) => {
    if (message.playerId === localStorage.getItem('userId')) {
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
  }

  // 重置统计
  const resetStats = () => {
    console.log('[PlayerStats] 重置所有统计数据')
    startTime.value = null
    playerText.value = ''
    myStats.progress = 0
    myStats.wpm = 0
    myStats.accuracy = 100
    myStats.errorCount = 0
    lastProgressSentTime = 0
  }

  return {
    startTime,
    playerText,
    myStats,
    opponentStats,
    performanceStats,
    myInfo,
    opponentInfo,
    handleInput,
    updateOpponentStats,
    resetStats,
    updatePlayerInfo
  }
}
