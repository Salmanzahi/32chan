/*
WHAT ARE U DOING IN HERE ?
KASIHANI AKU PLS JANGAN DI HACK WEB KU PLS !!!

*/ 
import { adminRoles } from './role.js';
import { firebaseConfig } from './p.js';
import { dbConfig } from './config.js';
// Import adminAnnouncement from config.js - used in loadAdminAnnouncement function
import { adminAnnouncement } from './config.js';
import { showMessages } from './script/messagehandling/viewmsg.js'
// x
const script = document.createElement('script');
script.src = "./role.js"
script.src = "./p.js"

document.head.appendChild(script);
const auth = firebase.auth();
export const user = auth.currentUser;


/*  */



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
        console.log("Auth state changed. User:", user);
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
          console.log(`Retrieved from ${path}:`, value);
          resolve(value);
        })
        .catch((error) => {
          console.error(`Error retrieving data from ${path}:`, error);
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
                    console.log('Syncing Firebase Auth profile with custom username:', customName);
                    // Update the Firebase Auth display name
                    user.updateProfile({
                        displayName: customName
                    }).then(() => {
                        console.log('Firebase Auth profile successfully updated with custom username');
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
    console.log("DOM fully loaded and parsed");

    const elements = [
        { id: "googleSignInBtn", handler: googleSignIn },
        { id: "mobilegoogleSignInBtn", handler: googleSignIn },
        { id: "anonymousSignInBtn", handler: anonymousSignIn },
        { id: "mobileanonymousSignInBtn", handler: anonymousSignIn },
        { id: "signOutBtn", handler: signOut },
        { id: "mobilesignOutBtn", handler: signOut },
        { id: "themeToggleBtn", handler: toggleTheme }
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


//window.loadReplies = loadReplies;
// Function to toggle dark/light mode
function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');
}

// Load messages on page load
// document.addEventListener('DOMContentLoaded', (event) => {
//     showMessages();
//     loadUserMessages();

//     // Show admin name input field if the user is an admin
//     // Show admin name input field if the user is an admin
//     auth.onAuthStateChanged((user) => {
//         if (user && isAdmin()) {
//             document.getElementById('adminNameContainer').style.display = 'block';
//         }
//     });
// });

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
                key: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        
        messages.sort((a, b) => b.timestamp - a.timestamp);

        // Render sorted messages
        messages.forEach((messageData) => {
            const messageTitle = messageData.title || 'No title';
            const messageText = messageData.text || 'No text provided';
            const timestamp = messageData.timestamp;
            const imageUrl = messageData.imageUrl || null;

            // Create message list item
            const li = document.createElement('li');
            li.innerHTML = `
                 <div class="header">
                    <div class="title" style="font-weight: bold; font-size: 1.2em;">${messageTitle}</div>
                    <div class="timestamp">${new Date(timestamp).toLocaleString()}</div>
                </div>
                <div class="content">
                    <p class="message-text">${messageText.replace(/\n/g, '<br>')}</p>
                    ${imageUrl ? `<img src="${imageUrl}" alt="Message Image" style="max-width: 100%; height: auto;">` : ''}
                </div>
                <div class="actions">
                    <button onclick="editUserPost('${messageData.key}')">Edit</button>
                    <button onclick="deleteUserPost('${messageData.key}')">Delete</button>
                </div>
            `;
            userMessagesList.appendChild(li);
        });
    });
}

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
                console.log('Syncing custom username with Auth profile on login:', customName);
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

