<template>
  <div class="matchmaking-lobby">
    <div class="lobby-header">
      <div class="header-title">
        <h1>匹配大厅</h1>
      </div>
    </div>

    <div class="lobby-content" v-if="!isMatching">
      <div class="revolver-container">
        <!-- 语言选择器 -->
        <div class="cylinder-section" @wheel.stop>
          <div class="section-title">语言</div>
          <RevolverCylinder 
            class="cylinder-bg"
            :options="languages"
            :selectedValue="selectedLanguage"
            @select="selectLanguage"
          />
        </div>

        <!-- 游戏类型选择器 -->
        <div class="cylinder-section" @wheel.stop>
          <div class="section-title">类型</div>
          <RevolverCylinder 
            class="cylinder-bg"
            :options="categories"
            :selectedValue="selectedCategory"
            @select="selectCategory"
          />
        </div>

        <!-- 难度选择器 -->
        <div class="cylinder-section" @wheel.stop>
          <div class="section-title">难度</div>
          <RevolverCylinder 
            class="cylinder-bg"
            :options="difficulties"
            :selectedValue="selectedDifficulty"
            @select="selectDifficulty"
          />
        </div>
      </div>

      <div class="button-container">
        <ScopeButton 
          :disabled="!isValid"
          :size="160"
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import ScopeButton from '@/components/ScopeButton.vue'
import MatchingScreen from '@/components/MatchingScreen.vue'
import { 
  LANGUAGE_OPTIONS,
  CATEGORY_OPTIONS,
  DIFFICULTY_OPTIONS,
  MODE_OPTIONS,
  DEFAULT_OPTIONS,
  getAvailableOptions
} from '@/config/gameRoomAssets'
import RevolverCylinder from '@/components/RevolverCylinder.vue'

const isMatching = ref(false)
const languageRotation = ref(0)
const categoryRotation = ref(0)
const difficultyRotation = ref(0)

const userInfo = {
  level: 5,
  permissions: ['basic_user']
}

// 获取匹配大厅可用的选项
const languages = getAvailableOptions(LANGUAGE_OPTIONS, 'matchmaking', userInfo)
const categories = getAvailableOptions(CATEGORY_OPTIONS, 'matchmaking', userInfo)
const difficulties = getAvailableOptions(DIFFICULTY_OPTIONS, 'matchmaking', userInfo)

// 使用默认选项
const selectedLanguage = ref(DEFAULT_OPTIONS.matchmaking.language)
const selectedCategory = ref(DEFAULT_OPTIONS.matchmaking.category)
const selectedDifficulty = ref(DEFAULT_OPTIONS.matchmaking.difficulty)

const selectLanguage = (value) => {
  const selectedLang = languages.find(l => l.value === value)
  if (selectedLang?.disabled) return
  selectedLanguage.value = value
}

const selectCategory = (value) => {
  selectedCategory.value = value
}

const selectDifficulty = (value) => {
  selectedDifficulty.value = value
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
  const playerId = localStorage.getItem('userId')
  if (subscriptions.value.has(`matchmaking_${playerId}`)) {
    subscriptions.value.get(`matchmaking_${playerId}`).unsubscribe()
    subscriptions.value.delete(`matchmaking_${playerId}`)
  }
}
</script>
  
<style scoped>
.matchmaking-lobby {
  min-height: calc(100vh - 140px);
  padding: 1.5rem;
  color: #fff;
  overflow-x: hidden;
}

.lobby-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.header-title h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 0 10px rgba(79, 140, 255, 0.5);
}

.lobby-content {
  border-radius: 16px;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(26, 32, 44, 0.4);
}

.revolver-container {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  gap: 4rem;
  margin-bottom: 2rem;
}

.cylinder-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #e4e4e4;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 0 0 10px rgba(79, 140, 255, 0.3);
}

.button-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

@media (max-width: 1400px) {
  .revolver-container {
    gap: 2rem;
  }
}

@media (max-width: 1200px) {
  .revolver-container {
    gap: 1.5rem;
  }
}

@media (max-width: 768px) {
  .matchmaking-lobby {
    padding: 1rem;
  }

  .lobby-header {
    margin-top: 1rem;
    margin-bottom: 1.5rem;
  }

  .revolver-container {
    flex-direction: column;
    gap: 2rem;
  }

  .cylinder-section {
    width: 100%;
    max-width: 280px;
    margin: 0 auto;
  }
}
</style>
  