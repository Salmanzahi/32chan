import { getUrlParameter } from "../fetchparam.js";
import { isAdmin, db, storage } from "../mainalt.js";
import { adminRoles } from "../config/role.js";
import { dbConfig } from "../config/config.js";
import { sanitizeText } from "../santizeText/sanitize.js";
import { loadReplies, replyToMessage, showReplyForm } from "./replyhandling.js";
import { showMessages } from "./viewmsg.js";
import { createMessageElement } from "./viewmsg.js";
import { toggleView } from "./toggleview.js";

export function shareMessage(messageId) {
    window.location.href = `../../share.html?id=${messageId}`;
}

export function shareViaWhatsApp(messageId) {
    const shareUrl = `${window.location.origin}/share.html?id=${messageId}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareUrl)}`;
    window.open(whatsappUrl, '_blank');
}

export function goBackToMessage(messageId) {
    // Store the messageId in localStorage to scroll to it after redirect
    if (messageId) {
        localStorage.setItem('scrollToMessageId', messageId);
        // Set flag to show messages container instead of form
        localStorage.setItem('showMessagesView', 'true');
    }
    // Redirect to the main page
    window.location.href = 'sendview.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const roomId = getUrlParameter('id');
    document.getElementById('roomIdDisplay').textContent = roomId;
    
    // Setup back button
    const backButton = document.getElementById('backToMessageBtn');
    if (backButton) {
        backButton.addEventListener('click', () => {
            goBackToMessage(roomId);
        });
    }
    
    loadSharedMessage(roomId);
});


export function loadSharedMessage(messageId) {
    const messageContainer = document.getElementById('sharemsg');
    const id = getUrlParameter('id');
    if (messageContainer) {
        // Clear any existing content
        messageContainer.innerHTML = '';
        
        // Reference to the specific message in Firebase
        const messageRef = db.ref(`${dbConfig.messagesPath}/${messageId}`);
        
        // Use on() instead of once() to listen for real-time updates
        messageRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                const messageData = snapshot.val();
                const message = { id: snapshot.key, ...messageData };
                
                // Get current user for like status
                const user = firebase.auth().currentUser;
                
                // Clear existing content before updating
                messageContainer.innerHTML = '';
                
                // Create the back button header
                const backButtonHeader = document.createElement('div');
                backButtonHeader.className = 'back-button-header';
                backButtonHeader.innerHTML = `
                    <button id="backToMessageBtn" class="back-to-message-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                        </svg>
                        Back to original post
                    </button>
                `;
                messageContainer.appendChild(backButtonHeader);
                
                // Add click event to the back button
                const backButton = backButtonHeader.querySelector('#backToMessageBtn');
                backButton.addEventListener('click', () => {
                    goBackToMessage(message.id);
                });
                
                // Create and append the message element
                const messageElement = createMessageElement(message, user);

                // Add WhatsApp share button
                const whatsappButton = document.createElement('button');
                whatsappButton.className = 'action-btn whatsapp-share';
                whatsappButton.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Share via WhatsApp
                `;
                whatsappButton.onclick = () => shareViaWhatsApp(message.id);
                messageElement.querySelector('.actions').appendChild(whatsappButton);
                
                messageContainer.appendChild(messageElement);
                
                // Load replies for this message
                loadReplies(messageId);
                
                // Set page title to include message title
                if (message.title) {
                    document.title = `Shared: ${sanitizeText(message.title)}`;
                }
            } else {
                // Message not found
                messageContainer.innerHTML = '<div class="bg-gray-900 border border-red-800 text-red-400 px-4 py-3 rounded relative shadow-md" role="alert"><p class="font-medium">Message not found or has been deleted.</p></div>';
            }
        }, (error) => {
            console.error("Error loading shared message:", error);
            messageContainer.innerHTML = '<div class="error-message">Error loading message. Please try again later.</div>';
        });

        // Clean up listener when component unmounts
        // return () => {
        //     messageRef.off();
        // };
    }
}

window.shareMessage = shareMessage;
window.shareViaWhatsApp = shareViaWhatsApp;
window.goBackToMessage = goBackToMessage;
