// Script to handle single post view
import { db, storage, isAdmin } from "../mainalt.js";
import { dbConfig } from "../config.js";
import { sanitizeText } from "./santizeText/sanitize.js";
import { loadReplies, replyToMessage } from "./messagehandling/replyhandling.js";
import { toggleLike, editPost, deletePost } from "./messagehandling/CRUDpost.js";

// Make functions available to the window object
window.replyToMessage = replyToMessage;
window.toggleLike = toggleLike;
window.editPost = editPost;
window.deletePost = deletePost;

// Function to get message ID from URL
function getMessageIdFromUrl() {
    // Check if we have a query parameter first (e.g., post.html?id=message123)
    const urlParams = new URLSearchParams(window.location.search);
    const messageId = urlParams.get('id');
    
    // If no query parameter, try the old path method as fallback
    if (!messageId) {
        const path = window.location.pathname;
        const pathId = path.split('/').pop();
        // Ensure we have a valid ID format
        return pathId && pathId !== 'post.html' ? pathId : null;
    }
    
    return messageId;
}

// Function to load a single post
function loadSinglePost() {
    const messageId = getMessageIdFromUrl();
    if (!messageId) {
        showError("No valid post ID found in URL");
        if (document.getElementById('notme')) {
            document.getElementById('notme').style.display = 'none';
        }
        return;
    }

    const loader = document.getElementById('notme');
    if (loader) {
        loader.style.display = 'block';
    }

    const singlePostContainer = document.getElementById('singlePostContainer');
    if (!singlePostContainer) {
        console.error('Single post container not found in the DOM');
        return;
    }

    // Clear any existing content
    singlePostContainer.innerHTML = '';

    // Reference to the specific message in Firebase
    const messageRef = db.ref(`${dbConfig.messagesPath}/${messageId}`);
    
    messageRef.once('value', (snapshot) => {
        if (loader) {
            loader.style.display = 'none';
        }

        if (!snapshot.exists()) {
            showError("Post not found");
            return;
        }

        const message = snapshot.val();
        message.id = messageId; // Add the ID to the message object

        // Update page metadata for better sharing
        updatePageMetadata(message);

        // Create and display the post
        displaySinglePost(message, singlePostContainer);

        // Load replies for this post
        loadReplies(messageId);
    }).catch(error => {
        console.error("Error loading post:", error);
        showError("Error loading post");
    });
}

// Function to display a single post
// Function to display a single post
function displaySinglePost(message, container) {
    const safeTitle = sanitizeText(message.title || 'Legacy Post');
    const safeAdminName = message.adminName ? sanitizeText(message.adminName) : null;
    const safeMessageText = sanitizeText(message.text || 'No text provided');
    const timestamp = message.timestamp;
    const imageUrl = message.imageUrl ? sanitizeText(message.imageUrl) : null;
    const likes = message.likes || 0;
    
    // Check if current user has liked this message
    const user = firebase.auth().currentUser;
    const isLiked = user && message.likedBy && message.likedBy[user.uid];
    const likedClass = isLiked ? 'liked' : '';

    // Create post element
    const postElement = document.createElement('div');
    postElement.className = 'single-post';
    postElement.setAttribute('data-id', message.id);
    postElement.style.backgroundColor = "#1e1e1e";
    postElement.style.padding = "20px";
    postElement.style.border = "1px solid #333";
    postElement.style.borderRadius = "8px";
    postElement.style.marginBottom = "20px";
    postElement.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.5)";

    // Create post content
    postElement.innerHTML = `
        <div class="header">
            ${safeAdminName ? `<div class="admin-badge" style="color: red; margin-bottom: 10px;">Administrator (${safeAdminName})</div>` : ''}
            <h2 class="title" style="font-weight: bold; font-size: 1.5em; margin-bottom: 10px;">${safeTitle}</h2>
            <div class="timestamp" style="color: #888; margin-bottom: 15px;">${new Date(timestamp).toLocaleString()}</div>
        </div>
        <div class="content">
            <p style="color:#ffff; margin-bottom: 15px; line-height: 1.6;">${safeMessageText}</p>
            ${imageUrl ? `<img src="${imageUrl}" alt="Post Image" style="max-width: 100%; height: auto; margin-bottom: 15px; border-radius: 4px;">` : ''}
        </div>
        <div class="actions" style="margin-top: 20px;">
            <button onclick="toggleLike('${message.id}')" class="action-btn ${likedClass}">Like (${likes})</button>
            <button onclick="replyToMessage('${message.id}')" class="action-btn">Reply</button>
            <div class="like-count">${likes} likes</div>
            ${isAdmin() ? `
                <button onclick="editPost('${message.id}')" class="action-btn admin-btn">Edit</button>
                <button onclick="deletePost('${message.id}')" class="action-btn admin-btn">Delete</button>
            ` : ''}
        </div>
        
        <!-- Share buttons -->
        <div class="share-buttons" style="margin-top: 15px;">
            <h3 style="margin-bottom: 10px; font-size: 1.1em;">Share this post:</h3>
            <button onclick="sharePost('${message.id}')" class="share-btn">Copy Link</button>
            <button onclick="shareOnFacebook('${message.id}')" class="share-btn facebook">Facebook</button>
            <button onclick="shareOnTwitter('${message.id}', '${safeTitle}')" class="share-btn twitter">Twitter</button>
        </div>
        
        <h3 style="margin: 20px 0 10px; font-size: 1.2em;">Replies:</h3>
        <ul class="replies" id="replies-${message.id}"></ul>
    `;

    container.appendChild(postElement);

    // Add styles for the share buttons
    const style = document.createElement('style');
    style.textContent = `
        .share-btn {
            background-color: #333;
            color: white;
            border: none;
            padding: 8px 12px;
            margin-right: 8px;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        .share-btn:hover {
            background-color: #444;
        }
        .share-btn.facebook {
            background-color: #3b5998;
        }
        .share-btn.facebook:hover {
            background-color: #4c70ba;
        }
        .share-btn.twitter {
            background-color: #1da1f2;
        }
        .share-btn.twitter:hover {
            background-color: #4db5f5;
        }
        .action-btn {
            background-color: #2c2c2c;
            color: white;
            border: none;
            padding: 8px 12px;
            margin-right: 8px;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        .action-btn:hover {
            background-color: #3c3c3c;
        }
        .admin-btn {
            background-color: #8b0000;
        }
        .admin-btn:hover {
            background-color: #a00000;
        }
    `;
    document.head.appendChild(style);
}

// Function to update page metadata for better sharing
function updatePageMetadata(message) {
    // Update page title
    document.title = `32Chan - ${sanitizeText(message.title || 'Post')}`;
    
    // Update Open Graph meta tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
        ogTitle.setAttribute('content', sanitizeText(message.title || 'Post on 32Chan'));
    }
    
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
        ogDescription.setAttribute('content', sanitizeText(message.text || 'View this post on 32Chan').substring(0, 150) + '...');
    }
    
    // Add image meta tag if the post has an image
    if (message.imageUrl) {
        let ogImage = document.querySelector('meta[property="og:image"]');
        if (!ogImage) {
            ogImage = document.createElement('meta');
            ogImage.setAttribute('property', 'og:image');
            document.head.appendChild(ogImage);
        }
        ogImage.setAttribute('content', sanitizeText(message.imageUrl));
    }
}

// Function to show error message
function showError(message) {
    const container = document.getElementById('singlePostContainer');
    if (container) {
        container.innerHTML = `
            <div class="error-message" style="background-color: #8b0000; color: white; padding: 20px; border-radius: 8px; text-align: center;">
                <h3 style="margin-bottom: 10px;">Error</h3>
                <p>${message}</p>
            </div>
        `;
    }
    
    const loader = document.getElementById('notme');
    if (loader) {
        loader.style.display = 'none';
    }
}

// Share functions
window.sharePost = function(messageId) {
    const postUrl = `${window.location.origin}/post.html?id=${messageId}`;
    navigator.clipboard.writeText(postUrl)
        .then(() => {
            showAlert('Link copied to clipboard!', 'success');
        })
        .catch(err => {
            console.error('Could not copy link: ', err);
            // Fallback for browsers that don't support clipboard API
            const tempInput = document.createElement('input');
            tempInput.value = postUrl;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            showAlert('Link copied to clipboard!', 'success');
        });
};

window.shareOnFacebook = function(messageId) {
    const postUrl = encodeURIComponent(`${window.location.origin}/post.html?id=${messageId}`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${postUrl}`, '_blank');
};

window.shareOnTwitter = function(messageId, title) {
    const postUrl = encodeURIComponent(`${window.location.origin}/post.html?id=${messageId}`);
    const text = encodeURIComponent(`Check out this post on 32Chan: ${title}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${postUrl}`, '_blank');
};

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadSinglePost();
});