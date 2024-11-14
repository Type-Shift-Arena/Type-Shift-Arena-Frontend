<template>
    <div class="matching-screen">
      <div class="matching-overlay"></div>
      <canvas ref="bubbleCanvas" class="bubble-canvas" style="cursor: pointer;"></canvas>
      <div class="matching-content">
        <div class="matching-text">
          寻找对手中
          <span class="dots"><span>.</span><span>.</span><span>.</span></span>
        </div>
        <button @click="handleCancel" class="cancel-button">取消匹配</button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted, nextTick } from 'vue'
  
  const props = defineProps({
    matchingOptions: {
      type: Object,
      required: true,
      // 期望的格式: { language: string, category: string, difficulty: string }
    }
  })
  
  const emit = defineEmits(['cancel'])
  
  const bubbleCanvas = ref(null)
  let bubbles = []
  let animationFrame = null
  
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
  
  let burstParticles = [] // 存储破裂粒子
  
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
  
  // 组件挂载时初始化
  onMounted(() => {
    nextTick(() => {
      const cleanup = initCanvas()
      const canvas = bubbleCanvas.value
      
      // 添加点击事件监听
      canvas.addEventListener('click', handleCanvasClick)
      
      createBubble()
      animateBubbles()
      
      onUnmounted(() => {
        cleanup?.()
        canvas.removeEventListener('click', handleCanvasClick)
        if (animationFrame) {
          cancelAnimationFrame(animationFrame)
        }
      })
    })
  })
  
  const handleCancel = () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }
    emit('cancel')
  }
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
  </style>