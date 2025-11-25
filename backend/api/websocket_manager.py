"""
WebSocket Connection Manager for Real-time Data Broadcasting
"""
import json
import logging
from typing import List, Dict, Set
from fastapi import WebSocket
from datetime import datetime

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manage WebSocket connections and broadcast messages"""

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.subscriptions: Dict[WebSocket, Set[str]] = {}

    async def connect(self, websocket: WebSocket):
        """Accept and store new WebSocket connection"""
        await websocket.accept()
        self.active_connections.append(websocket)
        self.subscriptions[websocket] = set()
        logger.info(f"New WebSocket connection. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.subscriptions:
            del self.subscriptions[websocket]
        logger.info(f"WebSocket disconnected. Total: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send message to specific WebSocket connection"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            self.disconnect(websocket)

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        disconnected = []

        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to connection: {e}")
                disconnected.append(connection)

        # Remove disconnected clients
        for connection in disconnected:
            self.disconnect(connection)

    async def broadcast_to_subscribed(self, topic: str, message: dict):
        """Broadcast message only to clients subscribed to specific topic"""
        disconnected = []

        for connection in self.active_connections:
            if topic in self.subscriptions.get(connection, set()):
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to subscribed connection: {e}")
                    disconnected.append(connection)

        for connection in disconnected:
            self.disconnect(connection)

    def subscribe(self, websocket: WebSocket, topics: List[str]):
        """Subscribe WebSocket to specific topics"""
        if websocket in self.subscriptions:
            self.subscriptions[websocket].update(topics)
            logger.info(f"WebSocket subscribed to: {topics}")

    def unsubscribe(self, websocket: WebSocket, topics: List[str]):
        """Unsubscribe WebSocket from specific topics"""
        if websocket in self.subscriptions:
            self.subscriptions[websocket].difference_update(topics)
            logger.info(f"WebSocket unsubscribed from: {topics}")

    def get_connection_count(self) -> int:
        """Get number of active connections"""
        return len(self.active_connections)

    def get_subscriptions(self, websocket: WebSocket) -> Set[str]:
        """Get topics subscribed by WebSocket"""
        return self.subscriptions.get(websocket, set())
