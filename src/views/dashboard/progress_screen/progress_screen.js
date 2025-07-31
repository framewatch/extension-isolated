// src/views/dashboard/progress_screen/progress_screen.js
import { likeItem, repostItemWorkflow, followUser, RateLimitError } from '../../../services/api-service.js';

function updateProgress(shadowRoot, percentage, currentItem, currentItemIndex, totalItems) {
    const progressCircle = shadowRoot.getElementById('progress-circle');
    const itemImage = shadowRoot.getElementById('progress-item-image');
    const actionCounterEl = shadowRoot.getElementById('action-counter');
    const userNameEl = shadowRoot.getElementById('item-user-name');

    if (progressCircle) {
        const radius = progressCircle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;
        progressCircle.style.strokeDashoffset = offset;
    }
    if (itemImage && currentItem?.thumbnail_url) {
        itemImage.style.backgroundImage = `url(${currentItem.thumbnail_url})`;
    } else if (itemImage) {
        itemImage.style.backgroundImage = 'none';
    }
    // Correctly display the current action number (e.g., "Action 1/3")
    if (actionCounterEl) {
        actionCounterEl.textContent = `Action ${currentItemIndex + 1}/${totalItems}`;
    }
    if (userNameEl && currentItem?.user?.name) {
        userNameEl.textContent = currentItem.user.name;
    } else if (userNameEl) {
        userNameEl.textContent = currentItem ? `Item ID: ${currentItem.id}` : '...';
    }
}


export async function init(status, shadowRoot, viewContext) {
    const { itemsToProcess, actionType } = viewContext;
    const stopBtn = shadowRoot.getElementById('stop-action-btn');
    const errorEl = shadowRoot.getElementById('action-error-message');

    // For simplicity, we can say every action, single or multi-step, contributes to the whole.
    // We'll calculate progress based on items processed, not micro-steps.
    const totalItems = itemsToProcess.length;
    let itemsCompleted = 0;

    let isActionStopped = false;
    let stopReason = 'user'; // To distinguish between user stop and rate limit stop


    let currentItemIndex = 0;
    const csrfToken = "75f6c9fa-dc8e-4e52-a000-e09dd4084b3e";
    const domain = "www.vinted.pl";
    const proxyUrl = "https://cors-anywhere.herokuapp.com/";

    stopBtn.addEventListener('click', () => {
        isActionStopped = true;
        stopReason = 'user';
        stopBtn.disabled = true;
        stopBtn.textContent = 'Stopping...';
    });

    // Initial UI update
    updateProgress(shadowRoot, 0, itemsToProcess[0], -1, totalItems); // Show "Action 0/X" initially

    for (const item of itemsToProcess) {
        if (isActionStopped) break;

        // Update UI to show we are now processing the *current* item
        updateProgress(shadowRoot, (itemsCompleted / totalItems) * 100, item, currentItemIndex, totalItems);

        let success = false;
        try {
            if (actionType === 'repostItem') {
                // Multi-step action with its own progress reporting
                await repostItemWorkflow({
                    initialPostId: item.id, csrfToken, domain, proxyUrl,
                    isStopRequested: () => isActionStopped,
                    onProgress: (step) => {
                        const microProgress = step / 8; // 8 steps in repost
                        const overallProgress = ((currentItemIndex + microProgress) / totalItems) * 100;
                        updateProgress(shadowRoot, overallProgress, item, currentItemIndex, totalItems);
                    }
                });
                success = true;
            } else if (actionType === 'autoLike') {
                success = await likeItem(item.id, csrfToken);
            } else if (actionType === 'autoFollow') {
                success = await followUser(item.user.id, csrfToken);
            }
        } catch (err) {
            console.error(`Action failed for item #${currentItemIndex + 1} (ID: ${item.id}):`, err);
            success = false;

            if (err instanceof RateLimitError) {
                errorEl.textContent = 'Too many requests. Action will now stop.';
                errorEl.style.display = 'block';
                isActionStopped = true; // Set the flag to stop the main loop
                stopReason = 'rate_limit'; // Set the reason for stopping
                // We don't need a timeout here because we want the process to stop and navigate away.
            } else if (!isActionStopped) {
                // Handle other, non-fatal errors
                errorEl.textContent = `Error on action #${currentItemIndex + 1}`;
                errorEl.style.display = 'block';
                await new Promise(resolve => setTimeout(resolve, 2000));
                if (errorEl) errorEl.style.display = 'none';
            }
        
        }
        
        if (success) {
            itemsCompleted++;
        } else {
            if (!isActionStopped) {
                errorEl.textContent = `Error on action #${currentItemIndex + 1}`;
                errorEl.style.display = 'block';
                await new Promise(resolve => setTimeout(resolve, 2000));
                if (errorEl) errorEl.style.display = 'none';
            }
        }
        
        currentItemIndex++;
        // --- THIS IS THE FIX ---
        // After a single-step action (or a failed multi-step one), update the main progress bar.
        if (actionType !== 'repostItem' || !success) {
             updateProgress(shadowRoot, (currentItemIndex / totalItems) * 100, item, currentItemIndex -1, totalItems);
        }
    }

    // Final navigation logic...
    let finalMessage;
    if (isActionStopped) {
        finalMessage = (stopReason === 'rate_limit')
            ? "Action stopped due to too many requests."
            : "Action stopped by user.";
    } else {
        finalMessage = "Process finished.";
    }
    
    setTimeout(() => {
        const event = new CustomEvent('change-dashboard-view', {
            detail: { viewName: 'action_finished', context: { apiResponse: { success: true, data: { message: finalMessage } } } },
            bubbles: true,
            composed: true
        });
        shadowRoot.querySelector('.progress-container').dispatchEvent(event);
    }, 400);
}