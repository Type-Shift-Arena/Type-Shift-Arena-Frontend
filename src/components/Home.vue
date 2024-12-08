<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Friends from '../components/Friends/Friends.vue'
const router = useRouter();
const { t, locale } = useI18n();

const isLoggedIn = ref(false);

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
        <!-- 将“技能提升”字样改造成跳转按钮 -->
        <p>{{ $t('home.skillImprovementDescription') }}</p>
      </div>
      <div class="feature">
        <h3>{{ $t('home.leaderboard') }}</h3>
        <p>{{ $t('home.leaderboardDescription') }}</p>
      </div>
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

.practice-button {
  font-size: 1.2rem; /* 增大字体大小 */
}
</style>