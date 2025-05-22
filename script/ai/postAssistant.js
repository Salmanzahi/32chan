import { AI_CONFIG } from '../config/aiConfig.js';
import { showAlert } from '../alert/alert.js';
import { getEditorContent, setEditorContent } from '../richtext/editor.js';

/**
 * Post Assistant Module
 * Provides AI-powered assistance for creating and improving forum posts
 */

// UI Management Functions

/**
 * Toggles the visibility of the AI assist options dropdown
 */
export function toggleAiAssistOptions() {
    const optionsMenu = document.getElementById('aiAssistOptions');
    optionsMenu.style.display = optionsMenu.style.display === 'block' ? 'none' : 'block';
}

/**
 * Sets up event listener to close the AI options dropdown when clicking outside
 */
export function setupClickOutside() {
    document.addEventListener('click', function(event) {
        const optionsMenu = document.getElementById('aiAssistOptions');
        const aiButton = document.getElementById('aiAssistButton');

        if (optionsMenu && aiButton && !optionsMenu.contains(event.target) && !aiButton.contains(event.target)) {
            optionsMenu.style.display = 'none';
        }
    });
}

// UI Component Creation

/**
 * Creates or resets the AI response container
 * @returns {HTMLElement} The response container element
 */
function createResponseContainer() {
    // Check if container already exists
    let responseContainer = document.getElementById('aiResponseContainer');
    if (responseContainer) {
        // Reset the container to default state
        responseContainer.innerHTML = '';
        responseContainer.className = 'ai-response';
        return responseContainer;
    }

    // Create new container with all necessary elements
    responseContainer = document.createElement('div');
    responseContainer.id = 'aiResponseContainer';
    responseContainer.className = 'ai-response';

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'ai-response-close';
    closeButton.innerHTML = '×';
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.addEventListener('click', () => responseContainer.remove());

    // Create inner content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'ai-response-content';

    responseContainer.appendChild(closeButton);
    responseContainer.appendChild(contentWrapper);

    // Add container after the message input area
    const messageContainer = document.getElementById('messageInputContainer');
    messageContainer.parentNode.insertBefore(responseContainer, messageContainer.nextSibling);

    return responseContainer;
}

/**
 * Shows loading indicator in the response container
 */
function showLoading() {
    const container = createResponseContainer();
    const contentWrapper = container.querySelector('.ai-response-content');
    contentWrapper.innerHTML = '';

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'ai-loading';

    const spinner = document.createElement('div');
    spinner.className = 'ai-loading-spinner';

    loadingDiv.appendChild(spinner);
    contentWrapper.appendChild(loadingDiv);
}

// Response Processing Functions

/**
 * Creates an apply button for applying AI suggestions to the editor
 * @param {string} content - The content to apply to the editor
 * @param {HTMLElement} container - The container element to remove after applying
 * @returns {HTMLButtonElement} The created button
 */
function createApplyButton(content, container) {
    const applyButton = document.createElement('button');
    applyButton.textContent = 'Apply to Post';
    applyButton.className = 'submit-btn';

    applyButton.addEventListener('click', () => {
        const plainText = stripHtml(content);
        setEditorContent(plainText);
        container.remove();
        showAlert('AI suggestion applied to your post', 'success');
    });

    return applyButton;
}

/**
 * Creates an option element for multiple AI suggestions
 * @param {string} option - The option content
 * @param {number} index - The option index
 * @param {HTMLElement} container - The parent container
 * @returns {HTMLElement} The created option element
 */
function createOptionElement(option, index, container) {
    const optionContainer = document.createElement('div');
    optionContainer.className = 'ai-option';

    // Option number
    const optionNumber = document.createElement('div');
    optionNumber.className = 'ai-option-number';
    optionNumber.textContent = `Option ${index + 1}`;

    // Option content
    const optionContent = document.createElement('div');
    optionContent.className = 'ai-option-content';
    optionContent.innerHTML = formatResponseText(option);

    // Apply button for this option
    const applyButton = createApplyButton(option, container);
    applyButton.className = 'submit-btn ai-option-apply';

    optionContainer.appendChild(optionNumber);
    optionContainer.appendChild(optionContent);
    optionContainer.appendChild(applyButton);

    return optionContainer;
}

/**
 * Processes and displays the AI response
 * @param {string} response - The AI response text
 * @param {string} actionType - The type of AI action performed
 */
function processResponse(response, actionType) {
    const container = document.getElementById('aiResponseContainer');
    if (!container) return;

    const contentWrapper = container.querySelector('.ai-response-content') || container;
    contentWrapper.innerHTML = '';

    try {
        // Parse the response if it's JSON
        let responseContent = parseResponseContent(response);

        // Check if response has multiple options
        const options = splitMultipleOptions(responseContent);

        // Create apply buttons for certain action types
        if (['improve', 'expand', 'summarize'].includes(actionType)) {
            if (options.length > 1) {
                // Create a heading for multiple options
                const heading = document.createElement('h4');
                heading.textContent = 'Select one of these options:';
                heading.className = 'ai-options-heading';
                contentWrapper.appendChild(heading);

                // Create container for options
                const optionsContainer = document.createElement('div');
                optionsContainer.className = 'ai-options-container';
                contentWrapper.appendChild(optionsContainer);

                // Add each option with its own apply button
                options.forEach((option, index) => {
                    const optionElement = createOptionElement(option, index, container);
                    optionsContainer.appendChild(optionElement);
                });
            } else {
                // Single option response
                contentWrapper.innerHTML = formatResponseText(responseContent);
                contentWrapper.appendChild(createApplyButton(responseContent, container));
            }
        } else {
            contentWrapper.innerHTML = formatResponseText(responseContent);
        }
    } catch (error) {
        contentWrapper.innerHTML = `<p>Error processing AI response: ${error.message}</p>`;
    }
}

/**
 * Parses the response content from various formats
 * @param {string} response - The raw response from the AI
 * @returns {string} The parsed content
 */
function parseResponseContent(response) {
    if (typeof response !== 'string') return response;

    if (response.trim().startsWith('{')) {
        try {
            const parsedResponse = JSON.parse(response);
            return parsedResponse.content || parsedResponse.text || parsedResponse.response || response;
        } catch (e) {
            return response;
        }
    }

    return response;
}

/**
 * Splits response into multiple options if they exist
 * @param {string} text - The text to split into options
 * @returns {Array<string>} Array of option texts
 */
function splitMultipleOptions(text) {
    // Common option separators in AI responses
    const optionPatterns = [
        /Option \d+[:\)]\s*/gi,             // Option 1: or Option 1)
        /\n\s*\d+[.:\)]\s*/g,                // Numbered lists: 1. or 1: or 1)
        /\n\s*[A-Z]\)\s*/g,                   // Letter options: A) B) C)
        /\n\s*Alternative \d+[:\)]\s*/gi,     // Alternative 1: or Alternative 1)
        /\n\s*Suggestion \d+[:\)]\s*/gi      // Suggestion 1: or Suggestion 1)
    ];

    // Try to find a pattern that matches option separation in this text
    for (const pattern of optionPatterns) {
        const matches = [...text.matchAll(pattern)];
        if (matches.length > 1) {
            const options = [];
            const positions = matches.map(match => match.index);

            // Extract each option using the separator positions
            for (let i = 0; i < positions.length; i++) {
                const start = positions[i];
                const end = i < positions.length - 1 ? positions[i + 1] : text.length;

                let option = text.substring(start, end).trim();
                // Remove the option prefix (e.g., "Option 1:")
                option = option.replace(pattern, '').trim();
                options.push(option);
            }

            return options;
        }
    }

    // No valid separation pattern found, return full text as single option
    return [text];
}

/**
 * Strips HTML from text but preserves formatting and line breaks
 * @param {string} html - The HTML content to strip
 * @returns {string} Plain text with preserved formatting
 */
function stripHtml(html) {
    if (!html) return '';

    // Handle content with different paragraph/section structures
    let processedHtml = html;

    // Convert HTML to appropriate markdown
    const htmlToMarkdownMap = [
        { pattern: /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, replacement: '\n## $1\n' },
        { pattern: /<p[^>]*>(.*?)<\/p>/gi, replacement: '$1\n\n' },
        { pattern: /<li[^>]*>(.*?)<\/li>/gi, replacement: '* $1\n' },
        { pattern: /<div[^>]*>(.*?)<\/div>/gi, replacement: '$1\n' },
        { pattern: /<br\s*[\/]?>/gi, replacement: '\n' },
        { pattern: /<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, replacement: '**$2**' },
        { pattern: /<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, replacement: '*$2*' }
    ];

    // Apply all replacements
    htmlToMarkdownMap.forEach(({ pattern, replacement }) => {
        processedHtml = processedHtml.replace(pattern, replacement);
    });

    // Extract plain text content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = processedHtml;
    let text = tempDiv.textContent || tempDiv.innerText || '';

    // Clean up multiple newlines but preserve the intentional ones
    text = text.replace(/\n{3,}/g, '\n\n');

    // Fix any leftover HTML entities
    const htmlEntities = [
        { pattern: /&nbsp;/g, replacement: ' ' },
        { pattern: /&amp;/g, replacement: '&' },
        { pattern: /&lt;/g, replacement: '<' },
        { pattern: /&gt;/g, replacement: '>' },
        { pattern: /&quot;/g, replacement: '"' }
    ];

    htmlEntities.forEach(({ pattern, replacement }) => {
        text = text.replace(pattern, replacement);
    });

    return text;
}

/**
 * Formats response text with enhanced styling
 * @param {string} text - The text to format
 * @returns {string} Formatted HTML
 */
function formatResponseText(text) {
    if (!text) return '<p>No content available</p>';

    // Replace newlines with paragraph breaks
    const paragraphs = text.split('\n\n');

    const formattedParagraphs = paragraphs
        .map(para => para.trim())
        .filter(para => para)
        .map(para => {
            // Check if this is a list item
            if (para.match(/^[\s]*[-*•][\s]/)) {
                return `<ul>${para.split(/\n/).map(item => {
                    const listItem = item.replace(/^[\s]*[-*•][\s]/, '');
                    return `<li>${listItem}</li>`;
                }).join('')}</ul>`;
            }

            // Check if this is a numbered list
            if (para.match(/^[\s]*\d+\.[\s]/)) {
                return `<ol>${para.split(/\n/).map(item => {
                    const listItem = item.replace(/^[\s]*\d+\.[\s]/, '');
                    return `<li>${listItem}</li>`;
                }).join('')}</ol>`;
            }

            // Check if this is a heading
            if (para.startsWith('# ')) {
                return `<h3>${para.substring(2)}</h3>`;
            }

            if (para.startsWith('## ')) {
                return `<h4>${para.substring(3)}</h4>`;
            }

            // Check for tip boxes
            if (para.toLowerCase().startsWith('tip:') || para.toLowerCase().startsWith('💡 tip:')) {
                return `<div class="tip">${para}</div>`;
            }

            // Check for warning boxes
            if (para.toLowerCase().startsWith('warning:') || para.toLowerCase().startsWith('⚠️ warning:')) {
                return `<div class="warning">${para}</div>`;
            }

            // Regular paragraph
            return `<p>${para.replace(/\n/g, '<br>')}</p>`;
        })
        .join('');

    // Add bold and italic styling
    return formattedParagraphs
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        .replace(/_(.*?)_/g, '<em>$1</em>');
}

// API Interaction

/**
 * Prepares the prompt based on action type
 * @param {string} actionType - The type of AI action to perform
 * @param {string} titleInput - The post title
 * @param {string} messageContent - The post content
 * @param {string} [customPrompt] - Optional custom prompt from the user
 * @returns {string} The formatted prompt
 */
function preparePrompt(actionType, titleInput, messageContent, customPrompt = '') {
    const formattingInstructions = `Use markdown formatting to make your response readable:
- Use **bold** or __bold__ for emphasis
- Use *italic* or _italic_ for subtle emphasis
- Use bullet points (- or *) for lists
- Use numbered lists (1., 2., etc.) when appropriate
- Start paragraphs with "Tip:" or "Warning:" for special callouts
Organize your response with clear sections and good spacing.`;

    const prompts = {
        improve: `Improve the following post content. Make it more engaging, clear, and well-structured:

Title: ${titleInput}
Content: ${messageContent}

${formattingInstructions}`,

        ideas: `Generate 3-5 post ideas related to the following topic (or general ideas if no topic provided):
${titleInput || messageContent || 'General forum post ideas'}

${formattingInstructions}
For each idea, provide a title and a brief description.`,

        expand: `Expand the following post with more details, examples, and supporting points:

Title: ${titleInput}
Content: ${messageContent}

${formattingInstructions}`,

        summarize: `Make the following post more concise while preserving the key points:

Title: ${titleInput}
Content: ${messageContent}

${formattingInstructions}`,

        default: `Help improve the following forum post:

Title: ${titleInput}
Content: ${messageContent}

${formattingInstructions}`
    };

    // Use custom prompt if provided for 'custom' action type
    if (actionType === 'custom' && customPrompt) {
        return `${customPrompt}

Context:
Title: ${titleInput}
Content: ${messageContent}

${formattingInstructions}`;
    }

    return prompts[actionType] || prompts.default;
}

/**
 * Makes the API request to the Gemini AI service
 * @param {string} prompt - The prompt to send to the AI
 * @returns {Promise<string>} The AI response
 */
async function makeApiRequest(prompt) {
    // Add API key as query parameter for Gemini
    const apiUrl = `${AI_CONFIG.API_URL}?key=${AI_CONFIG.API_KEY}`;

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        { text: prompt }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 10000,
                topK: 40,
                topP: 0.95
            }
        })
    });

    if (!response.ok) {
        // Create more user-friendly error messages based on status codes
        const errorMessages = {
            400: "Bad request: The prompt may be too long or contain invalid content",
            401: "Authentication error: Please check API key settings",
            403: "Access forbidden: The API key doesn't have permission for this request",
            429: "Too many requests: API quota exceeded, please try again later",
            500: "Server error: The AI service is currently unavailable",
            502: "Server error: The AI service is currently unavailable",
            503: "Server error: The AI service is currently unavailable",
            504: "Server error: The AI service is currently unavailable"
        };

        throw new Error(errorMessages[response.status] || `API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Extract text from Gemini response format
    if (data.candidates && data.candidates.length > 0 &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts.length > 0) {
        return data.candidates[0].content.parts[0].text;
    } else {
        throw new Error("Invalid response format from Gemini API");
    }
}

/**
 * Handles errors in the AI assist process
 * @param {Error} error - The error that occurred
 */
function handleAiError(error) {
    console.error('AI assist error:', error);

    const container = document.getElementById('aiResponseContainer');
    if (!container) return;

    container.className = 'ai-response error';

    const contentWrapper = container.querySelector('.ai-response-content');
    if (contentWrapper) {
        contentWrapper.innerHTML = `<p>Error: ${error.message || 'Failed to get AI assistance'}</p>`;
    } else {
        // Fallback if content wrapper doesn't exist
        container.innerHTML = '';

        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'ai-response-close';
        closeButton.innerHTML = '×';
        closeButton.setAttribute('aria-label', 'Close');
        closeButton.addEventListener('click', () => container.remove());
        container.appendChild(closeButton);

        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'ai-response-content';
        errorDiv.innerHTML = `<p>Error: ${error.message || 'Failed to get AI assistance'}</p>`;
        container.appendChild(errorDiv);
    }

    showAlert('Failed to get AI assistance', 'error');
}

/**
 * Handles the AI action request
 * @param {string} actionType - The type of AI action (e.g., 'improve', 'ideas', 'custom')
 * @param {string} [customPrompt] - Optional custom prompt from the user
 */
export async function handleAiAction(actionType, customPrompt = '') { // Note: Function name changed here as per replace block's intent
    const titleInput = document.getElementById('titleInput').value;
    const messageContent = getEditorContent() || document.getElementById('messageInput').value;

    // Hide options menu
    document.getElementById('aiAssistOptions').style.display = 'none';

    // Validate input for certain action types
    if (['improve', 'expand', 'summarize'].includes(actionType) && !messageContent.trim()) {
        showAlert('Please enter some content in your post first', 'error');
        return;
    }

    // Show loading indicator
    showLoading();

    try {
        // Prepare the prompt based on action type, passing the custom prompt if available
        const prompt = preparePrompt(actionType, titleInput, messageContent, customPrompt);

        // Validate prompt for custom actions
        if (actionType === 'custom' && !customPrompt) {
            showAlert('Please enter your custom request in the text field.', 'warning');
            return;
        }

        // Make API request (moved from below)
        const aiResponse = await makeApiRequest(prompt);

        // Process and display response
        processResponse(aiResponse, actionType);
    } catch (error) {
        handleAiError(error);
    }
}

/**
 * Initializes the AI post assistant
 */
export function initAiPostAssistant() {
    const aiAssistButton = document.getElementById('aiAssistButton');
    const aiAssistOptions = document.getElementById('aiAssistOptions');

    if (aiAssistButton && aiAssistOptions) {
        // Setup button click handler
        aiAssistButton.addEventListener('click', toggleAiAssistOptions);

    // Add event listeners to AI assist option buttons
    const optionsMenu = document.getElementById('aiAssistOptions');
    const customInput = document.getElementById('aiCustomInput');
    const customSubmit = document.getElementById('aiCustomSubmit');

    optionsMenu.addEventListener('click', (event) => {
        // Handle clicks on predefined buttons
        if (event.target.tagName === 'BUTTON' && event.target.dataset.type) {
            handleAiAction(event.target.dataset.type); // Note: Function name changed here as per replace block's intent
            optionsMenu.style.display = 'none'; // Hide menu after selection
        }
        // Prevent clicks inside the custom input container from closing the menu
        if (event.target.closest('.ai-custom-input-container')) {
            event.stopPropagation();
        }
    });

    // Listener for the custom submit button
    customSubmit.addEventListener('click', () => {
        const customPrompt = customInput.value.trim();
        if (customPrompt) {
            handleAiAction('custom', customPrompt); // Note: Function name changed here as per replace block's intent
            optionsMenu.style.display = 'none'; // Hide menu after submission
            customInput.value = ''; // Clear input
        }
    });

    // Optional: Listener for Enter key in the custom input
    customInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default form submission if any
            customSubmit.click(); // Trigger the submit button click
        }
    });

        // Setup click outside handler
        setupClickOutside();
    }
}

// Make initialization function available globally
window.initAiPostAssistant = initAiPostAssistant;