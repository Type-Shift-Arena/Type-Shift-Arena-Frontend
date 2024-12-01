<template>
    <div class="scope-button-container">
      <button 
        :class="['scope-button', { 'disabled': disabled }]"
        @click="handleClick"
        @mouseenter="handleHover"
        :disabled="disabled"
        :style="{
          width: size + 'px',
          height: size + 'px'
        }"
      >
        <div class="button-background">
          <div class="rotating-ring"></div>
          <div class="pulse-ring"></div>
          <div class="scan-line"></div>
        </div>
        <div class="crosshair-container" v-if="!disabled">
          <!-- 瞄准镜外圈 -->
          <div class="scope-ring outer"></div>
          <div class="scope-ring inner"></div>
          
          <!-- 十字准星 -->
          <div class="crosshair">
            <div class="cross-line horizontal"></div>
            <div class="cross-line vertical"></div>
            <!-- 刻度线 -->
            <div class="mil-dots">
              <div class="mil-dot" v-for="i in 8" :key="i"></div>
            </div>
          </div>
          
          <!-- 数字刻度 -->
          <div class="numbers">
            <span>0</span>
            <span>1</span>
            <span>2</span>
            <span>3</span>
          </div>
          
          <!-- 模糊效果叠加层 -->
          <div class="blur-overlay"></div>
        </div>
        <span class="button-text" :style="{ fontSize: fontSize + 'px' }">
          <slot>按钮</slot>
        </span>
      </button>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  
  /**
   * 狙击镜按钮组件的属性接口
   */
  interface ScopeButtonProps {
    /** 按钮大小（像素） */
    size?: number;
    /** 是否禁用按钮 */
    disabled?: boolean;
    /** 主题颜色（十六进制颜色代码） */
    themeColor?: string;
    /** 是否启用音效 */
    sound?: boolean;
  }
  
  /**
   * 狙击镜按钮组件
   * @example
   * <ScopeButton
   *   :size="300"
   *   :disabled="false"
   *   themeColor="#4f8cff"
   *   :sound="true"
   *   @click="handleClick"
   * >
   *   开始匹配
   * </ScopeButton>
   */
  const props = withDefaults(defineProps<ScopeButtonProps>(), {
    size: 300,
    disabled: false,
    themeColor: '#4f8cff',
    sound: true
  });
  
  /**
   * 按钮点击事件
   * @event click
   */
  const emit = defineEmits<{
    (e: 'click', event: MouseEvent): void
  }>();
  
  // 计算字体大小
  const fontSize = computed(() => props.size * 0.047);
  
  // 音效对象类型定义
  interface Sounds {
    hover: HTMLAudioElement | null;
    click: HTMLAudioElement | null;
  }
  
  // 音效
  const sounds = ref<Sounds>({
    hover: null,
    click: null
  });
  
  // 初始化音效
  onMounted(() => {
    if (props.sound) {
      sounds.value = {
        hover: new Audio('/sounds/aim.mp3'),
        click: new Audio('/sounds/shoot.mp3')
      };
      
      // 预加载音效
      sounds.value.hover?.load();
      sounds.value.click?.load();
      
      // 设置音量
      if (sounds.value.hover) sounds.value.hover.volume = 0.5;
      if (sounds.value.click) sounds.value.click.volume = 0.5;
    }
  });
  
  /**
   * 处理按钮点击事件
   * @param event - 鼠标事件对象
   */
  const handleClick = (event: MouseEvent) => {
    if (props.sound) {
      // 停止悬停音效
      if (sounds.value.hover) {
        sounds.value.hover.pause();
        sounds.value.hover.currentTime = 0;
      }
      // 播放点击音效
      if (sounds.value.click) {
        sounds.value.click.currentTime = 0;
        sounds.value.click.play();
      }
    }
    emit('click', event);
  };
  
  /**
   * 处理按钮悬停事件
   */
  const handleHover = () => {
    if (props.sound && !props.disabled) {
      // 停止之前的悬停音效
      if (sounds.value.hover) {
        sounds.value.hover.pause();
        sounds.value.hover.currentTime = 0;
      }
      // 播放新的悬停音效
      sounds.value.hover?.play();
    }
  };
  </script>
  
  <style scoped>
  .scope-button-container {
    display: inline-block;
  }
  
  .scope-button {
    position: relative;
    border: none;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.3s ease;
    background: radial-gradient(
      circle at center,
      rgba(44, 62, 80, 0.9) 0%,
      rgba(52, 73, 94, 0.9) 40%,
      rgba(44, 62, 80, 0.9) 100%
    ),
    linear-gradient(
      45deg,
      transparent 0%,
      rgba(255, 255, 255, 0.1) 45%,
      rgba(255, 255, 255, 0.05) 55%,
      transparent 100%
    );
    backdrop-filter: blur(4px);
    box-shadow: 
      0 8px 32px rgba(31, 38, 135, 0.3),
      inset 0 0 32px rgba(0, 0, 0, 0.3);
  }
  
  .scope-button.disabled {
    background: radial-gradient(
      circle at center,
      #95a5a6 0%,
      #7f8c8d 100%
    );
    cursor: not-allowed;
    opacity: 0.7;
  }
  
  .scope-button:hover:not(.disabled) {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 
      0 15px 45px rgba(31, 38, 135, 0.4),
      inset 0 0 32px rgba(0, 0, 0, 0.4);
  }
  
  .button-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.9);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: center;
    /* 初始状态 */
    font-size: calc(v-bind('fontSize') * 1.4) !important; /* 使用 !important 覆盖内联样式 */
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    opacity: 0.9;
    z-index: 2;
  }
  
  /* 悬停状态 */
  .scope-button:hover .button-text {
    font-size: v-bind('fontSize + "px"' * 1.05) !important;
    font-weight: 700;
    letter-spacing: 3px;
    color: rgb(0, 255, 115);
    text-shadow: 
      0 2px 4px rgba(0, 0, 0, 0.3),
      0 0 10px rgba(255, 255, 255, 0.2),
      0 0 20px v-bind('`rgba(${parseInt(props.themeColor.slice(1,3), 16)}, ${parseInt(props.themeColor.slice(3,5), 16)}, ${parseInt(props.themeColor.slice(5,7), 16)}, 0.4)`');
    opacity: 1;
    transform: translate(-50%, -50%) scale(0.85);
  }
  
  /* 点击状态 */
  .scope-button:active .button-text {
    transform: translate(-50%, -50%) scale(0.8);
    transition: all 0.1s ease;
  }
  
  /* 禁用状态 */
  .scope-button.disabled .button-text {
    opacity: 0.5;
    text-shadow: none;
  }
  
  /* 瞄准镜样式 */
  .crosshair-container {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .scope-button:hover .crosshair-container {
    opacity: 1;
  }
  
  .scope-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.8);
    animation: scopeIn 0.3s ease forwards;
  }
  
  .scope-ring.outer {
    width: 66.7%;
    height: 66.7%;
    border-width: 3px;
    animation-delay: 0s;
    border-color: v-bind('`rgba(${parseInt(props.themeColor.slice(1,3), 16)}, ${parseInt(props.themeColor.slice(3,5), 16)}, ${parseInt(props.themeColor.slice(5,7), 16)}, 0.8)`');
  }
  
  .scope-ring.inner {
    width: 50%;
    height: 50%;
    border-width: 2px;
    animation-delay: 0.1s;
    border-color: rgba(255, 255, 255, 0.6);
  }
  
  .crosshair {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 60%;
    height: 60%;
    transform: translate(-50%, -50%) scale(0);
    animation: scopeIn 0.3s ease 0.2s forwards;
  }
  
  .cross-line {
    position: absolute;
    background: v-bind('`rgba(${parseInt(props.themeColor.slice(1,3), 16)}, ${parseInt(props.themeColor.slice(3,5), 16)}, ${parseInt(props.themeColor.slice(5,7), 16)}, 0.8)`');
    box-shadow: v-bind('`0 0 10px rgba(${parseInt(props.themeColor.slice(1,3), 16)}, ${parseInt(props.themeColor.slice(3,5), 16)}, ${parseInt(props.themeColor.slice(5,7), 16)}, 0.4)`');
  }
  
  .cross-line.horizontal {
    width: 100%;
    height: 2px;
    top: 50%;
    transform: translateY(-50%);
  }
  
  .cross-line.vertical {
    width: 2px;
    height: 100%;
    left: 50%;
    transform: translateX(-50%);
  }
  
  .mil-dots {
    position: absolute;
    width: 100%;
    height: 100%;
  }
  
  .mil-dot {
    position: absolute;
    width: 3px;
    height: 3px;
    background: v-bind('`rgba(${parseInt(props.themeColor.slice(1,3), 16)}, ${parseInt(props.themeColor.slice(3,5), 16)}, ${parseInt(props.themeColor.slice(5,7), 16)}, 0.8)`');
    border-radius: 50%;
    box-shadow: v-bind('`0 0 5px rgba(${parseInt(props.themeColor.slice(1,3), 16)}, ${parseInt(props.themeColor.slice(3,5), 16)}, ${parseInt(props.themeColor.slice(5,7), 16)}, 0.4)`');
  }
  
  .mil-dot:nth-child(1) { top: 25%; left: 50%; }
  .mil-dot:nth-child(2) { top: 75%; left: 50%; }
  .mil-dot:nth-child(3) { top: 50%; left: 25%; }
  .mil-dot:nth-child(4) { top: 50%; left: 75%; }
  .mil-dot:nth-child(5) { top: 35%; left: 35%; }
  .mil-dot:nth-child(6) { top: 65%; left: 65%; }
  .mil-dot:nth-child(7) { top: 35%; left: 65%; }
  .mil-dot:nth-child(8) { top: 65%; left: 35%; }
  
  .numbers {
    position: absolute;
    width: 100%;
    height: 100%;
    animation: fadeIn 0.3s ease 0.3s forwards;
    opacity: 0;
  }
  
  .numbers span {
    position: absolute;
    color: v-bind('`rgba(${parseInt(props.themeColor.slice(1,3), 16)}, ${parseInt(props.themeColor.slice(3,5), 16)}, ${parseInt(props.themeColor.slice(5,7), 16)}, 0.8)`');
    font-size: 12px;
    font-weight: 600;
    text-shadow: v-bind('`0 0 5px rgba(${parseInt(props.themeColor.slice(1,3), 16)}, ${parseInt(props.themeColor.slice(3,5), 16)}, ${parseInt(props.themeColor.slice(5,7), 16)}, 0.4)`');
  }
  
  .numbers span:nth-child(1) { top: 15%; left: 50%; transform: translateX(-50%); }
  .numbers span:nth-child(2) { top: 50%; right: 15%; transform: translateY(-50%); }
  .numbers span:nth-child(3) { bottom: 15%; left: 50%; transform: translateX(-50%); }
  .numbers span:nth-child(4) { top: 50%; left: 15%; transform: translateY(-50%); }
  
  .blur-overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    background: radial-gradient(
      circle at center,
      transparent 30%,
      rgba(44, 62, 80, 0.3) 70%,
      rgba(44, 62, 80, 0.5) 100%
    );
    opacity: 0;
    animation: blurIn 0.3s ease 0.2s forwards;
  }
  
  @keyframes scopeIn {
    from {
      transform: translate(-50%, -50%) scale(0.5);
      opacity: 0;
    }
    to {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes blurIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .scope-button:active:not(.disabled) .crosshair-container {
    animation: scopeRecoil 0.2s ease;
  }
  
  @keyframes scopeRecoil {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }
  
  /* 添加背景动画样式 */
  .button-background {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    overflow: hidden;
    border-radius: 50%;
    opacity: 0.5;
    transition: opacity 0.3s ease;
  }
  
  .scope-button:hover .button-background {
    opacity: 1;
  }
  
  /* 旋转光环 */
  .rotating-ring {
    position: absolute;
    top: -5%;
    left: -5%;
    width: 110%;
    height: 110%;
    border: 2px dashed v-bind('props.themeColor');
    border-radius: 50%;
    animation: rotate 10s linear infinite;
  }
  
  /* 脉冲环 */
  .pulse-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    border: 2px solid v-bind('props.themeColor');
    border-radius: 50%;
    animation: pulse 2s ease-out infinite;
  }
  
  /* 扫描线 */
  .scan-line {
    position: absolute;
    width: 100%;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent,
      v-bind('props.themeColor'),
      transparent
    );
    animation: scan 2s linear infinite;
  }
  
  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  @keyframes pulse {
    0% {
      transform: translate(-50%, -50%) scale(0.95);
      opacity: 0.8;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.05);
      opacity: 0.4;
    }
    100% {
      transform: translate(-50%, -50%) scale(0.95);
      opacity: 0.8;
    }
  }
  
  @keyframes scan {
    0% {
      top: 0;
      opacity: 0;
    }
    50% {
      opacity: 0.8;
    }
    100% {
      top: 100%;
      opacity: 0;
    }
  }
  
  /* 添加边框发光效果 */
  .scope-button::after {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border-radius: 50%;
    background: linear-gradient(45deg, 
      transparent, 
      v-bind('`rgba(${parseInt(props.themeColor.slice(1,3), 16)}, ${parseInt(props.themeColor.slice(3,5), 16)}, ${parseInt(props.themeColor.slice(5,7), 16)}, 0.2)`'),
      transparent
    );
    animation: borderGlow 2s linear infinite;
    z-index: -1;
  }
  
  @keyframes borderGlow {
    0%, 100% {
      opacity: 0.5;
      transform: rotate(0deg);
    }
    50% {
      opacity: 1;
      transform: rotate(180deg);
    }
  }
  </style>