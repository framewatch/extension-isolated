import { getFriendlyErrorMessage } from '../../../error-dictionary.js';

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
            targetType: shadowRoot.querySelector('input[name="target_type"]:checked').value,
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
                        data: { message: `Auto Like action has started.` }
                    }
                }
            },
            bubbles: true, composed: true
        });
        startBtn.dispatchEvent(event);
    });

    updateTargetInput('user');
}