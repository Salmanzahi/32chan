// This file contains JavaScript functions for retrieving and displaying messages or data, including fetching from APIs or databases.

document.addEventListener('DOMContentLoaded', () => {
    fetchMessages();
});

function fetchMessages() {
    const messagesContainer = document.getElementById('messagesContainer');
    const messageRef = db.ref('messages');

    messageRef.on('value', (snapshot) => {
        messagesContainer.innerHTML = ''; // Clear existing messages
        snapshot.forEach((childSnapshot) => {
            const message = childSnapshot.val();
            displayMessage(childSnapshot.key, message);
        });
    }, (error) => {
        console.error('Failed to fetch messages:', error);
        showAlert('Failed to fetch messages.', 'error');
    });
}

function displayMessage(messageId, message) {
    const messagesContainer = document.getElementById('messagesContainer');
    const messageElement = document.createElement('li');
    messageElement.setAttribute('data-id', messageId);
    messageElement.innerHTML = `
        <div class="content">
            <p>${message.text}</p>
            <button onclick="deletePost('${messageId}')">Delete</button>
            <button onclick="editPost('${messageId}')">Edit</button>
        </div>
    `;
    messagesContainer.appendChild(messageElement);
}

function deletePost(messageId) {
    // Function to delete a post
    const confirmDelete = confirm("Are you sure you want to delete this post?");
    if (!confirmDelete) return;

    const messageRef = db.ref(`messages/${messageId}`);
    messageRef.remove().then(() => {
        showAlert('Post deleted successfully!', 'success');
    }).catch((error) => {
        console.error('Failed to delete post:', error);
        showAlert('Failed to delete post.', 'error');
    });
}

function editPost(messageId) {
    const newText = prompt("Enter the new text for the post:");
    if (newText === null || newText.trim() === '') return;

    const messageRef = db.ref(`messages/${messageId}`);
    messageRef.update({
        text: newText
    }).then(() => {
        showAlert('Post updated successfully!', 'success');
    }).catch((error) => {
        console.error('Failed to update post:', error);
        showAlert('Failed to update post.', 'error');
    });
}