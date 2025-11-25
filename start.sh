#!/bin/bash

###############################################################################
# Jal Jeevan Mission Platform - Startup Script
# This script starts all components of the real-time IoT platform
###############################################################################

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   Jal Jeevan Mission - Real-time IoT Platform            ║"
echo "║   Starting all services...                               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Docker is installed
if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✓ Docker Compose detected${NC}"
    USE_DOCKER=true
else
    echo -e "${YELLOW}! Docker Compose not found, using manual mode${NC}"
    USE_DOCKER=false
fi

###############################################################################
# DOCKER MODE
###############################################################################

if [ "$USE_DOCKER" = true ]; then
    echo -e "\n${BLUE}Starting services with Docker Compose...${NC}"

    # Check if MQTT config exists
    if [ ! -f "backend/mqtt/mosquitto.conf" ]; then
        echo -e "${YELLOW}! MQTT configuration not found${NC}"
        echo -e "${BLUE}Creating MQTT configuration...${NC}"

        mkdir -p backend/mqtt

        # Create mosquitto.conf
        cat > backend/mqtt/mosquitto.conf << 'EOF'
listener 1883
allow_anonymous false
password_file /mosquitto/config/passwd
persistence true
persistence_location /mosquitto/data/
log_dest file /mosquitto/log/mosquitto.log
log_type all
EOF

        echo -e "${GREEN}✓ MQTT configuration created${NC}"
        echo -e "${YELLOW}! Please run: docker run -it --rm -v \$(pwd)/backend/mqtt:/mosquitto/config eclipse-mosquitto:2 mosquitto_passwd -c /mosquitto/config/passwd jjm_user${NC}"
        echo -e "${YELLOW}! Then run this script again${NC}"
        exit 1
    fi

    # Start Docker Compose
    echo -e "${BLUE}Starting Docker containers...${NC}"
    docker-compose up -d

    # Wait for services
    echo -e "${BLUE}Waiting for services to be ready...${NC}"
    sleep 10

    # Check if backend is ready
    echo -e "${BLUE}Checking backend health...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Backend is ready!${NC}"
            break
        fi
        echo -n "."
        sleep 2
    done

    # Train ML model if not exists
    echo -e "\n${BLUE}Checking ML model...${NC}"
    if docker-compose exec -T backend ls ml/models/anomaly_detector_*.pkl > /dev/null 2>&1; then
        echo -e "${GREEN}✓ ML model exists${NC}"
    else
        echo -e "${YELLOW}! Training ML model (first time only)...${NC}"
        docker-compose exec -T backend python -m ml.anomaly_detector
        echo -e "${GREEN}✓ ML model trained${NC}"
    fi

    # Show status
    echo -e "\n${BLUE}Service Status:${NC}"
    docker-compose ps

    echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}  ║   Platform is now running!                               ║${NC}"
    echo -e "${GREEN}  ╚══════════════════════════════════════════════════════════╝${NC}"
    echo -e "\n${BLUE}Access URLs:${NC}"
    echo -e "  Frontend:     ${GREEN}http://localhost${NC}"
    echo -e "  Backend API:  ${GREEN}http://localhost:8000${NC}"
    echo -e "  API Docs:     ${GREEN}http://localhost:8000/docs${NC}"
    echo -e "  Health Check: ${GREEN}http://localhost:8000/health${NC}"
    echo -e "\n${BLUE}Default Credentials:${NC}"
    echo -e "  Username: ${YELLOW}admin${NC}"
    echo -e "  Password: ${YELLOW}admin123${NC}"
    echo -e "\n${YELLOW}To view logs: docker-compose logs -f${NC}"
    echo -e "${YELLOW}To stop: docker-compose down${NC}\n"

###############################################################################
# MANUAL MODE
###############################################################################

else
    echo -e "\n${BLUE}Starting services manually...${NC}"

    # Check if backend directory exists
    if [ ! -d "backend" ]; then
        echo -e "${RED}✗ Backend directory not found!${NC}"
        exit 1
    fi

    cd backend

    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}! Virtual environment not found, creating...${NC}"
        python3 -m venv venv
        source venv/bin/activate
        pip install --upgrade pip
        pip install -r requirements.txt
        echo -e "${GREEN}✓ Virtual environment created${NC}"
    else
        source venv/bin/activate
    fi

    # Check if .env exists
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}! .env file not found${NC}"
        if [ -f ".env.example" ]; then
            echo -e "${BLUE}Copying .env.example to .env...${NC}"
            cp .env.example .env
            echo -e "${YELLOW}! Please edit .env with your configuration${NC}"
            echo -e "${YELLOW}! Then run this script again${NC}"
            exit 1
        else
            echo -e "${RED}✗ .env.example not found!${NC}"
            exit 1
        fi
    fi

    # Check PostgreSQL
    echo -e "${BLUE}Checking PostgreSQL...${NC}"
    if ! systemctl is-active --quiet postgresql; then
        echo -e "${YELLOW}! PostgreSQL is not running${NC}"
        echo -e "${BLUE}Attempting to start PostgreSQL...${NC}"
        sudo systemctl start postgresql
    fi
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"

    # Check Redis
    echo -e "${BLUE}Checking Redis...${NC}"
    if ! systemctl is-active --quiet redis; then
        echo -e "${YELLOW}! Redis is not running${NC}"
        echo -e "${BLUE}Attempting to start Redis...${NC}"
        sudo systemctl start redis
    fi
    echo -e "${GREEN}✓ Redis is running${NC}"

    # Check Mosquitto
    echo -e "${BLUE}Checking Mosquitto MQTT...${NC}"
    if ! systemctl is-active --quiet mosquitto; then
        echo -e "${YELLOW}! Mosquitto is not running${NC}"
        echo -e "${BLUE}Attempting to start Mosquitto...${NC}"
        sudo systemctl start mosquitto
    fi
    echo -e "${GREEN}✓ Mosquitto is running${NC}"

    # Check ML model
    echo -e "${BLUE}Checking ML model...${NC}"
    if ls ml/models/anomaly_detector_*.pkl 1> /dev/null 2>&1; then
        echo -e "${GREEN}✓ ML model exists${NC}"
    else
        echo -e "${YELLOW}! Training ML model (first time only)...${NC}"
        python -m ml.anomaly_detector
        echo -e "${GREEN}✓ ML model trained${NC}"
    fi

    # Start backend
    echo -e "\n${BLUE}Starting FastAPI backend...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}\n"

    uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
    BACKEND_PID=$!

    # Wait for backend to be ready
    echo -e "${BLUE}Waiting for backend to start...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Backend is ready!${NC}"
            break
        fi
        echo -n "."
        sleep 2
    done

    # Start frontend server in background
    cd ..
    echo -e "\n${BLUE}Starting frontend server...${NC}"
    python3 -m http.server 8080 > /dev/null 2>&1 &
    FRONTEND_PID=$!

    sleep 2

    echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}  ║   Platform is now running!                               ║${NC}"
    echo -e "${GREEN}  ╚══════════════════════════════════════════════════════════╝${NC}"
    echo -e "\n${BLUE}Access URLs:${NC}"
    echo -e "  Frontend:     ${GREEN}http://localhost:8080${NC}"
    echo -e "  Backend API:  ${GREEN}http://localhost:8000${NC}"
    echo -e "  API Docs:     ${GREEN}http://localhost:8000/docs${NC}"
    echo -e "  Health Check: ${GREEN}http://localhost:8000/health${NC}"
    echo -e "\n${BLUE}Default Credentials:${NC}"
    echo -e "  Username: ${YELLOW}admin${NC}"
    echo -e "  Password: ${YELLOW}admin123${NC}"
    echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}\n"

    # Trap Ctrl+C to kill background processes
    trap "echo -e '\n${BLUE}Stopping services...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo -e '${GREEN}Services stopped${NC}'; exit 0" INT

    # Wait for Ctrl+C
    wait
fi
