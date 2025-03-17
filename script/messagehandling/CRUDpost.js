import { db, storage, isAdmin } from "../../mainalt.js";
import { dbConfig } from "../../config.js";
import { showAlert } from "../alert/alert.js";
import { sanitizeText } from "../santizeText/sanitize.js";
import { showMessages} from "./viewmsg.js"
export function editPost(messageId) {
    const newText = prompt("Enter the new text for the post:");
    if (newText === null || newText.trim() === '') return;

    const messageRef = db.ref(`${dbConfig.messagesPath}/${messageId}`);
    messageRef.update({
        text: newText
    }).then(() => {
        showAlert('Post updated successfully!', 'success');
        if (isAdmin()) {
          showMessages()
        }
    }).catch((error) => {
        console.error('Failed to update post:', error);
        showAlert('Failed to update post.', 'error');
    });
}
window.editPost = editPost;
// Function to delete a post
export function deletePost(messageId) {
    const confirmDelete = confirm("Are you sure you want to delete this post?");
    if (!confirmDelete) return;

    const messageRef = db.ref(`${dbConfig.messagesPath}/${messageId}`);
    messageRef.remove().then(() => {
        showAlert('Post deleted successfully!', 'success');
        if (isAdmin()) {
            setTimeout(() => {
                window.location.href = '#messagesContainer';
                location.reload();
            }, 1000);
        }
    }).catch((error) => {
        console.error('Failed to delete post:', error);
        showAlert('Failed to delete post.', 'error');
    });
}
window.deletePost = deletePost;
export function toggleLike(messageId) {
    
    const user = firebase.auth().currentUser;
    if (!user) {
        showAlert("User not authenticated.", "error");
        return;
    }

    const messageRef = db.ref(`${dbConfig.messagesPath}/${messageId}`);
    messageRef.transaction((message) => {
        if (message) {
            if (!message.likes) {
                message.likes = 0;
            }
            if (!message.likedBy) {
                message.likedBy = {};
            }

            if (message.likedBy[user.uid]) {
                message.likes -= 1;
                delete message.likedBy[user.uid];
                // Remove liked class from button
                const likeButton = document.querySelector(`button[onclick="toggleLike('${messageId}')"]`);
                if (likeButton) {
                    likeButton.classList.remove('liked');
                    likeButton.classList.remove('liked-animation');
                }
            } else {
                message.likes += 1;
                message.likedBy[user.uid] = true;
                // Add liked class to button
                const likeButton = document.querySelector(`button[onclick="toggleLike('${messageId}')"]`);
                if (likeButton) {
                    likeButton.classList.add('liked');
                    likeButton.classList.add('liked-animation');
                }
            }
        }
        return message;
    });

}

window.toggleLike = toggleLike;
