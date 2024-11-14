import { ref } from 'vue'
import { Client } from '@stomp/stompjs'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '@/config'

export function useWebSocket(roomId) {
  const router = useRouter()
  const stompClient = ref(null)
  const connectionStatus = ref('未连接')
  const connectionTime = ref('')
  const connectionLogs = ref([])

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
  const connectWebSocket = () => {
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
          resolve(client) // 解析 Promise
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
    if (stompClient.value?.connected) {
      stompClient.value.publish({
        destination: `/app/room/${roomId}/leave`,
        body: JSON.stringify({
          type: 'PLAYER_LEAVE',
          playerId: localStorage.getItem('userId'),
          timestamp: new Date().toISOString()
        })
      })
      stompClient.value.deactivate()
    }
  }

  // 匹配订阅函数
  const subscribeToMatchmaking = (playerId) => {
    if (!stompClient.value?.connected) {
      console.error('WebSocket未连接，无法订阅匹配')
      return
    }

    return stompClient.value.subscribe(`/queue/matchmaking/${playerId}`, (response) => {
      const message = JSON.parse(response.body)
      if (message.type === "MATCH_FOUND") {
        router.push(`/room/${message.roomId}`)
      }
    })
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

  return {
    connectWebSocket,
    stompClient,
    connectionStatus,
    connectionTime,
    connectionLogs,
    connectWebSocket,
    reconnectWebSocket,
    checkConnection,
    sendTestMessage,
    disconnect,
    subscribeToMatchmaking,
    sendMatchRequest
  }
}