"""
Jal Jeevan Mission - FastAPI Backend Server
Real-time IoT monitoring with WebSocket support
"""
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional
import uvicorn

from config import settings
from mqtt.mqtt_client import MQTTClient
from ml.anomaly_detector import AnomalyDetector
from api.auth import router as auth_router, get_current_user
from api.sensors import router as sensors_router
from api.grievances import router as grievances_router
from api.assets import router as assets_router
from api.alerts import router as alerts_router
from api.websocket_manager import ConnectionManager

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global instances
mqtt_client = MQTTClient()
anomaly_detector = AnomalyDetector(model_path=settings.ML_MODEL_PATH)
ws_manager = ConnectionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("Starting Jal Jeevan Mission Platform...")

    try:
        # Connect to MQTT broker
        await mqtt_client.connect()

        # Start MQTT listener in background
        asyncio.create_task(mqtt_client.listen())

        # Load ML model if exists
        try:
            # Try to load latest model
            import glob
            models = glob.glob(f"{settings.ML_MODEL_PATH}/anomaly_detector_*.pkl")
            if models:
                latest_model = max(models)
                anomaly_detector.load_model(latest_model)
                logger.info(f"Loaded ML model: {latest_model}")
            else:
                logger.warning("No ML model found. Train a model first.")
        except Exception as e:
            logger.warning(f"Could not load ML model: {e}")

        logger.info("Platform started successfully")

    except Exception as e:
        logger.error(f"Startup error: {e}")
        raise

    yield

    # Shutdown
    logger.info("Shutting down platform...")
    await mqtt_client.disconnect()
    logger.info("Platform shutdown complete")

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(sensors_router, prefix="/api/sensors", tags=["Sensors"])
app.include_router(grievances_router, prefix="/api/grievances", tags=["Grievances"])
app.include_router(assets_router, prefix="/api/assets", tags=["Assets"])
app.include_router(alerts_router, prefix="/api/alerts", tags=["Alerts"])

# ==========================================
# ROOT ENDPOINTS
# ==========================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "mqtt_connected": mqtt_client.is_connected
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "mqtt": "connected" if mqtt_client.is_connected else "disconnected",
        "ml_model": "loaded" if anomaly_detector.model is not None else "not loaded"
    }

# ==========================================
# WEBSOCKET ENDPOINT
# ==========================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: Optional[str] = None):
    """
    WebSocket endpoint for real-time data streaming
    Sends sensor data, alerts, and system updates to connected clients
    """
    await ws_manager.connect(websocket)

    try:
        # Authenticate user (optional - implement token validation)
        # For now, accept all connections

        logger.info(f"WebSocket client connected. Total connections: {len(ws_manager.active_connections)}")

        # Send initial welcome message
        await ws_manager.send_personal_message({
            "type": "connection",
            "message": "Connected to Jal Jeevan Mission real-time stream",
            "timestamp": asyncio.get_event_loop().time()
        }, websocket)

        # Keep connection alive and handle incoming messages
        while True:
            data = await websocket.receive_text()

            # Handle client requests
            import json
            try:
                message = json.loads(data)
                if message.get("type") == "subscribe":
                    # Subscribe to specific topics
                    logger.info(f"Client subscribed to: {message.get('topics')}")
                elif message.get("type") == "ping":
                    # Respond to ping
                    await ws_manager.send_personal_message({"type": "pong"}, websocket)
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON from client: {data}")

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
        logger.info(f"WebSocket client disconnected. Total connections: {len(ws_manager.active_connections)}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)

# ==========================================
# MQTT MESSAGE HANDLER
# ==========================================

async def handle_sensor_data(topic: str, payload: dict):
    """Handle incoming sensor data from MQTT"""
    try:
        # Run anomaly detection
        if anomaly_detector.model is not None:
            prediction = anomaly_detector.predict_single(payload)

            if prediction.get('is_anomaly'):
                logger.warning(f"Anomaly detected: {prediction}")

                # Broadcast alert to WebSocket clients
                await ws_manager.broadcast({
                    "type": "anomaly_alert",
                    "data": prediction,
                    "timestamp": asyncio.get_event_loop().time()
                })

        # Broadcast sensor reading to all WebSocket clients
        await ws_manager.broadcast({
            "type": "sensor_data",
            "topic": topic,
            "data": payload,
            "timestamp": asyncio.get_event_loop().time()
        })

        # Store in database (implement database service)
        # await db_service.store_sensor_reading(payload)

    except Exception as e:
        logger.error(f"Error handling sensor data: {e}")

# Register MQTT callback
mqtt_client.register_callback("jjm/sensors/+/data", handle_sensor_data)

# ==========================================
# TESTING ENDPOINTS (Remove in production)
# ==========================================

@app.post("/api/test/simulate-sensor")
async def simulate_sensor_reading(sensor_id: str, sensor_type: str):
    """Simulate a sensor reading for testing"""
    from mqtt.mqtt_client import SensorDataSimulator

    simulator = SensorDataSimulator(mqtt_client)
    await simulator.simulate_sensor_reading(sensor_id, sensor_type)

    return {"message": f"Simulated reading for sensor {sensor_id}"}

@app.post("/api/test/train-ml-model")
async def train_ml_model():
    """Train the ML model with synthetic data"""
    from ml.anomaly_detector import generate_synthetic_training_data

    training_data = generate_synthetic_training_data(10000)
    metrics = anomaly_detector.train(training_data)

    # Save model
    model_path = anomaly_detector.save_model("v1.0")

    return {
        "message": "Model trained successfully",
        "metrics": metrics,
        "model_path": model_path
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        workers=1 if settings.DEBUG else settings.WORKERS
    )
