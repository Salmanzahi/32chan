export function toggleView() {
    const formContainer = document.getElementById('formContainer');
    const messagesContainer = document.getElementById('messagesContainer');
    const sortAscBtn = document.getElementById('sortAscBtn');
    const sortDescBtn = document.getElementById('sortDescBtn');
    const sortMostLikedBtn = document.getElementById('sortMostLikedBtn');
    const userMessagesList = document.getElementById('userMessagesList');
    const mode = document.getElementById('toggleViewBtn');
    if (formContainer.style.display === 'none') {
        formContainer.style.display = 'block';
        messagesContainer.style.display = 'none';
        sortAscBtn.style.display = 'none';
        sortDescBtn.style.display = 'none';
        sortMostLikedBtn.style.display = 'none';
        userMessagesList.style.display = 'block';
        mode.innerHTML = "";
        mode.innerHTML = "Form";
    } else {
        formContainer.style.display = 'none';
        userMessagesList.style.display = 'none';
        messagesContainer.style.display = 'block';
        sortAscBtn.style.display = 'inline-block';
        sortDescBtn.style.display = 'inline-block';
        sortMostLikedBtn.style.display = 'inline-block';
        mode.innerHTML = "";
        mode.innerHTML = "Messages";
        showMessages(); // Load all messages when showing the messages container
    }
}

window.toggleView = toggleView;

// Function to send a message with an optional image

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("toggleViewBtn").innerText = "Form";
    
    // Check if we should show messages view based on localStorage flag
    if (localStorage.getItem('showMessagesView') === 'true') {
        // Switch to messages view
        toggleView();
        // Clear the flag
        localStorage.removeItem('showMessagesView');
    }
});
//window.resetForm = resetForm;
// Function to show and load messages



// Function to edit a post
