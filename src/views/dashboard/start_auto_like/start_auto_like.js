import { getFriendlyErrorMessage } from '../../../error-dictionary.js';
import { fetchKeywordListings } from '../../../services/api-service.js';

export function init(status, shadowRoot, viewContext) {
    const { featureName } = viewContext;

    const startBtn = shadowRoot.getElementById('start-auto-like-btn');
    const targetInput = shadowRoot.getElementById('target-input');
    const quantityInput = shadowRoot.getElementById('quantity-input');
    const targetInputLabel = shadowRoot.getElementById('target-input-label');
    const errorEl = shadowRoot.getElementById('like-action-error');
    const targetTypeRadios = shadowRoot.querySelectorAll('input[name="target_type"]');

    function updateTargetInput(targetType) {
        if (targetType === 'user') {
            targetInputLabel.textContent = 'Username';
            targetInput.placeholder = 'Enter username...';
        } else {
            targetInputLabel.textContent = 'Keyword';
            targetInput.placeholder = 'Enter keyword...';
        }
    }

    targetTypeRadios.forEach(radio => {
        radio.addEventListener('change', () => updateTargetInput(radio.value));
    });

    startBtn?.addEventListener('click', async()  => {
        const targetValue = targetInput.value.trim();
        const quantityValue = quantityInput.value;

        errorEl.style.display = 'none'; // Clear previous errors

        if (!targetValue) {
            errorEl.textContent = getFriendlyErrorMessage('enter-username-or-keyword');
            errorEl.style.display = 'block';
            return;
        }
        
        if (!quantityValue) {
            errorEl.textContent = getFriendlyErrorMessage('specify-quantity');
            errorEl.style.display = 'block';
            return;
        }


        startBtn.disabled = true;

        const itemsToLike = await fetchKeywordListings(targetValue, quantityValue);

        if (itemsToLike === null || itemsToLike.length === 0) {
            errorEl.textContent = "Could not find any items for that keyword.";
            errorEl.style.display = 'block';
            startBtn.disabled = false;
            startBtn.textContent = 'Start Auto Like';
            return;
        }

        const event = new CustomEvent('change-dashboard-view', {
            detail: {
                viewName: 'progress_screen',
                context: {
                    // Pass the list of items and the action to perform
                    itemsToProcess: itemsToLike,
                    actionType: 'autoLike'
                }
            },
            bubbles: true,
            composed: true
        });
        startBtn.dispatchEvent(event);
    });

    updateTargetInput('user');
}