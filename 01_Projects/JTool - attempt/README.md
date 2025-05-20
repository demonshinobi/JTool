# JTool

A Chrome extension combining powerful HTML formatting tools with a convenient timer.

## Features

- Apply HTML formatting to selected text
- Customizable formatting templates
- Theme support for the popup
- Hunter mode for enhanced text selection
- Popup interface for easy access to formatting options
- Integrated timer functionality (to be added)

## Development

This project uses webpack for building the extension.

### Setup

1. Install dependencies:
```bash
npm install
```

2. Build the extension:
```bash
npm run build
```

For development with hot reloading:
```bash
npm run watch
```

### Project Structure

- `src/background/` - Background scripts (will include timer logic)
- `src/content/` - Content scripts for text formatting
- `src/popup/` - Extension popup UI (will include timer UI)
- `src/icons/` - Extension icons

## Technologies

- JavaScript
- Webpack
- DOMPurify for sanitization
- Browser Extension APIs (including Alarms API for timer)

## License

ISC License
