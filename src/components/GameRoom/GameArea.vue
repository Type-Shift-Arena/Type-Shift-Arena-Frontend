<script setup>
import { ref, watch } from 'vue'

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

// 输入处理
const handleInput = (event) => {
  emit('update:playerText', event.target.value)
  emit('input', event)
}

// 计算字符状态的方法
const getCharClass = (char, index) => {
  return {
    'correct': props.playerText[index] === char,
    'incorrect': props.playerText[index] && props.playerText[index] !== char,
    'current': props.playerText.length === index,
    'space': char === ' '
  }
}
</script>

<template>
  <div class="game-content">
    <!-- 目标文本 -->
    <div class="target-text">
      <span 
        v-for="(char, index) in targetText" 
        :key="index"
        :class="getCharClass(char, index)"
      >{{ char === ' ' ? '␣' : char }}</span>
    </div>

    <!-- 输入区域 -->
    <textarea
      :value="playerText"
      @input="handleInput"
      :disabled="gameStatus === 'finished'"
      :placeholder="gameStatus === 'playing' ? '开始输入...' : '等待对手加入...'"
      class="input-area"
      ref="inputArea"
    ></textarea>
  </div>
</template>

<style scoped>
.game-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.target-text {
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  color: #2c3e50;
  white-space: pre-wrap;
  word-break: break-all;
}

.target-text span {
  position: relative;
  transition: all 0.2s ease;
}

.target-text span.correct {
  color: #42b983;
}

.target-text span.incorrect {
  color: #ff6b6b;
  background-color: rgba(255, 107, 107, 0.1);
}

.target-text span.current {
  border-left: 2px solid #42b983;
}

.target-text span.space {
  border-radius: 2px;
  margin: 0 1px;
  color: #c7c7c7;
  font-size: 0.9em;
}

.target-text span.space.correct {
  background-color: rgba(66, 185, 131, 0.1);
}

.target-text span.space.incorrect {
  background-color: rgba(255, 107, 107, 0.1);
}

.input-area {
  width: 100%;
  min-height: 100px;
  padding: 1rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 1.2rem;
  line-height: 1.6;
  resize: vertical;
  transition: border-color 0.3s ease;
}

.input-area:focus {
  outline: none;
  border-color: #42b983;
}

.input-area:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
}
</style>
