
// src/views/dashboard/main_features/main_features.js
export function init(status, shadowRoot, viewContext) {
    // Handle navigation to the Account page
    shadowRoot.getElementById('account-btn')?.addEventListener('click', () => {
        const event = new CustomEvent('change-dashboard-view', {
            detail: { viewName: 'account_details' },
            bubbles: true, composed: true
        });
        shadowRoot.getElementById('account-btn').dispatchEvent(event);
    });

    // Handle feature button clicks
    shadowRoot.querySelectorAll('.use-feature-btn').forEach(button => {
        button.addEventListener('click', () => {
            const featureName = button.dataset.feature;
            
            let nextViewName;
            // --- UPDATED: Navigation Logic ---
            if (featureName === 'aiDescriptions') {
                nextViewName = 'choose_description_type';
            } else if (featureName === 'autoMessages') {
                nextViewName = 'start_message';
            } else if (featureName === 'autoLikes') {
                nextViewName = 'start_auto_like';
            } else if (featureName === 'autoFollows') {
                nextViewName = 'start_auto_follow';
            } else {
                // Default for 'refreshes' or any other feature that needs item selection
                nextViewName = 'select_items';
            }

            const event = new CustomEvent('change-dashboard-view', {
                detail: {
                    viewName: nextViewName,
                    context: { featureName }
                },
                bubbles: true, composed: true
            });
            button.dispatchEvent(event);
        });
    });

    // Logic for showing a final message (remains the same)
    if (viewContext && viewContext.apiResponse) {
        const { apiResponse, originalFeature } = viewContext;
        const messageBox = shadowRoot.getElementById('message-box');

        if (apiResponse.success) {
            messageBox.textContent = apiResponse.data.message || `Used ${originalFeature}!`;
            messageBox.className = 'feedback success';
        } else {
            messageBox.textContent = `Error: ${apiResponse.error}`;
            messageBox.className = 'feedback error';
        }
        
        messageBox.style.display = 'block';
        setTimeout(() => { 
            if (messageBox) messageBox.style.display = 'none'; 
        }, 5000);
    }
}