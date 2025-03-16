import { db, storage, isAdmin } from "../../mainalt.js";
import { dbConfig } from "../../config.js";
import { showAlert } from "../alert/alert.js";
import { sanitizeText } from "../santizeText/sanitize.js";
export function showReplyForm(messageId) {
    let replyForm = document.getElementById(`reply-form-${messageId}`);
    // If the form already exists, simply toggle its visibility
    if (replyForm) {
        replyForm.style.display = replyForm.style.display === 'none' ? 'block' : 'none';
    } else {
        // Create a reply form container
        replyForm = document.createElement('div');
        replyForm.id = `reply-form-${messageId}`;
        replyForm.style.marginTop = '10px';
        replyForm.style.padding = '10px';
        replyForm.style.backgroundColor = '#2e2e2e';
        replyForm.style.borderRadius = '5px';
        replyForm.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        
        // Set inner HTML with a textarea and two buttons
        replyForm.innerHTML = `
            <textarea id="reply-text-${messageId}" placeholder="Enter your reply..." 
                style="width: 100%; height: 50px; margin-bottom: 5px; padding: 5px; border-radius: 3px; border: 1px solid #444; background-color: #1e1e1e; color: #fff;"></textarea>
            <br>
            <button onclick="submitReply('${messageId}')" style="margin-right: 5px;">Submit Reply</button>
            <button onclick="hideReplyForm('${messageId}')" style="color: red;">Cancel</button>
        `;

        // Append the reply form above the replies container instead of at the bottom
        const messageElement = document.querySelector(`li[data-id="${messageId}"]`);
        if (messageElement) {
            const repliesContainer = messageElement.querySelector('.replies');
            if (repliesContainer) {
                messageElement.insertBefore(replyForm, repliesContainer);
            } else {
                // If no replies container, insert at the top of the message element
                messageElement.insertBefore(replyForm, messageElement.firstChild);
            }
        } else {
            console.error(`Message element with data-id="${messageId}" not found.`);
        }
    }
}

export function hideReplyForm(messageId) {
    const replyForm = document.getElementById(`reply-form-${messageId}`);
    if (replyForm) {
        replyForm.remove(); // Remove the form from the DOM entirely
    }
}
window.hideReplyForm = hideReplyForm;
export function submitReply(messageId) {
    const replyTextArea = document.getElementById(`reply-text-${messageId}`);
    if (!replyTextArea) return;
    const replyText = replyTextArea.value.trim();
    if (!replyText) {
        showAlert('Hey, Please insert ur reply plz !', 'error');
        return;
    }
    // Reference to the replies node for the given message
    const repliesRef = db.ref(`${dbConfig.messagesPath}/${messageId}/replies`);
    const newReplyRef = repliesRef.push();
    newReplyRef.set({
        text: replyText,
        timestamp: Date.now()
    }).then(() => {
        showAlert('Reply added successfully!', 'success');
        replyTextArea.value = '';  // Clear the textarea
        hideReplyForm(messageId);  // Hide the form after submission
    }).catch((error) => {
        console.error('Failed to add reply:', error);
        showAlert('Failed to add reply :(', 'error');
    });
}
window.submitReply = submitReply;
// Function to reply to a message
export function replyToMessage(messageId) {

   
    // const replyText = prompt("Enter your reply:");
    // if (replyText === null || replyText.trim() === '') return;

    // const repliesRef = db.ref(`${dbConfig.messagesPath}/${messageId}/replies`);
    // const newReplyRef = repliesRef.push();
    // newReplyRef.set({
    //     text: replyText,
    //     timestamp: Date.now()
    // }).then(() => {
    //     showAlert('Reply added successfully!', 'success');
    //     // showMessages();
    // }).catch((error) => {
    //     console.error('Failed to add reply:', error);
    //     showAlert('Failed to add reply :(', 'error');
    // });
    showReplyForm(messageId);
}
window.replyToMessage = replyToMessage;

export function toggleViewToMessages() {
    const formContainer = document.getElementById('formContainer');
    const viewMessagesContainer = document.getElementById('viewMessagesContainer');
    const sortAscBtn = document.getElementById('sortAscBtn');
    const sortDescBtn = document.getElementById('sortDescBtn');
    const sortMostLikedBtn = document.getElementById('sortMostLikedBtn');
    const dropdowndiv = document.getElementById('dropdown');
    formContainer.style.display = 'none';
    userMessagesList.style.display = 'none';
    viewMessagesContainer.style.display = 'block';
    sortAscBtn.style.display = 'block';
    sortDescBtn.style.display = 'block';
    sortMostLikedBtn.style.display = 'block';
    dropdowndiv.style.display = 'block';

}
window.showReplyForm = showReplyForm;
// Function to load replies for a specific message
// Function to delete a reply
export function deleteReply(messageId, replyId) {
    // Check if user is admin
    if (!isAdmin()) {
        showAlert('Only administrators can delete replies.', 'error');
        return;
    }

    const confirmDelete = confirm("Are you sure you want to delete this reply?");
    if (!confirmDelete) return;

    const replyRef = db.ref(`${dbConfig.messagesPath}/${messageId}/replies/${replyId}`);
    replyRef.remove().then(() => {
        showAlert('Reply deleted successfully!', 'success');
    }).catch((error) => {
        console.error('Failed to delete reply:', error);
        showAlert('Failed to delete reply.', 'error');
    });
}
window.deleteReply = deleteReply;

export function loadReplies(messageId) {
    const repliesList = document.getElementById(`replies-${messageId}`);
    if (!repliesList) {
        console.error(`Element with id replies-${messageId} not found.`);
        return;
    }
    repliesList.innerHTML = '';

    const repliesRef = db.ref(`${dbConfig.messagesPath}/${messageId}/replies`);
    repliesRef.on('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const replyId = childSnapshot.key;
            const replyData = childSnapshot.val();
            const replyText = sanitizeText(replyData.text);
            const replyTimestamp = replyData.timestamp;

            const li = document.createElement('li');
            li.style.backgroundColor = "#1e1e1e";
            li.style.color = "#fff";
            li.style.border = "1px solid #333";
            li.style.padding = "10px";
            li.style.marginBottom = "5px";
            li.style.borderRadius = "5px";
            
            // Create a div for reply content
            const contentDiv = document.createElement('div');
            contentDiv.innerHTML = `
                <p>${replyText}</p>
                <span class="timestamp">${new Date(replyTimestamp).toLocaleString()}</span>
            `;
            li.appendChild(contentDiv);
            
            // Add delete button for admins
            if (isAdmin()) {
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.className = 'action-btn admin-btn';
                deleteButton.style.marginTop = '5px';
                deleteButton.style.backgroundColor = '#8b0000';
                deleteButton.style.color = '#fff';
                deleteButton.style.border = 'none';
                deleteButton.style.padding = '5px 10px';
                deleteButton.style.borderRadius = '4px';
                deleteButton.style.cursor = 'pointer';
                deleteButton.onclick = () => deleteReply(messageId, replyId);
                li.appendChild(deleteButton);
            }
            
            repliesList.appendChild(li);
        });
    });
}


