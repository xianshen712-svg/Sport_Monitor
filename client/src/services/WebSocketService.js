import { ref, onUnmounted } from 'vue';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.heartbeatInterval = null;
    this.listeners = new Map();
    this.connectionStatus = ref('disconnected');
    this.lastHeartbeat = ref(null);
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    // 使用后端服务器的端口3001，而不是前端端口
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const hostname = window.location.hostname;
    const wsUrl = `${protocol}//${hostname}:3001/ws`;
    
    console.log('Connecting to WebSocket:', wsUrl);
    this.connectionStatus.value = 'connecting';
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.connectionStatus.value = 'connected';
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.notifyListeners('connected', {});
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          // 处理心跳响应
          if (data.type === 'heartbeat') {
            this.lastHeartbeat.value = new Date();
            return;
          }
          
          // 通知所有监听器
          this.notifyListeners('message', data);
          
          // 特定类型消息的通知
          if (data.type) {
            this.notifyListeners(data.type, data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connectionStatus.value = 'error';
        this.notifyListeners('error', { error });
      };
      
      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        this.connectionStatus.value = 'disconnected';
        this.stopHeartbeat();
        this.notifyListeners('disconnected', { code: event.code, reason: event.reason });
        
        // 尝试重连
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            console.log(`Reconnecting attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            this.connect();
          }, this.reconnectDelay);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.connectionStatus.value = 'error';
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnected');
      this.ws = null;
    }
    this.stopHeartbeat();
    this.connectionStatus.value = 'disconnected';
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'heartbeat', timestamp: Date.now() });
      }
    }, 30000); // 每30秒发送一次心跳
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    } else {
      console.warn('WebSocket not connected, cannot send message');
      return false;
    }
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    // 返回取消订阅的函数
    return () => {
      this.unsubscribe(event, callback);
    };
  }

  unsubscribe(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  getConnectionStatus() {
    return this.connectionStatus;
  }

  getLastHeartbeat() {
    return this.lastHeartbeat;
  }

  isConnected() {
    return this.connectionStatus.value === 'connected';
  }
}

// 创建单例实例
const webSocketService = new WebSocketService();

// Vue 组合式函数
export function useWebSocket() {
  const connect = () => webSocketService.connect();
  const disconnect = () => webSocketService.disconnect();
  const send = (data) => webSocketService.send(data);
  const subscribe = (event, callback) => webSocketService.subscribe(event, callback);
  const connectionStatus = webSocketService.getConnectionStatus();
  const lastHeartbeat = webSocketService.getLastHeartbeat();
  const isConnected = () => webSocketService.isConnected();

  // 自动连接和清理
  onUnmounted(() => {
    webSocketService.disconnect();
  });

  return {
    connect,
    disconnect,
    send,
    subscribe,
    connectionStatus,
    lastHeartbeat,
    isConnected
  };
}

export default webSocketService;
