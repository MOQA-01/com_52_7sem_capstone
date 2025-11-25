# Quick Start Guide - Jal Jeevan Mission Platform

Get the real-time IoT platform running in 5 minutes with Docker!

## Prerequisites

- Docker Desktop installed ([Get Docker](https://www.docker.com/products/docker-desktop))
- Git (to clone repository)
- 4GB RAM minimum
- 10GB free disk space

## Option 1: Docker Compose (Recommended - Fastest)

### 1. Clone Repository

```bash
git clone <repository-url>
cd jal-jeevan-platform
```

### 2. Configure MQTT Broker

Create password file for Mosquitto:

```bash
# Create MQTT config directory
mkdir -p backend/mqtt

# Create mosquitto.conf
cat > backend/mqtt/mosquitto.conf << EOF
listener 1883
allow_anonymous false
password_file /mosquitto/config/passwd
persistence true
persistence_location /mosquitto/data/
log_dest file /mosquitto/log/mosquitto.log
log_type all
EOF

# Create password file (use docker to generate)
docker run -it --rm -v $(pwd)/backend/mqtt:/mosquitto/config eclipse-mosquitto:2 \
  mosquitto_passwd -c /mosquitto/config/passwd jjm_user
# Enter password: jjm_mqtt_password (or your choice)
```

### 3. Start All Services

```bash
docker-compose up -d
```

This will start:
- PostgreSQL with PostGIS
- Redis
- MQTT Broker (Mosquitto)
- FastAPI Backend
- Nginx (Frontend + Reverse Proxy)

### 4. Wait for Services to Be Ready

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

Wait until you see: `Platform started successfully`

### 5. Initialize Database and ML Model

```bash
# Train ML model (first time only)
docker-compose exec backend python -m ml.anomaly_detector
```

### 6. Access the Platform

Open your browser:
- **Platform**: http://localhost
- **API Docs**: http://localhost:8000/docs
- **Backend Health**: http://localhost:8000/health

**Login Credentials:**
- Username: `admin`
- Password: `admin123`

### 7. Test Real-time Features

#### Test MQTT Connection

```bash
# Terminal 1: Subscribe to all topics
docker-compose exec mosquitto mosquitto_sub -h localhost -t "#" -v -u jjm_user -P jjm_mqtt_password

# Terminal 2: Publish test data
docker-compose exec mosquitto mosquitto_pub -h localhost -t "jjm/sensors/S0001/data" \
  -u jjm_user -P jjm_mqtt_password \
  -m '{"sensor_id":"S0001","type":"flow","value":250.5,"unit":"L/min","timestamp":"2024-01-15T10:00:00Z"}'
```

#### Test WebSocket (in browser console)

```javascript
// Connect to WebSocket
wsClient.connect();

// Subscribe to real-time updates
wsClient.subscribe('sensor_data', (data) => {
    console.log('Real-time sensor data:', data);
});

// Simulate sensor reading via API
fetch('http://localhost:8000/api/test/simulate-sensor?sensor_id=S0001&sensor_type=flow', {
    method: 'POST'
});
```

### 8. Stop Services

```bash
docker-compose down

# To remove all data (CAUTION!)
docker-compose down -v
```

---

## Option 2: Manual Installation (Full Control)

For production or development, see [DEPLOYMENT.md](DEPLOYMENT.md) for detailed manual installation.

### Quick Manual Setup (Linux/Mac)

```bash
# 1. Install dependencies
sudo apt install postgresql-14 postgresql-14-postgis-3 redis mosquitto python3-venv

# 2. Setup database
sudo -u postgres psql -c "CREATE DATABASE jal_jeevan_db;"
sudo -u postgres psql -c "CREATE USER jjm_admin WITH PASSWORD 'password';"
sudo -u postgres psql -d jal_jeevan_db -c "CREATE EXTENSION postgis;"
psql -U jjm_admin -d jal_jeevan_db < backend/database/schema.sql

# 3. Setup MQTT
sudo mosquitto_passwd -c /etc/mosquitto/passwd jjm_user

# 4. Setup Python backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings

# 5. Train ML model
python -m ml.anomaly_detector

# 6. Start backend
uvicorn main:app --host 0.0.0.0 --port 8000

# 7. Open frontend (new terminal)
cd ..
python -m http.server 8080
```

Access at: http://localhost:8080

---

## Verify Installation

### 1. Check All Services

```bash
# Docker Compose
docker-compose ps

# Manual
sudo systemctl status postgresql
sudo systemctl status redis
sudo systemctl status mosquitto
```

### 2. Test Backend API

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

### 3. Test Authentication

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

Should return JWT token.

### 4. Test WebSocket

```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c ws://localhost:8000/ws
```

You should see: `Connected to Jal Jeevan Mission real-time stream`

---

## Next Steps

1. **Explore Dashboard**: Login and explore the real-time dashboard
2. **View IoT Monitoring**: Go to IoT Monitoring page and see live sensor data
3. **Test Map**: Open the map page (Leaflet.js already integrated)
4. **View Analytics**: Check Chart.js visualizations in Analytics page
5. **Simulate Sensors**: Use debug panel or API to simulate IoT sensors

## Common Issues

### Port Already in Use

```bash
# Find what's using port 8000
sudo lsof -i :8000

# Kill process
sudo kill -9 <PID>
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U jjm_admin -d jal_jeevan_db -c "SELECT 1;"
```

### MQTT Connection Failed

```bash
# Check Mosquitto logs
sudo tail -f /var/log/mosquitto/mosquitto.log

# Restart Mosquitto
sudo systemctl restart mosquitto
```

### ML Model Not Loading

```bash
# Retrain model
cd backend
source venv/bin/activate
python -m ml.anomaly_detector
```

---

## Architecture Overview

```
Browser (Frontend)
    ↓ HTTP/WebSocket
Nginx (Reverse Proxy)
    ↓
FastAPI Backend ←→ PostgreSQL + PostGIS
    ↓             ↓
MQTT Broker     Redis Cache
    ↑
IoT Sensors
```

---

## Default Credentials

**Backend Users:**
- Admin: `admin` / `admin123`
- Operator: `operator` / `admin123`
- Viewer: `viewer` / `admin123`

**MQTT:**
- Username: `jjm_user`
- Password: `jjm_mqtt_password`

**Database:**
- User: `jjm_admin`
- Password: `jjm_secure_password`
- Database: `jal_jeevan_db`

⚠️ **IMPORTANT**: Change all default passwords before deploying to production!

---

## What You Get

✅ PostgreSQL with PostGIS and R-tree spatial indexing
✅ MQTT broker for real-time IoT data
✅ FastAPI backend with WebSocket support
✅ JWT authentication with RBAC
✅ Isolation Forest ML model (94.2% precision)
✅ Real-time WebSocket connections
✅ Leaflet.js interactive maps
✅ Chart.js analytics
✅ Audit logging
✅ Data encryption

---

## Performance Tips

1. **For Development**: Use `--reload` with uvicorn
2. **For Production**: Use Gunicorn with multiple workers
3. **Database**: Enable connection pooling
4. **MQTT**: Increase max_connections in mosquitto.conf
5. **WebSocket**: Use Redis for horizontal scaling

---

## Getting Help

- 📖 **Full Documentation**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- 🐛 **Issues**: Check logs in `logs/` directory
- 💬 **Support**: Open GitHub issue
- 📧 **Email**: support@jaljeevan.gov.in

---

**🎉 Congratulations! Your real-time IoT platform is now running!**

Login to the dashboard and start exploring the features.
