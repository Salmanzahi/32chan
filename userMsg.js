// Function to view sent messages
function viewSentMessages() {
    const sentMessagesContainer = document.getElementById('sentMessagesContainer');
    const messagesContainer = document.getElementById('messagesContainer');
    const sentMessagesList = document.getElementById('sentMessagesList');

    if (sentMessagesContainer && messagesContainer && sentMessagesList) {
        messagesContainer.style.display = 'none';
        sentMessagesContainer.style.display = 'block';
        sentMessagesList.innerHTML = ''; // Clear existing messages before appending new ones

        const user = firebase.auth().currentUser;
        if (user) {
            db.ref('messages').orderByChild('userId').equalTo(user.uid).on('value', (snapshot) => {
                const messages = [];
                snapshot.forEach((childSnapshot) => {
                    const messageData = childSnapshot.val();
                    messages.push({ id: childSnapshot.key, ...messageData });
                });

                // Append sent messages to the DOM
                messages.forEach((message) => {
                    const messageText = message.text || 'No text provided';
                    const timestamp = message.timestamp;
                    const imageUrl = message.imageUrl || null;

                    // Create message list item
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <p>${messageText}</p>
                        ${imageUrl ? `<img src="${imageUrl}" alt="Message Image" style="max-width: 100%; height: auto;">` : ''}
                        <span class="timestamp">${new Date(timestamp).toLocaleString()}</span>
                        <button onclick="editMessage('${message.id}')">Edit</button>
                        <button onclick="deleteMessage('${message.id}')">Delete</button>
                    `;
                    sentMessagesList.appendChild(li);
                });
            });
        } else {
            console.error('User not authenticated.');
        }
    } else {
        console.error('One or more elements not found in the DOM.');
    }
}

// Function to load and display user's sent messages
function loadUserMessages() {
    const sentMessagesList = document.getElementById('sentMessagesList');
    sentMessagesList.innerHTML = ''; // Clear existing messages before appending new ones

    const user = firebase.auth().currentUser;
    if (!user) {
        console.error('User not authenticated.');
        return;
    }

    db.ref('messages').orderByChild('userId').equalTo(user.uid).on('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const messageData = childSnapshot.val();
            const messageId = childSnapshot.key;
            const messageText = messageData.text || 'No text provided';
            const timestamp = messageData.timestamp;
            const imageUrl = messageData.imageUrl || null;

            // Create message list item
            const li = document.createElement('li');
            li.innerHTML = `
                <p>${messageText}</p>
                ${imageUrl ? `<img src="${imageUrl}" alt="Message Image" style="max-width: 100%; height: auto;">` : ''}
                <span class="timestamp">${new Date(timestamp).toLocaleString()}</span>
                <button onclick="editMessage('${messageId}')">Edit</button>
                <button onclick="deleteMessage('${messageId}')">Delete</button>
            `;
            sentMessagesList.appendChild(li);
        });
    });
}

// Function to edit a message
function editMessage(messageId) {
    const newMessageText = prompt("Enter your new message:");
    if (newMessageText === null || newMessageText.trim() === '') return;

    db.ref(`messages/${messageId}`).update({
        text: newMessageText,
        edited: true,
        editedTimestamp: Date.now()
    }).then(() => {
        alert('Message updated successfully!');
        loadUserMessages();
    }).catch((error) => {
        console.error('Failed to update message:', error);
        alert('Failed to update message.');
    });
}

// Function to delete a message
function deleteMessage(messageId) {
    if (!confirm("Are you sure you want to delete this message?")) return;

    db.ref(`messages/${messageId}`).remove().then(() => {
        alert('Message deleted successfully!');
        loadUserMessages();
    }).catch((error) => {
        console.error('Failed to delete message:', error);
        alert('Failed to delete message.');
    });
}

// Load user's messages on page load
document.addEventListener('DOMContentLoaded', (event) => {
    loadUserMessages();
});