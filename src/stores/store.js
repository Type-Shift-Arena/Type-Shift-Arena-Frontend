import { reactive } from 'vue'

export const store = reactive({
  isLoggedIn: !!localStorage.getItem('token'),
  avatarUrl: localStorage.getItem('imgSrc'),
  nickname: localStorage.getItem('userName')
})