<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import soundManager from '@/utils/SoundManager'
import CustomSelect from '../components/CustomSelect.vue'
import { SOUND_ASSETS } from '@/config/soundAssets'
import { LANGUAGE_ASSETS } from '@/config/languageAssets'
import { setLocale } from '@/i18n'

const { locale, t } = useI18n()

// 动态生成语言选项
const languageOptions = computed(() => 
  Object.values(LANGUAGE_ASSETS).map(lang => ({
    value: lang.id,
    label: lang.name,
    icon: lang.icon
  }))
)

// 动态生成音效选项
const soundOptions = computed(() => 
  Object.values(SOUND_ASSETS).map(sound => ({
    value: sound.id,
    label: sound.name,
    icon: 'music_note'
  }))
)

// 匹配按钮（狙击镜）音效设置
const scopeHoverSound = ref({
  enabled: localStorage.getItem('scopeHoverSound.enabled') !== 'false',
  volume: Number(localStorage.getItem('scopeHoverSound.volume')) || 0.5
})

const scopeClickSound = ref({
  enabled: localStorage.getItem('scopeClickSound.enabled') !== 'false',
  volume: Number(localStorage.getItem('scopeClickSound.volume')) || 0.5
})

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

// 添加预览泡泡破裂音效的方法
const previewBurstSound = () => {
  soundManager.playBurstSound()
}
</script>

<template>
  <div class="settings-container">
    <div class="settings-content">
      <div class="settings-panel">
        <h2>{{ t('settings.title') }}</h2>

        <!-- 语言设置部分 -->
        <div class="setting-group">
          <h3>{{ t('settings.language.title') }}</h3>
          <div class="setting-item">
            <label class="setting-label">
              <span class="material-icons">language</span>
              {{ t('settings.language.interfaceLanguage') }}
            </label>
            <div class="setting-controls">
              <CustomSelect
              v-model="locale"
              :options="languageOptions"
              @change="switchLanguage"
            />
            </div>
          </div>
        </div>

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
              <CustomSelect
                :value="soundManager.getCurrentSound()"
                :options="soundOptions"
                :disabled="!soundManager.isEnabled()"
                @change="soundManager.changeSound"
              />
            </div>
          </div>
        </div>

        <!-- 匹配按钮音效设置 -->
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

        <!-- 在打字音效设置后添加 -->
        <div class="setting-group">
          <h3>{{ t('settings.sound.burstSound') }}</h3>
          <div class="setting-item">
            <label class="setting-label">
              <span class="material-icons">bubble_chart</span>
              {{ t('settings.sound.bubbleBurst') }}
            </label>
            <div class="setting-controls">
              <label class="switch">
                <input 
                  type="checkbox"
                  :checked="soundManager.getBurstSound().enabled"
                  @change="e => soundManager.updateBurstSound('enabled', e.target.checked)"
                />
                <span class="slider"></span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1"
                :value="soundManager.getBurstSound().volume"
                @input="e => soundManager.updateBurstSound('volume', parseFloat(e.target.value))"
                :disabled="!soundManager.getBurstSound().enabled"
                class="volume-slider"
              />
              <button 
                class="preview-button"
                @click="previewBurstSound"
                :disabled="!soundManager.getBurstSound().enabled"
              >
                <span class="material-icons">play_circle</span>
                {{ t('settings.sound.preview') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.settings-layout {
  display: flex;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  background: var(--secondary-dark);
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.settings-sidebar {
  width: 250px;
  background: var(--accent-dark);
  padding: 1.5rem 0;
}

.tab-item {
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.tab-item:hover {
  background: var(--primary-dark);
  color: var(--text-primary);
}

.tab-item.active {
  background: var(--primary-dark);
  color: var(--accent-color);
  border-left-color: var(--accent-color);
}

.settings-content {
  flex: 1;
  padding: 2rem;
}

.settings-panel {
  background: var(--secondary-dark);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: var(--shadow-md);
}

.settings-panel h2 {
  color: var(--text-primary);
  margin-bottom: 2rem;
  font-size: 1.8rem;
  font-weight: 600;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.setting-group {
  background: var(--primary-dark);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

.setting-group h3 {
  color: var(--accent-color);
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
  font-weight: 500;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--border-color);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-primary);
}

.setting-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
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
  background-color: var(--accent-dark);
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
  background-color: var(--accent-color);
}

input:checked + .slider:before {
  transform: translateX(26px);
}

/* 下拉框样式 */
select {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--secondary-dark);
  color: var(--text-primary);
  min-width: 150px;
  cursor: pointer;
}

select:disabled {
  background: var(--accent-dark);
  cursor: not-allowed;
  opacity: 0.7;
}

/* 预览按钮样式 */
.preview-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--secondary-dark);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.preview-button:hover:not(:disabled) {
  background: var(--accent-dark);
  border-color: var(--accent-color);
}

.preview-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--accent-dark);
}

.preview-button .material-icons {
  font-size: 18px;
  color: var(--accent-color);
}

/* 音量滑块样式 */
.volume-slider {
  width: 120px;
  height: 4px;
  -webkit-appearance: none;
  background: var(--accent-dark);
  border-radius: 2px;
  outline: none;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent-color);
  cursor: pointer;
  transition: all 0.3s ease;
}

.volume-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  background: var(--accent-hover);
}

</style>