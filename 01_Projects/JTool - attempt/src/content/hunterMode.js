// hunterMode.js

let overlay = null;
// let hoverBox; // Removed hoverBox logic
let selectedElement = null;
let editPanel = null;
let isHunterModeActive = false;

// Store original styles to revert back
// let originalOutline = ''; // Replaced by selectedElementOriginalOutline
let originalCursor = ''; // Store original cursor
let selectedElementOriginalOutline = ''; // Stores the specific outline of the selected element
let selectedElementOriginalOpacity = ''; // Stores the specific opacity of the selected element

// --- State Variables for Hover Effect ---
let currentlyHoveredElement = null;
let currentHoverOriginalOutline = '';
let currentHoverOriginalOpacity = ''; // Variable to store the original opacity style

function activateHunterModeInternal() { // Renamed to avoid conflict, not exported directly
    console.log('[hunterMode.js] activateHunterModeInternal: Current state BEFORE activation:', isHunterModeActive);
    if (isHunterModeActive) {
        console.log('[hunterMode.js] activateHunterModeInternal: Already active, returning.');
        return;
    }
    console.log('[hunterMode.js] activateHunterModeInternal: Activating Hunter Mode...');
    isHunterModeActive = true; // State change happens here
    console.log('[hunterMode.js] activateHunterModeInternal: State AFTER activation:', isHunterModeActive);
    document.body.style.backgroundColor = 'lightpink';
    console.log('[hunterMode.js] Body background color set to lightpink');
    originalCursor = document.body.style.cursor; // Store original cursor
    createOverlay();
    // createHoverBox(); // Removed hoverBox logic
    createEditPanel();
    setTimeout(() => {
        document.body.style.setProperty('cursor', 'crosshair', 'important'); // Set cursor forcefully
        console.log('[hunterMode.js] activateHunterModeInternal: Cursor style set to crosshair (important). Value:', document.body.style.cursor);
        addEventListeners();
        console.log('[hunterMode.js] Event listeners added (delayed)');
    }, 100);
}

function deactivateHunterModeInternal() { // Renamed to avoid conflict, not exported directly
    console.log('[hunterMode.js] deactivateHunterModeInternal: Current state BEFORE deactivation:', isHunterModeActive);
    if (!isHunterModeActive) {
        console.log('[hunterMode.js] deactivateHunterModeInternal: Already inactive, returning.');
        return;
    }
    console.log('[hunterMode.js] deactivateHunterModeInternal: Deactivating Hunter Mode...');
    isHunterModeActive = false; // State change happens here
    console.log('[hunterMode.js] deactivateHunterModeInternal: State AFTER deactivation:', isHunterModeActive);
    document.body.style.backgroundColor = '';
    console.log('[hunterMode.js] Body background color reset');
    document.body.style.setProperty('cursor', 'default', 'important'); // Reset cursor to default with !important
    console.log('[hunterMode.js] deactivateHunterModeInternal: Cursor reset to default. Actual value:', document.body.style.cursor);
    removeOverlay();
    // removeHoverBox(); // Removed hoverBox logic - ensure no call remains
    removeEditPanel();
    removeEventListeners();
    // Remove highlight from the selected element if it exists
    if (selectedElement) {
        selectedElement.style.setProperty('outline', selectedElementOriginalOutline, ''); // Restore selected element's original outline
        console.log('[hunterMode.js] deactivateHunterModeInternal: Selected element outline restored to:', selectedElementOriginalOutline);
        // Restore opacity *before* nulling the reference
        selectedElement.style.setProperty('opacity', selectedElementOriginalOpacity, ''); // Restore selected element's original opacity
        console.log('[hunterMode.js] deactivateHunterModeInternal: Selected element opacity restored to:', selectedElementOriginalOpacity);
        selectedElement = null; // Nullify the reference *after* using it
    }
    selectedElementOriginalOutline = ''; // Clear stored outline for selected element
    selectedElementOriginalOpacity = ''; // Clear stored opacity for selected element

    // Explicitly clear styles of any currently hovered element and nullify
    if (currentlyHoveredElement) {
        currentlyHoveredElement.style.setProperty('outline', currentHoverOriginalOutline, '');
        currentlyHoveredElement.style.setProperty('opacity', currentHoverOriginalOpacity, ''); // Restore original opacity
        console.log('[hunterMode.js] deactivateHunterModeInternal: Currently hovered element outline restored to:', currentHoverOriginalOutline);
        console.log('[hunterMode.js] deactivateHunterModeInternal: Currently hovered element opacity restored to:', currentHoverOriginalOpacity);
        currentlyHoveredElement = null;
    }
    currentHoverOriginalOutline = ''; // Clear stored outline for hovered element
    currentHoverOriginalOpacity = ''; // Clear stored opacity for hovered element
// Function closing brace was here incorrectly, removed.
} // End of deactivateHunterModeInternal

function createOverlay() {
    overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 9998;
        pointer-events: none;
    `;
    document.body.appendChild(overlay);
}

function removeOverlay() {
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
    overlay = null; // Ensure it's nulled even if not in DOM
}

// Ensure createHoverBox and removeHoverBox functions are fully removed if they exist

function createEditPanel() {
    if (editPanel) return; // Prevent multiple edit panels
    editPanel = document.createElement('div');
    editPanel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 300px;
        background-color: white;
        border: 1px solid #ccc;
        padding: 10px;
        z-index: 10000;
        display: none;
    `;
    editPanel.innerHTML = `
        <textarea id="elementContent" rows="10" style="width: 100%; margin-bottom: 10px;"></textarea>
        <button id="applyChanges">Apply</button>
    `;
    document.body.appendChild(editPanel);
}

function removeEditPanel() {
    if (editPanel && editPanel.parentNode) {
        editPanel.parentNode.removeChild(editPanel);
    }
    editPanel = null; // Ensure it's nulled
}

function addEventListeners() {
    // Use mouseover/mouseout for highlighting
    document.addEventListener('mouseover', handleMouseOver);
    console.log('HunterMode: mouseover listener ADDED');
    document.addEventListener('mouseout', handleMouseOut);
    console.log('HunterMode: mouseout listener ADDED');
    // Use click in capture phase to potentially intercept before other listeners
    document.addEventListener('click', handleClick, true);
    console.log('HunterMode: click listener ADDED');
    // Allow ESC key to exit Hunter mode
    document.addEventListener('keydown', handleKeydown, true);
    window.addEventListener('keydown', handleKeydown, true);
    console.log('HunterMode: keydown listener ADDED');
    // Apply button listener (needs edit panel to exist first)
    if (editPanel) {
        const applyChangesButton = editPanel.querySelector('#applyChanges'); // Query within panel
        if (applyChangesButton) {
            applyChangesButton.addEventListener('click', applyChanges);
        } else {
            console.error("Apply button not found in edit panel.");
        }
    } else {
         console.error("Edit panel not found for adding button listener.");
    }
}

function removeEventListeners() {
    document.removeEventListener('mouseover', handleMouseOver);
    console.log('HunterMode: mouseover listener REMOVED');
    document.removeEventListener('mouseout', handleMouseOut);
    console.log('HunterMode: mouseout listener REMOVED');
    document.removeEventListener('click', handleClick, true);
    console.log('HunterMode: click listener REMOVED');
    document.removeEventListener('keydown', handleKeydown, true);
    window.removeEventListener('keydown', handleKeydown, true);
    console.log('HunterMode: keydown listener REMOVED');
    // Remove apply button listener
    if (editPanel) {
        const applyChangesButton = editPanel.querySelector('#applyChanges');
        if (applyChangesButton) {
            applyChangesButton.removeEventListener('click', applyChanges);
        }
    }
}

// --- Event Handlers ---

function handleMouseOver(event) { // Changed e to event for clarity
    console.log('[hunterMode.js] handleMouseOver: TRIGGERED. Target:', event.target); // Ensure this is the VERY FIRST line
    // Ignore if mode not active, or an element is already selected
    if (!isHunterModeActive || selectedElement) return; // Don't highlight if an element is already selected

    const target = event.target; // Corrected e to event, as function signature is event (line 157)
    // Ignore overlay, edit panel, and non-element nodes, body/html, or already hovered element
    if (!target || target === currentlyHoveredElement || target === overlay || (editPanel && editPanel.contains(target)) || target.nodeType !== Node.ELEMENT_NODE || target === document.body || target === document.documentElement) {
        return;
    }

    // If hovering over a new element, restore the outline of the previously hovered one first
    if (currentlyHoveredElement) {
        currentlyHoveredElement.style.outline = currentHoverOriginalOutline;
    }

    // Store new hover target's original styles and apply hover highlight
    currentlyHoveredElement = target;
    currentHoverOriginalOutline = target.style.outline || ''; // Store original outline (if needed elsewhere, though not directly used for hover effect here)
    currentHoverOriginalOpacity = target.style.opacity || ''; // Store original opacity (in case needed)
    console.log('[hunterMode.js] handleMouseOver: Stored original opacity:', currentHoverOriginalOpacity); // Log stored original opacity
    event.target.style.setProperty('outline', '2px solid red', 'important');
    console.log('[hunterMode.js] handleMouseOver: Outline set to 2px solid red');
}

function handleMouseOut(event) { // Changed e to event for consistency
     // Ignore if mode not active, or an element is already selected
    if (!isHunterModeActive || selectedElement) return; // Don't change if an element is selected

    const target = event.target; // Changed e.target to event.target
     // Ignore overlay, edit panel, and non-element nodes, body/html
    if (!target || target !== currentlyHoveredElement || target === overlay || (editPanel && editPanel.contains(target)) || target.nodeType !== Node.ELEMENT_NODE || target === document.body || target === document.documentElement) {
        return;
    }

    // Restore original outline and opacity only for the element we were actually hovering
    event.target.style.setProperty('outline', currentHoverOriginalOutline, '');
    event.target.style.setProperty('opacity', currentHoverOriginalOpacity, '');

    // Clear hover state
    currentlyHoveredElement = null;
    currentHoverOriginalOutline = ''; // Clear stored outline
    currentHoverOriginalOpacity = ''; // Clear stored opacity
}

function handleClick(e) {
    console.log('[hunterMode.js] handleClick: TRIGGERED. Target:', e.target); // Log trigger and target
    // Only proceed if hunter mode is active and no element is currently selected
    if (!isHunterModeActive || selectedElement) return;

    const target = e.target; // Use event target directly

    // Check if the click is on a valid element (not overlay, edit panel, etc.)
    if (target && target !== overlay && (!editPanel || !editPanel.contains(target)) && target.nodeType === Node.ELEMENT_NODE && target !== document.body && target !== document.documentElement) {
        // Prevent default click behavior and stop propagation
        e.preventDefault();
        e.stopPropagation();

        console.log('[hunterMode.js] handleClick: selectedElement BEFORE assignment:', selectedElement); // Log before assignment
        selectedElement = target;
        console.log('[hunterMode.js] handleClick: selectedElement AFTER assignment:', selectedElement); // Log after assignment
        console.log('Element selected:', selectedElement); // Original log kept for context

        // --- Selection Action ---
        // 1. Store the *actual* original styles of the clicked element
        selectedElementOriginalOutline = target.style.outline || '';
        selectedElementOriginalOpacity = target.style.opacity || ''; // Store original opacity
        console.log('[hunterMode.js] handleClick: Stored original opacity:', selectedElementOriginalOpacity); // Log stored original opacity

        // 2. Apply persistent highlight (solid red outline and reduced opacity)
        selectedElement.style.setProperty('outline', '3px solid red', 'important');
        selectedElement.style.setProperty('opacity', '0.3', 'important'); // Slightly dim for visibility
        console.log('[hunterMode.js] handleClick: Selected element opacity set to 0.3 !important. Inline value:', selectedElement.style.opacity); // Log inline opacity
        try {
            console.log('[hunterMode.js] handleClick: Selected element computed opacity:', window.getComputedStyle(selectedElement).opacity); // Log computed opacity
        } catch (error) {
             console.error('[hunterMode.js] handleClick: Error getting computed opacity for selected element:', error);
        }


        // 3. Clear any lingering hover state visuals (outline and opacity)
        if (currentlyHoveredElement && currentlyHoveredElement !== selectedElement) {
             currentlyHoveredElement.style.setProperty('outline', currentHoverOriginalOutline, '');
             currentlyHoveredElement.style.setProperty('opacity', currentHoverOriginalOpacity, ''); // Restore opacity too
        }
        currentlyHoveredElement = null;
        currentHoverOriginalOutline = '';
        currentHoverOriginalOpacity = '';


        // 4. Reset cursor to normal
        document.body.style.cursor = originalCursor;

        // Show the edit panel for the selected element
        showEditPanel();

        // At this point, hover effects are implicitly stopped because
        // handleMouseOver/handleMouseOut check if selectedElement is set.

    } else {
        // Log if the click was ignored (e.g., on the overlay or edit panel)
        console.log('Click ignored on non-target element or outside valid area.');
    }
}

function handleKeydown(event) {
    if (event.key === 'Escape') {
        deactivateHunterModeInternal();
    }
}


// --- Edit Panel Logic ---

function showEditPanel() {
    if (selectedElement && editPanel) {
        const content = selectedElement.outerHTML;
        const elementContent = editPanel.querySelector('#elementContent'); // Query within panel
        if (elementContent) {
            elementContent.value = content;
            editPanel.style.display = 'block';
        } else {
             console.error("Cannot find text area in edit panel.");
        }
    }
}

function applyChanges() {
    if (selectedElement && editPanel) {
        const elementContent = editPanel.querySelector('#elementContent'); // Query within panel
        if (elementContent) {
            const newContent = elementContent.value;
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newContent.trim(); // Trim whitespace
            const newElement = tempDiv.firstElementChild;

            if (newElement && selectedElement.parentNode) {
                 try {
                    selectedElement.parentNode.replaceChild(newElement, selectedElement);
                    console.log('Element replaced successfully.');
                    // Update reference to the new element
                    selectedElement = newElement;
                    // Re-apply persistent highlight to the new element
                    selectedElement.style.outline = '3px solid red';
                    editPanel.style.display = 'none'; // Hide panel

                    // Decide what happens next: deactivate or allow new selection?
                    // Option 1: Deactivate Hunter Mode completely
                    // console.log('[hunterMode.js] applyChanges: Before calling deactivateHunterModeInternal (Option 1)'); // Log before potential deactivation
                    // deactivateHunterMode();

                    // Option 2: Allow selecting another element
                    selectedElement = null; // Clear selection
                    selectedElementOriginalOutline = ''; // Clear stored outline for the *previous* selection
                    selectedElementOriginalOpacity = ''; // Clear stored opacity for the *previous* selection
                    document.body.style.cursor = 'crosshair'; // Restore crosshair for next selection
                    console.log('Ready to select another element.');
                 } catch (error) {
                     console.error('Error replacing element:', error);
                     alert(`Failed to apply changes: ${error.message}`);
                     // Attempt to restore original outline if possible
                     if (selectedElement) selectedElement.style.outline = selectedElementOriginalOutline; // Use the correct stored outline
                 }
            } else if (!newElement) {
                 console.error('Invalid HTML content provided.');
                 alert('Failed to apply changes. The provided HTML is invalid or empty.');
            } else if (!selectedElement.parentNode) {
                 console.error('Selected element is detached from the DOM.');
                 alert('Failed to apply changes. The selected element is no longer in the document.');
            }
        } else {
             console.error("Cannot find text area in edit panel.");
        }
    } else {
        console.log('Apply changes called but no element is selected or edit panel missing.');
    }
}


console.log('Hunter Mode module loaded');

// --- Centralized Toggle Function ---
export function toggleHunterMode() {
    console.log('[hunterMode.js] toggleHunterMode: Called. Current state:', isHunterModeActive);
    if (isHunterModeActive) {
        console.log('[hunterMode.js] toggleHunterMode: Before calling deactivateHunterModeInternal'); // Log before deactivation
        deactivateHunterModeInternal();
    } else {
        activateHunterModeInternal();
    }
    console.log('[hunterMode.js] toggleHunterMode: New state after toggle:', isHunterModeActive);
    return isHunterModeActive; // Return the new state
}