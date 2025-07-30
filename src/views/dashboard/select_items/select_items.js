import { getFriendlyErrorMessage } from '../../../error-dictionary.js';

// src/views/dashboard/select_items/select_items.js
export function init(status, shadowRoot, viewContext) {
    const titleEl = shadowRoot.getElementById('select-items-title');
    const itemGrid = shadowRoot.querySelector('.item-grid');
    const performBtn = shadowRoot.getElementById('perform-action-btn');
    const errorEl = shadowRoot.getElementById('selection-error'); // Get the new error element

    const items = [
        { id: 1, color: '#e2e2e2' },
        { id: 2, color: '#d4d4d4' },
        { id: 3, color: '#c6c6c6' },
        { id: 4, color: '#b8b8b8' },
        { id: 5, color: '#aaaaaa' },
        { id: 6, color: '#9c9c9c' },
        { id: 7, color: '#8e8e8e' },
        { id: 8, color: '#808080' }
    ];

    function renderItems() {
        itemGrid.innerHTML = ''; // Clear existing items
        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'item-mock';
            itemEl.dataset.itemId = item.id;
            itemEl.style.backgroundColor = item.color;
            itemGrid.appendChild(itemEl);
        });
    }

    if (titleEl && viewContext.featureName) {
        const featureText = viewContext.featureName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        titleEl.textContent = `Select Items for ${featureText}`;
    }
    
    itemGrid.addEventListener('click', (event) => {
        const item = event.target.closest('.item-mock');
        if (item) {
            item.classList.toggle('selected');
        }
    });

    performBtn?.addEventListener('click', () => {
        const selectedItems = shadowRoot.querySelectorAll('.item-mock.selected');
        const selectedItemIds = Array.from(selectedItems).map(item => item.dataset.itemId);
        
        // --- NEW: Validation Check ---
        if (selectedItemIds.length === 0) {
            errorEl.textContent = getFriendlyErrorMessage('no-item-selected');
            errorEl.style.display = 'block';
            return; // Stop the function
        }
        
        // Hide error if validation passes
        errorEl.style.display = 'none';

        console.log('Selected item IDs:', selectedItemIds);

        performBtn.disabled = true;

        const event = new CustomEvent('change-dashboard-view', {
            detail: {
                viewName: 'progress_screen',
                context: {
                    featureName: viewContext.featureName,
                    descriptionType: viewContext.descriptionType // Pass the type along
                    // In a real app, you would also pass the selected item IDs here
                    // selectedItems: [ ... ]
                }
            },
            bubbles: true,
            composed: true
        });
        performBtn.dispatchEvent(event);
    });

    // --- Initial render ---
    renderItems();
}