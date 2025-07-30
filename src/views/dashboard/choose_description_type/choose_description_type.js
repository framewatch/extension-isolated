
// src/views/dashboard/choose_description_type/choose_description_type.js
export function init(status, shadowRoot, viewContext) {
    const proceedBtn = shadowRoot.getElementById('proceed-to-select-items-btn');

    proceedBtn?.addEventListener('click', () => {
        // Find the selected radio button
        const selectedRadio = shadowRoot.querySelector('input[name="desc_type"]:checked');
        
        // --- FIX: Ensure a radio button is selected ---
        if (!selectedRadio) {
            // In a real app, you might want to show an error message to the user here.
            console.error("No description type selected.");
            return; 
        }
        const selectedType = selectedRadio.value;

        // Navigate to the item selection screen, passing the chosen type in the context
        const event = new CustomEvent('change-dashboard-view', {
            detail: {
                viewName: 'select_items',
                context: {
                    featureName: 'aiDescriptions', // Keep passing the original feature name
                    descriptionType: selectedType  // Add the newly selected type
                }
            },
            bubbles: true,
            composed: true
        });
        proceedBtn.dispatchEvent(event);
    });
}