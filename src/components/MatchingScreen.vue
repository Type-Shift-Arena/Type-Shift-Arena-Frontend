<template>
  <div class="matching-screen">
    <div class="matching-overlay"></div>

    <!-- 匹配中的画布 -->
    <template v-if="!matchFound">
      <div
        v-for="(bubble, index) in bubbles"
        :key="index"
        class="floating-bubble"
        :style="getBubbleStyle(bubble)"
        @click="handleBubbleClick(bubble)"
      >
        >
        <BurstEffect
          :active="bubble.bursting"
          :color="bubble.color"
          :config="{
            minParticles: 8,
            maxParticles: 12,
            minSpeed: 2,
            maxSpeed: 4,
            gravity: 0.1,
            fadeSpeed: 0.02,
            duration: 800,
          }"
        />
        <span>{{ bubble.text }}</span>
      </div>

      <div class="matching-content">
        <div class="matching-text">
          寻找对手中
          <span class="dots"><span>.</span><span>.</span><span>.</span></span>
        </div>
        <button @click="handleCancel" class="cancel-button">取消匹配</button>
      </div>
    </template>

    <!-- 匹配成功的画布 -->
    <div v-else class="match-success-container">
      <!-- 上三角区域 - 当前玩家 -->
      <div class="player-area player-top" :class="{ 'slide-in': matchFound }">
        <div class="player-info">
          <img :src="currentPlayerAvatar" class="player-avatar" />
          <div class="player-details">
            <div class="player-name">{{ currentPlayerName }}</div>
            <div class="player-id">ID: {{ currentPlayerId }}</div>
          </div>
        </div>
      </div>

      <!-- 中间区域 - 倒计时 -->
      <div class="countdown-area">
        <div class="match-status">匹配成功!</div>
        <div class="countdown">{{ countdown }}s后开始游戏</div>
      </div>

      <!-- 下三角区域 - 对手 -->
      <div
        class="player-area player-bottom"
        :class="{ 'slide-in': matchFound }"
      >
        <div class="player-info">
          <img :src="opponentAvatar" class="player-avatar" />
          <div class="player-details">
            <div class="player-name">{{ opponentName }}</div>
            <div class="player-id">ID: {{ opponentId }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { useWebSocket } from "@/composables/useWebSocket";
import { useRouter } from "vue-router";
import BurstEffect from "@/components/common/BurstEffect.vue";

const props = defineProps({
  matchingOptions: {
    type: Object,
    required: true,
    // 期望的格式: { language: string, category: string, difficulty: string }
  },
});

const router = useRouter();
const {
  connectWebSocket,
  sendMatchRequest,
  sendCancelMatchRequest,
  subscribeToMatchmaking,
} = useWebSocket();
const emit = defineEmits(["cancel"]);
const bubbleCanvas = ref(null);

let bubbles = ref([]);
const animationFrame = ref(null);
let matchmakingSubscription = null;

const matchFound = ref(false);
const countdown = ref(5);
const roomInfo = ref(null);
let countdownTimer = null; // 添加定时器引用

// 当前玩家信息
const currentPlayerName = ref(localStorage.getItem("userName"));
const currentPlayerId = ref(localStorage.getItem("userId"));
const currentPlayerAvatar = ref(localStorage.getItem("imgSrc"));

// 对手信息
const opponentName = ref("");
const opponentId = ref("");
const opponentAvatar = ref("");

// 添加匹配请求状态标志
const isMatchRequestPending = ref(false);

// Canvas 初始化逻辑
const initCanvas = () => {
  const canvas = bubbleCanvas.value;
  if (!canvas) return;

  const resizeCanvas = () => {
    if (!canvas) return;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
  };

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  return () => window.removeEventListener("resize", resizeCanvas);
};

const handleBubbleClick = (bubble) => {
  if (!bubble.bursting) {
    bubble.bursting = true
    // 设置延时移除气泡
    setTimeout(() => {
      bubbles.value = bubbles.value.filter(b => b !== bubble)
    }, 800) // 与动画持续时间匹配
  }
}

// 气泡创建逻辑
const createBubble = () => {
  const params = [
    { text: props.matchingOptions.language, color: "#4f8cff" },
    { text: props.matchingOptions.category, color: "#ff4f8c" },
    { text: props.matchingOptions.difficulty, color: "#8cff4f" },
  ];

  params.forEach((param) => {
    bubbles.value.push({
      x: Math.random() * window.innerWidth,
      y: window.innerHeight + 100,
      text: param.text,
      color: param.color,
      speed: 0.8 + Math.random() * 1.2,
      rotation: Math.random() * 360,
      bursting: false,
    });
  });
};

// 修改点击处理逻辑
const handleCanvasClick = (event) => {
  const rect = bubbleCanvas.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  bubbles.value = bubbles.value.map((bubble) => {
    const distance = Math.sqrt(
      Math.pow(x - bubble.x, 2) + Math.pow(y - bubble.y, 2)
    );

    if (distance <= 40 && !bubble.bursting) {
      // 40px 为点击判定范围
      bubble.bursting = true;
      // 设置延时移除气泡
      setTimeout(() => {
        bubbles.value = bubbles.value.filter((b) => b !== bubble);
      }, 800); // 与动画持续时间匹配
    }
    return bubble;
  });
};

// 修改动画逻辑
const animateBubbles = () => {
  bubbles.value = bubbles.value.filter((bubble) => {
    if (!bubble.bursting) {
      bubble.y -= bubble.speed;
      bubble.rotation += 0.2;
    }
    return bubble.y + 40 > 0; // 40px 为气泡半径
  });

  if (bubbles.value.length < 9 && Math.random() < 0.02) {
    createBubble();
  }

  animationFrame.value = requestAnimationFrame(animateBubbles);
};

// 计算气泡样式
const getBubbleStyle = (bubble) => ({
  transform: `translate(${bubble.x}px, ${bubble.y}px) rotate(${bubble.rotation}deg)`,
  color: bubble.color,
  borderColor: bubble.color,
  opacity: bubble.bursting ? 0 : 1,
  transition: "opacity 0.3s",
});

// 处理匹配成功
const handleMatchFound = (event) => {
  const { roomId, opponent, gameInfo } = event.detail;
  console.log("[MatchingScreen] 收到匹配成功事件:", event.detail);

  // 防止重复触发
  if (matchFound.value) return;

  // 保存房间信息
  roomInfo.value = { roomId, gameInfo };

  // 更新对手信息
  opponentName.value = opponent.name;
  opponentId.value = opponent.id;
  opponentAvatar.value = opponent.avatar || "/default-avatar.png";

  // 显示匹配成功画面
  matchFound.value = true;
  countdown.value = 5; // 确保倒计时从5开始

  // 清除可能存在的旧定时器
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }

  // 重置匹配请求状态
  isMatchRequestPending.value = false;

  // 开始新的倒计时
  countdownTimer = setInterval(() => {
    countdown.value--;
    console.log("[MatchingScreen] 倒计时:", countdown.value);

    if (countdown.value <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      // 倒计时结束后跳转到游戏房间
      router.push(`/room/${roomId}`);
    }
  }, 1000);
};

// 取消匹配
const handleCancel = () => {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value);
  }
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  // 发送取消匹配请求
  const playerId = localStorage.getItem("userId");
  sendCancelMatchRequest({
    playerId,
    playerName: localStorage.getItem("userName"),
    playerAvatar: localStorage.getItem("imgSrc"),
    language: props.matchingOptions.language,
    category: props.matchingOptions.category,
    difficulty: props.matchingOptions.difficulty,
  });

  isMatchRequestPending.value = false;
  emit("cancel");
};

// 组件挂载时初始化
onMounted(async () => {
  nextTick(async () => {
    // 移除 Canvas 初始化相关代码
    createBubble(); // 直接创建初始气泡
    animateBubbles(); // 开始动画

    try {
      // 等待 WebSocket 连接成功
      await connectWebSocket();

      const playerId = localStorage.getItem("userId");
      const playerName = localStorage.getItem("userName");
      const playerAvatar = localStorage.getItem("imgSrc");

      // 先取消之前可能存在的匹配请求
      sendCancelMatchRequest({
        playerId,
        playerName,
        playerAvatar,
        language: props.matchingOptions.language,
        category: props.matchingOptions.category,
        difficulty: props.matchingOptions.difficulty,
      });

      // 等待一小段时间确保取消请求被处理
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 现在可以安全地订阅和发送新的匹配消息
      matchmakingSubscription = subscribeToMatchmaking(playerId);

      // 防止重复发送匹配请求
      if (!isMatchRequestPending.value) {
        isMatchRequestPending.value = true;
        sendMatchRequest({
          playerId,
          playerName,
          playerAvatar,
          language: props.matchingOptions.language,
          category: props.matchingOptions.category,
          difficulty: props.matchingOptions.difficulty,
        });
      }
    } catch (error) {
      console.error("匹配初始化失败:", error);
      isMatchRequestPending.value = false;
    }

    onUnmounted(() => {
      cleanup?.();
      canvas.removeEventListener("click", handleCanvasClick);
      if (animationFrame.value) {
        cancelAnimationFrame(animationFrame.value);
      }

      // 在组件卸载时取消匹配请求
      const playerId = localStorage.getItem("userId");
      if (playerId && !matchFound.value) {
        sendCancelMatchRequest({
          playerId,
          playerName: localStorage.getItem("userName"),
          playerAvatar: localStorage.getItem("imgSrc"),
          language: props.matchingOptions.language,
          category: props.matchingOptions.category,
          difficulty: props.matchingOptions.difficulty,
        });
      }

      // 组件卸载时清理
      if (animationFrame.value) {
        cancelAnimationFrame(animationFrame.value);
      }
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
      // 清理匹配订阅
      if (matchmakingSubscription) {
        matchmakingSubscription.unsubscribe();
        matchmakingSubscription = null;
      }
      // 重置状态
      matchFound.value = false;
      countdown.value = 5;
      isMatchRequestPending.value = false;
    });
  });
});

// 监听匹配成功事件
onMounted(() => {
  window.addEventListener("match-found", handleMatchFound);
});

onUnmounted(() => {
  window.removeEventListener("match-found", handleMatchFound);
});
</script>

<style scoped>
.matching-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.matching-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(44, 62, 80, 0.97),
    rgba(52, 73, 94, 0.97)
  );
  backdrop-filter: blur(12px);
  z-index: 1;
}

.bubble-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  cursor: pointer;
}

.matching-content {
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.matching-text {
  color: white;
  font-size: 2.5rem;
  font-weight: 600;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3), 0 0 40px rgba(79, 140, 255, 0.3);
  letter-spacing: 2px;
}

.dots span {
  display: inline-block;
  animation: dotAnimation 1.4s infinite;
  margin: 0 2px;
}

.dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dotAnimation {
  0%,
  20% {
    transform: translateY(0);
    opacity: 1;
  }
  50% {
    transform: translateY(-5px);
    opacity: 0.5;
  }
  80%,
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

.cancel-button {
  padding: 14px 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 30px;
  color: white;
  font-size: 1.2rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(8px);
  letter-spacing: 1px;
}

.cancel-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2), 0 0 20px rgba(79, 140, 255, 0.3);
}

.cancel-button:active {
  transform: translateY(0);
}

.match-success-container {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.player-area {
  width: 100%;
  height: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
}

.player-area.slide-in {
  opacity: 1;
}

.player-top {
  background: linear-gradient(to bottom, rgba(79, 140, 255, 0.8), transparent);
  transform: translateY(-100%);
}

.player-top.slide-in {
  transform: translateY(0);
}

.player-bottom {
  background: linear-gradient(to top, rgba(255, 79, 140, 0.8), transparent);
  transform: translateY(100%);
}

.player-bottom.slide-in {
  transform: translateY(0);
}

.player-info {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.player-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.5);
}

.player-details {
  color: white;
}

.player-name {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.player-id {
  font-size: 0.9rem;
  opacity: 0.8;
}

.countdown-area {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: white;
  z-index: 4;
}

.match-status {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 15px;
  animation: pulseText 1.5s infinite;
}

.countdown {
  font-size: 1.8rem;
  opacity: 0.9;
}

@keyframes pulseText {
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

/* 添加响应式设计 */
@media (max-width: 768px) {
  .player-info {
    flex-direction: column;
    text-align: center;
  }

  .player-avatar {
    width: 60px;
    height: 60px;
  }

  .player-name {
    font-size: 1.2rem;
  }
}

.floating-bubble {
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
  cursor: pointer; /* 添加鼠标指针样式 */
  z-index: 2; /* 确保气泡在overlay之上 */
}

.floating-bubble span {
  color: white;
  font-size: 1rem;
  font-weight: 500;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
}
</style>
