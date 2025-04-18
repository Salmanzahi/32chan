import { isAdmin, db, storage, loadUserMessages} from "../mainalt.js";
import { dbConfig } from "../config/config.js";
import { showAlert } from "../alert/alert.js";
import { getSelectedSpotifyTrack } from "../spotify/spotify.js";
import { getEditorContent, clearEditorContent } from "../richtext/editor.js";
import { uploadImageToSupabase } from "./supabase.js";

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
            
            // Check if user is admin and show admin UI elements
            if (isAdmin()) {
                document.getElementById('adminNameContainer').style.display = 'block';
                document.getElementById('adminDateContainer').style.display = 'block';
            }
        }
    });

    // Add image preview functionality
    const imageInput = document.getElementById('imageInput');
    const imagePreviewContainer = document.createElement('div');
    imagePreviewContainer.id = 'imagePreviewContainer';
    imagePreviewContainer.style.marginTop = '10px';
    imagePreviewContainer.style.display = 'none';
    
    // Insert the preview container after the image input
    imageInput.parentNode.insertBefore(imagePreviewContainer, imageInput.nextSibling);
    
    // Add event listener for image selection
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Clear previous preview
            imagePreviewContainer.innerHTML = '';
            imagePreviewContainer.style.display = 'block';
            
            // Create preview image
            const img = document.createElement('img');
            img.style.maxWidth = '200px';
            img.style.maxHeight = '200px';
            img.style.borderRadius = '4px';
            img.style.marginTop = '10px';
            
            // Create remove button
            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove Image';
            removeButton.style.marginLeft = '10px';
            removeButton.style.padding = '5px 10px';
            removeButton.style.backgroundColor = '#ff4444';
            removeButton.style.color = 'white';
            removeButton.style.border = 'none';
            removeButton.style.borderRadius = '4px';
            removeButton.style.cursor = 'pointer';
            
            // Add click handler for remove button
            removeButton.addEventListener('click', function() {
                imageInput.value = '';
                imagePreviewContainer.style.display = 'none';
            });
            
            // Create container for image and button
            const previewWrapper = document.createElement('div');
            previewWrapper.style.display = 'flex';
            previewWrapper.style.alignItems = 'center';
            previewWrapper.style.gap = '10px';
            
            // Read and display the image
            const reader = new FileReader();
            reader.onload = function(e) {
                img.src = e.target.result;
                previewWrapper.appendChild(img);
                previewWrapper.appendChild(removeButton);
                imagePreviewContainer.appendChild(previewWrapper);
            };
            reader.readAsDataURL(file);
        } else {
            imagePreviewContainer.style.display = 'none';
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
    const imageInput = document.getElementById('imageInput').files[0];
    
    // Get custom date from the admin date input if it exists
    let customTimestamp = null;
    if (isAdmin()) {
        const adminDateInput = document.getElementById('adminDateInput');
        if (adminDateInput && adminDateInput.value) {
            customTimestamp = new Date(adminDateInput.value).getTime();
        }
    }
    
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
            timestamp: customTimestamp || Date.now(),
            userId: user.uid,
            userDisplayName: displayName,
            isAnonymousMode: isAnonymousMode,
            replies: [],
            showProfile: showProfile,
            spotifyTrack: spotifyTrack
        };
        
        // Add user profile data if toggle is checked
        if (showProfile) {
            messageData.userPhotoURL = user.photoURL || './images/suscat.jpg';
        }

        // Handle image upload if an image is selected
        if (imageInput) {
            uploadImageToSupabase(imageInput, user.uid, newMessageRef.key)
                .then(imageURL => {
                    messageData.imageURL = imageURL;
                    return newMessageRef.set(messageData);
                })
                .then(() => {
                    showAlert('Message sent successfully!', 'success');
                    resetForm();
                    loadUserMessages();
                })
                .catch(error => {
                    console.error('Error uploading image:', error);
                    showAlert('Failed to upload image. Please try again.', 'error');
                });
        } else {
            // If no image, just save the message
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
    }).catch(error => {
        console.error('Error checking anonymous status:', error);
        
        // Create a new message reference
        const newMessageRef = db.ref(dbConfig.messagesPath).push();
        
        const messageData = {
            title: titleInput || null,
            text: messageInput || null,
            timestamp: customTimestamp || Date.now(),
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

        // Handle image upload if an image is selected
        if (imageInput) {
            uploadImageToSupabase(imageInput, user.uid, newMessageRef.key)
                .then(imageURL => {
                    messageData.imageURL = imageURL;
                    return newMessageRef.set(messageData);
                })
                .then(() => {
                    showAlert('Message sent successfully!', 'success');
                    resetForm();
                    loadUserMessages();
                })
                .catch(error => {
                    console.error('Error uploading image:', error);
                    showAlert('Failed to upload image. Please try again.', 'error');
                });
        } else {
            // If no image, just save the message
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
    });
}

// Fallback function to send message with default name
function sendMessageWithDefaultName() {
    const titleInput = document.getElementById('titleInput').value;
    const messageInput = getEditorContent() || document.getElementById('messageInput').value;
    const user = firebase.auth().currentUser;
    const showProfile = document.getElementById('showProfileToggle').checked;
    const spotifyTrack = getSelectedSpotifyTrack();
    const imageInput = document.getElementById('imageInput').files[0];
    
    // Get custom date from the admin date input if it exists
    let customTimestamp = null;
    if (isAdmin()) {
        const adminDateInput = document.getElementById('adminDateInput');
        if (adminDateInput && adminDateInput.value) {
            customTimestamp = new Date(adminDateInput.value).getTime();
        }
    }
    
    // Create a new message reference
    const newMessageRef = db.ref(dbConfig.messagesPath).push();
    
    const messageData = {
        title: titleInput || null,
        text: messageInput || null,
        timestamp: customTimestamp || Date.now(),
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

    // Handle image upload if an image is selected
    if (imageInput) {
        uploadImageToSupabase(imageInput, user.uid, newMessageRef.key)
            .then(imageURL => {
                messageData.imageURL = imageURL;
                return newMessageRef.set(messageData);
            })
            .then(() => {
                showAlert('Message sent successfully!', 'success');
                resetForm();
                loadUserMessages();
            })
            .catch(error => {
                console.error('Error uploading image:', error);
                showAlert('Failed to upload image. Please try again.', 'error');
            });
    } else {
        // If no image, just save the message
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
}

// Make sendMessage available globally
window.sendMessage = sendMessage;

export function resetForm() {
    const messageInput = document.getElementById('messageInput');
    const imageInput = document.getElementById('imageInput');
    const titleInput = document.getElementById('titleInput');
    const adminDateInput = document.getElementById('adminDateInput');

    if (titleInput) {
        titleInput.value = '';
    }
    
    if (imageInput) {
        imageInput.value = '';
    }
    
    if (adminDateInput) {
        adminDateInput.value = '';
    }
    
    // Clear the rich text editor content
    clearEditorContent();
    
    // Clear selected Spotify track if any
    if (window.clearSelectedSpotifyTrack) {
        window.clearSelectedSpotifyTrack();
    }
}
window.resetForm = resetForm;