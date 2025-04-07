import { isAdmin, db, storage, loadUserMessages} from "../../mainalt.js";
import { dbConfig } from "../../config.js";
import { showAlert } from "../alert/alert.js";
import { getSelectedSpotifyTrack } from "../spotify/spotify.js";
import { getEditorContent, clearEditorContent } from "../richtext/editor.js";

// Check for anonymous mode when page loads
document.addEventListener('DOMContentLoaded', function() {
    const user = firebase.auth().currentUser;
    if (user) {
        checkAndUpdateAnonymousWarning(user.uid);
        checkAndUpdateAnonymousUserWarning(user);
    }
    
    // Add auth state change listener to check again when user signs in
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            checkAndUpdateAnonymousWarning(user.uid);
            checkAndUpdateAnonymousUserWarning(user);
        }
    });
});

// Function to check if user is anonymous and show appropriate warning
function checkAndUpdateAnonymousUserWarning(user) {
    const warningDiv = document.getElementById('anonymousUserWarning');
    if (!warningDiv) return;
    
    if (user.isAnonymous) {
        warningDiv.style.display = 'flex';
    } else {
        warningDiv.style.display = 'none';
    }
}

// Function to check anonymous mode and update warning display
function checkAndUpdateAnonymousWarning(userId) {
    const warningDiv = document.getElementById('anonymousModeWarning');
    if (!warningDiv) return;
    
    firebase.database().ref(`users/${userId}/anonymProperties/state`).once('value')
        .then(snapshot => {
            const isAnonymMode = snapshot.exists() && snapshot.val() === "true";
            warningDiv.style.display = isAnonymMode ? 'flex' : 'none';
            
            // If anonymous mode is active, add username to the warning
            if (isAnonymMode) {
                firebase.database().ref(`users/${userId}/anonymProperties/username`).once('value')
                    .then(usernameSnapshot => {
                        const anonymUsername = usernameSnapshot.val();
                        if (anonymUsername) {
                            const warningText = warningDiv.querySelector('.warning-text');
                            if (warningText) {
                                warningText.innerHTML = `You are currently in <strong>Anonymous Mode</strong>. Your posts will show as <strong>${anonymUsername}</strong>.`;
                            }
                        }
                    });
            }
        })
        .catch(error => {
            console.error('Error checking anonymous mode status:', error);
        });
}

export function sendMessage() {
    const titleInput = document.getElementById('titleInput').value;
    // Get message content from the rich text editor instead of the textarea
    const messageInput = getEditorContent() || document.getElementById('messageInput').value;
    const imageInput = document.getElementById('imageInput').files[0];
    const adminNameInput = document.getElementById('adminNameInput').value;
    const user = firebase.auth().currentUser;

    if (isAdmin()) {
        adminNameContainer.style.display = 'block';
    }

    if (!user) {
        showAlert("User not authenticated.", "error");
        return;
    }

    if (titleInput.trim() === '' || (messageInput.trim() === '' && !imageInput)) {
        showAlert("Title and message or image cannot be empty.", "error");
        return;
    }

    // First check if anonymous mode is active
    checkAnonymousMode(user.uid).then(({ isAnonymous, anonymUsername }) => {
        if (isAnonymous && anonymUsername) {
            // If anonymous mode is active and has a username, use the anonymous username
            sendMessageWithName(anonymUsername);
        } else {
            // Otherwise get the user's regular display name
            getUserCustomName(user.uid).then(customName => {
                // Use custom name if available, otherwise fall back to displayName
                const userDisplayName = customName || user.displayName || 'Anonymous';
                sendMessageWithName(userDisplayName);
            }).catch(error => {
                console.error('Error retrieving custom username:', error);
                // If there's an error getting the custom name, proceed with default displayName
                sendMessageWithDefaultName();
            });
        }
    }).catch(error => {
        console.error('Error checking anonymous mode:', error);
        // If there's an error checking anonymous mode, proceed with normal username flow
        getUserCustomName(user.uid).then(customName => {
            const userDisplayName = customName || user.displayName || 'Anonymous';
            sendMessageWithName(userDisplayName);
        }).catch(error => {
            sendMessageWithDefaultName();
        });
    });
}

// Helper function to check anonymous mode
function checkAnonymousMode(userId) {
    return new Promise((resolve, reject) => {
        const userRef = firebase.database().ref(`users/${userId}/anonymProperties`);
        
        userRef.once('value')
            .then(snapshot => {
                const anonymData = snapshot.val();
                if (anonymData && anonymData.state === "true" && anonymData.username) {
                    resolve({ isAnonymous: true, anonymUsername: anonymData.username });
                } else {
                    resolve({ isAnonymous: false, anonymUsername: null });
                }
            })
            .catch(error => {
                console.error('Error checking anonymous mode:', error);
                reject(error);
            });
    });
}

// Helper function to get user's custom display name
function getUserCustomName(userId) {
    return new Promise((resolve, reject) => {
        // Reference to the user's custom display name in the database
        const userRef = firebase.database().ref(`users/${userId}/customDisplayName`);
        
        // Get the custom display name
        userRef.once('value')
            .then(snapshot => {
                const customName = snapshot.val();
                console.log('Retrieved custom name for message:', customName);
                resolve(customName);
            })
            .catch(error => {
                console.error('Error retrieving custom name:', error);
                reject(error);
            });
    });
}

// Function to send message with a specific display name
function sendMessageWithName(displayName) {
    const titleInput = document.getElementById('titleInput').value;
    const messageInput = getEditorContent() || document.getElementById('messageInput').value;
    const user = firebase.auth().currentUser;
    const showProfile = document.getElementById('showProfileToggle').checked;
    const spotifyTrack = getSelectedSpotifyTrack();
    
    // Check if this is an anonymous post by comparing the displayName
    // with the user's regular username
    let isAnonymousMode = false;
    
    // Get the user's regular username to determine if we're in anonymous mode
    getUserCustomName(user.uid).then(customName => {
        const regularName = customName || user.displayName || 'Anonymous';
        isAnonymousMode = (displayName !== regularName);
        
        // Create a new message reference
        const newMessageRef = db.ref(dbConfig.messagesPath).push();
        
        const messageData = {
            title: titleInput || null,
            text: messageInput || null,
            timestamp: Date.now(),
            userId: user.uid,
            userDisplayName: displayName,
            isAnonymousMode: isAnonymousMode, // Flag to indicate anonymous mode
            replies: [],
            showProfile: showProfile,
            spotifyTrack: spotifyTrack
        };
        
        // Add user profile data if toggle is checked
        if (showProfile) {
            messageData.userPhotoURL = user.photoURL || './images/suscat.jpg';
        }

        newMessageRef.set(messageData, (error) => {
            if (error) {
                console.error('Failed to save message:', error);
                showAlert('Failed to save message.', 'error');
            } else {
                showAlert('Message sent successfully!', 'success');
                resetForm();
                loadUserMessages();
            }
        });
    }).catch(error => {
        console.error('Error checking anonymous status:', error);
        
        // Create a new message reference
        const newMessageRef = db.ref(dbConfig.messagesPath).push();
        
        const messageData = {
            title: titleInput || null,
            text: messageInput || null,
            timestamp: Date.now(),
            userId: user.uid,
            userDisplayName: displayName,
            replies: [],
            showProfile: showProfile,
            spotifyTrack: spotifyTrack
        };
        
        // Add user profile data if toggle is checked
        if (showProfile) {
            messageData.userPhotoURL = user.photoURL || './images/suscat.jpg';
        }

        newMessageRef.set(messageData, (error) => {
            if (error) {
                console.error('Failed to save message:', error);
                showAlert('Failed to save message.', 'error');
            } else {
                showAlert('Message sent successfully!', 'success');
                resetForm();
                loadUserMessages();
            }
        });
    });
}

// Fallback function to send message with default name
function sendMessageWithDefaultName() {
    const titleInput = document.getElementById('titleInput').value;
    const messageInput = getEditorContent() || document.getElementById('messageInput').value;
    const user = firebase.auth().currentUser;
    const showProfile = document.getElementById('showProfileToggle').checked;
    const spotifyTrack = getSelectedSpotifyTrack();
    
    // Create a new message reference
    const newMessageRef = db.ref(dbConfig.messagesPath).push();
    
    const messageData = {
        title: titleInput || null,
        text: messageInput || null,
        timestamp: Date.now(),
        userId: user.uid,
        userDisplayName: user.displayName || 'Anonymous',
        replies: [],
        showProfile: showProfile,
        spotifyTrack: spotifyTrack
    };
    
    // Add user profile data if toggle is checked
    if (showProfile) {
        messageData.userPhotoURL = user.photoURL || './images/suscat.jpg';
    }

    newMessageRef.set(messageData, (error) => {
        if (error) {
            console.error('Failed to save message:', error);
            showAlert('Failed to save message.', 'error');
        } else {
            showAlert('Message sent successfully!', 'success');
            resetForm();
            loadUserMessages();
        }
    });
}

window.sendMessage = sendMessage;

export function resetForm() {
    const messageInput = document.getElementById('messageInput');
    const imageInput = document.getElementById('imageInput');
    const titleInput = document.getElementById('titleInput');

    if (titleInput) {
        titleInput.value = '';
    }
    
    if (imageInput) {
        imageInput.value = '';
    }
    
    // Clear the rich text editor content
    clearEditorContent();
    
    // Clear selected Spotify track if any
    if (window.clearSelectedSpotifyTrack) {
        window.clearSelectedSpotifyTrack();
    }
}
window.resetForm = resetForm;