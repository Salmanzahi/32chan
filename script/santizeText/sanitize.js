export function sanitizeText(text) {
    if (!text) return '';
    
    // Check if this is rich text content from Quill (contains HTML)
    const isRichText = /<\/?[a-z][\s\S]*>/i.test(text);
    
    if (isRichText) {
        // This is likely rich text from the editor, use a more permissive sanitization
        return sanitizeRichText(text);
    } else {
        // This is plain text, use strict sanitization
        const div = document.createElement('div');
        div.textContent = text;
        let sanitized = div.innerHTML;
        
        // Convert newlines to <br> tags to preserve them in HTML
        sanitized = sanitized.replace(/\n/g, '<br>');
        
        return sanitized;
    }
}

/**
 * Sanitize rich text content from Quill editor
 * Preserves formatting tags while removing potentially dangerous elements
 * @param {string} html - The HTML content to sanitize
 * @returns {string} Sanitized HTML that keeps formatting but removes scripts
 */
function sanitizeRichText(html) {
    if (!html) return '';
    
    // Create a new DOMParser to parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Find and remove all script, style, iframe, and other potentially dangerous elements
    const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'meta', 'link'];
    dangerousTags.forEach(tag => {
        const elements = doc.querySelectorAll(tag);
        elements.forEach(element => {
            element.parentNode.removeChild(element);
        });
    });
    
    // List of allowed CSS properties (specifically for text formatting)
    const allowedStyleProps = [
        'color', 
        'background-color', 
        'background', 
        'font-weight', 
        'font-style', 
        'text-decoration', 
        'text-align',
        'margin',
        'padding',
        'text-indent'
    ];
    
    // Remove dangerous attributes from all elements
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(element => {
        // Get all attributes
        const attributes = element.attributes;
        const attributesToRemove = [];
        
        // Collect attributes to remove (can't modify while iterating)
        for (let i = 0; i < attributes.length; i++) {
            const attr = attributes[i];
            
            // Handle style attributes specially to preserve color formatting
            if (attr.name === 'style') {
                const styles = attr.value.split(';');
                const safeStyles = [];
                
                // Only keep allowed CSS properties
                styles.forEach(style => {
                    const [property, value] = style.split(':').map(s => s.trim());
                    if (property && allowedStyleProps.includes(property.toLowerCase())) {
                        // Check for potentially harmful values
                        if (!value.toLowerCase().includes('expression') && 
                            !value.toLowerCase().includes('javascript:') &&
                            !value.toLowerCase().includes('eval(')) {
                            safeStyles.push(`${property}: ${value}`);
                        }
                    }
                });
                
                // Update with only safe styles or remove if none
                if (safeStyles.length > 0) {
                    element.setAttribute('style', safeStyles.join('; '));
                } else {
                    attributesToRemove.push('style');
                }
            }
            // Remove event handlers and javascript URLs
            else if (attr.name.toLowerCase().startsWith('on') || 
                (attr.name === 'href' && attr.value.toLowerCase().includes('javascript:'))) {
                attributesToRemove.push(attr.name);
            }
        }
        
        // Remove the collected attributes
        attributesToRemove.forEach(attr => {
            element.removeAttribute(attr);
        });
        
        // Handle Quill's specific color formatting
        if (element.classList.contains('ql-color') || element.classList.contains('ql-background')) {
            // These are safe classes from Quill that represent color formatting
            // No need to remove them
        }
        
        // Preserve Quill specific span elements with color attributes
        if (element.tagName === 'SPAN' && (
            element.style.color || 
            element.style.backgroundColor || 
            element.hasAttribute('data-color') || 
            element.hasAttribute('data-background')
        )) {
            // These are Quill's color formatting elements
            // We've already sanitized the style attribute above
        }
    });
    
    // Apply sanitization to style tags that might be included for color definitions
    const styleTags = doc.querySelectorAll('style');
    styleTags.forEach(styleTag => {
        // Only allow simple color-related CSS
        const css = styleTag.textContent;
        const safeCSS = sanitizeCSS(css);
        styleTag.textContent = safeCSS;
    });
    
    // Get the sanitized HTML
    let sanitized = doc.body.innerHTML;
    
    // Additional replacements if needed
    sanitized = sanitized.replace(/\n/g, '<br>');
    
    return sanitized;
}

/**
 * Sanitize CSS to only allow color-related styling
 * @param {string} css - The CSS content to sanitize
 * @returns {string} Sanitized CSS that only keeps color-related styles
 */
function sanitizeCSS(css) {
    if (!css) return '';
    
    // Split into rule blocks
    const rules = css.split('}');
    const safeRules = [];
    
    // Allowed CSS properties
    const allowedProps = [
        'color',
        'background-color',
        'background',
        'font-weight',
        'font-style',
        'text-decoration',
        'text-align'
    ];
    
    // Process each rule
    rules.forEach(rule => {
        if (!rule.includes('{')) return;
        
        const [selector, declarations] = rule.split('{');
        const safeDeclarations = [];
        
        // Split declarations and check each property
        declarations.split(';').forEach(declaration => {
            if (!declaration.includes(':')) return;
            
            const [property, value] = declaration.split(':').map(s => s.trim());
            
            // Only allow specific properties
            if (property && allowedProps.includes(property.toLowerCase())) {
                // Check for harmful values
                if (!value.toLowerCase().includes('expression') && 
                    !value.toLowerCase().includes('javascript:') &&
                    !value.toLowerCase().includes('eval(')) {
                    safeDeclarations.push(`${property}: ${value}`);
                }
            }
        });
        
        // Rebuild the rule if we have safe declarations
        if (safeDeclarations.length > 0) {
            safeRules.push(`${selector} { ${safeDeclarations.join('; ')} }`);
        }
    });
    
    return safeRules.join(' ');
}