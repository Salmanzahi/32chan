// Tab Toggle Functionality

/**
 * Switches between the Create Post and Messages tabs
 * @param {string} tabName - The name of the tab to switch to ('createPost' or 'messages')
 */
export function switchTab(tabName) {
    const formContainer = document.getElementById('formContainer');
    const messagesContainer = document.getElementById('messagesContainer');
    const createPostTab = document.getElementById('createPostTab');
    const messagesTab = document.getElementById('messagesTab');
    const userMessagesList = document.getElementById('userMessagesList');
    const sortAscBtn = document.getElementById('sortAscBtn');
    const sortDescBtn = document.getElementById('sortDescBtn');
    const sortMostLikedBtn = document.getElementById('sortMostLikedBtn');
    
    // Reset all tabs
    createPostTab.classList.remove('active');
    messagesTab.classList.remove('active');
    
    if (tabName === 'createPost') {
        // Activate Create Post tab
        createPostTab.classList.add('active');
        formContainer.style.display = 'block';
        messagesContainer.style.display = 'none';
        sortAscBtn.style.display = 'none';
        sortDescBtn.style.display = 'none';
        sortMostLikedBtn.style.display = 'none';
        userMessagesList.style.display = 'block';
    } else if (tabName === 'messages') {
        // Activate Messages tab
        messagesTab.classList.add('active');
        formContainer.style.display = 'none';
        userMessagesList.style.display = 'none';
        messagesContainer.style.display = 'block';
        sortAscBtn.style.display = 'inline-block';
        sortDescBtn.style.display = 'inline-block';
        sortMostLikedBtn.style.display = 'inline-block';
        
        // Load messages when switching to messages tab
        if (typeof showMessages === 'function') {
            showMessages();
        }
    }
}

// Export the function to make it available globally
window.switchTab = switchTab;

// Initialize tabs on page load
document.addEventListener("DOMContentLoaded", function() {
    // Check if we should show messages view based on localStorage flag
    if (localStorage.getItem('showMessagesView') === 'true') {
        // Switch to messages tab
        switchTab('messages');
        // Clear the flag
        localStorage.removeItem('showMessagesView');
    }
});