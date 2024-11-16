<template>
    <div class="matching-screen">
      <div class="matching-overlay"></div>
      
      <!-- 匹配中的画布 -->
      <template v-if="!matchFound">
        <canvas ref="bubbleCanvas" class="bubble-canvas"></canvas>
        <div class="matching-content">
          <div class="matching-text">
            寻找对手中
            <span class="dots"><span>.</span><span>.</span><span>.</span></span>
          </div>
          <button @click="handleCancel" class="cancel-button">取消匹配</button>
        </div>
      </template>

      <!-- 匹配成功的画布 -->
      <div v-else class="match-success-container">
        <!-- 上三角区域 - 当前玩家 -->
        <div class="player-area player-top" :class="{ 'slide-in': matchFound }">
          <div class="player-info">
            <img :src="currentPlayerAvatar" class="player-avatar" />
            <div class="player-details">
              <div class="player-name">{{ currentPlayerName }}</div>
              <div class="player-id">ID: {{ currentPlayerId }}</div>
            </div>
          </div>
        </div>

        <!-- 中间区域 - 倒计时 -->
        <div class="countdown-area">
          <div class="match-status">匹配成功!</div>
          <div class="countdown">{{ countdown }}s后开始游戏</div>
        </div>

        <!-- 下三角区域 - 对手 -->
        <div class="player-area player-bottom" :class="{ 'slide-in': matchFound }">
          <div class="player-info">
            <img :src="opponentAvatar" class="player-avatar" />
            <div class="player-details">
              <div class="player-name">{{ opponentName }}</div>
              <div class="player-id">ID: {{ opponentId }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted, nextTick } from 'vue'
  import { useWebSocket } from '@/composables/useWebSocket'
  import { useRouter } from 'vue-router'
  
  const props = defineProps({
    matchingOptions: {
      type: Object,
      required: true,
      // 期望的格式: { language: string, category: string, difficulty: string }
    }
  })

  const router = useRouter()
  const { connectWebSocket, sendMatchRequest, subscribeToMatchmaking } = useWebSocket()
  const emit = defineEmits(['cancel'])
  const bubbleCanvas = ref(null)

  let bubbles = []
  let animationFrame = null
  let matchmakingSubscription = null
  let burstParticles = [] // 存储破裂粒子
  
  const matchFound = ref(false)
  const countdown = ref(5)
  const roomInfo = ref(null)
  let countdownTimer = null // 添加定时器引用

  // 当前玩家信息
  const currentPlayerName = ref(localStorage.getItem('userName'))
  const currentPlayerId = ref(localStorage.getItem('userId'))
  const currentPlayerAvatar = ref(localStorage.getItem('imgSrc'))

  // 对手信息
  const opponentName = ref('')
  const opponentId = ref('')
  const opponentAvatar = ref('')
  
  // Canvas 初始化逻辑
  const initCanvas = () => {
    const canvas = bubbleCanvas.value
    if (!canvas) return
  
    const resizeCanvas = () => {
      if (!canvas) return
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = width
      canvas.height = height
    }
  
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }
  
  // 创建气泡时计算合适的大小
  const createBubble = () => {
    const canvas = bubbleCanvas.value
    if (!canvas) return
  
    const ctx = canvas.getContext('2d')
    const { width, height } = canvas.getBoundingClientRect()
    const params = [
      { text: props.matchingOptions.language, color: '#4f8cff' },
      { text: props.matchingOptions.category, color: '#ff4f8c' },
      { text: props.matchingOptions.difficulty, color: '#8cff4f' }
    ]
    
    params.forEach((param) => {
      // 随机文字大小
      const fontSize = 14 + Math.random() * 4 // 14-18px 的随机大小
      ctx.font = `bold ${fontSize}px Arial`
      const textMetrics = ctx.measureText(param.text)
      
      // 计算文字的实际宽度和高度
      const textWidth = textMetrics.width
      const textHeight = fontSize // 近似值，因为 measureText 不提供高度

      // 确保气泡半径足够容纳文字，并添加一些内边距
      const minRadius = Math.sqrt(Math.pow(textWidth/2, 2) + Math.pow(textHeight/2, 2)) + 15
      const radius = minRadius + Math.random() * 5 // 添加一点随机变化

      bubbles.push({
        x: Math.random() * width,
        y: height + 100,
        radius: radius,
        speed: 0.8 + Math.random() * 1.2,
        text: param.text,
        color: param.color,
        opacity: 1,
        rotation: Math.random() * 360,
        glow: 0.5 + Math.random() * 0.5,
        fontSize: fontSize // 保存字体大小
      })
    })
  }
  
  // 添加破裂粒子的类型定义
  const createBurstParticles = (x, y, color, radius) => {
    const particles = []
    const particleCount = 8 + Math.floor(Math.random() * 5) // 8-12个粒子
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount
      const speed = 2 + Math.random() * 2
      particles.push({
        x,
        y,
        radius: 1 + Math.random() * 3,
        color,
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        },
        opacity: 1,
        rotation: Math.random() * 360
      })
    }
    return particles
  }
  
  // 添加点击检测
  const handleCanvasClick = (event) => {
    const canvas = bubbleCanvas.value
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // 检查是否点击到气泡
    bubbles = bubbles.filter(bubble => {
      const distance = Math.sqrt(
        Math.pow(x - bubble.x, 2) + Math.pow(y - bubble.y, 2)
      )
      
      if (distance <= bubble.radius) {
        // 创建破裂效果
        burstParticles.push(...createBurstParticles(
          bubble.x,
          bubble.y,
          bubble.color,
          bubble.radius
        ))
        return false // 移除被点击的气泡
      }
      return true
    })
  }
  
  // 包含破裂效果动画函数
  const animateBubbles = () => {
    const canvas = bubbleCanvas.value
    if (!canvas) return
  
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const { width, height } = canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, width, height)
    
    // 渲染气泡
    bubbles = bubbles.filter(bubble => {
      bubble.y -= bubble.speed
      bubble.opacity = Math.max(0, bubble.opacity - 0.002)
      bubble.rotation += 0.2
      
      // 绘制发光效果
      const gradient = ctx.createRadialGradient(
        bubble.x, bubble.y, 0,
        bubble.x, bubble.y, bubble.radius
      )
      gradient.addColorStop(0, `${bubble.color}${Math.floor(bubble.opacity * 255).toString(16).padStart(2, '0')}`)
      gradient.addColorStop(1, `${bubble.color}00`)
      
      // 绘制气泡阴影
      ctx.shadowColor = bubble.color
      ctx.shadowBlur = 15 * bubble.glow * bubble.opacity
      
      // 绘制气泡
      ctx.beginPath()
      ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()
      
      // 绘制气泡边框
      ctx.strokeStyle = `rgba(255, 255, 255, ${bubble.opacity * 0.5})`
      ctx.lineWidth = 2
      ctx.stroke()
      
      // 重置阴影
      ctx.shadowBlur = 0
      
      // 使用保存的字体大小渲染文字
      ctx.save()
      ctx.translate(bubble.x, bubble.y)
      ctx.rotate(bubble.rotation * Math.PI / 180)
      ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity})`
      ctx.font = `bold ${bubble.fontSize}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(bubble.text, 0, 0)
      ctx.restore()
      
      // 只有当气泡完全到达顶部时才消失
      return bubble.y + bubble.radius > 0 && bubble.opacity > 0
    })
    
    // 渲染破裂粒子
    burstParticles = burstParticles.filter(particle => {
      particle.x += particle.velocity.x
      particle.y += particle.velocity.y
      particle.opacity -= 0.02
      particle.velocity.y += 0.1 // 添加重力效果
      particle.rotation += 5

      if (particle.opacity <= 0) return false

      ctx.save()
      ctx.translate(particle.x, particle.y)
      ctx.rotate(particle.rotation * Math.PI / 180)
      ctx.beginPath()
      ctx.arc(0, 0, particle.radius, 0, Math.PI * 2)
      ctx.fillStyle = `${particle.color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')}`
      ctx.fill()
      ctx.restore()

      return particle.opacity > 0
    })
    
    // 降低气泡生成频率，避免太密集
    if (bubbles.length < 9 && Math.random() < 0.02) {
      createBubble()
    }
    
    animationFrame = requestAnimationFrame(animateBubbles)
  }

  // 处理匹配成功
  const handleMatchFound = (event) => {
    const { roomId, opponent, gameInfo } = event.detail
    console.log('[MatchingScreen] 收到匹配成功事件:', event.detail)
    
    // 防止重复触发
    if (matchFound.value) return
    
    // 保存房间信息
    roomInfo.value = { roomId, gameInfo }
    
    // 更新对手信息
    opponentName.value = opponent.name
    opponentId.value = opponent.id
    opponentAvatar.value = opponent.avatar || '/default-avatar.png'
    
    // 显示匹配成功画面
    matchFound.value = true
    countdown.value = 5 // 确保倒计时从5开始
    
    // 清除可能存在的旧定时器
    if (countdownTimer) {
      clearInterval(countdownTimer)
    }
    
    // 开始新的倒计时
    countdownTimer = setInterval(() => {
      countdown.value--
      console.log('[MatchingScreen] 倒计时:', countdown.value)
      
      if (countdown.value <= 0) {
        clearInterval(countdownTimer)
        countdownTimer = null
        // 倒计时结束后跳转到游戏房间
        router.push(`/room/${roomId}`)
      }
    }, 1000)
  }

  // 取消匹配
  const handleCancel = () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
    emit('cancel')
  }
  
  // 组件挂载时初始化
  onMounted(async () => {
    nextTick(async () => {
      const cleanup = initCanvas()
      const canvas = bubbleCanvas.value
      
      // 添加点击事件监听
      canvas.addEventListener('click', handleCanvasClick)
      
      createBubble()
      animateBubbles()
      
      try {
        // 等待 WebSocket 连接成功
        await connectWebSocket()
        
        const playerId = localStorage.getItem('userId')
        const playerName = localStorage.getItem('userName')
        const playerAvatar = localStorage.getItem('imgSrc')

        // 现在可以安全地订阅和发送消息
        matchmakingSubscription = subscribeToMatchmaking(playerId)

        sendMatchRequest({
          playerId,
          playerName,
          playerAvatar,
          language: props.matchingOptions.language,
          category: props.matchingOptions.category,
          difficulty: props.matchingOptions.difficulty
        })
      } catch (error) {
        console.error('匹配初始化失败:', error)
        // 可以在这里添加错误处理逻辑
      }
      
      onUnmounted(() => {
        cleanup?.()
        canvas.removeEventListener('click', handleCanvasClick)
        if (animationFrame) {
          cancelAnimationFrame(animationFrame)
        }
        // 取消所有订阅
        // if (matchmakingSubscription) {
        //   matchmakingSubscription.unsubscribe()
        // }
        // // 使用 unsubscribe 方法清理所有相关订阅
        // unsubscribe(`room_${roomId}`)  // 房间广播订阅
        // unsubscribe(`room_info_${playerId}`)  // 个人房间信息订阅
      })
    })
  })
  
  // 监听匹配成功事件
  onMounted(() => {
    window.addEventListener('match-found', handleMatchFound)
  })

  onUnmounted(() => {
    window.removeEventListener('match-found', handleMatchFound)
  })

  </script>
  
  <style scoped>
  .matching-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }
  
  .matching-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, 
      rgba(44, 62, 80, 0.97), 
      rgba(52, 73, 94, 0.97)
    );
    backdrop-filter: blur(12px);
    z-index: 1;
  }
  
  .bubble-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
    cursor: pointer;
  }
  
  .matching-content {
    position: relative;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }
  
  .matching-text {
    color: white;
    font-size: 2.5rem;
    font-weight: 600;
    text-shadow: 
      0 2px 10px rgba(0, 0, 0, 0.3),
      0 0 40px rgba(79, 140, 255, 0.3);
    letter-spacing: 2px;
  }
  
  .dots span {
    display: inline-block;
    animation: dotAnimation 1.4s infinite;
    margin: 0 2px;
  }
  
  .dots span:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .dots span:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  @keyframes dotAnimation {
    0%, 20% {
      transform: translateY(0);
      opacity: 1;
    }
    50% {
      transform: translateY(-5px);
      opacity: 0.5;
    }
    80%, 100% {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .cancel-button {
    padding: 14px 40px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 30px;
    color: white;
    font-size: 1.2rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(8px);
    letter-spacing: 1px;
  }
  
  .cancel-button:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
    transform: translateY(-3px);
    box-shadow: 
      0 8px 25px rgba(0, 0, 0, 0.2),
      0 0 20px rgba(79, 140, 255, 0.3);
  }
  
  .cancel-button:active {
    transform: translateY(0);
  }
  
  .match-success-container {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 3;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  
  .player-area {
    width: 100%;
    height: 40vh;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0;
  }
  
  .player-area.slide-in {
    opacity: 1;
  }
  
  .player-top {
    background: linear-gradient(to bottom, rgba(79, 140, 255, 0.8), transparent);
    transform: translateY(-100%);
  }
  
  .player-top.slide-in {
    transform: translateY(0);
  }
  
  .player-bottom {
    background: linear-gradient(to top, rgba(255, 79, 140, 0.8), transparent);
    transform: translateY(100%);
  }
  
  .player-bottom.slide-in {
    transform: translateY(0);
  }
  
  .player-info {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 15px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
  
  .player-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.5);
  }
  
  .player-details {
    color: white;
  }
  
  .player-name {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 5px;
  }
  
  .player-id {
    font-size: 0.9rem;
    opacity: 0.8;
  }
  
  .countdown-area {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: white;
    z-index: 4;
  }
  
  .match-status {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 15px;
    animation: pulseText 1.5s infinite;
  }
  
  .countdown {
    font-size: 1.8rem;
    opacity: 0.9;
  }
  
  @keyframes pulseText {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
  
  /* 添加响应式设计 */
  @media (max-width: 768px) {
    .player-info {
      flex-direction: column;
      text-align: center;
    }
  
    .player-avatar {
      width: 60px;
      height: 60px;
    }
  
    .player-name {
      font-size: 1.2rem;
    }
  }
  </style>