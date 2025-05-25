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
        // Clear the stored ID
        localStorage.removeItem('scrollToMessageId');
        
        // Since we're coming from a shared post, make sure we're in message view
        if (document.getElementById('messagesContainer').style.display === 'none') {
            // This will trigger showMessages() which will load the messages
            toggleView();
        }
        
        // Set a flag for when messages finish loading
        window.scrollToMessageAfterLoad = scrollToMessageId;
        
        // Try to scroll after a delay in case messages are already loaded
        setTimeout(() => {
            scrollToMessage(scrollToMessageId);
        }, 1000);
    }
});

// Function to scroll to a specific message by ID
function scrollToMessage(messageId) {
    // Small delay to ensure the DOM is ready
    setTimeout(() => {
        const messageElement = document.querySelector(`li[data-id="${messageId}"]`);
        if (messageElement) {
            // Scroll to the message with some offset
            const yOffset = -100; // Adjust as needed to account for fixed headers
            const y = messageElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
            
            window.scrollTo({top: y, behavior: 'smooth'});
            
            // Highlight the message temporarily
            messageElement.classList.add('highlight-message');
            setTimeout(() => {
                messageElement.classList.remove('highlight-message');
            }, 3000);
        } else {
            // Message not found in current view, might need to load more messages or switch tabs
            console.log('Message not found in current view. Might need additional handling.');
            
            // If you have pagination or lazy loading, you might need to
            // store the ID and check again after more messages load
        }
    }, 500);
}

// Expose the function to the global scope
window.scrollToMessage = scrollToMessage;