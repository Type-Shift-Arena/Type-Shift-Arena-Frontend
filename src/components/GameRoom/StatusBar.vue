<script setup>
defineProps({
  myStats: {
    type: Object,
    required: true,
    // 包含 username, wpm, accuracy, errorCount
  },
  opponentStats: {
    type: Object,
    required: true,
    // 包含 playerName, wpm, accuracy, errorCount, progress
  },
  players: {
    type: Array,
    required: true
  },
  myInfo: {
    type: Object,
    required: false,
    default: () => ({})
  },
  opponentInfo: {
    type: Object,
    required: false,
    default: () => ({})
  }
})
</script>

<template>
  <div class="status-bar">
    <!-- 当前玩家状态 -->
    <div class="player-stats">
      <!-- 添加玩家头像和角色信息 -->
      <div class="player-header">
        <img 
          v-if="myInfo?.avatar" 
          :src="myInfo.avatar" 
          :alt="myStats.username" 
          class="player-avatar"
        >
        <div class="player-title">
          <h3>{{ myStats.username }}</h3>
          <span v-if="myInfo?.isHost" class="host-badge">房主</span>
        </div>
      </div>

      <div class="player-info">
        <div class="stats">
          <span>WPM: {{ myStats.wpm }}</span>
          <span>准确率: {{ myStats.accuracy }}%</span>
          <span>错误: {{ myStats.errorCount }}</span>
          <span>进度: {{ myStats.progress }}%</span>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress" :style="{ width: `${myStats.progress}%` }"></div>
      </div>
    </div>

    <!-- VS 标志 -->
    <div class="vs-container">
      <div class="vs-circle">
        <span>VS</span>
      </div>
    </div>

    <!-- 对手状态 -->
    <div class="player-stats opponent">
      <!-- 添加对手头像和信息 -->
      <div class="player-header">
        <img 
          v-if="opponentInfo?.avatar" 
          :src="opponentInfo.avatar" 
          :alt="opponentInfo.name" 
          class="player-avatar"
        >
        <div class="player-title">
          <h3>{{ opponentInfo?.name || '等待加入...' }}</h3>
          <span v-if="opponentInfo && !myInfo?.isHost" class="host-badge">房主</span>
        </div>
      </div>

      <div class="player-info" :class="{ 'skeleton': !opponentInfo }">
        <div class="stats">
          <template v-if="opponentInfo">
            <span>WPM: {{ opponentStats.wpm }}</span>
            <span>准确率: {{ opponentStats.accuracy }}%</span>
            <span>错误: {{ opponentStats.errorCount }}</span>
            <span>进度: {{ opponentStats.progress }}%</span>
          </template>
          <template v-else>
            <span>WPM: --</span>
            <span>准确率: --%</span>
            <span>错误: --</span>
            <span>进度: --%</span>
          </template>
        </div>
      </div>
      <div class="progress-bar" :class="{ 'skeleton': !opponentInfo }">
        <div class="progress" :style="{ width: `${opponentStats.progress}%` }"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 2rem;
  padding: 1rem;
  background: var(--primary-dark);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

.player-stats {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.player-info h3 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--text-primary);
}

.vs-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.vs-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--accent-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  font-weight: bold;
  font-size: 1.2rem;
  box-shadow: 0 2px 4px var(--shadow-color);
}

.progress-bar {
  height: 12px;
  background: var(--accent-dark);
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.progress {
  height: 100%;
  background: var(--accent-color);
  transition: width 0.3s ease;
}

.player-stats .stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  font-size: 0.9rem;
  color: #666;
}

.player-stats .stats span {
  background: var(--accent-dark);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  white-space: nowrap;
  transition: all 0.3s ease;
  animation: fadeIn 0.3s ease;
  color: var(--text-primary);
}

.opponent .stats span {
  background: var(--secondary-dark);
}

.opponent.player-stats {
  text-align: right;
}

.opponent .stats {
  justify-content: flex-end;
}

/* 骨架屏效果 */
.skeleton {
  position: relative;
  overflow: hidden;
}

.skeleton::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--skeleton-start) 0%,
    var(--skeleton-middle) 50%,
    var(--skeleton-end) 100%
  );
  animation: shimmer 1.5s infinite linear;
  background-size: 200% 100%;
}

.skeleton h3 {
  color: var(--skeleton-color) !important;
  background: var(--skeleton-background);
  border-radius: 4px;
}

.skeleton .progress-bar {
  background: var(--skeleton-background);
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 添加新的样式 */
.player-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.player-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid var(--accent-color);
}

.player-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.host-badge {
  background: var(--accent-color);
  color: var(--text-primary);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

/* 对手样式调整 */
.opponent .player-header {
  flex-direction: row-reverse;
}

.opponent .player-avatar {
  border-color: var(--secondary-color);
}
</style>
