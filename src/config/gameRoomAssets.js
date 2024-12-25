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

/**
 * 语言选项配置
 */
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
export const DIFFICULTY_OPTIONS = {
  easy: {
    label: '简单',
    value: 'EASY',
    icon: 'sentiment_satisfied',
    availableIn: ['matchmaking', 'custom']
  },
  medium: {
    label: '中等',
    value: 'MEDIUM',
    icon: 'sentiment_neutral',
    availableIn: ['matchmaking', 'custom']
  },
  hard: {
    label: '困难',
    value: 'HARD',
    icon: 'sentiment_very_dissatisfied',
    availableIn: ['matchmaking', 'custom']
  },
  expert: {
    label: '专家',
    value: 'EXPERT',
    icon: 'psychology',
    availableIn: ['custom'],
    requirements: {
      level: 15
    }
  }
};

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
  return Object.values(optionsObject).filter(option => {
    // 检查是否在指定场景可用
    if (!option.availableIn?.includes(scene)) return false;
    
    // 检查等级要求
    if (option.requirements?.level && userInfo.level < option.requirements.level) {
      return false;
    }
    
    // 检查权限要求
    if (option.requirements?.permissions) {
      const hasAllPermissions = option.requirements.permissions.every(
        permission => userInfo.permissions.includes(permission)
      );
      if (!hasAllPermissions) return false;
    }
    
    return true;
  });
};

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
