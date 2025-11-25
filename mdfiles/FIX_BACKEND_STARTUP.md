# Fix Backend Startup Issues

## Issue Fixed: CORS_ORIGINS Parsing Error ✅

I've fixed the config.py to handle CORS_ORIGINS properly. Now you need to update your `.env` file.

## Quick Fix (Choose Option 1 or 2)

### Option 1: Recreate .env file (Recommended)

```bash
cd /Users/moqa/Desktop/gis/jal-jeevan-platform/backend

# Backup old .env
mv .env .env.backup

# Create new .env from example
cp .env.example .env

# Edit .env with your username
nano .env
```

Update these lines in `.env`:
```env
# Change this line:
DB_USER=postgres

# To your macOS username:
DB_USER=moqa

# And set empty password (for local macOS PostgreSQL):
DB_PASSWORD=
```

### Option 2: Quick command line fix

```bash
cd /Users/moqa/Desktop/gis/jal-jeevan-platform/backend

# Update DB_USER to your username
sed -i '' "s/DB_USER=postgres/DB_USER=$USER/" .env

# Remove password (local PostgreSQL doesn't need it)
sed -i '' "s/DB_PASSWORD=.*/DB_PASSWORD=/" .env

# Fix CORS_ORIGINS
sed -i '' "s/CORS_ORIGINS=.*/CORS_ORIGINS=*/" .env

# Add ML_MODEL_PATH if missing
echo "ML_MODEL_PATH=ml/models" >> .env
```

## Test the Fix

```bash
cd backend
source venv/bin/activate

# Test config loads
python -c "from config import settings; print('✅ Config OK')"

# Test database connection
psql jal_jeevan_db -c "SELECT 1;"
```

## Start the Backend

```bash
# From project root
./start-mac.sh
```

## Common Issues & Solutions

### Issue 1: "psql: connection refused"

**Fix: Start PostgreSQL**
```bash
brew services start postgresql@14
```

### Issue 2: "MQTT connection failed"

**Fix: Start Mosquitto and setup password**
```bash
brew services start mosquitto

# Setup MQTT password (if not done)
mosquitto_passwd -c /opt/homebrew/etc/mosquitto/passwd jjm_user
# Password: jjm_mqtt_password
```

### Issue 3: "ModuleNotFoundError"

**Fix: Reinstall dependencies**
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Issue 4: "Database does not exist"

**Fix: Create database**
```bash
createdb jal_jeevan_db
psql jal_jeevan_db -c "CREATE EXTENSION postgis;"
psql jal_jeevan_db -c "CREATE EXTENSION \"uuid-ossp\";"
psql jal_jeevan_db < backend/database/schema.sql
```

## Verify Everything Works

Run these checks:

```bash
# 1. Check PostgreSQL
brew services list | grep postgresql
psql jal_jeevan_db -c "SELECT version();"

# 2. Check Redis
brew services list | grep redis
redis-cli ping

# 3. Check Mosquitto
brew services list | grep mosquitto
mosquitto_pub -h localhost -t test -m "hello" -u jjm_user -P jjm_mqtt_password

# 4. Check Python environment
cd backend
source venv/bin/activate
python -c "import fastapi, pydantic_settings; print('✅ All imports OK')"
```

## Full Clean Start

If you want to start completely fresh:

```bash
# Stop all services
brew services stop postgresql@14 redis mosquitto

# Remove virtual environment
rm -rf backend/venv

# Remove .env
rm backend/.env

# Start fresh
./start-mac.sh
```

The script will recreate everything.

## What Was Changed

### File: backend/config.py

**Changes:**
1. Fixed `CORS_ORIGINS` to accept both string and list
2. Added validator to parse comma-separated CORS origins
3. Changed default `DB_PASSWORD` to empty string (for macOS local PostgreSQL)
4. Fixed `DATABASE_URL` to work without password
5. Fixed `ML_MODEL_PATH` to be relative path

**Result:** Backend now starts without CORS parsing errors.

## Next Steps

1. ✅ Run `./start-mac.sh`
2. ✅ Backend should start successfully
3. ✅ Access http://localhost:8080
4. ✅ Login with admin/admin123
5. ✅ Test the platform!

---

**If backend still won't start, check:** `tail -f logs/backend.log`
