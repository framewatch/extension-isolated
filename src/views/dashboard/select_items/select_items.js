import { getFriendlyErrorMessage } from '../../../error-dictionary.js';
import { getVintedItemsByUserId } from '../../../services/api-service.js';

export function init(status, shadowRoot, viewContext) {
    // ... (rest of the init function is the same)
    const titleEl = shadowRoot.getElementById('select-items-title');
    const itemGrid = shadowRoot.querySelector('.item-grid');
    const performBtn = shadowRoot.getElementById('perform-action-btn');
    const errorEl = shadowRoot.getElementById('selection-error');
    const VINTED_USER_ID = '281666759';

    function renderItems(items) {
        itemGrid.innerHTML = '';
        if (!items || items.length === 0) {
            itemGrid.innerHTML = '<p style="color: #8e8e8e; text-align: center;">No items found for this user.</p>';
            return;
        }
        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'item-card';
            itemEl.dataset.itemId = item.id;
            const img = document.createElement('img');
            img.src = item.thumbnailUrl;
            img.alt = item.title;
            img.onerror = () => { img.style.display = 'none'; };
            itemEl.appendChild(img);
            itemGrid.appendChild(itemEl);
        });
    }

    async function loadAndDisplayItems() {
        itemGrid.innerHTML = '<p style="color: #8e8e8e; text-align: center;">Loading your items...</p>';
        performBtn.disabled = true;
        const items = await getVintedItemsByUserId(VINTED_USER_ID);
        if (items === null) {
            itemGrid.innerHTML = '<p class="feedback error" style="display: block;">Could not load items. Please try again later.</p>';
        } else {
            renderItems(items);
            performBtn.disabled = false;
        }
    }

    if (titleEl && viewContext.featureName) {
        const featureText = viewContext.featureName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        titleEl.textContent = `Select Items for ${featureText}`;
    }
    
    itemGrid.addEventListener('click', (event) => {
        const item = event.target.closest('.item-card');
        if (item) {
            item.classList.toggle('selected');
        }
    });

    performBtn?.addEventListener('click', () => {
        const selectedItemsNodeList = shadowRoot.querySelectorAll('.item-card.selected');
        const selectedItemsArray = Array.from(selectedItemsNodeList);
        
        if (selectedItemsArray.length === 0) {
            errorEl.textContent = getFriendlyErrorMessage('no-item-selected');
            errorEl.style.display = 'block';
            return;
        }
        
        errorEl.style.display = 'none';
        performBtn.disabled = true;

        // --- NEW LOGIC: Determine the action type ---
        let actionType;
        if (viewContext.featureName === 'refreshes') {
            actionType = 'repostItem';
        } else {
            // Add other action types here in the future
            actionType = 'defaultAction'; // Fallback
        }
        
        const itemsToProcess = selectedItemsArray.map(el => ({ 
            id: el.dataset.itemId,
            thumbnail_url: el.querySelector('img')?.src 
        }));

        const event = new CustomEvent('change-dashboard-view', {
            detail: {
                viewName: 'progress_screen',
                context: {
                    actionType: actionType, // Pass the dynamic action type
                    itemsToProcess: itemsToProcess
                }
            },
            bubbles: true,
            composed: true
        });
        performBtn.dispatchEvent(event);
    });


    loadAndDisplayItems();
}