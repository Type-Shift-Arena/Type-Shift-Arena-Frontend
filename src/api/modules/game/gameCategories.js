/*
 * @Author: hiddenSharp429 z404878860@163.com
 * @Date: 2024-12-27 03:30:46
 */
import axios from '@/plugins/axios'

/**
 * @typedef {Object} GameCategory
 * @property {string} code - Category code
 * @property {string} name - Category name in uppercase
 * @property {string} displayName - Localized display name
 * @property {boolean} available - Whether the category is available
 */

/**
 * Fetches available categories for a specific language
 * @param {string} language - Language code (e.g., 'CHINESE', 'ENGLISH')
 * @returns {Promise<GameCategory[]>}
 */
export const fetchCategoriesByLanguage = async (language) => {
  try {
    const response = await axios.get(`/game/metadata/categories/${language}`)
    // console.log('Categories Response:', response)
    return response.data
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    throw error
  }
}

/**
 * Converts API category data to game room options format
 * @param {GameCategory[]} categories 
 * @returns {Object} Formatted category options
 */
export const convertToGameOptions = (categories) => {
  const options = {}
  categories.forEach(category => {
    options[category.code.toLowerCase()] = {
      label: category.displayName,
      value: category.code,
      icon: getCategoryIcon(category.code),
      availableIn: ['matchmaking', 'custom'],
      disabled: !category.available
    }
  })
  return options
}

// 添加一个辅助函数来获取类型图标
const getCategoryIcon = (code) => {
  const iconMap = {
    DAILY_CHAT: 'material-symbols:chat-bubble-outline',
    BUSINESS: 'material-symbols:business-center-outline',
    LITERATURE: 'material-symbols:auto-stories-outline',
    PROGRAMMING: 'material-symbols:code',
    CUSTOM: 'material-symbols:edit-note',
    NEWS: 'material-symbols:newspaper',
    ACADEMIC: 'material-symbols:school',
    TECHNOLOGY: 'material-symbols:devices',
    ENTERTAINMENT: 'material-symbols:movie',
    SPORTS: 'material-symbols:sports-soccer'
  }
  return iconMap[code] || 'material-symbols:category'
}