# macOS Setup Guide - Jal Jeevan Mission Platform

Quick setup guide for macOS without Docker.

## Prerequisites

You'll need Homebrew package manager. If you don't have it:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## Step 1: Install Dependencies

```bash
# Install PostgreSQL with PostGIS
brew install postgresql@14 postgis

# Install Redis
brew install redis

# Install Mosquitto MQTT broker
brew install mosquitto

# Install Python 3.10+
brew install python@3.10

# Start services
brew services start postgresql@14
brew services start redis
brew services start mosquitto
```

## Step 2: Setup Database

```bash
# Create database
createdb jal_jeevan_db

# Enable PostGIS extension
psql jal_jeevan_db -c "CREATE EXTENSION postgis;"
psql jal_jeevan_db -c "CREATE EXTENSION \"uuid-ossp\";"

# Run schema
psql jal_jeevan_db < backend/database/schema.sql
```

## Step 3: Configure MQTT

```bash
# Create MQTT config directory
mkdir -p /opt/homebrew/etc/mosquitto/conf.d

# Create password file
mosquitto_passwd -c /opt/homebrew/etc/mosquitto/passwd jjm_user
# Enter password: jjm_mqtt_password

# Create config file
cat > /opt/homebrew/etc/mosquitto/conf.d/jjm.conf << 'EOF'
listener 1883
allow_anonymous false
password_file /opt/homebrew/etc/mosquitto/passwd
persistence true
persistence_location /opt/homebrew/var/mosquitto/
log_dest file /opt/homebrew/var/log/mosquitto.log
log_type all
EOF

# Restart mosquitto
brew services restart mosquitto
```

## Step 4: Setup Python Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

Edit `.env` file:

```env
# Database (default macOS PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jal_jeevan_db
DB_USER=$USER
DB_PASSWORD=

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# MQTT
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883
MQTT_USERNAME=jjm_user
MQTT_PASSWORD=jjm_mqtt_password

# Security (generate new secret key)
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
```

## Step 5: Train ML Model

```bash
# Make sure you're in backend directory with venv activated
python -m ml.anomaly_detector
```

This will train the Isolation Forest model and save it to `backend/ml/models/`.

## Step 6: Start Backend

```bash
# From backend directory with venv activated
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Keep this terminal running.

## Step 7: Start Frontend

Open a new terminal:

```bash
cd /Users/moqa/Desktop/gis/jal-jeevan-platform
python3 -m http.server 8080
```

## Step 8: Access Platform

Open your browser:
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

**Login credentials:**
- Username: `admin`
- Password: `admin123`

## Verify Installation

### Test Backend

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "mqtt": "connected",
  "ml_model": "loaded"
}
```

### Test Authentication

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

Should return JWT tokens.

### Test MQTT

```bash
# Terminal 1 - Subscribe
mosquitto_sub -h localhost -t "#" -v -u jjm_user -P jjm_mqtt_password

# Terminal 2 - Publish
mosquitto_pub -h localhost -t "jjm/sensors/S0001/data" \
  -u jjm_user -P jjm_mqtt_password \
  -m '{"sensor_id":"S0001","type":"flow","value":250.5,"unit":"L/min"}'
```

### Test WebSocket

Open browser console on http://localhost:8080 and run:

```javascript
wsClient.connect();
wsClient.subscribe('sensor_data', (data) => console.log('Sensor data:', data));
```

## Simulate IoT Sensors

Open http://localhost:8080/iot-monitoring.html and:
1. Click the "Debug Panel" button (bottom right)
2. Click "Test DataManager" to verify data loading
3. Use the main page to see sensor simulations

Or via API:

```bash
curl -X POST "http://localhost:8000/api/test/simulate-sensor?sensor_id=S0001&sensor_type=flow"
```

## Stop Services

```bash
# Stop brew services
brew services stop postgresql@14
brew services stop redis
brew services stop mosquitto

# Stop backend (Ctrl+C in terminal)
# Stop frontend (Ctrl+C in terminal)
```

## Troubleshooting

### PostgreSQL connection failed

```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL
brew services start postgresql@14

# Check connection
psql -d jal_jeevan_db -c "SELECT 1;"
```

### MQTT connection failed

```bash
# Check if Mosquitto is running
brew services list | grep mosquitto

# Check logs
tail -f /opt/homebrew/var/log/mosquitto.log

# Test connection
mosquitto_sub -h localhost -t test -u jjm_user -P jjm_mqtt_password
```

### Backend won't start

```bash
# Check if port 8000 is in use
lsof -i :8000

# Check logs
tail -f backend/logs/jjm_platform.log

# Activate virtual environment
cd backend
source venv/bin/activate
```

### Frontend won't start

```bash
# Check if port 8080 is in use
lsof -i :8080

# Use different port
python3 -m http.server 8081
```

## Easy Startup Script for macOS

Create `start-mac.sh`:

```bash
#!/bin/bash

echo "🌊 Starting Jal Jeevan Mission Platform..."

# Start services if not running
brew services start postgresql@14
brew services start redis
brew services start mosquitto

# Wait for services
sleep 3

# Start backend in background
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 5

# Start frontend in background
python3 -m http.server 8080 > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

echo "✅ Platform started!"
echo ""
echo "Frontend:  http://localhost:8080"
echo "Backend:   http://localhost:8000"
echo "API Docs:  http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop..."

# Trap Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped'; exit 0" INT

wait
```

Make it executable:
```bash
chmod +x start-mac.sh
./start-mac.sh
```

## What's Next?

1. ✅ Open http://localhost:8080 and login
2. ✅ Explore the IoT Monitoring page with real-time data
3. ✅ Test WebSocket connections in browser console
4. ✅ View API documentation at http://localhost:8000/docs
5. ✅ Check the debug panel for testing features

---

**All set! Your real-time IoT platform is now running on macOS.**
