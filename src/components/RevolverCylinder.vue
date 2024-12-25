<template>
  <div class="revolver-wrapper" @wheel="handleWheel">
    <svg viewBox="0 0 400 400" class="revolver-cylinder">
      <defs>
        <linearGradient id="metallic" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#2c3e50;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#34495e;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2c3e50;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="2" dy="2"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <radialGradient id="chamber-gradient">
          <stop offset="0%" style="stop-color:#4f8cff;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:#2c3e50;stop-opacity:1" />
        </radialGradient>
        <mask id="chamber-mask">
          <rect x="0" y="0" width="400" height="400" fill="black"/>
          <circle 
            cx="200" 
            cy="100" 
            r="50" 
            fill="white"
          />
        </mask>
        <linearGradient id="metal-shine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#4a4a4a;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#666666;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#4a4a4a;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="chamber-placeholder-gradient">
          <stop offset="0%" style="stop-color:#3a4b5e;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#2c3e50;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1a2634;stop-opacity:1" />
        </linearGradient>
        <radialGradient id="bullet-gradient">
          <stop offset="0%" style="stop-color:#ffd700;stop-opacity:1" />
          <stop offset="70%" style="stop-color:#ffa500;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#cc8800;stop-opacity:1" />
        </radialGradient>
        <filter id="bullet-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feFlood flood-color="#ffd700" flood-opacity="0.5" result="color"/>
          <feComposite in="color" in2="blur" operator="in" result="glow"/>
          <feMerge>
            <feMergeNode in="glow"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- 外圈装饰 -->
      <circle cx="200" cy="200" r="195" fill="none" stroke="url(#metal-shine)" stroke-width="8"/>
      <circle cx="200" cy="200" r="190" fill="none" stroke="url(#metallic)" stroke-width="4"/>
      
      <!-- 主体圆筒 -->
      <g class="cylinder-body">
        <circle cx="200" cy="200" r="180" fill="url(#metallic)" filter="url(#shadow)"/>
        <circle cx="200" cy="200" r="160" fill="#1a1f25"/>
      </g>
      
      <!-- 弹仓孔组 -->
      <g :class="['mask-group', { 'is-rotating': isRotating }]">
        <g mask="url(#chamber-mask)">
          <g :transform="`rotate(${currentRotation})`" class="cylinder-group">
            <g v-for="(option, index) in options" :key="option.value">
              <circle 
                :cx="200 + 100 * Math.cos(((index * 360 / options.length) - 90) * (Math.PI / 180))"
                :cy="200 + 100 * Math.sin(((index * 360 / options.length) - 90) * (Math.PI / 180))"
                r="50"
                :fill="option.value === selectedValue ? 'url(#chamber-gradient)' : '#2c3e50'"
                :class="['chamber', { 'selected': option.value === selectedValue }]"
                @click="selectOption(option.value)"
              />
              <text
                :x="200 + 100 * Math.cos(((index * 360 / options.length) - 90) * (Math.PI / 180))"
                :y="200 + 100 * Math.sin(((index * 360 / options.length) - 90) * (Math.PI / 180))"
                text-anchor="middle"
                dominant-baseline="middle"
                fill="white"
                :class="['chamber-text', { 'selected': option.value === selectedValue }]"
                :transform="`
                  rotate(${-currentRotation}, 
                  ${200 + 100 * Math.cos(((index * 360 / options.length) - 90) * (Math.PI / 180))}, 
                  ${200 + 100 * Math.sin(((index * 360 / options.length) - 90) * (Math.PI / 180))})`"
              >{{ option.label }}</text>
            </g>
          </g>
        </g>

        <!-- 静态占位弹孔放在遮罩组内 -->
        <g class="static-chambers">
          <g v-for="index in 6" :key="index">
            <circle 
              :cx="200 + 100 * Math.cos(((index - 1) * 60 - 90) * (Math.PI / 180))"
              :cy="200 + 100 * Math.sin(((index - 1) * 60 - 90) * (Math.PI / 180))"
              r="45"
              fill="url(#chamber-placeholder-gradient)"
              stroke="url(#metal-shine)"
              stroke-width="2"
              class="chamber-placeholder"
              :style="{ opacity: index === 1 ? 0 : 0.35 }"
            />
          </g>
        </g>

        <!-- 遮罩边框装饰 -->
        <g :class="['mask-decoration', { 'is-rotating': isRotating }]">
          <circle 
            cx="200" 
            cy="100" 
            r="55" 
            fill="none" 
            stroke="url(#metal-shine)" 
            stroke-width="3"
            class="chamber-opening"
          />
          <circle 
            cx="200" 
            cy="100" 
            r="58" 
            fill="none" 
            stroke="url(#metallic)" 
            stroke-width="1"
            class="chamber-opening-outer"
          />
        </g>
      </g>
      
      <!-- 中心轴 -->
      <circle cx="200" cy="200" r="35" fill="url(#metal-shine)" filter="url(#shadow)"/>
      <circle cx="200" cy="200" r="25" fill="#1a1f25"/>

      <!-- 中心标题 -->
      <g class="center-title">
        <!-- 添加装饰环 -->
        <circle 
          cx="200" 
          cy="200" 
          r="40" 
          fill="none" 
          stroke="#4f8cff" 
          stroke-width="1.5"
          class="title-ring"
        />
        <text
          x="200"
          y="200"
          text-anchor="middle"
          dominant-baseline="middle"
          fill="#4f8cff"
          class="cylinder-title"
        >{{ title }}</text>
      </g>
    </svg>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  title: String,
  options: {
    type: Array,
    required: true
  },
  selectedValue: String
})

const emit = defineEmits(['select'])

// 内部维护旋转角度
const currentRotation = ref(0)

// 添加动画状态控制
const isRotating = ref(false)

// 选择选项
const selectOption = (value) => {
  const index = props.options.findIndex(opt => opt.value === value)
  if (index !== -1) {
    isRotating.value = true
    const targetRotation = -(index * (360 / props.options.length))
    currentRotation.value = targetRotation
    emit('select', value)
    
    // 动画结束后重置状态
    setTimeout(() => {
      isRotating.value = false
    }, 600) // 与 CSS 动画时长匹配
  }
}

// 添加节流函数
const throttle = (fn, delay) => {
  let lastCall = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastCall >= delay) {
      fn.apply(this, args)
      lastCall = now
    }
  }
}

// 分离事件阻止和实际处理逻辑
const handleWheel = (event) => {
  // 立即阻止事件冒泡和默认行为，不受节流影响
  event.preventDefault()
  event.stopPropagation()
  
  // 使用节流处理实际的滚动逻辑
  throttledWheelHandler(event)
}

// 将实际的滚动处理逻辑放在节流函数中
const throttledWheelHandler = throttle((event) => {
  const direction = event.deltaY > 0 ? 1 : -1
  
  const currentIndex = props.options.findIndex(opt => opt.value === props.selectedValue)
  let newIndex = currentIndex + direction
  
  if (newIndex >= props.options.length) {
    newIndex = 0
  } else if (newIndex < 0) {
    newIndex = props.options.length - 1
  }
  
  if (newIndex !== currentIndex) {
    isRotating.value = true
    selectOption(props.options[newIndex].value)
  }
}, 1500)

// 监听外部selectedValue的变化
watch(() => props.selectedValue, (newValue) => {
  if (newValue) {
    const index = props.options.findIndex(opt => opt.value === newValue)
    if (index !== -1) {
      currentRotation.value = -(index * (360 / props.options.length))
    }
  }
}, { immediate: true })
</script>

<style scoped>
.revolver-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.revolver-cylinder {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));
}

.cylinder-group {
  transform-origin: 200px 200px;
  transition: transform 0.1s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.chamber {
  transition: fill 0.2s ease;
  cursor: pointer;
}

.chamber:hover {
  filter: brightness(1.2);
}

.chamber.selected {
  fill: url(#bullet-gradient);
  filter: url(#bullet-glow);
  transition: all 0.3s ease;
}

.chamber-text {
  font-size: 16px;
  pointer-events: none;
  text-shadow: 0 0 3px rgba(0,0,0,0.8);
  font-weight: bold;
}

.chamber-text.selected {
  fill: #0a1c3e;
  font-weight: bold;
  text-shadow: 0 0 6px rgba(79, 140, 255, 0.1);
}

.cylinder-title {
  font-size: 18px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  text-shadow: 0 0 10px rgba(79, 140, 255, 0.5);
  pointer-events: none;
  opacity: 0.8;
}

.title-ring {
  opacity: 0.3;
  filter: drop-shadow(0 0 4px #4f8cff);
}

.center-title {
  animation: glow 2s ease-in-out infinite;
}

.cylinder-body {
  filter: drop-shadow(0 0 15px rgba(0,0,0,0.7));
}

.chamber-opening {
  filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.5));
}

.chamber-placeholder {
  pointer-events: none;
  filter: drop-shadow(0 0 3px rgba(0,0,0,0.4));
}

@keyframes pulse {
  0% {
    filter: drop-shadow(0 0 8px #4f8cff);
  }
  50% {
    filter: drop-shadow(0 0 15px #4f8cff);
  }
  100% {
    filter: drop-shadow(0 0 8px #4f8cff);
  }
}

.mask-group {
  transform-origin: 200px 200px;
}

.mask-decoration {
  transform-origin: 200px 200px;
}

.is-rotating {
  animation: rotateLoader 0.6s ease-in-out;
}

@keyframes rotateLoader {
  0% {
    transform: rotate(0deg);
  }
  20% {
    transform: rotate(-30deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>