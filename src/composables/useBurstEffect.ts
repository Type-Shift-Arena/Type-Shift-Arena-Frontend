import { ref } from "vue";

interface BurstParticle {
  x: number;
  y: number;
  radius: number;
  color: string;
  velocity: {
    x: number;
    y: number;
  };
  opacity: number;
  rotation: number;
}

interface BurstConfig {
  minParticles?: number;
  maxParticles?: number;
  minSpeed?: number;
  maxSpeed?: number;
  minRadius?: number;
  maxRadius?: number;
  gravity?: number;
  fadeSpeed?: number;
  rotationSpeed?: number;
  duration?: number;
}

export function useBurstEffect(defaultConfig: BurstConfig = {}) {
  const particles = ref<BurstParticle[]>([]);
  let animationFrame: number | null = null;

  const defaultSettings = {
    minParticles: 12,
    maxParticles: 20,
    minSpeed: 4,
    maxSpeed: 7,
    minRadius: 2,
    maxRadius: 6,
    gravity: 0.08,
    fadeSpeed: 0.008,
    rotationSpeed: 3,
    duration: 800,
    ...defaultConfig,
  };

  const createBurstParticles = (color: string) => {
    const particleCount =
      defaultSettings.minParticles +
      Math.floor(
        Math.random() *
          (defaultSettings.maxParticles - defaultSettings.minParticles)
      );

    const adjustedFadeSpeed = 1 / (defaultSettings.duration / 16.67);

    const newParticles: BurstParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed =
        defaultSettings.minSpeed +
        Math.random() * (defaultSettings.maxSpeed - defaultSettings.minSpeed);

      newParticles.push({
        x: 0,
        y: 0,
        radius:
          defaultSettings.minRadius +
          Math.random() *
            (defaultSettings.maxRadius - defaultSettings.minRadius),
        color,
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        opacity: 1,
        rotation: Math.random() * 360,
      });
    }

    return newParticles;
  };

  const animateParticles = () => {
    if (particles.value.length === 0) {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      return;
    }
    // 过滤掉不透明度小于等于0的粒子，并更新剩余粒子的位置、速度、不透明度和旋转角度
    particles.value = particles.value.filter((particle) => {
      // 更新粒子的x坐标
      particle.x += particle.velocity.x;
      // 更新粒子的y坐标
      particle.y += particle.velocity.y;
      // 更新粒子的不透明度
      particle.opacity -= defaultSettings.fadeSpeed;
      // 更新粒子的y方向速度，模拟重力效果
      particle.velocity.y += defaultSettings.gravity;
      // 更新粒子的旋转角度
      particle.rotation += defaultSettings.rotationSpeed;
      // 对粒子的x方向速度进行衰减，模拟空气阻力
      particle.velocity.x *= 0.99;
      // 返回不透明度大于0的粒子
      return particle.opacity > 0;
    });

    // 请求下一帧动画，继续更新粒子状态
    animationFrame = requestAnimationFrame(animateParticles);
  };

  /**
   * 触发粒子爆发效果
   * @param color - 粒子的颜色
   */
  const burst = (color: string) => {
    // 清理之前的动画
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }

    // 创建新的粒子数组
    particles.value = createBurstParticles(color);
    // 请求下一帧动画，开始更新粒子状态
    animationFrame = requestAnimationFrame(animateParticles);
  };

  /**
   * 清除所有粒子
   */
  const clear = () => {
    // 清空粒子数组
    particles.value = [];
    // 取消当前动画帧
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }

  };

  return {
    particles,
    burst,
    clear,
  };
}
