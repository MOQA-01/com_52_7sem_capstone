// Mock Data Manager for Jal Jeevan Platform
// All data stored in localStorage for persistence

const DataManager = {
    // Initialize mock data if not present
    init() {
        if (!localStorage.getItem('jjm_initialized')) {
            this.resetAllData();
            localStorage.setItem('jjm_initialized', 'true');
        }
    },

    // Reset all data to mock defaults
    resetAllData() {
        localStorage.setItem('jjm_assets', JSON.stringify(this.getMockAssets()));
        localStorage.setItem('jjm_sensors', JSON.stringify(this.getMockSensors()));
        localStorage.setItem('jjm_grievances', JSON.stringify(this.getMockGrievances()));
        localStorage.setItem('jjm_activities', JSON.stringify(this.getMockActivities()));
        localStorage.setItem('jjm_alerts', JSON.stringify(this.getMockAlerts()));
    },

    // Asset Management
    getAssets() {
        return JSON.parse(localStorage.getItem('jjm_assets') || '[]');
    },

    addAsset(asset) {
        const assets = this.getAssets();
        assets.push(asset);
        localStorage.setItem('jjm_assets', JSON.stringify(assets));
    },

    // Sensor Management
    getSensors() {
        const sensors = JSON.parse(localStorage.getItem('jjm_sensors') || '[]');
        // If no sensors exist, initialize with mock data
        if (sensors.length === 0) {
            const mockSensors = this.getMockSensors();
            localStorage.setItem('jjm_sensors', JSON.stringify(mockSensors));
            return mockSensors;
        }
        return sensors;
    },

    updateSensorReading(sensorId, reading) {
        const sensors = this.getSensors();
        const sensor = sensors.find(s => s.id === sensorId);
        if (sensor) {
            sensor.current_value = reading.value;
            sensor.last_update = reading.timestamp;
            if (!sensor.history) sensor.history = [];
            sensor.history.push(reading);
            if (sensor.history.length > 100) sensor.history.shift();
            localStorage.setItem('jjm_sensors', JSON.stringify(sensors));
        }
    },

    // Grievance Management
    getGrievances() {
        return JSON.parse(localStorage.getItem('jjm_grievances') || '[]');
    },

    addGrievance(grievance) {
        const grievances = this.getGrievances();
        grievances.unshift(grievance);
        localStorage.setItem('jjm_grievances', JSON.stringify(grievances));
        return grievance;
    },

    updateGrievance(id, updates) {
        const grievances = this.getGrievances();
        const index = grievances.findIndex(g => g.id === id);
        if (index !== -1) {
            grievances[index] = { ...grievances[index], ...updates };
            localStorage.setItem('jjm_grievances', JSON.stringify(grievances));
            return grievances[index];
        }
        return null;
    },

    // Activities
    getActivities() {
        return JSON.parse(localStorage.getItem('jjm_activities') || '[]');
    },

    addActivity(activity) {
        const activities = this.getActivities();
        activities.unshift(activity);
        if (activities.length > 50) activities.pop();
        localStorage.setItem('jjm_activities', JSON.stringify(activities));
    },

    // Alerts
    getAlerts() {
        return JSON.parse(localStorage.getItem('jjm_alerts') || '[]');
    },

    addAlert(alert) {
        const alerts = this.getAlerts();
        alerts.unshift(alert);
        localStorage.setItem('jjm_alerts', JSON.stringify(alerts));
    },

    // Mock Data Generators
    getMockAssets() {
        const assets = [];

        // Pipelines (30)
        for (let i = 1; i <= 30; i++) {
            assets.push({
                id: `P${String(i).padStart(3, '0')}`,
                name: `Pipeline ${i} - ${this.getRandomLocation()}`,
                type: 'pipeline',
                coordinates: this.getRandomCoordinates(),
                diameter: [150, 200, 300, 400, 600][Math.floor(Math.random() * 5)],
                material: ['HDPE', 'PVC', 'GI', 'DI'][Math.floor(Math.random() * 4)],
                length: Math.floor(Math.random() * 5000) + 500,
                status: ['operational', 'maintenance', 'critical'][Math.floor(Math.random() * 3)],
                installation_date: this.getRandomDate(2015, 2023)
            });
        }

        // Storage Tanks (15)
        for (let i = 1; i <= 15; i++) {
            const capacity = [50000, 100000, 200000, 500000][Math.floor(Math.random() * 4)];
            assets.push({
                id: `T${String(i).padStart(3, '0')}`,
                name: `Tank ${i} - ${this.getRandomLocation()}`,
                type: 'tank',
                coordinates: this.getRandomPoint(),
                capacity: capacity,
                current_level: Math.floor(Math.random() * capacity * 0.9) + capacity * 0.1,
                material: ['Concrete', 'Steel', 'FRP'][Math.floor(Math.random() * 3)],
                status: ['operational', 'maintenance'][Math.floor(Math.random() * 2)],
                installation_date: this.getRandomDate(2010, 2022)
            });
        }

        // Pumping Stations (10)
        for (let i = 1; i <= 10; i++) {
            assets.push({
                id: `PS${String(i).padStart(3, '0')}`,
                name: `Pumping Station ${i} - ${this.getRandomLocation()}`,
                type: 'pump',
                coordinates: this.getRandomPoint(),
                capacity: Math.floor(Math.random() * 500) + 100,
                power: Math.floor(Math.random() * 150) + 50,
                status: ['operational', 'offline'][Math.floor(Math.random() * 2)],
                installation_date: this.getRandomDate(2012, 2023)
            });
        }

        // Water Sources (8)
        for (let i = 1; i <= 8; i++) {
            assets.push({
                id: `WS${String(i).padStart(3, '0')}`,
                name: `Water Source ${i} - ${this.getRandomLocation()}`,
                type: 'source',
                coordinates: this.getRandomPoint(),
                source_type: ['Borewell', 'River', 'Lake', 'Reservoir'][Math.floor(Math.random() * 4)],
                capacity: Math.floor(Math.random() * 1000000) + 100000,
                status: 'operational',
                installation_date: this.getRandomDate(2005, 2020)
            });
        }

        return assets;
    },

    getMockSensors() {
        const sensors = [];
        const types = [
            { type: 'flow', min: 50, max: 200, unit: 'L/min', normal: [80, 150] },
            { type: 'pressure', min: 2, max: 8, unit: 'bar', normal: [3, 6] },
            { type: 'pH', min: 6.5, max: 8.5, unit: 'pH', normal: [7, 8] },
            { type: 'turbidity', min: 0, max: 5, unit: 'NTU', normal: [0, 1] },
            { type: 'chlorine', min: 0.2, max: 1, unit: 'mg/L', normal: [0.3, 0.8] },
            { type: 'level', min: 0, max: 100, unit: '%', normal: [30, 90] }
        ];

        // Define regions and areas
        const regions = [
            { region: 'North Zone', areas: ['Hebbal', 'Yelahanka', 'Sahakara Nagar', 'RT Nagar'] },
            { region: 'South Zone', areas: ['JP Nagar', 'Banashankari', 'Jayanagar', 'BTM Layout'] },
            { region: 'East Zone', areas: ['Whitefield', 'Marathahalli', 'Indiranagar', 'HSR Layout'] },
            { region: 'West Zone', areas: ['Rajajinagar', 'Malleshwaram', 'Yeshwanthpur', 'Vijayanagar'] },
            { region: 'Central Zone', areas: ['MG Road', 'Brigade Road', 'Shivajinagar', 'Richmond Town'] }
        ];

        // Create sensors for each type to ensure good distribution
        let sensorId = 1;
        for (let typeIdx = 0; typeIdx < types.length; typeIdx++) {
            const sensorType = types[typeIdx];
            const sensorsPerType = 25; // 25 sensors per type = 150 total

            for (let j = 0; j < sensorsPerType; j++) {
                const regionData = regions[Math.floor(Math.random() * regions.length)];
                const area = regionData.areas[Math.floor(Math.random() * regionData.areas.length)];

                // Add some variation in status (90% normal, 7% warning, 3% critical)
                let status = 'normal';
                let currentValue = this.randomBetween(sensorType.normal[0], sensorType.normal[1]);

                const rand = Math.random();
                if (rand > 0.97) {
                    status = 'critical';
                    // Critical value - outside normal range
                    if (Math.random() > 0.5) {
                        currentValue = this.randomBetween(sensorType.max * 0.9, sensorType.max);
                    } else {
                        currentValue = this.randomBetween(sensorType.min, sensorType.normal[0] * 0.5);
                    }
                } else if (rand > 0.90) {
                    status = 'warning';
                    // Warning value - near threshold
                    if (Math.random() > 0.5) {
                        currentValue = this.randomBetween(sensorType.normal[1], sensorType.max * 0.8);
                    } else {
                        currentValue = this.randomBetween(sensorType.normal[0] * 0.6, sensorType.normal[0]);
                    }
                }

                sensors.push({
                    id: `S${String(sensorId).padStart(4, '0')}`,
                    name: `${sensorType.type.toUpperCase()} Sensor ${sensorId}`,
                    type: sensorType.type,
                    region: regionData.region,
                    area: area,
                    location: `${area}, Bangalore`,
                    coordinates: this.getRandomPoint(),
                    current_value: parseFloat(currentValue.toFixed(2)),
                    unit: sensorType.unit,
                    min_threshold: sensorType.normal[0],
                    max_threshold: sensorType.normal[1],
                    status: status,
                    last_update: new Date().toISOString(),
                    history: this.generateSensorHistory(sensorType, 20)
                });

                sensorId++;
            }
        }

        return sensors;
    },

    getMockGrievances() {
        const grievances = [];
        const categories = ['leakage', 'no_water', 'quality', 'billing', 'pressure'];
        const statuses = ['registered', 'assigned', 'in_progress', 'resolved'];
        const priorities = ['high', 'medium', 'low'];
        const names = ['Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sunita Devi', 'Ramesh Reddy',
                       'Lakshmi Iyer', 'Vijay Singh', 'Meena Gupta', 'Arun Kumar', 'Kavita Desai'];

        for (let i = 1; i <= 30; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const priority = priorities[Math.floor(Math.random() * priorities.length)];
            const createdDate = this.getRandomDateRecent(30);

            const timeline = [
                { status: 'registered', timestamp: createdDate, by: 'System' }
            ];

            if (status !== 'registered') {
                timeline.push({
                    status: 'assigned',
                    timestamp: this.addMinutes(createdDate, 30),
                    by: 'Admin'
                });
            }

            if (status === 'in_progress' || status === 'resolved') {
                timeline.push({
                    status: 'in_progress',
                    timestamp: this.addMinutes(createdDate, 120),
                    by: `Engineer ${Math.floor(Math.random() * 5) + 1}`
                });
            }

            if (status === 'resolved') {
                timeline.push({
                    status: 'resolved',
                    timestamp: this.addMinutes(createdDate, 1440),
                    by: `Engineer ${Math.floor(Math.random() * 5) + 1}`
                });
            }

            grievances.push({
                id: `GRV${String(i).padStart(4, '0')}`,
                citizen: names[Math.floor(Math.random() * names.length)],
                phone: `98${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
                category: category,
                description: this.getGrievanceDescription(category),
                location: {
                    lat: this.randomBetween(12.90, 13.00),
                    lng: this.randomBetween(77.55, 77.65),
                    address: this.getRandomLocation()
                },
                status: status,
                priority: priority,
                assigned_to: status !== 'registered' ? `Engineer ${Math.floor(Math.random() * 5) + 1}` : null,
                created_at: createdDate,
                timeline: timeline,
                comments: []
            });
        }

        return grievances.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    getMockActivities() {
        const activities = [];
        const types = [
            { icon: 'fa-plus-circle', color: 'success', templates: ['New asset {asset} added to the system', 'Asset {asset} registered successfully'] },
            { icon: 'fa-exclamation-triangle', color: 'warning', templates: ['Anomaly detected in sensor {sensor}', 'Sensor {sensor} threshold exceeded'] },
            { icon: 'fa-comments', color: 'info', templates: ['New complaint {complaint} registered', 'Complaint {complaint} assigned to engineer'] },
            { icon: 'fa-check-circle', color: 'success', templates: ['Complaint {complaint} resolved', 'Maintenance completed for {asset}'] },
            { icon: 'fa-wrench', color: 'warning', templates: ['Maintenance scheduled for {asset}', 'Asset {asset} under maintenance'] }
        ];

        for (let i = 0; i < 15; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            const template = type.templates[Math.floor(Math.random() * type.templates.length)];
            const text = template
                .replace('{asset}', `Asset-${Math.floor(Math.random() * 1000)}`)
                .replace('{sensor}', `S${String(Math.floor(Math.random() * 100)).padStart(4, '0')}`)
                .replace('{complaint}', `GRV${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`);

            activities.push({
                id: `ACT${String(i + 1).padStart(4, '0')}`,
                icon: type.icon,
                color: type.color,
                text: text,
                time: this.getRelativeTime(this.getRandomDateRecent(5))
            });
        }

        return activities;
    },

    getMockAlerts() {
        return [
            {
                id: 'ALT001',
                type: 'critical',
                message: 'Water pressure critically low in MG Road pipeline',
                sensor: 'S0045',
                time: '5 minutes ago',
                value: '1.2 bar'
            },
            {
                id: 'ALT002',
                type: 'warning',
                message: 'Tank T003 water level below 20%',
                sensor: 'S0012',
                time: '15 minutes ago',
                value: '18%'
            },
            {
                id: 'ALT003',
                type: 'critical',
                message: 'Chlorine level too low at Water Source WS002',
                sensor: 'S0089',
                time: '25 minutes ago',
                value: '0.15 mg/L'
            },
            {
                id: 'ALT004',
                type: 'warning',
                message: 'High turbidity detected in Koramangala supply',
                sensor: 'S0234',
                time: '1 hour ago',
                value: '3.2 NTU'
            }
        ];
    },

    // Utility Functions
    getRandomLocation() {
        const locations = [
            'MG Road', 'Brigade Road', 'Indiranagar', 'Koramangala', 'Jayanagar',
            'Whitefield', 'Electronic City', 'HSR Layout', 'BTM Layout', 'Malleshwaram',
            'Rajajinagar', 'Yeshwanthpur', 'Hebbal', 'Marathahalli', 'Bellandur',
            'Sarjapur Road', 'Bannerghatta Road', 'JP Nagar', 'Banashankari', 'Vijayanagar'
        ];
        return locations[Math.floor(Math.random() * locations.length)] + ', Bangalore';
    },

    getRandomPoint() {
        return [
            parseFloat((12.90 + Math.random() * 0.15).toFixed(6)),
            parseFloat((77.55 + Math.random() * 0.15).toFixed(6))
        ];
    },

    getRandomCoordinates() {
        const start = this.getRandomPoint();
        const end = [
            start[0] + (Math.random() * 0.02 - 0.01),
            start[1] + (Math.random() * 0.02 - 0.01)
        ];
        return [start, end];
    },

    randomBetween(min, max) {
        return min + Math.random() * (max - min);
    },

    getRandomDate(startYear, endYear) {
        const start = new Date(startYear, 0, 1);
        const end = new Date(endYear, 11, 31);
        const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        return date.toISOString().split('T')[0];
    },

    getRandomDateRecent(daysAgo) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
        date.setHours(Math.floor(Math.random() * 24));
        date.setMinutes(Math.floor(Math.random() * 60));
        return date.toISOString();
    },

    addMinutes(dateString, minutes) {
        const date = new Date(dateString);
        date.setMinutes(date.getMinutes() + minutes);
        return date.toISOString();
    },

    getRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    },

    getGrievanceDescription(category) {
        const descriptions = {
            leakage: 'Water leaking from pipeline near the main road',
            no_water: 'No water supply for the past 2 days',
            quality: 'Water quality is poor, appears muddy/contaminated',
            billing: 'Incorrect water bill received this month',
            pressure: 'Very low water pressure, difficult to use'
        };
        return descriptions[category] || 'General water supply issue';
    },

    generateSensorHistory(sensorType, count) {
        const history = [];
        const now = Date.now();

        for (let i = count; i > 0; i--) {
            const timestamp = new Date(now - i * 180000); // 3-minute intervals
            const value = this.randomBetween(sensorType.normal[0], sensorType.normal[1]);

            history.push({
                timestamp: timestamp.toISOString(),
                value: parseFloat(value.toFixed(2))
            });
        }

        return history;
    }
};

// Initialize data when script loads
DataManager.init();

// Add a global function to reset data (useful for debugging)
window.resetJJMData = function() {
    if (confirm('This will reset all IoT sensor data to default values. Are you sure?')) {
        localStorage.removeItem('jjm_initialized');
        localStorage.removeItem('jjm_sensors');
        DataManager.init();
        alert('Data has been reset successfully! Please refresh the page.');
        location.reload();
    }
};

// Log helpful message to console
console.log('%c Jal Jeevan Mission Platform ', 'background: #3b82f6; color: white; font-size: 16px; font-weight: bold; padding: 10px;');
console.log('%c Data Manager Ready ', 'background: #10b981; color: white; font-size: 12px; padding: 5px;');
console.log('Sensors loaded:', DataManager.getSensors().length);
console.log('To reset all data, run: resetJJMData()');
console.log('---');
