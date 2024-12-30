<template>
  <div class="game-lobby">
    <div>
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
                <div class="filter-header">
                  <h3 class="filter-title">语言</h3>
                </div>
                <div class="filter-options">
                  <label v-for="option in languageOptions" :key="option.value">
                    <input 
                      type="checkbox" 
                      v-model="activeFilters.languages" 
                      :value="option.value"
                      :disabled="option.disabled"
                    >
                    <i :class="option.icon"></i>
                    {{ option.label }}
                  </label>
                </div>
              </div>
              
              <div class="filter-section">
                <div class="filter-header">
                  <h3 class="filter-title">类型</h3>
                </div>
                <div class="filter-options">
                  <label v-for="option in categoryOptions" :key="option.value">
                    <input 
                      type="checkbox" 
                      v-model="activeFilters.categories" 
                      :value="option.value"
                      :disabled="option.disabled"
                    >
                    <i :class="option.icon"></i>
                    {{ option.label }}
                  </label>
                </div>
              </div>
              
              <div class="filter-section">
                <div class="filter-header">
                  <h3 class="filter-title">难度</h3>
                  <button class="clear-filters-btn" @click="clearFilters">
                    <i class="material-icons">clear</i>
                    清除筛选
                  </button>
                </div>
                <div class="filter-options">
                  <label v-for="option in difficultyOptions" :key="option.value">
                    <input 
                      type="checkbox" 
                      v-model="activeFilters.difficulties" 
                      :value="option.value"
                      :disabled="option.disabled"
                    >
                    <i :class="option.icon"></i>
                    {{ option.label }}
                  </label>
                </div>
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
          <button 
            class="refresh-btn"
            :disabled="isRefreshing"
            @click="handleRefresh"
          >
            <i class="fas fa-sync-alt" :class="{ 'rotating': isRefreshing }"></i>
          </button>
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
            v-for="room in paginatedRooms" 
            :key="room.roomId"
            :room="room"
            @join="handleJoinRoom"
          />
        </div>
        
        <!-- 添加分页控制器 -->
        <div class="pagination" v-if="totalPages > 1">
          <button 
            class="page-btn"
            :disabled="currentPage === 1"
            @click="handlePageChange(currentPage - 1)"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          
          <div class="page-numbers">
            <button 
              v-for="page in totalPages" 
              :key="page"
              class="page-number"
              :class="{ active: currentPage === page }"
              @click="handlePageChange(page)"
            >
              {{ page }}
            </button>
          </div>
          
          <button 
            class="page-btn"
            :disabled="currentPage === totalPages"
            @click="handlePageChange(currentPage + 1)"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import RoomCard from '@/components/RoomCard.vue'
import CreateRoomDialog from '@/components/GameRoom/CreateRoomDialog.vue'
import { ElMessage } from 'element-plus'
import { 
  languageOptionsState,
  categoryOptionsState,
  difficultyOptionsState,
} from '@/config/gameRoomAssets'
import { fetchCategoriesByLanguage, convertToGameOptions as convertCategoryOptions } from '@/api/modules/game/gameCategories'
import { fetchDifficultiesByLanguageAndCategory, convertToGameOptions as convertDifficultyOptions } from '@/api/modules/game/gameDifficulties'
import { useWebSocket } from '@/composables/useWebSocket'
import { useGameState } from '@/composables/useGameState'
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

// 打开筛选菜单
const toggleFilterMenu = () => {
  showFilterMenu.value = !showFilterMenu.value
}

// 关闭筛选菜单
const closeFilterMenu = () => {
  showFilterMenu.value = false
}

// 清除筛选条件
const clearFilters = () => {
  activeFilters.value = {
    languages: [],
    categories: [],
    difficulties: []
  }
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

    // 生产环境使用实际API
    const response = await axios.get('/rooms/custom')
    rooms.value = response.data.rooms
    totalRooms.value = response.data.totalRooms
  } catch (err) {
    error.value = '获取房间列表失败，请重试'
    console.error('获取房间列表失败:', err)
  } finally {
    loading.value = false
  }
}

const { 
  stompClient,
  connectWebSocket,
  subscribeToPlayerChannel,
  subscribeToRoomBroadcast,
  hasSubscription
} = useWebSocket()

const gameState = useGameState(null, stompClient)

const handleJoinRoom = async (roomId) => {
  try {
    const playerId = localStorage.getItem('userId')
    const playerName = localStorage.getItem('userName')
    
    // 1. 确保WebSocket连接
    if (!stompClient?.connected) {
      await connectWebSocket()
      // 添加短暂延迟确保连接完全建立
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // 2. 订阅个人频道
    if (!hasSubscription(`player_channel_${playerId}`)) {
      await subscribeToPlayerChannel(playerId)
    }

    // 3. 订阅房间广播频道
    if (!hasSubscription(`room_${roomId}`)) {
      await subscribeToRoomBroadcast(roomId)
    }

    // 4. 等待所有订阅完成
    await new Promise(resolve => setTimeout(resolve, 100))

    // 5. 发送加入房间请求
    await gameState.joinRoom(roomId, playerId, playerName)

    // 6. 跳转到房间
    router.push(`/room/${roomId}`)
  } catch (error) {
    console.error('加入房间失败:', error)
    ElMessage.error('加入房间失败: ' + error.message)
  }
}

// 处理创建房间
const handleCreateRoom = async (config) => {
  try {
    // 确保选项已经加载
    if (!languageOptionsState.value.options) {
      await languageOptionsState.value.initialize()
    }

    const playerId = localStorage.getItem('userId')
    if (!playerId) {
      throw new Error('User ID not found')
    }

    const response = await axios.post('/api/rooms/create', {
      playerId: playerId,
      language: config.language,
      category: config.category,
      difficulty: config.difficulty
    })

    if (response.data.status === 200) {
      const roomId = response.data.data.roomId
      router.push(`/room/${roomId}`)
    } else {
      throw new Error(response.data.message || 'Failed to create room')
    }
  } catch (error) {
    console.error('创建房间失败:', error)
    ElMessage.error('创建房间失败: ' + (error.response?.data?.message || error.message))
  }
}

// 筛选选项配置
const languageOptions = computed(() => {
  const { options, loading } = languageOptionsState.value
  if (loading || !options) return []
  
  return Object.values(options).map(option => ({
    value: option.value,
    label: option.label,
    icon: `emojione:flag-for-${option.icon}`,
    disabled: option.disabled || !option.availableIn.includes('custom')
  }))
})

const categoryOptions = computed(() => {
  const { options } = categoryOptionsState.value || {}
  if (!options) return []
  
  // 获取所有语言的类型选项集合
  const availableOptions = new Set()
  
  // 如果有选中的语言，只显示选中语言的类型
  if (activeFilters.value.languages.length > 0) {
    activeFilters.value.languages.forEach(language => {
      const languageOptions = options[language] || {}
      Object.values(languageOptions).forEach(option => {
        if (option && !option.disabled && option.availableIn?.includes('custom')) {
          availableOptions.add(JSON.stringify(option))
        }
      })
    })
  } else {
    // 如果没有选中的语言，显示所有语言的类型
    Object.values(options).forEach(languageOptions => {
      if (languageOptions) {
        Object.values(languageOptions).forEach(option => {
          if (option && !option.disabled && option.availableIn?.includes('custom')) {
            availableOptions.add(JSON.stringify(option))
          }
        })
      }
    })
  }
  
  // 转换回对象数组并去重
  return Array.from(availableOptions)
    .map(optionStr => JSON.parse(optionStr))
    .map(option => ({
      value: option.value,
      label: option.label,
      icon: option.icon,
      disabled: option.disabled || !option.availableIn?.includes('custom')
    }))
})

const difficultyOptions = computed(() => {
  const { options } = difficultyOptionsState.value || {}
  if (!options) return []
  
  // 获取所有语言和类型组合可用的难度选项
  const availableOptions = new Set()
  
  // 如果有选中的语言和类型
  if (activeFilters.value.languages.length > 0 && activeFilters.value.categories.length > 0) {
    activeFilters.value.languages.forEach(language => {
      activeFilters.value.categories.forEach(category => {
        const combinedOptions = options[`${language}_${category}`] || {}
        Object.values(combinedOptions).forEach(option => {
          if (option && !option.disabled && option.availableIn?.includes('custom')) {
            availableOptions.add(JSON.stringify(option))
          }
        })
      })
    })
  } else {
    Object.values(options).forEach(difficultySet => {
      if (difficultySet) {
        Object.values(difficultySet).forEach(option => {
          if (option && !option.disabled && option.availableIn?.includes('custom')) {
            availableOptions.add(JSON.stringify(option))
          }
        })
      }
    })
  }
  
  // 转换回对象数组并去重
  return Array.from(availableOptions)
    .map(optionStr => JSON.parse(optionStr))
    .map(option => ({
      value: option.value,
      label: option.label,
      icon: option.icon,
      disabled: !option.availableIn?.includes('custom')
    }))
})

// 初始化选项
onMounted(async () => {
  const token = localStorage.getItem('token')
  if (token) {
    try {
      // 1. 初始化语言选项
      await languageOptionsState.value.initialize()
      
      // 2. 获取所有可用语言
      const availableLanguages = Object.values(languageOptionsState.value.options)
        .filter(option => !option.disabled && option.availableIn.includes('custom'))
        .map(option => option.value)
      
      console.log('Available languages:', availableLanguages)
      
      // 3. 为每个语言加载类型选项并处理响应
      const categoryResults = await Promise.all(
        availableLanguages.map(async language => {
          try {
            const response = await fetchCategoriesByLanguage(language)
            
            // 使用正确的转换函数
            const formattedOptions = convertCategoryOptions(response)
            categoryOptionsState.value.options[language] = formattedOptions
            
            return {
              language,
              categories: response
                .filter(category => category.available)
                .map(category => category.code)
            }
          } catch (error) {
            console.error(`Error fetching categories for ${language}:`, error)
            return {
              language,
              categories: []
            }
          }
        })
      )
      
      // 4. 整理类型数据
      const availableCategories = {}
      categoryResults.forEach(({ language, categories }) => {
        availableCategories[language] = categories
      })
      
      // 5. 为每个语言和类型组合加载难度选项
      const loadDifficultyPromises = []
      Object.entries(availableCategories).forEach(([language, categories]) => {
        categories.forEach(category => {
          loadDifficultyPromises.push(
            (async () => {
              try {
                const response = await fetchDifficultiesByLanguageAndCategory(language, category)
                
                // 将字符串数组转换为所需的格式
                const formattedOptions = convertDifficultyOptions(response)
                difficultyOptionsState.value.options[`${language}_${category}`] = formattedOptions
                
                return { 
                  language, 
                  category, 
                  difficulties: response 
                }
              } catch (error) {
                console.error(`Error fetching difficulties for ${language}_${category}:`, error)
                return { 
                  language, 
                  category, 
                  difficulties: [] 
                }
              }
            })()
          )
        })
      })
      
      const difficultyResults = await Promise.all(loadDifficultyPromises)
      
      // 6. 整理难度数据
      const availableDifficulties = {}
      difficultyResults.forEach(({ language, category, difficulties }) => {
        const key = `${language}_${category}`
        availableDifficulties[key] = difficulties
      })
      
      console.log('Available difficulties by language and category:', availableDifficulties)
      
    } catch (error) {
      console.error('Error loading options:', error)
    }
  }
})

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

const currentPage = ref(1)
const pageSize = ref(8) // 每页显示8个房间，即2行4列

// 添加分页相关的计算属性
const totalPages = computed(() => Math.ceil(displayRooms.value.length / pageSize.value))

// 当前页显示的房间
const paginatedRooms = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return displayRooms.value.slice(start, end)
})

// 分页处理方法
const handlePageChange = (page) => {
  currentPage.value = page
}

// 监听筛选条件变化，重置页码
watch([searchQuery, activeFilters], () => {
  currentPage.value = 1
})

// 添加刷新相关的状态
const isRefreshing = ref(false)
const lastRefreshTime = ref(0)

// 处理刷新
const handleRefresh = async () => {
  const now = Date.now()
  const cooldown = 2000 // 2秒冷却时间
  
  // 检查是否在冷却中
  if (isRefreshing.value || (now - lastRefreshTime.value) < cooldown) {
    return
  }

  try {
    isRefreshing.value = true
    await fetchRooms()
    lastRefreshTime.value = Date.now()
  } finally {
    // 2秒后重置刷新状态
    setTimeout(() => {
      isRefreshing.value = false
    }, cooldown)
  }
}
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
  backdrop-filter: blur(10px);
  width: 100%;
  box-sizing: border-box;
}

.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  width: 100%;
  align-items: start;
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
  gap: 0.5rem;
  margin: 0 2rem;
  flex: 1;
  max-width: 500px;
}

.search-input-wrapper {
  flex: 1;
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
  min-width: 500px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  gap: 1.5rem;
}

.filter-header {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.filter-title {
  font-weight: 600;
  color: #e4e4e4;
  margin: 0;
  padding: 0;
  border: none;
}

.clear-filters-btn {
  position: absolute;
  top: 0;
  right: 0;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.clear-filters-btn:hover {
  color: #ef4444;
}

.clear-filters-btn i {
  font-size: 0.875rem;
}

.filter-section {
  flex: 1;
  min-width: 120px;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.filter-options::-webkit-scrollbar {
  width: 6px;
}

.filter-options::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.filter-options::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.filter-options::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.filter-options label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.375rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.filter-options label:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.filter-options input[type="checkbox"] {
  accent-color: #4f46e5;
  width: 14px;
  height: 14px;
}

.filter-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.75rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-menu {
    flex-direction: column;
    min-width: 280px;
    gap: 1rem;
  }

  .filter-section {
    min-width: 100%;
  }

  .clear-filters-btn {
    position: static;
    margin-left: auto;
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1rem;
  gap: 1rem;
}

.page-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: rgba(79, 70, 229, 0.2);
  border-color: #4f46e5;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.5rem;
}

.page-number {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-number:hover {
  background: rgba(79, 70, 229, 0.2);
  border-color: #4f46e5;
}

.page-number.active {
  background: #4f46e5;
  border-color: #4f46e5;
}

/* 调整房间网格的最小高度，确保分页位置稳定 */
.rooms-grid {
  min-height: 520px; /* 约等于两行房间的高度 */
}

@media (max-width: 768px) {
  .page-numbers {
    display: none;
  }
  
  .pagination {
    gap: 0.5rem;
  }
}

.refresh-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(79, 70, 229, 0.1);
  border-color: #4f46e5;
  color: #4f46e5;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 旋转动画 */
.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>