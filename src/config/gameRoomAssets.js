/**
 * 游戏房间通用配置
 * @typedef {Object} GameOption
 * @property {string} label - 显示文本
 * @property {string} value - 选项值
 * @property {boolean} [disabled] - 是否禁用
 * @property {string} [icon] - Material Icon 名称
 * @property {string[]} [availableIn] - 可用的场景 ['matchmaking', 'custom']
 * @property {Object} [requirements] - 使用该选项所需条件
 * @property {number} [requirements.level] - 需要的用户等级
 * @property {string[]} [requirements.permissions] - 需要的权限
 */

import { ref, computed } from 'vue'
import { fetchAvailableLanguages, convertToGameOptions } from '@/api/modules/game/gameLanguages'
import { fetchCategoriesByLanguage, convertToGameOptions as convertCategoryOptions } from '@/api/modules/game/gameCategories'
import { fetchDifficultiesByLanguageAndCategory, convertToGameOptions as convertDifficultyOptions } from '@/api/modules/game/gameDifficulties'


/**
 * 语言选项配置
 */

// 使用 ref 创建响应式的语言选项
const _languageOptions = ref({})
const _loading = ref(true)
const _error = ref(null)

// 定义语言选项函数
const initializeLanguageOptions = async () => {
  if (!_loading.value && Object.keys(_languageOptions.value).length > 0) {
    return _languageOptions.value
  }

  try {
    _loading.value = true
    _error.value = null
    const languages = await fetchAvailableLanguages()
    _languageOptions.value = convertToGameOptions(languages)
  } catch (err) {
    console.error('Failed to initialize language options:', err)
    _error.value = err
    _languageOptions.value = {} // 降级为空对象
  } finally {
    _loading.value = false
  }
}

// 导出语言选项状态
export const languageOptionsState = computed(() => ({
  options: _languageOptions.value,
  loading: _loading.value,
  error: _error.value,
  refresh: initializeLanguageOptions,
  initialize: initializeLanguageOptions
}))


// 为了保持向后兼容，仍然导出 LANGUAGE_OPTIONS
export const LANGUAGE_OPTIONS = {
  chinese: {
    label: '中文',
    value: 'CHINESE',
    icon: 'translate',
    availableIn: ['matchmaking', 'custom']
  },
  english: {
    label: '英文',
    value: 'ENGLISH',
    icon: 'language',
    availableIn: ['matchmaking', 'custom']
  },
};

/**
 * 游戏类型配置
 */

// 使用 ref 创建响应式的类型选项
const _categoryOptions = ref({})
const _categoryLoading = ref(true)
const _categoryError = ref(null)

const initializeCategoryOptions = async (language) => {
  if (!language) {
    _categoryOptions.value = {}
    return
  }

  try {
    _categoryLoading.value = true
    _categoryError.value = null
    const categories = await fetchCategoriesByLanguage(language)
    _categoryOptions.value = convertCategoryOptions(categories)
  } catch (err) {
    console.error('Failed to initialize category options:', err)
    _categoryError.value = err
    _categoryOptions.value = {} // 降级为空对象
  } finally {
    _categoryLoading.value = false
  }
}

export const categoryOptionsState = computed(() => ({
  options: _categoryOptions.value,
  loading: _categoryLoading.value,
  error: _categoryError.value,
  refresh: initializeCategoryOptions
}))

// 为了保持向后兼容，仍然导出 CATEGORY_OPTIONS
export const CATEGORY_OPTIONS = {
  dailyChat: {
    label: '日常对话',
    value: 'DAILY_CHAT',
    icon: 'chat',
    availableIn: ['matchmaking', 'custom']
  },
  business: {
    label: '商务会话',
    value: 'BUSINESS',
    icon: 'business_center',
    availableIn: ['matchmaking', 'custom']
  },
  literature: {
    label: '文学作品',
    value: 'LITERATURE',
    icon: 'auto_stories',
    availableIn: ['matchmaking', 'custom']
  },
  programming: {
    label: '编程代码',
    value: 'PROGRAMMING',
    icon: 'code',
    availableIn: ['custom'],
    requirements: {
      level: 5
    }
  },
  custom: {
    label: '自定义文本',
    value: 'CUSTOM',
    icon: 'edit_note',
    availableIn: ['custom'],
    requirements: {
      permissions: ['create_custom_text']
    }
  }
};

/**
 * 难度等级配置
 */

// 使用 ref 创建响应式的难度选项
const _difficultyOptions = ref({})
const _difficultyLoading = ref(true)
const _difficultyError = ref(null)

const initializeDifficultyOptions = async (language, category) => {
  if (!language || !category) {
    _difficultyOptions.value = {}
    return
  }

  try {
    _difficultyLoading.value = true
    _difficultyError.value = null
    const difficulties = await fetchDifficultiesByLanguageAndCategory(language, category)
    _difficultyOptions.value = convertDifficultyOptions(difficulties)
  } catch (err) {
    console.error('Failed to initialize difficulty options:', err)
    _difficultyError.value = err
    _difficultyOptions.value = {} // 降级为空对象
  } finally {
    _difficultyLoading.value = false
  }
}

// 导出响应式的难度选项状态
export const difficultyOptionsState = computed(() => ({
  options: _difficultyOptions.value,
  loading: _difficultyLoading.value,
  error: _difficultyError.value,
  refresh: initializeDifficultyOptions
}))

// 为了保持向后兼容，仍然导出 DIFFICULTY_OPTIONS
export const DIFFICULTY_OPTIONS = {
  EASY: {
    label: '简单',
    value: 'EASY',
    availableIn: ['matchmaking', 'custom']
  },
  MEDIUM: {
    label: '中等',
    value: 'MEDIUM',
    availableIn: ['matchmaking', 'custom']
  },
  HARD: {
    label: '困难',
    value: 'HARD',
    availableIn: ['matchmaking', 'custom']
  }
}

/**
 * 游戏模式配置
 */
export const MODE_OPTIONS = {
  standard: {
    label: '标准模式',
    value: 'STANDARD',
    icon: 'speed',
    availableIn: ['matchmaking', 'custom']
  },
  timeAttack: {
    label: '限时模式',
    value: 'TIME_ATTACK',
    icon: 'timer',
    availableIn: ['custom']
  },
  practice: {
    label: '练习模式',
    value: 'PRACTICE',
    icon: 'school',
    availableIn: ['custom']
  }
};

/**
 * 默认选项配置
 */
export const DEFAULT_OPTIONS = {
  matchmaking: {
    language: 'CHINESE',
    category: 'DAILY_CHAT',
    difficulty: 'EASY',
    mode: 'STANDARD'
  },
  custom: {
    language: 'CHINESE',
    category: 'DAILY_CHAT',
    difficulty: 'EASY',
    mode: 'STANDARD'
  }
};

/**
 * 获取特定场景可用的选项
 * @param {Object} optionsObject - 选项配置对象
 * @param {string} scene - 场景 ('matchmaking' | 'custom')
 * @param {Object} userInfo - 用户信息对象
 * @param {number} userInfo.level - 用户等级
 * @param {string[]} userInfo.permissions - 用户权限
 * @returns {GameOption[]} 过滤后的选项数组
 */
export const getAvailableOptions = (optionsObject, scene, userInfo = { level: 0, permissions: [] }) => {
  // 确保 optionsObject 存在且不为空
  if (!optionsObject || typeof optionsObject !== 'object') {
    console.warn('Invalid options object:', optionsObject)
    return []
  }

  // 如果是语言选项且正在加载，返回空数组
  if (optionsObject === LANGUAGE_OPTIONS.value && _loading.value) {
    return []
  }

  return Object.values(optionsObject).filter(option => {
    // 确保 option 对象存在
    if (!option) return false

    // 检查 availableIn 属性
    if (!option.availableIn || !Array.isArray(option.availableIn)) return false
    if (!option.availableIn.includes(scene)) return false
    
    // 检查权限要求
    if (option.requirements?.level && userInfo.level < option.requirements.level) {
      return false
    }
    
    if (option.requirements?.permissions) {
      const hasAllPermissions = option.requirements.permissions.every(
        permission => userInfo.permissions.includes(permission)
      )
      if (!hasAllPermissions) return false
    }
    
    return true
  })
}

/**
 * 验证选项是否可用
 * @param {string} value - 选项值
 * @param {Object} optionsObject - 选项配置对象
 * @param {string} scene - 场景
 * @param {Object} userInfo - 用户信息
 * @returns {boolean} 是否可用
 */
export const isOptionAvailable = (value, optionsObject, scene, userInfo) => {
  const option = Object.values(optionsObject).find(opt => opt.value === value);
  if (!option) return false;
  
  return getAvailableOptions(optionsObject, scene, userInfo)
    .some(opt => opt.value === value);
};
