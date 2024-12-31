/*
 * @Author: hiddenSharp429 z404878860@163.com
 * @Date: 2024-12-31 10:59:34
 */
/**
 * 游戏相关标签转换工具
 */

// 语言标签映射
const languageLabels = {
    'CHINESE': '中文',
    'ENGLISH': '英文'
  }
  
  // 分类标签映射
  const categoryLabels = {
    'DAILY_CHAT': '日常对话',
    'PROGRAMMING': '编程',
    'BUSINESS': '商务会话',
    'LITERATURE': '文学作品',
    'POETRY': '诗词歌赋',
    'TECH': '科技文章'
  }
  
  // 难度标签映射
  const difficultyLabels = {
    'EASY': '简单',
    'MEDIUM': '中等',
    'HARD': '困难'
  }
  
  /**
   * 获取语言标签
   * @param {string} language - 语言代码
   * @returns {string} 对应的语言标签
   */
  export const getLanguageLabel = (language) => {
    return languageLabels[language] || language
  }
  
  /**
   * 获取分类标签
   * @param {string} category - 分类代码
   * @returns {string} 对应的分类标签
   */
  export const getCategoryLabel = (category) => {
    return categoryLabels[category] || category
  }
  
  /**
   * 获取难度标签
   * @param {string} difficulty - 难度代码
   * @returns {string} 对应的难度标签
   */
  export const getDifficultyLabel = (difficulty) => {
    return difficultyLabels[difficulty] || difficulty
  }
  
  /**
   * 获取所有可用的语言选项
   * @returns {Object} 语言选项对象
   */
  export const getLanguageOptions = () => {
    return Object.entries(languageLabels).map(([value, label]) => ({
      label,
      value
    }))
  }
  
  /**
   * 获取所有可用的分类选项
   * @returns {Object} 分类选项对象
   */
  export const getCategoryOptions = () => {
    return Object.entries(categoryLabels).map(([value, label]) => ({
      label,
      value
    }))
  }
  
  /**
   * 获取所有可用的难度选项
   * @returns {Object} 难度选项对象
   */
  export const getDifficultyOptions = () => {
    return Object.entries(difficultyLabels).map(([value, label]) => ({
      label,
      value
    }))
  }