<template>
  <div class="room-card" :class="{ 'room-full': room.playersCount >= 2 }">
    <!-- 房间头部信息 -->
    <div class="room-header">
      <span class="room-id">房间号: {{ room.roomId }}</span>
      <span class="room-status" :class="room.status">
        {{ room.status === 'waiting' ? '等待中' : '游戏中' }}
      </span>
    </div>
    
    <!-- 玩家信息区域 -->
    <div class="players-container">
      <!-- 左侧玩家（房主） -->
      <div class="player-info" v-if="room.players?.[0]">
        <div class="player-avatar">
          <img :src="room.players[0].avatar" :alt="room.players[0].name">
          <span class="host-badge" v-if="room.players[0].id === room.hostId">房主</span>
        </div>
        <div class="player-details">
          <span class="player-name">{{ room.players[0].name }}</span>
          <span class="player-level">{{ room.players[0].level }}</span>
        </div>
      </div>
      <div class="player-info empty" v-else>
        <div class="waiting-avatar">
          <i class="fas fa-user-plus"></i>
        </div>
        <span>等待玩家加入...</span>
      </div>

      <!-- VS 分隔符 -->
      <div class="vs-divider">
        <span>VS</span>
      </div>

      <!-- 右侧玩家（如果有） -->
      <div class="player-info" v-if="room.players?.[1]">
        <div class="player-details text-right">
          <span class="player-name">{{ room.players[1].name }}</span>
          <span class="player-level">{{ room.players[1].level }}</span>
        </div>
        <div class="player-avatar">
          <img :src="room.players[1].avatar" :alt="room.players[1].name">
        </div>
      </div>
      
      <!-- 等待玩家加入提示 -->
      <div class="waiting-player" v-else>
        <div class="waiting-avatar">
          <i class="fas fa-user-plus"></i>
        </div>
        <span>等待加入...</span>
      </div>
    </div>
    
    <!-- 房间信息 -->
    <div class="room-info">
      <div class="info-item">
        <i class="fas fa-users"></i>
        <span>{{ room.playersCount }}/2</span>
      </div>
      <div class="info-item">
        <i class="fas fa-language"></i>
        <span>{{ getLanguageLabel(room.language) }}</span>
      </div>
      <div class="info-item">
        <i class="fas fa-gamepad"></i>
        <span>{{ getCategoryLabel(room.category) }}</span>
      </div>
      <div class="info-item">
        <i class="fas fa-signal"></i>
        <span>{{ getDifficultyLabel(room.difficulty) }}</span>
      </div>
    </div>

    <!-- 加入按钮 -->
    <div class="room-actions">
      <button 
        class="join-btn" 
        :disabled="room.playersCount >= 2"
        @click="$emit('join', room.roomId)"
      >
        {{ room.playersCount >= 2 ? '房间已满' : '加入房间' }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  room: {
    type: Object,
    required: true
  }
})

defineEmits(['join'])

// 标签转换函数
const getLanguageLabel = (language) => {
  const labels = {
    'CHINESE': '中文',
    'ENGLISH': '英文'
  }
  return labels[language] || language
}

const getCategoryLabel = (category) => {
  const labels = {
    'DAILY_CHAT': '日常对话',
    'PROGRAMMING': '编程',
    'BUSINESS': '商务会话',
    'LITERATURE': '文学作品'
  }
  return labels[category] || category
}

const getDifficultyLabel = (difficulty) => {
  const labels = {
    'EASY': '简单',
    'MEDIUM': '中等',
    'HARD': '困难'
  }
  return labels[difficulty] || difficulty
}
</script>

<style scoped>
.room-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e4e4e4;
}

.room-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border-color: rgba(79, 70, 229, 0.4);
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.room-status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.room-status.waiting {
  background: #4f46e5;
  color: white;
}

.room-status.playing {
  background: #eab308;
  color: white;
}

.players-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 1rem 0;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.player-info.empty {
  color: #909399;
  justify-content: center;
}

.player-avatar {
  position: relative;
}

.player-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #42b983;
}

.host-badge {
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  background: #f56c6c;
  color: white;
  font-size: 0.7rem;
  padding: 1px 4px;
  border-radius: 4px;
  white-space: nowrap;
}

.player-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.player-name {
  font-weight: 600;
  color: #e4e4e4;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-level {
  font-size: 0.8rem;
  color: #9ca3af;
}

.vs-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  margin: 0 0.5rem;
}

.vs-divider span {
  font-weight: bold;
  color: #909399;
  font-size: 1rem;
}

.waiting-player {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #909399;
}

.waiting-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #dcdfe6;
}

.waiting-avatar i {
  font-size: 1.5rem;
  color: #dcdfe6;
}

.room-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin: 0.75rem 0;
  font-size: 0.9rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #9ca3af;
}

.info-item i {
  font-size: 0.9rem;
}

.room-actions {
  display: flex;
  justify-content: center;
}

.join-btn {
  width: 100%;
  padding: 0.4rem;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
  font-size: 0.9rem;
}

.join-btn:hover:not(:disabled) {
  background: #4338ca;
}

.join-btn:disabled {
  background: #374151;
  color: #6b7280;
}

.text-right {
  text-align: right;
}

@media (max-width: 1280px) {
  .player-name {
    max-width: 80px;
  }
}
</style>
