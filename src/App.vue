<!--
 * @Author: hiddenSharp429 z404878860@163.com
 * @Date: 2024-12-24 21:49:22
-->
<template>
  <router-view />
  <GlobalAnimationLayer />
</template>

<script setup>
import GlobalAnimationLayer from '@/components/common/GlobalAnimationLayer.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  /* 主要背景色 - 深邃优雅的深蓝黑 */
  --primary-dark: #1a1f2c;
  --secondary-dark: #232836;
  --accent-dark: #2d3446;
  
  /* 文字颜色 */
  --text-primary: #ffffff;
  --text-secondary: #b8c3d9;
  
  /* 强调色 - 优雅的蓝紫色调 */
  --accent-color: #6366f1;
  --accent-hover: #818cf8;
  --accent-active: #4f46e5;
  
  /* 功能色 */
  --success-color: #34d399;
  --warning-color: #fbbf24;
  --danger-color: #ef4444;
  
  /* 边框和阴影 */
  --border-color: rgba(255, 255, 255, 0.1);
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
  
  /* 渐变色 */
  --gradient-primary: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
  --gradient-secondary: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
}

html, body {
  height: 100%;
  background-color: var(--primary-dark);
  color: var(--text-primary);
}

body {
  font-family: 'Inter', Arial, sans-serif;
  line-height: 1.6;
}

#app {
  min-height: 100vh;
}

a {
  text-decoration: none;
  color: inherit;
  transition: color 0.3s ease;
}

button {
  cursor: pointer;
}
</style>