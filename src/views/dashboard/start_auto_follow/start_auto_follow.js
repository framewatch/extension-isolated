import { getFriendlyErrorMessage } from '../../../error-dictionary.js';

export function init(status, shadowRoot, viewContext) {
    const { featureName } = viewContext;

    const startBtn = shadowRoot.getElementById('start-auto-follow-btn');
    const targetInput = shadowRoot.getElementById('target-input');
    const quantityInput = shadowRoot.getElementById('quantity-input');
    const errorEl = shadowRoot.getElementById('follow-action-error');

    startBtn?.addEventListener('click', () => {
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

        const settings = {
            targetType: 'keyword', // Hardcoded
            targetValue: targetValue,
            quantity: quantityValue
        };

        startBtn.disabled = true;

        const event = new CustomEvent('change-dashboard-view', {
            detail: {
                viewName: 'progress_screen',
                context: {
                    featureName,
                    actionType: 'finalUpdate',
                    apiResponse: {
                        success: true,
                        data: { message: `Auto Follow action has started.` }
                    }
                }
            },
            bubbles: true, composed: true
        });
        startBtn.dispatchEvent(event);
    });
}