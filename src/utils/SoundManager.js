/*
 * @Author: hiddenSharp429 z404878860@163.com
 * @Date: 2024-11-03 03:11:43
 * @LastEditors: hiddenSharp429 z404878860@163.com
 * @LastEditTime: 2024-11-03 12:30:41
 */
import { SOUND_ASSETS } from '@/config/soundAssets'

class SoundManager {
   // 构造函数
    constructor() {
      this.enabled = localStorage.getItem('typeSound') !== 'false';
      this.currentSound = localStorage.getItem('typeSoundType') || 'mechanical';
      this.sounds = {};
      this.loading = true;

      // 初始化音效
      this.initSounds();
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
        clone.volume = 0.5; // 设置适中的音量
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
}
  
export default new SoundManager();