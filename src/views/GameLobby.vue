<template>
  <div class="game-lobby">
    <div class="lobby-content" v-if="!isMatching">
      <!-- 3D转盘选择器 -->
      <div class="carousel-container">
        <div class="carousel-section">
          <h3>语言选择</h3>
          <div class="carousel" :style="{ transform: `rotateY(${languageRotation}deg)` }">
            <div 
              v-for="(lang, index) in languages" 
              :key="lang.value"
              class="carousel-item"
              :style="{ transform: `rotateY(${index * (360/languages.length)}deg) translateZ(150px)` }"
              :class="{ 
                active: selectedLanguage === lang.value,
                disabled: lang.disabled 
              }"
              @click="selectLanguage(lang.value)"
            >
              {{ lang.label }}
            </div>
          </div>
        </div>

        <div class="carousel-section">
          <h3>游戏类型</h3>
          <div class="carousel" :style="{ transform: `rotateY(${categoryRotation}deg)` }">
            <div 
              v-for="(cat, index) in categories" 
              :key="cat.value"
              class="carousel-item"
              :style="{ transform: `rotateY(${index * (360/categories.length)}deg) translateZ(150px)` }"
              :class="{ active: selectedCategory === cat.value }"
              @click="selectCategory(cat.value)"
            >
              {{ cat.label }}
            </div>
          </div>
        </div>

        <div class="carousel-section">
          <h3>难度等级</h3>
          <div class="carousel" :style="{ transform: `rotateY(${difficultyRotation}deg)` }">
            <div 
              v-for="(diff, index) in difficulties" 
              :key="diff.value"
              class="carousel-item"
              :style="{ transform: `rotateY(${index * (360/difficulties.length)}deg) translateZ(150px)` }"
              :class="{ active: selectedDifficulty === diff.value }"
              @click="selectDifficulty(diff.value)"
            >
              {{ diff.label }}
            </div>
          </div>
        </div>
      </div>

      <div class="button-container">
        <ScopeButton 
          :disabled="!isValid"
          :size="150"
          themeColor="#4f8cff"
          :sound="true"
          @click="startMatching"
        >
          开始匹配
        </ScopeButton>
      </div>
    </div>

    <MatchingScreen
      v-if="isMatching"
      :matchingOptions="{
        language: selectedLanguage,
        category: selectedCategory,
        difficulty: selectedDifficulty
      }"
      @cancel="cancelMatching"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import ScopeButton from '@/components/ScopeButton.vue'
import MatchingScreen from '@/components/MatchingScreen.vue'

const isMatching = ref(false)
const languageRotation = ref(0)
const categoryRotation = ref(0)
const difficultyRotation = ref(0)

const languages = [
  { label: '中文', value: 'CHINESE' },
  { label: '英文', value: 'ENGLISH' },
  { label: '敬请期待', value: 'COMING_SOON', disabled: true }
]

const categories = [
  { label: '日常对话', value: 'DAILY_CHAT' },
  { label: '商务会话', value: 'BUSINESS' },
  { label: '文学作品', value: 'LITERATURE' },
]

const difficulties = [
  { label: '简单', value: 'EASY' },
  { label: '中等', value: 'MEDIUM' },
  { label: '困难', value: 'HARD' }
]

const selectedLanguage = ref('CHINESE')
const selectedCategory = ref('DAILY_CHAT')
const selectedDifficulty = ref('EASY')

const selectLanguage = (value) => {
  const selectedLang = languages.find(l => l.value === value)
  if (selectedLang?.disabled) {
    return
  }
  
  selectedLanguage.value = value
  const index = languages.findIndex(l => l.value === value)
  languageRotation.value = -index * (360/languages.length)
}

const selectCategory = (value) => {
  selectedCategory.value = value
  const index = categories.findIndex(c => c.value === value)
  categoryRotation.value = -index * (360/categories.length)
}

const selectDifficulty = (value) => {
  selectedDifficulty.value = value
  const index = difficulties.findIndex(d => d.value === value)
  difficultyRotation.value = -index * (360/difficulties.length)
}

const isValid = computed(() => {
  const validLanguage = selectedLanguage.value && selectedLanguage.value !== 'COMING_SOON'
  return validLanguage && selectedCategory.value && selectedDifficulty.value
})

const startMatching = () => {
  isMatching.value = true
}

const cancelMatching = () => {
  isMatching.value = false
}
</script>

<style scoped>
.game-lobby {
  position: relative;
  min-height: calc(100vh - 140px);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.lobby-content {
  width: 100%;
  max-width: 1800px;
  padding: 2rem;
}

.title {
  color: #fff;
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3rem;
  text-shadow: 0 0 10px rgba(255,255,255,0.3);
}

/* 转盘容器样式 */
.carousel-container {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 30px;
  padding: 3rem;
  box-shadow: 
    0 8px 32px rgba(31, 38, 135, 0.1),
    inset 0 0 2px rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(8px);
}

.carousel-section {
  perspective: 1200px;
  text-align: center;
  position: relative;
  padding: 2rem;
}

.carousel-section::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: radial-gradient(circle at center, rgba(79,140,255,0.1) 0%, transparent 70%);
  pointer-events: none;
}

.carousel-section h3 {
  color: #2c3e50;
  margin-bottom: 2rem;
  font-size: 1.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  background: linear-gradient(45deg, #2c3e50, #4f8cff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 转盘样式 */
.carousel {
  position: relative;
  height: 120px;
  transform-style: preserve-3d;
  transition: transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.carousel-item {
  position: absolute;
  width: 220px;
  height: 70px;
  left: 50%;
  top: 50%;
  transform-origin: center;
  transform-style: preserve-3d;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2c3e50;
  font-size: 1.3rem;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 
    0 8px 32px rgba(31, 38, 135, 0.15),
    inset 0 0 2px rgba(255, 255, 255, 0.6);
  margin-left: -110px;
  margin-top: -35px;
  font-weight: 600;
  letter-spacing: 1px;
}

.carousel-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 20px;
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.05)
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.carousel-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.08) translateZ(160px);
  box-shadow: 
    0 12px 48px rgba(79, 140, 255, 0.2),
    inset 0 0 4px rgba(255, 255, 255, 0.8);
}

.carousel-item:hover::before {
  opacity: 1;
}

.carousel-item.active {
  background: rgba(79, 140, 255, 0.2);
  border: 2px solid rgba(79, 140, 255, 0.6);
  box-shadow: 
    0 0 30px rgba(79, 140, 255, 0.3),
    inset 0 0 20px rgba(79, 140, 255, 0.4);
  transform: scale(1.1) translateZ(160px);
}

.carousel-item.active::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 20px;
  background: linear-gradient(45deg, transparent, rgba(79, 140, 255, 0.1));
  filter: blur(4px);
  animation: shine 2s infinite;
}

.button-container {
  position: fixed;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
}

/* 添加禁用项样式 */
.carousel-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(200, 200, 200, 0.1);
  border: 1px solid rgba(200, 200, 200, 0.2);
}

.carousel-item.disabled:hover {
  transform: scale(1) translateZ(150px);
  background: rgba(200, 200, 200, 0.1);
  box-shadow: none;
}
</style>
