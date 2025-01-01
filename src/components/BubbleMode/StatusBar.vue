<template>
  <div class="status-bar">
    <div class="status-item">
      <div class="status-icon">
        <i class="fas fa-heart"></i>
      </div>
      <div class="health-system">
        <div class="health-bar">
          <div
            class="health-fill"
            :style="{ width: `${(health / maxHealth) * 100}%` }"
            :class="{ damage: isDamaged }"
          ></div>
          <span class="health-text">{{ health }}/{{ maxHealth }}</span>
        </div>
        <div class="hearts-container">
          <div
            v-for="i in maxHealth"
            :key="i"
            class="heart-icon"
            :class="{
              empty: i > health,
              damaged: i === health && isDamaged,
            }"
          ></div>
        </div>
      </div>
    </div>

    <div class="status-item">
      <div class="status-icon">
        <i class="fas fa-star"></i>
      </div>
      <div class="score-display">
        <span class="score-number" :class="{ 'score-up': scoreAnimating }">
          {{ score }}
        </span>
        <span class="combo-tag" v-if="combo > 1"> x{{ combo }} </span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  maxHealth: {
    type: Number,
    required: true,
  },
  health: {
    type: Number,
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  combo: {
    type: Number,
    required: true,
  },
  isDamaged: {
    type: Boolean,
    default: false,
  },
  scoreAnimating: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 2rem;
  margin-bottom: 1rem;
  background: rgba(26, 32, 44, 0.4);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(79, 140, 255, 0.2);
  border-radius: 8px;
  color: #4f8cff;
}

.status-icon i {
  font-size: 1.2rem;
}

.health-system {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.health-bar {
  position: relative;
  width: 200px;
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
}

.health-fill {
  height: 100%;
  background: linear-gradient(90deg, #4f8cff, #73a4ff);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.health-fill.damage {
  animation: damage-flash 0.3s ease;
}

.health-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.8rem;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
}

.hearts-container {
  display: flex;
  gap: 0.3rem;
  padding: 0.2rem 0;
}

.heart-icon {
  font-size: 1.2rem;
  transition: all 0.3s ease;
}

.heart-icon::before {
  content: "❤️";
  font-style: normal;
}

.heart-icon.empty::before {
  content: "🖤";
}

.heart-icon.damaged {
  animation: heart-damage 0.3s ease;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.score-number {
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 0 10px rgba(79, 140, 255, 0.5);
  transition: transform 0.3s ease;
}

.score-number.score-up {
  animation: score-pop 0.3s ease;
}

.combo-tag {
  padding: 0.2rem 0.5rem;
  background: rgba(79, 140, 255, 0.2);
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #4f8cff;
}

@keyframes damage-flash {
  0% {
    background: #ff4f4f;
  }
  100% {
    background: linear-gradient(90deg, #4f8cff, #73a4ff);
  }
}

@keyframes heart-damage {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes score-pop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style>
