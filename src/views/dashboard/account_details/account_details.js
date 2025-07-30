// src/views/dashboard/account_details/account_details.js
export function init(status, shadowRoot) {
    const logoutBtn = shadowRoot.getElementById('logout-btn-account');
    const welcomeEl = shadowRoot.getElementById('welcome-message');
    const emailEl = shadowRoot.getElementById('account-email');
    const subEl = shadowRoot.getElementById('subscription-status');

    // Add event listener for the "Logout" button
    logoutBtn?.addEventListener('click', () => handleLogout(logoutBtn));

    // Populate user-specific information
    if (welcomeEl && status.user) {
        welcomeEl.textContent = `Welcome, ${status.user.email}!`;
    }

    if (emailEl && status.user) {
        emailEl.textContent = status.user.email;
    }

    if (subEl) {
        subEl.textContent = status.isSubscribed ? `Active (${status.role || 'Standard'})` : 'Inactive';
    }
}

async function handleLogout(logoutBtn) {
    if (logoutBtn) logoutBtn.disabled = true;
    
    const response = await chrome.runtime.sendMessage({ type: 'LOGOUT' });
    
    if (response.success) {
        // Dispatch the event to trigger a main view change to the login screen
        const event = new CustomEvent('auth-state-update', { 
            detail: response.status, 
            bubbles: true, 
            composed: true 
        });
        logoutBtn.dispatchEvent(event);
    }
}