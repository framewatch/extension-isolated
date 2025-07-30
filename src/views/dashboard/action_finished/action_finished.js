// src/views/dashboard/action_finished/action_finished.js
export function init(status, shadowRoot, viewContext) {
    const messageEl = shadowRoot.getElementById('finished-message');
    const { apiResponse } = viewContext;

    // Display the success or error message from the API call
    if (apiResponse.success) {
        messageEl.textContent = apiResponse.data.message || 'The feature was used successfully.';
    } else {
        messageEl.textContent = `An error occurred: ${apiResponse.error}`;
    }

    const doneBtn = shadowRoot.getElementById('done-btn');
    doneBtn?.addEventListener('click', () => {
        // This event tells the dashboard to switch back to the main_features view
        const event = new CustomEvent('change-dashboard-view', {
            detail: { viewName: 'features' },
            bubbles: true,
            composed: true
        });
        doneBtn.dispatchEvent(event);
    });
}