// Function to handle undefined routes
function handleUndefinedRoutes() {
    const validRoutes = ['/', '/index.html', '/another-valid-route']; // Add your valid routes here
    const currentPath = window.location.pathname;

    if (!validRoutes.includes(currentPath)) {
        window.location.href = '404.html';
    }
}

// Call the function to handle undefined routes
document.addEventListener('DOMContentLoaded', (event) => {
    handleUndefinedRoutes();
});