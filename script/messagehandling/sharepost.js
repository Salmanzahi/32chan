// Script to handle post sharing functionality

// Function to view a single post
export function viewSinglePost(messageId) {
    if (!messageId) return;
    
    // Redirect to the single post view page with query parameter
    window.location.href = `./post.html?id=${messageId}`;
}

// Make the function available globally
window.viewSinglePost = viewSinglePost;