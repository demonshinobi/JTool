// themeManager.js

export function setTheme(themeName) {
    console.log('Setting theme:', themeName);
    if (themeName === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    // Add any additional theme-related logic here
}

export function getAvailableThemes() {
    return ['light', 'dark'];
    // Add more themes if available
}

// Add more theme-related functions as needed