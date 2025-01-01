<!--
 * @Author: hiddenSharp429 z404878860@163.com
 * @Date: 2025-01-01 17:48:58
-->
<template>
  <div class="global-animation-layer">
    <!-- 使用v-for指令遍历particles数组，生成多个burst-particle元素 -->
    <div 
      v-for="(particle, index) in particles"
      :key="index"
      class="burst-particle"
      :style="{
        // 使用transform属性设置粒子的位置和旋转角度
        transform: `translate(
          ${particle.absoluteX + particle.x}px, 
          ${particle.absoluteY + particle.y}px
        ) rotate(${particle.rotation}deg)`,
        // 设置粒子的宽度和高度，根据粒子的半径计算
        width: `${particle.radius * 2}px`,
        height: `${particle.radius * 2}px`,
        // 设置粒子的背景颜色
        backgroundColor: particle.color,
        // 设置粒子的透明度
        opacity: particle.opacity
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAnimationManager } from '../../composables/useAnimationManager'

// 使用useAnimationManager组合式函数获取动画管理器实例
const animationManager = useAnimationManager()
// 计算属性particles，返回动画管理器中的粒子数组
const particles = computed(() => animationManager.getParticles().value)
</script>

<style scoped>
.global-animation-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
}

.burst-particle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  transition: none;
}
</style> 