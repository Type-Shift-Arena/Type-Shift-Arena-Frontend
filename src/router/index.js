  /*
  * @Author: hiddenSharp429 z404878860@163.com
  * @Date: 2024-10-28 19:51:51
  */
  import { createRouter, createWebHistory } from 'vue-router'
  import Home from '@/components/Home.vue'
  import Auth from '@/components/Auth.vue'
  import TypingPractice from '@/components/TypingPractice.vue'
  import Layout from '@/layouts/Layout.vue'
  import Settings from '@/views/Settings.vue'
  import GameLobby from '@/views/GameLobby.vue'
  import MatchmakingLobby from '@/views/MatchmakingLobby.vue'
  import GameRoom from '@/views/GameRoom.vue'
  import Personal from '@/views/Personal.vue'

  const routes = [
    {
      path: '/',
      component: Layout,
      children: [
        {
          path: '',
          name: 'home',
          component: Home
        },
        {
          path: 'auth',
          name: 'auth',
          component: Auth
        },
        {
          path: '/room/:id?',
          name: 'room',
          component: GameRoom
        },
        {
          path: 'personal',
          name: 'personal',
          component: Personal
        },
        {
          path: 'settings',
          name: 'settings',
          component: Settings,
          meta: { requiresAuth: true }
        },
        {
          path: 'game-lobby',
          name: 'gameLobby',
          component: GameLobby,
          meta: { requiresAuth: true }
        },
        {
          path: 'typing-practice',
          name: 'typingPractice',
          component: TypingPractice,
          meta: { requiresAuth: true }
        },
        {
          path: 'macth-make-lobby',
          name: 'matchMakingLobby',
          component: MatchmakingLobby,
          meta: { requiresAuth: true }
        },
        // {
        //   path: 'game-lobby',
        //   name: 'gameLobby',
        //   component: () => import('@/components/GameLobby.vue'),
        //   meta: { requiresAuth: true }
        // },
        // {
        //   path: 'game-room/:id',
        //   name: 'gameRoom',
        //   component: () => import('@/components/GameRoom.vue'),
        //   meta: { requiresAuth: true }
        // }
      ]
    }
  ]

  const router = createRouter({
    history: createWebHistory(),
    routes
  })

  // 路由守卫
  router.beforeEach((to, from, next) => {
    if (to.matched.some(record => record.meta.requiresAuth)) {
      if (!localStorage.getItem('token')) {
        next('/auth')
      } else {
        next()
      }
    } else {
      next()
    }
  })

  export default router
