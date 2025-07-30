// src/views/dashboard/accept_description/accept_description.js
export function init(status, shadowRoot, viewContext) {
    // A fresh list of items each time the view loads
    const items = [
        { id: 1, description: "✨ Vintage floral summer dress, perfect for sunny days. Size M. Excellent condition.", choice: null },
        { id: 2, description: "Classic leather handbag. Timeless design, spacious interior. Minor wear on corners.", choice: null },
        { id: 3, description: "Men's denim jacket, light wash. A wardrobe essential. Size L. Never worn.", choice: null },
    ];
    let currentIndex = 0;

    const counterEl = shadowRoot.getElementById('item-counter');
    const descriptionEl = shadowRoot.getElementById('ai-description-text');
    const imageEl = shadowRoot.getElementById('item-image-mock');
    const errorEl = shadowRoot.getElementById('review-error-message');

    const backBtn = shadowRoot.getElementById('back-btn');
    const forwardBtn = shadowRoot.getElementById('forward-btn');
    const acceptBtn = shadowRoot.getElementById('accept-btn');
    const denyBtn = shadowRoot.getElementById('deny-btn');
    const finishBtn = shadowRoot.getElementById('finish-review-btn');

    function renderItem() {
        const item = items[currentIndex];
        
        // Update item details
        counterEl.textContent = `Item ${currentIndex + 1}/${items.length}`;
        descriptionEl.textContent = item.description;
        
        // Update visual feedback based on choice
        imageEl.style.borderColor = item.choice === 'accepted' ? '#0095f6' : (item.choice === 'denied' ? '#ed4956' : 'transparent');
        
        // Update navigation button states
        backBtn.disabled = currentIndex === 0;
        forwardBtn.disabled = currentIndex === items.length - 1;

        // Hide error message on navigation
        errorEl.style.display = 'none';
    }

    acceptBtn?.addEventListener('click', () => {
        items[currentIndex].choice = 'accepted';
        renderItem(); // Re-render to show visual feedback
    });

    denyBtn?.addEventListener('click', () => {
        items[currentIndex].choice = 'denied';
        renderItem(); // Re-render to show visual feedback
    });

    backBtn?.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            renderItem();
        }
    });

    forwardBtn?.addEventListener('click', () => {
        if (currentIndex < items.length - 1) {
            currentIndex++;
            renderItem();
        }
    });

    finishBtn?.addEventListener('click', () => {
        // Find the first item that hasn't been accepted or denied
        const unselectedItem = items.find(item => item.choice === null);
        
        if (unselectedItem) {
            // If an unselected item is found, show an error
            const itemNumber = items.indexOf(unselectedItem) + 1;
            errorEl.textContent = `A choice has not been made for item ${itemNumber}.`;
            errorEl.style.display = 'block';
        } else {
            // If all items have a choice, proceed to the final update
            const event = new CustomEvent('change-dashboard-view', {
                detail: {
                    viewName: 'progress_screen',
                    context: { actionType: 'finalUpdate' }
                },
                bubbles: true,
                composed: true
            });
            finishBtn.dispatchEvent(event);
        }
    });

    // Initial render of the first item
    renderItem();
}