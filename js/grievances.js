// Grievance Management JavaScript
let grievances = [];
let filteredGrievances = [];
let currentPage = 1;
const itemsPerPage = 10;

document.addEventListener('DOMContentLoaded', function() {
    Auth.requireAuth();
    loadGrievances();
    updateStats();
    renderTable();
    setupFilters();
    setupEventListeners();
});

// Load grievances from DataManager
function loadGrievances() {
    grievances = DataManager.getGrievances();
    filteredGrievances = [...grievances];
}

// Update statistics
function updateStats() {
    const total = grievances.length;
    const registered = grievances.filter(g => g.status === 'registered').length;
    const assigned = grievances.filter(g => g.status === 'assigned').length;
    const inProgress = grievances.filter(g => g.status === 'in_progress').length;
    const resolved = grievances.filter(g => g.status === 'resolved').length;

    document.getElementById('totalGrievances').textContent = total;
    document.getElementById('openCount').textContent = registered;
    document.getElementById('inProgressCount').textContent = inProgress + assigned;
    document.getElementById('resolvedCount').textContent = resolved;

    // Calculate average resolution time
    const resolvedGrievances = grievances.filter(g => g.status === 'resolved');
    if (resolvedGrievances.length > 0) {
        const totalTime = resolvedGrievances.reduce((sum, g) => {
            const created = new Date(g.created_at);
            const resolved = new Date(g.timeline[g.timeline.length - 1].timestamp);
            return sum + (resolved - created);
        }, 0);
        const avgHours = Math.round(totalTime / resolvedGrievances.length / 1000 / 60 / 60);
        document.getElementById('avgResolution').textContent = avgHours;
    } else {
        document.getElementById('avgResolution').textContent = 'N/A';
    }

    // Update badge count
    const openCount = registered + assigned + inProgress;
    const badge = document.getElementById('openGrievancesCount');
    if (badge) badge.textContent = openCount;
}

// Render table with pagination
function renderTable() {
    const tbody = document.getElementById('grievancesTable');
    if (!tbody) return;

    if (filteredGrievances.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-secondary);">No grievances found</td></tr>';
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageGrievances = filteredGrievances.slice(startIndex, endIndex);

    tbody.innerHTML = pageGrievances.map(g => `
        <tr onclick="openGrievanceModal('${g.id}')">
            <td><strong>${g.id}</strong></td>
            <td>
                ${g.citizen}<br>
                <small style="color: var(--text-secondary);">${g.phone}</small>
            </td>
            <td>
                <i class="fas ${getCategoryIcon(g.category)}"></i>
                ${formatCategory(g.category)}
            </td>
            <td><small>${g.location.address}</small></td>
            <td>
                <span class="badge badge-${getStatusBadge(g.status)}">${formatStatus(g.status)}</span>
            </td>
            <td>
                <span class="priority-${g.priority}">
                    <i class="fas fa-flag"></i> ${g.priority.toUpperCase()}
                </span>
            </td>
            <td>${g.assigned_to || '-'}</td>
            <td><small>${formatDate(g.created_at)}</small></td>
        </tr>
    `).join('');

    renderPagination();
}

// Render pagination
function renderPagination() {
    const paginationEl = document.getElementById('pagination');
    if (!paginationEl) return;

    const totalPages = Math.ceil(filteredGrievances.length / itemsPerPage);

    if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }

    let html = `
        <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `
                <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += '<span>...</span>';
        }
    }

    html += `
        <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    paginationEl.innerHTML = html;
}

// Change page
function changePage(page) {
    currentPage = page;
    renderTable();
}

// Setup filters
function setupFilters() {
    const statusFilter = document.getElementById('filterStatus');
    const categoryFilter = document.getElementById('filterCategory');
    const priorityFilter = document.getElementById('filterPriority');
    const searchInput = document.getElementById('searchGrievance');

    function applyFilters() {
        const status = statusFilter.value;
        const category = categoryFilter.value;
        const priority = priorityFilter.value;
        const search = searchInput.value.toLowerCase();

        filteredGrievances = grievances.filter(g => {
            const matchStatus = status === 'all' || g.status === status;
            const matchCategory = category === 'all' || g.category === category;
            const matchPriority = priority === 'all' || g.priority === priority;
            const matchSearch = search === '' ||
                                g.id.toLowerCase().includes(search) ||
                                g.citizen.toLowerCase().includes(search);

            return matchStatus && matchCategory && matchPriority && matchSearch;
        });

        currentPage = 1;
        renderTable();
    }

    statusFilter.addEventListener('change', applyFilters);
    categoryFilter.addEventListener('change', applyFilters);
    priorityFilter.addEventListener('change', applyFilters);
    searchInput.addEventListener('input', applyFilters);
}

// Setup event listeners
function setupEventListeners() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
}

// Open grievance modal
function openGrievanceModal(grievanceId) {
    const grievance = grievances.find(g => g.id === grievanceId);
    if (!grievance) return;

    const modal = document.getElementById('grievanceModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.innerHTML = `<i class="fas fa-file-alt"></i> ${grievance.id} - ${grievance.category.toUpperCase()}`;

    modalBody.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <div class="detail-label">Complaint ID</div>
                <div class="detail-value">${grievance.id}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Status</div>
                <div class="detail-value">
                    <span class="badge badge-${getStatusBadge(grievance.status)}">${formatStatus(grievance.status)}</span>
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Citizen Name</div>
                <div class="detail-value">${grievance.citizen}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Phone</div>
                <div class="detail-value">${grievance.phone}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Category</div>
                <div class="detail-value">
                    <i class="fas ${getCategoryIcon(grievance.category)}"></i>
                    ${formatCategory(grievance.category)}
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Priority</div>
                <div class="detail-value">
                    <span class="badge badge-${grievance.priority === 'high' ? 'danger' : grievance.priority === 'medium' ? 'warning' : 'info'}">
                        ${grievance.priority.toUpperCase()}
                    </span>
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Assigned To</div>
                <div class="detail-value">${grievance.assigned_to || 'Not Assigned'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Created Date</div>
                <div class="detail-value">${formatDate(grievance.created_at)}</div>
            </div>
        </div>

        <div class="detail-item" style="margin-bottom: 25px;">
            <div class="detail-label">Location</div>
            <div class="detail-value">
                <i class="fas fa-map-marker-alt"></i> ${grievance.location.address}<br>
                <small style="color: var(--text-secondary);">
                    Lat: ${grievance.location.lat.toFixed(6)}, Lng: ${grievance.location.lng.toFixed(6)}
                </small>
            </div>
        </div>

        <div class="detail-item" style="margin-bottom: 25px;">
            <div class="detail-label">Description</div>
            <div class="detail-value">${grievance.description}</div>
        </div>

        <div style="margin-bottom: 25px;">
            <h3 style="font-size: 18px; margin-bottom: 15px;">
                <i class="fas fa-history"></i> Timeline
            </h3>
            <div class="timeline">
                ${grievance.timeline.map((event, index) => {
                    const isLast = index === grievance.timeline.length - 1;
                    const iconColor = getStatusColor(event.status);
                    return `
                        <div class="timeline-item">
                            <div class="timeline-icon" style="background: ${iconColor}20; color: ${iconColor};">
                                <i class="fas ${getStatusIcon(event.status)}"></i>
                            </div>
                            <div class="timeline-content">
                                <div class="timeline-title">${formatStatus(event.status)}</div>
                                <div class="timeline-meta">
                                    ${formatDate(event.timestamp)} • By: ${event.by}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>

        <div style="margin-bottom: 25px;">
            <h3 style="font-size: 18px; margin-bottom: 15px;">
                <i class="fas fa-cog"></i> Actions
            </h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 600;">Assign To</label>
                    <select id="assignEngineer" style="width: 100%; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px;">
                        <option value="">Select Engineer</option>
                        <option value="Engineer 1" ${grievance.assigned_to === 'Engineer 1' ? 'selected' : ''}>Engineer 1</option>
                        <option value="Engineer 2" ${grievance.assigned_to === 'Engineer 2' ? 'selected' : ''}>Engineer 2</option>
                        <option value="Engineer 3" ${grievance.assigned_to === 'Engineer 3' ? 'selected' : ''}>Engineer 3</option>
                        <option value="Engineer 4" ${grievance.assigned_to === 'Engineer 4' ? 'selected' : ''}>Engineer 4</option>
                        <option value="Engineer 5" ${grievance.assigned_to === 'Engineer 5' ? 'selected' : ''}>Engineer 5</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 600;">Update Status</label>
                    <select id="updateStatus" style="width: 100%; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px;">
                        <option value="registered" ${grievance.status === 'registered' ? 'selected' : ''}>Registered</option>
                        <option value="assigned" ${grievance.status === 'assigned' ? 'selected' : ''}>Assigned</option>
                        <option value="in_progress" ${grievance.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                        <option value="resolved" ${grievance.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="comments-section">
            <h3 style="font-size: 18px; margin-bottom: 15px;">
                <i class="fas fa-comments"></i> Comments
            </h3>
            <div id="commentsList">
                ${grievance.comments && grievance.comments.length > 0 ?
                    grievance.comments.map(c => `
                        <div class="comment">
                            <strong>${c.by}</strong> • <small>${formatDate(c.timestamp)}</small><br>
                            ${c.text}
                        </div>
                    `).join('') :
                    '<p style="color: var(--text-secondary); font-size: 13px;">No comments yet</p>'
                }
            </div>
            <textarea id="newComment" placeholder="Add a comment..." style="width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 8px; margin-top: 15px; font-family: 'Poppins', sans-serif; resize: vertical; min-height: 80px;"></textarea>
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 25px; padding-top: 25px; border-top: 2px solid var(--border-color);">
            <button class="btn btn-secondary" onclick="closeGrievanceModal()">Close</button>
            <button class="btn btn-primary" onclick="addComment('${grievance.id}')">
                <i class="fas fa-comment"></i> Add Comment
            </button>
            <button class="btn btn-success" onclick="updateGrievance('${grievance.id}')">
                <i class="fas fa-save"></i> Update
            </button>
            <a href="map.html" class="btn btn-info">
                <i class="fas fa-map-marker-alt"></i> View on Map
            </a>
        </div>
    `;

    modal.style.display = 'block';
}

// Close grievance modal
function closeGrievanceModal() {
    document.getElementById('grievanceModal').style.display = 'none';
}

// Update grievance
function updateGrievance(grievanceId) {
    const assignedTo = document.getElementById('assignEngineer').value;
    const newStatus = document.getElementById('updateStatus').value;

    const grievance = grievances.find(g => g.id === grievanceId);
    if (!grievance) return;

    let updated = false;

    if (assignedTo && assignedTo !== grievance.assigned_to) {
        grievance.assigned_to = assignedTo;
        if (grievance.status === 'registered') {
            grievance.status = 'assigned';
            grievance.timeline.push({
                status: 'assigned',
                timestamp: new Date().toISOString(),
                by: Auth.getSession().name
            });
        }
        updated = true;
    }

    if (newStatus !== grievance.status) {
        grievance.status = newStatus;
        grievance.timeline.push({
            status: newStatus,
            timestamp: new Date().toISOString(),
            by: Auth.getSession().name
        });
        updated = true;
    }

    if (updated) {
        DataManager.updateGrievance(grievanceId, grievance);
        alert('Grievance updated successfully!');
        loadGrievances();
        updateStats();
        renderTable();
        closeGrievanceModal();
    } else {
        alert('No changes made');
    }
}

// Add comment
function addComment(grievanceId) {
    const commentText = document.getElementById('newComment').value.trim();
    if (!commentText) {
        alert('Please enter a comment');
        return;
    }

    const grievance = grievances.find(g => g.id === grievanceId);
    if (!grievance) return;

    if (!grievance.comments) grievance.comments = [];

    grievance.comments.push({
        text: commentText,
        by: Auth.getSession().name,
        timestamp: new Date().toISOString()
    });

    DataManager.updateGrievance(grievanceId, grievance);

    alert('Comment added successfully!');
    loadGrievances();
    closeGrievanceModal();
    openGrievanceModal(grievanceId);
}

// Add new grievance
function addNewGrievance() {
    const citizen = prompt('Enter citizen name:');
    if (!citizen) return;

    const phone = prompt('Enter phone number:');
    if (!phone) return;

    const category = prompt('Enter category (leakage/no_water/quality/billing/pressure):');
    if (!category) return;

    const description = prompt('Enter description:');
    if (!description) return;

    const address = prompt('Enter address:');
    if (!address) return;

    const newGrievance = {
        id: `GRV${String(grievances.length + 1).padStart(4, '0')}`,
        citizen: citizen,
        phone: phone,
        category: category,
        description: description,
        location: {
            lat: 12.9716 + (Math.random() - 0.5) * 0.1,
            lng: 77.5946 + (Math.random() - 0.5) * 0.1,
            address: address
        },
        status: 'registered',
        priority: 'medium',
        assigned_to: null,
        created_at: new Date().toISOString(),
        timeline: [{
            status: 'registered',
            timestamp: new Date().toISOString(),
            by: Auth.getSession().name
        }],
        comments: []
    };

    DataManager.addGrievance(newGrievance);
    alert('New complaint registered successfully!\nComplaint ID: ' + newGrievance.id);

    loadGrievances();
    updateStats();
    renderTable();
}

// Export grievances
function exportGrievances() {
    let csv = 'ID,Citizen,Phone,Category,Location,Status,Priority,Assigned To,Created Date\n';

    filteredGrievances.forEach(g => {
        csv += `${g.id},"${g.citizen}",${g.phone},${g.category},"${g.location.address}",${g.status},${g.priority},"${g.assigned_to || 'N/A'}",${g.created_at}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grievances.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

// Helper functions
function getCategoryIcon(category) {
    const icons = {
        leakage: 'fa-droplet',
        no_water: 'fa-ban',
        quality: 'fa-flask',
        billing: 'fa-file-invoice-dollar',
        pressure: 'fa-gauge-high'
    };
    return icons[category] || 'fa-question-circle';
}

function formatCategory(category) {
    return category.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getStatusBadge(status) {
    const badges = {
        registered: 'secondary',
        assigned: 'info',
        in_progress: 'warning',
        resolved: 'success'
    };
    return badges[status] || 'secondary';
}

function formatStatus(status) {
    return status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getStatusColor(status) {
    const colors = {
        registered: '#94a3b8',
        assigned: '#3b82f6',
        in_progress: '#f59e0b',
        resolved: '#10b981'
    };
    return colors[status] || '#94a3b8';
}

function getStatusIcon(status) {
    const icons = {
        registered: 'fa-clipboard-list',
        assigned: 'fa-user-check',
        in_progress: 'fa-spinner',
        resolved: 'fa-check-circle'
    };
    return icons[status] || 'fa-circle';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-IN', options);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('grievanceModal');
    if (event.target == modal) {
        closeGrievanceModal();
    }
}
