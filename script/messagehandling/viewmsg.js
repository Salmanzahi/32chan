import { isAdmin, db, storage } from "../../mainalt.js";
import { adminRoles } from "../../role.js";
import { dbConfig } from "../../config.js";
import { sanitizeText } from "../santizeText/sanitize.js";
import { loadReplies, replyToMessage, showReplyForm } from "./replyhandling.js";

export function showMessages(sortOrder = 'desc') {
    const messagesList = document.getElementById('messagesList');
    const sortButtons = document.querySelectorAll('.buttons button');

    const loader = document.getElementById('notme');
    if (loader) {
        loader.style.display = 'block';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 100);
    }

    if (messagesList) {
        sortButtons.forEach(button => button.classList.remove('active'));
        if (sortOrder === 'asc') {
            document.getElementById('sortAscBtn').classList.add('active');
        } else if (sortOrder === 'desc') {
            document.getElementById('sortDescBtn').classList.add('active');
        } else if (sortOrder === 'mostLiked') {
            document.getElementById('sortMostLikedBtn').classList.add('active');
        }

        const messagesRef = db.ref(dbConfig.messagesPath);
        messagesRef.off('value'); // Detach any existing listener

        messagesRef.on('value', (snapshot) => {
            // Clear the list for every snapshot update
            messagesList.innerHTML = '';

            const messages = [];
            snapshot.forEach((childSnapshot) => {
                const messageData = childSnapshot.val();
                messages.push({ id: childSnapshot.key, ...messageData });
            });

            // Sort messages based on the selected sort order
            if (sortOrder === 'asc') {
                messages.sort((a, b) => a.timestamp - b.timestamp);
            } else if (sortOrder === 'desc') {
                messages.sort((a, b) => b.timestamp - a.timestamp);
            } else if (sortOrder === 'mostLiked') {
                messages.sort((a, b) => (b.likes || 0) - (a.likes || 0));
            }

            // Get current user
            const user = firebase.auth().currentUser;

            // Append sorted messages to the DOM
            messages.forEach((message) => {
                const safeTitle = sanitizeText(message.title || 'Legacy Post');
                const safeAdminName = message.adminName ? sanitizeText(message.adminName) : null;
                const safeMessageText = sanitizeText(message.text || 'No text provided');
                const timestamp = message.timestamp;
                const imageUrl = message.imageUrl ? sanitizeText(message.imageUrl) : null;
                const likes = message.likes || 0;
                
                // Check if current user has liked this message
                const isLiked = user && message.likedBy && message.likedBy[user.uid];
                const likedClass = isLiked ? 'liked' : '';

                // Create message list item
                const li = document.createElement('li');
                li.setAttribute('data-id', message.id);
                li.style.backgroundColor = "#1e1e1e";
                li.style.padding = "15px";
                li.style.border = "1px solid #333";
                li.style.borderRadius = "8px";
                li.style.marginBottom = "10px";
                li.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.5)";
                li.style.transition = "box-shadow 0.3s ease-in-out";

                // Check if profile should be displayed
                const showProfile = message.showProfile;
                const userDisplayName = message.userDisplayName ? sanitizeText(message.userDisplayName) : null;
                const userPhotoURL = message.userPhotoURL ? sanitizeText(message.userPhotoURL) : null;
                
                // Check if the message is from an admin user
                const isUserAdmin = message.userId && adminRoles && adminRoles.admins && adminRoles.admins.includes(message.userId);
                
                li.innerHTML = `
                        <div class="header">
                            ${safeAdminName ? `<div class="admin-badge" style="color: red;">Administrator (${safeAdminName})</div>` : ''}
                            ${showProfile && userDisplayName ? `
                            <div class="message-user-profile">
                                <img src="${userPhotoURL || './images/suscat.jpg'}" alt="User Photo">
                                <div class="user-name">${isUserAdmin ? `<span style="color: red;">${userDisplayName} [ADMIN]</span>` : userDisplayName}</div>
                            </div>` : ''}
                            <div class="title" style="font-weight: bold; font-size: 1.2em;">${safeTitle}</div>
                            <div class="timestamp">${new Date(timestamp).toLocaleString()}</div>
                        </div>
                        <div class="content">
                            <p style="color:#ffff">${safeMessageText}</p>
                            ${imageUrl ? `<img src="${imageUrl}" alt="Message Image" style="max-width: 100%; height: auto;">` : ''}
                            ${message.spotifyTrack ? `
                            <div class="spotify-track-embed">
                                <iframe src="https://open.spotify.com/embed/track/${message.spotifyTrack.id}" 
                                width="100%" height="80" frameborder="0" allowtransparency="true" 
                                allow="encrypted-media"></iframe>
                            </div>` : ''}
                        </div>
                        <div class="actions">
                            <button onclick="toggleLike('${message.id}')" class="action-btn ${likedClass}">Like (${likes})</button>
                            <button onclick="replyToMessage('${message.id}')" class="action-btn">Reply</button>
                            <div class="like-count">${likes} likes</div>
                            ${isAdmin() ? `
                                <button onclick="editPost('${message.id}')" class="action-btn">Edit</button>
                                <button onclick="deletePost('${message.id}')" class="action-btn">Delete</button>
                            ` : ''}
                        </div>
                        <ul class="replies" id="replies-${message.id}"></ul>
                    `;
                messagesList.appendChild(li);

                loadReplies(message.id);
            });
        });
    } else {
        console.error('Messages list element not found in the DOM.');
    }
}

window.showMessages = showMessages;