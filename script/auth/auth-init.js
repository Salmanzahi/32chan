/**
 * auth-init.js
 * This script handles the initialization of authentication buttons
 * after the navbar is dynamically loaded.
 */

// Import the authentication functions from mainalt.js
import { googleSignIn, anonymousSignIn, signOut } from '../mainalt.js';

// Import Firebase configuration
import { dbConfig } from '../config/config.js';

// Initialize Firebase auth and set up user state handling
const auth = firebase.auth();

/**
 * Initialize authentication buttons by attaching event listeners
 * This function will be called after the navbar is loaded
 */
export function initAuthButtons() {
    console.log('Initializing authentication buttons');
    
    const elements = [
        { id: "googleSignInBtn", handler: googleSignIn },
        { id: "mobilegoogleSignInBtn", handler: googleSignIn },
        { id: "anonymousSignInBtn", handler: anonymousSignIn },
        { id: "mobileanonymousSignInBtn", handler: anonymousSignIn },
        { id: "signOutBtn", handler: signOut },
        { id: "mobilesignOutBtn", handler: signOut }
    ];

    elements.forEach(({ id, handler }) => {
        const el = document.getElementById(id);
        if (el) {
            // Remove any existing event listeners to prevent duplicates
            const newEl = el.cloneNode(true);
            el.parentNode.replaceChild(newEl, el);
            
            // Add the event listener
            newEl.addEventListener("click", handler);
            console.log(`Event listener attached to ${id}`);
        } else {
            console.warn(`Element with id ${id} not found.`);
        }
    });
}

/**
 * Set up a MutationObserver to detect when the navbar is loaded
 * and initialize the authentication buttons
 */
export function setupNavbarLoadListener() {
    console.log('Setting up navbar load listener');
    
    // Check if navbar container already exists and has content
    const navbarContainer = document.getElementById('navbarContainer');
    if (navbarContainer && navbarContainer.children.length > 0) {
        console.log('Navbar already loaded, initializing auth buttons');
        initAuthButtons();
        return;
    }
    
    // Set up a MutationObserver to watch for changes to the DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                // Check if our navbar container has content now
                const navbarContainer = document.getElementById('navbarContainer');
                if (navbarContainer && navbarContainer.children.length > 0) {
                    console.log('Navbar loaded, initializing auth buttons');
                    initAuthButtons();
                    // Disconnect the observer once we've initialized the buttons
                    observer.disconnect();
                }
            }
        });
    });
    
    // Start observing the document body for DOM changes
    observer.observe(document.body, { childList: true, subtree: true });
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', setupNavbarLoadListener);

// Also initialize when window loads (backup)
window.addEventListener('load', setupNavbarLoadListener);

// Handle user authentication state changes
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        const userNav = document.getElementById('userNav');
        const guestNav = document.getElementById('guestNav');
        const userNameElement = document.querySelector('.user-name');
        
        // If user elements exist in the current page
        if (userNav && guestNav) {
            userNav.classList.remove('hidden');
            guestNav.classList.add('hidden');
        }
        
        // If user is not anonymous (Google sign-in)
        if (!user.isAnonymous) {
            // Check if the user has a profile in the database
            checkAndCreateUserProfile(user);
            
            // Update username in navigation if element exists
            if (userNameElement) {
                updateNavbarUsername(user);
            }
        }
    } else {
        // User is signed out
        const userNav = document.getElementById('userNav');
        const guestNav = document.getElementById('guestNav');
        
        if (userNav && guestNav) {
            userNav.classList.add('hidden');
            guestNav.classList.remove('hidden');
        }
    }
});

// Function to check if user has a profile and create one if not
function checkAndCreateUserProfile(user) {
    // Skip for anonymous users
    if (user.isAnonymous) return;
    
    const userRef = firebase.database().ref(`users/${user.uid}`);
    
    // Check if user exists in database
    userRef.once('value')
        .then(snapshot => {
            if (!snapshot.exists()) {
                // User does not exist in database, create a new profile
                return createNewUserProfile(user);
            } else if (!snapshot.val().customDisplayName) {
                // User exists but doesn't have a customDisplayName
                const userData = snapshot.val();
                userData.customDisplayName = user.displayName;
                return userRef.update(userData);
            }
        })
        .catch(error => {
            console.error("Error checking user profile:", error);
        });
}

// Function to create a new user profile
function createNewUserProfile(user) {
    // Create a user object with initial data
    const userData = {
        uid: user.uid,
        email: user.email,
        customDisplayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        anonymProperties: {
            state: "false",
            username: "" // Empty by default
        }
    };
    
    // Save user data to database
    return firebase.database().ref(`users/${user.uid}`).set(userData)
        .then(() => {
            console.log("New user profile created successfully");
        })
        .catch(error => {
            console.error("Error creating user profile:", error);
        });
}

// Function to update the username in the navbar
function updateNavbarUsername(user) {
    // Get the user data from the database to check for anonymous state
    firebase.database().ref(`users/${user.uid}`).once('value')
        .then(snapshot => {
            const userData = snapshot.val();
            const userNameElement = document.querySelector('.user-name');
            
            if (userNameElement) {
                if (userData && userData.anonymProperties && userData.anonymProperties.state === "true" && userData.anonymProperties.username) {
                    // User is in anonymous mode and has an anonymous username
                    userNameElement.textContent = `${userData.customDisplayName || user.displayName} | ${userData.anonymProperties.username}`;
                } else {
                    // User is not in anonymous mode or doesn't have an anonymous username
                    userNameElement.textContent = userData?.customDisplayName || user.displayName;
                }
            }
        })
        .catch(error => {
            console.error("Error updating navbar username:", error);
            // Fallback to default display name
            const userNameElement = document.querySelector('.user-name');
            if (userNameElement) {
                userNameElement.textContent = user.displayName;
            }
        });
}