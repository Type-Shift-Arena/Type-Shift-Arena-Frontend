import { ref } from 'vue'

interface AnimationParticle {
  x: number
  y: number
  absoluteX: number
  absoluteY: number
  radius: number
  color: string
  velocity: {
    x: number
    y: number
  }
  opacity: number
  rotation: number
  createdAt: number
}

interface AnimationConfig {
  minParticles?: number
  maxParticles?: number
  minSpeed?: number
  maxSpeed?: number
  minRadius?: number
  maxRadius?: number
  gravity?: number
  fadeSpeed?: number
  rotationSpeed?: number
  duration?: number
}

/**
 * 管理动画粒子的类。
 * 该类负责创建、更新和渲染动画粒子。
 */
class AnimationManager {
  private static instance: AnimationManager
  private particles = ref<AnimationParticle[]>([])
  private animationFrame: number | null = null

  /**
   * 创建一个新的 AnimationManager 实例。
   * 该实例将立即开始动画循环。
   */
  private constructor() {
    this.animate()
  }

  /**
   * 获取 AnimationManager 的单例实例。
   * @returns AnimationManager 的单例实例。
   */
  public static getInstance(): AnimationManager {
    if (!AnimationManager.instance) {
      AnimationManager.instance = new AnimationManager()
    }
    return AnimationManager.instance
  }

  /**
   * 在指定位置创建一个粒子爆发效果。
   * @param x - 爆发的 x 坐标。
   * @param y - 爆发的 y 坐标。
   * @param color - 粒子的颜色。
   * @param config - 粒子的配置选项。
   */
  public createBurst(x: number, y: number, color: string, config: AnimationConfig) {
    const settings = {
      minParticles: 15,
      maxParticles: 25,
      minSpeed: 5,
      maxSpeed: 8,
      minRadius: 2,
      maxRadius: 5,
      gravity: 0.08,
      fadeSpeed: 0.008,
      rotationSpeed: 3,
      duration: 1500,
      ...config
    }

    const particleCount = settings.minParticles + 
      Math.floor(Math.random() * (settings.maxParticles - settings.minParticles))
    
    const now = Date.now()
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount
      const speed = settings.minSpeed + Math.random() * (settings.maxSpeed - settings.minSpeed)
      
      this.particles.value.push({
        x: 0,
        y: 0,
        absoluteX: x,
        absoluteY: y,
        radius: settings.minRadius + Math.random() * (settings.maxRadius - settings.minRadius),
        color,
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        },
        opacity: 1,
        rotation: Math.random() * 360,
        createdAt: now
      })
    }
  }

  /**
   * 动画循环函数，更新和渲染粒子。
   * 该函数在每个动画帧中被调用。
   */
  private animate = () => {
    const now = Date.now()
    
    this.particles.value = this.particles.value.filter(particle => {
      const age = now - particle.createdAt
      if (age > 1500) return false // 1.5秒后移除粒子
      
      particle.x += particle.velocity.x
      particle.y += particle.velocity.y
      particle.opacity -= 0.008
      particle.velocity.y += 0.08
      particle.rotation += 3
      particle.velocity.x *= 0.99
      
      return particle.opacity > 0
    })
    
    this.animationFrame = requestAnimationFrame(this.animate)
  }

  /**
   * 获取当前的粒子数组。
   * @returns 包含所有粒子的 ref 对象。
   */
  public getParticles() {
    return this.particles
  }
}

/**
 * 创建并返回 AnimationManager 的单例实例。
 * @returns AnimationManager 的单例实例。
 */
export const useAnimationManager = () => {
  return AnimationManager.getInstance()
} 