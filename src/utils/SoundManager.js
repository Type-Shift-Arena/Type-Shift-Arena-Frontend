/*
 * @Author: hiddenSharp429 z404878860@163.com
 * @Date: 2024-11-03 03:11:43
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2025-01-01 20:53:52
 */
import { SOUND_ASSETS } from '@/config/soundAssets'

class SoundManager {
   // 构造函数
    constructor() {
      this.enabled = localStorage.getItem('typeSound') !== 'false';
      this.currentSound = localStorage.getItem('typeSoundType') || 'mechanical';
      this.volume = Number(localStorage.getItem('typeSoundVolume')) || 0.5;
      this.sounds = {};
      this.loading = true;

      // 初始化音效
      this.initSounds();

      // 添加泡泡破裂音效设置
      this.burstSound = {
        enabled: localStorage.getItem('burstSound.enabled') !== 'false',
        volume: Number(localStorage.getItem('burstSound.volume')) || 0.5
      }
    }
  
    // 初始化音效
    async initSounds() {
      try {
        // 创建音频对象并按ID存储
        this.sounds = {};
        for (const [key, asset] of Object.entries(SOUND_ASSETS)) {
          this.sounds[key] = new Audio(asset.path);
        }

        // 预加载音效
        await Promise.all(
          Object.values(this.sounds).map(sound => 
            sound.load()
          )
        );

        this.loading = false;
      } catch (error) {
        console.error('Failed to load sounds:', error);
        this.loading = false;
      }
    }
    
    // 播放音效
    playTypeSound() {
      if (!this.enabled || this.loading) return;
      
      const sound = this.sounds[this.currentSound];
      if (sound) {
        // 克隆音频节点以支持快速连续播放
        const clone = sound.cloneNode();
        clone.volume = this.volume;
        clone.play().catch(err => console.error('Error playing sound:', err));
      }
    }
  
    // 切换音效开关
    toggleSound() {
      this.enabled = !this.enabled;
      localStorage.setItem('typeSound', this.enabled);
    }
    
    // 切换音效类型
    changeSound(type) {
      if (this.sounds[type]) {
        this.currentSound = type;
        localStorage.setItem('typeSoundType', type);
      }
    }

    // 设置音量
    setVolume(volume) {
      this.volume = volume;
      localStorage.setItem('typeSoundVolume', volume);
    }

    // 获取音量
    getVolume() {
      return this.volume;
    }
  
    // 检查音效开关
    isEnabled() {
      return this.enabled;
    }
    
    // 获取当前音效
    getCurrentSound() {
      return this.currentSound;
    }
    
    // 检查音效是否加载
    isLoading() {
      return this.loading;
    }

    // 播放泡泡破裂音效
    playBurstSound() {
      if (!this.burstSound.enabled) return
      
      const burstAudio = new Audio(SOUND_ASSETS.bubble.path)
      burstAudio.volume = this.burstSound.volume
      burstAudio.play().catch(err => console.error('Error playing burst sound:', err))
    }

    // 更新泡泡破裂音效设置
    updateBurstSound(key, value) {
      this.burstSound[key] = value
      localStorage.setItem(`burstSound.${key}`, value.toString())
    }

    // 获取泡泡破裂音效设置
    getBurstSound() {
      return this.burstSound
    }
}
  
export default new SoundManager();