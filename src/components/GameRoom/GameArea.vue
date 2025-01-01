<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'

const isComposing = ref(false)

const props = defineProps({
  targetText: {
    type: String,
    required: true
  },
  gameStatus: {
    type: String,
    required: true
  },
  playerText: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:playerText', 'input'])

// 常量定义
const lineHeight = 32 // 行高
const containerPadding = 16 // 内边距
const visibleLines = 4 // 可见行数
const currentLine = ref(0) // 当前所在行

// 添加对容器的引用
const textContainer = ref(null)

// 文本容器高度的计算
const containerHeight = computed(() => {
  // 计算容器高度：行高 * 可见行数(不包含上下内边距)
  return `${(lineHeight * visibleLines)}px`
})

// 计算位置
const calculateTextPosition = computed(() => {
  // 计算偏移量：当前行 * 行高
  const offset = Math.max(0, (currentLine.value * lineHeight))
  const transform = `translateY(-${offset}px)`
  console.log('Scroll position:', {
    currentLine: currentLine.value,
    offset,
    transform
  })
  return { transform }
})

// 计算当前光标所在行数
const updateCurrentLine = (text, cursorPosition) => {
  if (!textContainer.value) return

  // 获取容器宽度（减去左右 padding）
  const containerWidth = textContainer.value.clientWidth - (containerPadding * 2)
  const textElement = textContainer.value.querySelector('.target-text')
  if (!textElement) return

  // 创建临时 span 来测量字符宽度
  const tempSpan = document.createElement('span')
  tempSpan.style.visibility = 'hidden'
  tempSpan.style.position = 'absolute'
  tempSpan.style.fontSize = '1.2rem' 
  tempSpan.style.whiteSpace = 'pre'
  textContainer.value.appendChild(tempSpan)

  let currentWidth = 0
  let currentLineCount = 1
  let lastSpaceIndex = -1
  const textBeforeCursor = text.substring(0, cursorPosition)

  // 计算每个字符的宽度和换行
  for (let i = 0; i < textBeforeCursor.length; i++) {
    const char = textBeforeCursor[i]
    tempSpan.textContent = char
    const charWidth = tempSpan.offsetWidth

    if (char === '\n') {
      currentLineCount++
      currentWidth = 0
      continue
    }

    if (char === ' ') {
      lastSpaceIndex = i
    }

    currentWidth += charWidth

    // 检查是否需要换行
    if (currentWidth > containerWidth - 40) { // 40px 作为安全边距
      currentLineCount++
      if (lastSpaceIndex !== -1) {
        // 如果有空格，从空格处换行
        i = lastSpaceIndex
        lastSpaceIndex = -1
      }
      currentWidth = 0
    }
  }

  // 清理临时元素
  textContainer.value.removeChild(tempSpan)

  // 计算总行数
  const totalLines = currentLineCount

  console.log({
    cursorPosition,
    calculatedLines: currentLineCount,
    totalLines,
    containerWidth,
    textBeforeCursor
  })

  // 更新当前行
  if (currentLineCount > visibleLines) {
    // 确保光标所在行始终在可见区域内，但不超过倒数第二行
    currentLine.value = Math.max(0, Math.min(currentLineCount - visibleLines + 1, currentLineCount - 1))
  } else {
    currentLine.value = 0
  }

  console.log('Line calculation:', {
    currentLineCount,
    visibleLines,
    newCurrentLine: currentLine.value,
    containerWidth
  })
}

// 输入处理
const handleInput = (event) => {
  console.log('Input event triggered')
  if (!isComposing.value) {
    const newText = event.target.value
    console.log('New text:', newText)
    emit('update:playerText', newText)
    emit('input', event)
    updateCurrentLine(newText, event.target.selectionStart)
  }
}

// 输入法组合开始
const handleCompositionStart = () => {
  isComposing.value = true
}

// 输入法组合结束
const handleCompositionEnd = (event) => {
  isComposing.value = false
  // 在组合结束时更新文本
  emit('update:playerText', event.target.value)
  emit('input', event)
  // 更新当前行
  updateCurrentLine(event.target.value, event.target.selectionStart)
}

// 计算字符状态的方法
const getCharClass = (char, index) => {
  // 只在当前输入位置使用组合状态判断
  if (isComposing.value && props.playerText.length === index) {
    return {
      'current': true,
      'space': char === ' '
    }
  }

  // 对于已经输入的字符，保持正常的样式判断
  const isCurrentPos = props.playerText.length === index
  const playerChar = props.playerText[index]
  
  return {
    'correct': playerChar === char,
    'incorrect': playerChar && playerChar !== char,
    'current': isCurrentPos,
    'space': char === ' '
  }
}

// 添加 watch 来监听 targetText 的变化
watch(() => props.targetText, (newText) => {
  console.log('Target text changed:', newText)
  if (newText) {
    const lines = newText.split('\n')
    console.log('Total target text lines:', lines.length)
  }
})

// 监听窗口大小变化
onMounted(() => {
  const resizeObserver = new ResizeObserver(() => {
    // 当容器大小变化时重新计算
    if (props.playerText) {
      updateCurrentLine(props.playerText, props.playerText.length)
    }
  })

  if (textContainer.value) {
    resizeObserver.observe(textContainer.value)
  }

  // 清理函数
  onUnmounted(() => {
    resizeObserver.disconnect()
  })
})

// 处理粘贴事件
const handlePaste = (event) => {
  // event.preventDefault()
  console.log('Paste event triggered')
}

</script>

<template>
  <div class="game-content">
    <div 
      class="target-text-container" 
      ref="textContainer"
      :style="{ height: containerHeight }"
    >
      <div 
        class="target-text"
        :style="calculateTextPosition"
      >
        <span 
          v-for="(char, index) in targetText" 
          :key="index"
          :class="getCharClass(char, index)"
        >{{ char === ' ' ? '␣' : char }}</span>
      </div>
    </div>

    <!-- 输入区域 -->
    <textarea
      :value="playerText"
      @input="handleInput"
      @compositionstart="handleCompositionStart"
      @compositionend="handleCompositionEnd"
      @paste="handlePaste"
      :placeholder="gameStatus === 'WAITING' ? '等待对手加入...' : ''"
      class="input-area"
      ref="inputArea"
    ></textarea>
  </div>
</template>

<style scoped>
.game-content {
  background: var(--secondary-dark);
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  padding-top: 0px;
}

.target-text-container {
  overflow: hidden;
  position: relative;
  padding: 16px;
  padding-top:0px;
  padding-bottom: 0px;
  background: var(--accent-dark);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
  user-select: none;
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* IE/Edge */
}

.target-text {
  position: relative;
  transition: transform 0.3s ease;
  font-size: 19.2px;
  line-height: 32px;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-all;
  letter-spacing: 0.02em;
}

.target-text span {
  position: relative;
  transition: all 0.2s ease;
  /* padding: 0 1px; */
}

.target-text span.correct {
  color: var(--success-color);
}

.target-text span.incorrect {
  color: var(--danger-color);
  background-color: rgba(239, 68, 68, 0.1);
  border-radius: 2px;
}

.target-text span.current {
  border-left: 2px solid var(--accent-color);
  margin-left: -1px;
}

.target-text span.space {
  border-radius: 2px;
  margin: 0 2px;
  color: var(--text-secondary);
  opacity: 0.7;
}

.input-area {
  width: 100%;
  min-height: 100px;
  padding: 1.5rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1.2rem;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.3s ease;
  background: var(--primary-dark);
  color: var(--text-primary);
  margin-top: 1rem;
}

.input-area:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.input-area:disabled {
  background: var(--accent-dark);
  cursor: not-allowed;
  opacity: 0.7;
  border-color: var(--border-color);
}

.input-area::placeholder {
  color: var(--text-secondary);
  opacity: 0.8;
}
</style>
