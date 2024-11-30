<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import soundManager from '@/utils/SoundManager'
import { SOUND_ASSETS } from '@/config/soundAssets'

const { locale } = useI18n()
const activeTab = ref('sound')

const tabs = [
  { id: 'sound', label: '声音设置', icon: 'volume_up' },
  { id: 'language', label: '语言设置', icon: 'language' },
  // 预留其他设置选项卡
  // { id: 'display', label: '显示设置', icon: 'display_settings' },
  // { id: 'account', label: '账号设置', icon: 'person' },
]

// 添加预览功能
const previewSound = () => {
  // 确保音效已启用
  if (!soundManager.isEnabled()) {
    return
  }
  
  // 连续播放三次
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      soundManager.playTypeSound()
    }, i * 100)
  }
}

// 语言切换函数
const switchLanguage = (newLang) => {
  locale.value = newLang
}
</script>

<template>
  <div class="settings-container">
    <div class="settings-sidebar">
      <div 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab-item', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        <span class="material-icons">{{ tab.icon }}</span>
        {{ tab.label }}
      </div>
    </div>

    <div class="settings-content">
      <!-- 声音设置面板 -->
      <div v-if="activeTab === 'sound'" class="settings-panel">
        <h2>声音设置</h2>
        <div class="setting-group">
          <div class="setting-item">
            <label class="setting-label">
              <span class="material-icons">keyboard</span>
              打字音效
            </label>
            <div class="setting-controls">
              <label class="switch">
                <input 
                  type="checkbox"
                  :checked="soundManager.isEnabled()"
                  @change="soundManager.toggleSound()"
                />
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div class="setting-item">
            <label class="setting-label">音效类型</label>
            <div class="setting-controls">
              <select 
                :value="soundManager.getCurrentSound()"
                @change="e => soundManager.changeSound(e.target.value)"
                :disabled="!soundManager.isEnabled()"
              >
                <option 
                  v-for="sound in Object.values(SOUND_ASSETS)" 
                  :key="sound.id" 
                  :value="sound.id"
                >
                  {{ sound.name }}
                </option>
              </select>
              <button 
                class="preview-button"
                @click="previewSound"
                :disabled="!soundManager.isEnabled()"
              >
                <span class="material-icons">play_circle</span>
                试听
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 语言设置面板 -->
      <div v-if="activeTab === 'language'" class="settings-panel">
        <h2>语言设置</h2>
        <div class="setting-group">
          <div class="setting-item">
            <label class="setting-label">
              <span class="material-icons">language</span>
              界面语言
            </label>
            <div class="setting-controls">
              <select 
                :value="locale"
                @change="e => switchLanguage(e.target.value)"
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- 预留其他设置面板 -->
    </div>
  </div>
</template>

<style scoped>
.settings-container {
  display: flex;
  min-height: calc(100vh - 60px);
  background: #f5f5f5;
}

.settings-sidebar {
  width: 250px;
  background: white;
  padding: 20px 0;
  border-right: 1px solid #eee;
}

.tab-item {
  padding: 15px 25px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.tab-item:hover {
  background: #f0f0f0;
}

.tab-item.active {
  background: #e0e0e0;
  font-weight: 500;
}

.settings-content {
  flex: 1;
  padding: 30px;
}

.settings-panel h2 {
  margin-bottom: 30px;
  color: #333;
}

.setting-group {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #333;
}

.setting-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 开关样式 */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background: white;
  min-width: 150px;
}

select:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

/* 添加预览按钮样式 */
.preview-button {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.preview-button:hover:not(:disabled) {
  background: #f0f0f0;
  border-color: #ccc;
}

.preview-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f5f5f5;
}

.preview-button .material-icons {
  font-size: 18px;
}

/* 修改setting-controls样式以适应新按钮 */
.setting-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>