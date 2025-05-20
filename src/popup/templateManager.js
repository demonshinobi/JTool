// templateManager.js

export function loadTemplate(templateName) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['templates'], (result) => {
            const templates = result.templates || {};
            if (templates[templateName]) {
                resolve(templates[templateName]);
            } else {
                reject(new Error('Template not found'));
            }
        });
    });
}

export function applyTemplate(element, templateName, data) {
    loadTemplate(templateName)
        .then(template => {
            // Replace placeholders in the template with actual data
            let appliedTemplate = template;
            for (const [key, value] of Object.entries(data)) {
                appliedTemplate = appliedTemplate.replace(new RegExp(`{{${key}}}`, 'g'), value);
            }
            element.innerHTML = appliedTemplate;
        })
        .catch(error => {
            console.error('Error applying template:', error);
        });
}

export function saveTemplate(name, html) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['templates'], (result) => {
            const templates = result.templates || {};
            templates[name] = html;
            chrome.storage.local.set({ templates }, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    });
}

export function deleteTemplate(name) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['templates'], (result) => {
            const templates = result.templates || {};
            if (templates[name]) {
                delete templates[name];
                chrome.storage.local.set({ templates }, () => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            } else {
                reject(new Error('Template not found'));
            }
        });
    });
}

// Function to update the template list dropdown
export function updateTemplateList(selectElement) {
    chrome.storage.local.get(['templates'], (result) => {
        const templates = result.templates || {};
        // Clear existing options
        selectElement.innerHTML = '<option value="">Select a template</option>'; // Add a default option
        // Populate with new options
        for (const name in templates) {
            if (Object.hasOwnProperty.call(templates, name)) {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                selectElement.appendChild(option);
            }
        }
    });
}

// Function to export templates to a JSON file
export function exportTemplates() {
    chrome.storage.local.get(['templates'], (result) => {
        const templates = result.templates || {};
        const jsonString = JSON.stringify(templates, null, 2); // Pretty print JSON
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'jtool_templates.json';
        document.body.appendChild(a); // Append anchor to body to ensure it can be clicked
        a.click();
        document.body.removeChild(a); // Clean up the anchor
        URL.revokeObjectURL(url); // Release the object URL
    });
}

// Function to import templates from a JSON file
export function importTemplates(event, selectElement) {
    const file = event.target.files[0];
    if (!file) {
        console.error('No file selected.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedTemplates = JSON.parse(e.target.result);
            if (typeof importedTemplates !== 'object' || importedTemplates === null) {
                throw new Error('Invalid JSON format. Root must be an object.');
            }

            chrome.storage.local.get(['templates'], (result) => {
                const currentTemplates = result.templates || {};
                // Merge templates, imported ones overwrite existing ones with the same name
                const mergedTemplates = { ...currentTemplates, ...importedTemplates };

                chrome.storage.local.set({ templates: mergedTemplates }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('Error saving imported templates:', chrome.runtime.lastError);
                        alert('Error saving imported templates: ' + chrome.runtime.lastError.message);
                    } else {
                        console.log('Templates imported successfully.');
                        alert('Templates imported successfully!');
                        updateTemplateList(selectElement); // Update the dropdown list
                    }
                });
            });
        } catch (error) {
            console.error('Error processing file:', error);
            alert('Error processing file: ' + error.message);
        }
    };
    reader.onerror = function(e) {
        console.error('Error reading file:', e);
        alert('Error reading file.');
    };
    reader.readAsText(file);

    // Reset file input value to allow importing the same file again if needed
    event.target.value = null;
}