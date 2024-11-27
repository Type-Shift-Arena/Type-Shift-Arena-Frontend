import { ref } from 'vue'
import { Client } from '@stomp/stompjs'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '@/config'

// 添加全局连接状态管理
const globalStompClient = ref(null)
const globalSubscriptions = ref(new Map())

export function useWebSocket(roomId) {
  const router = useRouter()
  const stompClient = ref(null)
  const connectionStatus = ref('未连接')
  const connectionTime = ref('')
  const connectionLogs = ref([])
  const subscriptions = ref(new Map())

  // 检查房间状态
  const checkRoomStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/status`)
      if (response.status === 404) {
        return { exists: false, players: [] }
      }
      if (!response.ok) {
        throw new Error('获取房间状态失败')
      }
      const data = await response.json()
      return { exists: true, ...data }
    } catch (error) {
      console.error('检查房间状态时出错:', error)
      return { exists: false, players: [] }
    }
  }

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
        
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const wsUrl = `${wsProtocol}//${window.location.hostname}:9090/ws`
        const ws = new WebSocket(wsUrl)
        
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
    // 清理所有订阅
    subscriptions.value.forEach((subscription, key) => {
      subscription.unsubscribe()
      console.log(`[WebSocket] 已取消订阅: ${key}`)
    })
    subscriptions.value.clear()

    if (stompClient.value?.connected) {
      stompClient.value.deactivate()
      console.log('[WebSocket] 已断开连接')
    }
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
        const roomSubscription = subscribeToRoom(message.roomId)
        console.log('[Matchmaking] 已订阅房间广播消息:', roomSubscription)
        
        // 2. 订阅个人房间信息（对手状态等）
        const roomInfoSubscription = subscribeToRoomInfo(message.playerId)
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

  // 添加房间订阅函数
  const subscribeToRoom = (roomId) => {
    // 检查全局订阅
    if (globalSubscriptions.value.has(`room_${roomId}`)) {
      console.log(`[Room] 复用房间 ${roomId} 的现有订阅`)
      return globalSubscriptions.value.get(`room_${roomId}`)
    }

    // 检查WebSocket连接
    if (!stompClient.value?.connected) {
      console.error('[Room] WebSocket未连接，无法订阅房间消息')
      return
    }
    
    console.log(`[Room] 开始订阅房间消息: /topic/room/${roomId}`)
    
    // 订阅房间消息
    const subscription = stompClient.value.subscribe(`/topic/room/${roomId}`, (response) => {
      const message = JSON.parse(response.body)
      console.log('[Room] 收到房间消息:', message)
      
      if (message.type === "GAME_START") {
        console.log('[Room] 游戏开始:', message)
        window.dispatchEvent(new CustomEvent('game-start', {
          detail: {
            targetText: message.targetText,
            startTime: message.startTime
          }
        }))
      }

      if (message.type === "PLAYER_PROGRESS") {
        console.log('[Room] 更新玩家进度:', message)
        window.dispatchEvent(new CustomEvent('game-progress', {
          detail: {
            playerId: message.playerId,
            percentage: message.percentage,
            stats: message.stats
          }
        }))
      }
    })

    // 同时保存到全局和本地
    globalSubscriptions.value.set(`room_${roomId}`, subscription)
    subscriptions.value.set(`room_${roomId}`, subscription)
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

  // 订阅个人房间信息
  const subscribeToRoomInfo = (playerId) => {
    const subscriptionKey = `room_info_${playerId}`
    
    if (globalSubscriptions.value.has(subscriptionKey)) {
      console.log(`[RoomInfo] 复用现有订阅: ${subscriptionKey}`)
      return globalSubscriptions.value.get(subscriptionKey)
    }
    
    if (!stompClient.value?.connected) {
      console.error('WebSocket未连接，无法订阅房间信息')
      return
    }

    console.log(`[RoomInfo] 开始订阅房间信息: /queue/room/${playerId}/info`)
    
    const subscription = stompClient.value.subscribe(`/queue/room/${playerId}/info`, (response) => {
      const message = JSON.parse(response.body)
      console.log('[RoomInfo] 收到房间信息:', message)
      
      if (message.type === "GAME_INFO") {
        console.log('[RoomInfo] 房间详情:', {
          room: {
            id: message.roomId,
            status: message.roomStatus,
            playersCount: message.playersCount,
            targetText: message.targetText,
            startTime: message.startTime
          },
          opponent: {
            name: message.opponentName,
            id: message.opponentId,
            avatar: message.opponentAvatar
          },
          myInfo: {
            name: message.playerName,
            id: message.playerId,
            avatar: message.playerAvatar,
            isHost: message.isHost
          },
          gameInfo: {
            language: message.language,
            category: message.category,
            difficulty: message.difficulty
          }
        })

        // 触发自定义事件，传递消息内容
        window.dispatchEvent(new CustomEvent('room-info', {
          detail: message
        }))
      }

      if (message.type === "PLAYER_READY") {
        window.dispatchEvent(new CustomEvent('player-ready', {
          detail: message
        }))
      }
    })

    globalSubscriptions.value.set(subscriptionKey, subscription)
    return subscription
  }

  // 请求房间信息的函数
  const requestRoomInfo = (roomId, playerId, playerName) => {
    if (!stompClient.value?.connected) {
      console.error('WebSocket未连接，无法请求房间信息')
      return
    }

    console.log(`[RoomInfo] 请求房间信息: roomId=${roomId}, playerId=${playerId}`)
    
    stompClient.value.publish({  // 使用 publish 替换 send
      destination: `/app/room/${roomId}/info`,  // 添加 /app 前缀
      body: JSON.stringify({
        type: "REQUEST_ROOM_INFO",
        roomId: roomId,
        playerId: playerId,
        playerName: playerName,
        timestamp: Date.now()
      })
    })
  }

  // 添加统一的订阅管理函数
  const getSubscription = (key) => {
    return globalSubscriptions.value.get(key)
  }

  const hasSubscription = (key) => {
    return globalSubscriptions.value.has(key)
  }

  const setSubscription = (key, subscription) => {
    globalSubscriptions.value.set(key, subscription)
  }

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
    subscribeToRoom,
    subscribeToRoomInfo,
    requestRoomInfo,
    getSubscription,
    hasSubscription,
    setSubscription
  }
}