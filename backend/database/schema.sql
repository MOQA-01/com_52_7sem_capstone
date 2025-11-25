-- Jal Jeevan Mission - PostgreSQL with PostGIS Database Schema
-- This schema supports real-time IoT monitoring with spatial indexing

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- USERS AND AUTHENTICATION
-- ==========================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'operator', 'viewer', 'citizen')),
    full_name VARCHAR(100),
    phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- ==========================================
-- AUDIT LOGGING
-- ==========================================

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- ==========================================
-- ASSETS (Water Infrastructure)
-- ==========================================

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('pipeline', 'tank', 'pump', 'source', 'treatment_plant')),
    status VARCHAR(20) DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'critical', 'offline')),
    location GEOGRAPHY(Point, 4326) NOT NULL,
    region VARCHAR(50) NOT NULL,
    area VARCHAR(100) NOT NULL,
    address TEXT,
    capacity DECIMAL(10, 2),
    capacity_unit VARCHAR(20),
    installation_date DATE,
    last_maintenance DATE,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- R-tree Spatial Index for fast geospatial queries
CREATE INDEX idx_assets_location ON assets USING GIST(location);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_region ON assets(region);

-- ==========================================
-- IOT SENSORS
-- ==========================================

CREATE TABLE sensors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('flow', 'pressure', 'pH', 'turbidity', 'chlorine', 'level', 'temperature')),
    location GEOGRAPHY(Point, 4326) NOT NULL,
    region VARCHAR(50) NOT NULL,
    area VARCHAR(100) NOT NULL,
    asset_id UUID REFERENCES assets(id),
    status VARCHAR(20) DEFAULT 'normal' CHECK (status IN ('normal', 'warning', 'critical', 'offline')),
    current_value DECIMAL(10, 4),
    unit VARCHAR(20),
    min_threshold DECIMAL(10, 4),
    max_threshold DECIMAL(10, 4),
    calibration_date DATE,
    last_update TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- R-tree Spatial Index
CREATE INDEX idx_sensors_location ON sensors USING GIST(location);
CREATE INDEX idx_sensors_type ON sensors(type);
CREATE INDEX idx_sensors_status ON sensors(status);
CREATE INDEX idx_sensors_region ON sensors(region);
CREATE INDEX idx_sensors_asset ON sensors(asset_id);

-- ==========================================
-- SENSOR READINGS (Time-Series Data)
-- ==========================================

CREATE TABLE sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    sensor_id UUID REFERENCES sensors(id) ON DELETE CASCADE,
    value DECIMAL(10, 4) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    quality_score DECIMAL(3, 2) DEFAULT 1.0,
    is_anomaly BOOLEAN DEFAULT false,
    anomaly_score DECIMAL(5, 4),
    metadata JSONB
);

-- Optimized indexes for time-series queries
CREATE INDEX idx_readings_sensor_time ON sensor_readings(sensor_id, timestamp DESC);
CREATE INDEX idx_readings_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX idx_readings_anomaly ON sensor_readings(is_anomaly) WHERE is_anomaly = true;

-- Partition by month for better performance (example for 2024-2025)
CREATE TABLE sensor_readings_2024_12 PARTITION OF sensor_readings
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
CREATE TABLE sensor_readings_2025_01 PARTITION OF sensor_readings
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- ==========================================
-- ALERTS
-- ==========================================

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_id UUID REFERENCES sensors(id),
    asset_id UUID REFERENCES assets(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('critical', 'warning', 'info')),
    category VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    value DECIMAL(10, 4),
    threshold DECIMAL(10, 4),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    acknowledged_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id),
    metadata JSONB
);

CREATE INDEX idx_alerts_sensor ON alerts(sensor_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_type ON alerts(type);
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);

-- ==========================================
-- GRIEVANCES
-- ==========================================

CREATE TABLE grievances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grievance_number VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('leakage', 'no_water', 'quality', 'billing', 'pressure', 'other')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'assigned', 'in_progress', 'resolved', 'closed')),
    location GEOGRAPHY(Point, 4326),
    region VARCHAR(50),
    area VARCHAR(100),
    address TEXT,
    reported_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    attachments JSONB,
    metadata JSONB
);

CREATE INDEX idx_grievances_location ON grievances USING GIST(location);
CREATE INDEX idx_grievances_status ON grievances(status);
CREATE INDEX idx_grievances_category ON grievances(category);
CREATE INDEX idx_grievances_priority ON grievances(priority);
CREATE INDEX idx_grievances_created ON grievances(created_at DESC);

-- ==========================================
-- GRIEVANCE TIMELINE
-- ==========================================

CREATE TABLE grievance_timeline (
    id SERIAL PRIMARY KEY,
    grievance_id UUID REFERENCES grievances(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    user_id UUID REFERENCES users(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

CREATE INDEX idx_timeline_grievance ON grievance_timeline(grievance_id, timestamp);

-- ==========================================
-- ML MODELS AND PREDICTIONS
-- ==========================================

CREATE TABLE ml_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    version VARCHAR(20) NOT NULL,
    algorithm VARCHAR(50) NOT NULL,
    parameters JSONB,
    metrics JSONB,
    trained_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id)
);

CREATE TABLE anomaly_predictions (
    id BIGSERIAL PRIMARY KEY,
    sensor_id UUID REFERENCES sensors(id),
    reading_id BIGINT REFERENCES sensor_readings(id),
    model_id UUID REFERENCES ml_models(id),
    anomaly_score DECIMAL(5, 4) NOT NULL,
    is_anomaly BOOLEAN NOT NULL,
    confidence DECIMAL(3, 2),
    features JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_predictions_sensor ON anomaly_predictions(sensor_id, timestamp DESC);
CREATE INDEX idx_predictions_anomaly ON anomaly_predictions(is_anomaly) WHERE is_anomaly = true;

-- ==========================================
-- MQTT MESSAGE QUEUE
-- ==========================================

CREATE TABLE mqtt_messages (
    id BIGSERIAL PRIMARY KEY,
    topic VARCHAR(200) NOT NULL,
    payload JSONB NOT NULL,
    qos INTEGER DEFAULT 0,
    retained BOOLEAN DEFAULT false,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP
);

CREATE INDEX idx_mqtt_processed ON mqtt_messages(processed, received_at);
CREATE INDEX idx_mqtt_topic ON mqtt_messages(topic);

-- ==========================================
-- VIEWS FOR COMMON QUERIES
-- ==========================================

-- Real-time sensor status view
CREATE VIEW v_sensor_status AS
SELECT
    s.id,
    s.sensor_code,
    s.name,
    s.type,
    s.region,
    s.area,
    s.status,
    s.current_value,
    s.unit,
    s.min_threshold,
    s.max_threshold,
    s.last_update,
    ST_Y(s.location::geometry) as latitude,
    ST_X(s.location::geometry) as longitude,
    a.name as asset_name,
    COUNT(DISTINCT al.id) FILTER (WHERE al.status = 'active') as active_alerts
FROM sensors s
LEFT JOIN assets a ON s.asset_id = a.id
LEFT JOIN alerts al ON s.id = al.sensor_id
GROUP BY s.id, a.name;

-- Grievance summary view
CREATE VIEW v_grievance_summary AS
SELECT
    g.id,
    g.grievance_number,
    g.category,
    g.title,
    g.priority,
    g.status,
    g.region,
    g.area,
    g.created_at,
    g.resolved_at,
    ST_Y(g.location::geometry) as latitude,
    ST_X(g.location::geometry) as longitude,
    u1.full_name as reported_by_name,
    u2.full_name as assigned_to_name,
    EXTRACT(EPOCH FROM (COALESCE(g.resolved_at, CURRENT_TIMESTAMP) - g.created_at))/3600 as response_time_hours
FROM grievances g
LEFT JOIN users u1 ON g.reported_by = u1.id
LEFT JOIN users u2 ON g.assigned_to = u2.id;

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION get_distance_km(lat1 FLOAT, lon1 FLOAT, lat2 FLOAT, lon2 FLOAT)
RETURNS FLOAT AS $$
BEGIN
    RETURN ST_Distance(
        ST_MakePoint(lon1, lat1)::geography,
        ST_MakePoint(lon2, lat2)::geography
    ) / 1000.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update sensor status based on thresholds
CREATE OR REPLACE FUNCTION update_sensor_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_value IS NOT NULL THEN
        IF NEW.current_value < NEW.min_threshold * 0.5 OR NEW.current_value > NEW.max_threshold * 1.5 THEN
            NEW.status := 'critical';
        ELSIF NEW.current_value < NEW.min_threshold OR NEW.current_value > NEW.max_threshold THEN
            NEW.status := 'warning';
        ELSE
            NEW.status := 'normal';
        END IF;
    END IF;
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sensor_status
    BEFORE UPDATE OF current_value ON sensors
    FOR EACH ROW
    EXECUTE FUNCTION update_sensor_status();

-- Function to auto-create alerts on critical sensor readings
CREATE OR REPLACE FUNCTION create_alert_on_critical_reading()
RETURNS TRIGGER AS $$
DECLARE
    sensor_rec RECORD;
    alert_type VARCHAR(20);
    alert_msg TEXT;
BEGIN
    SELECT * INTO sensor_rec FROM sensors WHERE id = NEW.sensor_id;

    IF NEW.value < sensor_rec.min_threshold * 0.5 OR NEW.value > sensor_rec.max_threshold * 1.5 THEN
        alert_type := 'critical';
        alert_msg := format('Critical reading: %s at %s (Value: %s %s)',
            sensor_rec.type, sensor_rec.name, NEW.value, sensor_rec.unit);

        INSERT INTO alerts (sensor_id, type, category, message, value, threshold)
        VALUES (NEW.sensor_id, alert_type, sensor_rec.type, alert_msg, NEW.value, sensor_rec.max_threshold);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_alert
    AFTER INSERT ON sensor_readings
    FOR EACH ROW
    EXECUTE FUNCTION create_alert_on_critical_reading();

-- ==========================================
-- SEED DATA
-- ==========================================

-- Create default admin user (password: admin123 - CHANGE IN PRODUCTION)
INSERT INTO users (username, email, password_hash, role, full_name) VALUES
('admin', 'admin@jaljeevan.gov.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILuxW6G8K', 'admin', 'System Administrator'),
('operator', 'operator@jaljeevan.gov.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILuxW6G8K', 'operator', 'Field Operator'),
('viewer', 'viewer@jaljeevan.gov.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILuxW6G8K', 'viewer', 'Data Viewer');

-- Create ML model record for Isolation Forest
INSERT INTO ml_models (name, version, algorithm, parameters, metrics, trained_at, is_active) VALUES
('Isolation Forest Anomaly Detector', 'v1.0', 'isolation_forest',
 '{"n_estimators": 100, "contamination": 0.05, "max_samples": "auto"}',
 '{"precision": 0.942, "recall": 0.887, "f1_score": 0.913, "accuracy": 0.956}',
 CURRENT_TIMESTAMP, true);
