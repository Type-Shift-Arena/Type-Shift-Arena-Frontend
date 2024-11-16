<script setup>
import { computed } from 'vue'

const props = defineProps({
  roomId: {
    type: String,
    required: true
  },
  connectionStatus: {
    type: String,
    required: true
  },
  connectionTime: {
    type: String,
    required: true
  },
  stompClient: {
    type: Object,
    default: null
  },
  players: {
    type: Array,
    required: true
  },
  playerId: {
    type: String,
    required: true
  },
  isHost: {
    type: Boolean,
    required: true
  },
  gameStatus: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['reconnect', 'checkConnection', 'sendTestMessage'])

// 添加 Mac 检测
const isMac = computed(() => {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0
})
</script>

<template>
  <div class="debug-panel">
    <div class="debug-info">
      <div class="debug-header">
        <h3>连接信息</h3>
        <div class="keyboard-shortcut">
          <span class="key">{{ isMac ? '⌘' : '⌃' }}</span>
          <span class="key">⇧</span>
          <span class="key">D</span>
        </div>
      </div>
      <p>状态: {{ connectionStatus }}</p>
      <p>房间ID: {{ roomId }}</p>
      <p>连接时间: {{ connectionTime }}</p>
      <p>玩家列表: {{ players.join(', ') }}</p>
      <p>当前玩家: {{ playerId }}</p>
      <p>是否房主: {{ isHost }}</p>
      <p>游戏状态: {{ gameStatus }}</p>
      <p>WebSocket状态: {{ stompClient?.connected ? '已连接' : '未连接' }}</p>
      <p>玩家列表详情:</p>
      <ul>
        <li v-for="(id, index) in players" :key="index">
          {{ index === 0 ? '房主: ' : '玩家: ' }}{{ id }}
          {{ id === String(playerId) ? '(你)' : '' }}
        </li>
      </ul>
      <p>当前玩家ID: {{ playerId }} (类型: {{ typeof playerId }})</p>
      <p>房主ID: {{ players[0] }} (类型: {{ typeof players[0] }})</p>
    </div>
    <div class="connection-status" :class="connectionStatus">
      {{ connectionStatus }}
    </div>
    <div class="debug-controls">
      <button @click="emit('reconnect')">重新连接</button>
      <button @click="emit('checkConnection')">检查连接</button>
      <button @click="emit('sendTestMessage')">发送测试消息</button>
    </div>
  </div>
</template>

<style scoped>
.debug-panel {
  position: absolute;
  top: 10rem;
  right: 1rem;
  background: rgba(44, 62, 80, 0.9);
  color: white;
  padding: 1rem;
  border-radius: 8px;
  max-width: 300px;
  z-index: 1000;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.debug-info {
  margin-bottom: 1rem;
}

.debug-info h3 {
  margin: 0 0 0.5rem 0;
  color: #42b983;
}

.debug-info p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
  font-family: monospace;
}

.debug-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.debug-controls button {
  background: #42b983;
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.debug-controls button:hover {
  background: #3aa876;
}

.connection-status {
  padding: 0.5rem;
  margin: 0.5rem 0;
  border-radius: 4px;
  text-align: center;
  font-weight: bold;
}

.connection-status.已连接 {
  background: #42b983;
}

.connection-status.正在连接 {
  background: #e6a23c;
}

.connection-status.连接错误,
.connection-status.已断开 {
  background: #f56c6c;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.keyboard-shortcut {
  display: flex;
  gap: 2px;
  font-size: 12px;
}

.keyboard-shortcut .key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  font-family: system-ui, -apple-system, sans-serif;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
}
</style>
