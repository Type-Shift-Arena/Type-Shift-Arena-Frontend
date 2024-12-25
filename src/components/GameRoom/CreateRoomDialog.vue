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
              class="option-btn"
              :class="{ active: roomConfig.language === option.value }"
              @click="roomConfig.language = option.value"
              :disabled="option.disabled"
            >
              <i :class="option.icon"></i>
              <span>{{ option.label }}</span>
            </button>
          </div>
        </div>

        <!-- 类型选择 -->
        <div class="form-group">
          <label>类型</label>
          <div class="options-grid">
            <button
              v-for="option in categoryOptions"
              :key="option.value"
              class="option-btn"
              :class="{ active: roomConfig.category === option.value }"
              @click="roomConfig.category = option.value"
              :disabled="option.disabled"
            >
              <i :class="option.icon"></i>
              <span>{{ option.label }}</span>
            </button>
          </div>
        </div>

        <!-- 难度选择 -->
        <div class="form-group">
          <label>难度</label>
          <div class="options-grid">
            <button
              v-for="option in difficultyOptions"
              :key="option.value"
              class="option-btn"
              :class="{ active: roomConfig.difficulty === option.value }"
              @click="roomConfig.difficulty = option.value"
              :disabled="option.disabled"
            >
              <i :class="option.icon"></i>
              <span>{{ option.label }}</span>
            </button>
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
import { ref, computed } from 'vue'
import { 
  LANGUAGE_OPTIONS, 
  CATEGORY_OPTIONS, 
  DIFFICULTY_OPTIONS,
  getAvailableOptions 
} from '@/config/gameRoomAssets'

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

// 获取可用选项
const userInfo = { level: 0, permissions: [] } // 这里可以从用户状态获取实际信息
const languageOptions = getAvailableOptions(LANGUAGE_OPTIONS, 'custom', userInfo)
const categoryOptions = getAvailableOptions(CATEGORY_OPTIONS, 'custom', userInfo)
const difficultyOptions = getAvailableOptions(DIFFICULTY_OPTIONS, 'custom', userInfo)

// 验证配置是否完整
const isValid = computed(() => {
  return roomConfig.value.language && 
         roomConfig.value.category && 
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

// 创建房间
const handleCreate = () => {
  if (!isValid.value) return
  emit('create', { ...roomConfig.value })
  closeDialog()
}
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
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e4e4e4;
  cursor: pointer;
  transition: all 0.3s;
}

.option-btn:hover:not(:disabled) {
  background: rgba(79, 70, 229, 0.1);
  border-color: #4f46e5;
}

.option-btn.active {
  background: rgba(79, 70, 229, 0.2);
  border-color: #4f46e5;
  color: #fff;
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
</style>