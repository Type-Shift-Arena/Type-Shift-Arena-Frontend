<template>
    <div class="match-card" :class="{ 'win': isWinner, 'lose': !isWinner }">
        <!-- 对局结果标签 -->
        <div class="result-badge" :class="{ 'win': isWinner, 'lose': !isWinner }">
            {{ isWinner ? '胜利' : '失败' }}
        </div>

        <!-- 比赛基本信息 -->
        <div class="match-header">
            <div class="match-type">
                <span class="category">{{ getCategoryLabel(match.category) }}</span>
                <span class="difficulty">{{ getDifficultyLabel(match.difficulty) }}</span>
                <span class="language">{{ getLanguageLabel(match.language) }}</span>
            </div>
            <div class="match-time">
                {{ formatMatchTime(match.startTime) }}
            </div>
        </div>

        <!-- 玩家对战信息 -->
        <div class="players-container">
            <!-- 当前用户 -->
            <div class="player" :class="{ 'winner': isWinner }">
                <div class="player-info">
                    <img :src="currentPlayer.imgSrc" :alt="currentPlayer.username" class="avatar">
                    <div class="player-details">
                        <span class="username">{{ currentPlayer.username }}</span>
                        <span class="level">{{ currentPlayer.playerProfile.userLevel }}</span>
                    </div>
                </div>
                <div class="stats">
                    <div class="stat">
                        <span class="label">WPM</span>
                        <span class="value">{{ currentPlayerStats.wpm }}</span>
                    </div>
                    <div class="stat">
                        <span class="label">准确率</span>
                        <span class="value">{{ currentPlayerStats.accuracy }}%</span>
                    </div>
                </div>
            </div>

            <!-- VS分隔符 -->
            <div class="vs-divider">VS</div>

            <!-- 对手 -->
            <div class="player" :class="{ 'winner': !isWinner }">
                <div class="player-info">
                    <img :src="opponentPlayer.imgSrc" :alt="opponentPlayer.username" class="avatar">
                    <div class="player-details">
                        <span class="username">{{ opponentPlayer.username }}</span>
                        <span class="level">{{ opponentPlayer.playerProfile.userLevel }}</span>
                    </div>
                </div>
                <div class="stats">
                    <div class="stat">
                        <span class="label">WPM</span>
                        <span class="value">{{ opponentPlayerStats.wpm }}</span>
                    </div>
                    <div class="stat">
                        <span class="label">准确率</span>
                        <span class="value">{{ opponentPlayerStats.accuracy }}%</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
  
<script setup>
import { computed } from 'vue';
import { getLanguageLabel, getCategoryLabel, getDifficultyLabel } from '@/utils/labelUtils'

const props = defineProps({
    match: {
        type: Object,
        required: true
    }
});

const currentUserId = parseInt(localStorage.getItem('userId'));

// 判断当前用户是否是胜者
const isWinner = computed(() => {
    return props.match.winner.id === currentUserId;
});

// 确定当前用户和对手的信息
const currentPlayer = computed(() => {
    return currentUserId === props.match.player1.id ? props.match.player1 : props.match.player2;
});

const opponentPlayer = computed(() => {
    return currentUserId === props.match.player1.id ? props.match.player2 : props.match.player1;
});

// 获取对应的统计数据
const currentPlayerStats = computed(() => {
    return currentUserId === props.match.player1.id 
        ? { wpm: props.match.player1Wpm, accuracy: props.match.player1Accuracy }
        : { wpm: props.match.player2Wpm, accuracy: props.match.player2Accuracy };
});

const opponentPlayerStats = computed(() => {
    return currentUserId === props.match.player1.id 
        ? { wpm: props.match.player2Wpm, accuracy: props.match.player2Accuracy }
        : { wpm: props.match.player1Wpm, accuracy: props.match.player1Accuracy };
});

// 格式化时间
const formatMatchTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};
</script>
  
<style scoped>
.match-card {
    position: relative;
    background: var(--secondary-dark);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;
    overflow: hidden;
}
  
.match-card.win {
    border-left: 4px solid var(--success-color);
}
  
.match-card.lose {
    border-left: 4px solid var(--danger-color);
}
  
.result-badge {
    position: absolute;
    top: 1rem;
    right: -2rem;
    transform: rotate(45deg);
    padding: 0.3rem 3rem;
    font-size: 0.8rem;
    font-weight: bold;
    color: white;
    z-index: 1;
}
  
.result-badge.win {
    background-color: var(--success-color);
}
  
.result-badge.lose {
    background-color: var(--danger-color);
}
  
.match-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}
  
.match-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}
  
.match-type {
    display: flex;
    gap: 1rem;
}
  
.match-type span {
    padding: 0.3rem 0.8rem;
    border-radius: 20px;
    font-size: 0.9rem;
}
  
.category {
    background: var(--accent-color);
    color: white;
}
  
.difficulty {
    background: var(--accent-dark);
    color: var(--text-primary);
}
  
.language {
    background: var(--primary-dark);
    color: var(--text-primary);
}
  
.match-time {
    color: var(--text-secondary);
    font-size: 0.9rem;
}
  
.players-container {
    display: flex;
    align-items: center;
    gap: 2rem;
}
  
.player {
    flex: 1;
    padding: 1rem;
    border-radius: 8px;
    background: var(--primary-dark);
    border: 1px solid var(--border-color);
}
  
.player.winner {
    border-color: var(--success-color);
    background: linear-gradient(145deg, var(--primary-dark), var(--accent-dark));
}
  
.player.winner .avatar {
    border-color: var(--success-color);
}
  
.player.winner .username {
    color: var(--success-color);
}
  
.player-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}
  
.avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 2px solid var(--accent-color);
}
  
.player-details {
    display: flex;
    flex-direction: column;
}
  
.username {
    font-weight: bold;
    color: var(--text-primary);
}
  
.level {
    font-size: 0.9rem;
    color: var(--text-secondary);
}
  
.stats {
    display: flex;
    gap: 1rem;
}
  
.stat {
    flex: 1;
    text-align: center;
    padding: 0.5rem;
    background: var(--secondary-dark);
    border-radius: 8px;
}
  
.label {
    display: block;
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-bottom: 0.3rem;
}
  
.value {
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--text-primary);
}
  
.vs-divider {
    font-weight: bold;
    color: var(--text-secondary);
    font-size: 1.2rem;
}
  
@media (max-width: 768px) {
    .players-container {
        flex-direction: column;
        gap: 1rem;
    }
  
    .vs-divider {
        transform: rotate(90deg);
    }
  
    .result-badge {
        transform: rotate(0);
        right: 0;
        top: 0;
        padding: 0.3rem 1rem;
    }
}
</style>