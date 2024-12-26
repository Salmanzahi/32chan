// This file serves as the main entry point for the application, potentially handling routing or initializing the application.

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application or handle routing here
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'index.html' || currentPage === '') {
        loadAuthPage();
    } else if (currentPage === 'send.html') {
        loadSendPage();
    } else if (currentPage === 'view.html') {
        loadViewPage();
    }
});

function loadAuthPage() {
    // Logic to load the authentication page
    console.log('Loading authentication page...');
}

function loadSendPage() {
    // Logic to load the send page
    console.log('Loading send page...');
}

function loadViewPage() {
    // Logic to load the view page
    console.log('Loading view page...');
}