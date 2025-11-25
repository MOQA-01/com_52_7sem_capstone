// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard loading...');

    // Check authentication
    try {
        if (typeof Auth !== 'undefined') {
            Auth.requireAuth();
        }
    } catch (e) {
        console.warn('Auth check skipped:', e);
    }

    // Verify DataManager is available
    if (typeof DataManager === 'undefined') {
        console.error('DataManager not loaded!');
        return;
    }

    console.log('DataManager available, loading dashboard data...');

    // Initialize dashboard
    try {
        loadDashboardStats();
        loadActivities();
        loadAlerts();
        updateClock();
        setupEventListeners();
        loadAssetDistribution();
    } catch (e) {
        console.error('Error loading dashboard:', e);
    }

    // Update clock every second
    setInterval(updateClock, 1000);

    // Refresh activities every 30 seconds
    setInterval(() => {
        try {
            loadActivities();
            loadAlerts();
        } catch (e) {
            console.error('Error refreshing data:', e);
        }
    }, 30000);

    console.log('Dashboard loaded successfully!');
});

// Load Dashboard Statistics
function loadDashboardStats() {
    const assets = DataManager.getAssets();
    const sensors = DataManager.getSensors();
    const grievances = DataManager.getGrievances();
    const alerts = DataManager.getAlerts();

    // Update stat cards
    animateValue('totalAssets', 0, assets.length, 2000);
    animateValue('activeSensors', 0, sensors.length, 2000);

    const openGrievances = grievances.filter(g => g.status !== 'resolved').length;
    animateValue('openComplaints', 0, openGrievances, 2000);

    const criticalAlerts = alerts.filter(a => a.type === 'critical').length;
    const criticalSensors = sensors.filter(s => s.status === 'critical' || s.status === 'warning').length;
    document.getElementById('anomalies').textContent = criticalAlerts + criticalSensors;

    // Resolved complaints this month
    const now = new Date();
    const thisMonth = grievances.filter(g => {
        const createdDate = new Date(g.created_at);
        return g.status === 'resolved' &&
               createdDate.getMonth() === now.getMonth() &&
               createdDate.getFullYear() === now.getFullYear();
    }).length;
    animateValue('resolvedComplaints', 0, thisMonth, 2000);

    // Calculate resolution trend (mock data for now)
    const resolvedTrendEl = document.getElementById('resolvedTrend');
    if (resolvedTrendEl) {
        resolvedTrendEl.textContent = '12%';
    }

    // Grievance category counts
    const leakageCount = grievances.filter(g => g.category === 'leakage' && g.status !== 'resolved').length;
    const noWaterCount = grievances.filter(g => g.category === 'no_water' && g.status !== 'resolved').length;
    const qualityCount = grievances.filter(g => g.category === 'quality' && g.status !== 'resolved').length;
    const pressureCount = grievances.filter(g => g.category === 'pressure' && g.status !== 'resolved').length;

    animateValue('leakageCount', 0, leakageCount, 1500);
    animateValue('noWaterCount', 0, noWaterCount, 1500);
    animateValue('qualityCount', 0, qualityCount, 1500);
    animateValue('pressureCount', 0, pressureCount, 1500);

    // Calculate average response time
    const resolvedGrievances = grievances.filter(g => g.status === 'resolved');
    let totalResponseTime = 0;
    resolvedGrievances.forEach(g => {
        if (g.timeline && g.timeline.length > 1) {
            const created = new Date(g.timeline[0].timestamp);
            const resolved = new Date(g.timeline[g.timeline.length - 1].timestamp);
            totalResponseTime += (resolved - created);
        }
    });

    if (resolvedGrievances.length > 0) {
        const avgResponseMs = totalResponseTime / resolvedGrievances.length;
        const avgResponseHours = Math.round(avgResponseMs / (1000 * 60 * 60));
        const avgResponseEl = document.getElementById('avgResponseTime');
        if (avgResponseEl) {
            avgResponseEl.textContent = avgResponseHours + 'h';
        }
    }

    // Notification count
    const notificationCount = document.getElementById('notificationCount');
    if (notificationCount) {
        notificationCount.textContent = criticalAlerts + criticalSensors + openGrievances;
    }
}

// Animate counter values
function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    if (!element) return;

    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            element.textContent = formatNumber(end);
            clearInterval(timer);
        } else {
            element.textContent = formatNumber(Math.floor(current));
        }
    }, 16);
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
}

// Load Recent Activities
function loadActivities() {
    const activities = DataManager.getActivities();
    const grievances = DataManager.getGrievances();
    const sensors = DataManager.getSensors();
    const activityFeed = document.getElementById('activityFeed');

    console.log('Loading activities:', {
        activities: activities.length,
        grievances: grievances.length,
        sensors: sensors.length
    });

    if (!activityFeed) {
        console.error('activityFeed element not found!');
        return;
    }

    // Combine activities with recent grievances and sensor alerts
    const combinedActivities = [];

    // Add system activities
    activities.forEach(activity => {
        combinedActivities.push({
            icon: activity.icon,
            color: activity.color,
            text: activity.text,
            time: activity.time,
            timestamp: parseActivityTime(activity.time)
        });
    });

    // Add recent grievances (last 5)
    grievances.slice(0, 5).forEach(grievance => {
        const categoryIcons = {
            leakage: 'fa-tint',
            no_water: 'fa-water',
            quality: 'fa-vial',
            billing: 'fa-file-invoice-dollar',
            pressure: 'fa-gauge-high'
        };
        const statusColors = {
            registered: 'info',
            assigned: 'warning',
            in_progress: 'warning',
            resolved: 'success'
        };

        combinedActivities.push({
            icon: categoryIcons[grievance.category] || 'fa-comments',
            color: statusColors[grievance.status] || 'info',
            text: `Grievance ${grievance.id}: ${grievance.description.substring(0, 50)}... - ${grievance.location.address}`,
            time: getRelativeTime(grievance.created_at),
            timestamp: new Date(grievance.created_at).getTime()
        });
    });

    // Add critical sensor alerts (warning/critical status)
    const criticalSensors = sensors.filter(s => s.status !== 'normal').slice(0, 3);
    criticalSensors.forEach(sensor => {
        combinedActivities.push({
            icon: 'fa-exclamation-triangle',
            color: sensor.status === 'critical' ? 'danger' : 'warning',
            text: `${sensor.type.toUpperCase()} Sensor ${sensor.id} ${sensor.status === 'critical' ? 'CRITICAL' : 'WARNING'} - ${sensor.location}`,
            time: getRelativeTime(sensor.last_update),
            timestamp: new Date(sensor.last_update).getTime()
        });
    });

    // Sort by timestamp (most recent first) and take top 10
    combinedActivities.sort((a, b) => b.timestamp - a.timestamp);

    console.log('Combined activities count:', combinedActivities.length);

    if (combinedActivities.length === 0) {
        activityFeed.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <i class="fas fa-info-circle" style="font-size: 48px; margin-bottom: 10px; opacity: 0.3;"></i>
                <p>No recent activities</p>
            </div>
        `;
        return;
    }

    activityFeed.innerHTML = combinedActivities.slice(0, 10).map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.color}" style="background: rgba(${getColorRGB(activity.color)}, 0.1); color: var(--${activity.color}-color);">
                <i class="fas ${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-text">${activity.text}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
        </div>
    `).join('');

    console.log('Activities rendered successfully');
}

function parseActivityTime(timeStr) {
    const now = Date.now();
    if (timeStr.includes('minute')) {
        const mins = parseInt(timeStr);
        return now - (mins * 60 * 1000);
    } else if (timeStr.includes('hour')) {
        const hours = parseInt(timeStr);
        return now - (hours * 60 * 60 * 1000);
    } else if (timeStr.includes('day')) {
        const days = parseInt(timeStr);
        return now - (days * 24 * 60 * 60 * 1000);
    }
    return now;
}

function getRelativeTime(dateString) {
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
}

function getColorRGB(color) {
    const colors = {
        success: '16, 185, 129',
        warning: '245, 158, 11',
        danger: '239, 68, 68',
        info: '59, 130, 246',
        primary: '37, 99, 235'
    };
    return colors[color] || '100, 116, 139';
}

// Load Critical Alerts
function loadAlerts() {
    const alerts = DataManager.getAlerts();
    const sensors = DataManager.getSensors();
    const grievances = DataManager.getGrievances();
    const alertsContainer = document.getElementById('criticalAlerts');

    console.log('Loading alerts:', {
        alerts: alerts.length,
        sensors: sensors.length,
        grievances: grievances.length
    });

    if (!alertsContainer) {
        console.error('criticalAlerts element not found!');
        return;
    }

    const combinedAlerts = [];

    // Add sensor alerts
    alerts.forEach(alert => {
        combinedAlerts.push({
            type: alert.type,
            icon: 'fa-exclamation-triangle',
            message: alert.message,
            value: alert.value,
            time: alert.time,
            timestamp: parseActivityTime(alert.time)
        });
    });

    // Add critical sensors
    const criticalSensors = sensors.filter(s => s.status === 'critical').slice(0, 5);
    criticalSensors.forEach(sensor => {
        const sensorTypes = {
            flow: { icon: 'fa-water', label: 'Flow' },
            pressure: { icon: 'fa-gauge-high', label: 'Pressure' },
            pH: { icon: 'fa-flask', label: 'pH' },
            turbidity: { icon: 'fa-eye-dropper', label: 'Turbidity' },
            chlorine: { icon: 'fa-vial', label: 'Chlorine' },
            level: { icon: 'fa-fill-drip', label: 'Level' }
        };
        const sensorInfo = sensorTypes[sensor.type] || { icon: 'fa-sensor', label: sensor.type };

        combinedAlerts.push({
            type: 'critical',
            icon: sensorInfo.icon,
            message: `${sensorInfo.label} sensor ${sensor.id} critical at ${sensor.location}`,
            value: `${sensor.current_value} ${sensor.unit}`,
            time: getRelativeTime(sensor.last_update),
            timestamp: new Date(sensor.last_update).getTime()
        });
    });

    // Add high priority grievances
    const highPriorityGrievances = grievances.filter(g => g.priority === 'high' && g.status !== 'resolved').slice(0, 3);
    highPriorityGrievances.forEach(grievance => {
        const categoryLabels = {
            leakage: 'Water Leakage',
            no_water: 'No Water Supply',
            quality: 'Water Quality Issue',
            billing: 'Billing Issue',
            pressure: 'Low Pressure'
        };

        combinedAlerts.push({
            type: 'warning',
            icon: 'fa-flag',
            message: `${categoryLabels[grievance.category] || 'Issue'} - ${grievance.location.address}`,
            value: grievance.id,
            time: getRelativeTime(grievance.created_at),
            timestamp: new Date(grievance.created_at).getTime()
        });
    });

    // Sort by timestamp and take top 8
    combinedAlerts.sort((a, b) => b.timestamp - a.timestamp);

    console.log('Combined alerts count:', combinedAlerts.length);

    if (combinedAlerts.length === 0) {
        alertsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <i class="fas fa-check-circle" style="font-size: 48px; color: var(--success-color); margin-bottom: 10px;"></i>
                <p>No critical alerts at this time</p>
                <p style="font-size: 12px; margin-top: 5px;">All systems operating normally</p>
            </div>
        `;
        console.log('No alerts to display');
        return;
    }

    alertsContainer.innerHTML = combinedAlerts.slice(0, 8).map(alert => `
        <div class="activity-item">
            <div class="activity-icon ${alert.type === 'critical' ? 'danger' : 'warning'}" style="background: rgba(${alert.type === 'critical' ? '239, 68, 68' : '245, 158, 11'}, 0.1); color: var(--${alert.type === 'critical' ? 'danger' : 'warning'}-color);">
                <i class="fas ${alert.icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-text">${alert.message}</div>
                <div class="activity-time">
                    <span class="badge badge-${alert.type === 'critical' ? 'danger' : 'warning'}">${alert.value}</span>
                    <span style="margin-left: 10px;">${alert.time}</span>
                </div>
            </div>
        </div>
    `).join('');

    console.log('Alerts rendered successfully');
}

// Update Clock
function updateClock() {
    const currentTime = document.getElementById('currentTime');
    if (currentTime) {
        const now = new Date();
        const options = {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        currentTime.textContent = now.toLocaleDateString('en-IN', options);
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 &&
                !sidebar.contains(e.target) &&
                !menuToggle.contains(e.target) &&
                sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        });
    }
}

// Load Asset Distribution Map
function loadAssetDistribution() {
    const miniMap = document.getElementById('miniMap');
    if (!miniMap) return;

    const assets = DataManager.getAssets();
    const sensors = DataManager.getSensors();
    const grievances = DataManager.getGrievances();

    // Count assets by type
    const assetsByType = {
        pipeline: assets.filter(a => a.type === 'pipeline').length,
        tank: assets.filter(a => a.type === 'tank').length,
        pump: assets.filter(a => a.type === 'pump').length,
        source: assets.filter(a => a.type === 'source').length
    };

    // Count by status
    const operational = assets.filter(a => a.status === 'operational').length;
    const maintenance = assets.filter(a => a.status === 'maintenance').length;
    const critical = assets.filter(a => a.status === 'critical').length;

    // Count sensors by region
    const sensorsByRegion = {
        'North Zone': sensors.filter(s => s.region === 'North Zone').length,
        'South Zone': sensors.filter(s => s.region === 'South Zone').length,
        'East Zone': sensors.filter(s => s.region === 'East Zone').length,
        'West Zone': sensors.filter(s => s.region === 'West Zone').length,
        'Central Zone': sensors.filter(s => s.region === 'Central Zone').length
    };

    const totalAssets = assets.length;
    const totalSensors = sensors.length;
    const activeGrievances = grievances.filter(g => g.status !== 'resolved').length;

    miniMap.innerHTML = `
        <div style="padding: 20px; height: 100%; display: flex; flex-direction: column;">
            <!-- Summary Stats -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 15px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 28px; font-weight: bold;">${totalAssets}</div>
                    <div style="font-size: 12px; opacity: 0.9;">Total Assets</div>
                </div>
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 28px; font-weight: bold;">${totalSensors}</div>
                    <div style="font-size: 12px; opacity: 0.9;">IoT Sensors</div>
                </div>
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 15px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 28px; font-weight: bold;">${activeGrievances}</div>
                    <div style="font-size: 12px; opacity: 0.9;">Active Issues</div>
                </div>
            </div>

            <!-- Asset Types Distribution -->
            <div style="flex: 1; display: flex; flex-direction: column;">
                <h4 style="margin: 0 0 15px 0; font-size: 14px; font-weight: 600; color: var(--text-primary);">
                    <i class="fas fa-chart-pie"></i> Asset Distribution
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                    ${Object.entries(assetsByType).map(([type, count]) => {
                        const icons = {
                            pipeline: 'fa-grip-lines',
                            tank: 'fa-database',
                            pump: 'fa-cog',
                            source: 'fa-water'
                        };
                        const colors = {
                            pipeline: '#3b82f6',
                            tank: '#8b5cf6',
                            pump: '#f59e0b',
                            source: '#10b981'
                        };
                        return `
                            <div style="background: rgba(${getRGB(colors[type])}, 0.1); padding: 12px; border-radius: 8px; border-left: 4px solid ${colors[type]};">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <i class="fas ${icons[type]}" style="color: ${colors[type]}; margin-right: 8px;"></i>
                                        <span style="font-size: 12px; color: var(--text-secondary); text-transform: capitalize;">${type}s</span>
                                    </div>
                                    <span style="font-size: 18px; font-weight: bold; color: ${colors[type]};">${count}</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- Regional Coverage -->
                <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: var(--text-primary);">
                    <i class="fas fa-map-marked-alt"></i> Regional Sensor Coverage
                </h4>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${Object.entries(sensorsByRegion).map(([region, count]) => {
                        const percentage = ((count / totalSensors) * 100).toFixed(1);
                        return `
                            <div style="background: #f9fafb; padding: 10px; border-radius: 6px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                    <span style="font-size: 12px; font-weight: 500;">${region}</span>
                                    <span style="font-size: 12px; font-weight: 600; color: var(--primary-color);">${count} sensors</span>
                                </div>
                                <div style="height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden;">
                                    <div style="height: 100%; background: linear-gradient(90deg, #3b82f6, #2563eb); width: ${percentage}%;"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- Status Summary -->
                <div style="display: flex; gap: 10px; margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border-color);">
                    <div style="flex: 1; text-align: center;">
                        <div style="font-size: 20px; font-weight: bold; color: var(--success-color);">${operational}</div>
                        <div style="font-size: 11px; color: var(--text-secondary);">Operational</div>
                    </div>
                    <div style="flex: 1; text-align: center;">
                        <div style="font-size: 20px; font-weight: bold; color: var(--warning-color);">${maintenance}</div>
                        <div style="font-size: 11px; color: var(--text-secondary);">Maintenance</div>
                    </div>
                    <div style="flex: 1; text-align: center;">
                        <div style="font-size: 20px; font-weight: bold; color: var(--danger-color);">${critical}</div>
                        <div style="font-size: 11px; color: var(--text-secondary);">Critical</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Helper function to convert hex to RGB
function getRGB(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
        return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
    }
    return '100, 116, 139';
}
