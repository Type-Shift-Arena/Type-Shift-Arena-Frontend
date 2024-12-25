<template>
  <div class="game-lobby">
    <div class="lobby-header">
      <div class="header-title">
        <h1>游戏大厅</h1>
      </div>
      <div class="search-bar">
        <div class="filter-dropdown">
          <button 
            class="filter-btn" 
            @click.stop="toggleFilterMenu"
            :class="{ 'active': showFilterMenu }"
          >
            <i class="fas fa-filter"></i>
            <span>{{ activeFiltersCount ? `已选 ${activeFiltersCount}` : '筛选' }}</span>
          </button>
          
          <div class="filter-menu" v-if="showFilterMenu" v-click-outside="closeFilterMenu">
            <div class="filter-section">
              <div class="filter-title">语言</div>
              <div class="filter-options">
                <label v-for="option in languageOptions" :key="option.value">
                  <input 
                    type="checkbox" 
                    v-model="tempFilters.languages" 
                    :value="option.value"
                  >
                  <i :class="option.icon"></i>
                  {{ option.label }}
                </label>
              </div>
            </div>
            
            <div class="filter-section">
              <div class="filter-title">类型</div>
              <div class="filter-options">
                <label v-for="option in categoryOptions" :key="option.value">
                  <input 
                    type="checkbox" 
                    v-model="tempFilters.categories" 
                    :value="option.value"
                  >
                  <i :class="option.icon"></i>
                  {{ option.label }}
                </label>
              </div>
            </div>
            
            <div class="filter-section">
              <div class="filter-title">难度</div>
              <div class="filter-options">
                <label v-for="option in difficultyOptions" :key="option.value">
                  <input 
                    type="checkbox" 
                    v-model="tempFilters.difficulties" 
                    :value="option.value"
                  >
                  <i :class="option.icon"></i>
                  {{ option.label }}
                </label>
              </div>
            </div>
            
            <div class="filter-actions">
              <button class="clear-filters" @click="clearFilters">清除筛选</button>
              <button class="apply-filters" @click="applyFilters">应用</button>
            </div>
          </div>
        </div>

        <div class="search-input-wrapper">
          <button 
            class="search-icon-btn"
            @click="handleSearch"
            :disabled="isSearching"
          >
            <i class="fas" :class="isSearching ? 'fa-spinner fa-spin' : 'fa-search'"></i>
          </button>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="输入房间号搜索..."
            @keyup.enter="handleSearch"
            :disabled="isSearching"
          >
          <button 
            v-if="searchQuery" 
            class="clear-btn"
            @click="clearSearch"
            :disabled="isSearching"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="room-stats">
        <span class="room-count">当前房间数: {{ totalRooms }}</span>
        <button class="create-room-btn" @click="showCreateDialog = true">
          创建房间
        </button>
      </div>
    </div>

    <!-- 搜索结果提示 -->
    <div v-if="searchActive && !isSearching" class="search-results">
      <template v-if="filteredRooms.length">
        找到 {{ filteredRooms.length }} 个相关房间
        <button class="reset-search" @click="clearSearch">
          显示所有房间
        </button>
      </template>
      <template v-else>
        未找到相关房间
        <button class="reset-search" @click="clearSearch">
          显示所有房间
        </button>
      </template>
    </div>

    <!-- 房间列表 -->
    <div class="rooms-container">
      <div class="rooms-grid">
        <RoomCard 
          v-for="room in displayRooms" 
          :key="room.roomId"
          :room="room"
          @join="joinRoom"
        />
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      {{ error }}
      <button @click="fetchRooms">重试</button>
    </div>

    <!-- 创建房间对话框 -->
    <CreateRoomDialog
      v-model:visible="showCreateDialog"
      @create="handleCreateRoom"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import RoomCard from '@/components/RoomCard.vue'
import { 
  LANGUAGE_OPTIONS, 
  CATEGORY_OPTIONS, 
  DIFFICULTY_OPTIONS,
  getAvailableOptions 
} from '@/config/gameRoomAssets'
import CreateRoomDialog from '@/components/GameRoom/CreateRoomDialog.vue'

const router = useRouter()
const rooms = ref([])
const totalRooms = ref(0)
const loading = ref(true)
const error = ref(null)
let refreshInterval = null

const searchQuery = ref('')
const searchActive = ref(false)
const isSearching = ref(false)
const searchResults = ref([])
const showCreateDialog = ref(false)

// 筛选相关状态
const showFilterMenu = ref(false)
const filters = ref({
  languages: [],
  categories: [],
  difficulties: []
})

// 获取可用的选项
const userInfo = { level: 0, permissions: [] } // 这里可以从用户状态获取实际信息
const languageOptions = getAvailableOptions(LANGUAGE_OPTIONS, 'custom', userInfo)
const categoryOptions = getAvailableOptions(CATEGORY_OPTIONS, 'custom', userInfo)
const difficultyOptions = getAvailableOptions(DIFFICULTY_OPTIONS, 'custom', userInfo)

// 临时存储筛选条件
const tempFilters = ref({
  languages: [],
  categories: [],
  difficulties: []
})

// 实际应用的筛选条件
const activeFilters = ref({
  languages: [],
  categories: [],
  difficulties: []
})

// 计算激活的筛选器数量
const activeFiltersCount = computed(() => {
  return activeFilters.value.languages.length + 
         activeFilters.value.categories.length + 
         activeFilters.value.difficulties.length
})

// 根据筛选条件和搜索过滤房间
const displayRooms = computed(() => {
  let result = rooms.value

  // 如果有搜索查询，优先使用搜索结果
  if (searchActive.value) {
    result = searchResults.value
  }

  // 应用筛选条件
  if (activeFiltersCount.value > 0) {
    result = result.filter(room => {
      const languageMatch = activeFilters.value.languages.length === 0 || 
                          activeFilters.value.languages.includes(room.language)
      const categoryMatch = activeFilters.value.categories.length === 0 || 
                          activeFilters.value.categories.includes(room.category)
      const difficultyMatch = activeFilters.value.difficulties.length === 0 || 
                            activeFilters.value.difficulties.includes(room.difficulty)
      
      return languageMatch && categoryMatch && difficultyMatch
    })
  }

  return result
})

// 打开筛选菜单时，用当前活动的筛选条件初始化临时筛选条件
const toggleFilterMenu = () => {
  if (!showFilterMenu.value) {
    // 打开菜单时，用当前活动的筛选条件初始化临时筛选条件
    tempFilters.value = {
      languages: [...activeFilters.value.languages],
      categories: [...activeFilters.value.categories],
      difficulties: [...activeFilters.value.difficulties]
    }
  }
  showFilterMenu.value = !showFilterMenu.value
}

// 关闭筛选菜单
const closeFilterMenu = () => {
  showFilterMenu.value = false
  // 恢复到当前活动的筛选条件
  tempFilters.value = {
    languages: [...activeFilters.value.languages],
    categories: [...activeFilters.value.categories],
    difficulties: [...activeFilters.value.difficulties]
  }
}

// 清除筛选条件
const clearFilters = () => {
  // 清除临时筛选条件
  tempFilters.value = {
    languages: [],
    categories: [],
    difficulties: []
  }
  // 清除实际筛选条件
  activeFilters.value = {
    languages: [],
    categories: [],
    difficulties: []
  }
}

// 应用筛选条件
const applyFilters = () => {
  // 将临时筛选条件应用到实际筛选条件
  activeFilters.value = {
    languages: [...tempFilters.value.languages],
    categories: [...tempFilters.value.categories],
    difficulties: [...tempFilters.value.difficulties]
  }
  showFilterMenu.value = false
}

// 点击外部关闭筛选菜单
const vClickOutside = {
  mounted(el, { value }) {
    el.clickOutsideEvent = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        value()
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent)
  }
}

// 过滤房间列表
const filteredRooms = computed(() => {
  if (!searchQuery.value) return rooms.value
  const query = searchQuery.value.toLowerCase()
  return rooms.value.filter(room => 
    room.roomId.toLowerCase().includes(query)
  )
})

// 处理搜索
const handleSearch = async () => {
  if (!searchQuery.value.trim() || isSearching.value) return

  try {
    isSearching.value = true
    searchActive.value = true
    
    // 模拟搜索延迟
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 执行搜索
    const query = searchQuery.value.toLowerCase()
    searchResults.value = rooms.value.filter(room => 
      room.roomId.toLowerCase().includes(query)
    )
  } catch (error) {
    console.error('搜索出错:', error)
  } finally {
    isSearching.value = false
  }
}

// 清除搜索
const clearSearch = () => {
  searchQuery.value = ''
  searchActive.value = false
  searchResults.value = []
  isSearching.value = false
}

// 获取房间列表
const fetchRooms = async () => {
  try {
    loading.value = true
    error.value = null
    
    // 开发环境使用模拟数据
    if (import.meta.env.DEV) {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 模拟数据
      const mockData = {
        totalRooms: 2,
        rooms: [
          {
            roomId: "room-123",
            playersCount: 1,
            status: "waiting",
            language: "ENGLISH",
            category: "DAILY_CHAT",
            difficulty: "EASY",
            createdAt: "2024-11-15T10:30:00Z",
            players: [
              {
                id: "1",
                name: "Player1",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Player1",
                level: "荣耀黄金",
                rankScore: 1800
              }
            ],
            hostId: "1"
          },
          {
            roomId: "room-456",
            playersCount: 2,
            status: "playing",
            language: "CHINESE",
            category: "PROGRAMMING",
            difficulty: "MEDIUM",
            createdAt: "2024-11-15T10:35:00Z",
            players: [
              {
                id: "2",
                name: "Player2",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Player2",
                level: "华贵铂金",
                rankScore: 2200
              },
              {
                id: "3",
                name: "Player3",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Player3",
                level: "耀眼翡翠",
                rankScore: 2800
              }
            ],
            hostId: "2"
          },
          {
            roomId: "room-123",
            playersCount: 1,
            status: "waiting",
            language: "ENGLISH",
            category: "DAILY_CHAT",
            difficulty: "EASY",
            createdAt: "2024-11-15T10:30:00Z",
            players: [
              {
                id: "1",
                name: "Player1",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Player1",
                level: "荣耀黄金",
                rankScore: 1800
              }
            ],
            hostId: "1"
          },
          {
            roomId: "room-123",
            playersCount: 1,
            status: "waiting",
            language: "ENGLISH",
            category: "DAILY_CHAT",
            difficulty: "EASY",
            createdAt: "2024-11-15T10:30:00Z",
            players: [
              {
                id: "1",
                name: "Player1",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Player1",
                level: "荣耀黄金",
                rankScore: 1800
              }
            ],
            hostId: "1"
          },
        ]
      }
      
      rooms.value = mockData.rooms
      totalRooms.value = mockData.totalRooms
      return
    }

    // 生产环境使用实际API
    const response = await axios.get('/api/rooms/custom')
    rooms.value = response.data.rooms
    totalRooms.value = response.data.totalRooms
  } catch (err) {
    error.value = '获取房间列表失败，请重试'
    console.error('获取房间列表失败:', err)
  } finally {
    loading.value = false
  }
}

// 创建房间
const createRoom = () => {
  router.push('/create-room')
}

// 加入房间
const joinRoom = (roomId) => {
  router.push(`/game-room/${roomId}`)
}

// 处理创建房间
const handleCreateRoom = async (config) => {
  try {
    // 这里添加创建房间的逻辑
    console.log('创建房间配置:', config)
    // const response = await createRoom(config)
    // 创建成功后的处理...
  } catch (error) {
    console.error('创建房间失败:', error)
  }
}

onMounted(() => {
  fetchRooms()
  // 每30秒刷新一次房间列表
  refreshInterval = setInterval(fetchRooms, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.game-lobby {
  min-height: calc(100vh - 140px);
  padding: 1.5rem;
  color: #fff;
  overflow-x: hidden;
}

.lobby-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.header-title h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
  color: #fff;
}

.room-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.room-count {
  color: #e4e4e4;
  font-size: 1.1rem;
}

.create-room-btn {
  padding: 0.5rem 1.5rem;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.1);
}

.create-room-btn:hover {
  background: #4338ca;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);
}

.rooms-container {
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  box-sizing: border-box;
}

.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  width: 100%;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-message {
  text-align: center;
  color: #ef4444;
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 8px;
  margin: 1rem 0;
}

.error-message button {
  margin-left: 1rem;
  padding: 0.25rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.error-message button:hover {
  background: #dc2626;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 1280px) {
  .rooms-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

@media (max-width: 1024px) {
  .rooms-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 768px) {
  .game-lobby {
    padding: 1rem;
  }

  .rooms-container {
    padding: 1rem;
  }

  .rooms-grid {
    grid-template-columns: 1fr;
  }

  .lobby-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
    margin-top: 1rem;
  }

  .header-title h1 {
    margin-bottom: 0.5rem;
  }
}

.search-bar {
  display: flex;
  align-items: center;
  margin: 0 2rem;
  flex: 1;
  max-width: 500px;
}

.search-input-wrapper {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  font-size: 0.9rem;
}

.search-input-wrapper input {
  width: 100%;
  padding: 0.6rem 2.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.search-input-wrapper input:focus {
  outline: none;
  border-color: #4f46e5;
  background: rgba(255, 255, 255, 0.1);
}

.search-input-wrapper input::placeholder {
  color: #6b7280;
}

.clear-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.search-results {
  margin: 1rem 0;
  padding: 0.75rem 1rem;
  background: rgba(79, 70, 229, 0.1);
  border-radius: 8px;
  color: #e4e4e4;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.reset-search {
  background: none;
  border: 1px solid #4f46e5;
  color: #4f46e5;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reset-search:hover {
  background: #4f46e5;
  color: white;
}

@media (max-width: 1024px) {
  .lobby-header {
    flex-direction: column;
    gap: 1rem;
  }

  .search-bar {
    margin: 1rem 0;
    max-width: 100%;
  }
}

.search-icon-btn {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.search-icon-btn:hover:not(:disabled) {
  color: #4f46e5;
}

.search-icon-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.search-input-wrapper input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filter-dropdown {
  position: relative;
  margin-right: 1rem;
}

.filter-btn {
  height: 40px;
  padding: 0 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  font-size: 0.8rem;
  width: 100px;
}

.filter-text {
  font-size: 0.9rem;
  margin-left: 4px;
  white-space: nowrap;
}

.filter-btn i {
  font-size: 0.9rem;
}

.filter-btn.active {
  background: rgba(79, 70, 229, 0.1);
  border-color: #4f46e5;
}

.filter-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 0.5rem;
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  min-width: 250px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.filter-section {
  margin-bottom: 1rem;
}

.filter-title {
  font-weight: 600;
  color: #e4e4e4;
  margin-bottom: 0.5rem;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-options label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.filter-options label:hover {
  background: rgba(255, 255, 255, 0.05);
}

.filter-options input[type="checkbox"] {
  accent-color: #4f46e5;
}

.filter-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.clear-filters {
  padding: 0.4rem 0.8rem;
  background: none;
  border: 1px solid #6b7280;
  color: #6b7280;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-filters:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.apply-filters {
  padding: 0.4rem 0.8rem;
  background: #4f46e5;
  border: none;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.apply-filters:hover {
  background: #4338ca;
}
</style>