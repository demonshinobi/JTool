// UI.js

export function initializeUI() {
    console.log('Initializing UI');
    document.getElementById('hunter-button').addEventListener('click', toggleHunterMode);
    document.getElementById('apply-button').addEventListener('click', applyFormatting);
}

export function updateUI(data) {
    console.log('Updating UI with data:', data);
    // Add logic to update UI elements based on the provided data
}

function toggleHunterMode() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {type: 'toggleHunterMode'}, function(response) {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                injectContentScriptAndRetry('toggleHunterMode');
            } else if (response && response.success) {
                console.log('Hunter mode toggled successfully');
                document.getElementById('hunter-button').classList.toggle('active', response.active);
            } else {
                console.error('Failed to toggle Hunter mode');
            }
        });
    });
}

function applyFormatting() {
    const htmlInput = document.getElementById('html-input');
    const htmlCode = htmlInput.value;

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {type: 'applyFormatting', htmlCode: htmlCode}, function(response) {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                injectContentScriptAndRetry('applyFormatting', htmlCode);
            } else if (response && response.success) {
                console.log('Formatting applied successfully');
            } else {
                console.error('Failed to apply formatting');
            }
        });
    });
}

function injectContentScriptAndRetry(action, data) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.runtime.sendMessage({action: "injectContentScript", tabId: tabs[0].id}, function(response) {
            if (response && response.success) {
                console.log('Content script injected, retrying action');
                if (action === 'toggleHunterMode') {
                    toggleHunterMode();
                } else if (action === 'applyFormatting') {
                    applyFormatting();
                }
            } else {
                console.error('Failed to inject content script');
            }
        });
    });
}

// Add more UI-related functions as needed