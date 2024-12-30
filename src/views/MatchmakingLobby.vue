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
            :selectedValue="roomConfig.language"
            @select="selectLanguage"
          />
        </div>

        <!-- 游戏类型选择器 -->
        <div class="cylinder-section" @wheel.stop>
          <div class="section-title">类型</div>
          <RevolverCylinder 
            class="cylinder-bg"
            :options="categories"
            :selectedValue="roomConfig.category"
            @select="selectCategory"
          />
        </div>

        <!-- 难度选择器 -->
        <div class="cylinder-section" @wheel.stop>
          <div class="section-title">难度</div>
          <RevolverCylinder 
            class="cylinder-bg"
            :options="difficulties"
            :selectedValue="roomConfig.difficulty"
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
        language: roomConfig.language,
        category: roomConfig.category,
        difficulty: roomConfig.difficulty
      }"
      @cancel="cancelMatching"
    />
  </div>
</template>
  
<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import ScopeButton from '@/components/ScopeButton.vue'
import MatchingScreen from '@/components/MatchingScreen.vue'
import { 
  languageOptionsState,
  categoryOptionsState, 
  difficultyOptionsState,
  DEFAULT_OPTIONS
} from '@/config/gameRoomAssets'
import RevolverCylinder from '@/components/RevolverCylinder.vue'

const isMatching = ref(false)

// 房间配置
const roomConfig = ref({
  language: DEFAULT_OPTIONS.matchmaking.language,
  category: DEFAULT_OPTIONS.matchmaking.category,
  difficulty: DEFAULT_OPTIONS.matchmaking.difficulty
})

// 计算属性：等待数据加载完成后再获取选项
const languages = computed(() => {
  const { options, loading } = languageOptionsState.value
  if (loading) return []
  
  return Object.values(options).map(option => ({
    ...option,
    disabled: option.disabled || !option.availableIn.includes('matchmaking')
  }))
})

const categories = computed(() => {
  const { options, loading } = categoryOptionsState.value
  if (loading) return []
  
  return Object.values(options).map(option => ({
    ...option,
    disabled: option.disabled || !option.availableIn.includes('matchmaking')
  }))
})

const difficulties = computed(() => {
  const { options, loading } = difficultyOptionsState.value
  if (loading) return []
  
  return Object.values(options).map(option => ({
    ...option,
    disabled: !option.availableIn.includes('matchmaking')
  }))
})

// 选择处理函数
const selectLanguage = (value) => {
  roomConfig.value.language = value
}

const selectCategory = (value) => {
  roomConfig.value.category = value
}

const selectDifficulty = (value) => {
  roomConfig.value.difficulty = value
}

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

// 验证配置是否完整
const isValid = computed(() => {
  const selectedLanguageOption = languages.value
    .find(option => option.value === roomConfig.value.language)
  
  const selectedCategoryOption = categories.value
    .find(option => option.value === roomConfig.value.category)
  
  const validLanguage = selectedLanguageOption && !selectedLanguageOption.disabled
  const validCategory = selectedCategoryOption && !selectedCategoryOption.disabled
  
  return validLanguage && 
         validCategory && 
         roomConfig.value.difficulty
})

// 监听语言变化，加载对应的类型选项
watch(() => roomConfig.value.language, async (newLanguage, oldLanguage) => {
  if (newLanguage !== oldLanguage) {
    roomConfig.value.category = ''
    roomConfig.value.difficulty = ''
    
    if (newLanguage) {
      await categoryOptionsState.value.refresh(newLanguage)
    }
  }
})

// 监听类型变化，加载对应的难度选项
watch(() => roomConfig.value.category, async (newCategory, oldCategory) => {
  if (newCategory !== oldCategory) {
    roomConfig.value.difficulty = ''
    
    if (newCategory && roomConfig.value.language) {
      await difficultyOptionsState.value.refresh(
        roomConfig.value.language,
        newCategory
      )
    }
  }
})

onMounted(async () => {
  const token = localStorage.getItem('token')
  if (token) {
    await languageOptionsState.value.initialize()
  }
})
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
  