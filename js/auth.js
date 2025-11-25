// Authentication Module
const Auth = {
    mockUsers: {
        admin: { username: 'admin', password: 'admin123', role: 'admin', name: 'Admin User' },
        engineer: { username: 'engineer', password: 'eng123', role: 'engineer', name: 'Field Engineer' },
        citizen: { username: 'citizen', password: 'citizen123', role: 'citizen', name: 'Citizen User' },
        official: { username: 'official', password: 'off123', role: 'official', name: 'Government Official' }
    },

    login(username, password, role) {
        const user = this.mockUsers[role];

        if (user && user.username === username && user.password === password) {
            const session = {
                username: user.username,
                role: user.role,
                name: user.name,
                loginTime: new Date().toISOString()
            };

            localStorage.setItem('jjm_session', JSON.stringify(session));
            return { success: true, user: session };
        }

        return { success: false, message: 'Invalid credentials' };
    },

    logout() {
        localStorage.removeItem('jjm_session');
        window.location.href = 'index.html';
    },

    getSession() {
        const session = localStorage.getItem('jjm_session');
        return session ? JSON.parse(session) : null;
    },

    isAuthenticated() {
        return this.getSession() !== null;
    },

    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    },

    checkRole(allowedRoles) {
        const session = this.getSession();
        if (!session) return false;
        return allowedRoles.includes(session.role);
    }
};

// Login Form Handler
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        const result = Auth.login(username, password, role);

        if (result.success) {
            // Show success message
            const alert = document.createElement('div');
            alert.className = 'alert alert-success';
            alert.innerHTML = '<i class="fas fa-check-circle"></i> Login successful! Redirecting...';
            this.insertBefore(alert, this.firstChild);

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            // Show error message
            const existingAlert = this.querySelector('.alert');
            if (existingAlert) existingAlert.remove();

            const alert = document.createElement('div');
            alert.className = 'alert alert-error';
            alert.innerHTML = '<i class="fas fa-times-circle"></i> ' + result.message;
            this.insertBefore(alert, this.firstChild);
        }
    });
}

// Logout function (global)
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        Auth.logout();
    }
}

// Check authentication on protected pages
if (window.location.pathname !== '/index.html' && !window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('citizen-portal.html')) {
    if (Auth.requireAuth()) {
        // Update user info in navbar
        const session = Auth.getSession();
        const userNameEl = document.getElementById('userName');
        const userRoleEl = document.getElementById('userRole');
        const userAvatar = document.querySelector('.user-avatar');

        if (userNameEl) userNameEl.textContent = session.name;
        if (userRoleEl) userRoleEl.textContent = session.role.charAt(0).toUpperCase() + session.role.slice(1);
        if (userAvatar) userAvatar.textContent = session.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
}
