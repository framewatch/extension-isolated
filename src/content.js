// src/content.js
(async () => {
    console.log("CONTENT: Script injected and running.");

    // This flag prevents the entire script from running more than once.
    if (window.myVintedAppInitialized) {
        return;
    }
    window.myVintedAppInitialized = true;

    // --- 1. DEFINE AND MANAGE ALL APP ELEMENTS ---
    let appHost;
    let reopenBtnHost; // A separate host for the button

    function createElements() {
        // --- Main App Window ---
        if (!document.getElementById('my-auth-extension-container')) {
            appHost = document.createElement('div');
            appHost.id = 'my-auth-extension-container';
            document.body.prepend(appHost);
        } else {
            appHost = document.getElementById('my-auth-extension-container');
        }

        // --- Reopen Button Host and its Shadow DOM ---
        if (!document.getElementById('my-reopen-btn-container')) {
            reopenBtnHost = document.createElement('div');
            reopenBtnHost.id = 'my-reopen-btn-container';
            document.body.appendChild(reopenBtnHost);

            const buttonShadowRoot = reopenBtnHost.attachShadow({ mode: 'open' });
            const buttonStyleLink = document.createElement('link');
            buttonStyleLink.rel = 'stylesheet';
            buttonStyleLink.href = chrome.runtime.getURL('styles/main.css');
            buttonShadowRoot.appendChild(buttonStyleLink);

            const reopenBtn = document.createElement('button');
            reopenBtn.id = 'reopen-app-btn';
            reopenBtn.innerHTML = `<svg viewBox="0 0 24 24" style="width: 24px; height: 24px; fill: white;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>`;
            buttonShadowRoot.appendChild(reopenBtn);

            reopenBtn.onclick = () => {
                appHost.style.display = 'block';
                reopenBtnHost.style.display = 'none';
            };
        } else {
            reopenBtnHost = document.getElementById('my-reopen-btn-container');
        }

        reopenBtnHost.style.display = 'none';
        appHost.addEventListener('close-app', () => {
            appHost.style.display = 'none';
            reopenBtnHost.style.display = 'block';
        });
    }

    createElements();

    // --- 2. SETUP THE MAIN APP'S SHADOW DOM AND UI ---
    const shadowRoot = appHost.attachShadow({ mode: 'open' });
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = chrome.runtime.getURL('styles/main.css');
    shadowRoot.appendChild(styleLink);

    const appContainer = document.createElement('div');
    appContainer.id = 'auth-app-content-wrapper';
    appContainer.innerHTML = '<div id="auth-app-content"><p>Loading Dashboard...</p></div>';
    shadowRoot.appendChild(appContainer);

    const loadView = async (viewName, status) => {
        try {
            const viewHtmlUrl = chrome.runtime.getURL(`src/views/${viewName}/${viewName}.html`);
            const response = await fetch(viewHtmlUrl);
            if (!response.ok) throw new Error(`Failed to fetch ${viewName}.html: ${response.statusText}`);
            appContainer.innerHTML = await response.text();

            const viewJsUrl = chrome.runtime.getURL(`src/views/${viewName}/${viewName}.js`);
            const viewModule = await import(viewJsUrl);
            if (viewModule && typeof viewModule.init === 'function') {
                viewModule.init(status, shadowRoot);
            }
        } catch (error) {
            console.error(`Error loading view ${viewName}:`, error);
            appContainer.innerHTML = `<div id="auth-app-content"><p class="error">Error loading view. Please refresh.</p></div>`;
        }
    };

    // --- 3. UI ROUTER (MODIFIED FOR DASHBOARD ISOLATION) ---
    const uiUpdater = (status) => {
        // This is the key change: always load the dashboard.
        loadView('dashboard', status);
    };

    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'USER_STATUS_CHANGED' && typeof uiUpdater === 'function') {
            console.log("CONTENT: Received USER_STATUS_CHANGED broadcast.", message.payload);
            uiUpdater(message.payload);
        }
    });
    
    // --- 4. INITIAL LOAD (MODIFIED FOR BETTER ERROR HANDLING) ---
    try {
        console.log("CONTENT: Sending GET_USER_STATUS message to background for isolated dashboard.");
        const initialStatus = await chrome.runtime.sendMessage({ type: 'GET_USER_STATUS' });
        
        // Add a check to ensure the background script actually responded.
        if (initialStatus && initialStatus.user) {
            console.log("CONTENT: Received initial mock status from background:", initialStatus);
            uiUpdater(initialStatus);
        } else {
             // This will be thrown if the background script sends back nothing or has an error.
             throw new Error("Received an empty or invalid status from the background script.");
        }
    } catch (error) {
        // This block will now catch errors from the background script OR the empty response.
        console.error("Fatal: Could not get initial status for isolated dashboard.", error);
        appContainer.innerHTML = `<div id="auth-app-content"><p class="error" style="display: block;">A critical error occurred while loading the dashboard. Please check the extension's console and try refreshing. Error: ${error.message}</p></div>`;
    }
})();