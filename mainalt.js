/*
WHAT ARE U DOING IN HERE ?
KASIHANI AKU PLS JANGAN DI HACK WEB KU PLS !!!

*/ 
import { adminRoles } from './role.js';
import { firebaseConfig } from './p.js';
import { dbConfig } from './config.js';
// Import adminAnnouncement from config.js - used in loadAdminAnnouncement function
import { adminAnnouncement } from './config.js';


const script = document.createElement('script');
script.src = "./role.js"
script.src = "./p.js"
document.head.appendChild(script);
const auth = firebase.auth();


function sanitizeText(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                console.log('Notification permission granted.');
            } else {
                console.log('Notification permission denied.');
            }
        });
    } else {
        console.log('This browser does not support notifications.');
    }
}

// Send a notification
function sendNotification(title, options) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, options);
    }
}
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
        if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
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
       
       }        // if (user) {
        //         if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
        //             console.log("Redirecting to sendview.html");
        //             window.location.replace('sendview.html');
        //         }
                
        //         if (!user.isAnonymous) {
        //             requestNotificationPermission();
        //         }
        //     } else {
        //         hideUserProfile();
        //         if (window.location.pathname.includes('sendview.html')) {
        //             console.log("Redirecting to index.html");
        //             window.location.replace('index.html');
        //         }
        //     }
        //     displayUserProfile(user);
        //     loadUserMessages();
       
        displayUserProfile(user);
        loadUserMessages();
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
        //hideUserProfile();
        //hideAllSections(); // Hide all sections when the user signs out
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
    // console.log('Displaying user profile');
    // const userProfile = document.getElementById('userProfile');
    // const googleSignInBtn = document.getElementById('googleSignInBtn');
    // const anonymousSignInBtn = document.getElementById('anonymousSignInBtn');
    // const mainContent = document.getElementById('mainContent');
    // const userPhoto = document.getElementById('userPhoto');
    // const userName = document.getElementById('userName');
    // const adminNotification = document.getElementById('adminNotification');
    // const signOutBtn = document.getElementById('signOutBtn');
    // if (userProfile && googleSignInBtn && anonymousSignInBtn && mainContent && userPhoto && userName && signOutBtn) {
    //     userProfile.style.display = 'block';
    //     googleSignInBtn.style.display = 'none';
    //     anonymousSignInBtn.style.display = 'none';
    //     signOutBtn.style.display = 'block';
    //     mainContent.style.display = 'block';
       
    // } else {
    //     console.error('One or more elements not found in the DOM.');
    // }
    const mobileUserPhoto = document.getElementById('mobileUserPhoto');
    const mobileUserName = document.getElementById('mobileUserName');
    const mobileUserProfile = document.getElementById('mobileUserProfile');
    userPhoto.src = user.photoURL || './images/suscat.jpg';
    userName.textContent = user.displayName || 'Anonymous';
    mobileUserPhoto.src = user.photoURL || './images/suscat.jpg';
    // mobileUserName.textContent = user.displayName || 'Anonymous';
    mobileUserProfile.style.display = 'flex';
    

    
     

     // Check if user is an admin
     if (adminRoles.admins.includes(user.uid)) {
        adminNotification.style.display = 'block';
    } else {
        adminNotification.style.display = 'none';
    }
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
const db = firebase.database();
const storage = firebase.storage();
function toggleView() {
    const formContainer = document.getElementById('formContainer');
    const messagesContainer = document.getElementById('messagesContainer');
    const sortAscBtn = document.getElementById('sortAscBtn');
    const sortDescBtn = document.getElementById('sortDescBtn');
    const sortMostLikedBtn = document.getElementById('sortMostLikedBtn');
    const userMessagesList = document.getElementById('userMessagesList');
    if (formContainer.style.display === 'none') {
        formContainer.style.display = 'block';
        messagesContainer.style.display = 'none';
        sortAscBtn.style.display = 'none';
        sortDescBtn.style.display = 'none';
        sortMostLikedBtn.style.display = 'none';
        userMessagesList.style.display = 'block';
    } else {
        formContainer.style.display = 'none';
        userMessagesList.style.display = 'none';
        messagesContainer.style.display = 'block';
        sortAscBtn.style.display = 'inline-block';
        sortDescBtn.style.display = 'inline-block';
        sortMostLikedBtn.style.display = 'inline-block';
        showMessages(); // Load all messages when showing the messages container
    }
}

window.toggleView = toggleView;

// Function to send a message with an optional image
function sendMessage() {
    const titleInput = document.getElementById('titleInput').value;
    const messageInput = document.getElementById('messageInput').value;
    const imageInput = document.getElementById('imageInput').files[0];
    const adminNameInput = document.getElementById('adminNameInput').value;
    const user = firebase.auth().currentUser;

    if (isAdmin()) {
        adminNameContainer.style.display = 'block';
    }

    if (!user) {
        alert("User not authenticated.");
        return;
    }

    if (titleInput.trim() === '' || (messageInput.trim() === '' && !imageInput)) {
        alert("Title and message or image cannot be empty.");
        return;
    }

    // Create a new message reference
    const newMessageRef = db.ref(dbConfig.messagesPath).push();
    const messageData = {
        title: titleInput || null,
        text: messageInput || null,
        timestamp: Date.now(),
        userId: user.uid,
        replies: []
    };


  

    if (imageInput) {
        // Upload image to Firebase Storage
        const storageRef = storage.ref('images/' + newMessageRef.key + '_' + imageInput.name);
        const uploadTask = storageRef.put(imageInput);

        uploadTask.on('state_changed', 
            (snapshot) => {
                // Observe state change events such as progress, pause, and resume
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
            }, 
            (error) => {
                console.error('Upload failed:', error);
                alert('Failed to upload image.');
            }, 
            () => {
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    messageData.imageUrl = downloadURL;
                    newMessageRef.set(messageData, (error) => {
                        if (error) {
                            console.error('Failed to save message:', error);
                            alert('Failed to save message.');
                        } else {
                            alert('Message sent successfully!');
                            resetForm();
                            loadUserMessages(); // Load user messages after sending a new one
                        }
                    });
                });
            }
        );
    } else {
        newMessageRef.set(messageData, (error) => {
            if (error) {
                console.error('Failed to save message:', error);
                alert('Failed to save message.');
            } else {
                showAlert('Message sent successfully!', 'success');
                resetForm();
                loadUserMessages(); // Load user messages after sending a new one
            }
        });
    }
}
window.sendMessage = sendMessage;
// Function to reset form fields
function resetForm() {
    const messageInput = document.getElementById('messageInput');
    const imageInput = document.getElementById('imageInput');

    if (messageInput && imageInput) {
        messageInput.value = '';
        imageInput.value = '';
    } else {
        console.error('One or more form elements not found in the DOM.');
    }
}
//window.resetForm = resetForm;
// Function to show and load messages
function showMessages(sortOrder = 'desc') {
    const messagesList = document.getElementById('messagesList');
    const sortButtons = document.querySelectorAll('.buttons button');

    if (messagesList) {
        messagesList.innerHTML = ''; 

        sortButtons.forEach(button => button.classList.remove('active'));
        if (sortOrder === 'asc') {
            document.getElementById('sortAscBtn').classList.add('active');
        } else if (sortOrder === 'desc') {
            document.getElementById('sortDescBtn').classList.add('active');
        } else if (sortOrder === 'mostLiked') {
            document.getElementById('sortMostLikedBtn').classList.add('active');
        }

        const messagesRef = db.ref(dbConfig.messagesPath);
        messagesRef.off('value'); // Detach any existing listener

        messagesRef.on('value', (snapshot) => {
            const messages = [];
            snapshot.forEach((childSnapshot) => {
                const messageData = childSnapshot.val();
                messages.push({ id: childSnapshot.key, ...messageData });
            });

            // Sort messages based on the selected sort order
            if (sortOrder === 'asc') {
                messages.sort((a, b) => a.timestamp - b.timestamp);
            } else if (sortOrder === 'desc') {
                messages.sort((a, b) => b.timestamp - a.timestamp);
            } else if (sortOrder === 'mostLiked') {
                messages.sort((a, b) => (b.likes || 0) - (a.likes || 0));
            }

            // Append sorted messages to the DOM
            messages.forEach((message) => {
                const safeTitle = sanitizeText(message.title || 'Legacy Post');
                const safeAdminName = message.adminName ? sanitizeText(message.adminName) : null;
                const safeMessageText = sanitizeText(message.text || 'No text provided');
                const timestamp = message.timestamp;
                const imageUrl = message.imageUrl ? sanitizeText(message.imageUrl) : null;
                const likes = message.likes || 0;

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

                li.innerHTML = `
                    <div class="header">
                        ${safeAdminName ? `<div class="admin-badge" style="color: red;">Administrator (${safeAdminName})</div>` : ''}
                        <div class="title" style="font-weight: bold; font-size: 1.2em;">${safeTitle}</div>
                        <div class="timestamp">${new Date(timestamp).toLocaleString()}</div>
                    </div>
                    <div class="content">
                        <p style="color:#ffff">${safeMessageText}</p>
                        ${imageUrl ? `<img src="${imageUrl}" alt="Message Image" style="max-width: 100%; height: auto;">` : ''}
                    </div>
                    <div class="actions">
                        <button onclick="toggleLike('${message.id}')">Like (${likes})</button>
                        <button onclick="replyToMessage('${message.id}')">Reply</button>
                        <div class="like-count">${likes} likes</div>
                        ${isAdmin() ? `
                            <button onclick="editPost('${message.id}')">Edit</button>
                            <button onclick="deletePost('${message.id}')">Delete</button>
                        ` : ''}
                    </div>
                    <ul class="replies" id="replies-${message.id}"></ul>
                `;
                messagesList.appendChild(li);

                loadReplies(message.id);
            });
        });

        // Listen for new posts and send notifications
        messagesRef.on('child_added', (snapshot) => {
            const messageData = snapshot.val();
            const title = sanitizeText(messageData.title || 'New Post');
            const options = {
                body: sanitizeText(messageData.text || 'No text provided'),
                icon: messageData.imageUrl ? sanitizeText(messageData.imageUrl) : 'default-icon.png'
            };
            sendNotification(title, options);
        });

    } else {
        console.error('Messages list element not found in the DOM.');
    }
}
window.showMessages = showMessages;
function isAdmin() {
    const user = firebase.auth().currentUser;
    return user && adminRoles.admins.includes(user.uid);
}

// Function to edit a post
function editPost(messageId) {
    /*const newText = prompt("Enter the new text for the post:");
    if (newText === null || newText.trim() === '') return;

    const messageRef = db.ref(`messages/${messageId}`);
    messageRef.update({
        text: newText
    }).then(() => {
        showAlert('Post updated successfully!', 'success');
        // Update the post in real-time
        const postElement = document.querySelector(`li[data-id="${messageId}"] .content p`);
        if (postElement) {
            postElement.textContent = newText;
        }
    }).catch((error) => {
        console.error('Failed to update post:', error);
        showAlert('Failed to update post.', 'error');
    });*/
    const newText = prompt("Enter the new text for the post:");
    if (newText === null || newText.trim() === '') return;

    const messageRef = db.ref(`${dbConfig.messagesPath}/${messageId}`);
    messageRef.update({
        text: newText
    }).then(() => {
        showAlert('Post updated successfully!', 'success');
        if (isAdmin()) {
            setTimeout(() => {
                window.location.href = '#messagesContainer';
                location.reload();
            }, 1000);
        }
    }).catch((error) => {
        console.error('Failed to update post:', error);
        showAlert('Failed to update post.', 'error');
    });
}
window.editPost = editPost;
// Function to delete a post
function deletePost(messageId) {
    const confirmDelete = confirm("Are you sure you want to delete this post?");
    if (!confirmDelete) return;

    const messageRef = db.ref(`${dbConfig.messagesPath}/${messageId}`);
    messageRef.remove().then(() => {
        showAlert('Post deleted successfully!', 'success');
        if (isAdmin()) {
            setTimeout(() => {
                window.location.href = '#messagesContainer';
                location.reload();
            }, 1000);
        }
    }).catch((error) => {
        console.error('Failed to delete post:', error);
        showAlert('Failed to delete post.', 'error');
    });
}
window.deletePost = deletePost;
function toggleLike(messageId) {
    
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("User not authenticated.");
        return;
    }

    const messageRef = db.ref(`${dbConfig.messagesPath}/${messageId}`);
    messageRef.transaction((message) => {
        if (message) {
            if (!message.likes) {
                message.likes = 0;
            }
            if (!message.likedBy) {
                message.likedBy = {};
            }

            if (message.likedBy[user.uid]) {
                message.likes -= 1;
                delete message.likedBy[user.uid];
            } else {
                message.likes += 1;
                message.likedBy[user.uid] = true;
            }
        }
        return message;
    });

}


window.toggleLike = toggleLike;
// Function to reply to a message
function replyToMessage(messageId) {

   
    const replyText = prompt("Enter your reply:");
    if (replyText === null || replyText.trim() === '') return;

    const repliesRef = db.ref(`${dbConfig.messagesPath}/${messageId}/replies`);
    const newReplyRef = repliesRef.push();
    newReplyRef.set({
        text: replyText,
        timestamp: Date.now()
    }).then(() => {
        showAlert('Reply added successfully!', 'success');
        // showMessages();
    }).catch((error) => {
        console.error('Failed to add reply:', error);
        showAlert('Failed to add reply :(', 'error');
    });
}
window.replyToMessage = replyToMessage;
function toggleViewToMessages() {
    const formContainer = document.getElementById('formContainer');
    const viewMessagesContainer = document.getElementById('viewMessagesContainer');
    const sortAscBtn = document.getElementById('sortAscBtn');
    const sortDescBtn = document.getElementById('sortDescBtn');
    const sortMostLikedBtn = document.getElementById('sortMostLikedBtn');

    formContainer.style.display = 'none';
    userMessagesList.style.display = 'none';
    viewMessagesContainer.style.display = 'block';
    sortAscBtn.style.display = 'block';
    sortDescBtn.style.display = 'block';
    sortMostLikedBtn.style.display = 'block';
}
window.toggleViewToMessages = toggleViewToMessages;
// Function to load replies for a specific message
function loadReplies(messageId) {
    const repliesList = document.getElementById(`replies-${messageId}`);
    if (!repliesList) {
        console.error(`Element with id replies-${messageId} not found.`);
        return;
    }
    repliesList.innerHTML = '';

    const repliesRef = db.ref(`${dbConfig.messagesPath}/${messageId}/replies`);
    repliesRef.on('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const replyData = childSnapshot.val();
            const replyText = sanitizeText(replyData.text);
            const replyTimestamp = replyData.timestamp;

            const li = document.createElement('li');
            li.style.backgroundColor = "#1e1e1e";
            li.style.color = "#fff";
            li.style.border = "1px solid #333";
            li.innerHTML = `
                <p>${replyText}</p>
                <span class="timestamp">${new Date(replyTimestamp).toLocaleString()}</span>
            `;
            repliesList.appendChild(li);
        });
    });
}
window.loadReplies = loadReplies;
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

function loadUserMessages() {
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
        snapshot.forEach((childSnapshot) => {
            const messageData = childSnapshot.val();
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
                    <button onclick="editUserPost('${childSnapshot.key}')">Edit</button>
                    <button onclick="deleteUserPost('${childSnapshot.key}')">Delete</button>
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
        showAlert('Failed to update post.', 'error');
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
        showAlert('Failed to delete post.', 'error');
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
document.addEventListener('DOMContentLoaded', (event) => {
    loadAdminAnnouncement();
   
});
