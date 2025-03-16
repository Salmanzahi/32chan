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

const script = document.createElement('script');
script.src = "./role.js"
script.src = "./p.js"
document.head.appendChild(script);
const auth = firebase.auth();







// Function to handle Google Sign-In
function googleSignIn() {
    console.log('Google Sign-In button clicked');
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            // The signed-in user info.
            const user = result.user;
            console.log('User signed in:', user);
            //displayUserProfile(user);
            window.location.href = "sendview.html"; // Redirect to sendview.html after authentication
        })
        .catch((error) => {
            console.error('Error during sign-in:', error);
            alert('Failed to sign in: ' + error.message);
        });
}

// Function to handle Anonymous Sign-In
function anonymousSignIn() {
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
        if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('changelog.html')) {
            document.getElementById('userProfile').style.display = 'block';
            document.getElementById('googleSignInBtn').style.display = 'none';
            document.getElementById('mobilegoogleSignInBtn').style.display = 'none';
            document.getElementById('anonymousSignInBtn').style.display = 'none';
            document.getElementById('mobileanonymousSignInBtn').style.display = 'none';
            document.getElementById('signOutBtn').style.display = 'block';
            document.getElementById('mobilesignOutBtn').style.display = 'block';
            document.getElementById('mobileUserProfile').style.display = 'block';
            console.log("Redirecting to sendview.html");
        }
       } else {
        if (window.location.pathname.includes('sendview.html')) {
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
       
       }        
        loadUserMessages();
        displayUserProfile(user);
     
    });
    
    
});
// Function to show an alert
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
function signOut() {
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
function displayUserProfile(user) {
   
    const mobileUserPhoto = document.getElementById('mobileUserPhoto');
    const mobileUserName = document.getElementById('mobileUserName');
    const mobileUserProfile = document.getElementById('mobileUserProfile');
    userPhoto.src = user.photoURL || './images/suscat.jpg';
    userName.textContent = user.displayName || 'Anonymous';
    mobileUserPhoto.src = user.photoURL || './images/suscat.jpg';
    mobileUserProfile.style.display = 'flex';
   
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
                    <p>${messageText}</p>
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
function loadAdminAnnouncement() {
    const announcementText = document.getElementById('announcementText');
    const announcementContainer = document.getElementById('adminAnnouncement');

    // Fetch the announcement content from the imported configuration
    const announcementContent = `${adminAnnouncement.announcement}`;

    if (announcementContent) {
        announcementText.textContent = announcementContent;
        announcementContainer.style.display = 'block';
    } else {
        announcementContainer.style.display = 'none';
    }
}

// Load the admin announcement on page load


 export function isAdmin() {
    const user = firebase.auth().currentUser;
    return user && adminRoles.admins.includes(user.uid);
}

