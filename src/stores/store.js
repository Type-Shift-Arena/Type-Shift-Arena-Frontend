import { reactive } from 'vue'

export const store = reactive({
  isLoggedIn: !!localStorage.getItem('token')
})