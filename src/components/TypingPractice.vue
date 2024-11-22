<template>
  <div class="typing-practice">
    <h1>打字练习</h1>
    <p>选择一篇文章进行练习：</p>

    <div class="article-list">
      <button
          v-for="(article, index) in articles"
          :key="index"
          @click="selectArticle(article)"
          class="article-button"
      >
        {{ article.title }}
      </button>
    </div>

    <div class="practice-area" v-if="currentText">
      <div class="text-display">
        <span
            v-for="(char, index) in currentText.split('')"
            :key="index"
            :class="{
            'text-correct': index < userInput.length && userInput[index] === char,
            'text-incorrect': index < userInput.length && userInput[index] !== char,
            'text-default': index >= userInput.length
          }"
        >
          {{ char }}
        </span>
      </div>
      <textarea
          ref="inputField"
          v-model="userInput"
          @input="checkInput"
          @keydown="handleKeyDown"
          @paste.prevent
          placeholder="在这里输入文本..."
          class="input-field"
          rows="5"
      ></textarea>
      <button
          @click="submitPractice"
          :disabled="userInput.length < currentText.length"
          class="submit-button"
      >
        提交
      </button>
    </div>

    <div class="stats" v-if="currentText">
      <p>速度: {{ wpm }} WPM</p>
      <p>准确率: {{ accuracy }}%</p>
      <p>用时: {{ elapsedTime }} 秒</p>
    </div>

    <div class="result-page" v-if="showResultPage">
      <h2>练习结果</h2>
      <p>文章标题: {{ selectedArticle.title }}</p>
      <p>用时: {{ elapsedTime }} 秒</p>
      <p>准确率: {{ accuracy }}%</p>
      <p>速度: {{ wpm }} WPM</p>
      <button @click="restartPractice" class="restart-button">重新开始</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const articles = ref([])
const currentText = ref('')
const userInput = ref('')
const startTime = ref(null)
const endTime = ref(null)
const correctCount = ref(0)
const totalCount = ref(0)
const errorCount = ref(0)
const showResultPage = ref(false)
const selectedArticle = ref(null)

const wpm = computed(() => {
  if (!endTime.value || !startTime.value) return 0
  const timeInMinutes = (endTime.value - startTime.value) / 60000
  return Math.round((correctCount.value / 5) / timeInMinutes)
})

const accuracy = computed(() => {
  if (totalCount.value === 0) return 100
  return Math.round((correctCount.value / (totalCount.value + errorCount.value)) * 100)
})

const elapsedTime = computed(() => {
  if (!startTime.value) return 0
  const currentTime = endTime.value || Date.now()
  return Math.round((currentTime - startTime.value) / 1000)
})

const loadArticles = async () => {
  const articleFiles = ['English.txt', '中文.txt', '数字.txt', '岳阳楼记.txt']
  const loadedArticles = await Promise.all(
      articleFiles.map(async (file) => {
        const response = await fetch(`/texts/${file}`)
        const text = await response.text()
        return {title: file.replace('.txt', ''), content: text}
      })
  )
  articles.value = loadedArticles
}

const selectArticle = (article) => {
  selectedArticle.value = article
  currentText.value = article.content
  userInput.value = ''
  startTime.value = Date.now()
  endTime.value = null
  correctCount.value = 0
  totalCount.value = 0
  errorCount.value = 0
  showResultPage.value = false
}

const checkInput = () => {
  const inputLength = userInput.value.length
  const textSlice = currentText.value.slice(0, inputLength)

  if (userInput.value === textSlice) {
    correctCount.value = inputLength
    errorCount.value = 0
  } else {
    errorCount.value = 1
  }

  totalCount.value = inputLength
  endTime.value = Date.now()
}

const handleKeyDown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    nextText()
  }
}

const nextText = () => {
  if (userInput.value === currentText.value) {
    endTime.value = Date.now()
    showResultPage.value = true
  }
}

const submitPractice = () => {
  if (userInput.value.length === currentText.value.length) {
    endTime.value = Date.now()
    showResultPage.value = true
  }
}

const restartPractice = () => {
  selectArticle(selectedArticle.value)
}

onMounted(() => {
  loadArticles()
})
</script>

<style scoped>
.typing-practice {
  text-align: center;
  padding: 2rem;
}

.typing-practice h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.typing-practice p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 2rem;
}

.article-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.article-button {
  padding: 1rem 2rem;
  font-size: 1.2rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.article-button:hover {
  background-color: #3aa876;
}

.practice-area {
  margin-bottom: 2rem;
}

.text-display {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f8f9fa;
  display: inline-block;
}

.text-display span {
  display: inline-block;
  min-width: 0.5em;
  text-align: center;
}

.text-correct {
  color: green;
}

.text-incorrect {
  color: red;
}

.text-default {
  color: black;
}

.input-field {
  width: 100%;
  padding: 1rem;
  font-size: 1.2rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 1rem;
  resize: vertical;
}

.submit-button {
  padding: 1rem 2rem;
  font-size: 1.2rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.stats {
  font-size: 1.2rem;
  margin-bottom: 2rem;
}

.result-page {
  margin-top: 2rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f8f9fa;
}

.result-page h2 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.result-page p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 1rem;
}

.restart-button {
  padding: 1rem 2rem;
  font-size: 1.2rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.restart-button:hover {
  background-color: #3aa876;
}
</style>
