// Rich Text Editor Implementation
let quill; // Global quill instance
let editorConfig; // Store the editor configuration
let currentMode = 'simple'; // Default mode
let isWideMode = false; // Track wide mode state

// Function to load editor configuration from JSON
export async function loadEditorConfig() {
    try {
        const response = await fetch('./config/editor.json');
        editorConfig = await response.json();
        currentMode = editorConfig.defaultMode || 'simple';
        return editorConfig;
    } catch (error) {
        console.error('Error loading editor configuration:', error);
        // Fallback configuration
        return {
            editorModes: {
                simple: {
                    modules: {
                        toolbar: [
                            ['bold', 'italic', 'underline'],
                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                            ['link', 'image']
                        ]
                    },
                    theme: 'snow',
                    placeholder: 'Include all the information someone would need to answer your question or understand your post',
                    height: '200px'
                },
                professional: {
                    modules: {
                        toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline'],
                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                            ['blockquote', 'code-block'],
                            ['link', 'image'],
                            ['clean']
                        ]
                    },
                    theme: 'snow',
                    placeholder: 'Include all the information someone would need to answer your question or understand your post',
                    height: '300px'
                }
            },
            defaultMode: 'simple'
        };
    }
}

// Initialize the editor
export async function initRichTextEditor() {
    // Load configuration
    if (!editorConfig) {
        await loadEditorConfig();
    }
    
    // Find the messageInput textarea
    const messageInput = document.getElementById('messageInput');
    const messageInputContainer = document.getElementById('messageInputContainer');
    
    // If neither exists, create the container
    if (!messageInput && !messageInputContainer) {
        console.error('Message input elements not found');
        return;
    }
    
    // If messageInputContainer doesn't exist but messageInput does, wrap the input
    if (messageInput && !messageInputContainer) {
        const wrapper = document.createElement('div');
        wrapper.id = 'messageInputContainer';
        messageInput.parentNode.insertBefore(wrapper, messageInput);
        wrapper.appendChild(messageInput);
    }
    
    // Get the container (now guaranteed to exist)
    const container = document.getElementById('messageInputContainer');
    container.innerHTML = '';
    
    // Create toggle button container with SVG icons
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'editor-mode-toggle';
    toggleContainer.innerHTML = `
        <div class="toggle-label">Editor Mode:</div>
        <div class="toggle-buttons">
            <button id="simpleEditorBtn" class="${currentMode === 'simple' ? 'active' : ''}" type="button" title="Simple editor with basic formatting">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 7V4h16v3"/>
                    <path d="M9 20h6"/>
                    <path d="M12 4v16"/>
                </svg>
                Simple
            </button>
            <button id="professionalEditorBtn" class="${currentMode === 'professional' ? 'active' : ''}" type="button" title="Professional editor with advanced formatting">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Professional
            </button>
            <button id="wideModeBtn" class="${isWideMode ? 'active' : ''}" type="button" title="Wide mode for full screen editing">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3"/>
                    <path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
                    <path d="M3 16v3a2 2 0 0 0 2 2h3"/>
                    <path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
                </svg>
                Wide Mode
            </button>
        </div>
    `;
    container.appendChild(toggleContainer);
    
    // Create editor container
    const editorContainer = document.createElement('div');
    editorContainer.id = 'editor-container';
    editorContainer.style.height = editorConfig.editorModes[currentMode].height;
    container.appendChild(editorContainer);
    
    // Initialize Quill with current mode configuration
    setTimeout(() => {
        initializeQuill(currentMode);
        
        // Add event listeners for toggle buttons with event prevention
        document.getElementById('simpleEditorBtn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleEditorMode('simple');
            return false;
        });
        
        document.getElementById('professionalEditorBtn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleEditorMode('professional');
            return false;
        });
        
        document.getElementById('wideModeBtn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWideMode();
            return false;
        });
    }, 100);
}

// Function to initialize Quill with specified mode
function initializeQuill(mode) {
    try {
        // Get configuration for the mode
        const config = editorConfig.editorModes[mode];
        if (!config) {
            console.error('Editor configuration not found for mode:', mode);
            return;
        }
        
        // If there's an existing instance, destroy it
        if (quill) {
            try {
                // Save content before destroying
                const content = quill.root.innerHTML;
                
                // Safely remove UI elements
                const toolbar = document.querySelector('.ql-toolbar');
                if (toolbar) toolbar.remove();
                
                const container = document.querySelector('.ql-container');
                if (container) container.remove();
                
                quill = null;
                
                // Recreate editor container
                const editorContainer = document.getElementById('editor-container');
                if (editorContainer) {
                    editorContainer.innerHTML = '';
                    editorContainer.style.height = config.height;
                } else {
                    console.error('Editor container not found, recreating it');
                    // If container is missing, recreate it
                    const messageInputContainer = document.getElementById('messageInputContainer');
                    if (messageInputContainer) {
                        const newEditorContainer = document.createElement('div');
                        newEditorContainer.id = 'editor-container';
                        newEditorContainer.style.height = config.height;
                        messageInputContainer.appendChild(newEditorContainer);
                    } else {
                        console.error('Cannot find or recreate editor container');
                        return;
                    }
                }
            } catch (destroyError) {
                console.error('Error destroying previous Quill instance:', destroyError);
                // Continue with recreation even if cleanup fails
            }
        }
        
        // Check if editor container exists
        const editorContainer = document.getElementById('editor-container');
        if (!editorContainer) {
            console.error('Editor container not found');
            return;
        }
        
        // Ensure config and modules are properly initialized
        if (!config.modules) config.modules = {};
        
        // Add sanitize configuration to ensure only allowed formats are used
        if (!config.modules.clipboard) {
            config.modules.clipboard = {
                // Add allowed tags and attributes
                matchers: [],
                allowed: {
                    tags: [
                        'p', 'br', 'strong', 'em', 'u', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                        'ol', 'ul', 'li', 'code', 'pre', 'img'
                    ],
                    attributes: {
                        'img': ['src', 'alt', 'width', 'height']
                    }
                }
            };
        }
        
        // Create new Quill instance
        try {
            quill = new Quill('#editor-container', {
                modules: config.modules,
                theme: config.theme,
                placeholder: config.placeholder
            });
            
            // Ensure scrollbar is at the top position
            setTimeout(() => {
                if (quill && quill.root) {
                    quill.root.scrollTop = 0;
                }
            }, 0);
            
            if (!quill) {
                throw new Error('Failed to initialize Quill editor');
            }
            
            if (!quill.clipboard) {
                console.warn('Quill clipboard module not available');
            } else {
                // Override paste handler to properly sanitize content
                quill.clipboard.addMatcher(Node.ELEMENT_NODE, function(node, delta) {
                    // Let Quill handle formatting, but make sure only allowed tags are kept
                    const allowedTags = [
                        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'blockquote', 
                        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                        'ol', 'ul', 'li', 'code', 'pre', 'img'
                    ];
                    
                    // If node is not in allowed tags, convert to plain text
                    if (node.tagName && !allowedTags.includes(node.tagName.toLowerCase())) {
                        // Get only the text content
                        return {
                            ops: [{ insert: node.innerText || node.textContent }]
                        };
                    }
                    
                    // Otherwise return it for Quill to handle
                    return delta;
                });
            }
            
            // Get existing textarea or create a hidden input
            let messageInput = document.getElementById('messageInput');
            if (!messageInput) {
                messageInput = document.createElement('textarea');
                messageInput.id = 'messageInput';
                messageInput.style.display = 'none';
                document.getElementById('messageInputContainer').appendChild(messageInput);
            } else if (messageInput.tagName.toLowerCase() !== 'textarea') {
                // If it's not a textarea (likely a hidden input from previous version)
                const parent = messageInput.parentNode;
                const newTextarea = document.createElement('textarea');
                newTextarea.id = 'messageInput';
                newTextarea.style.display = 'none';
                parent.replaceChild(newTextarea, messageInput);
                messageInput = newTextarea;
            }
            
            // Hide the textarea
            messageInput.style.display = 'none';
            
            // Update hidden textarea when content changes
            quill.on('text-change', function() {
                if (quill && quill.root) {
                    const content = quill.root.innerHTML;
                    messageInput.value = content;
                }
            });
            
            // If there was saved content in textarea, use it
            if (messageInput.value) {
                quill.root.innerHTML = messageInput.value;
            }
            
            // Custom image handler to bypass Quill's tooltip
            customizeImageHandler();
            
            // Replace toolbar icons with custom SVG icons if available
            if (editorConfig && editorConfig.icons) {
                // Wait for toolbar to be fully initialized
                setTimeout(() => {
                    replaceToolbarIcons();
                }, 50);
            }
            
            // Reset scroll position to top
            setTimeout(() => {
                if (quill && quill.root) {
                    quill.root.scrollTop = 0;
                    
                    // Also reset scroll for container elements
                    const container = document.querySelector('.ql-container');
                    if (container) container.scrollTop = 0;
                }
            }, 100);
            
            // Remove any tooltips that might appear
            suppressTooltips();
            
            // Fix color picker behavior and positioning
            fixColorPickerPositioning();
            
            // Add click handler to the editor to close any open pickers
            quill.root.addEventListener('click', function() {
                resetPickerStates();
            });
            
        } catch (quillInitError) {
            console.error('Error initializing Quill editor:', quillInitError);
        }
    } catch (error) {
        console.error('Fatal error in initializeQuill:', error);
    }
}

// Custom image handler to bypass Quill's tooltip
function customizeImageHandler() {
    // Get the image button
    const imageBtn = document.querySelector('.ql-image');
    
    if (imageBtn) {
        // Remove default handler
        imageBtn.removeAttribute('data-value');
        
        // Add custom click handler
        imageBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Create a file input
            const fileInput = document.createElement('input');
            fileInput.setAttribute('type', 'file');
            fileInput.setAttribute('accept', 'image/*');
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);
            
            // Trigger click on the file input
            fileInput.click();
            
            // Handle file selection
            fileInput.addEventListener('change', function() {
                if (fileInput.files && fileInput.files[0]) {
                    const file = fileInput.files[0];
                    
                    // Simple file reader to get image as data URL
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const range = quill.getSelection(true);
                        quill.insertEmbed(range.index, 'image', e.target.result);
                        // Clean up
                        document.body.removeChild(fileInput);
                    };
                    reader.readAsDataURL(file);
                }
            });
        });
    }
}

// Suppress all tooltips
function suppressTooltips() {
    // Add a style to hide all tooltips
    const style = document.createElement('style');
    style.textContent = `
        .ql-tooltip {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
        }
    `;
    document.head.appendChild(style);
    
    // Remove any existing tooltips
    document.querySelectorAll('.ql-tooltip').forEach(tooltip => {
        tooltip.parentNode.removeChild(tooltip);
    });
    
    // Observer to remove any new tooltips that might appear
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    if (node.classList && node.classList.contains('ql-tooltip')) {
                        node.parentNode.removeChild(node);
                    }
                });
            }
        });
    });
    
    // Start observing
    observer.observe(document.body, { childList: true, subtree: true });
}

// Replace toolbar icons with custom SVG icons
function replaceToolbarIcons() {
    const icons = editorConfig.icons;
    
    // Replace each icon
    for (const [format, svg] of Object.entries(icons)) {
        const buttons = document.querySelectorAll(`.ql-${format}`);
        buttons.forEach(button => {
            // Only replace if it has an SVG child
            const existingSvg = button.querySelector('svg');
            if (existingSvg) {
                // Create a wrapper to hold the new SVG
                const wrapper = document.createElement('span');
                wrapper.classList.add('custom-icon');
                wrapper.innerHTML = svg;
                
                // Replace the existing SVG with our custom one
                existingSvg.parentNode.replaceChild(wrapper.firstChild, existingSvg);
            }
        });
    }
}

// Function to fix color picker positioning and behavior
function fixColorPickerPositioning() {
    // Wait for DOM to be fully loaded
    setTimeout(() => {
        // Add backdrop for mobile color pickers
        const backdrop = document.createElement('div');
        backdrop.className = 'color-picker-backdrop';
        document.body.appendChild(backdrop);
        
        // Close dropdown when backdrop is clicked
        backdrop.addEventListener('click', () => {
            resetPickerStates();
            backdrop.classList.remove('show');
        });
        
        // Get all pickers
        const allPickers = document.querySelectorAll('.ql-picker');
        let openPicker = null;

        // Add document click handler to close open pickers
        document.addEventListener('click', (e) => {
            // If the click is outside any picker
            if (!e.target.closest('.ql-picker') && !e.target.closest('.mobile-picker-close') && openPicker) {
                // Remove expanded class
                openPicker.classList.remove('ql-expanded');
                openPicker = null;
                backdrop.classList.remove('show');
            }
        });
        
        // Detect if we're on a mobile device
        const isMobile = window.innerWidth <= 768;
        
        allPickers.forEach(picker => {
            // Get the picker label (the clickable part)
            const pickerLabel = picker.querySelector('.ql-picker-label');
            if (!pickerLabel) return;
            
            // Add mobile close button to each picker options
            const pickerOptions = picker.querySelector('.ql-picker-options');
            if (pickerOptions && (picker.classList.contains('ql-color') || picker.classList.contains('ql-background'))) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'mobile-picker-close';
                closeBtn.innerHTML = '×';
                closeBtn.setAttribute('aria-label', 'Close color picker');
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    picker.classList.remove('ql-expanded');
                    backdrop.classList.remove('show');
                    openPicker = null;
                });
                pickerOptions.appendChild(closeBtn);
            }
            
            // Replace the original click handler
            pickerLabel.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent immediate document click handling
                
                const isExpanded = picker.classList.contains('ql-expanded');
                
                // Special handling for color pickers
                const isColorPicker = picker.classList.contains('ql-color') || picker.classList.contains('ql-background');
                
                // Close any open picker first
                if (openPicker && openPicker !== picker) {
                    openPicker.classList.remove('ql-expanded');
                }
                
                // Toggle current picker
                if (!isExpanded) {
                    picker.classList.add('ql-expanded');
                    openPicker = picker;
                    
                    // Show backdrop on mobile for color pickers
                    if (isMobile && isColorPicker) {
                        backdrop.classList.add('show');
                    }
                    
                    // Position the dropdown to prevent overflow
                    const pickerOptions = picker.querySelector('.ql-picker-options');
                    if (pickerOptions) {
                        // Reset position first
                        pickerOptions.style.left = '';
                        pickerOptions.style.right = '';
                        pickerOptions.style.top = '';
                        pickerOptions.style.bottom = '';
                        
                        // Mobile-specific positioning for color pickers
                        if (isMobile && isColorPicker) {
                            pickerOptions.style.top = '50%';
                            pickerOptions.style.transform = 'translate(-50%, -50%)';
                            pickerOptions.style.marginTop = '0';
                        } else {
                            // Desktop positioning - check for overflow
                            setTimeout(() => {
                                const rect = pickerOptions.getBoundingClientRect();
                                
                                // Check for right overflow
                                if (rect.right > window.innerWidth) {
                                    pickerOptions.style.left = 'auto';
                                    pickerOptions.style.right = '0';
                                }
                                
                                // Check for bottom overflow
                                if (rect.bottom > window.innerHeight) {
                                    pickerOptions.style.top = 'auto';
                                    pickerOptions.style.bottom = '100%';
                                }
                            }, 10);
                        }
                    }
                } else {
                    picker.classList.remove('ql-expanded');
                    openPicker = null;
                    backdrop.classList.remove('show');
                }
            });
            
            // For color pickers specifically, add item click handlers to close dropdown
            if (picker.classList.contains('ql-color') || picker.classList.contains('ql-background')) {
                const pickerItems = picker.querySelectorAll('.ql-picker-item');
                pickerItems.forEach(item => {
                    item.addEventListener('click', () => {
                        // Close the picker after a color is selected
                        picker.classList.remove('ql-expanded');
                        backdrop.classList.remove('show');
                        openPicker = null;
                    });
                });
            }
        });
        
        // Special handling for color pickers to ensure they're properly positioned
        const colorPickers = document.querySelectorAll('.ql-color, .ql-background');
        colorPickers.forEach(picker => {
            // Style adjustments to ensure proper display
            picker.style.verticalAlign = 'middle';
            
            // Make sure picker options have proper width
            const pickerOptions = picker.querySelector('.ql-picker-options');
            if (pickerOptions) {
                if (isMobile) {
                    pickerOptions.style.width = '240px';
                    pickerOptions.style.maxWidth = '90vw';
                } else {
                    pickerOptions.style.width = '196px';
                    pickerOptions.style.maxWidth = '196px';
                }
            }
        });
        
        // Add window resize handler to update mobile detection
        window.addEventListener('resize', () => {
            const wasMobile = isMobile;
            const newIsMobile = window.innerWidth <= 768;
            
            // If mobile state changed, reset pickers and update
            if (wasMobile !== newIsMobile) {
                resetPickerStates();
                backdrop.classList.remove('show');
                
                // Handle necessary repositioning
                colorPickers.forEach(picker => {
                    const pickerOptions = picker.querySelector('.ql-picker-options');
                    if (pickerOptions) {
                        // Reset positioning
                        pickerOptions.style.left = '';
                        pickerOptions.style.right = '';
                        pickerOptions.style.top = '';
                        pickerOptions.style.bottom = '';
                        pickerOptions.style.transform = '';
                        
                        // Update width based on new state
                        if (newIsMobile) {
                            pickerOptions.style.width = '240px';
                            pickerOptions.style.maxWidth = '90vw';
                        } else {
                            pickerOptions.style.width = '196px';
                            pickerOptions.style.maxWidth = '196px';
                        }
                    }
                });
            }
        });
        
    }, 300);
}

// Function to reset all picker states
function resetPickerStates() {
    document.querySelectorAll('.ql-picker.ql-expanded').forEach(picker => {
        picker.classList.remove('ql-expanded');
    });
    
    // Hide backdrop
    const backdrop = document.querySelector('.color-picker-backdrop');
    if (backdrop) {
        backdrop.classList.remove('show');
    }
}

// Toggle between editor modes
export function toggleEditorMode(mode) {
    if (mode === currentMode) return;
    
    try {
        console.log('Switching to editor mode:', mode);
        
        // Reset any open picker states
        resetPickerStates();
        
        // Save current content
        let content = '';
        if (quill && quill.root) {
            content = quill.root.innerHTML;
        }
        
        // Update active button
        const simpleBtn = document.getElementById('simpleEditorBtn');
        const professionalBtn = document.getElementById('professionalEditorBtn');
        
        if (simpleBtn) simpleBtn.classList.toggle('active', mode === 'simple');
        if (professionalBtn) professionalBtn.classList.toggle('active', mode === 'professional');
        
        // Check if editor container exists, if not recreate it
        const editorContainer = document.getElementById('editor-container');
        if (!editorContainer) {
            const messageInputContainer = document.getElementById('messageInputContainer');
            if (messageInputContainer) {
                const newEditorContainer = document.createElement('div');
                newEditorContainer.id = 'editor-container';
                newEditorContainer.style.height = editorConfig?.editorModes[mode]?.height || '200px';
                messageInputContainer.appendChild(newEditorContainer);
            }
        }
        
        // Switch mode
        currentMode = mode;
        
        // Reinitialize the editor with the new mode
        setTimeout(() => {
            try {
                initializeQuill(mode);
                
                // Restore content with delay to ensure Quill is fully initialized
                setTimeout(() => {
                    if (quill && quill.root && content) {
                        quill.root.innerHTML = content;
                        
                        // Update the hidden textarea
                        const messageInput = document.getElementById('messageInput');
                        if (messageInput) {
                            messageInput.value = content;
                        }
                    }
                }, 50);
            } catch (error) {
                console.error('Error reinitializing editor:', error);
            }
        }, 50);
    } catch (error) {
        console.error('Error toggling editor mode:', error);
    }
}

// Get editor content
export function getEditorContent() {
    return quill ? quill.root.innerHTML : '';
}

// Set editor content
export function setEditorContent(content) {
    if (quill) {
        quill.root.innerHTML = content || '';
    }
}

// Clear editor content
export function clearEditorContent() {
    if (quill) {
        quill.setText('');
    }
    
    // Also clear the textarea
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.value = '';
    }
}

// Toggle wide mode for full screen editing
export function toggleWideMode() {
    try {
        console.log('Toggling wide mode:', !isWideMode);
        
        // Toggle wide mode state
        isWideMode = !isWideMode;
        
        // Update button state
        const wideModeBtn = document.getElementById('wideModeBtn');
        if (wideModeBtn) {
            wideModeBtn.classList.toggle('active', isWideMode);
        }
        
        // Get the editor container and its parent container
        const editorContainer = document.getElementById('editor-container');
        const messageInputContainer = document.getElementById('messageInputContainer');
        
        if (isWideMode) {
            // Apply wide mode styles
            if (messageInputContainer) {
                messageInputContainer.classList.add('wide-mode-container');
            }
            if (editorContainer) {
                editorContainer.classList.add('wide-mode');
                // Increase height for better editing experience in wide mode
                editorContainer.style.height = '500px';
            }
            // Add overlay to make it feel more like a modal
            const overlay = document.createElement('div');
            overlay.id = 'editor-overlay';
            overlay.className = 'editor-overlay';
            document.body.appendChild(overlay);
            
            // Add close button
            const closeBtn = document.createElement('button');
            closeBtn.id = 'close-wide-mode';
            closeBtn.className = 'close-wide-mode';
            closeBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            `;
            closeBtn.addEventListener('click', toggleWideMode);
            messageInputContainer.appendChild(closeBtn);
            
            // Prevent body scrolling
            document.body.style.overflow = 'hidden';
        } else {
            // Remove wide mode styles
            if (messageInputContainer) {
                messageInputContainer.classList.remove('wide-mode-container');
            }
            if (editorContainer) {
                editorContainer.classList.remove('wide-mode');
                // Restore original height based on current mode
                editorContainer.style.height = editorConfig?.editorModes[currentMode]?.height || '200px';
            }
            // Remove overlay
            const overlay = document.getElementById('editor-overlay');
            if (overlay) {
                document.body.removeChild(overlay);
            }
            // Remove close button
            const closeBtn = document.getElementById('close-wide-mode');
            if (closeBtn) {
                closeBtn.parentNode.removeChild(closeBtn);
            }
            // Restore body scrolling
            document.body.style.overflow = '';
        }
        
        // Refocus the editor
        if (quill) {
            setTimeout(() => {
                quill.focus();
            }, 100);
        }
    } catch (error) {
        console.error('Error toggling wide mode:', error);
    }
}

let editorInitialized = false;
    
function initEditor() {
    if (!editorInitialized) {
        setTimeout(() => {
            initRichTextEditor();
            editorInitialized = true;
        }, 300);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the rich text editor when the form container is shown
    const toggleViewBtn = document.getElementById('toggleViewBtn');
    const formContainer = document.getElementById('formContainer');
    
    if (toggleViewBtn) {
        toggleViewBtn.addEventListener('click', function() {
            if (formContainer && formContainer.style.display === 'block') {
                initEditor();
            }
        });
    }
    
    // Also initialize if the form is already visible (page refresh)
    if (formContainer && formContainer.style.display === 'block') {
        initEditor();
    }
});