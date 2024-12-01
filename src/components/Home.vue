<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const { t } = useI18n();

const isLoggedIn = ref(false);
const testRoomId = ref('');
const isDev = computed(() => import.meta.env.DEV);

onMounted(() => {
  isLoggedIn.value = !!localStorage.getItem('token');
});

const startGame = () => {
  if (isLoggedIn.value) {
    router.push('/game-lobby');
  } else {
    router.push('/auth');
  }
};

const testGame = () => {
  const roomId = Math.random().toString(36).substring(7);
  testRoomId.value = roomId;  // 保存房间ID以便复制
  router.push({
    name: 'testRoom',
    params: { id: roomId }
  });
};

const joinTestRoom = () => {
  if (testRoomId.value) {
    router.push({
      name: 'testRoom',
      params: { id: testRoomId.value }
    });
  } else {
    alert(t('home.enterRoomId'));
  }
}

// 技能提升按钮的点击事件处理函数
const startTypingPractice = () => {
  router.push('/typing-practice')
}
</script>

<template>
  <div class="home">
    <div class="hero">
      <h1>{{ $t('home.title') }}</h1>
      <p>{{ $t('home.description') }}</p>
      <div class="button-group">
        <button @click="startGame" class="cta-button">
          {{ isLoggedIn ? $t('home.startGame') : $t('home.login') }}
        </button>
        <button @click="testGame" class="test-button">
          {{ $t('home.testGame') }}
        </button>
        <button @click="switchLanguage" class="language-button">
          {{ $t('home.switchLanguage') }}
        </button>
      </div>
    </div>

    <div class="features">
      <div class="feature">
        <h3>{{ $t('home.realTimeBattle') }}</h3>
        <p>{{ $t('home.realTimeBattleDescription') }}</p>
      </div>
      <div class="feature">
        <button @click="startTypingPractice" class="practice-button">
          {{ $t('home.skillImprovement') }}
        </button>
        <p>{{ $t('home.skillImprovementDescription') }}</p>
      </div>
      <div class="feature">
        <h3>{{ $t('home.leaderboard') }}</h3>
        <p>{{ $t('home.leaderboardDescription') }}</p>
      </div>
    </div>

    <div class="test-buttons" v-if="isDev">
      <button @click="testGame">{{ $t('home.createTestRoom') }}</button>
      <button @click="joinTestRoom">{{ $t('home.joinTestRoom') }}</button>
      <input v-model="testRoomId" :placeholder="$t('home.enterRoomId')" />
    </div>
  </div>
</template>

<style scoped>
.home {
  text-align: center;
  padding: 2rem;
}

.hero {
  padding: 4rem 2rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 3rem;
}

.hero h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.hero p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 2rem;
}

.cta-button {
  padding: 1rem 2rem;
  font-size: 1.2rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.cta-button:hover {
  background-color: #3aa876;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  padding: 2rem;
}

.feature {
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.feature h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.feature p {
  color: #666;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.test-button {
  background-color: #2c3e50;
  color: white;
  padding: 0.8rem 2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.test-button:hover {
  background-color: #34495e;
}

.test-buttons {
  margin-top: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.practice-button {
  font-size: 1.2rem; /* 增大字体大小 */
}


.test-buttons input {
  padding: 0.5rem;
  margin: 0 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}


.language-button {
  background-color: #7f8c8d;
  color: white;
  padding: 0.8rem 2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.language-button:hover {
  background-color: #8e9eab;
}

</style>