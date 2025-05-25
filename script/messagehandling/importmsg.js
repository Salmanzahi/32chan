import { editPost, deletePost, toggleLike }  from "./CRUDpost.js";
import { replyToMessage,  toggleViewToMessages, loadReplies, hideReplyForm, showReplyForm, submitReply} from "./replyhandling.js"
import { sendMessage, resetForm } from "./sendmsg.js"
import { toggleView } from "./toggleview.js";
import {showMessages} from "./viewmsg.js"
import { initSpotify, initSpotifySearchUI, hasValidSpotifyToken, authorizeSpotify } from "../spotify/spotify.js";
import { performAISearch, highlightRelevantText, getScoreColor } from "./aiSearch.js";
// Share post feature has been removed
// import { shareMessage } from "./share.js";





window.toggleView = toggleView;
window.toggleLike = toggleLike;
window.shareMessage = shareMessage;
window.deletePost = deletePost;
window.editPost = editPost;
window.submitReply = submitReply;
window.replyToMessage = replyToMessage;
window.toggleViewToMessages = toggleViewToMessages;
window.loadReplies = loadReplies;
window.hideReplyForm = hideReplyForm;
window.sendMessage = sendMessage;
window.resetForm = resetForm;
window.showMessages = showMessages;
window.showReplyForm = showReplyForm;

// Function to update Spotify button based on auth status
function updateSpotifyAuthButton() {
    const authButton = document.getElementById('spotifyAuthBtn');
    if (!authButton) return;

    if (hasValidSpotifyToken()) {
        authButton.textContent = 'Spotify Authenticated';
        authButton.disabled = true;
        // Optionally, add a class to style it as authenticated
        authButton.classList.add('spotify-authenticated');
    } else {
        authButton.textContent = 'Connect to Spotify';
        authButton.disabled = false;
        authButton.onclick = authorizeSpotify; // Ensure it calls authorizeSpotify when clicked
        authButton.classList.remove('spotify-authenticated');
    }
}

// Initialize Spotify functionality when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Spotify authentication
    initSpotify();

    // Initialize Spotify search UI in the message form
    initSpotifySearchUI();

    // Update the Spotify auth button status
    updateSpotifyAuthButton();
});

document.addEventListener('DOMContentLoaded', function() {
    // Check if we need to scroll to a specific message (coming back from shared post)
    const scrollToMessageId = localStorage.getItem('scrollToMessageId');
    if (scrollToMessageId) {
        console.log(`Found scrollToMessageId in localStorage: ${scrollToMessageId}`);

        // Don't clear the stored ID immediately - let the tab system handle it
        // localStorage.removeItem('scrollToMessageId');

        // Set a flag for when messages finish loading
        window.scrollToMessageAfterLoad = scrollToMessageId;

        // Wait for the tab system to switch views, then try scrolling
        setTimeout(() => {
            console.log('Attempting initial scroll after tab switch...');
            scrollToMessage(scrollToMessageId);
        }, 2000); // Increased delay to allow for tab switching and message loading
    }
});

// Function to scroll to a specific message by ID
function scrollToMessage(messageId) {
    console.log(`Attempting to scroll to message: ${messageId}`);

    // Function to attempt scrolling
    function attemptScroll(retryCount = 0) {
        const maxRetries = 10;
        const retryDelay = 500;

        // Look for the message element in both main messages and user post history
        let messageElement = document.querySelector(`#messagesList li[data-id="${messageId}"]`);

        // If not found in main messages, check user post history
        if (!messageElement) {
            messageElement = document.querySelector(`#userMessagesList li[data-id="${messageId}"]`);
        }

        if (messageElement) {
            console.log(`Found message element for ID: ${messageId}`);

            // Ensure the message is visible (in case it's in a hidden container)
            const messagesContainer = document.getElementById('messagesContainer');
            const formContainer = document.getElementById('formContainer');

            // If message is in main messages list, make sure messages container is visible
            if (messageElement.closest('#messagesList') && messagesContainer) {
                if (messagesContainer.style.display === 'none') {
                    // Switch to messages view if needed
                    if (typeof switchTab === 'function') {
                        switchTab('messages');
                    } else if (typeof toggleView === 'function') {
                        toggleView();
                    }
                }
            }

            // If message is in user post history, make sure form container is visible
            if (messageElement.closest('#userMessagesList') && formContainer) {
                if (formContainer.style.display === 'none') {
                    // Switch to create post tab if needed
                    if (typeof switchTab === 'function') {
                        switchTab('createPost');
                    }
                }
            }

            // Wait a bit for any view transitions to complete
            setTimeout(() => {
                // Scroll to the message with some offset
                const yOffset = -100; // Adjust as needed to account for fixed headers
                const rect = messageElement.getBoundingClientRect();
                const y = rect.top + window.pageYOffset + yOffset;

                window.scrollTo({top: y, behavior: 'smooth'});

                // Highlight the message temporarily
                messageElement.classList.add('highlight-message');
                setTimeout(() => {
                    messageElement.classList.remove('highlight-message');
                }, 3000);

                console.log(`Successfully scrolled to message: ${messageId}`);
            }, 300);

        } else if (retryCount < maxRetries) {
            console.log(`Message not found, retrying... (${retryCount + 1}/${maxRetries})`);

            // If lazy loading is enabled, try to load more messages
            if (typeof loadMoreMessages === 'function' && retryCount < 3) {
                console.log('Trying to load more messages...');
                loadMoreMessages((success) => {
                    if (success) {
                        console.log('More messages loaded, retrying scroll...');
                        // Messages were loaded, retry immediately
                        setTimeout(() => {
                            attemptScroll(retryCount + 1);
                        }, 200);
                    } else {
                        console.log('No more messages to load, retrying with delay...');
                        // No more messages to load, retry with normal delay
                        setTimeout(() => {
                            attemptScroll(retryCount + 1);
                        }, retryDelay);
                    }
                });
            } else {
                console.log(`Retrying scroll attempt ${retryCount + 1}/${maxRetries}...`);
                // Retry after delay
                setTimeout(() => {
                    attemptScroll(retryCount + 1);
                }, retryDelay);
            }
        } else {
            console.log(`Message with ID ${messageId} not found after ${maxRetries} attempts.`);

            // Show a user-friendly message
            if (typeof showAlert === 'function') {
                showAlert('The post you\'re looking for might have been deleted or is not currently loaded.', 'info');
            }
        }
    }

    // Start the scroll attempt with a small initial delay
    setTimeout(() => {
        attemptScroll();
    }, 100);
}

// Expose the function to the global scope
window.scrollToMessage = scrollToMessage;

// Debug function to test scroll functionality manually
window.testScrollToMessage = function(messageId) {
    console.log(`Manual test: Attempting to scroll to message ${messageId}`);
    if (messageId) {
        scrollToMessage(messageId);
    } else {
        console.log('Please provide a message ID. Usage: testScrollToMessage("your-message-id")');
    }
};

// Debug function to simulate coming back from shared post
window.simulateReturnFromShare = function(messageId) {
    console.log(`Simulating return from shared post with message ID: ${messageId}`);
    localStorage.setItem('scrollToMessageId', messageId);
    localStorage.setItem('showMessagesView', 'true');
    window.location.reload();
};

// Listen for custom events that indicate messages have been loaded
document.addEventListener('messagesLoaded', function(event) {
    const scrollToMessageId = localStorage.getItem('scrollToMessageId') || window.scrollToMessageAfterLoad;
    if (scrollToMessageId) {
        console.log('Messages loaded event received, attempting scroll...');
        setTimeout(() => {
            scrollToMessage(scrollToMessageId);
        }, 500);
    }
});

// Also listen for when the messages container becomes visible
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const target = mutation.target;
            if (target.id === 'messagesContainer' && target.style.display !== 'none') {
                const scrollToMessageId = localStorage.getItem('scrollToMessageId') || window.scrollToMessageAfterLoad;
                if (scrollToMessageId) {
                    console.log('Messages container became visible, attempting scroll...');
                    setTimeout(() => {
                        scrollToMessage(scrollToMessageId);
                    }, 1000);
                }
            }
        }
    });
});

// Start observing the messages container when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
        observer.observe(messagesContainer, { attributes: true, attributeFilter: ['style'] });
    }
});