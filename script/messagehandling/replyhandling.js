import { db, storage, isAdmin } from "../mainalt.js";
import { dbConfig } from "../config/config.js";
import { showAlert } from "../alert/alert.js";
import { sanitizeText } from "../santizeText/sanitize.js";
export function showReplyForm(messageId, targetMessageElement = null) {
    // Create a unique ID for the reply form based on context
    let formId = `reply-form-${messageId}`;
    if (targetMessageElement) {
        // Add a unique identifier based on the parent container
        const isInUserHistory = targetMessageElement.closest('#userMessagesList');
        if (isInUserHistory) {
            formId = `reply-form-user-${messageId}`;
        }
    }

    let replyForm = document.getElementById(formId);
    // If the form already exists, simply toggle its visibility
    if (replyForm) {
        replyForm.style.display = replyForm.style.display === 'none' ? 'block' : 'none';
    } else {
        // Create a reply form container
        replyForm = document.createElement('div');
        replyForm.id = formId;
        replyForm.className = 'reply-form';
        replyForm.style.marginTop = '15px';
        replyForm.style.padding = '20px';
        replyForm.style.backgroundColor = '#2e2e2e';
        replyForm.style.borderRadius = '5px';
        replyForm.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

        // Create unique textarea ID
        const textareaId = formId.replace('reply-form-', 'reply-text-');

        // Set inner HTML with a textarea and two buttons
        replyForm.innerHTML = `
            <textarea id="${textareaId}" placeholder="Enter your reply..."
                style="width: 100%; height: 50px; margin-bottom: 5px; padding: 5px; border-radius: 3px; border: 1px solid #444; background-color: #1e1e1e; color: #fff;"></textarea>
            <br>
            <button onclick="submitReply('${messageId}', '${textareaId}', '${formId}')" style="margin-right: 5px;" class="action-btn submit-action">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z"/>
                </svg>
                <span style="margin-left: 4px;">Submit</span>
            </button>
            <button onclick="hideReplyForm('${formId}')" class="action-btn cancel-action">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg>
                <span style="margin-left: 4px;">Cancel</span>
            </button>
        `;

        // Use the provided target element or find the appropriate one
        let targetElement = targetMessageElement;

        if (!targetElement) {
            // Find all message elements with this ID and try to insert the form in the right one
            const messageElements = document.querySelectorAll(`li[data-id="${messageId}"]`);

            if (messageElements.length === 1) {
                targetElement = messageElements[0];
            } else if (messageElements.length > 1) {
                // If multiple elements exist, find the one that doesn't already have a reply form
                for (let element of messageElements) {
                    if (!element.querySelector(`#${formId}`)) {
                        targetElement = element;
                        break;
                    }
                }
                // If all have forms, use the first one
                if (!targetElement) {
                    targetElement = messageElements[0];
                }
            }
        }

        if (targetElement) {
            const repliesContainer = targetElement.querySelector('.replies');
            if (repliesContainer) {
                targetElement.insertBefore(replyForm, repliesContainer);
            } else {
                // If no replies container, insert at the end of the message element
                targetElement.appendChild(replyForm);
            }
        } else {
            // console.error(`Message element with data-id="${messageId}" not found.`);
        }
    }
}
window.showReplyForm = showReplyForm;
export function hideReplyForm(formId) {
    const replyForm = document.getElementById(formId);
    if (replyForm) {
        replyForm.remove(); // Remove the form from the DOM entirely
    }
}
window.hideReplyForm = hideReplyForm;
export function submitReply(messageId, textareaId, formId) {
    // If called with old signature (just messageId), try to find the textarea
    if (!textareaId) {
        textareaId = `reply-text-${messageId}`;
    }
    if (!formId) {
        formId = `reply-form-${messageId}`;
    }

    const replyTextArea = document.getElementById(textareaId);
    if (!replyTextArea) {
        console.error(`Reply textarea with id ${textareaId} not found`);
        return;
    }
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
        hideReplyForm(formId);  // Hide the form after submission
    }).catch((error) => {
        console.error('Failed to add reply:', error);
        showAlert('Failed to add reply :(', 'error');
    });
}
window.submitReply = submitReply;
// Function to reply to a message
export function replyToMessage(messageId, event) {
    // If event is provided, find the closest message element to determine context
    let targetMessageElement = null;
    if (event && event.target) {
        targetMessageElement = event.target.closest(`li[data-id="${messageId}"]`);
    }

    // Pass the target element to showReplyForm
    showReplyForm(messageId, targetMessageElement);
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
        // console.error(`Element with id replies-${messageId} not found.`);
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



