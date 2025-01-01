import { ref } from 'vue'
import { Client } from '@stomp/stompjs'
import { useRouter } from 'vue-router'
import { WS_URL } from '@/config'
import { useGameState } from './useGameState'

// 添加全局连接状态管理
const globalStompClient = ref(null)
const globalSubscriptions = ref(new Map())
let gameState = useGameState(null, null)

export function useWebSocket(roomId) {
  const router = useRouter()
  const stompClient = ref(null)
  const connectionStatus = ref('未连接')
  const connectionTime = ref('')
  const connectionLogs = ref([])
  const subscriptions = ref(new Map())

  /* 
    WebSocket模块函数
    @Author: hiddenSharp429(zixian zhu)
  */
  // 连接 WebSocket
  const connectWebSocket = async () => {
    // 如果已经有全局连接，直接使用
    if (globalStompClient.value?.connected) {
      console.log('[WebSocket] 复用现有连接')
      stompClient.value = globalStompClient.value
      return globalStompClient.value
    }

    // 否则建立新连接
    console.log('[WebSocket] 建立新连接')
    return new Promise((resolve, reject) => {
      try {
        const playerId = localStorage.getItem('userId')
        if (!playerId) {
          reject(new Error('无法获取用户ID'))
          return
        }

        connectionStatus.value = '正在连接...'
        
        const ws = new WebSocket(WS_URL)
        
        setupWebSocketHandlers(ws)
        
        // 修改 setupStompClient 来处理连接成功
        const client = new Client({
          webSocketFactory: () => ws,
          debug: function (str) {
            console.log('[STOMP Debug]:', str)
          },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000
        })

        client.onConnect = () => {
          console.log('[STOMP] 连接成功')
          connectionStatus.value = '已连接'
          stompClient.value = client
          globalStompClient.value = client  // 保存到全局
          resolve(client)
        }

        client.onStompError = (frame) => {
          console.error('[STOMP] 错误:', frame)
          connectionStatus.value = '连接错误'
          reject(new Error('STOMP 连接错误'))
        }

        client.activate()
      } catch (error) {
        console.error('[连接错误]:', error)
        connectionStatus.value = '连接失败'
        reject(error)
      }
    })
  }

  // 设置 WebSocket 处理器
  const setupWebSocketHandlers = (ws) => {
    ws.onopen = () => {
      console.log('[WebSocket] 连接已打开')
      connectionStatus.value = '已连接'
      connectionTime.value = new Date().toLocaleTimeString()
    }

    ws.onclose = (event) => {
      console.log('[WebSocket] 连接已关闭:', event)
      connectionStatus.value = '已断开'
    }

    ws.onerror = (error) => {
      console.error('[WebSocket] 错误:', error)
      connectionStatus.value = '连接错误'
    }
  }

  // 设置 STOMP 客户端
  const setupStompClient = (ws) => {
    const client = new Client({
      webSocketFactory: () => ws,
      debug: (str) => console.log('[STOMP Debug]:', str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    })

    client.onConnect = frame => handleStompConnect(client, frame)
    client.onStompError = frame => handleStompError(frame)

    console.log('正在激活STOMP客户端...')
    client.activate()
    stompClient.value = client
  }

  // 处理 STOMP 连接成功
  const handleStompConnect = (client, frame) => {
    console.log('[STOMP] 连接成功:', frame)
    connectionStatus.value = '已连接'
    connectionTime.value = new Date().toLocaleTimeString()
    
    // 发布连接成功事件
    window.dispatchEvent(new CustomEvent('stomp-connected', { detail: { client } }))
  }

  // 处理 STOMP 错误
  const handleStompError = (frame) => {
    console.error('[STOMP] 错误:', frame)
    connectionStatus.value = '连接错误'
    connectionTime.value = ''
  }

  // 重新连接
  const reconnectWebSocket = () => {
    if (stompClient.value) {
      stompClient.value.deactivate()
    }
    setTimeout(connectWebSocket, 1000)
  }

  // 检查连接状态
  const checkConnection = () => {
    const isConnected = stompClient.value?.connected
    console.log('WebSocket 连接状态:', isConnected ? '正常' : '未连接')
    alert(`WebSocket ${isConnected ? '连接正常' : '未连接'}`)
    return isConnected
  }

  // 发送测试消息
  const sendTestMessage = () => {
    if (!checkConnection()) {
      connectWebSocket()
      return
    }

    stompClient.value.publish({
      destination: '/app/test',
      body: JSON.stringify({ message: 'Test message' })
    })
    console.log('测试消息已发送')
  }

  // 断开连接
  const disconnect = () => {
    try {
      // 清理所有订阅
      subscriptions.value.forEach((subscription, key) => {
        subscription.unsubscribe()
        console.log(`[WebSocket] 已取消订阅: ${key}`)
      })
      subscriptions.value.clear()

      // 清理全局订阅
      globalSubscriptions.value.forEach((subscription, key) => {
        subscription.unsubscribe()
        console.log(`[WebSocket] 已取消全局订阅: ${key}`)
      })
      globalSubscriptions.value.clear()

      if (stompClient.value?.connected) {
        stompClient.value.deactivate()
        console.log('[WebSocket] 已断开连接')
      }

      // 清理全局客户端
      if (globalStompClient.value?.connected) {
        globalStompClient.value.deactivate()
        globalStompClient.value = null
        console.log('[WebSocket] 已断开全局连接')
      }

      // 重置连接状态
      connectionStatus.value = '未连接'
      stompClient.value = null
    } catch (error) {
      console.error('[WebSocket] 断开连接时发生错误:', error)
      throw error
    }
  }
  /* 
    WebSocket模块函数 END
  */



  /*
    匹配模块函数 START
    @Author: hiddenSharp429(zixian zhu)
  */
  // 发起匹配请求
  const sendMatchRequest = (matchData) => {
    if (!stompClient.value?.connected) {
      console.error('WebSocket未连接，无法发起匹配')
      return
    }

    stompClient.value.publish({
      destination: '/app/matchmaking/queue',
      body: JSON.stringify({
        ...matchData,
        timestamp: Date.now()
      })
    })
  }
  
  // 发起取消匹配请求
  const sendCancelMatchRequest = (matchData) => {
    if (!stompClient.value?.connected) {
      console.error('WebSocket未连接，无法发起取消匹配')
      return
    }

    stompClient.value.publish({
      destination: '/app/matchmaking/cancel',
      body: JSON.stringify({ 
        ...matchData, 
        timestamp: Date.now() 
      })
    })
  }

  // 匹配订阅函数
  const subscribeToMatchmaking = (playerId) => {
    // 检查是否已存在订阅
    if (globalSubscriptions.value.has(`matchmaking_${playerId}`)) {
      console.log(`[Matchmaking] 复用现有订阅: matchmaking_${playerId}`)
      return globalSubscriptions.value.get(`matchmaking_${playerId}`)
    }

    if (!stompClient.value?.connected) {
      console.error('WebSocket未连接，无法订阅匹配')
      return
    }

    console.log(`[Matchmaking] 开始订阅匹配消息: /queue/matchmaking/${playerId}`)
    
    const subscription = stompClient.value.subscribe(`/queue/matchmaking/${playerId}`, (response) => {
      const message = JSON.parse(response.body)
      console.log('[Matchmaking] 收到匹配消息:', message)
      
      if (message.type === "MATCH_FOUND") {
        console.log('[Matchmaking] 匹配成功:', {
          roomId: message.roomId,
          opponent: {
            name: message.opponentName,
            id: message.opponentId,
            avatar: message.opponentAvatar
          },
          myInfo: {
            name: message.playerName,
            id: message.playerId,
            avatar: message.playerAvatar
          }
        })

        // 1. 订阅房间广播消息（游戏开始、结算等）
        const roomSubscription = subscribeToRoomBroadcast(message.roomId)
        console.log('[Matchmaking] 已订阅房间广播消息:', roomSubscription)
        
        // 2. 订阅个人房间信息（对手状态等）
        const roomInfoSubscription = subscribeToPlayerChannel(message.playerId)
        console.log('[Matchmaking] 已订阅个人房间信息:', roomInfoSubscription)
        
        // 3. 触发匹配成功事件
        window.dispatchEvent(new CustomEvent('match-found', { 
          detail: { 
            roomId: message.roomId,
            opponent: {
              name: message.opponentName,
              id: message.opponentId,
              avatar: message.opponentAvatar
            },
            gameInfo: {
              targetText: message.targetText,
              language: message.language,
              category: message.category,
              difficulty: message.difficulty
            }
          } 
        }))
      }
    })

    // 保存到全局订阅
    globalSubscriptions.value.set(`matchmaking_${playerId}`, subscription)
    return subscription
  }
  /*
    匹配模块函数 END
  */



  /*
    房间模块函数 START
    @Author: hiddenSharp429(zixian zhu)
  */
  // 订阅房间广播消息 (公共消息通道)
  const subscribeToRoomBroadcast = (roomId) => {
    const subscriptionKey = `room_broadcast_${roomId}`

    if (globalSubscriptions.value.has(subscriptionKey)) {
      console.log(`[RoomBroadcast] 复用现有订阅: ${subscriptionKey}`)
      return globalSubscriptions.value.get(subscriptionKey)
    }

    if (!stompClient.value?.connected) {
      console.error('WebSocket未连接，无法订阅房间广播')
      return
    }
    
    console.log(`[RoomBroadcast] 开始订阅房间消息: /topic/room/${roomId}`)
    
    const subscription = stompClient.value.subscribe(`/topic/room/${roomId}`, (response) => {
      const message = JSON.parse(response.body)
      console.log('[RoomBroadcast] 收到房间消息:', message)
      
      window.dispatchEvent(new CustomEvent('room-broadcast', {
        detail: message
      }))
    })
  
    globalSubscriptions.value.set(subscriptionKey, subscription)
    subscriptions.value.set(subscriptionKey, subscription)
    return subscription
  }

  // 订阅个人房间信息 (私有消息通道)
  const subscribeToPlayerChannel = (playerId) => {
    const subscriptionKey = `player_channel_${playerId}`
    
    if (globalSubscriptions.value.has(subscriptionKey)) {
      console.log(`[PlayerChannel] 复用现有订阅: ${subscriptionKey}`)
      return globalSubscriptions.value.get(subscriptionKey)
    }
    
    if (!stompClient.value?.connected) {
      console.error('WebSocket未连接，无法订阅房间信息')
      return
    }

    console.log(`[PlayerChannel] 开始订阅房间信息: /queue/room/${playerId}/info`)
    
    const subscription = stompClient.value.subscribe(`/queue/room/${playerId}/info`, (response) => {
      const message = JSON.parse(response.body)
      console.log('[PlayerChannel] 收到房间信息:', message)

      // // 处理房间创建消息
      // if (message.type == 'ROOM_CREATED') {
      //   console.log('[PlayerChannel] 处理房间创建消息')
      //   const roomId = message.roomId
      //   gameState = useGameState(roomId, stompClient)
      //   gameState.gameStatus.value = 'waiting'
      //   console.log('[PlayerChannel] 房间创建成功:', roomId)
      //   console.log('[PlayerChannel] 游戏状态:', gameState.gameStatus.value)
      // }

      // 所有消息都通过 player-channel 事件转发给 useGameState 处理
      window.dispatchEvent(new CustomEvent('player-channel', {
        detail: message
      }))
    })

    globalSubscriptions.value.set(subscriptionKey, subscription)
    subscriptions.value.set(subscriptionKey, subscription)
    return subscription
  }

  // 取消特定订阅
  const unsubscribe = (key) => {
    if (globalSubscriptions.value.has(key)) {
      globalSubscriptions.value.get(key).unsubscribe()
      globalSubscriptions.value.delete(key)
      console.log(`[WebSocket] 取消订阅: ${key}`)
    }
  }
  /*
    房间模块函数 END
  */



  /*
    订阅管理模块函数 START
    @Author: hiddenSharp429(zixian zhu)
  */
  // 获取订阅
  const getSubscription = (key) => {
    return globalSubscriptions.value.get(key)
  }

  const hasSubscription = (key) => {
    return globalSubscriptions.value.has(key)
  }

  const setSubscription = (key, subscription) => {
    globalSubscriptions.value.set(key, subscription)
  }
  /*
    订阅管理模块函数 END
  */

  return {
    stompClient,
    connectionStatus,
    connectionTime,
    connectionLogs,
    subscriptions,
    connectWebSocket,
    reconnectWebSocket,
    checkConnection,
    sendTestMessage,
    disconnect,
    subscribeToMatchmaking,
    sendMatchRequest,
    sendCancelMatchRequest,
    unsubscribe,
    subscribeToRoomBroadcast,
    subscribeToPlayerChannel,
    getSubscription,
    hasSubscription,
    setSubscription
  }
}