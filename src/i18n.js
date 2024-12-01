import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import zh from './locales/zh.json'

// 从 localStorage 获取保存的语言设置，如果没有则使用浏览器语言
const getDefaultLocale = () => {
  const savedLocale = localStorage.getItem('locale')
  if (savedLocale && ['en', 'zh'].includes(savedLocale)) {
    return savedLocale
  }
  
  // 获取浏览器语言设置
  const browserLang = navigator.language.toLowerCase()
  return browserLang.startsWith('zh') ? 'zh' : 'en'
}

// 创建 i18n 实例
const i18n = createI18n({
  legacy: false, // 使用 Composition API
  locale: getDefaultLocale(), // 使用获取到的默认语言
  fallbackLocale: 'en', // 如果某个翻译键不存在，回退到英语
  messages: {
    en,
    zh
  }
})

// 添加语言切换方法
export const setLocale = (locale) => {
  i18n.global.locale.value = locale
  localStorage.setItem('locale', locale)
  // 可以在这里添加更多的本地化逻辑，比如修改文档标题等
  document.querySelector('html').setAttribute('lang', locale)
}

// 初始化语言设置
setLocale(i18n.global.locale.value)

export default i18n
