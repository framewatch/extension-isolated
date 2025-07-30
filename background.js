// background.js - Service Worker (Manifest V3 Module)
// A simplified version for isolated dashboard development.

console.log("Background script running in isolated dashboard mode.");

// This function provides a consistent, "logged-in" user status.
const getMockUserStatus = () => ({
    user: { uid: 'mock-uid', email: 'dashboard-dev@example.com', displayName: 'Dev User', emailVerified: true },
    isEmailVerified: true,
    isSubscribed: true,
    isVintedVerified: true,
    hasHadTrial: false,
    role: 'premium'
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handle the specific request for user status
    if (message.type === 'GET_USER_STATUS') {
        console.log("BACKGROUND: Received GET_USER_STATUS, sending mock status back.");
        sendResponse(getMockUserStatus());
    } 
    // Mock the response for feature usage so UI doesn't hang
    else if (message.type === 'USE_FEATURE') {
        const featureName = message.payload?.featureName || 'unknown feature';
        console.log(`BACKGROUND: (MOCKED) Using feature: ${featureName}`);
        sendResponse({ success: true, data: { message: `Mocked success for ${featureName}.` } });
    }
    // Provide a generic response for any other message types
    else {
        console.log(`BACKGROUND: Received unhandled message type: ${message.type}. Sending generic error.`);
        sendResponse({ success: false, error: `Function '${message.type}' is disabled in isolated mode.` });
    }

    // Return true to indicate that we will be sending a response asynchronously.
    // This is crucial for preventing the message port from closing prematurely.
    return true;
});

// A simple function to broadcast status changes to all tabs (can be useful for debugging)
const broadcastStatusUpdate = (statusToBroadcast) => {
    chrome.tabs.query({}, (tabs) => {
        for (const tab of tabs) {
            if (tab.id && tab.url?.startsWith('http')) {
                chrome.tabs.sendMessage(tab.id, {
                    type: 'USER_STATUS_CHANGED',
                    payload: statusToBroadcast
                }).catch(err => {
                    // This error is common if a content script isn't ready, so we can ignore it.
                });
            }
        }
    });
};

// You can uncomment this line if you want the background script to proactively
// send the status to the page without waiting for a request.
// broadcastStatusUpdate(getMockUserStatus());