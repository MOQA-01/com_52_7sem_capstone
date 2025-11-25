// IoT Sensor Simulation and Monitoring
let simulationInterval;
let isSimulating = true;
let sensors = [];
let filteredSensors = [];

// Sensor type configurations
const sensorTypes = {
    flow: { min: 50, max: 200, unit: 'L/min', normal: [80, 150], icon: 'fa-water', color: '#3b82f6' },
    pressure: { min: 2, max: 8, unit: 'bar', normal: [3, 6], icon: 'fa-gauge-high', color: '#8b5cf6' },
    pH: { min: 6.5, max: 8.5, unit: 'pH', normal: [7, 8], icon: 'fa-flask', color: '#06b6d4' },
    turbidity: { min: 0, max: 5, unit: 'NTU', normal: [0, 1], icon: 'fa-eye-dropper', color: '#f59e0b' },
    chlorine: { min: 0.2, max: 1, unit: 'mg/L', normal: [0.3, 0.8], icon: 'fa-vial', color: '#10b981' },
    level: { min: 0, max: 100, unit: '%', normal: [30, 90], icon: 'fa-fill-drip', color: '#ec4899' }
};

document.addEventListener('DOMContentLoaded', function() {
    Auth.requireAuth();
    loadSensors();
    renderSensors();
    startSimulation();
    setupFilters();
    setupEventListeners();
});

// Load sensors from DataManager
function loadSensors() {
    sensors = DataManager.getSensors();
    filteredSensors = [...sensors];
}

// Render sensor cards
function renderSensors() {
    const grid = document.getElementById('sensorsGrid');
    if (!grid) return;

    if (filteredSensors.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px;">No sensors found matching your filters</p>';
        return;
    }

    grid.innerHTML = filteredSensors.map(sensor => createSensorCard(sensor)).join('');

    // Update anomaly count
    const anomalyCount = sensors.filter(s => s.status !== 'normal').length;
    const badge = document.getElementById('anomalyCount');
    if (badge) badge.textContent = anomalyCount;
}

// Create sensor card HTML
function createSensorCard(sensor) {
    const config = sensorTypes[sensor.type];
    const isAnomaly = sensor.status !== 'normal';
    const statusClass = `status-${sensor.status}`;

    return `
        <div class="sensor-card ${isAnomaly ? 'anomaly' : ''}" onclick="openSensorModal('${sensor.id}')">
            ${isAnomaly ? '<div class="anomaly-badge"><i class="fas fa-exclamation-triangle"></i> ALERT</div>' : ''}
            <div class="sensor-header">
                <div class="sensor-info">
                    <h4><i class="fas ${config.icon}" style="color: ${config.color};"></i> ${sensor.id}</h4>
                    <p><i class="fas fa-map-pin"></i> ${sensor.region}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${sensor.area}</p>
                </div>
                <span class="sensor-status ${statusClass}">${sensor.status.toUpperCase()}</span>
            </div>

            <div class="sensor-reading">
                <div class="reading-value">${sensor.current_value}</div>
                <div class="reading-unit">${config.unit}</div>
            </div>

            <canvas class="sparkline" id="spark-${sensor.id}"></canvas>

            <div class="sensor-meta">
                <div class="last-update">
                    <i class="fas fa-clock"></i>
                    <span>${formatTimeAgo(sensor.last_update)}</span>
                </div>
                <span style="color: ${config.color};">
                    <i class="fas fa-chart-line"></i> ${sensor.type.toUpperCase()}
                </span>
            </div>
        </div>
    `;
}

// Start sensor simulation
function startSimulation() {
    if (simulationInterval) clearInterval(simulationInterval);

    simulationInterval = setInterval(() => {
        if (!isSimulating) return;

        sensors.forEach(sensor => {
            updateSensorReading(sensor);
        });

        renderSensors();

        // Redraw sparklines after a brief delay to ensure DOM is updated
        setTimeout(drawAllSparklines, 50);
    }, 3000); // Update every 3 seconds
}

// Update individual sensor reading
function updateSensorReading(sensor) {
    const config = sensorTypes[sensor.type];
    let newValue;

    // 95% chance of normal reading, 5% chance of anomaly
    if (Math.random() < 0.95) {
        // Normal reading within threshold
        newValue = config.normal[0] + Math.random() * (config.normal[1] - config.normal[0]);
        sensor.status = 'normal';
    } else {
        // Anomaly - outside normal range
        if (Math.random() < 0.5) {
            // Below threshold
            newValue = config.min + Math.random() * (config.normal[0] - config.min);
            sensor.status = newValue < config.min + (config.normal[0] - config.min) * 0.3 ? 'critical' : 'warning';
        } else {
            // Above threshold
            newValue = config.normal[1] + Math.random() * (config.max - config.normal[1]);
            sensor.status = newValue > config.max - (config.max - config.normal[1]) * 0.3 ? 'critical' : 'warning';
        }

        // Create alert if critical
        if (sensor.status === 'critical') {
            DataManager.addAlert({
                id: `ALT${Date.now()}`,
                type: 'critical',
                message: `${sensor.type.toUpperCase()} sensor ${sensor.id} at ${sensor.location} - ${sensor.status}`,
                sensor: sensor.id,
                time: 'Just now',
                value: `${newValue.toFixed(2)} ${config.unit}`
            });
        }
    }

    sensor.current_value = parseFloat(newValue.toFixed(2));
    sensor.last_update = new Date().toISOString();

    // Update history
    if (!sensor.history) sensor.history = [];
    sensor.history.push({
        timestamp: sensor.last_update,
        value: sensor.current_value
    });

    // Keep only last 50 readings
    if (sensor.history.length > 50) {
        sensor.history.shift();
    }

    // Update in DataManager
    DataManager.updateSensorReading(sensor.id, {
        value: sensor.current_value,
        timestamp: sensor.last_update
    });
}

// Draw sparkline charts
function drawAllSparklines() {
    filteredSensors.forEach(sensor => {
        const canvas = document.getElementById(`spark-${sensor.id}`);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        canvas.width = width;
        canvas.height = height;

        if (!sensor.history || sensor.history.length < 2) return;

        const config = sensorTypes[sensor.type];
        const data = sensor.history.slice(-20); // Last 20 readings
        const max = Math.max(...data.map(d => d.value));
        const min = Math.min(...data.map(d => d.value));
        const range = max - min || 1;

        ctx.clearRect(0, 0, width, height);

        // Draw line
        ctx.beginPath();
        ctx.strokeStyle = config.color;
        ctx.lineWidth = 2;

        data.forEach((point, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = height - ((point.value - min) / range) * height;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw area
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = config.color + '20';
        ctx.fill();
    });
}

// Format time ago
function formatTimeAgo(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);

    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    return then.toLocaleTimeString();
}

// Setup filters
function setupFilters() {
    const regionFilter = document.getElementById('filterRegion');
    const areaFilter = document.getElementById('filterArea');
    const typeFilter = document.getElementById('filterType');
    const statusFilter = document.getElementById('filterStatus');
    const searchInput = document.getElementById('searchSensor');

    // Populate area filter based on region
    function updateAreaFilter() {
        const selectedRegion = regionFilter.value;
        const areas = new Set();

        sensors.forEach(sensor => {
            if (selectedRegion === 'all' || sensor.region === selectedRegion) {
                areas.add(sensor.area);
            }
        });

        areaFilter.innerHTML = '<option value="all">All Areas</option>';
        Array.from(areas).sort().forEach(area => {
            const option = document.createElement('option');
            option.value = area;
            option.textContent = area;
            areaFilter.appendChild(option);
        });
    }

    function applyFilters() {
        const region = regionFilter.value;
        const area = areaFilter.value;
        const type = typeFilter.value;
        const status = statusFilter.value;
        const search = searchInput.value.toLowerCase();

        filteredSensors = sensors.filter(sensor => {
            const matchRegion = region === 'all' || sensor.region === region;
            const matchArea = area === 'all' || sensor.area === area;
            const matchType = type === 'all' || sensor.type === type;
            const matchStatus = status === 'all' || sensor.status === status;
            const matchSearch = search === '' ||
                                sensor.id.toLowerCase().includes(search) ||
                                sensor.location.toLowerCase().includes(search) ||
                                sensor.region.toLowerCase().includes(search) ||
                                sensor.area.toLowerCase().includes(search);

            return matchRegion && matchArea && matchType && matchStatus && matchSearch;
        });

        renderSensors();
        setTimeout(drawAllSparklines, 50);
    }

    regionFilter.addEventListener('change', () => {
        updateAreaFilter();
        applyFilters();
    });
    areaFilter.addEventListener('change', applyFilters);
    typeFilter.addEventListener('change', applyFilters);
    statusFilter.addEventListener('change', applyFilters);
    searchInput.addEventListener('input', applyFilters);

    // Initialize area filter
    updateAreaFilter();
}

// Setup event listeners
function setupEventListeners() {
    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Toggle simulation
    const toggleBtn = document.getElementById('toggleSimulation');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            isSimulating = !isSimulating;
            toggleBtn.innerHTML = isSimulating ?
                '<i class="fas fa-pause"></i> Pause Updates' :
                '<i class="fas fa-play"></i> Resume Updates';
            toggleBtn.className = isSimulating ?
                'btn btn-sm btn-success' :
                'btn btn-sm btn-warning';
        });
    }
}

// Open sensor detail modal
function openSensorModal(sensorId) {
    const sensor = sensors.find(s => s.id === sensorId);
    if (!sensor) return;

    const config = sensorTypes[sensor.type];
    const modal = document.getElementById('sensorModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.innerHTML = `<i class="fas ${config.icon}"></i> ${sensor.id} - ${sensor.name}`;

    // Calculate statistics
    const values = sensor.history.map(h => h.value);
    const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
    const min = Math.min(...values).toFixed(2);
    const max = Math.max(...values).toFixed(2);

    modalBody.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
            <div style="text-align: center; padding: 20px; background: rgba(59, 130, 246, 0.1); border-radius: 12px;">
                <div style="font-size: 32px; font-weight: 700; color: ${config.color};">${sensor.current_value}</div>
                <div style="font-size: 14px; color: var(--text-secondary); margin-top: 5px;">Current Reading</div>
                <div style="font-size: 12px; color: var(--text-secondary);">${config.unit}</div>
            </div>
            <div style="text-align: center; padding: 20px; background: rgba(16, 185, 129, 0.1); border-radius: 12px;">
                <div style="font-size: 32px; font-weight: 700; color: var(--success-color);">${avg}</div>
                <div style="font-size: 14px; color: var(--text-secondary); margin-top: 5px;">Average</div>
                <div style="font-size: 12px; color: var(--text-secondary);">${config.unit}</div>
            </div>
            <div style="text-align: center; padding: 20px; background: rgba(239, 68, 68, 0.1); border-radius: 12px;">
                <div style="font-size: 32px; font-weight: 700; color: var(--danger-color);">${max}</div>
                <div style="font-size: 14px; color: var(--text-secondary); margin-top: 5px;">Maximum</div>
                <div style="font-size: 12px; color: var(--text-secondary);">${config.unit}</div>
            </div>
            <div style="text-align: center; padding: 20px; background: rgba(245, 158, 11, 0.1); border-radius: 12px;">
                <div style="font-size: 32px; font-weight: 700; color: var(--warning-color);">${min}</div>
                <div style="font-size: 14px; color: var(--text-secondary); margin-top: 5px;">Minimum</div>
                <div style="font-size: 12px; color: var(--text-secondary);">${config.unit}</div>
            </div>
        </div>

        <div style="margin-bottom: 20px;">
            <h3 style="font-size: 18px; margin-bottom: 15px;">Sensor Information</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                <div><strong>Sensor ID:</strong> ${sensor.id}</div>
                <div><strong>Type:</strong> ${sensor.type.toUpperCase()}</div>
                <div><strong>Region:</strong> ${sensor.region}</div>
                <div><strong>Area:</strong> ${sensor.area}</div>
                <div><strong>Location:</strong> ${sensor.location}</div>
                <div><strong>Status:</strong> <span class="badge badge-${sensor.status === 'normal' ? 'success' : sensor.status === 'warning' ? 'warning' : 'danger'}">${sensor.status.toUpperCase()}</span></div>
                <div><strong>Normal Range:</strong> ${config.normal[0]} - ${config.normal[1]} ${config.unit}</div>
                <div><strong>Last Update:</strong> ${formatTimeAgo(sensor.last_update)}</div>
            </div>
        </div>

        <div style="margin-bottom: 20px;">
            <h3 style="font-size: 18px; margin-bottom: 15px;">Historical Data (Last 50 Readings)</h3>
            <canvas id="detailChart" width="700" height="300"></canvas>
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="closeSensorModal()">Close</button>
            <button class="btn btn-primary" onclick="calibrateSensor('${sensor.id}')">
                <i class="fas fa-cog"></i> Calibrate
            </button>
            <button class="btn btn-warning" onclick="exportSensorHistory('${sensor.id}')">
                <i class="fas fa-download"></i> Export History
            </button>
        </div>
    `;

    modal.style.display = 'block';

    // Draw detailed chart
    setTimeout(() => drawDetailChart(sensor), 100);
}

// Close sensor modal
function closeSensorModal() {
    document.getElementById('sensorModal').style.display = 'none';
}

// Draw detailed chart in modal
function drawDetailChart(sensor) {
    const canvas = document.getElementById('detailChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const config = sensorTypes[sensor.type];
    const data = sensor.history || [];

    if (data.length < 2) {
        ctx.fillStyle = var(--text-secondary);
        ctx.textAlign = 'center';
        ctx.fillText('Insufficient data', width / 2, height / 2);
        return;
    }

    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    const values = data.map(d => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    ctx.clearRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw threshold lines
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    // Normal range
    const normalMinY = height - padding - ((config.normal[0] - min) / range) * chartHeight;
    const normalMaxY = height - padding - ((config.normal[1] - min) / range) * chartHeight;

    ctx.beginPath();
    ctx.moveTo(padding, normalMinY);
    ctx.lineTo(width - padding, normalMinY);
    ctx.moveTo(padding, normalMaxY);
    ctx.lineTo(width - padding, normalMaxY);
    ctx.stroke();

    ctx.setLineDash([]);

    // Draw data line
    ctx.strokeStyle = config.color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = height - padding - ((point.value - min) / range) * chartHeight;

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();

    // Draw points
    ctx.fillStyle = config.color;
    data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = height - padding - ((point.value - min) / range) * chartHeight;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = '#64748b';
    ctx.font = '12px Poppins';
    ctx.textAlign = 'right';
    ctx.fillText(max.toFixed(1), padding - 5, padding + 5);
    ctx.fillText(min.toFixed(1), padding - 5, height - padding + 5);
}

// Export sensor data
function exportSensorData() {
    let csv = 'Sensor ID,Type,Region,Area,Location,Current Value,Unit,Status,Last Update\n';

    sensors.forEach(sensor => {
        const config = sensorTypes[sensor.type];
        csv += `${sensor.id},${sensor.type},${sensor.region},${sensor.area},${sensor.location},${sensor.current_value},${config.unit},${sensor.status},${sensor.last_update}\n`;
    });

    downloadCSV(csv, 'sensor-data.csv');
}

// Export sensor history
function exportSensorHistory(sensorId) {
    const sensor = sensors.find(s => s.id === sensorId);
    if (!sensor) return;

    const config = sensorTypes[sensor.type];
    let csv = `Timestamp,Value (${config.unit})\n`;

    sensor.history.forEach(reading => {
        csv += `${reading.timestamp},${reading.value}\n`;
    });

    downloadCSV(csv, `sensor-${sensorId}-history.csv`);
    alert('Sensor history exported successfully!');
}

// Download CSV helper
function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Calibrate sensor
function calibrateSensor(sensorId) {
    const confirmed = confirm(`Calibrate sensor ${sensorId}?\n\nThis is a demo feature. In a real system, this would send calibration commands to the physical sensor.`);
    if (confirmed) {
        alert(`Calibration initiated for sensor ${sensorId}`);
        closeSensorModal();
    }
}

// Export sensor data to Excel
function exportSensorExcel() {
    // Prepare data for Excel with specific columns: Region, Area, Type, Status
    const exportData = sensors.map(sensor => ({
        'Region': sensor.region,
        'Area': sensor.area,
        'Type': sensor.type.charAt(0).toUpperCase() + sensor.type.slice(1),
        'Status': sensor.status.charAt(0).toUpperCase() + sensor.status.slice(1),
        'Sensor ID': sensor.id,
        'Current Value': sensor.current_value,
        'Unit': sensor.unit,
        'Location': sensor.location,
        'Last Update': new Date(sensor.last_update).toLocaleString('en-IN')
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create worksheet from data
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = [
        { wch: 18 }, // Region
        { wch: 22 }, // Area
        { wch: 15 }, // Type
        { wch: 12 }, // Status
        { wch: 12 }, // Sensor ID
        { wch: 15 }, // Current Value
        { wch: 10 }, // Unit
        { wch: 30 }, // Location
        { wch: 20 }  // Last Update
    ];
    ws['!cols'] = colWidths;

    // Style the header row (bold and colored background)
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '3B82F6' } },
            alignment: { horizontal: 'center', vertical: 'center' }
        };
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Sensor Data');

    // Create summary sheet grouped by Region, Area, Type, Status
    const summaryByRegion = [];
    const regions = ['North Zone', 'South Zone', 'East Zone', 'West Zone', 'Central Zone'];

    regions.forEach(region => {
        const regionSensors = sensors.filter(s => s.region === region);
        summaryByRegion.push({
            'Region': region,
            'Total Sensors': regionSensors.length,
            'Normal': regionSensors.filter(s => s.status === 'normal').length,
            'Warning': regionSensors.filter(s => s.status === 'warning').length,
            'Critical': regionSensors.filter(s => s.status === 'critical').length
        });
    });

    const wsSummary = XLSX.utils.json_to_sheet(summaryByRegion);
    wsSummary['!cols'] = [
        { wch: 18 }, // Region
        { wch: 15 }, // Total Sensors
        { wch: 12 }, // Normal
        { wch: 12 }, // Warning
        { wch: 12 }  // Critical
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary by Region');

    // Create detailed breakdown by Type
    const summaryByType = [];
    const types = ['flow', 'pressure', 'pH', 'turbidity', 'chlorine', 'level'];

    types.forEach(type => {
        const typeSensors = sensors.filter(s => s.type === type);
        summaryByType.push({
            'Type': type.charAt(0).toUpperCase() + type.slice(1),
            'Total': typeSensors.length,
            'Normal': typeSensors.filter(s => s.status === 'normal').length,
            'Warning': typeSensors.filter(s => s.status === 'warning').length,
            'Critical': typeSensors.filter(s => s.status === 'critical').length
        });
    });

    const wsType = XLSX.utils.json_to_sheet(summaryByType);
    wsType['!cols'] = [
        { wch: 15 }, // Type
        { wch: 12 }, // Total
        { wch: 12 }, // Normal
        { wch: 12 }, // Warning
        { wch: 12 }  // Critical
    ];
    XLSX.utils.book_append_sheet(wb, wsType, 'Summary by Type');

    // Create pivot-style summary
    const pivotData = [
        { '': '', 'North Zone': '', 'South Zone': '', 'East Zone': '', 'West Zone': '', 'Central Zone': '', 'Total': '' }
    ];

    types.forEach(type => {
        const row = {
            '': type.charAt(0).toUpperCase() + type.slice(1)
        };
        regions.forEach(region => {
            row[region] = sensors.filter(s => s.type === type && s.region === region).length;
        });
        row['Total'] = sensors.filter(s => s.type === type).length;
        pivotData.push(row);
    });

    // Add totals row
    const totalRow = { '': 'Total' };
    regions.forEach(region => {
        totalRow[region] = sensors.filter(s => s.region === region).length;
    });
    totalRow['Total'] = sensors.length;
    pivotData.push(totalRow);

    const wsPivot = XLSX.utils.json_to_sheet(pivotData);
    wsPivot['!cols'] = [
        { wch: 15 }, // Type column
        { wch: 15 }, // North Zone
        { wch: 15 }, // South Zone
        { wch: 15 }, // East Zone
        { wch: 15 }, // West Zone
        { wch: 15 }, // Central Zone
        { wch: 12 }  // Total
    ];
    XLSX.utils.book_append_sheet(wb, wsPivot, 'Pivot Summary');

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const filename = `JJM_IoT_Sensors_${date}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);

    // Show success message
    alert(`✅ Excel file exported successfully!\n\nFilename: ${filename}\nTotal Sensors: ${sensors.length}\n\nThe file includes 4 sheets:\n• Sensor Data - Full sensor list with Region, Area, Type, Status\n• Summary by Region - Statistics per region\n• Summary by Type - Statistics per sensor type\n• Pivot Summary - Cross-tabulation of Type vs Region`);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('sensorModal');
    if (event.target == modal) {
        closeSensorModal();
    }
}
