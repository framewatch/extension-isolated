import { getFriendlyErrorMessage } from '../../../error-dictionary.js';
// We need to fetch items by keyword to find users to follow.
import { fetchKeywordListings } from '../../../services/api-service.js';

export function init(status, shadowRoot, viewContext) {
    const startBtn = shadowRoot.getElementById('start-auto-follow-btn');
    const targetInput = shadowRoot.getElementById('target-input');
    const quantityInput = shadowRoot.getElementById('quantity-input');
    const errorEl = shadowRoot.getElementById('follow-action-error');

    startBtn?.addEventListener('click', async () => {
        const targetValue = targetInput.value.trim();
        const quantityValue = quantityInput.value;

        // --- 1. Basic Validation ---
        errorEl.style.display = 'none';
        if (!targetValue || !quantityValue) {
            errorEl.textContent = getFriendlyErrorMessage('all-fields-required');
            errorEl.style.display = 'block';
            return;
        }

        startBtn.disabled = true;
        startBtn.textContent = 'Finding users...';

        // --- 2. Fetch items to get users ---
        const items = await fetchKeywordListings(targetValue, quantityValue);

        if (items === null || items.length === 0) {
            errorEl.textContent = "Could not find any items for that keyword.";
            errorEl.style.display = 'block';
            startBtn.disabled = false;
            startBtn.textContent = 'Start Auto Follow';
            return;
        }
        
        // --- 3. Navigate to Progress Screen with the list of items ---
        // The progress screen will extract the user ID from each item.
        const event = new CustomEvent('change-dashboard-view', {
            detail: {
                viewName: 'progress_screen',
                context: {
                    actionType: 'autoFollow', // Our new action type
                    itemsToProcess: items
                }
            },
            bubbles: true,
            composed: true
        });
        startBtn.dispatchEvent(event);
    });
}