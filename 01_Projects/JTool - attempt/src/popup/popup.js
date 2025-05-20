// JTool Combined popup.js
import './popup.css'; // Import the CSS file for webpack

// --- Imports (from JFormat) ---
// Assuming these files exist in JTool/src/popup/
import { initializeUI as initializeFormatterUI, updateUI as updateFormatterUI } from './ui.js';
import { loadTemplate, saveTemplate, deleteTemplate , exportTemplates, importTemplates, updateTemplateList } from './templateManager.js';
import { setTheme, getAvailableThemes } from './themeManager.js';

console.log('JTool popup script loading...');

// --- Global Variables ---
const browserAPI = chrome || browser;
let timerUpdateInterval = null; // Interval for updating timer display
let continuousTimingSetting = false; // Timer setting
let currentSessionName = ""; // Timer setting

// --- DOM Elements Cache ---
const elements = {};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("JTool Popup DOM fully loaded");
    cacheDOMElements();
    initializeTabs();
    initializeFormatter();
    initializeTimer();
    initializeSessions();
    loadThemeSettings(); // Load theme preference
    // Ensure content scripts are ready for formatter actions if formatter tab is initially active
    if (document.getElementById('formatter-tab').classList.contains('active')) {
        ensureContentScriptsInjected(() => captureSelectedText());
    }
    console.log("JTool Popup Initialized");
});

function cacheDOMElements() {
    // General
    elements.tabButtons = document.querySelectorAll('.tab-button');
    elements.tabContents = document.querySelectorAll('.tab-content');
    elements.themeToggle = document.getElementById('theme-toggle');
    elements.themeToggle?.addEventListener('click', toggleDarkMode); // Attach listener here
    elements.settingsButton = document.getElementById('settings-button'); // Footer button
    elements.helpButton = document.getElementById('help-button'); // Footer button
    elements.notificationArea = document.getElementById('notification');

    // Formatter Tab
    elements.formatterTab = document.getElementById('formatter-tab');
    elements.htmlInput = document.getElementById('html-input');
    elements.applyButton = document.getElementById('apply-button');
    elements.saveButton = document.getElementById('save-button');
    elements.loadButton = document.getElementById('load-button');
    elements.deleteButton = document.getElementById('delete-button');
    elements.undoButton = document.getElementById('undo-button');
    elements.previewContainer = document.getElementById('preview-container');
    elements.hunterButton = document.getElementById('hunter-button');
    elements.templateNameInput = document.getElementById('template-name');
    elements.templateList = document.getElementById('template-list');
    elements.exportTemplatesButton = document.getElementById('export-templates');
    elements.importTemplatesButton = document.getElementById('import-templates');
    elements.importFileInput = document.getElementById('import-file');
    elements.manageTemplatesToggle = document.getElementById('manage-templates-toggle');
    elements.manageTemplatesGroup = document.getElementById('manage-templates-group');

    // Timer Tab
    elements.timerTab = document.getElementById('timer-tab');
    elements.startButton = document.getElementById("start-timer-btn");
    elements.stopButton = document.getElementById("stop-timer-btn");
    elements.resetButton = document.getElementById("reset-timer-btn");
    elements.timerDisplay = document.getElementById("timerDisplay");
    elements.sessionNameDisplay = document.getElementById("sessionNameDisplay"); // Session name text
    elements.progressRing = document.querySelector(".progress-ring__progress");
    elements.exportMdButton = document.getElementById("export-md-btn");

    // Sessions Tab
    elements.sessionsTab = document.getElementById('sessions-tab');
    elements.sessionsListDiv = document.getElementById("sessions-list");
    elements.clearSessionsButton = document.getElementById("clear-sessions-btn");
    elements.continuousTimingToggle = document.getElementById("continuousTimingToggle"); // Added toggle

    // Modals (from JFormat)
    elements.settingsModal = document.getElementById('settings-modal');
    elements.helpModal = document.getElementById('help-modal');
    elements.modalCloseButtons = document.querySelectorAll('.modal .close');
    elements.persistentTimerDisplay = document.getElementById('persistent-timer-display'); // Added

    // Custom Prompt Elements
    elements.customPromptOverlay = document.getElementById('customPromptOverlay');
    console.log('Cached customPromptOverlay:', !!elements.customPromptOverlay); // Debug log
    elements.customPromptDialog = document.getElementById('customPromptDialog');
    console.log('Cached customPromptDialog:', !!elements.customPromptDialog); // Debug log
    elements.customPromptMessage = document.getElementById('customPromptMessage');
    console.log('Cached customPromptMessage:', !!elements.customPromptMessage); // Debug log
    elements.customPromptInput = document.getElementById('customPromptInput');
    console.log('Cached customPromptInput:', !!elements.customPromptInput); // Debug log
    elements.customPromptOk = document.getElementById('customPromptOk');
    console.log('Cached customPromptOk:', !!elements.customPromptOk); // Debug log
    elements.customPromptCancel = document.getElementById('customPromptCancel');
    console.log('Cached customPromptCancel:', !!elements.customPromptCancel); // Debug log

    // Custom Confirm Dialog Elements
    elements.customConfirmOverlay = document.getElementById('customConfirmOverlay');
    elements.customConfirmDialog = document.getElementById('customConfirmDialog');
    elements.customConfirmMessage = document.getElementById('customConfirmMessage');
    elements.customConfirmOk = document.getElementById('customConfirmOk');
    elements.customConfirmCancel = document.getElementById('customConfirmCancel');
}

// --- Tab Management ---
function initializeTabs() {
    elements.tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTabId = button.getAttribute('data-tab');

            // Deactivate all tabs and buttons
            elements.tabContents.forEach(content => content.classList.remove('active'));
            elements.tabButtons.forEach(btn => btn.classList.remove('active'));

            // Activate the target tab and button
            document.getElementById(`${targetTabId}-tab`).classList.add('active');
            button.classList.add('active');

            // Special actions when switching to a tab
            if (targetTabId === 'formatter') {
                ensureContentScriptsInjected(() => captureSelectedText());
            } else if (targetTabId === 'timer') {
                startTimerUpdates(); // Ensure timer display is updating
            } else if (targetTabId === 'sessions') {
                loadSessions(); // Load session list when tab is viewed
            }
        });
    });
    // Activate the first tab by default (Formatter)
    elements.tabButtons[0].click();
}

// --- Formatter Initialization & Logic (Adapted from JFormat) ---
function initializeFormatter() {
    console.log("Initializing Formatter");
    initializeFormatterUI(); // Initialize UI elements specific to formatter if needed
    setupFormatterEventListeners();
    updateTemplateList(elements.templateList); // Load templates into dropdown
    updatePreview(); // Initial preview update
}

function setupFormatterEventListeners() {
    elements.applyButton?.addEventListener('click', () => ensureContentScriptsInjected(() => handleApplyClick()));
    elements.saveButton?.addEventListener('click', handleSaveClick);
    elements.loadButton?.addEventListener('click', handleLoadClick);
    elements.deleteButton?.addEventListener('click', handleDeleteClick);
    elements.undoButton?.addEventListener('click', handleUndoClick);
    elements.hunterButton?.addEventListener('click', () => ensureContentScriptsInjected(() => toggleHunterMode()));
    elements.exportTemplatesButton?.addEventListener('click', exportTemplates);
    elements.importTemplatesButton?.addEventListener('click', () => elements.importFileInput?.click());
    elements.importFileInput?.addEventListener('change', handleImportTemplates);
    elements.htmlInput?.addEventListener('input', updatePreview);
    elements.manageTemplatesToggle?.addEventListener('click', handleManageTemplatesToggle);

    // Keep modal listeners from JFormat
    elements.settingsButton?.addEventListener('click', () => toggleModal(elements.settingsModal));
    elements.helpButton?.addEventListener('click', () => toggleModal(elements.helpModal));
    elements.modalCloseButtons?.forEach(closeButton => {
        closeButton.addEventListener('click', (event) => {
            const modalId = event.target.getAttribute('data-modal');
            if (modalId) {
                document.getElementById(modalId)?.classList.remove('show');
            }
        });
    });
}

function handleApplyClick() {
    console.log("Apply button clicked");
    const htmlCode = validateHtml(elements.htmlInput.value);
    if (htmlCode) {
        browserAPI.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0] && isValidTab(tabs[0])) {
                browserAPI.tabs.sendMessage(tabs[0].id, { type: 'applyFormatting', htmlCode: htmlCode }, (response) => {
                    handleApiResponse(response, 'formatting');
                });
            } else {
                showNotification('Cannot apply formatting on this page.');
            }
        });
    } else {
        showNotification('Invalid HTML code. Please check your input.');
    }
}

function captureSelectedText() {
    console.log("Capturing selected text for formatter");
    browserAPI.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0] && isValidTab(tabs[0])) {
            browserAPI.tabs.sendMessage(tabs[0].id, { type: 'getSelectedText' }, (response) => {
                if (browserAPI.runtime.lastError) {
                    console.error('Error getting selected text:', browserAPI.runtime.lastError);
                    elements.htmlInput.value = `Error: ${browserAPI.runtime.lastError.message}.`;
                } else if (response && response.selectedText) {
                    elements.htmlInput.value = response.selectedText;
                } else {
                    // Keep existing text or set default if desired
                    // elements.htmlInput.value = 'No text selected.';
                }
                updatePreview();
            });
        } else {
            updateUIForInvalidTab();
        }
    });
}

function validateHtml(html) {
    // Basic validation - can be enhanced
    return html.trim() ? html : null;
}

function updatePreview() {
    if (elements.htmlInput && elements.previewContainer) {
        // Basic sanitization - consider using DOMPurify if available and needed
        // const sanitizedHtml = DOMPurify.sanitize(elements.htmlInput.value);
        elements.previewContainer.innerHTML = elements.htmlInput.value; // Direct render for simplicity now
    }
}

function handleSaveClick() {
    console.log("Save template clicked");
    const name = elements.templateNameInput.value.trim();
    const html = elements.htmlInput.value.trim();
    if (name && html) {
        saveTemplate(name, html).then(() => {
            updateTemplateList(elements.templateList);
            showNotification('Template saved.');
        });
    } else {
        showNotification('Please provide a template name and HTML content.');
    }
}

function handleLoadClick() {
    console.log("Load template clicked");
    const selectedTemplate = elements.templateList.value;
    if (selectedTemplate && selectedTemplate !== 'No templates saved') {
        loadTemplate(selectedTemplate).then(html => {
            if (html !== null) { // Check for null in case template doesn't exist
                elements.htmlInput.value = html;
                updatePreview();
            } else {
                showNotification('Failed to load template.');
            }
        });
    } else {
        showNotification('Please select a template to load.');
    }
}

async function handleDeleteClick() { // Make async
    console.log("Delete template clicked");
    const selectedTemplate = elements.templateList.value;
    if (selectedTemplate && selectedTemplate !== 'No templates saved') {
        const confirmed = await showCustomConfirm(`Are you sure you want to delete the template "${selectedTemplate}"?`);
        if (confirmed) {
            deleteTemplate(selectedTemplate).then(() => {
                updateTemplateList(elements.templateList);
                showNotification('Template deleted.');
            });
        }
    } else {
        showNotification('Please select a template to delete.');
    }
}

async function handleUndoClick() { // Make async for consistency if it ever needs confirmation
    console.log('Undo clicked - Not implemented');
    showNotification('Undo functionality not implemented yet.');
}

function toggleHunterMode() {
    console.log("Toggling Hunter mode");
    elements.hunterButton.classList.toggle('active'); // Basic visual toggle
    browserAPI.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0] && isValidTab(tabs[0])) {
            browserAPI.tabs.sendMessage(tabs[0].id, { type: 'toggleHunterMode' }, (response) => {
                const success = handleApiResponse(response, 'Hunter Mode toggle');
                if (success) {
                    window.close(); // Close popup so page receives focus
                } else {
                    elements.hunterButton.classList.remove('active'); // Revert visual state on error
                }
            });
        } else {
            showNotification('Cannot toggle Hunter mode on this page.');
            elements.hunterButton.classList.remove('active');
        }
    });
}

function handleImportTemplates(event) {
    importTemplates(event, elements.templateList).then(success => {
        if (success) showNotification('Templates imported successfully.');
        else showNotification('Failed to import templates. Invalid file format.');
    });
}

function handleManageTemplatesToggle() {
    console.log("Manage templates toggle clicked");
    const group = elements.manageTemplatesGroup;
    const button = elements.manageTemplatesToggle;
    if (group && button) {
        const isHidden = group.style.display === 'none' || group.style.display === '';
        if (isHidden) {
            group.style.display = 'block'; // Or 'flex' if it's a flex container
            button.textContent = 'Hide Template Tools';
            button.classList.add('active'); // For styling the button itself if needed
            // Add a class to trigger animation
            group.classList.add('fade-in-slide-down');
            group.classList.remove('fade-out-slide-up');

        } else {
            // Add a class to trigger animation
            group.classList.add('fade-out-slide-up');
            group.classList.remove('fade-in-slide-down');
            // Listen for animation end to set display to none
            group.addEventListener('animationend', () => {
                group.style.display = 'none';
            }, { once: true });

            button.textContent = 'Manage Templates';
            button.classList.remove('active');
        }
    }
}

function updateUIForInvalidTab() {
    console.log("Updating UI for invalid tab");
    if (elements.htmlInput) {
        elements.htmlInput.value = 'Cannot access this page. Try on a different webpage.';
        elements.htmlInput.disabled = true;
    }
    if (elements.applyButton) elements.applyButton.disabled = true;
    if (elements.hunterButton) elements.hunterButton.disabled = true;
    updatePreview();
}

// --- Timer Initialization & Logic (Adapted from ObsidianTimer) ---
function initializeTimer() {
    console.log("Initializing Timer");
    setupTimerEventListeners();
    initializeTimerSettings(); // Load and setup continuous timing setting
    startTimerUpdates(); // Start polling background for timer state
}

function setupTimerEventListeners() {
    elements.startButton?.addEventListener("click", startTimerAction);
    elements.stopButton?.addEventListener("click", stopTimerAction);
    elements.resetButton?.addEventListener("click", resetTimerAction);
    elements.exportMdButton?.addEventListener("click", exportMarkdownAction);
}

function initializeTimerSettings() {
    browserAPI.storage.sync.get(["continuousTiming", "currentSessionName"], (data) => {
        continuousTimingSetting = data.continuousTiming ?? false; // Use ?? for explicit false
        currentSessionName = data.currentSessionName || "";
        if (elements.sessionNameDisplay) {
            elements.sessionNameDisplay.textContent = currentSessionName;
        }
        // Setup toggle state and listener
        if (elements.continuousTimingToggle) {
            elements.continuousTimingToggle.checked = continuousTimingSetting;
            elements.continuousTimingToggle.addEventListener('change', handleContinuousTimingToggleChange);
        }
        console.log("Timer settings loaded:", { continuousTimingSetting, currentSessionName });
    });
}

function handleContinuousTimingToggleChange(event) {
    continuousTimingSetting = event.target.checked;
    browserAPI.storage.sync.set({ continuousTiming: continuousTimingSetting }, () => {
        console.log("Continuous timing setting saved:", continuousTimingSetting);
        showNotification(`Continuous Timing ${continuousTimingSetting ? 'Enabled' : 'Disabled'}`);
    });
}

function startTimerUpdates() {
    console.log("DEBUG: startTimerUpdates called. Current interval:", timerUpdateInterval);
    if (timerUpdateInterval) {
        console.log("DEBUG: Clearing existing timerUpdateInterval.");
        clearInterval(timerUpdateInterval);
    }
    timerUpdateInterval = setInterval(updateTimerDisplay, 1000);
    updateTimerDisplay(); // Initial update
    console.log("DEBUG: Timer display updates started. New interval:", timerUpdateInterval);
}

function stopTimerUpdates() {
    console.log("DEBUG: stopTimerUpdates called. Current interval:", timerUpdateInterval);
    if (timerUpdateInterval) {
        clearInterval(timerUpdateInterval);
        timerUpdateInterval = null;
        console.log("DEBUG: Timer display updates stopped.");
    } else {
        console.log("DEBUG: No active timerUpdateInterval to stop.");
    }
}

function updateTimerDisplay() {
    // console.log("DEBUG: updateTimerDisplay called."); // This might be too noisy
    browserAPI.runtime.sendMessage({ action: "getElapsedTime" }, (response) => {
        if (browserAPI.runtime.lastError) {
            console.error("DEBUG: Error getting timer state in updateTimerDisplay:", browserAPI.runtime.lastError.message);
            if (elements.timerDisplay) elements.timerDisplay.textContent = "Error";
            if (elements.persistentTimerDisplay) elements.persistentTimerDisplay.textContent = "Error";
            // stopTimerUpdates(); // Consider if we should stop polling on error
            return;
        }

        // console.log("DEBUG: updateTimerDisplay - response from background:", response); // Also potentially noisy

        const formattedTime = response && typeof response.elapsed === "number" ? formatTime(response.elapsed) : "00:00:00";
        const currentSession = response?.sessionName || "";

        if (elements.persistentTimerDisplay) {
            // console.log("DEBUG: Updating persistentTimerDisplay to:", formattedTime);
            elements.persistentTimerDisplay.textContent = formattedTime;
        } else {
            // console.log("DEBUG: persistentTimerDisplay element not found.");
        }

        if (elements.timerTab?.classList.contains('active')) {
            // console.log("DEBUG: Timer tab is active, updating timerDisplay and progress.");
            if (elements.timerDisplay) elements.timerDisplay.textContent = formattedTime;
            setCircleProgress(response?.elapsed || 0);
            if (elements.sessionNameDisplay) elements.sessionNameDisplay.textContent = currentSession;
        } else {
            // console.log("DEBUG: Timer tab is not active.");
        }
        currentSessionName = currentSession;
    });
}

function formatTime(ms) {
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

function setCircleProgress(elapsedMs) {
    if (!elements.progressRing) return;
    const radius = elements.progressRing.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    const minutes = (elapsedMs / 1000) / 60;
    const fraction = (minutes % 60) / 60; // Progress within the hour
    const offset = circumference - fraction * circumference;
    elements.progressRing.style.strokeDashoffset = Math.max(0, offset); // Ensure offset doesn't go negative
}

async function startTimerAction() { // Make async
    console.log("Start timer action");
    async function proceedWithStart(name) { // Make inner function async if needed, though not strictly required here
        setSessionName(name); // Update UI and storage
        browserAPI.runtime.sendMessage({ action: "startTimer", sessionName: name }, (response) => {
            handleApiResponse(response, 'Timer start');
            updateTimerDisplay(); // Immediately update display
        });
    }

    if (continuousTimingSetting) {
        const name = await showCustomPrompt("Enter session name:"); // Use custom prompt
        if (name !== null && name.trim()) { // Check for cancel (null) and empty
            proceedWithStart(name.trim());
        } else if (name !== null) { // Only show error if not cancelled
             showNotification("Session name cannot be empty.");
        }
    } else {
        // If no session name, prompt once, otherwise use existing
        if (!currentSessionName) {
             const name = await showCustomPrompt("Enter session name (optional):"); // Use custom prompt
             if (name !== null) { // Proceed even if empty, unless cancelled
                 proceedWithStart(name.trim()); // Use entered name or empty string
             }
        } else {
            proceedWithStart(currentSessionName);
        }
    }
}

// Make stopTimerAction async as well, although it already was implicitly due to the async setTimeout callback
async function stopTimerAction() {
    console.log("DEBUG: stopTimerAction called.");
    browserAPI.runtime.sendMessage({ action: "stopTimer" }, (response) => {
        console.log("DEBUG: stopTimerAction - response from background for stopTimer:", response);
        handleApiResponse(response, 'Timer stop');
        updateTimerDisplay();
        loadSessions();

        if (continuousTimingSetting && response && response.status && response.status.includes("stopped")) {
            console.log("DEBUG: stopTimerAction - Continuous timing enabled, prompting for next task.");
            setTimeout(async () => {
                try {
                    const nextTaskName = await showCustomPrompt("Timer stopped. Enter name for the next task:");
                    console.log("DEBUG: stopTimerAction - nextTaskName from prompt:", nextTaskName);
                    if (nextTaskName !== null && nextTaskName.trim() !== "") {
                        const trimmedName = nextTaskName.trim();
                        console.log("DEBUG: stopTimerAction - Resetting and starting new timer with name:", trimmedName);
                        browserAPI.runtime.sendMessage({ action: "resetTimer" }, () => {
                            console.log("DEBUG: stopTimerAction - Background reset complete. Setting session name and starting new timer.");
                            setSessionName(trimmedName);
                            browserAPI.runtime.sendMessage({ action: "startTimer", sessionName: trimmedName }, (startResponse) => {
                                console.log("DEBUG: stopTimerAction - Response from background for new startTimer:", startResponse);
                                handleApiResponse(startResponse, 'Timer restart (continuous)');
                                updateTimerDisplay();
                            });
                        });
                    } else {
                        console.log("DEBUG: stopTimerAction - Next task prompt cancelled or empty. Resetting timer.");
                        browserAPI.runtime.sendMessage({ action: "resetTimer" }, () => {
                             console.log("DEBUG: stopTimerAction - Background reset complete after cancel/empty prompt.");
                            setSessionName("");
                            updateTimerDisplay();
                        });
                    }
                } catch (error) {
                    console.error("DEBUG: Error during continuous timing prompt in stopTimerAction:", error);
                    browserAPI.runtime.sendMessage({ action: "resetTimer" }, () => {
                         setSessionName("");
                         updateTimerDisplay();
                     });
                }
            }, 50);
        }
    });
}

async function resetTimerAction() {
    console.log("DEBUG: resetTimerAction called.");
    const confirmed = await showCustomConfirm("Are you sure you want to reset the current timer? This will discard the current elapsed time.");
    console.log("DEBUG: resetTimerAction - confirmation result:", confirmed);
    if (confirmed) {
        console.log("DEBUG: resetTimerAction - User confirmed. Sending resetTimer to background.");
        browserAPI.runtime.sendMessage({ action: "resetTimer" }, (response) => {
            console.log("DEBUG: resetTimerAction - Response from background for resetTimer:", response);
            handleApiResponse(response, 'Timer reset');
            setSessionName("");
            updateTimerDisplay();
        });
    } else {
        console.log("DEBUG: resetTimerAction - User cancelled reset.");
    }
}

function setSessionName(name) {
    currentSessionName = name || "";
    if (elements.sessionNameDisplay) {
        elements.sessionNameDisplay.textContent = currentSessionName;
    }
    // Save to storage for persistence across popup openings
    browserAPI.storage.sync.set({ currentSessionName: currentSessionName });
    console.log("Session name set to:", currentSessionName);
}

function exportMarkdownAction() {
    console.log("Export markdown action");
    browserAPI.runtime.sendMessage({ action: "exportMarkdown" }, (response) => {
        if (response?.markdown) {
            const mdWindow = window.open("", "_blank");
            mdWindow.document.write("<pre>" + escapeHtml(response.markdown) + "</pre>");
            mdWindow.document.title = "Exported Sessions";
        } else {
            handleApiResponse(response, 'Markdown export');
        }
    });
}

// --- Sessions Tab Logic (Adapted from ObsidianTimer) ---
function initializeSessions() {
    console.log("Initializing Sessions Tab");
    setupSessionsEventListeners();
    // Initial load happens when tab is clicked
}

function setupSessionsEventListeners() {
    elements.clearSessionsButton?.addEventListener('click', clearAllSessionsAction);
    // Add/Edit/Delete listeners are added dynamically in loadSessions
}

function loadSessions() {
    console.log("Loading sessions");
    if (!elements.sessionsListDiv) return;

    browserAPI.runtime.sendMessage({ action: "getSessions" }, (response) => {
        elements.sessionsListDiv.innerHTML = ""; // Clear previous list
        if (browserAPI.runtime.lastError) {
            console.error("Error loading sessions:", browserAPI.runtime.lastError);
            elements.sessionsListDiv.textContent = "Error loading sessions.";
            return;
        }
        if (!response || !Array.isArray(response.sessions)) {
            console.error("Invalid session data received:", response);
            elements.sessionsListDiv.textContent = "Could not load sessions.";
            return;
        }

        if (response.sessions.length === 0) {
            elements.sessionsListDiv.textContent = "No sessions logged yet.";
            return;
        }

        response.sessions.forEach((session, index) => {
            const sessionCard = document.createElement("div");
            sessionCard.className = "session";
            // sessionCard.draggable = true; // Drag-and-drop TBD
            sessionCard.dataset.index = index;

            const infoDiv = document.createElement("div");
            infoDiv.className = "session-info";
            const nameSpan = document.createElement("span");
            nameSpan.className = "session-name-display";
            nameSpan.textContent = session.name || "Unnamed Session";
            const timeSpan = document.createElement("span");
            timeSpan.className = "session-time-display";
            timeSpan.textContent = ` — ${formatTime(session.elapsed)}`;
            infoDiv.appendChild(nameSpan);
            infoDiv.appendChild(timeSpan);
            sessionCard.appendChild(infoDiv);

            const actionsDiv = document.createElement("div");
            actionsDiv.className = "session-actions";

            // Edit button
            const editBtn = document.createElement("button");
            editBtn.innerHTML = "&#9998;"; // Pencil icon
            editBtn.title = "Edit Session";
            editBtn.addEventListener("click", (e) => {
                e.stopPropagation(); // Prevent card click if needed
                editSessionAction(index, session.name, session.elapsed);
            });
            actionsDiv.appendChild(editBtn);

            // Delete button
            const delBtn = document.createElement("button");
            delBtn.innerHTML = "&times;"; // Multiplication sign X
            delBtn.title = "Delete Session";
            delBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                deleteSessionAction(index, session.name);
            });
            actionsDiv.appendChild(delBtn);

            sessionCard.appendChild(actionsDiv);
            elements.sessionsListDiv.appendChild(sessionCard);
        });
    });
}

async function editSessionAction(index, currentName, currentElapsed) { // Make async
    const newNameRaw = await showCustomPrompt("Enter new session name:", currentName);
    if (newNameRaw === null) return; // User cancelled first prompt

    const newTimeStrRaw = await showCustomPrompt("Enter new session time (HH:MM:SS):", formatTime(currentElapsed));
    if (newTimeStrRaw === null) return; // User cancelled second prompt

    const newName = newNameRaw.trim(); // Trim after getting value
    const newTimeStr = newTimeStrRaw.trim(); // Trim after getting value

    const newElapsed = parseTimeString(newTimeStr);
    if (isNaN(newElapsed)) {
        showNotification("Invalid time format. Please use HH:MM:SS.");
        return;
    }

    browserAPI.runtime.sendMessage({
        action: "editSession",
        index: index,
        newName: newName || currentName, // Keep old name if new one is empty after trimming
        newElapsed: newElapsed
    }, (response) => {
        handleApiResponse(response, 'Session edit');
        if (response?.status?.includes("edited")) loadSessions(); // Refresh list on success
    });
}

async function deleteSessionAction(index, sessionName) { // Make async
    const confirmed = await showCustomConfirm(`Are you sure you want to delete session "${sessionName || 'Unnamed Session'}"?`);
    if (confirmed) {
        browserAPI.runtime.sendMessage({ action: "deleteSession", index: index }, (response) => {
            handleApiResponse(response, 'Session delete');
            if (response?.status?.includes("deleted")) loadSessions(); // Refresh list
        });
    }
}

async function clearAllSessionsAction() { // Make async
    const confirmed = await showCustomConfirm("Are you sure you want to delete ALL logged sessions? This cannot be undone.");
    if (confirmed) {
        browserAPI.runtime.sendMessage({ action: "reorderSessions", sessions: [] }, (response) => { // Use reorder to clear
             handleApiResponse(response, 'Clear all sessions');
             if (response?.status?.includes("reordered")) loadSessions(); // Refresh list
        });
    }
}

function parseTimeString(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return NaN;
    const parts = timeStr.split(":");
    if (parts.length !== 3) return NaN;
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return NaN;
    return ((hours * 3600) + (minutes * 60) + seconds) * 1000;
}


// --- Theme Management (Using JFormat's ThemeManager) ---
function loadThemeSettings() {
    console.log("Loading theme settings");
    browserAPI.storage.local.get(['theme'], (result) => {
        const theme = result.theme || 'light'; // Default to light
        setTheme(theme); // Apply theme using imported function
        // Ensure toggle button state matches (optional)
        // elements.themeToggle.setAttribute('aria-pressed', theme === 'dark');
    });
}

function toggleDarkMode() {
    console.log("Toggling dark mode");
    const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme); // Apply theme using imported function
    browserAPI.storage.local.set({ theme: newTheme }, () => {
        console.log('Theme preference saved:', newTheme);
    });
}

// Listener moved to cacheDOMElements


// --- Utility Functions ---
function isValidTab(tab) {
    // Basic check for valid URLs to inject scripts
    return tab && tab.url && !tab.url.startsWith("chrome://") && !tab.url.startsWith("edge://") && !tab.url.startsWith("about:");
}

function ensureContentScriptsInjected(callback, retries = 3) {
    console.log("Ensuring content scripts are injected for formatter");
    browserAPI.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0] && isValidTab(tabs[0])) {
            // Ping the content script
            browserAPI.tabs.sendMessage(tabs[0].id, { type: 'ping' }, response => {
                if (browserAPI.runtime.lastError) { // No response means not injected
                    console.log('Content script not detected via ping, injecting...');
                    injectContentScriptsWithRetry(tabs[0].id, callback, retries);
                } else {
                    console.log('Content script ping successful');
                    if (callback) callback(); // Execute callback if script is ready
                }
            });
        } else {
            console.log('Cannot inject content scripts on this page');
            updateUIForInvalidTab(); // Update UI to reflect inability to act
        }
    });
}

function injectContentScriptsWithRetry(tabId, callback, retries) {
    console.log(`Attempting injection for tab ${tabId}. Retries left: ${retries}`);
    // Use the background script to handle injection logic
    browserAPI.runtime.sendMessage({ action: "injectContentScripts" }, (response) => {
        if (browserAPI.runtime.lastError) {
            console.error('Error sending inject request to background:', browserAPI.runtime.lastError);
            if (retries > 0) {
                setTimeout(() => injectContentScriptsWithRetry(tabId, callback, retries - 1), 500);
            } else {
                showNotification('Failed to initialize formatter. Please refresh the page.');
            }
        } else if (response && response.success) {
            console.log('Background confirmed script injection.');
            if (callback) setTimeout(callback, 100); // Short delay for script to fully load
        } else {
            console.error('Background script reported injection failure:', response?.error);
            if (retries > 0) {
                setTimeout(() => injectContentScriptsWithRetry(tabId, callback, retries - 1), 500);
            } else {
                 showNotification('Failed to initialize formatter. Please refresh the page.');
            }
        }
    });
}

function handleApiResponse(response, actionDescription = 'Action') {
    if (browserAPI.runtime.lastError) {
        console.error(`Error during ${actionDescription}:`, browserAPI.runtime.lastError);
        showNotification(`Error: ${browserAPI.runtime.lastError.message}`);
        return false;
    } else if (response && (response.success === false || response.status?.includes("Error"))) {
        console.error(`Failed ${actionDescription}:`, response.error || response.status);
        showNotification(`Failed: ${response.error || response.status}`);
        return false;
    } else {
        console.log(`${actionDescription} successful:`, response);
        // Optionally show success notification for some actions
        if (response?.status && !response.status.includes("Unknown")) {
             // showNotification(response.status); // Can be noisy
        }
        return true;
    }
}

function showNotification(message, duration = 3000) {
    if (!elements.notificationArea) return;
    elements.notificationArea.textContent = message;
    elements.notificationArea.classList.add('show');
    setTimeout(() => {
        elements.notificationArea.classList.remove('show');
    }, duration);
}

function toggleModal(modalElement) {
    if (!modalElement) return;
    console.log("Toggling modal:", modalElement.id);
    modalElement.classList.toggle('show');
}

function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")  // Corrected entity
         .replace(/>/g, "&gt;")  // Corrected entity
         .replace(/"/g, "&quot;") // Corrected entity and syntax
         .replace(/'/g, "&#039;");
 }

// --- Custom Prompt Dialog ---
function showCustomPrompt(messageText) {
    return new Promise((resolve) => {
        if (!elements.customPromptOverlay || !elements.customPromptDialog || !elements.customPromptMessage || !elements.customPromptInput || !elements.customPromptOk || !elements.customPromptCancel) {
            console.error("Custom prompt elements not found in cache.");
            resolve(null); // Resolve with null if elements are missing
            return;
        }

        // Set message and clear input
        elements.customPromptMessage.textContent = messageText;
        elements.customPromptInput.value = '';

        // Show the modal
        elements.customPromptOverlay.style.display = 'flex';
        console.log('Set customPromptOverlay display to:', elements.customPromptOverlay.style.display); // Debug log
        elements.customPromptInput.focus(); // Focus the input field

        // --- One-time event listeners ---
        const okListener = () => {
            cleanupListeners();
            elements.customPromptOverlay.style.display = 'none';
            resolve(elements.customPromptInput.value);
        };

        const cancelListener = () => {
            cleanupListeners();
            elements.customPromptOverlay.style.display = 'none';
            resolve(null); // Resolve with null on cancel
        };

        const keydownListener = (event) => {
            if (event.key === 'Enter') {
                okListener();
            } else if (event.key === 'Escape') {
                cancelListener();
            }
        };

        // Function to remove listeners
        const cleanupListeners = () => {
            elements.customPromptOk.removeEventListener('click', okListener);
            elements.customPromptCancel.removeEventListener('click', cancelListener);
            elements.customPromptInput.removeEventListener('keydown', keydownListener);
            elements.customPromptOverlay.removeEventListener('click', overlayClickListener); // Remove overlay click listener too
        };

        // Listener for clicking outside the dialog (on the overlay)
        const overlayClickListener = (event) => {
            if (event.target === elements.customPromptOverlay) {
                cancelListener(); // Treat clicking outside as cancel
            }
        };


        // Attach listeners
        elements.customPromptOk.addEventListener('click', okListener, { once: true });
        elements.customPromptCancel.addEventListener('click', cancelListener, { once: true });
        elements.customPromptInput.addEventListener('keydown', keydownListener); // Keydown needs manual removal
        elements.customPromptOverlay.addEventListener('click', overlayClickListener); // Add overlay click listener

    });
}

// --- Custom Confirm Dialog ---
function showCustomConfirm(messageText) {
    return new Promise((resolve) => {
        if (!elements.customConfirmOverlay || !elements.customConfirmDialog || !elements.customConfirmMessage || !elements.customConfirmOk || !elements.customConfirmCancel) {
            console.error("Custom confirm elements not found in cache.");
            resolve(false); // Resolve with false if elements are missing, indicating cancellation or error
            return;
        }

        // Set message
        elements.customConfirmMessage.textContent = messageText;

        // Show the modal
        elements.customConfirmOverlay.style.display = 'flex';
        elements.customConfirmOk.focus(); // Focus the OK button by default

        // --- One-time event listeners ---
        const okListener = () => {
            cleanupListeners();
            elements.customConfirmOverlay.style.display = 'none';
            resolve(true); // Resolve with true on OK
        };

        const cancelListener = () => {
            cleanupListeners();
            elements.customConfirmOverlay.style.display = 'none';
            resolve(false); // Resolve with false on Cancel
        };

        const keydownListener = (event) => {
            if (event.key === 'Enter') {
                // If OK button is focused, or if it's the only logical "submit"
                if (document.activeElement === elements.customConfirmOk ||
                    document.activeElement !== elements.customConfirmCancel) {
                    okListener();
                }
            } else if (event.key === 'Escape') {
                cancelListener();
            } else if (event.key === 'Tab') {
                // Basic tab trapping
                if (event.shiftKey && document.activeElement === elements.customConfirmOk) {
                    elements.customConfirmCancel.focus();
                    event.preventDefault();
                } else if (!event.shiftKey && document.activeElement === elements.customConfirmCancel) {
                    elements.customConfirmOk.focus();
                    event.preventDefault();
                }
            }
        };
        
        // Function to remove listeners
        const cleanupListeners = () => {
            elements.customConfirmOk.removeEventListener('click', okListener);
            elements.customConfirmCancel.removeEventListener('click', cancelListener);
            elements.customConfirmDialog.removeEventListener('keydown', keydownListener); // Attach to dialog for broader key capture
            elements.customConfirmOverlay.removeEventListener('click', overlayClickListener);
        };

        // Listener for clicking outside the dialog (on the overlay)
        const overlayClickListener = (event) => {
            if (event.target === elements.customConfirmOverlay) {
                cancelListener(); // Treat clicking outside as cancel
            }
        };

        // Attach listeners
        elements.customConfirmOk.addEventListener('click', okListener, { once: true });
        elements.customConfirmCancel.addEventListener('click', cancelListener, { once: true });
        elements.customConfirmDialog.addEventListener('keydown', keydownListener); // Listen on dialog
        elements.customConfirmOverlay.addEventListener('click', overlayClickListener);
    });
}


// --- Removed Modal Helpers ---
// showModalInput and showModalInputTwo have been removed as their callers
// now use showCustomPrompt directly.


// --- Final Log ---
console.log('JTool combined popup script fully loaded.');
