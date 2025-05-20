// formatter.js
import DOMPurify from 'dompurify';

export function formatText(text, format) {
    console.log('Formatting text:', text);
    console.log('Using format:', format);

    try {
        // Replace {{text}} placeholder with the actual text
        let formattedHtml = format.replace(/{{text}}/g, text);

        // Implement additional formatting logic here if needed

        console.log('Formatted HTML:', formattedHtml);
        return formattedHtml;
    } catch (error) {
        console.error('Error in formatText:', error);
        throw error;
    }
}

export function applyFormattingToNode(node, htmlCode) {
    console.log('Applying formatting to node:', node);
    console.log('HTML code:', htmlCode);

    if (!node || !node.parentNode) {
        console.error('Invalid node for formatting:', node);
        throw new Error('Invalid node for formatting.');
    }

    try {
        // Create a new element with the formatted content
        const newElement = document.createElement('span');
        newElement.innerHTML = htmlCode;

        // Replace the existing node with the new formatted element
        node.parentNode.replaceChild(newElement, node);
        console.log('Formatting applied successfully');
    } catch (error) {
        console.error('Error in applyFormattingToNode:', error);
        throw error;
    }
}

export function sanitizeHtml(html) {
    console.log('Sanitizing HTML:', html);

    try {
        const sanitizedHtml = DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'img'],
            ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'style', 'class', 'id']
        });
        console.log('Sanitized HTML:', sanitizedHtml);
        return sanitizedHtml;
    } catch (error) {
        console.error('Error in sanitizeHtml:', error);
        throw error;
    }
}