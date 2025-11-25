// Map JavaScript with Leaflet.js
let map;
let layers = {
    pipelines: null,
    tanks: null,
    pumps: null,
    sources: null,
    complaints: null
};

let allMarkers = [];

document.addEventListener('DOMContentLoaded', function() {
    Auth.requireAuth();
    initializeMap();
    loadAssets();
    setupMapControls();
    setupSearch();
});

// Initialize Leaflet Map
function initializeMap() {
    // Center on Bangalore
    map = L.map('map').setView([12.9716, 77.5946], 12);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // Create layer groups
    layers.pipelines = L.layerGroup().addTo(map);
    layers.tanks = L.layerGroup().addTo(map);
    layers.pumps = L.layerGroup().addTo(map);
    layers.sources = L.layerGroup().addTo(map);
    layers.complaints = L.layerGroup().addTo(map);
}

// Load and Display Assets
function loadAssets() {
    const assets = DataManager.getAssets();
    const grievances = DataManager.getGrievances();

    // Clear existing layers
    Object.values(layers).forEach(layer => layer.clearLayers());
    allMarkers = [];

    // Add pipelines
    assets.filter(a => a.type === 'pipeline').forEach(asset => {
        const polyline = L.polyline(asset.coordinates, {
            color: getStatusColor(asset.status),
            weight: 4,
            opacity: 0.7
        }).addTo(layers.pipelines);

        polyline.bindPopup(createPipelinePopup(asset));
        allMarkers.push({ marker: polyline, asset: asset });
    });

    // Add tanks
    assets.filter(a => a.type === 'tank').forEach(asset => {
        const marker = L.circleMarker(asset.coordinates, {
            radius: 10,
            fillColor: '#10b981',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(layers.tanks);

        marker.bindPopup(createTankPopup(asset));
        allMarkers.push({ marker: marker, asset: asset });
    });

    // Add pumping stations
    assets.filter(a => a.type === 'pump').forEach(asset => {
        const marker = L.circleMarker(asset.coordinates, {
            radius: 10,
            fillColor: '#f59e0b',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(layers.pumps);

        marker.bindPopup(createPumpPopup(asset));
        allMarkers.push({ marker: marker, asset: asset });
    });

    // Add water sources
    assets.filter(a => a.type === 'source').forEach(asset => {
        const marker = L.circleMarker(asset.coordinates, {
            radius: 12,
            fillColor: '#06b6d4',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(layers.sources);

        marker.bindPopup(createSourcePopup(asset));
        allMarkers.push({ marker: marker, asset: asset });
    });

    // Add complaints
    grievances.filter(g => g.status !== 'resolved').forEach(grievance => {
        const marker = L.circleMarker([grievance.location.lat, grievance.location.lng], {
            radius: 8,
            fillColor: '#ef4444',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
        }).addTo(layers.complaints);

        marker.bindPopup(createComplaintPopup(grievance));
        allMarkers.push({ marker: marker, asset: grievance, type: 'complaint' });
    });
}

// Create Popup Content
function createPipelinePopup(asset) {
    return `
        <div class="popup-header">
            <h4><i class="fas fa-pipe"></i> ${asset.name}</h4>
            <p>ID: ${asset.id}</p>
        </div>
        <div class="popup-body">
            <div class="popup-row">
                <span class="popup-label">Type:</span>
                <span class="popup-value">Pipeline</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Diameter:</span>
                <span class="popup-value">${asset.diameter} mm</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Material:</span>
                <span class="popup-value">${asset.material}</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Length:</span>
                <span class="popup-value">${asset.length} m</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Status:</span>
                <span class="badge badge-${getStatusBadge(asset.status)}">${asset.status}</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Installed:</span>
                <span class="popup-value">${asset.installation_date}</span>
            </div>
        </div>
    `;
}

function createTankPopup(asset) {
    const percentage = ((asset.current_level / asset.capacity) * 100).toFixed(1);
    return `
        <div class="popup-header">
            <h4><i class="fas fa-database"></i> ${asset.name}</h4>
            <p>ID: ${asset.id}</p>
        </div>
        <div class="popup-body">
            <div class="popup-row">
                <span class="popup-label">Type:</span>
                <span class="popup-value">Storage Tank</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Capacity:</span>
                <span class="popup-value">${(asset.capacity / 1000).toFixed(0)} KL</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Current Level:</span>
                <span class="popup-value">${(asset.current_level / 1000).toFixed(1)} KL (${percentage}%)</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Material:</span>
                <span class="popup-value">${asset.material}</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Status:</span>
                <span class="badge badge-${getStatusBadge(asset.status)}">${asset.status}</span>
            </div>
        </div>
    `;
}

function createPumpPopup(asset) {
    return `
        <div class="popup-header">
            <h4><i class="fas fa-pump"></i> ${asset.name}</h4>
            <p>ID: ${asset.id}</p>
        </div>
        <div class="popup-body">
            <div class="popup-row">
                <span class="popup-label">Type:</span>
                <span class="popup-value">Pumping Station</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Capacity:</span>
                <span class="popup-value">${asset.capacity} L/min</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Power:</span>
                <span class="popup-value">${asset.power} HP</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Status:</span>
                <span class="badge badge-${getStatusBadge(asset.status)}">${asset.status}</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Installed:</span>
                <span class="popup-value">${asset.installation_date}</span>
            </div>
        </div>
    `;
}

function createSourcePopup(asset) {
    return `
        <div class="popup-header">
            <h4><i class="fas fa-water"></i> ${asset.name}</h4>
            <p>ID: ${asset.id}</p>
        </div>
        <div class="popup-body">
            <div class="popup-row">
                <span class="popup-label">Type:</span>
                <span class="popup-value">${asset.source_type}</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Capacity:</span>
                <span class="popup-value">${(asset.capacity / 1000).toFixed(0)} KL</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Status:</span>
                <span class="badge badge-success">${asset.status}</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Installed:</span>
                <span class="popup-value">${asset.installation_date}</span>
            </div>
        </div>
    `;
}

function createComplaintPopup(grievance) {
    return `
        <div class="popup-header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
            <h4><i class="fas fa-exclamation-circle"></i> Complaint</h4>
            <p>ID: ${grievance.id}</p>
        </div>
        <div class="popup-body">
            <div class="popup-row">
                <span class="popup-label">Category:</span>
                <span class="popup-value">${grievance.category.replace('_', ' ').toUpperCase()}</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Citizen:</span>
                <span class="popup-value">${grievance.citizen}</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Location:</span>
                <span class="popup-value">${grievance.location.address}</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Status:</span>
                <span class="badge badge-${getStatusBadge(grievance.status)}">${grievance.status}</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Priority:</span>
                <span class="badge badge-${grievance.priority === 'high' ? 'danger' : grievance.priority === 'medium' ? 'warning' : 'info'}">${grievance.priority}</span>
            </div>
            <div style="margin-top: 10px;">
                <a href="grievances.html" class="btn btn-sm btn-primary" style="width: 100%; justify-content: center;">View Details</a>
            </div>
        </div>
    `;
}

// Helper Functions
function getStatusColor(status) {
    const colors = {
        operational: '#10b981',
        maintenance: '#f59e0b',
        critical: '#ef4444',
        offline: '#6b7280'
    };
    return colors[status] || '#3b82f6';
}

function getStatusBadge(status) {
    const badges = {
        operational: 'success',
        maintenance: 'warning',
        critical: 'danger',
        offline: 'secondary',
        registered: 'secondary',
        assigned: 'info',
        in_progress: 'warning',
        resolved: 'success'
    };
    return badges[status] || 'secondary';
}

// Setup Map Controls
function setupMapControls() {
    // Layer toggles
    document.getElementById('layerPipelines').addEventListener('change', function(e) {
        if (e.target.checked) {
            map.addLayer(layers.pipelines);
        } else {
            map.removeLayer(layers.pipelines);
        }
    });

    document.getElementById('layerTanks').addEventListener('change', function(e) {
        if (e.target.checked) {
            map.addLayer(layers.tanks);
        } else {
            map.removeLayer(layers.tanks);
        }
    });

    document.getElementById('layerPumps').addEventListener('change', function(e) {
        if (e.target.checked) {
            map.addLayer(layers.pumps);
        } else {
            map.removeLayer(layers.pumps);
        }
    });

    document.getElementById('layerSources').addEventListener('change', function(e) {
        if (e.target.checked) {
            map.addLayer(layers.sources);
        } else {
            map.removeLayer(layers.sources);
        }
    });

    document.getElementById('layerComplaints').addEventListener('change', function(e) {
        if (e.target.checked) {
            map.addLayer(layers.complaints);
        } else {
            map.removeLayer(layers.complaints);
        }
    });

    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
}

// Setup Search
function setupSearch() {
    const searchInput = document.getElementById('mapSearch');
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm.length < 2) return;

        const results = allMarkers.filter(item => {
            const asset = item.asset;
            return asset.id.toLowerCase().includes(searchTerm) ||
                   (asset.name && asset.name.toLowerCase().includes(searchTerm));
        });

        if (results.length > 0) {
            const firstResult = results[0];
            if (firstResult.asset.coordinates) {
                if (Array.isArray(firstResult.asset.coordinates[0])) {
                    // It's a polyline
                    map.fitBounds(firstResult.marker.getBounds());
                } else {
                    // It's a point
                    map.setView(firstResult.asset.coordinates, 15);
                }
                firstResult.marker.openPopup();
            } else if (firstResult.asset.location) {
                // It's a complaint
                map.setView([firstResult.asset.location.lat, firstResult.asset.location.lng], 15);
                firstResult.marker.openPopup();
            }
        }
    });
}

// Action Functions
function addNewAsset() {
    alert('Add Asset feature: Click on the map to add a new asset (Demo feature)');
    const clickHandler = function(e) {
        const confirmation = confirm(`Add new asset at coordinates:\nLat: ${e.latlng.lat.toFixed(6)}\nLng: ${e.latlng.lng.toFixed(6)}\n\nThis is a demo feature. Asset data would be saved to localStorage.`);
        if (confirmation) {
            // In a real application, this would open a form
            const newAsset = {
                id: `DEMO${Date.now()}`,
                name: 'Demo Asset',
                type: 'tank',
                coordinates: [e.latlng.lat, e.latlng.lng],
                status: 'operational',
                installation_date: new Date().toISOString().split('T')[0]
            };
            DataManager.addAsset(newAsset);
            alert('Demo asset added successfully!');
            loadAssets(); // Reload the map
        }
        map.off('click', clickHandler);
    };
    map.on('click', clickHandler);
}

function measureDistance() {
    alert('Distance Measurement Tool: Click two points on the map to measure distance (Demo feature)');
    let points = [];
    let tempLine = null;

    const clickHandler = function(e) {
        points.push(e.latlng);

        if (points.length === 1) {
            L.circleMarker(points[0], { radius: 5, color: 'red' }).addTo(map);
        } else if (points.length === 2) {
            L.circleMarker(points[1], { radius: 5, color: 'red' }).addTo(map);
            const distance = map.distance(points[0], points[1]);
            tempLine = L.polyline(points, { color: 'red', dashArray: '5, 10' }).addTo(map);
            tempLine.bindPopup(`Distance: ${(distance / 1000).toFixed(2)} km`).openPopup();
            alert(`Distance: ${(distance / 1000).toFixed(2)} km`);
            map.off('click', clickHandler);
            points = [];
        }
    };

    map.on('click', clickHandler);
}

function exportMap() {
    alert('Export Map feature: This would export the current map view as PNG or PDF (Demo feature)\n\nIn a real application, libraries like leaflet-image or html2canvas would be used.');
}
