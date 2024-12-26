// This file contains JavaScript functions for handling the sending of messages or data, including form handling and API calls.

document.addEventListener('DOMContentLoaded', () => {
    const sendForm = document.getElementById('sendForm');
    
    if (sendForm) {
        sendForm.addEventListener('submit', handleSendMessage);
    }
});

function handleSendMessage(event) {
    event.preventDefault();
    
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (message === '') {
        alert('Please enter a message before sending.');
        return;
    }

    // Example API call to send the message
    sendMessageToAPI(message)
        .then(response => {
            alert('Message sent successfully!');
            messageInput.value = ''; // Clear the input field
        })
        .catch(error => {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        });
}

function sendMessageToAPI(message) {
    // Replace with actual API endpoint and method
    return fetch('https://api.example.com/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: message })
    });
}