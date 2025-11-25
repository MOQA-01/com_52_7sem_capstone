"""
MQTT Client for Real-time IoT Sensor Communication
Handles incoming sensor data with security and reliability
"""
import asyncio
import json
import logging
from datetime import datetime
from typing import Callable, Optional
import aiomqtt
from config import settings

logger = logging.getLogger(__name__)

class MQTTClient:
    """Async MQTT client for IoT sensor communication"""

    def __init__(self):
        self.client: Optional[aiomqtt.Client] = None
        self.callbacks = {}
        self.is_connected = False

    async def connect(self):
        """Establish connection to MQTT broker"""
        try:
            self.client = aiomqtt.Client(
                hostname=settings.MQTT_BROKER_HOST,
                port=settings.MQTT_BROKER_PORT,
                username=settings.MQTT_USERNAME,
                password=settings.MQTT_PASSWORD,
                keepalive=settings.MQTT_KEEPALIVE,
                clean_session=False,  # Persistent session
                protocol=aiomqtt.ProtocolVersion.V311
            )

            await self.client.__aenter__()
            self.is_connected = True
            logger.info(f"Connected to MQTT broker at {settings.MQTT_BROKER_HOST}:{settings.MQTT_BROKER_PORT}")

            # Subscribe to all configured topics
            for topic in settings.MQTT_TOPICS:
                await self.client.subscribe(topic, qos=settings.MQTT_QOS)
                logger.info(f"Subscribed to topic: {topic}")

        except Exception as e:
            logger.error(f"Failed to connect to MQTT broker: {e}")
            self.is_connected = False
            raise

    async def disconnect(self):
        """Disconnect from MQTT broker"""
        if self.client:
            await self.client.__aexit__(None, None, None)
            self.is_connected = False
            logger.info("Disconnected from MQTT broker")

    def register_callback(self, topic_pattern: str, callback: Callable):
        """Register a callback function for a topic pattern"""
        self.callbacks[topic_pattern] = callback
        logger.info(f"Registered callback for topic pattern: {topic_pattern}")

    async def publish(self, topic: str, payload: dict, qos: int = 1, retain: bool = False):
        """Publish message to MQTT topic"""
        if not self.is_connected or not self.client:
            logger.error("Cannot publish: Not connected to MQTT broker")
            return False

        try:
            payload_json = json.dumps(payload)
            await self.client.publish(
                topic,
                payload=payload_json,
                qos=qos,
                retain=retain
            )
            logger.debug(f"Published to {topic}: {payload_json}")
            return True
        except Exception as e:
            logger.error(f"Failed to publish to {topic}: {e}")
            return False

    async def listen(self):
        """Listen for incoming MQTT messages"""
        if not self.is_connected or not self.client:
            logger.error("Cannot listen: Not connected to MQTT broker")
            return

        try:
            async for message in self.client.messages:
                await self._handle_message(message)
        except asyncio.CancelledError:
            logger.info("MQTT listener cancelled")
        except Exception as e:
            logger.error(f"Error in MQTT listener: {e}")

    async def _handle_message(self, message):
        """Handle incoming MQTT message"""
        try:
            topic = str(message.topic)
            payload = json.loads(message.payload.decode())

            logger.debug(f"Received message on {topic}: {payload}")

            # Route to appropriate callback
            if topic.startswith("jjm/sensors/") and "/data" in topic:
                await self._handle_sensor_data(topic, payload)
            elif topic.startswith("jjm/sensors/") and "/status" in topic:
                await self._handle_sensor_status(topic, payload)
            elif topic.startswith("jjm/alerts/"):
                await self._handle_alert(topic, payload)

            # Call registered callbacks
            for pattern, callback in self.callbacks.items():
                if self._topic_matches(topic, pattern):
                    await callback(topic, payload)

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON payload: {e}")
        except Exception as e:
            logger.error(f"Error handling message: {e}")

    async def _handle_sensor_data(self, topic: str, payload: dict):
        """Handle incoming sensor data"""
        # Extract sensor ID from topic (jjm/sensors/SENSOR_ID/data)
        parts = topic.split('/')
        if len(parts) >= 3:
            sensor_id = parts[2]
            logger.info(f"Sensor data from {sensor_id}: {payload}")

            # Add timestamp if not present
            if 'timestamp' not in payload:
                payload['timestamp'] = datetime.utcnow().isoformat()

            # Store in database (callback will handle this)
            # This will be implemented in the service layer

    async def _handle_sensor_status(self, topic: str, payload: dict):
        """Handle sensor status updates"""
        parts = topic.split('/')
        if len(parts) >= 3:
            sensor_id = parts[2]
            logger.info(f"Sensor status from {sensor_id}: {payload}")

    async def _handle_alert(self, topic: str, payload: dict):
        """Handle incoming alerts"""
        logger.warning(f"Alert received on {topic}: {payload}")

    @staticmethod
    def _topic_matches(topic: str, pattern: str) -> bool:
        """Check if topic matches pattern (supports + and # wildcards)"""
        topic_parts = topic.split('/')
        pattern_parts = pattern.split('/')

        if len(pattern_parts) != len(topic_parts) and '#' not in pattern:
            return False

        for i, pattern_part in enumerate(pattern_parts):
            if pattern_part == '#':
                return True
            if i >= len(topic_parts):
                return False
            if pattern_part != '+' and pattern_part != topic_parts[i]:
                return False

        return True


class SensorDataSimulator:
    """Simulate sensor data for testing (remove in production)"""

    def __init__(self, mqtt_client: MQTTClient):
        self.mqtt_client = mqtt_client
        self.sensor_types = {
            'flow': {'min': 0, 'max': 500, 'unit': 'L/min'},
            'pressure': {'min': 0, 'max': 10, 'unit': 'bar'},
            'pH': {'min': 6.0, 'max': 8.5, 'unit': 'pH'},
            'turbidity': {'min': 0, 'max': 5, 'unit': 'NTU'},
            'chlorine': {'min': 0.2, 'max': 5.0, 'unit': 'mg/L'},
            'level': {'min': 0, 'max': 100, 'unit': '%'}
        }

    async def simulate_sensor_reading(self, sensor_id: str, sensor_type: str):
        """Simulate a single sensor reading"""
        import random

        if sensor_type not in self.sensor_types:
            return

        config = self.sensor_types[sensor_type]

        # Generate realistic value with some anomalies (5% chance)
        is_anomaly = random.random() < 0.05

        if is_anomaly:
            # Anomalous value - outside normal range
            value = random.choice([
                random.uniform(config['min'], config['min'] + (config['max'] - config['min']) * 0.1),
                random.uniform(config['max'] * 0.9, config['max'])
            ])
        else:
            # Normal value
            value = random.uniform(
                config['min'] + (config['max'] - config['min']) * 0.2,
                config['max'] * 0.8
            )

        payload = {
            'sensor_id': sensor_id,
            'type': sensor_type,
            'value': round(value, 2),
            'unit': config['unit'],
            'timestamp': datetime.utcnow().isoformat(),
            'quality': random.uniform(0.95, 1.0) if not is_anomaly else random.uniform(0.5, 0.8)
        }

        topic = f"jjm/sensors/{sensor_id}/data"
        await self.mqtt_client.publish(topic, payload)

    async def run_simulation(self, num_sensors: int = 10, interval: int = 5):
        """Run continuous sensor simulation"""
        import random

        logger.info(f"Starting sensor simulation with {num_sensors} sensors")

        sensors = [
            {
                'id': f"S{str(i).zfill(4)}",
                'type': random.choice(list(self.sensor_types.keys()))
            }
            for i in range(1, num_sensors + 1)
        ]

        while True:
            for sensor in sensors:
                await self.simulate_sensor_reading(sensor['id'], sensor['type'])
            await asyncio.sleep(interval)
