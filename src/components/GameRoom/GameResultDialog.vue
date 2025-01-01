<template>
  <div v-if="visible" class="result-dialog-overlay" @click.self="handleClose">
    <div class="result-dialog" :class="{ 'show': visible }">
      <!-- Header with match result -->
      <div class="result-header" :class="{ 'win': isWinner, 'lose': !isWinner }">
        <h2 class="result-title">{{ isWinner ? '胜利！' : '失败！' }}</h2>
      </div>

      <!-- Players comparison section -->
      <div class="players-comparison">
        <!-- Player 1 -->
        <div class="player-stats" :class="{ 'winner': match.winner.id === match.player1.id }">
          <div class="player-info">
            <img :src="match.player1.imgSrc" :alt="match.player1.username" class="player-avatar">
            <div class="player-details">
              <span class="player-name">{{ match.player1.username }}</span>
              <span class="player-level">{{ match.player1.playerProfile.userLevel }}</span>
            </div>
          </div>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">WPM</span>
              <span class="stat-value">{{ match.player1Wpm }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">准确率</span>
              <span class="stat-value">{{ match.player1Accuracy }}%</span>
            </div>
          </div>
        </div>

        <!-- VS Divider -->
        <div class="vs-divider">VS</div>

        <!-- Player 2 -->
        <div class="player-stats" :class="{ 'winner': match.winner.id === match.player2.id }">
          <div class="player-info">
            <img :src="match.player2.imgSrc" :alt="match.player2.username" class="player-avatar">
            <div class="player-details">
              <span class="player-name">{{ match.player2.username }}</span>
              <span class="player-level">{{ match.player2.playerProfile.userLevel }}</span>
            </div>
          </div>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">WPM</span>
              <span class="stat-value">{{ match.player2Wpm }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">准确率</span>
              <span class="stat-value">{{ match.player2Accuracy }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- score changes -->
      <div class="score-changes">
        <div class="score-change" :class="{ 'positive': scoreChange > 0, 'negative': scoreChange < 0 }">
          <span class="old-score">{{ oldScore }}</span>
          <span class="change-arrow">
            <i class="fas" :class="scoreChange > 0 ? 'fa-arrow-up' : 'fa-arrow-down'"></i>
            {{ Math.abs(scoreChange) }}
          </span>
          <span class="new-score">{{ oldScore + scoreChange }}</span>
        </div>
      </div>

      <!-- Match details -->
      <div class="match-details">
        <div class="detail-item">
          <i class="fas fa-language"></i>
          <span>{{ match.language }}</span>
        </div>
        <div class="detail-item">
          <i class="fas fa-gamepad"></i>
          <span>{{ match.category }}</span>
        </div>
        <div class="detail-item">
          <i class="fas fa-signal"></i>
          <span>{{ match.difficulty }}</span>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="action-buttons">
        <button class="btn rematch-btn" @click="handleRematch">
          <i class="fas fa-redo"></i>
          重新比赛
        </button>
        <button class="btn leave-btn" @click="handleLeaveRoom">
          <i class="fas fa-door-open"></i>
          离开房间
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  match: {
    type: Object,
    required: true
  },
  oldScore: {
    type: Number,
    required: true
  },
  scoreChange: {
    type: Number,
    required: true
  },
})

const emit = defineEmits(['close', 'rematch', 'leaveRoom'])

// 计算当前玩家是否获胜
const isWinner = computed(() => {
  const currentPlayerId = parseInt(localStorage.getItem('userId'))
  return props.match.winner.id === currentPlayerId
})

// 处理重新比赛
const handleRematch = () => {
  emit('rematch')
}

// 处理离开房间
const handleLeaveRoom = () => {
  emit('leaveRoom')
}

// 处理关闭弹窗
const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.result-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.result-dialog {
  background: var(--primary-dark);
  border-radius: 16px;
  padding: 2rem;
  width: 90%;
  max-width: 800px;
  border: 1px solid var(--border-color);
  transform: translateY(20px);
  opacity: 0;
  transition: all 0.3s ease;
}

.result-dialog.show {
  transform: translateY(0);
  opacity: 1;
}

.result-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 1rem;
  border-radius: 8px;
}

.result-header.win {
  background: linear-gradient(135deg, #4f46e5, #3b82f6);
}

.result-header.lose {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.result-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.players-comparison {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 2rem;
}

.player-stats {
  flex: 1;
  padding: 1.5rem;
  border-radius: 12px;
  background: var(--secondary-dark);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.player-stats.winner {
  border-color: #4f46e5;
  box-shadow: 0 0 20px rgba(79, 70, 229, 0.2);
}

.player-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.player-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2px solid var(--accent-color);
}

.player-details {
  display: flex;
  flex-direction: column;
}

.player-name {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--text-primary);
}

.player-level {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  background: var(--primary-dark);
  border-radius: 8px;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-primary);
}

.vs-divider {
  font-size: 2rem;
  font-weight: bold;
  color: var(--accent-color);
}

.match-details {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.rematch-btn {
  background: var(--accent-color);
  color: white;
  border: none;
}

.rematch-btn:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
}

.leave-btn {
  background: transparent;
  border: 1px solid var(--danger-color);
  color: var(--danger-color);
}

.leave-btn:hover {
  background: var(--danger-color);
  color: white;
  transform: translateY(-2px);
}

@keyframes slideIn {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .players-comparison {
    flex-direction: column;
  }

  .vs-divider {
    transform: rotate(90deg);
  }

  .match-details {
    flex-direction: column;
    align-items: center;
  }
}

.score-changes {
  text-align: center;
  margin: 1.5rem 0;
  padding: 1rem;
  background: var(--secondary-dark);
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.score-change {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 1.2rem;
}

.old-score {
  color: var(--text-secondary);
}

.change-arrow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
}

.change-arrow.positive {
  color: #10b981; /* 绿色 */
}

.change-arrow.negative {
  color: #ef4444; /* 红色 */
}

.new-score {
  font-weight: bold;
  color: var(--text-primary);
}

/* 添加积分变化动画 */
@keyframes scoreChange {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.score-change {
  animation: scoreChange 0.5s ease-out;
}
</style>