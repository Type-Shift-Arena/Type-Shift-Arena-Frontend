<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import soundManager from '@/utils/SoundManager'
import { SOUND_ASSETS } from '@/config/soundAssets'
import { setLocale } from '@/i18n'

const { locale, t } = useI18n()
const activeTab = ref('sound')

// 匹配按钮（狙击镜）音效设置
const scopeHoverSound = ref({
  enabled: localStorage.getItem('scopeHoverSound.enabled') !== 'false',
  volume: Number(localStorage.getItem('scopeHoverSound.volume')) || 0.5
})

const scopeClickSound = ref({
  enabled: localStorage.getItem('scopeClickSound.enabled') !== 'false',
  volume: Number(localStorage.getItem('scopeClickSound.volume')) || 0.5
})

const tabs = [
  { id: 'sound', label: t('settings.sound.title'), icon: 'volume_up' },
  { id: 'language', label: t('settings.language.title'), icon: 'language' },
]

// 预览打字音效
const previewTypingSound = () => {
  if (!soundManager.isEnabled()) return
  
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      soundManager.playTypeSound()
    }, i * 100)
  }
}

// 预览匹配按钮（狙击镜）聚焦音效
const previewScopeHoverSound = () => {
  if (!scopeHoverSound.value.enabled) return
  const hoverSound = new Audio('/sounds/aim.mp3')
  hoverSound.volume = scopeHoverSound.value.volume
  hoverSound.play()
}

// 预览匹配按钮（狙击镜）点击音效
const previewScopeClickSound = () => {
  if (!scopeClickSound.value.enabled) return
  const clickSound = new Audio('/sounds/shoot.mp3')
  clickSound.volume = scopeClickSound.value.volume
  clickSound.play()
}

// 更新匹配按钮（狙击镜）聚焦音效设置
const updateScopeHoverSound = (key, value) => {
  scopeHoverSound.value[key] = value
  localStorage.setItem(`scopeHoverSound.${key}`, value.toString())
}

// 更新匹配按钮（狙击镜）点击音效设置
const updateScopeClickSound = (key, value) => {
  scopeClickSound.value[key] = value
  localStorage.setItem(`scopeClickSound.${key}`, value.toString())
}

// 语言切换函数
const switchLanguage = (newLang) => {
  setLocale(newLang)
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
        <h2>{{ t('settings.sound.title') }}</h2>
        
        <!-- 打字音效设置 -->
        <div class="setting-group">
          <h3>{{ t('settings.sound.typingSound') }}</h3>
          <div class="setting-item">
            <label class="setting-label">
              <span class="material-icons">keyboard</span>
              {{ t('settings.sound.enable') }}
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
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1"
                :value="soundManager.getVolume()"
                @input="e => soundManager.setVolume(parseFloat(e.target.value))"
                :disabled="!soundManager.isEnabled()"
                class="volume-slider"
              />
              <button 
                class="preview-button"
                @click="previewTypingSound"
                :disabled="!soundManager.isEnabled()"
              >
                <span class="material-icons">play_circle</span>
                {{ t('settings.sound.preview') }}
              </button>
            </div>
          </div>

          <div class="setting-item">
            <label class="setting-label">{{ t('settings.sound.typingSoundType') }}</label>
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
            </div>
          </div>
        </div>

        <!-- 匹配按钮（狙击镜）音效设置 -->
        <div class="setting-group">
          <h3>{{ t('settings.sound.scopeTitle') }}</h3>
          
          <!-- 聚焦音效设置 -->
          <div class="setting-item">
            <label class="setting-label">
              <span class="material-icons">center_focus_strong</span>
              {{ t('settings.sound.scopeHoverSound') }}
            </label>
            <div class="setting-controls">
              <label class="switch">
                <input 
                  type="checkbox"
                  :checked="scopeHoverSound.enabled"
                  @change="e => updateScopeHoverSound('enabled', e.target.checked)"
                />
                <span class="slider"></span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1"
                :value="scopeHoverSound.volume"
                @input="e => updateScopeHoverSound('volume', parseFloat(e.target.value))"
                :disabled="!scopeHoverSound.enabled"
                class="volume-slider"
              />
              <button 
                class="preview-button"
                @click="previewScopeHoverSound"
                :disabled="!scopeHoverSound.enabled"
              >
                <span class="material-icons">play_circle</span>
                {{ t('settings.sound.preview') }}
              </button>
            </div>
          </div>

          <!-- 点击音效设置 -->
          <div class="setting-item">
            <label class="setting-label">
              <span class="material-icons">gps_fixed</span>
              {{ t('settings.sound.scopeClickSound') }}
            </label>
            <div class="setting-controls">
              <label class="switch">
                <input 
                  type="checkbox"
                  :checked="scopeClickSound.enabled"
                  @change="e => updateScopeClickSound('enabled', e.target.checked)"
                />
                <span class="slider"></span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1"
                :value="scopeClickSound.volume"
                @input="e => updateScopeClickSound('volume', parseFloat(e.target.value))"
                :disabled="!scopeClickSound.enabled"
                class="volume-slider"
              />
              <button 
                class="preview-button"
                @click="previewScopeClickSound"
                :disabled="!scopeClickSound.enabled"
              >
                <span class="material-icons">play_circle</span>
                {{ t('settings.sound.preview') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 语言设置面板 -->
      <div v-if="activeTab === 'language'" class="settings-panel">
        <h2>{{ t('settings.language.title') }}</h2>
        <div class="setting-group">
          <div class="setting-item">
            <label class="setting-label">
              <span class="material-icons">language</span>
              {{ t('settings.language.interfaceLanguage') }}
            </label>
            <div class="setting-controls">
              <select 
                :value="locale"
                @change="e => switchLanguage(e.target.value)"
              >
                <option value="zh">{{ t('settings.language.chinese') }}</option>
                <option value="en">{{ t('settings.language.english') }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>
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
  margin-bottom: 20px;
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

.setting-group h3 {
  color: #666;
  margin-bottom: 15px;
  font-size: 1.1rem;
}

.volume-slider {
  width: 100px;
  margin: 0 10px;
}
</style>