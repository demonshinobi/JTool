// browser-polyfill.js

(function(global) {
    // Only polyfill if 'browser' isn't already defined AND 'chrome' is defined and has necessary properties
    if (typeof global.browser === 'undefined' && typeof chrome !== 'undefined') {
        global.browser = {};

        // Polyfill runtime if chrome.runtime exists and has expected methods/properties
        if (chrome.runtime) {
            global.browser.runtime = {};
            if (chrome.runtime.sendMessage) {
                global.browser.runtime.sendMessage = chrome.runtime.sendMessage.bind(chrome.runtime);
            }
            if (chrome.runtime.onMessage && chrome.runtime.onMessage.addListener) {
                global.browser.runtime.onMessage = {
                    addListener: chrome.runtime.onMessage.addListener.bind(chrome.runtime.onMessage)
                };
            }
            // Add other runtime properties if needed, e.g., getURL
            if (chrome.runtime.getURL) {
                 global.browser.runtime.getURL = chrome.runtime.getURL.bind(chrome.runtime);
            }
        }

        // Polyfill tabs if chrome.tabs exists and has expected methods
        if (chrome.tabs) {
            global.browser.tabs = {};
            if (chrome.tabs.query) {
                global.browser.tabs.query = chrome.tabs.query.bind(chrome.tabs);
            }
            if (chrome.tabs.sendMessage) {
                global.browser.tabs.sendMessage = chrome.tabs.sendMessage.bind(chrome.tabs);
            }
            // Add other tabs properties if needed, e.g., create, update
             if (chrome.tabs.create) {
                 global.browser.tabs.create = chrome.tabs.create.bind(chrome.tabs);
             }
             if (chrome.tabs.update) {
                 global.browser.tabs.update = chrome.tabs.update.bind(chrome.tabs);
             }
        }

        // Polyfill storage if chrome.storage and chrome.storage.local exist
        if (chrome.storage && chrome.storage.local) {
            global.browser.storage = {
                local: chrome.storage.local
            };
             // Add other storage areas if needed, e.g., sync
             if (chrome.storage.sync) {
                 global.browser.storage.sync = chrome.storage.sync;
             }
        }

        // Polyfill action (manifest v3) or browserAction (manifest v2)
        const actionApi = chrome.action || chrome.browserAction;
        if (actionApi) {
            global.browser.action = {};
             if (actionApi.setBadgeText) {
                 global.browser.action.setBadgeText = actionApi.setBadgeText.bind(actionApi);
             }
             if (actionApi.setBadgeBackgroundColor) {
                 global.browser.action.setBadgeBackgroundColor = actionApi.setBadgeBackgroundColor.bind(actionApi);
             }
             if (actionApi.setIcon) {
                 global.browser.action.setIcon = actionApi.setIcon.bind(actionApi);
             }
             // Add other action properties if needed
        }

    }
})(typeof window !== 'undefined' ? window : global);