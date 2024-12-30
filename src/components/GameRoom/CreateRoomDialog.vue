<template>
  <div class="dialog-overlay" v-if="visible" @click.self="closeDialog">
    <div class="dialog-content">
      <div class="dialog-header">
        <h2>创建房间</h2>
        <button class="close-btn" @click="closeDialog">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="dialog-body">
        <!-- 语言选择 -->
        <div class="form-group">
          <label>语言</label>
          <div class="options-grid">
            <button
              v-for="option in languageOptions"
              :key="option.value"
              class="option-btn language-btn"
              :class="{ active: roomConfig.language === option.value }"
              @click="roomConfig.language = option.value"
              :disabled="option.disabled"
            >
              <div class="language-icon-wrapper">
                <Icon :icon="`emojione:flag-for-${option.icon}`" class="flag-icon" />
              </div>
              <span class="language-name">{{ option.label }}</span>
            </button>
          </div>
        </div>

        <!-- 类型选择 -->
        <div class="form-group">
          <label>类型</label>
          <div class="options-grid">
            <template v-if="categoryOptionsState.loading">
              <!-- 使用骨架屏占位 -->
              <div 
                v-for="n in 3" 
                :key="`skeleton-${n}`" 
                class="option-btn skeleton-btn"
              >
                <div class="skeleton-icon"></div>
                <div class="skeleton-text"></div>
              </div>
            </template>
            <template v-else-if="categoryOptionsState.error">
              <div class="error-state">
                <Icon icon="material-symbols:error-outline" class="error-icon" />
                <span>加载失败</span>
                <button 
                  class="retry-btn"
                  @click="() => categoryOptionsState.refresh(roomConfig.language)"
                >
                  重试
                </button>
              </div>
            </template>
            <template v-else>
              <button
                v-for="option in categoryOptions"
                :key="option.value"
                class="option-btn category-btn"
                :class="{ active: roomConfig.category === option.value }"
                @click="roomConfig.category = option.value"
                :disabled="option.disabled || !roomConfig.language"
              >
                <div class="category-icon-wrapper">
                  <Icon :icon="option.icon" class="category-icon" />
                </div>
                <span class="category-name">{{ option.label }}</span>
              </button>
            </template>
          </div>
        </div>

        <!-- 难度选择 -->
        <div class="form-group">
          <label>难度</label>
          <div class="options-grid">
            <template v-if="difficultyOptionsState.loading">
              <!-- 使用骨架屏占位 -->
              <div 
                v-for="n in 3" 
                :key="`skeleton-${n}`" 
                class="option-btn skeleton-btn"
              >
                <div class="skeleton-icon"></div>
                <div class="skeleton-text"></div>
              </div>
            </template>
            <template v-else-if="difficultyOptionsState.error">
              <div class="error-state">
                <Icon icon="material-symbols:error-outline" class="error-icon" />
                <span>加载失败</span>
                <button 
                  class="retry-btn"
                  @click="() => difficultyOptionsState.refresh(roomConfig.language, roomConfig.category)"
                >
                  重试
                </button>
              </div>
            </template>
            <template v-else>
              <button
                v-for="option in difficultyOptions"
                :key="option.value"
                class="option-btn difficulty-btn"
                :class="{ active: roomConfig.difficulty === option.value }"
                @click="roomConfig.difficulty = option.value"
                :disabled="option.disabled || !roomConfig.language || !roomConfig.category"
              >
                <div class="difficulty-icon-wrapper">
                  <Icon :icon="option.icon" class="difficulty-icon" />
                </div>
                <span class="difficulty-name">{{ option.label }}</span>
              </button>
            </template>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="cancel-btn" @click="closeDialog">取消</button>
        <button 
          class="create-btn" 
          @click="handleCreate"
          :disabled="!isValid"
        >
          创建房间
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { 
  languageOptionsState,
  categoryOptionsState,
  difficultyOptionsState
} from '@/config/gameRoomAssets'
import { useRouter } from 'vue-router'
import { ElNotification } from 'element-plus'
import axios from '@/plugins/axios'
import { useWebSocket } from '@/composables/useWebSocket'
import { useGameState } from '@/composables/useGameState'
import { Icon } from '@iconify/vue'

const router = useRouter()
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'create'])

// 房间配置
const roomConfig = ref({
  language: '',
  category: '',
  difficulty: ''
})

// 计算属性：等待数据加载完成后再获取选项
const languageOptions = computed(() => {
  const { options, loading } = languageOptionsState.value || { options: null, loading: false }
  if (loading || !options) return []
  
  return Object.values(options)
    .filter(option => option && typeof option === 'object')
    .map(option => ({
      value: option.value,
      label: option.label,
      icon: option.icon,
      disabled: option.disabled || !option.availableIn?.includes('custom')
    }))
})

const categoryOptions = computed(() => {
  const { options, loading } = categoryOptionsState.value || { options: null, loading: false }
  if (loading || !options) return []
  
  return Object.values(options)
    .filter(option => option && typeof option === 'object')
    .map(option => ({
      value: option.value,
      label: option.label,
      icon: option.icon,
      disabled: option.disabled || !option.availableIn?.includes('custom')
    }))
})

const difficultyOptions = computed(() => {
  const { options, loading } = difficultyOptionsState.value || { options: null, loading: false }
  if (loading || !options) return []
  
  return Object.values(options)
    .filter(option => option && typeof option === 'object')
    .map(option => ({
      value: option.value,
      label: option.label,
      icon: option.icon,
      disabled: !option.availableIn?.includes('custom')
    }))
})

// 验证配置是否完整
const isValid = computed(() => {
  const selectedLanguageOption = languageOptions.value
    .find(option => option.value === roomConfig.value.language)
  
  const selectedCategoryOption = categoryOptions.value
    .find(option => option.value === roomConfig.value.category)
  
  // 检查语言和类型是否选中且可用
  const validLanguage = selectedLanguageOption && !selectedLanguageOption.disabled
  const validCategory = selectedCategoryOption && !selectedCategoryOption.disabled
  
  return validLanguage && 
         validCategory && 
         roomConfig.value.difficulty
})

// 关闭对话框
const closeDialog = () => {
  emit('update:visible', false)
  // 重置表单
  roomConfig.value = {
    language: '',
    category: '',
    difficulty: ''
  }
}

// WebSocket 相关
const { stompClient, connectWebSocket, subscribeToPlayerChannel, subscribeToRoomBroadcast, hasSubscription } = useWebSocket()

// 处理创建房间
const handleCreateRoom = async (config) => {
  try {
    const playerId = localStorage.getItem('userId')
    const playerName = localStorage.getItem('userName')
    const token = localStorage.getItem('token')
    
    if (!playerId || !token) {
      throw new Error('未登录或用户信息缺失')
    }

    // 1. 确保WebSocket连接已建立
    if (!stompClient.value?.connected) {
      await connectWebSocket()
    }

    // 2. 订阅个人频道以接收房间创建消息
    if (!hasSubscription(`player_channel_${playerId}`)) {
      await subscribeToPlayerChannel(playerId)
    }

    // 3. 发送创建房间请求
    const response = await axios.post('/rooms/create', {
      playerId: playerId,
      playerName: playerName,
      language: config.language,
      category: config.category,
      difficulty: config.difficulty
    })

    if (response.data.status === 200) {
      const roomId = response.data.data.roomId
      
      // 4. 订阅房间广播频道
      if (!hasSubscription(`room_${roomId}`)) {
        await subscribeToRoomBroadcast(roomId)
      }

      // 5. 导航到房间
      router.push(`/room/${roomId}`)
    }
  } catch (error) {
    console.error('创建房间失败:', error)
    ElNotification({
      title: '错误',
      message: '创建房间失败: ' + error.message,
      type: 'error'
    })
  }
}

// 创建房间
const handleCreate = () => {
  if (!isValid.value) return
  
  // Convert values to uppercase to match backend expectations
  const config = {
    language: roomConfig.value.language.toUpperCase(),
    category: roomConfig.value.category.toUpperCase(),
    difficulty: roomConfig.value.difficulty.toUpperCase()
  }

  // 保存匹配选项
  localStorage.setItem('roomOptions', JSON.stringify(config))
  
  handleCreateRoom(config)
  closeDialog()
}

// 监听加载状态
watch(() => languageOptionsState.value.loading, (isLoading) => {
  if (isLoading) {
    console.log('Language options are loading...')
  } else if (languageOptionsState.value.error) {
    console.error('Failed to load language options:', languageOptionsState.value.error)
  } else {
    console.log('Language options loaded successfully')
  }
})

// 监听语言变化，加载对应的类型选项
watch(() => roomConfig.value.language, async (newLanguage, oldLanguage) => {
  // 当语言改变时，清空类型和难度
  if (newLanguage !== oldLanguage) {
    roomConfig.value.category = ''
    roomConfig.value.difficulty = ''
    
    if (newLanguage) {
      // 加载新语言对应的类型选项
      await categoryOptionsState.value.refresh(newLanguage)
    }
  }
})

// 监听类型变化，加载对应的难度选项
watch(() => roomConfig.value.category, async (newCategory, oldCategory) => {
  // 当类型改变时，清空难度
  if (newCategory !== oldCategory) {
    roomConfig.value.difficulty = ''
    
    if (newCategory && roomConfig.value.language) {
      // 加载新类型对应的难度选项
      await difficultyOptionsState.value.refresh(
        roomConfig.value.language,
        newCategory
      )
    }
  }
})

// 添加 onMounted 钩子来初始化选项
onMounted(async () => {
  try {
    // 确保语言选项已加载
    if (!languageOptionsState.value?.options) {
      await languageOptionsState.value?.initialize?.()
    }
  } catch (error) {
    console.error('Failed to initialize language options:', error)
  }
})

</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.dialog-content {
  background: #1a1a1a;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dialog-header h2 {
  margin: 0;
  color: #fff;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.3s;
}

.close-btn:hover {
  color: #fff;
}

.dialog-body {
  padding: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #e4e4e4;
  font-weight: 500;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
  min-height: 120px; /* 确保加载状态时保持一致的高度 */
}

.option-btn {
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #e4e4e4;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.option-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dialog-footer {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.cancel-btn {
  padding: 0.5rem 1rem;
  background: none;
  border: 1px solid #6b7280;
  color: #6b7280;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.create-btn {
  padding: 0.5rem 1.5rem;
  background: #4f46e5;
  border: none;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.create-btn:hover:not(:disabled) {
  background: #4338ca;
}

.create-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.language-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  text-align: center;
  min-height: 100px;
}

.language-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(79, 70, 229, 0.1);
  transition: all 0.3s ease;
}

.flag-icon {
  width: 24px !important;
  height: 24px !important;
}

.language-name {
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.2;
}

.option-btn.language-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.option-btn.language-btn:hover:not(:disabled) .language-icon-wrapper {
  background: rgba(79, 70, 229, 0.2);
  transform: scale(1.1);
}

.option-btn.language-btn.active {
  background: rgba(79, 70, 229, 0.15);
}

.option-btn.language-btn.active .language-icon-wrapper {
  background: rgba(79, 70, 229, 0.3);
}

/* 骨架屏样式 */
.skeleton-btn {
  background: rgba(255, 255, 255, 0.05);
  cursor: default;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  animation: pulse 1.5s infinite;
}

.skeleton-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.skeleton-text {
  height: 14px;
  width: 60%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.3;
  }
  100% {
    opacity: 0.6;
  }
}

/* 错误状态样式 */
.error-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 8px;
  color: #ef4444;
}

.error-icon {
  font-size: 2rem;
}

.retry-btn {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: none;
  border: 1px solid currentColor;
  border-radius: 4px;
  color: inherit;
  cursor: pointer;
  transition: all 0.3s;
}

.retry-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

.category-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  text-align: center;
  min-height: 100px;
  position: relative;
}

.category-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(79, 70, 229, 0.1);
  transition: all 0.3s ease;
}

.category-icon {
  font-size: 24px;
  color: #4f46e5;
}

.category-name {
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.2;
}

.option-btn.category-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.option-btn.category-btn:hover:not(:disabled) .category-icon-wrapper {
  background: rgba(79, 70, 229, 0.2);
  transform: scale(1.1);
}

.option-btn.category-btn.active {
  background: rgba(79, 70, 229, 0.15);
}

.option-btn.category-btn.active .category-icon-wrapper {
  background: rgba(79, 70, 229, 0.3);
}

/* 骨架屏样式优化 */
.skeleton-btn {
  min-height: 100px;
  flex-direction: column;
  justify-content: center;
}

.skeleton-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
}

.skeleton-text {
  width: 80%;
  margin-top: 0.75rem;
}

.difficulty-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  text-align: center;
  min-height: 100px;
  position: relative;
}

.difficulty-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(79, 70, 229, 0.1);
  transition: all 0.3s ease;
}

.difficulty-icon {
  font-size: 24px;
  color: #4f46e5;
}

.difficulty-name {
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.2;
}

.option-btn.difficulty-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.option-btn.difficulty-btn:hover:not(:disabled) .difficulty-icon-wrapper {
  background: rgba(79, 70, 229, 0.2);
  transform: scale(1.1);
}

.option-btn.difficulty-btn.active {
  background: rgba(79, 70, 229, 0.15);
}

.option-btn.difficulty-btn.active .difficulty-icon-wrapper {
  background: rgba(79, 70, 229, 0.3);
}

/* 确保骨架屏样式在难度选项中也生效 */
.difficulty-btn.skeleton-btn {
  min-height: 100px;
}
</style>