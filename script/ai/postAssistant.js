import { AI_CONFIG } from '../config/aiConfig.js';
import { showAlert } from '../alert/alert.js';
import { getEditorContent, setEditorContent } from '../richtext/editor.js';

// Toggle the AI assist options dropdown
export function toggleAiAssistOptions() {
    const optionsMenu = document.getElementById('aiAssistOptions');
    if (optionsMenu.style.display === 'none' || !optionsMenu.style.display) {
        optionsMenu.style.display = 'block';
    } else {
        optionsMenu.style.display = 'none';
    }
}

// Hide AI assist dropdown when clicking outside
export function setupClickOutside() {
    document.addEventListener('click', function(event) {
        const optionsMenu = document.getElementById('aiAssistOptions');
        const aiButton = document.getElementById('aiAssistButton');
        
        if (optionsMenu && aiButton) {
            if (!optionsMenu.contains(event.target) && !aiButton.contains(event.target)) {
                optionsMenu.style.display = 'none';
            }
        }
    });
}

// Create a response container to display AI results
function createResponseContainer() {
    // Check if container already exists
    let responseContainer = document.getElementById('aiResponseContainer');
    if (responseContainer) {
        // Reset the container to default state
        responseContainer.innerHTML = '';
        responseContainer.className = 'ai-response';
        return responseContainer;
    }
    
    // Create new container
    responseContainer = document.createElement('div');
    responseContainer.id = 'aiResponseContainer';
    responseContainer.className = 'ai-response';
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'ai-response-close';
    closeButton.innerHTML = '×';
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.addEventListener('click', () => {
        responseContainer.remove();
    });
    
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

// Show loading indicator
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

// Process AI response
function processResponse(response, actionType) {
    const container = document.getElementById('aiResponseContainer');
    if (!container) return;
    
    const contentWrapper = container.querySelector('.ai-response-content') || container;
    contentWrapper.innerHTML = '';
    
    try {
        let responseContent = '';
        
        // Parse the response (if it's JSON)
        if (typeof response === 'string' && response.trim().startsWith('{')) {
            try {
                const parsedResponse = JSON.parse(response);
                responseContent = parsedResponse.content || parsedResponse.text || parsedResponse.response || response;
            } catch (e) {
                responseContent = response;
            }
        } else {
            responseContent = response;
        }
        
        // Format and beautify the text
        responseContent = formatResponseText(responseContent);
        
        // Create apply button for certain action types
        if (['improve', 'expand', 'summarize'].includes(actionType)) {
            contentWrapper.innerHTML = responseContent;
            
            const applyButton = document.createElement('button');
            applyButton.textContent = 'Apply to Post';
            applyButton.className = 'submit-btn';
            
            applyButton.addEventListener('click', () => {
                // Get the raw text without formatting for the editor
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = responseContent;
                const plainText = tempDiv.textContent || tempDiv.innerText || responseContent;
                
                setEditorContent(plainText);
                container.remove();
                showAlert('AI suggestion applied to your post', 'success');
            });
            
            contentWrapper.appendChild(applyButton);
        } else {
            contentWrapper.innerHTML = responseContent;
        }
    } catch (error) {
        contentWrapper.innerHTML = `<p>Error processing AI response: ${error.message}</p>`;
    }
}

// Format response text with enhanced styling
function formatResponseText(text) {
    if (!text) return '<p>No content available</p>';
    
    // Replace newlines with paragraph breaks
    let formatted = text
        .split('\n\n')
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
    formatted = formatted
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        .replace(/_(.*?)_/g, '<em>$1</em>');
    
    return formatted;
}

// Handle AI assist request
export async function handleAiAssist(actionType) {
    const titleInput = document.getElementById('titleInput').value;
    const messageContent = getEditorContent() || document.getElementById('messageInput').value;
    
    // Hide options menu
    document.getElementById('aiAssistOptions').style.display = 'none';
    
    // Validate input
    if (actionType === 'improve' || actionType === 'expand' || actionType === 'summarize') {
        if (!messageContent.trim()) {
            showAlert('Please enter some content in your post first', 'error');
            return;
        }
    }
    
    // Show loading indicator
    showLoading();
    
    // Prepare the prompt based on action type
    let prompt = '';
    const formattingInstructions = `Use markdown formatting to make your response readable:
- Use **bold** or __bold__ for emphasis
- Use *italic* or _italic_ for subtle emphasis
- Use # and ## for headings
- Use bullet points (- or *) for lists
- Use numbered lists (1., 2., etc.) when appropriate
- Start paragraphs with "Tip:" or "Warning:" for special callouts
Organize your response with clear sections and good spacing.`;

    switch (actionType) {
        case 'improve':
            prompt = `Improve the following post content. Make it more engaging, clear, and well-structured:

Title: ${titleInput}
Content: ${messageContent}

${formattingInstructions}`;
            break;
        case 'ideas':
            prompt = `Generate 3-5 post ideas related to the following topic (or general ideas if no topic provided):
${titleInput || messageContent || 'General forum post ideas'}

${formattingInstructions}
For each idea, provide a title and a brief description.`;
            break;
        case 'expand':
            prompt = `Expand the following post with more details, examples, and supporting points:

Title: ${titleInput}
Content: ${messageContent}

${formattingInstructions}`;
            break;
        case 'summarize':
            prompt = `Make the following post more concise while preserving the key points:

Title: ${titleInput}
Content: ${messageContent}

${formattingInstructions}`;
            break;
        default:
            prompt = `Help improve the following forum post:

Title: ${titleInput}
Content: ${messageContent}

${formattingInstructions}`;
    }
    
    try {
        // Make API request
        const response = await fetch(AI_CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_CONFIG.API_KEY}`
            },
            body: JSON.stringify({
                model: AI_CONFIG.MODELS.DEFAULT,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.7,
                stream: false
            })
        });
        
        if (!response.ok) {
            // Create more user-friendly error messages based on status codes
            let errorMessage = `API responded with status: ${response.status}`;
            
            switch (response.status) {
                case 401:
                    errorMessage = "Authentication error: Please check API key settings";
                    break;
                case 403:
                    errorMessage = "Access forbidden: The API key doesn't have permission for this request";
                    break;
                case 429:
                    errorMessage = "Too many requests: Rate limit exceeded, please try again later";
                    break;
                case 500:
                case 502:
                case 503:
                case 504:
                    errorMessage = "Server error: The AI service is currently unavailable";
                    break;
            }
            
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        const aiResponse = data.choices[0].message.content 
            
        // Process and display response
        processResponse(aiResponse, actionType);
    } catch (error) {
        console.error('AI assist error:', error);
        
        const container = document.getElementById('aiResponseContainer');
        if (container) {
            container.className = 'ai-response error';
            
            const contentWrapper = container.querySelector('.ai-response-content');
            if (contentWrapper) {
                contentWrapper.innerHTML = `<p>Error: ${error.message || 'Failed to get AI assistance'}</p>`;
            } else {
                // Fallback if content wrapper doesn't exist
                const closeButton = container.querySelector('.ai-response-close');
                if (closeButton) {
                    // Clear everything after the close button
                    while (container.lastChild !== closeButton) {
                        container.removeChild(container.lastChild);
                    }
                } else {
                    // If no close button, clear everything
                    container.innerHTML = '';
                    
                    // Add close button
                    const newCloseButton = document.createElement('button');
                    newCloseButton.className = 'ai-response-close';
                    newCloseButton.innerHTML = '×';
                    newCloseButton.setAttribute('aria-label', 'Close');
                    newCloseButton.addEventListener('click', () => {
                        container.remove();
                    });
                    container.appendChild(newCloseButton);
                }
                
                // Add error message
                const errorDiv = document.createElement('div');
                errorDiv.className = 'ai-response-content';
                errorDiv.innerHTML = `<p>Error: ${error.message || 'Failed to get AI assistance'}</p>`;
                container.appendChild(errorDiv);
            }
        }
        
        showAlert('Failed to get AI assistance', 'error');
    }
}

// Initialize AI assistant
export function initAiPostAssistant() {
    const aiAssistButton = document.getElementById('aiAssistButton');
    const aiAssistOptions = document.getElementById('aiAssistOptions');
    
    if (aiAssistButton && aiAssistOptions) {
        // Setup button click handler
        aiAssistButton.addEventListener('click', toggleAiAssistOptions);
        
        // Setup option buttons
        const optionButtons = aiAssistOptions.querySelectorAll('button');
        optionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const actionType = button.getAttribute('data-type');
                if (actionType) {
                    handleAiAssist(actionType);
                }
            });
        });
        
        // Setup click outside handler
        setupClickOutside();
    }
}

// Make initialization function available globally
window.initAiPostAssistant = initAiPostAssistant; 