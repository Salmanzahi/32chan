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
function createApplyButton(content, container, isIndonesian = false) {
    const applyButton = document.createElement('button');
    applyButton.textContent = isIndonesian ? 'Terapkan ke Postingan' : 'Apply to Post';
    applyButton.className = 'submit-btn';

    applyButton.addEventListener('click', () => {
        const plainText = stripHtml(content);
        setEditorContent(plainText);
        container.remove();
        const successMessage = isIndonesian ?
            'Saran AI telah diterapkan ke postingan Anda' :
            'AI suggestion applied to your post';
        showAlert(successMessage, 'success');
    });

    return applyButton;
}



/**
 * Processes and displays the AI response
 * @param {string} response - The AI response text
 * @param {string} actionType - The type of AI action performed
 * @param {boolean} isIndonesian - Whether the response should be in Indonesian
 */
function processResponse(response, actionType, isIndonesian = false) {
    const container = document.getElementById('aiResponseContainer');
    if (!container) return;

    const contentWrapper = container.querySelector('.ai-response-content') || container;
    contentWrapper.innerHTML = '';

    try {
        // Parse the response if it's JSON
        let responseContent = parseResponseContent(response);

        // Display the response content
        contentWrapper.innerHTML = formatResponseText(responseContent);

        // Create apply button for certain action types
        if (['improve', 'expand', 'summarize'].includes(actionType)) {
            contentWrapper.appendChild(createApplyButton(responseContent, container, isIndonesian));
        }
    } catch (error) {
        const errorMessage = isIndonesian ?
            `Kesalahan memproses respons AI: ${error.message}` :
            `Error processing AI response: ${error.message}`;
        contentWrapper.innerHTML = `<p>${errorMessage}</p>`;
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

// Language Detection

/**
 * Detects if the text is primarily in Indonesian language
 * @param {string} text - The text to analyze
 * @returns {boolean} True if the text appears to be in Indonesian
 */
function detectIndonesian(text) {
    if (!text || text.trim().length === 0) return false;

    // Common Indonesian words and patterns
    const indonesianWords = [
        // Common words
        'dan', 'atau', 'yang', 'ini', 'itu', 'adalah', 'dengan', 'untuk', 'dari', 'ke', 'di', 'pada', 'akan', 'sudah', 'telah', 'dapat', 'bisa', 'tidak', 'juga', 'saya', 'kamu', 'dia', 'mereka', 'kita', 'kami',
        // Pronouns
        'aku', 'gue', 'gw', 'lo', 'lu', 'dia', 'beliau', 'mereka',
        // Common verbs
        'makan', 'minum', 'pergi', 'datang', 'lihat', 'dengar', 'bicara', 'kerja', 'belajar', 'main', 'tidur', 'bangun',
        // Common adjectives
        'bagus', 'jelek', 'besar', 'kecil', 'tinggi', 'rendah', 'panjang', 'pendek', 'lebar', 'sempit',
        // Time words
        'hari', 'minggu', 'bulan', 'tahun', 'jam', 'menit', 'detik', 'pagi', 'siang', 'sore', 'malam',
        // Question words
        'apa', 'siapa', 'dimana', 'kapan', 'mengapa', 'kenapa', 'bagaimana', 'gimana',
        // Common expressions
        'selamat', 'terima', 'kasih', 'maaf', 'permisi', 'tolong', 'silakan', 'mohon'
    ];

    // Indonesian-specific patterns
    const indonesianPatterns = [
        /\b(me|ber|ter|pe|per|se)\w+/gi,  // Indonesian prefixes
        /\w+(kan|an|nya|lah|kah)\b/gi,    // Indonesian suffixes
        /\b\w+nya\b/gi,                   // -nya suffix
        /\bdi\s+\w+/gi,                   // "di" preposition
        /\bke\s+\w+/gi,                   // "ke" preposition
    ];

    const words = text.toLowerCase().split(/\s+/);
    let indonesianScore = 0;
    let totalWords = words.length;

    // Check for Indonesian words
    words.forEach(word => {
        // Remove punctuation for checking
        const cleanWord = word.replace(/[^\w]/g, '');
        if (indonesianWords.includes(cleanWord)) {
            indonesianScore += 2; // Higher weight for exact matches
        }
    });

    // Check for Indonesian patterns
    indonesianPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            indonesianScore += matches.length;
        }
    });

    // Calculate percentage
    const percentage = (indonesianScore / totalWords) * 100;

    // Consider it Indonesian if score is above threshold
    return percentage > 15; // Adjust threshold as needed
}

/**
 * Determines the appropriate language for AI response
 * @param {string} titleInput - The post title
 * @param {string} messageContent - The post content
 * @returns {string} Language code ('id' for Indonesian, 'en' for English)
 */
function detectLanguage(titleInput, messageContent) {
    const combinedText = `${titleInput} ${messageContent}`.trim();

    if (detectIndonesian(combinedText)) {
        return 'id'; // Indonesian
    }

    return 'en'; // Default to English
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
    // Detect the language of the input
    const detectedLanguage = detectLanguage(titleInput, messageContent);
    const isIndonesian = detectedLanguage === 'id';

    // Language-specific formatting instructions
    const formattingInstructions = isIndonesian ?
        `Gunakan format markdown untuk membuat respons yang mudah dibaca:
- Gunakan **tebal** atau __tebal__ untuk penekanan
- Gunakan *miring* atau _miring_ untuk penekanan halus
- Gunakan poin-poin (- atau *) untuk daftar
- Gunakan daftar bernomor (1., 2., dll.) jika diperlukan
- Mulai paragraf dengan "Tips:" atau "Peringatan:" untuk catatan khusus
Atur respons Anda dengan bagian yang jelas dan spasi yang baik.` :
        `Use markdown formatting to make your response readable:
- Use **bold** or __bold__ for emphasis
- Use *italic* or _italic_ for subtle emphasis
- Use bullet points (- or *) for lists
- Use numbered lists (1., 2., etc.) when appropriate
- Start paragraphs with "Tip:" or "Warning:" for special callouts
Organize your response with clear sections and good spacing.`;

    // Language instruction for AI
    const languageInstruction = isIndonesian ?
        `PENTING: Respons harus dalam Bahasa Indonesia yang natural dan mudah dipahami.` :
        `IMPORTANT: Respond in English.`;

    const prompts = isIndonesian ? {
        improve: `Perbaiki konten postingan berikut. Buat lebih menarik, jelas, dan terstruktur dengan baik:

Judul: ${titleInput}
Konten: ${messageContent}

${languageInstruction}
${formattingInstructions}`,

        ideas: `Buatkan ide-ide postingan yang berkaitan dengan topik berikut (atau ide umum jika tidak ada topik yang diberikan):
${titleInput || messageContent || 'Ide postingan forum umum'}

${languageInstruction}
${formattingInstructions}
Berikan ide-ide kreatif dan menarik dengan judul dan deskripsi singkat.`,

        expand: `Kembangkan postingan berikut dengan lebih detail, contoh, dan poin-poin pendukung:

Judul: ${titleInput}
Konten: ${messageContent}

${languageInstruction}
${formattingInstructions}`,

        summarize: `Buat postingan berikut lebih ringkas sambil mempertahankan poin-poin utama:

Judul: ${titleInput}
Konten: ${messageContent}

${languageInstruction}
${formattingInstructions}`,

        default: `Bantu perbaiki postingan forum berikut:

Judul: ${titleInput}
Konten: ${messageContent}

${languageInstruction}
${formattingInstructions}`
    } : {
        improve: `Improve the following post content. Make it more engaging, clear, and well-structured:

Title: ${titleInput}
Content: ${messageContent}

${languageInstruction}
${formattingInstructions}`,

        ideas: `Generate post ideas related to the following topic (or general ideas if no topic provided):
${titleInput || messageContent || 'General forum post ideas'}

${languageInstruction}
${formattingInstructions}
Provide creative and engaging post ideas with titles and brief descriptions.`,

        expand: `Expand the following post with more details, examples, and supporting points:

Title: ${titleInput}
Content: ${messageContent}

${languageInstruction}
${formattingInstructions}`,

        summarize: `Make the following post more concise while preserving the key points:

Title: ${titleInput}
Content: ${messageContent}

${languageInstruction}
${formattingInstructions}`,

        default: `Help improve the following forum post:

Title: ${titleInput}
Content: ${messageContent}

${languageInstruction}
${formattingInstructions}`
    };

    // Use custom prompt if provided for 'custom' action type
    if (actionType === 'custom' && customPrompt) {
        const contextLabel = isIndonesian ? 'Konteks:' : 'Context:';
        const titleLabel = isIndonesian ? 'Judul:' : 'Title:';
        const contentLabel = isIndonesian ? 'Konten:' : 'Content:';

        return `${customPrompt}

${contextLabel}
${titleLabel} ${titleInput}
${contentLabel} ${messageContent}

${languageInstruction}
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
 * @param {boolean} isIndonesian - Whether to show error in Indonesian
 */
function handleAiError(error, isIndonesian = false) {
    console.error('AI assist error:', error);

    const container = document.getElementById('aiResponseContainer');
    if (!container) return;

    container.className = 'ai-response error';

    const errorPrefix = isIndonesian ? 'Kesalahan:' : 'Error:';
    const defaultErrorMessage = isIndonesian ? 'Gagal mendapatkan bantuan AI' : 'Failed to get AI assistance';
    const errorMessage = `${errorPrefix} ${error.message || defaultErrorMessage}`;

    const contentWrapper = container.querySelector('.ai-response-content');
    if (contentWrapper) {
        contentWrapper.innerHTML = `<p>${errorMessage}</p>`;
    } else {
        // Fallback if content wrapper doesn't exist
        container.innerHTML = '';

        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'ai-response-close';
        closeButton.innerHTML = '×';
        closeButton.setAttribute('aria-label', isIndonesian ? 'Tutup' : 'Close');
        closeButton.addEventListener('click', () => container.remove());
        container.appendChild(closeButton);

        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'ai-response-content';
        errorDiv.innerHTML = `<p>${errorMessage}</p>`;
        container.appendChild(errorDiv);
    }

    const alertMessage = isIndonesian ? 'Gagal mendapatkan bantuan AI' : 'Failed to get AI assistance';
    showAlert(alertMessage, 'error');
}

/**
 * Handles the AI action request
 * @param {string} actionType - The type of AI action (e.g., 'improve', 'ideas', 'custom')
 * @param {string} [customPrompt] - Optional custom prompt from the user
 */
export async function handleAiAction(actionType, customPrompt = '') { // Note: Function name changed here as per replace block's intent
    const titleInput = document.getElementById('titleInput').value;
    const messageContent = getEditorContent() || document.getElementById('messageInput').value;

    // Detect language for user feedback
    const detectedLanguage = detectLanguage(titleInput, messageContent);
    const isIndonesian = detectedLanguage === 'id';

    // Hide options menu
    document.getElementById('aiAssistOptions').style.display = 'none';

    // Validate input for certain action types
    if (['improve', 'expand', 'summarize'].includes(actionType) && !messageContent.trim()) {
        const errorMessage = isIndonesian ?
            'Silakan masukkan konten di postingan Anda terlebih dahulu' :
            'Please enter some content in your post first';
        showAlert(errorMessage, 'error');
        return;
    }

    // Show loading indicator
    showLoading();

    try {
        // Prepare the prompt based on action type, passing the custom prompt if available
        const prompt = preparePrompt(actionType, titleInput, messageContent, customPrompt);

        // Validate prompt for custom actions
        if (actionType === 'custom' && !customPrompt) {
            const warningMessage = isIndonesian ?
                'Silakan masukkan permintaan khusus Anda di kolom teks.' :
                'Please enter your custom request in the text field.';
            showAlert(warningMessage, 'warning');
            return;
        }

        // Make API request (moved from below)
        const aiResponse = await makeApiRequest(prompt);

        // Process and display response
        processResponse(aiResponse, actionType, isIndonesian);
    } catch (error) {
        handleAiError(error, isIndonesian);
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

// Debug function to test language detection
window.testLanguageDetection = function(text) {
    console.log(`Testing language detection for: "${text}"`);
    const isIndonesian = detectIndonesian(text);
    const language = detectLanguage('', text);
    console.log(`Indonesian detected: ${isIndonesian}`);
    console.log(`Language code: ${language}`);
    return { isIndonesian, language };
};