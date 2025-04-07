import { isAdmin } from "../../mainalt.js";

// Export the isAdmin function that checks if a user is in the admin list
// export function isAdmin() {
//     const user = firebase.auth().currentUser;
//     return user && adminRoles.admins.includes(user.uid);
// }

/**
 * Toggles the visibility of the changelog admin section based on admin status
 * This function checks if the current user is an admin and shows/hides the changelog
 * container accordingly
 */
export function toggleChangelogVisibility() {
    const user = firebase.auth().currentUser;
    const changelogSection = document.getElementById('changelog');
    
    if (user && isAdmin()) {
        changelogSection.style.display = 'block';
    } else {
        changelogSection.style.display = 'none';
    }
}

// Removed duplicate isAdmin function as we're using the exported one above

// Make the function available globally
window.toggleChangelogVisibility = toggleChangelogVisibility;

// Initialize visibility when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    // Check admin status and set initial visibility
    toggleChangelogVisibility();
    
    // Also check when auth state changes
    firebase.auth().onAuthStateChanged(() => {
        toggleChangelogVisibility();
    });
});