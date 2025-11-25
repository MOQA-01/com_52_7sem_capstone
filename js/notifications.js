// Notification System
const NotificationManager = {
    // Generate mock notifications
    generateNotifications() {
        const notifications = [
            {
                id: 1,
                type: 'danger',
                icon: 'fa-exclamation-triangle',
                title: 'Critical Water Pressure Drop',
                description: 'Sensor S0015 detected critical pressure drop in Koramangala area. Immediate attention required.',
                time: '5 minutes ago',
                timestamp: new Date(Date.now() - 5 * 60 * 1000),
                unread: true
            },
            {
                id: 2,
                type: 'warning',
                icon: 'fa-flask',
                title: 'Water Quality Alert',
                description: 'pH sensor S0023 showing abnormal readings in Whitefield water source.',
                time: '15 minutes ago',
                timestamp: new Date(Date.now() - 15 * 60 * 1000),
                unread: true
            },
            {
                id: 3,
                type: 'info',
                icon: 'fa-user-check',
                title: 'New Grievance Registered',
                description: 'Complaint #JJM2025001234 filed for water leakage in MG Road area.',
                time: '30 minutes ago',
                timestamp: new Date(Date.now() - 30 * 60 * 1000),
                unread: true
            },
            {
                id: 4,
                type: 'success',
                icon: 'fa-check-circle',
                title: 'Complaint Resolved',
                description: 'Grievance #JJM2025001210 has been successfully resolved in Indiranagar.',
                time: '1 hour ago',
                timestamp: new Date(Date.now() - 60 * 60 * 1000),
                unread: false
            },
            {
                id: 5,
                type: 'warning',
                icon: 'fa-water',
                title: 'High Flow Rate Detected',
                description: 'Flow sensor S0008 showing unusually high readings. Possible leak detected.',
                time: '2 hours ago',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                unread: false
            },
            {
                id: 6,
                type: 'info',
                icon: 'fa-tools',
                title: 'Maintenance Scheduled',
                description: 'Routine maintenance scheduled for pumping station PS-045 on Jan 20, 2025.',
                time: '3 hours ago',
                timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
                unread: false
            },
            {
                id: 7,
                type: 'success',
                icon: 'fa-database',
                title: 'System Backup Complete',
                description: 'Daily system backup completed successfully. All data secured.',
                time: '4 hours ago',
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
                unread: false
            },
            {
                id: 8,
                type: 'info',
                icon: 'fa-chart-line',
                title: 'Monthly Report Available',
                description: 'Water supply analytics report for December 2024 is now available.',
                time: '5 hours ago',
                timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
                unread: false
            },
            {
                id: 9,
                type: 'warning',
                icon: 'fa-tint',
                title: 'Tank Level Low',
                description: 'Storage tank TK-012 in BTM Layout is at 15% capacity. Refill required.',
                time: '6 hours ago',
                timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
                unread: false
            },
            {
                id: 10,
                type: 'success',
                icon: 'fa-sync-alt',
                title: 'System Update Complete',
                description: 'IoT monitoring system has been updated to version 2.5.1.',
                time: '8 hours ago',
                timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
                unread: false
            },
            {
                id: 11,
                type: 'info',
                icon: 'fa-users',
                title: 'New User Registered',
                description: 'A new field engineer has been added to the system.',
                time: '10 hours ago',
                timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000),
                unread: false
            },
            {
                id: 12,
                type: 'danger',
                icon: 'fa-power-off',
                title: 'Pump Station Offline',
                description: 'Pumping station PS-028 in Jayanagar is currently offline. Technical team notified.',
                time: '12 hours ago',
                timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
                unread: false
            }
        ];

        return notifications;
    },

    // Get unread count
    getUnreadCount() {
        const notifications = this.generateNotifications();
        return notifications.filter(n => n.unread).length;
    },

    // Show notification modal
    showModal() {
        let modal = document.getElementById('notificationModal');

        // Create modal if it doesn't exist
        if (!modal) {
            modal = this.createModal();
            document.body.appendChild(modal);
        }

        // Populate notifications
        this.populateNotifications();

        // Show modal
        modal.classList.add('active');
    },

    // Hide notification modal
    hideModal() {
        const modal = document.getElementById('notificationModal');
        if (modal) {
            modal.classList.remove('active');
        }
    },

    // Create modal HTML
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'notificationModal';
        modal.className = 'notification-modal';
        modal.innerHTML = `
            <div class="notification-content">
                <div class="notification-header">
                    <h3><i class="fas fa-bell"></i> Notifications</h3>
                    <button class="notification-close" onclick="NotificationManager.hideModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="notification-body">
                    <ul class="notification-list" id="notificationList"></ul>
                </div>
            </div>
        `;

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal();
            }
        });

        return modal;
    },

    // Populate notifications
    populateNotifications() {
        const list = document.getElementById('notificationList');
        if (!list) return;

        const notifications = this.generateNotifications();

        if (notifications.length === 0) {
            list.innerHTML = `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications</p>
                </div>
            `;
            return;
        }

        list.innerHTML = notifications.map(notif => `
            <li class="notification-item ${notif.unread ? 'unread' : ''}" onclick="NotificationManager.markAsRead(${notif.id})">
                <div class="notification-item-content">
                    <div class="notification-icon-wrapper ${notif.type}">
                        <i class="fas ${notif.icon}"></i>
                    </div>
                    <div class="notification-item-text">
                        <div class="notification-item-title">${notif.title}</div>
                        <div class="notification-item-desc">${notif.description}</div>
                        <div class="notification-item-time">
                            <i class="fas fa-clock"></i> ${notif.time}
                        </div>
                    </div>
                </div>
            </li>
        `).join('');
    },

    // Mark notification as read
    markAsRead(notifId) {
        console.log(`Notification ${notifId} marked as read`);
        // In a real system, this would update the database
    },

    // Initialize notification system
    init() {
        // Update notification badge counts
        this.updateBadges();

        // Add click event to all bell icons
        document.querySelectorAll('[title="Notifications"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showModal();
            });
        });

        // Update badges every 30 seconds
        setInterval(() => {
            this.updateBadges();
        }, 30000);
    },

    // Update notification badge counts
    updateBadges() {
        const count = this.getUnreadCount();
        document.querySelectorAll('[title="Notifications"] .notification-count').forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });
    }
};

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NotificationManager.init());
} else {
    NotificationManager.init();
}
