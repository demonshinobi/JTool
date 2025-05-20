// background.js - Merged JTool Functionality

console.log('JTool background service worker loaded.');

// Use the appropriate API based on the browser
const browserAPI = chrome || browser;

// --- JFormat Variables ---
const injectedTabs = new Set();
const MAX_INJECTION_RETRIES = 3;

// --- Timer Variables ---
let bgStartTime = 0;        // Timestamp when the current timing period started
let bgElapsedTime = 0;      // Stores accumulated time when timer is paused/stopped
let bgTimerRunning = false;
let bgCurrentSessionName = "";
const JTOOL_TIMER_ALARM_NAME = "jtoolTimerAlarm";
const TIMER_STATE_KEY = "jtoolTimerState";

// --- Timer State Persistence Functions ---
async function saveTimerState() {
  const state = {
    bgStartTime,
    bgElapsedTime,
    bgTimerRunning,
    bgCurrentSessionName
  };
  try {
    await browserAPI.storage.local.set({ [TIMER_STATE_KEY]: state });
    console.log("Background: Timer state saved.", state);
  } catch (error) {
    console.error("Background: Error saving timer state.", error);
  }
}

async function loadTimerState() {
  try {
    const data = await browserAPI.storage.local.get(TIMER_STATE_KEY);
    if (data && data[TIMER_STATE_KEY]) {
      const state = data[TIMER_STATE_KEY];
      bgStartTime = state.bgStartTime || 0;
      bgElapsedTime = state.bgElapsedTime || 0;
      bgTimerRunning = state.bgTimerRunning || false;
      bgCurrentSessionName = state.bgCurrentSessionName || "";
      console.log("Background: Timer state loaded.", state);

      if (bgTimerRunning) {
        // If the timer was running, ensure the alarm is re-created.
        // This handles cases where the service worker restarts.
        console.log("Background: Timer was running, re-creating alarm.");
        browserAPI.alarms.get(JTOOL_TIMER_ALARM_NAME, (existingAlarm) => {
          if (!existingAlarm) {
            browserAPI.alarms.create(JTOOL_TIMER_ALARM_NAME, { periodInMinutes: 1 });
            console.log("Background: Alarm re-created on load because timer was running.");
          } else {
            console.log("Background: Alarm already exists on load.");
          }
        });
      }
    } else {
      console.log("Background: No saved timer state found or state is empty.");
    }
  } catch (error) {
    console.error("Background: Error loading timer state.", error);
  }
}

// Load timer state when the service worker starts
loadTimerState();


// --- JFormat Functions (remain unchanged) ---
function isValidTab(tab) {
  return tab && tab.url && !tab.url.startsWith("chrome://") && !tab.url.startsWith("edge://");
}

function injectContentScripts(tabId, retryCount = 0) {
  if (injectedTabs.has(tabId)) {
    console.log('Content scripts already injected for tab:', tabId);
    return Promise.resolve();
  }

  console.log(`Attempting to inject content scripts for tab ${tabId}. Retry count: ${retryCount}`);

  return browserAPI.scripting.executeScript({
    target: { tabId: tabId },
    files: ['content.bundle.js']
  }).then(() => {
    console.log('Content scripts injected successfully for tab:', tabId);
    injectedTabs.add(tabId);
  }).catch((err) => {
    console.error(`Error injecting content scripts for tab ${tabId}:`, err);
    if (retryCount < MAX_INJECTION_RETRIES) {
      console.log(`Retrying injection for tab ${tabId}. Attempt ${retryCount + 1} of ${MAX_INJECTION_RETRIES}`);
      return new Promise(resolve => setTimeout(resolve, 1000))
        .then(() => injectContentScripts(tabId, retryCount + 1));
    }
    throw err;
  });
}

// --- JFormat Listeners (remain unchanged) ---
browserAPI.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked for tab:', tab.id);
  if (isValidTab(tab)) {
    injectContentScripts(tab.id).catch(err => console.error('Error on action click:', err));
  } else {
    console.log('Invalid tab for content script injection:', tab.id);
  }
});

browserAPI.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && isValidTab(tab)) {
    console.log('Tab updated and ready for content script injection:', tabId);
    injectContentScripts(tabId).catch(err => console.error('Error on tab update:', err));
  }
});

browserAPI.tabs.onRemoved.addListener((tabId) => {
  console.log('Tab removed, cleaning up:', tabId);
  injectedTabs.delete(tabId);
});


// --- Timer Alarm Listener ---
browserAPI.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === JTOOL_TIMER_ALARM_NAME) {
    console.log("JTool timer alarm fired.", new Date());
    // If the timer isn't supposed to be running, but the alarm fired, clear the alarm.
    // This can happen if stopTimer was called but the alarm clearing was delayed or failed.
    if (!bgTimerRunning) {
      console.warn("Timer alarm fired but timer is not running. Clearing alarm.");
      browserAPI.alarms.clear(JTOOL_TIMER_ALARM_NAME);
    }
    // No need to update bgElapsedTime here; getElapsedTime will calculate it.
    // The alarm's main purpose is to ensure the service worker can be woken
    // if needed, and to signify an active timer state.
  }
});

// --- Merged Message Listener ---
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message in background script:', message);

  // --- JFormat Actions (remain largely unchanged) ---
  if (message.action === "injectContentScripts") {
    browserAPI.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && isValidTab(tabs[0])) {
        injectContentScripts(tabs[0].id).then(() => {
          console.log('Content scripts injected successfully');
          sendResponse({success: true});
        }).catch((error) => {
          console.error('Error injecting content scripts:', error);
          sendResponse({success: false, error: error.message});
        });
      } else {
        console.log('Invalid tab for content script injection');
        sendResponse({success: false, error: "Invalid tab"});
      }
    });
    return true;
  } else if (message.action === "contentScriptLoaded") {
    if (sender.tab) {
      console.log('Content script loaded in tab:', sender.tab.id);
      injectedTabs.add(sender.tab.id);
      sendResponse({success: true});
    } else {
      console.error('Received contentScriptLoaded message from unknown source');
      sendResponse({success: false, error: "Unknown sender"});
    }
    return true;

  // --- Timer Actions (Refactored for chrome.alarms) ---
  } else if (message.action === "startTimer") {
    if (!bgTimerRunning) {
      bgCurrentSessionName = message.sessionName || "";
      bgStartTime = Date.now() - bgElapsedTime; // Adjust start time by already elapsed time
      bgTimerRunning = true;

      browserAPI.alarms.create(JTOOL_TIMER_ALARM_NAME, {
        periodInMinutes: 1 // Minimum period for periodic alarms
      });
      console.log("Background: Timer started. Session:", bgCurrentSessionName, "Start time:", new Date(bgStartTime), "Alarm created.");
      saveTimerState(); // Save state after starting
    } else {
      console.log("Background: Timer already running for session:", bgCurrentSessionName);
    }
    const currentElapsed = bgTimerRunning ? (Date.now() - bgStartTime) : bgElapsedTime;
    sendResponse({ status: "Timer started", running: bgTimerRunning, elapsed: currentElapsed, sessionName: bgCurrentSessionName });
    return true;

  } else if (message.action === "stopTimer") {
    if (bgTimerRunning) {
      bgTimerRunning = false;
      bgElapsedTime = Date.now() - bgStartTime; // Calculate final elapsed time for this period

      browserAPI.alarms.clear(JTOOL_TIMER_ALARM_NAME, (wasCleared) => {
        console.log("Background: Timer alarm cleared.", wasCleared ? "Successfully." : "No alarm to clear or error.");
      });
      saveTimerState(); // Save state after stopping

      const finalElapsedTimeForSession = bgElapsedTime;
      console.log("Background: Timer stopped. Elapsed ms:", finalElapsedTimeForSession, "for session:", bgCurrentSessionName);

      chrome.storage.sync.get({ sessions: [] }, (data) => {
        let sessions = data.sessions;
        if (!Array.isArray(sessions)) sessions = [];
        sessions.push({
          timestamp: Date.now(), // Timestamp of when session was logged
          elapsed: finalElapsedTimeForSession,
          name: bgCurrentSessionName || "Unnamed Session"
        });
        chrome.storage.sync.set({ sessions: sessions }, () => {
          console.log("Background: Session logged", sessions);
          sendResponse({ status: "Timer stopped and session logged", elapsed: finalElapsedTimeForSession, running: bgTimerRunning, sessionName: bgCurrentSessionName });
        });
      });
    } else {
      sendResponse({ status: "Timer was not running", running: bgTimerRunning, elapsed: bgElapsedTime, sessionName: bgCurrentSessionName });
    }
    return true;

  } else if (message.action === "resetTimer") {
    bgTimerRunning = false;
    bgElapsedTime = 0;
    bgStartTime = 0; // Reset start time as well
    bgCurrentSessionName = "";

    browserAPI.alarms.clear(JTOOL_TIMER_ALARM_NAME, (wasCleared) => {
      console.log("Background: Timer alarm cleared on reset.", wasCleared ? "Successfully." : "No alarm to clear or error.");
    });
    saveTimerState(); // Save state after resetting
    console.log("Background: Timer reset");
    sendResponse({ status: "Timer reset", running: bgTimerRunning, elapsed: bgElapsedTime, sessionName: bgCurrentSessionName });
    return true;

  } else if (message.action === "getElapsedTime") {
    let currentElapsed = bgElapsedTime;
    if (bgTimerRunning) {
      currentElapsed = Date.now() - bgStartTime;
    }
    sendResponse({ elapsed: currentElapsed, running: bgTimerRunning, sessionName: bgCurrentSessionName });
    return false; // Synchronous response

  } else if (message.action === "exportMarkdown") {
    chrome.storage.sync.get({ sessions: [] }, (data) => {
      let sessions = data.sessions;
      if (!Array.isArray(sessions)) sessions = [];
      const md = sessions
        .map((s, i) => `${i + 1}. ${s.name} — ${new Date(s.timestamp).toLocaleString()} — ${formatMillisToHMS(s.elapsed)}`)
        .join("\n");
      sendResponse({ markdown: md });
    });
    return true;
  } else if (message.action === "getSessions") {
    chrome.storage.sync.get({ sessions: [] }, (data) => {
      let sessions = data.sessions;
      if (!Array.isArray(sessions)) sessions = [];
      sendResponse({ sessions: sessions });
    });
    return true;
  } else if (message.action === "addSession") {
    chrome.storage.sync.get({ sessions: [] }, (data) => {
      let sessions = data.sessions;
      if (!Array.isArray(sessions)) sessions = [];
      sessions.push({ name: message.sessionName, elapsed: message.elapsed, timestamp: Date.now() });
      chrome.storage.sync.set({ sessions: sessions }, () => {
        console.log("Background: Session added", sessions);
        sendResponse({ status: "Session added", sessions: sessions });
      });
    });
    return true;
  } else if (message.action === "editSession") {
    chrome.storage.sync.get({ sessions: [] }, (data) => {
      let sessions = data.sessions;
      if (!Array.isArray(sessions)) sessions = [];
      if (sessions[message.index]) {
        sessions[message.index].name = message.newName;
        sessions[message.index].elapsed = message.newElapsed;
        chrome.storage.sync.set({ sessions: sessions }, () => {
          console.log("Background: Session edited", sessions);
          sendResponse({ status: "Session edited", sessions: sessions });
        });
      } else {
        sendResponse({ status: "Error: Invalid session index" });
      }
    });
    return true;
  } else if (message.action === "deleteSession") {
    chrome.storage.sync.get({ sessions: [] }, (data) => {
      let sessions = data.sessions;
      if (!Array.isArray(sessions)) sessions = [];
      if (sessions[message.index]) {
        sessions.splice(message.index, 1);
        chrome.storage.sync.set({ sessions: sessions }, () => {
          console.log("Background: Session deleted", sessions);
          sendResponse({ status: "Session deleted", sessions: sessions });
        });
      } else {
        sendResponse({ status: "Error: Invalid session index" });
      }
    });
    return true;
  } else if (message.action === "reorderSessions") {
    if (Array.isArray(message.sessions)) {
        chrome.storage.sync.set({ sessions: message.sessions }, () => {
            console.log("Background: Sessions reordered", message.sessions);
            sendResponse({ status: "Sessions reordered", sessions: message.sessions });
        });
    } else {
        console.error("Background: Invalid data received for reorderSessions");
        sendResponse({ status: "Error: Invalid session data" });
    }
    return true;

  } else {
    console.warn('Unknown message action received:', message.action);
    sendResponse({success: false, error: "Unknown action"});
    return false;
  }
});

// Helper function for formatting milliseconds to HH:MM:SS for markdown export
function formatMillisToHMS(ms) {
    if (typeof ms !== 'number' || isNaN(ms)) return "00:00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return (
        (hours < 10 ? "0" + hours : hours) + ":" +
        (minutes < 10 ? "0" + minutes : minutes) + ":" +
        (seconds < 10 ? "0" + seconds : seconds)
    );
}

console.log('JTool background script fully loaded and refactored for alarms.');
