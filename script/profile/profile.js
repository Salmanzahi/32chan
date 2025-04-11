/**
 * profile.js
 * Handles user profile management functionality
 */

// Import Firebase authentication and storage from mainalt.js
import { db, storage, user } from '../../mainalt.js';
import { dbConfig } from '../../config.js';
import { isAdmin } from '../../mainalt.js';
import { showAlert } from '../../script/alert/alert.js';
const script = document.createElement('script');
script.src = "../../p.js"
// References to DOM elements
const profilePicture = document.getElementById('profilePicture');
const profilePictureInput = document.getElementById('profilePictureInput');
const displayNameInput = document.getElementById('displayName');
const anonymUsernameInput = document.getElementById('anonymUsername');
const userEmailElement = document.getElementById('userEmail');
const accountTypeElement = document.getElementById('accountType');
const memberSinceElement = document.getElementById('memberSince');
const editNameBtn = document.getElementById('editNameBtn');
const nameEditControls = document.getElementById('nameEditControls');
const saveNameBtn = document.getElementById('saveNameBtn');
const cancelNameBtn = document.getElementById('cancelNameBtn');
const editNameBtnAnonymous = document.getElementById('editNameBtnAnonymous');
const nameEditControlsAnonymous = document.getElementById('nameEditControlsAnonymous');
const saveNameBtnAnonymous = document.getElementById('saveNameBtnAnonymous');
const cancelNameBtnAnonymous = document.getElementById('cancelNameBtnAnonymous');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const cancelBtn = document.getElementById('cancelBtn');
const toggleAnonym = document.getElementById('toggleAnonymousBtn');
const searchToggle = document.getElementById('searchableToggle');

// Variables to store original values
let originalDisplayName = '';
let originalAnonymUsername = '';
let originalPhotoURL = '';
let profileChanged = false;
let originalSearchable = true; // Default value for profile searchability
const auth = firebase.auth();

// Initialize profile page
function initProfilePage() {
    // Check if user is authenticated
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Check if user is anonymous
            if (user.isAnonymous) {
                // Redirect anonymous users to home page
                window.location.href = './index.html';
                return;
            }
            // User is signed in and not anonymous, load profile data
            loadUserProfile(user);
            setupEventListeners();
        } else {
            // No user is signed in, redirect to home page
            window.location.href = './index.html';
        }
    });
}

// Function to handle anonymous state updates and UI changes
async function updateAnonymousState(user, newState = null) {
    if (!user) return;
    
    const userRef = firebase.database().ref(`users/${user.uid}/anonymProperties/state`);
    
    try {
        if (newState === null) {
            // Read current state
            const snapshot = await userRef.once('value');
            const currentValue = snapshot.exists() ? snapshot.val() === "true" : false;
            newState = currentValue.toString();
        } else {
            // Update state in database
            await userRef.set(newState);
        }
        
        // Update UI
        if (newState === "true") {
            toggleAnonym.classList.remove('anonym-off');
            toggleAnonym.classList.add('anonym-on');
            toggleAnonym.innerHTML = `
                <i class="fas fa-mask"></i>
                Anonymous Mode: <span class="status-text">ON</span>
            `;
            
            // Show transition animation
            toggleAnonym.animate([
                { opacity: 0.7 },
                { opacity: 1 }
            ], {
                duration: 300,
                easing: 'ease-in-out'
            });
        } else {
            toggleAnonym.classList.remove('anonym-on'); 
            toggleAnonym.classList.add('anonym-off');
            toggleAnonym.innerHTML = `
                <i class="fas fa-user"></i>
                Anonymous Mode: <span class="status-text">OFF</span>
            `;
            
            // Show transition animation
            toggleAnonym.animate([
                { opacity: 0.7 },
                { opacity: 1 }
            ], {
                duration: 300,
                easing: 'ease-in-out'
            });
        }
        
        // Update navbar username display
        updateNavbarUsername(user.uid);
    } catch (error) {
        console.error('Error handling anonymous state:', error);
        showAlert('Failed to handle anonymous mode', 'error');
    }
}

// Function to update navbar username display based on anonymous state
function updateNavbarUsername(userId) {
    firebase.database().ref(`users/${userId}`).once('value')
        .then(snapshot => {
            const userData = snapshot.val();
            const anonymState = userData?.anonymProperties?.state === "true";
            const regularUsername = userData?.customDisplayName || auth.currentUser.displayName;
            const anonymUsername = userData?.anonymProperties?.username;
            
            // Update navbar if it exists
            const navUsernameElement = document.querySelector('.user-name');
            if (navUsernameElement) {
                if (anonymState && anonymUsername) {
                    navUsernameElement.textContent = `${regularUsername} | ${anonymUsername}`;
                } else {
                    navUsernameElement.textContent = regularUsername;
                }
            }
        })
        .catch(error => {
            console.error('Error updating navbar username:', error);
        });
}

// Function to toggle anonymous mode
function toggleAnonymous() {
    const user = auth.currentUser;
    if (!user) return;
const db = firebase.database()
    const userRef = firebase.database().ref(`users/${user.uid}/anonymProperties/state`);

    userRef.once('value')
        .then(snapshot => {
            const currentValue = snapshot.exists() ? snapshot.val() === "true" : false;
            const newValue = (!currentValue).toString();
            
            // Check if anonymous username is set before enabling anonymous mode
            if (newValue === "true") {
                firebase.database().ref(`users/${user.uid}/anonymProperties/username`).once('value')
                    .then(usernameSnapshot => {
                        if (!usernameSnapshot.exists() || !usernameSnapshot.val()) {
                            showAlert('Please set your anonymous username before enabling anonymous mode', 'warning');
                            return;
                        }
                        updateAnonymousState(user, newValue);
                        
                        // Update anonymous warning on the send page if it's open
                        if (typeof checkAndUpdateAnonymousWarning === 'function') {
                            checkAndUpdateAnonymousWarning(user.uid);
                        } else {
                            // If we're not on the send page with the function available, 
                            // we can't update the warning directly
                            console.log('Anonymous mode updated. Warning will be shown on the send page.');
                        }
                    });
            } else {
                updateAnonymousState(user, newValue);
                
                // Hide anonymous warning on the send page if it's open
                const warningDiv = document.getElementById('anonymousModeWarning');
                if (warningDiv) {
                    warningDiv.style.display = 'none';
                }
            }
        })
        .catch(error => {
            showAlert('Failed to toggle anonymous mode', 'error');
        });
}

// Load user profile data
function loadUserProfile(user) {
    console.log('Loading user profile for:', user.uid);
  
    // First check if we have a stored custom username in the database
    firebase.database().ref(`users/${user.uid}`).once('value')
        .then((snapshot) => {
            const userData = snapshot.val();
            console.log('User data from database:', userData);
            
            // Set profile picture - prioritize Google photo
            const googleProfile = user.providerData && user.providerData.find(p => p.providerId === 'google.com');
            
            if (googleProfile && googleProfile.photoURL) {
                profilePicture.src = googleProfile.photoURL;
                originalPhotoURL = googleProfile.photoURL;
            } else if (user.photoURL) {
                profilePicture.src = user.photoURL;
                originalPhotoURL = user.photoURL;
            } else {
                profilePicture.src = './images/suscat.jpg';
                originalPhotoURL = './images/suscat.jpg';
            }
            
            // Set display name - prioritize stored custom username over Google name
            if (userData && userData.customDisplayName) {
                // Use custom username from database if available
                console.log('Using custom username from database:', userData.customDisplayName);
                displayNameInput.value = userData.customDisplayName;
                originalDisplayName = userData.customDisplayName;
                displayNameInput.placeholder = userData.customDisplayName;
                
                // Also update the Firebase Auth display name to match the custom one
                // This ensures consistency across the app
                user.updateProfile({
                    displayName: userData.customDisplayName
                }).then(() => {
                    console.log('Updated auth profile with custom username');
                }).catch(err => {
                    console.error('Failed to update auth profile:', err);
                });
            } else if (googleProfile && googleProfile.displayName) {
                console.log('Using Google display name:', googleProfile.displayName);
                displayNameInput.value = googleProfile.displayName;
                originalDisplayName = googleProfile.displayName;
                displayNameInput.placeholder = googleProfile.displayName;
            } else if (user.displayName) {
                console.log('Using Firebase Auth display name:', user.displayName);
                displayNameInput.value = user.displayName;
                originalDisplayName = user.displayName;
                displayNameInput.placeholder = user.displayName;
            } else {
                displayNameInput.value = '';
                originalDisplayName = '';
                displayNameInput.placeholder = 'Your username';
            }
            
            // Set anonymous username if available
            if (userData && userData.anonymProperties && userData.anonymProperties.username) {
                anonymUsernameInput.value = userData.anonymProperties.username;
                originalAnonymUsername = userData.anonymProperties.username;
                anonymUsernameInput.placeholder = userData.anonymProperties.username;
            } else {
                anonymUsernameInput.value = '';
                originalAnonymUsername = '';
                anonymUsernameInput.placeholder = 'Your anonymous username';
            }

            // Set searchable toggle (defaulting to true if not set)
            if (searchToggle) {
                const isSearchable = userData && userData.searchable !== false; // Default to true
                originalSearchable = isSearchable;
                searchToggle.checked = isSearchable;
                updateSearchableLabel(isSearchable);
            }

const db = firebase.database()
db.ref(dbConfig.messagesPath).orderByChild('userId').equalTo(user.uid).once('value')
    .then((snapshot) => {
        const postCount = snapshot.numChildren();

        // Update the DOM
        const postCountElement = document.getElementById('totalPosts');
        postCountElement.textContent = postCount;
    })
    .catch(error => {
        console.error("Error getting post count:", error);
    });

    if(isAdmin()) {
        userRole.textContent = 'Gweh Atmin Coy'
    }

            // Set email
            if (user.email) {
                userEmailElement.textContent = user.email;
            } else {
                userEmailElement.textContent = 'Anonymous account (no email)';
            }

            // Set account type
            if (user.isAnonymous) {
                accountTypeElement.textContent = 'Anonymous User';
            } else if (user.providerData && user.providerData.length > 0) {
                const provider = user.providerData[0].providerId;
                if (provider.includes('google')) {
                    accountTypeElement.textContent = 'Google Account';
                } else {
                    accountTypeElement.textContent = provider.replace('.com', '');
                }
            }

            // Set member since date
            if (user.metadata && user.metadata.creationTime) {
                const creationDate = new Date(user.metadata.creationTime)
                memberSinceElement.textContent = creationDate.toLocaleDateString()
            }

            updateAnonymousState(user);

        })
        .catch(error => {
            console.error("Error loading user data:", error)
            
            // Fallback to standard profile loading
            const googleProfile = user.providerData && user.providerData.find(p => p.providerId === 'google.com');
            
            // Set profile picture
            if (googleProfile && googleProfile.photoURL) {
                profilePicture.src = googleProfile.photoURL;
                originalPhotoURL = googleProfile.photoURL;
            } else if (user.photoURL) {
                profilePicture.src = user.photoURL;
                originalPhotoURL = user.photoURL;
            } else {
                profilePicture.src = './images/suscat.jpg';
                originalPhotoURL = './images/suscat.jpg';
            }

            // Set display name
            if (googleProfile && googleProfile.displayName) {
                displayNameInput.value = googleProfile.displayName;
                originalDisplayName = googleProfile.displayName;
            } else if (user.displayName) {
                displayNameInput.value = user.displayName;
                originalDisplayName = user.displayName;
            }
        });
}

// Set up event listeners
function setupEventListeners() {
    // Profile picture change
    toggleAnonym.addEventListener('click', toggleAnonymous);
    profilePictureInput.addEventListener('change', handleProfilePictureChange);

    // Display name edit - using generic handlers with different parameters
    editNameBtn.addEventListener('click', () => handleEditField(displayNameInput, editNameBtn, nameEditControls));
    saveNameBtn.addEventListener('click', () => handleSaveField(displayNameInput, editNameBtn, nameEditControls, originalDisplayName, 'Username', 10));
    cancelNameBtn.addEventListener('click', () => handleCancelEdit(displayNameInput, editNameBtn, nameEditControls, originalDisplayName));
    
    // Anonymous username edit - using same generic handlers
    editNameBtnAnonymous.addEventListener('click', () => handleEditField(anonymUsernameInput, editNameBtnAnonymous, nameEditControlsAnonymous));
    saveNameBtnAnonymous.addEventListener('click', () => handleSaveField(anonymUsernameInput, editNameBtnAnonymous, nameEditControlsAnonymous, originalAnonymUsername, 'Anonymous username', 10));
    cancelNameBtnAnonymous.addEventListener('click', () => handleCancelEdit(anonymUsernameInput, editNameBtnAnonymous, nameEditControlsAnonymous, originalAnonymUsername));
    
    // Searchable toggle
    if (searchToggle) {
        searchToggle.addEventListener('change', function() {
            updateSearchableLabel(this.checked);
            markProfileChanged();
        });
    }
   
    // Save and cancel buttons
    saveProfileBtn.addEventListener('click', handleSaveProfile);
    cancelBtn.addEventListener('click', handleCancel);
}

// Generic handler for edit button clicks
function handleEditField(inputElement, editButton, controlsElement) {
    inputElement.readOnly = false;
    inputElement.focus();
    editButton.style.display = 'none';
    controlsElement.style.display = 'flex';
}

// Generic handler for save button clicks
function handleSaveField(inputElement, editButton, controlsElement, originalValue, fieldName, maxLength) {
    // Validate input
    const newValue = inputElement.value.trim();
    
    if (!validateField(newValue, fieldName, maxLength)) {
        return; // Validation failed
    }
    
    // Make input readonly again
    inputElement.readOnly = true;
    
    // Hide edit controls
    editButton.style.display = 'block';
    controlsElement.style.display = 'none';
    
    // Mark profile as changed if the value is different
    if (newValue !== originalValue) {
        markProfileChanged();
        
        // Show temporary confirmation
        showAlert('Changes will be saved when you click "Save Changes"', 'info');
    }
}

// Generic handler for cancel button clicks
function handleCancelEdit(inputElement, editButton, controlsElement, originalValue) {
    // Restore original value
    inputElement.value = originalValue;
    
    // Make input readonly again
    inputElement.readOnly = true;
    
    // Hide edit controls
    editButton.style.display = 'block';
    controlsElement.style.display = 'none';
}

// Validation function for username fields
function validateField(value, fieldName, maxLength) {
    if (!value) {
        showAlert(`${fieldName} cannot be empty`, 'error');
        return false;
    }
    
    if (value.length > maxLength) {
        showAlert(`${fieldName} cannot be longer than ${maxLength} characters`, 'error');
        return false;
    }

    if (!/^[a-zA-Z0-9]+$/.test(value)) {
        showAlert(`${fieldName} can only contain letters and numbers`, 'error');
        return false;
    }
    
    return true;
}

// Mark profile as changed and enable save button
function markProfileChanged() {
    profileChanged = true;
    saveProfileBtn.disabled = false;
}

// Handle profile picture change
function handleProfilePictureChange(event) {
    const file = event.target.files[0];
    
    if (file) {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showAlert('Image is too large. Maximum size is 5MB.', 'error');
            return;
        }
        
        // Check file type
        if (!file.type.match('image.*')) {
            showAlert('Only image files are allowed.', 'error');
            return;
        }
        
        // Preview the image
        const reader = new FileReader();
        reader.onload = function(e) {
            profilePicture.src = e.target.result;
            markProfileChanged();
        };
        reader.readAsDataURL(file);
    }
}

// Handle save profile button click
async function handleSaveProfile() {
    // Get the current user
    const user = auth.currentUser;
    
    if (!user) {
        showAlert('You must be logged in to update your profile', 'error');
        return;
    }
    
    // Show loading state
    saveProfileBtn.textContent = 'Saving...';
    saveProfileBtn.disabled = true;
    cancelBtn.disabled = true;
    
    try {
        // Check if profile picture changed
        if (profilePictureInput.files.length > 0) {
            const file = profilePictureInput.files[0];
            const storageRef = storage.ref(`profile_pictures/${user.uid}`);
            
            // Upload the file
            await storageRef.put(file);
            
            // Get the download URL
            const downloadURL = await storageRef.getDownloadURL();
            
            // Update user profile with new photo URL
            await user.updateProfile({
                photoURL: downloadURL
            });
            
            originalPhotoURL = downloadURL;
        }
        
        // Check if display name changed
        const newName = displayNameInput.value.trim();
        if (newName !== originalDisplayName) {
            console.log(`Username changing from "${originalDisplayName}" to "${newName}"`);
            
            // Update user profile with new display name
            await user.updateProfile({
                displayName: newName
            });
            
            // Store custom display name in Firebase database
            await firebase.database().ref(`users/${user.uid}`).update({
                customDisplayName: newName
            });
            
            // Update all user's non-anonymous messages with new name
            try {
                console.log("Starting to update all posts with new username...");
                await updateUserPosts(user.uid, originalDisplayName, newName);
                console.log("All non-anonymous posts updated successfully");
            } catch (error) {
                console.error("Error updating posts:", error);
                showAlert("Profile updated but some posts may not be updated", "warning");
            }
            
            originalDisplayName = newName;
        }

        // Check if anonymous username changed
        const newAnonymName = anonymUsernameInput.value.trim();
        if (newAnonymName !== originalAnonymUsername) {
            // Store anonymous username in Firebase database
            await firebase.database().ref(`users/${user.uid}/anonymProperties`).update({
                username: newAnonymName
            });
            
            originalAnonymUsername = newAnonymName;
            
            // Update navbar if anonymous mode is active
            const userRef = firebase.database().ref(`users/${user.uid}/anonymProperties/state`);
            userRef.once('value').then(snapshot => {
                if (snapshot.exists() && snapshot.val() === "true") {
                    updateNavbarUsername(user.uid);
                }
            });
        }
        
        // Check if searchable preference changed
        if (searchToggle && searchToggle.checked !== originalSearchable) {
            // Update searchable preference in database
            await firebase.database().ref(`users/${user.uid}`).update({
                searchable: searchToggle.checked
            });
            
            originalSearchable = searchToggle.checked;
            console.log(`Profile searchability set to: ${searchToggle.checked}`);
        }
        
        // Show success message
        showAlert('Profile updated successfully', 'success');
        
        // Reset profile changed flag
        profileChanged = false;
        
        // Update UI
        saveProfileBtn.textContent = 'Save Changes';
        saveProfileBtn.disabled = true;
        cancelBtn.disabled = false;
        
        // Update navbar username
        updateNavbarUsername(user.uid);
        
        // Refresh the page to show updated profile in navbar
        window.location.reload();
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showAlert('Failed to update profile: ' + error.message, 'error');
        
        saveProfileBtn.textContent = 'Save Changes';
        saveProfileBtn.disabled = false;
        cancelBtn.disabled = false;
    }
}

// Handle cancel button click
function handleCancel() {
    if (profileChanged) {
        if (confirm('Are you sure you want to discard your changes?')) {
            // Restore original values
            displayNameInput.value = originalDisplayName;
            anonymUsernameInput.value = originalAnonymUsername;
            profilePicture.src = originalPhotoURL;
            
            // Restore original searchable setting
            if (searchToggle) {
                searchToggle.checked = originalSearchable;
                updateSearchableLabel(originalSearchable);
            }
            
            // Reset profile changed flag
            profileChanged = false;
            
            // Disable save button
            saveProfileBtn.disabled = true;
        }
    } else {
        // If no changes, just go back
        window.history.back();
    }
}

// Function to update all non-anonymous posts for a user
async function updateUserPosts(userId, oldName, newName) {
    console.log(`Starting to update posts for user ${userId} from "${oldName}" to "${newName}"`);
    
    // Get a reference to the messages in the database
    const messagesRef = firebase.database().ref(dbConfig.messagesPath);
    
    try {
        // Query all messages by this user
        const snapshot = await messagesRef.orderByChild('userId').equalTo(userId).once('value');
        
        if (!snapshot.exists()) {
            console.log('No messages found for this user');
            return;
        }
        
        // Prepare batch updates
        const updates = {};
        let updateCount = 0;
        let skippedCount = 0;
        
        // Process each message
        snapshot.forEach((childSnapshot) => {
            const messageId = childSnapshot.key;
            const message = childSnapshot.val();
            
            // Update usernames in these cases:
            // 1. Non-anonymous messages (isAnonymousMode === false)
            // 2. Messages where isAnonymousMode is undefined (older posts)
            // 3. Messages where userDisplayName matches oldName (for extra safety)
            if (message.isAnonymousMode === false || 
                message.isAnonymousMode === undefined ||
                message.userDisplayName === oldName) {
                
                updates[`${dbConfig.messagesPath}/${messageId}/userDisplayName`] = newName;
                updateCount++;
                console.log(`Will update message ${messageId} from "${message.userDisplayName}" to "${newName}"`);
            } else {
                skippedCount++;
                console.log(`Skipping anonymous message ${messageId} with username "${message.userDisplayName}"`);
            }
        });
        
        console.log(`Found ${updateCount} messages to update, skipping ${skippedCount} anonymous messages`);
        
        // Apply all updates if there are any
        if (updateCount > 0) {
            await firebase.database().ref().update(updates);
            console.log(`Successfully updated ${updateCount} messages`);
            showAlert(`Updated username on ${updateCount} posts`, 'success');
        } else {
            console.log('No messages needed updating');
            showAlert('No posts needed username updates', 'info');
        }
    } catch (error) {
        console.error('Error updating messages:', error);
        showAlert(`Failed to update usernames: ${error.message}`, 'error');
        throw new Error(`Failed to update messages: ${error.message}`);
    }
}

// Add this function to update message usernames (keeping for backward compatibility)
function updateUsername(userId, newDisplayName) {
    // This function is deprecated, use updateUserPosts instead
    updateUserPosts(userId, originalDisplayName, newDisplayName)
        .then(() => console.log('Username update completed'))
        .catch(error => console.error('Username update failed:', error));
}

// Update searchable label based on toggle state
function updateSearchableLabel(isSearchable) {
    const label = document.querySelector('label[for="searchableToggle"] .status-text');
    if (label) {
        label.textContent = isSearchable ? 'ON' : 'OFF';
        label.style.color = isSearchable ? '#4CAF50' : '#F44336';
    }
}

// Initialize the profile page when the DOM is loaded
document.addEventListener('DOMContentLoaded', initProfilePage);
