// src/views/dashboard/auto_message_active/auto_message_active.js
export function init(status, shadowRoot, viewContext) {
    const stopBtn = shadowRoot.getElementById('stop-btn');
    const timerDisplay = shadowRoot.getElementById('timer-display');
    const timerPath = shadowRoot.querySelector('.timer-path');
    const summaryDelay = shadowRoot.getElementById('summary-delay');
    const summaryOffer = shadowRoot.getElementById('summary-offer');
    
    // Populate the settings summary
    const { settings } = viewContext;
    summaryDelay.textContent = settings.delay;
    summaryOffer.textContent = settings.offer ? `${settings.offer.value}${settings.offer.type}` : 'None';

    // Timer logic
    const totalTime = 5 * 60;
    let timeLeft = totalTime;
    const circleCircumference = 314;

    const timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft < 0) timeLeft = totalTime; // Restart timer
        
        const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const seconds = (timeLeft % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${minutes}:${seconds}`;

        const dashoffset = (timeLeft / totalTime) * circleCircumference;
        timerPath.style.strokeDashoffset = dashoffset;
    }, 1000);

    // --- UPDATED: Stop Button Logic ---
    stopBtn?.addEventListener('click', () => {
        clearInterval(timerInterval); // Always clear the interval

        // Navigate to the finished screen with a custom message
        const event = new CustomEvent('change-dashboard-view', {
            detail: {
                viewName: 'action_finished',
                context: {
                    apiResponse: {
                        success: true,
                        data: { message: "Auto-message action stopped successfully." }
                    }
                }
            },
            bubbles: true, composed: true
        });
        stopBtn.dispatchEvent(event);
    });
}