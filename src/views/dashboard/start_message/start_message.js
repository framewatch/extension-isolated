import { getFriendlyErrorMessage } from '../../../error-dictionary.js';


// src/views/dashboard/start_message/start_message.js
export function init(status, shadowRoot, viewContext) {
    const startBtn = shadowRoot.getElementById('start-auto-message-btn');
    const offerCheckbox = shadowRoot.getElementById('include-offer-checkbox');
    const offerSettingsDiv = shadowRoot.getElementById('offer-settings');
    const messageText = shadowRoot.getElementById('message-text');
    const messageError = shadowRoot.getElementById('message-error');

    // Toggle visibility of offer settings
    offerCheckbox?.addEventListener('change', () => {
        offerSettingsDiv.style.display = offerCheckbox.checked ? 'block' : 'none';
    });

    // Handle Start button click
    startBtn?.addEventListener('click', () => {
        // --- NEW: Validation Check ---
        if (messageText.value.trim() === '') {
            messageError.textContent = getFriendlyErrorMessage('message-cannot-be-empty');
            messageError.style.display = 'block';
            return; // Stop the function
        }
        
        // Hide error if validation passes
        messageError.style.display = 'none';

        // Gather all settings from the form
        const settings = {
            message: messageText.value,
            delay: shadowRoot.getElementById('delay-minutes').value,
            offer: null
        };

        if (offerCheckbox.checked) {
            const selectedOfferTypeRadio = shadowRoot.querySelector('input[name="offer_type"]:checked');
            // --- FIX: Ensure an offer type is selected ---
            if (!selectedOfferTypeRadio) {
                console.error("Offer checkbox is checked, but no offer type is selected.");
                // Optionally, show an error to the user in the UI.
                return;
            }
            settings.offer = {
                type: selectedOfferTypeRadio.value,
                value: shadowRoot.getElementById('offer-value').value
            };
        }
        startBtn.disabled = true;
        // Navigate to the active screen
        const event = new CustomEvent('change-dashboard-view', {
            detail: {
                viewName: 'auto_message_active',
                context: { settings }
            },
            bubbles: true, composed: true
        });
        startBtn.dispatchEvent(event);
    });
}