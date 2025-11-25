#!/bin/bash

###############################################################################
# Jal Jeevan Mission Platform - macOS Startup Script
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   Jal Jeevan Mission - Real-time IoT Platform            ║"
echo "║   macOS Quick Start                                      ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Create logs directory
mkdir -p logs

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo -e "${RED}✗ Homebrew not found!${NC}"
    echo -e "${YELLOW}Install Homebrew first: https://brew.sh${NC}"
    exit 1
fi

# Check and start PostgreSQL
echo -e "${BLUE}Checking PostgreSQL...${NC}"
if ! brew services list | grep postgresql@14 | grep started > /dev/null 2>&1; then
    if command -v pg_ctl &> /dev/null; then
        echo -e "${YELLOW}Starting PostgreSQL...${NC}"
        brew services start postgresql@14
        sleep 3
    else
        echo -e "${RED}✗ PostgreSQL not installed!${NC}"
        echo -e "${YELLOW}Run: brew install postgresql@14 postgis${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓ PostgreSQL is running${NC}"

# Check and start Redis
echo -e "${BLUE}Checking Redis...${NC}"
if ! brew services list | grep redis | grep started > /dev/null 2>&1; then
    if command -v redis-server &> /dev/null; then
        echo -e "${YELLOW}Starting Redis...${NC}"
        brew services start redis
        sleep 2
    else
        echo -e "${RED}✗ Redis not installed!${NC}"
        echo -e "${YELLOW}Run: brew install redis${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓ Redis is running${NC}"

# Check and start Mosquitto
echo -e "${BLUE}Checking Mosquitto MQTT...${NC}"
if ! brew services list | grep mosquitto | grep started > /dev/null 2>&1; then
    if command -v mosquitto &> /dev/null; then
        echo -e "${YELLOW}Starting Mosquitto...${NC}"
        brew services start mosquitto
        sleep 2
    else
        echo -e "${RED}✗ Mosquitto not installed!${NC}"
        echo -e "${YELLOW}Run: brew install mosquitto${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓ Mosquitto is running${NC}"

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo -e "${RED}✗ Backend directory not found!${NC}"
    echo -e "${YELLOW}Make sure you're in the project root directory${NC}"
    exit 1
fi

cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}! Virtual environment not found${NC}"
    echo -e "${BLUE}Creating virtual environment...${NC}"
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip > /dev/null 2>&1
    pip install -r requirements.txt
    echo -e "${GREEN}✓ Virtual environment created and dependencies installed${NC}"
else
    source venv/bin/activate
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}! .env file not found${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        # Update .env with macOS defaults
        sed -i '' "s/DB_USER=postgres/DB_USER=$USER/" .env
        sed -i '' "s/DB_PASSWORD=postgres/DB_PASSWORD=/" .env
        echo -e "${GREEN}✓ Created .env with macOS defaults${NC}"
    fi
fi

# Check database
echo -e "${BLUE}Checking database...${NC}"
if ! psql -lqt | cut -d \| -f 1 | grep -qw jal_jeevan_db; then
    echo -e "${YELLOW}! Database not found, creating...${NC}"
    createdb jal_jeevan_db
    psql jal_jeevan_db -c "CREATE EXTENSION IF NOT EXISTS postgis;" > /dev/null 2>&1
    psql jal_jeevan_db -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" > /dev/null 2>&1

    if [ -f "database/schema.sql" ]; then
        echo -e "${BLUE}Loading database schema...${NC}"
        psql jal_jeevan_db < database/schema.sql > /dev/null 2>&1
        echo -e "${GREEN}✓ Database created and schema loaded${NC}"
    fi
else
    echo -e "${GREEN}✓ Database exists${NC}"
fi

# Check ML model
echo -e "${BLUE}Checking ML model...${NC}"
if ls ml/models/anomaly_detector_*.pkl 1> /dev/null 2>&1; then
    echo -e "${GREEN}✓ ML model exists${NC}"
else
    echo -e "${YELLOW}! Training ML model (first time only, takes ~30 seconds)...${NC}"
    python -m ml.anomaly_detector > /dev/null 2>&1
    echo -e "${GREEN}✓ ML model trained${NC}"
fi

# Start backend
echo -e "\n${BLUE}Starting FastAPI backend...${NC}"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo -e "${BLUE}Waiting for backend to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ Backend failed to start${NC}"
        echo -e "${YELLOW}Check logs/backend.log for details${NC}"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    echo -n "."
    sleep 1
done

# Start frontend server
echo -e "\n${BLUE}Starting frontend server...${NC}"
python3 -m http.server 8080 > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 2

# Success message
echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}  ║   Platform is now running!                               ║${NC}"
echo -e "${GREEN}  ╚══════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}📱 Access URLs:${NC}"
echo -e "  Frontend:     ${GREEN}http://localhost:8080${NC}"
echo -e "  Backend API:  ${GREEN}http://localhost:8000${NC}"
echo -e "  API Docs:     ${GREEN}http://localhost:8000/docs${NC}"
echo -e "  Health:       ${GREEN}http://localhost:8000/health${NC}"

echo -e "\n${BLUE}🔐 Default Credentials:${NC}"
echo -e "  Username: ${YELLOW}admin${NC}"
echo -e "  Password: ${YELLOW}admin123${NC}"

echo -e "\n${BLUE}📊 Test the Platform:${NC}"
echo -e "  1. Open ${GREEN}http://localhost:8080${NC} in your browser"
echo -e "  2. Login with the credentials above"
echo -e "  3. Go to ${GREEN}IoT Monitoring${NC} page"
echo -e "  4. Click ${GREEN}Debug Panel${NC} button (bottom right)"
echo -e "  5. Click ${GREEN}Test DataManager${NC} to verify data"

echo -e "\n${BLUE}🧪 Test WebSocket (in browser console):${NC}"
echo -e "  ${YELLOW}wsClient.connect();${NC}"
echo -e "  ${YELLOW}wsClient.subscribe('sensor_data', console.log);${NC}"

echo -e "\n${BLUE}📝 Logs:${NC}"
echo -e "  Backend:  ${GREEN}tail -f logs/backend.log${NC}"
echo -e "  Frontend: ${GREEN}tail -f logs/frontend.log${NC}"

echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}\n"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${BLUE}Stopping services...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}✓ Services stopped${NC}"
    echo -e "${YELLOW}Note: PostgreSQL, Redis, and Mosquitto are still running as system services${NC}"
    echo -e "${YELLOW}To stop them: brew services stop postgresql@14 redis mosquitto${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Keep script running
wait
