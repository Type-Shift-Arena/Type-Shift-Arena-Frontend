<template>
  <div 
    class="bubble" 
    :class="{ bursting }" 
    :style="bubbleStyle"
  >
    <BurstEffect
      :active="bursting"
      :color="bubbleStyle.borderColor"
      :config="{
        minParticles: 15,
        maxParticles: 25,
        minSpeed: 5,
        maxSpeed: 8,
        gravity: 0.08,
        fadeSpeed: 0.008,
        duration: 1500,
        minRadius: 2,
        maxRadius: 5,
        rotationSpeed: 3
      }"
    />
    
    <div class="bubble-content" v-show="!bursting">
      <span class="bubble-text">{{ text }}</span>
      <span class="bubble-timer" :class="{ 'danger': isDanger }">
        {{ timeLeft }}s
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue"
import BurstEffect from '@/components/common/BurstEffect.vue'

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  startTime: {
    type: Number,
    required: true
  },
  bursting: {
    type: Boolean,
    default: false
  },
  bubbleConfig: {
    type: Object,
    required: true,
    validator: (value) => {
      return value.initialSize && 
             value.maxSize && 
             value.growthTime;
    }
  }
});

const currentTime = ref(Date.now());
let timer = null;

const timeLeft = computed(() => {
  const elapsed = currentTime.value - props.startTime;
  const remaining = props.bubbleConfig.growthTime - elapsed;
  return (Math.ceil(remaining / 100) / 10).toFixed(1);
});

const bubbleStyle = computed(() => {
  const elapsed = currentTime.value - props.startTime;
  const progress = Math.min(elapsed / props.bubbleConfig.growthTime, 1);
  
  const sizeDiff = props.bubbleConfig.maxSize - props.bubbleConfig.initialSize;
  const currentSize = Math.round(props.bubbleConfig.initialSize + (sizeDiff * progress));
  
  let borderColor;
  if (progress >= 0.8) {
    borderColor = '#ef4444';
  } else if (progress >= 0.5) {
    borderColor = '#eab308';
  } else {
    borderColor = '#22c55e';
  }
  
  return {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: `${currentSize}px`,
    height: `${currentSize}px`,
    background: `rgba(30, 41, 59, 0.2)`,
    zIndex: 1000,
    borderWidth: '3px',
    borderStyle: 'solid',
    borderColor: borderColor,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(8px)',
    boxShadow: `0 0 20px rgba(30, 41, 59, 0.1)`,
    padding: '10px',
    transition: 'none',
    WebkitTransition: 'none',
    MozTransition: 'none',
    msTransition: 'none',
    OTransition: 'none',
  };
});

const isDanger = computed(() => {
  const elapsed = currentTime.value - props.startTime;
  const progress = elapsed / props.bubbleConfig.growthTime;
  return progress >= 0.8;
});

onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = Date.now();
  }, 16);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.bubble {
  position: absolute;
  overflow: visible !important; /* 允许粒子溢出容器 */
  pointer-events: none;
  transition: none !important;
  -webkit-transition: none !important;
  -moz-transition: none !important;
  -ms-transition: none !important;
  -o-transition: none !important;
}

.bubble * {
  transition: none !important;
  -webkit-transition: none !important;
  -moz-transition: none !important;
  -ms-transition: none !important;
  -o-transition: none !important;
}

.bubble-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  width: fit-content;
  height: fit-content;
}

.bubble-text {
  font-size: 1.2rem;
  color: rgba(226, 232, 240, 0.9);
  font-weight: 500;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
}

.bubble-timer {
  font-size: 0.9rem;
  color: rgba(148, 163, 184, 0.8);
  font-weight: bold;
}

.bubble-timer.danger {
  color: #ef4444;
}

.burst-particle {
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 50%;
  pointer-events: none;
  transition: none;
  z-index: 1001; /* 确保在气泡上层 */
}

.bursting {
  animation: burst 0.3s ease-out forwards;
}

@keyframes burst {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.3);
    opacity: 0.5;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}
</style>
