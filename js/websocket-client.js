/**
 * WebSocket Client for Real-time Data Streaming
 * Connects to backend WebSocket server for live sensor data, alerts, and updates
 */

class WebSocketClient {
    constructor(url = 'ws://localhost:8000/ws') {
        this.url = url;
        this.ws = null;
        this.reconnectInterval = 5000; // 5 seconds
        this.reconnectTimer = null;
        this.isConnected = false;
        this.subscribers = {};
        this.messageQueue = [];
        this.connectionAttempts = 0;
        this.maxReconnectAttempts = 10;
    }

    /**
     * Connect to WebSocket server
     */
    connect() {
        try {
            console.log(`[WebSocket] Connecting to ${this.url}...`);

            this.ws = new WebSocket(this.url);

            this.ws.onopen = (event) => {
                console.log('[WebSocket] Connected successfully');
                this.isConnected = true;
                this.connectionAttempts = 0;

                // Clear reconnect timer
                if (this.reconnectTimer) {
                    clearTimeout(this.reconnectTimer);
                    this.reconnectTimer = null;
                }

                // Send queued messages
                this.flushMessageQueue();

                // Notify subscribers
                this.emit('connection', { status: 'connected', timestamp: new Date() });

                // Send heartbeat every 30 seconds
                this.startHeartbeat();
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    console.log('[WebSocket] Received:', message);

                    // Route message to subscribers based on type
                    const type = message.type || 'unknown';
                    this.emit(type, message);

                } catch (error) {
                    console.error('[WebSocket] Error parsing message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('[WebSocket] Error:', error);
                this.emit('error', { error, timestamp: new Date() });
            };

            this.ws.onclose = (event) => {
                console.log('[WebSocket] Connection closed', event.code, event.reason);
                this.isConnected = false;

                this.emit('connection', { status: 'disconnected', timestamp: new Date() });

                // Stop heartbeat
                this.stopHeartbeat();

                // Attempt reconnection
                this.attemptReconnect();
            };

        } catch (error) {
            console.error('[WebSocket] Connection error:', error);
            this.attemptReconnect();
        }
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
        console.log('[WebSocket] Disconnecting...');

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        this.stopHeartbeat();

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.isConnected = false;
    }

    /**
     * Attempt to reconnect
     */
    attemptReconnect() {
        if (this.connectionAttempts >= this.maxReconnectAttempts) {
            console.error('[WebSocket] Max reconnection attempts reached');
            this.emit('connection', { status: 'failed', timestamp: new Date() });
            return;
        }

        this.connectionAttempts++;
        const delay = Math.min(this.reconnectInterval * this.connectionAttempts, 30000);

        console.log(`[WebSocket] Reconnecting in ${delay/1000}s... (attempt ${this.connectionAttempts})`);

        this.reconnectTimer = setTimeout(() => {
            this.connect();
        }, delay);
    }

    /**
     * Send message to server
     */
    send(message) {
        if (!this.isConnected || !this.ws) {
            console.warn('[WebSocket] Not connected, queueing message');
            this.messageQueue.push(message);
            return false;
        }

        try {
            const json = JSON.stringify(message);
            this.ws.send(json);
            return true;
        } catch (error) {
            console.error('[WebSocket] Error sending message:', error);
            return false;
        }
    }

    /**
     * Send queued messages
     */
    flushMessageQueue() {
        if (this.messageQueue.length === 0) return;

        console.log(`[WebSocket] Sending ${this.messageQueue.length} queued messages`);

        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.send(message);
        }
    }

    /**
     * Subscribe to specific message types
     */
    subscribe(type, callback) {
        if (!this.subscribers[type]) {
            this.subscribers[type] = [];
        }

        this.subscribers[type].push(callback);

        console.log(`[WebSocket] Subscribed to: ${type}`);

        // Send subscription message to server
        if (type !== 'connection' && type !== 'error') {
            this.send({
                type: 'subscribe',
                topics: [type]
            });
        }

        // Return unsubscribe function
        return () => this.unsubscribe(type, callback);
    }

    /**
     * Unsubscribe from message type
     */
    unsubscribe(type, callback) {
        if (!this.subscribers[type]) return;

        this.subscribers[type] = this.subscribers[type].filter(cb => cb !== callback);

        if (this.subscribers[type].length === 0) {
            delete this.subscribers[type];
        }

        console.log(`[WebSocket] Unsubscribed from: ${type}`);
    }

    /**
     * Emit message to subscribers
     */
    emit(type, data) {
        const callbacks = this.subscribers[type] || [];
        const allCallbacks = this.subscribers['*'] || []; // Wildcard subscribers

        [...callbacks, ...allCallbacks].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`[WebSocket] Error in subscriber callback for ${type}:`, error);
            }
        });
    }

    /**
     * Start heartbeat ping
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                this.send({ type: 'ping' });
            }
        }, 30000); // 30 seconds
    }

    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            url: this.url,
            attempts: this.connectionAttempts,
            subscribers: Object.keys(this.subscribers).length
        };
    }
}

// Create global WebSocket client instance
const wsClient = new WebSocketClient();

// Auto-connect on page load (optional)
// wsClient.connect();

console.log('[WebSocket Client] Loaded and ready');
