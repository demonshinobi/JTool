// content.js
import { formatText, applyFormattingToNode, sanitizeHtml } from './formatter.js';
import { toggleHunterMode } from './hunterMode.js'; // Import the new centralized toggle function

console.log('JFormat Pro content script loaded');

// Use the appropriate API based on the browser
const browserAPI = chrome || browser;

// Notify background script that content script is loaded
browserAPI.runtime.sendMessage({action: "contentScriptLoaded"}, (response) => {
  if (browserAPI.runtime.lastError) {
    console.error('Error notifying background script:', browserAPI.runtime.lastError);
  } else if (response && response.success) {
    console.log('Background script notified of content script load');
  }
});

function applyFormatting(htmlCode) {
    return new Promise((resolve, reject) => {
        console.log('Attempting to apply formatting with HTML:', htmlCode);
        try {
            const selection = window.getSelection();
            if (!selection) {
                console.error('No selection object found');
                reject(new Error('Unable to access the selection object.'));
                return;
            }

            if (selection.rangeCount === 0) {
                console.error('No selection range found');
                reject(new Error('Please select some text before applying formatting.'));
                return;
            }

            const range = selection.getRangeAt(0);
            console.log('Selected range:', range.toString());

            if (range.collapsed) {
                console.error('Selection range is collapsed (no text selected)');
                reject(new Error('Please select some text before applying formatting.'));
                return;
            }

            const sanitizedHtml = sanitizeHtml(htmlCode);
            const formattedHtml = formatText(range.toString(), sanitizedHtml);
            console.log('Formatted HTML:', formattedHtml);

            // Create a temporary container
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = formattedHtml;

            // Extract the formatted content
            const fragment = document.createDocumentFragment();
            while (tempContainer.firstChild) {
                fragment.appendChild(tempContainer.firstChild);
            }

            // Replace the selected content with the formatted content
            range.deleteContents();
            const newNode = range.insertNode(fragment);
            console.log('New node inserted:', newNode);

            // Attempt to adjust the selection to encompass the newly inserted content
            try {
                const newRange = document.createRange();
                newRange.selectNodeContents(newNode);
                selection.removeAllRanges();
                selection.addRange(newRange);
                console.log('New range set successfully');
            } catch (rangeError) {
                console.warn('Error setting range, falling back to default selection:', rangeError);
                // Fallback: select the entire formatted content
                try {
                    const parentNode = newNode.parentNode;
                    const newRange = document.createRange();
                    newRange.selectNode(parentNode);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    console.log('Fallback range set successfully');
                } catch (fallbackError) {
                    console.error('Error setting fallback range:', fallbackError);
                }
            }

            console.log('Formatting applied successfully');
            resolve(true);
        } catch (error) {
            console.error('Error applying formatting:', error);
            reject(error);
        }
    });
}

browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received in content script:', message);
    
    try {
        if (message.type === 'ping') {
            console.log('Received ping message');
            sendResponse({ success: true });
        } else if (message.type === 'applyFormatting') {
            console.log('Received applyFormatting message:', message);
            applyFormatting(message.htmlCode)
                .then(result => {
                    console.log('Formatting result:', result);
                    sendResponse({ success: result });
                })
                .catch(error => {
                    console.error('Error in applyFormatting:', error);
                    sendResponse({ success: false, error: error.message });
                });
            return true; // Indicates that the response is sent asynchronously
        } else if (message.type === 'getSelectedText') {
            console.log('Received getSelectedText message');
            const selection = window.getSelection();
            const selectedText = selection ? selection.toString().trim() : '';
            console.log('Selected text:', selectedText);
            sendResponse({ selectedText: selectedText });
        } else if (message.type === 'toggleHunterMode') {
            console.log('[content.js] Received toggleHunterMode message.');
            // Call the centralized toggle function from hunterMode.js
            const newState = toggleHunterMode();
            console.log('[content.js] toggleHunterMode returned state:', newState);
            sendResponse({ success: true, active: newState });
        } else {
            console.warn('Unknown message type received:', message.type);
            sendResponse({ success: false, error: 'Unknown message type' });
        }
    } catch (error) {
        console.error('Error in message listener:', error);
        sendResponse({ success: false, error: error.message });
    }
});

// Remove the local toggleHunterMode, activateHunterMode, and deactivateHunterMode functions
// as they are no longer needed and were causing the issue.

// Add this line to ensure the content script is loaded
console.log('JFormat Pro content script fully loaded.');

// Send a message to the background script to confirm the content script is loaded
browserAPI.runtime.sendMessage({action: "contentScriptLoaded"});
