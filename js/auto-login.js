// Auto-login script for testing
// This creates a mock session if none exists

(function() {
    if (!localStorage.getItem('jjm_session')) {
        const mockSession = {
            username: 'admin',
            role: 'admin',
            name: 'Test Admin',
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('jjm_session', JSON.stringify(mockSession));
        console.log('Auto-login: Mock session created');
    } else {
        console.log('Auto-login: Session already exists');
    }
})();
