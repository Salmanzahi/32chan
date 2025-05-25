/*
WHAT ARE U DOING IN HERE ?
KASIHANI AKU PLS JANGAN DI HACK WEB KU PLS !!!

*/
import { adminRoles } from './config/role.js';
import { firebaseConfig } from '../p.js';
import { dbConfig } from './config/config.js';
import { adminAnnouncement } from './config/config.js';
import { showMessages, createMessageElement } from './messagehandling/viewmsg.js'
import { sanitizeText } from './santizeText/sanitize.js';
// import { toggleLike } from './messagehandling/CRUDpost.js';
// import { loadReplies } from './messagehandling/replyhandling.js';

const script = document.createElement('script');
script.src = "./role.js"
script.src = "./p.js"

document.head.appendChild(script);
const auth = firebase.auth();
export const user = auth.currentUser;

export function creatusermsg(message, user) {
    const safeTitle = sanitizeText(message.title || 'Legacy Post');
    const safeAdminName = message.adminName ? sanitizeText(message.adminName) : null;
    const safeMessageText = sanitizeText(message.text || 'No text provided');
    const timestamp = message.timestamp;
    const imageUrl = message.imageURL ? sanitizeText(message.imageURL) : null;
    const likes = message.likes || 0;

    // Check if current user has liked this message
    const isLiked = user && message.likedBy && message.likedBy[user.uid];
    const likedClass = isLiked ? 'liked' : '';

    // Create message list item
    const li = document.createElement('li');
    li.setAttribute('data-id', message.id);
    li.style.backgroundColor = "#1e1e1e";
    li.style.padding = "15px";
    li.style.border = "1px solid #333";
    li.style.borderRadius = "8px";
    li.style.marginBottom = "10px";
    li.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.5)";
    li.style.transition = "box-shadow 0.3s ease-in-out";
    li.style.listStyle = "none";
    // Check if profile should be displayed
    const showProfile = message.showProfile;
    const userDisplayName = message.userDisplayName ? sanitizeText(message.userDisplayName) : null;
    const userPhotoURL = message.userPhotoURL ? sanitizeText(message.userPhotoURL) : null;

    // Check if the message is from an admin user
    const isUserAdmin = message.userId && adminRoles && adminRoles.admins && adminRoles.admins.includes(message.userId);

    // Check if message was posted in anonymous mode
    // The condition: if anonymous username is different from the regular username
    // This specific check will be performed when displaying user messages
    const isAnonymousMode = message.isAnonymousMode === true;
    const displayName = userDisplayName + (isAnonymousMode ? ' <span style="color: gray;">[Anonymous]</span>' : '');

    li.innerHTML = `
        <div class="header">
            ${showProfile && userDisplayName ? `
            <div class="user-profile">
                ${isAnonymousMode ?
                    `<img src="./images/suscat.jpg" alt="Anonymous User">` :
                    `<img src="${userPhotoURL || './images/suscat.jpg'}" alt="User Photo">`
                }
                <div>
                    <div class="user-name">${displayName}</div>
                    ${isUserAdmin ? `<div class="admin-tag">[ADMIN]</div>` : ''}
                </div>
            </div>` : ''}
            <div class="title">${safeTitle}</div>
            <div class="timestamp">${new Date(timestamp).toLocaleString()}</div>
        </div>
        <div class="content">
            <div class="message-text" style="color:#ffff">${safeMessageText}</div>
            ${imageUrl ? `
            <div class="message-image" style="margin-top: 10px;">
                <img src="${imageUrl}" alt="Message Image" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            </div>` : ''}
            ${message.spotifyTrack ? `
            <div class="spotify-track-embed">
                <iframe src="https://open.spotify.com/embed/track/${message.spotifyTrack.id}"
                width="100%" height="80" frameborder="0" allowtransparency="true"
                allow="encrypted-media"></iframe>
            </div>` : ''}
        </div>
        <div class="actions">
            <button onclick="toggleLike('${message.id}')" class="action-btn ${likedClass}">
                <svg class="like-icon" width="16" height="16" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                ${likes}
            </button>
            <button onclick="replyToMessage('${message.id}', event)" class="action-btn">
                <svg class="reply-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 10h10a5 5 0 0 1 5 5v6M3 10l6 6m-6-6l6-6"/>
                </svg>
                Reply
            </button>
            <button onclick="shareMessage('${message.id}')" class="action-btn">
                <svg class="share-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="18" cy="5" r="3"/>
                    <circle cx="6" cy="12" r="3"/>
                    <circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share and View
            </button>
            ${isAdmin() ? `
                <button onclick="editPost('${message.id}')" class="action-btn">
                    <svg class="edit-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                </button>
                <button onclick="deletePost('${message.id}')" class="action-btn">
                    <svg class="delete-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                    Delete
                </button>
            ` : ''}
            ${(user && message.userId === user.uid && !isAdmin()) ? `
                <button onclick="editUserPost('${message.id}')" class="action-btn">
                    <svg class="edit-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                </button>
                <button onclick="deleteUserPost('${message.id}')" class="action-btn">
                    <svg class="delete-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                    Delete
                </button>
            ` : ''}
        </div>
    `;

    return li;
}



// Function to handle Google Sign-In
export function googleSignIn() {
    console.log('Google Sign-In button clicked');
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            // The signed-in user info.
            const user = result.user;
            console.log('User signed in:', user);

            // Update user profile with Google data if not already set
            if (user.providerData[0].providerId === 'google.com') {
                const googleProfile = user.providerData[0];
                return user.updateProfile({
                    displayName: googleProfile.displayName,
                    photoURL: googleProfile.photoURL
                }).then(() => {
                    console.log('Profile updated with Google data');
                    window.location.href = "sendview.html";
                });
            } else {
                window.location.href = "sendview.html";
            }
        })
        .catch((error) => {
            console.error('Error during sign-in:', error);
            alert('Failed to sign in: ' + error.message);
        });
}

// Function to handle Anonymous Sign-In
export function anonymousSignIn() {
    console.log('Anonymous Sign-In button clicked');
    auth.signInAnonymously()
        .then(() => {
            console.log('User signed in anonymously');
            window.location.href = "sendview.html"; // Redirect to sendview.html after authentication
        })
        .catch((error) => {
            console.error('Error during anonymous sign-in:', error);
            alert('Failed to sign in anonymously: ' + error.message);
        });
}
document.addEventListener("DOMContentLoaded", () => {
    auth.onAuthStateChanged((user) => {
        // console.log("Auth state changed. User:", user);
        console.log("Current pathname:", window.location.pathname);
       if (user) {
        // Check for custom username in database and sync with Auth profile
        if (!user.isAnonymous) {
            syncCustomUsername(user);
        }

        if (window.location.pathname) {
            document.getElementById('userProfile').style.display = 'flex';
            document.getElementById('googleSignInBtn').style.display = 'none';
            document.getElementById('mobilegoogleSignInBtn').style.display = 'none';
            document.getElementById('anonymousSignInBtn').style.display = 'none';
            document.getElementById('mobileanonymousSignInBtn').style.display = 'none';
            document.getElementById('signOutBtn').style.display = 'block';
            document.getElementById('mobilesignOutBtn').style.display = 'block';
            document.getElementById('mobileUserProfile').style.display = 'flex';

            // Show/hide profile links based on anonymous status
            const mobileProfileLink = document.getElementById('mobileProfileLink');
            const userProfile = document.getElementById('userProfile');
            const profileLink = userProfile.querySelector('a');
            const mobileUserProfileContainer = document.getElementById('mobileUserProfile');

            if (user.isAnonymous) {
                // Hide profile links for anonymous users
                if (mobileProfileLink) mobileProfileLink.style.display = 'none';

                // Show profile image but disable click functionality
                if (userProfile) {
                    userProfile.style.display = 'flex';
                    if (profileLink) {
                        profileLink.style.pointerEvents = 'none';
                        profileLink.style.cursor = 'default';
                        profileLink.classList.remove('hover:opacity-80', 'transition-all', 'duration-300');
                    }
                }

                // Remove link functionality from mobile profile section
                if (mobileUserProfileContainer) {
                    const mobileProfileLink = mobileUserProfileContainer.querySelector('a');
                    if (mobileProfileLink) {
                        // Convert the link to a div while preserving its content
                        const div = document.createElement('div');
                        div.className = mobileProfileLink.className;
                        div.innerHTML = mobileProfileLink.innerHTML;
                        mobileProfileLink.parentNode.replaceChild(div, mobileProfileLink);
                    }
                }

                // Redirect if on profile page
                if (window.location.pathname.includes('profile.html')) {
                    window.location.href = './index.html';
                }
            } else {
                // Show profile links and enable click for non-anonymous users
                if (mobileProfileLink) mobileProfileLink.style.display = 'flex';
                if (userProfile) {
                    userProfile.style.display = 'flex';
                    if (profileLink) {
                        profileLink.style.pointerEvents = 'auto';
                        profileLink.style.cursor = 'pointer';
                        profileLink.classList.add('hover:opacity-80', 'transition-all', 'duration-300');
                    }
                }

                // Remove link functionality from mobile profile section even for logged-in users
                if (mobileUserProfileContainer) {
                    const mobileProfileLink = mobileUserProfileContainer.querySelector('a');
                    if (mobileProfileLink) {
                        // Convert the link to a div while preserving its content
                        const div = document.createElement('div');
                        div.className = mobileProfileLink.className;
                        div.innerHTML = mobileProfileLink.innerHTML;
                        mobileProfileLink.parentNode.replaceChild(div, mobileProfileLink);
                    }
                }
            }

            console.log("Redirecting to sendview.html");
        }
       } else {
        if (window.location.pathname.includes('sendview.html') ||
            window.location.pathname.includes('profile.html')) {
            console.log("Redirecting to index.html");
            window.location.replace('index.html');
        }
        hideUserProfile();
        document.getElementById('userProfile').style.display = 'none';
        document.getElementById('googleSignInBtn').style.display = 'block';
        document.getElementById('mobilegoogleSignInBtn').style.display = 'block';
        document.getElementById('anonymousSignInBtn').style.display = 'block';
        document.getElementById('mobileanonymousSignInBtn').style.display = 'block';
        document.getElementById('signOutBtn').style.display = 'none';
        document.getElementById('mobilesignOutBtn').style.display = 'none';
        document.getElementById('mobileUserProfile').style.display = 'none';

        // Hide profile link in mobile menu when logged out
        const mobileProfileLink = document.getElementById('mobileProfileLink');
        if (mobileProfileLink) {
            mobileProfileLink.style.display = 'none';
        }
       }
        loadUserMessages();
        displayUserProfile(user);

    });


});

function showAlert(message, type = 'info') {
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert alert-${type}`;
    alertContainer.textContent = message;

    document.body.appendChild(alertContainer);

    // Show the alert with transition
    setTimeout(() => {
        alertContainer.classList.add('alert-show');
    }, 100);

    // Hide the alert after 3 seconds
    setTimeout(() => {
        alertContainer.classList.remove('alert-show');
        setTimeout(() => {
            alertContainer.remove();
        }, 500);
    }, 3000);
}

// Function to handle Sign-Out
/*function signOut() {
    auth.signOut().then(() => {
        console.log('User signed out');
        hideUserProfile();
    }).catch((error) => {
        console.error('Error during sign-out:', error);
        alert('Failed to sign out: ' + error.message);
    });
}*/
// Function to handle Sign-Out
export function signOut() {
    auth.signOut().then(() => {
        console.log('User signed out');

        window.location.href = "index.html"; // Redirect to index.html after sign-out
    }).catch((error) => {
        console.error('Error during sign-out:', error);
        alert('Failed to sign out: ' + error.message);
    });
}

// Function to hide all sections
function hideAllSections() {
    const formContainer = document.getElementById('formContainer');
    const messagesContainer = document.getElementById('messagesContainer');
    const sortAscBtn = document.getElementById('sortAscBtn');
    const sortDescBtn = document.getElementById('sortDescBtn');
    const sortMostLikedBtn = document.getElementById('sortMostLikedBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    formContainer.style.display = 'none';
    messagesContainer.style.display = 'none';
    sortAscBtn.style.display = 'none';
    sortDescBtn.style.display = 'none';
    sortMostLikedBtn.style.display = 'none';
    signOutBtn.style.display = 'none';
}
// Function to display user profile

/**
 * Retrieves a string value from Firebase database at the specified path
 * @param {string} path - The database path to retrieve the string from
 * @returns {Promise<string|null>} A promise that resolves with the string value or null if not found
 */
function getstringdb(path) {
    return new Promise((resolve, reject) => {
      // Create reference to the specified path
      const dbRef = firebase.database().ref(path);

      // Perform a one-time read
      dbRef.once('value')
        .then((snapshot) => {
          // Get the value (could be null if path doesn't exist)
          const value = snapshot.val();
        //   console.log(`Retrieved from ${path}:`, value);
          resolve(value);
        })
        .catch((error) => {
        //   console.error(`Error retrieving data from ${path}:`, error);
          reject(error);
        });
    });
  }

  // Example usage:
  // getstringdb('users/userId123/customDisplayName')
  //   .then(name => {
  //     console.log('The name is:', name);
  //     // Do something with the name
  //   })
  //   .catch(error => {
  //     console.error('Failed to get name:', error);
  //   });
function displayUserProfile(user) {
    if (!user) return;

    const userPhoto = document.getElementById('userPhoto');
    const userName = document.getElementById('userName');
    const usernamediv = document.getElementById('usernamediv');
    const mobileUserPhoto = document.getElementById('mobileUserPhoto');
    const mobileUserProfile = document.getElementById('mobileUserProfile');

    const photoURL = user.isAnonymous ? './images/suscat.jpg' :
                    (user && user.photoURL) ? user.photoURL :
                    user.photoURL || './images/suscat.jpg';

    if (userPhoto) userPhoto.src = photoURL;
    if (mobileUserPhoto) mobileUserPhoto.src = photoURL;

    // First check if anonymous mode is active
    firebase.database().ref(`users/${user.uid}/anonymProperties`).once('value')
        .then(anonymSnapshot => {
            const anonymData = anonymSnapshot.val();
            const isAnonymousMode = anonymData && anonymData.state === "true";
            const anonymUsername = anonymData && anonymData.username;

            // Then check for custom display name in database
            return getstringdb(`users/${user.uid}/customDisplayName`).then(customName => {
                // Set username - prioritize custom name over Google display name
                const regularName = user.isAnonymous ? 'Anonymous User' :
                                  customName ? customName :
                                  (user && user.displayName) ? user.displayName :
                                  'Anonymous User';

                // Determine final display name based on anonymous mode
                let displayName = regularName;

                // If anonymous mode is active and we have an anonymous username, show both names
                if (isAnonymousMode && anonymUsername && !user.isAnonymous) {
                    displayName = `${regularName} | ${anonymUsername}`;
                }

                // Update UI elements
                if (userName) userName.textContent = displayName;
                if (usernamediv) usernamediv.textContent = displayName;

                // If we have a custom display name from the database that doesn't match the current Firebase Auth displayName,
                // update the Firebase Auth profile to match
                if (customName && user.displayName !== customName && !user.isAnonymous) {
                    console.log('Syncing with username:', customName);
                    // Update the Firebase Auth display name
                    user.updateProfile({
                        displayName: customName
                    }).then(() => {
                        // console.log('Firebase Auth profile successfully updated with custom username');
                    }).catch(error => {
                        console.error('Error updating Firebase Auth profile:', error);
                    });
                }
            });
        })
        .catch(error => {
            console.error('Error checking anonymous mode:', error);
            // Fallback to default display name logic
            const displayName = user.isAnonymous ? 'Anonymous User' :
                              (user && user.displayName) ? user.displayName :
                              'Anonymous User';

            if (userName) userName.textContent = displayName;
            if (usernamediv) usernamediv.textContent = displayName;
        });

    // Show mobile profile section
    if (mobileUserProfile) mobileUserProfile.style.display = 'flex';
}

// Function to hide user profile
function hideUserProfile() {
    console.log('Hiding user profile');
    const userProfile = document.getElementById('userProfile');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const anonymousSignInBtn = document.getElementById('anonymousSignInBtn');
    const mainContent = document.getElementById('mainContent');
    const adminNotification = document.getElementById('adminNotification');
    const signOutBtn = document.getElementById('signOutBtn');
    if (userProfile && googleSignInBtn && anonymousSignInBtn && mainContent && adminNotification && signOutBtn) {
        userProfile.style.display = 'none';
        googleSignInBtn.style.display = 'block';
        anonymousSignInBtn.style.display = 'block';
        signOutBtn.style.display = 'none';
        mainContent.style.display = 'none';
        adminNotification.style.display = 'none';
    } else {
        console.error('One or more elements not found in the DOM.');
    }
}

// Add event listeners to your sign-in and sign-out buttons
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded");

    const elements = [
        { id: "googleSignInBtn", handler: googleSignIn },
        { id: "mobilegoogleSignInBtn", handler: googleSignIn },
        { id: "anonymousSignInBtn", handler: anonymousSignIn },
        { id: "mobileanonymousSignInBtn", handler: anonymousSignIn },
        { id: "signOutBtn", handler: signOut },
        { id: "mobilesignOutBtn", handler: signOut },
        // { id: "themeToggleBtn", handler: toggleTheme }
    ];

    elements.forEach(({ id, handler }) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("click", handler);
        } else {
            console.warn(`Element with id ${id} not found.`);
        }
    });
});
// References to Firebase services
export const db = firebase.database();
export const storage = firebase.storage();

export function loadUserMessages() {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.error('User not authenticated.');
        return;
    }

    const userMessagesList = document.getElementById('userMessagesList');
    if (!userMessagesList) {
        console.error('User messages list element not found in the DOM.');
        return;
    }

    const userMessagesRef = db.ref(dbConfig.messagesPath).orderByChild('userId').equalTo(user.uid);
    userMessagesRef.on('value', (snapshot) => {
        userMessagesList.innerHTML = ''; // Clear existing messages before appending new ones

        // Convert snapshot to array and sort by timestamp in descending order
        const messages = [];
        snapshot.forEach((childSnapshot) => {
            messages.push({
                id: childSnapshot.key,  // Use 'id' instead of 'key' for consistency
                ...childSnapshot.val()
            });
        });

        messages.sort((a, b) => b.timestamp - a.timestamp);

        // Render sorted messages
        messages.forEach((message) => {
            // Use the createMessageElement function from viewmsg.js
           const user = firebase.auth().currentUser
            const messageElement = creatusermsg(message, user);
            userMessagesList.appendChild(messageElement);
            loadReplies(message.id);
        });

        // Add refresh button after messages
        const refreshButton = document.createElement('button');
        refreshButton.textContent = 'Refresh';
        refreshButton.onclick = loadUserMessages;
        refreshButton.className = 'action-btn';
        refreshButton.style.marginTop = '10px';
        userMessagesList.appendChild(refreshButton);
    });
}
window.loadUserMessages = loadUserMessages;

function editUserPost(messageId) {
    const newText = prompt("Enter the new text for the post:");
    if (newText === null || newText.trim() === '') return;

    const messageRef = db.ref(`${dbConfig.messagesPath}/${messageId}`);
    messageRef.update({
        text: newText
    }).then(() => {
        showAlert('Post updated successfully!', 'success');
        loadUserMessages(); // Reload user messages to reflect the update
    }).catch((error) => {
        console.error('Failed to update post:', error);
        // showAlert('Failed to update post.', 'error');
    });
}
window.editUserPost = editUserPost;
// Function to delete a user's post
function deleteUserPost(messageId) {
    const confirmDelete = confirm("Are you sure you want to delete this post?");
    if (!confirmDelete) return;

    const messageRef = db.ref(`${dbConfig.messagesPath}/${messageId}`);
    messageRef.remove().then(() => {
        showAlert('Post deleted successfully!', 'success');
        loadUserMessages(); // Reload user messages to reflect the deletion
    }).catch((error) => {
        console.error('Failed to delete post:', error);
        // showAlert('Failed to delete post.', 'error');
    });
}
window.deleteUserPost = deleteUserPost;
// Function to load admin announcement


// Load the admin announcement on page load


 export function isAdmin() {
    const user = firebase.auth().currentUser;
    return user && adminRoles.admins.includes(user.uid);
}

// Function to sync custom username with Firebase Auth
function syncCustomUsername(user) {
    if (!user || user.isAnonymous) return;

    // Get custom username from database
    const userRef = firebase.database().ref(`users/${user.uid}/customDisplayName`);
    userRef.once('value')
        .then(snapshot => {
            const customName = snapshot.val();
            if (customName && customName !== user.displayName) {
                console.log('Syncing username with Auth profile on login:', customName);
                // Update Firebase Auth profile
                return user.updateProfile({
                    displayName: customName
                });
            }
        })
        .then(() => {
            if (window.location.pathname.includes('sendview.html')) {
                console.log('User profile updated with custom username');
            }
        })
        .catch(error => {
            console.error('Error syncing custom username:', error);
        });
}

