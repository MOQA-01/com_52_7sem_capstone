/**
 * User Profile Dropdown Menu Handler
 * Handles dropdown toggle and logout functionality
 */

// Initialize dropdown when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const userProfile = document.getElementById('userProfile');
    const userDropdown = document.getElementById('userDropdown');

    if (userProfile && userDropdown) {
        // Toggle dropdown on click
        userProfile.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!userProfile.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });

        // Close dropdown when pressing Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                userDropdown.classList.remove('show');
            }
        });
    }
});

/**
 * Logout function - clears session and redirects to login
 */
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear all stored data
        sessionStorage.clear();
        localStorage.clear();

        // Show logout message
        console.log('User logged out successfully');

        // Redirect to login page
        window.location.href = 'index.html';
    }
}
