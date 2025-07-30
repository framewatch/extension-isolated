// src/views/dashboard/progress_screen/progress_screen.js

// This function can be called from outside to update the progress
function updateProgress(shadowRoot, percentage, item) {
    const progressCircle = shadowRoot.getElementById('progress-circle');
    const progressPercentage = shadowRoot.getElementById('progress-percentage');
    const itemImage = shadowRoot.getElementById('progress-item-image');

    if (progressCircle && progressPercentage) {
        const radius = progressCircle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;

        progressCircle.style.strokeDashoffset = offset;
        progressPercentage.textContent = `${Math.round(percentage)}%`;
    }

    if (itemImage && item && item.color) {
        itemImage.style.backgroundColor = item.color;
    }
}


export async function init(status, shadowRoot, viewContext) {
    const { featureName, items, context } = viewContext; // Assuming 'items' will be passed in the context for processing

    // Mock processing of items
    const totalItems = items ? items.length : 10; // Mock 10 items if none are passed
    let processedItems = 0;

    // Set the initial state
    updateProgress(shadowRoot, 0, items ? items[0] : {color: '#c6c6c6'});

    const processInterval = setInterval(() => {
        processedItems++;
        const progress = (processedItems / totalItems) * 100;

        // Get the current item to display its image/color
        const currentItem = items ? items[processedItems -1] : {color: '#'+(Math.random()*0xFFFFFF<<0).toString(16)};

        updateProgress(shadowRoot, progress, currentItem);

        if (processedItems >= totalItems) {
            clearInterval(processInterval);
            setTimeout(finishAction, 500); // Wait half a second before finishing
        }
    }, 500); // Process one item every 500ms

    async function finishAction() {
         let nextViewName;
        let nextContext = {};

        // --- UPDATED: Simplified Conditional Logic ---
        if (viewContext.actionType === 'finalUpdate') {
            // After the final update, go to the finished screen
            nextViewName = 'action_finished';
            nextContext = {
                apiResponse: {
                    success: true,
                    data: { message: "All listings have been updated successfully." }
                }
            };
        } else {
            // This is the initial generation flow for all features
            const { featureName } = viewContext;
            const response = await chrome.runtime.sendMessage({
                type: 'USE_FEATURE',
                payload: { featureName }
            });

            if (featureName === 'aiDescriptions') {
                nextViewName = 'accept_description'; // Go to review screen after generation
                // Create a mock response for the mockup
                nextContext.itemsToReview = [
                    { id: 1, generatedDescription: 'This is a mock AI description for item 1.' },
                    { id: 2, generatedDescription: 'This is another mock AI description for item 2.' },
                    { id: 3, generatedDescription: 'A third mock description to review.' }
                ];
            } else {
                nextViewName = 'action_finished'; // Go straight to finished screen for other features
            }
            nextContext.apiResponse = response;
        }

        const event = new CustomEvent('change-dashboard-view', {
            detail: { viewName: nextViewName, context: nextContext },
            bubbles: true,
            composed: true
        });
        shadowRoot.getElementById('dashboard-content').dispatchEvent(event);
    }
}