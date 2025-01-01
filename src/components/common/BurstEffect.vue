<!--
 * @Author: hiddenSharp429 z404878860@163.com
 * @Date: 2025-01-01 16:10:39
-->
<template>
  <div ref="containerRef" class="burst-container"></div>
</template>

<script setup lang="ts">
import { useAnimationManager } from '../../composables/useAnimationManager'
import soundManager from '../../utils/SoundManager'
import { watch, ref, onMounted } from 'vue'

const props = defineProps<{
  active?: boolean
  color: string
  config?: Record<string, number>
  x?: number
  y?: number
}>()

const containerRef = ref<HTMLElement | null>(null)
const animationManager = useAnimationManager()

watch(() => props.active, (newValue) => {
  if (newValue && containerRef.value) {
    // 获取父元素（气泡）的位置
    const element = containerRef.value.parentElement
    if (element) {
      const rect = element.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2
      
      animationManager.createBurst(x, y, props.color, props.config || {})
      soundManager.playBurstSound()
    }
  }
})
</script>

<style scoped>
.burst-container {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}

.burst-particle {
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 50%;
  pointer-events: none;
  transition: none;
  z-index: 1001;
}
</style> 