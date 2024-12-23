// Firebase configuration
const script = document.createElement('script');
script.src = "./role.js"
document.head.appendChild(script);
const firebaseConfig = {
    apiKey: "AIzaSyAYRcDk0UkOh9w7o1umQ_cDkPVxVOQojAw",
    authDomain: "db-test-6a570.firebaseapp.com",
    databaseURL: "https://db-test-6a570-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "db-test-6a570",
    storageBucket: "db-test-6a570.appspot.com",
    messagingSenderId: "1022540875615",
    appId: "1:1022540875615:web:a76667f79e2d7cc21998ea",
    measurementId: "G-80MH658TNG"
};
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
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
            displayUserProfile(user);
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
        })
        .catch((error) => {
            console.error('Error during anonymous sign-in:', error);
            alert('Failed to sign in anonymously: ' + error.message);
        });
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
        hideUserProfile();
        hideAllSections(); // Hide all sections when the user signs out
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

    formContainer.style.display = 'none';
    messagesContainer.style.display = 'none';
    sortAscBtn.style.display = 'none';
    sortDescBtn.style.display = 'none';
    sortMostLikedBtn.style.display = 'none';
}
// Function to display user profile
function displayUserProfile(user) {
    console.log('Displaying user profile');
    const userProfile = document.getElementById('userProfile');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const anonymousSignInBtn = document.getElementById('anonymousSignInBtn');
    const mainContent = document.getElementById('mainContent');
    const userPhoto = document.getElementById('userPhoto');
    const userName = document.getElementById('userName');
    const adminNotification = document.getElementById('adminNotification');
    if (userProfile && googleSignInBtn && anonymousSignInBtn && mainContent && userPhoto && userName) {
        userProfile.style.display = 'block';
        googleSignInBtn.style.display = 'none';
        anonymousSignInBtn.style.display = 'none';
        mainContent.style.display = 'block';
        if (user.photoURL) {
            userPhoto.src = user.photoURL;
        }
        userName.textContent = user.displayName || 'Anonymous User';

         // Check if user is an admin
         if (adminRoles.admins.includes(user.uid)) {
            adminNotification.style.display = 'block';
        } else {
            adminNotification.style.display = 'none';
        }
    } else {
        console.error('One or more elements not found in the DOM.');
    }
}

// Function to hide user profile
function hideUserProfile() {
    console.log('Hiding user profile');
    const userProfile = document.getElementById('userProfile');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const anonymousSignInBtn = document.getElementById('anonymousSignInBtn');
    const mainContent = document.getElementById('mainContent');

    if (userProfile && googleSignInBtn && anonymousSignInBtn && mainContent) {
        userProfile.style.display = 'none';
        googleSignInBtn.style.display = 'block';
        anonymousSignInBtn.style.display = 'block';
        mainContent.style.display = 'none';
    } else {
        console.error('One or more elements not found in the DOM.');
    }
}

// Add event listeners to your sign-in and sign-out buttons
document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const anonymousSignInBtn = document.getElementById('anonymousSignInBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    const themeToggleBtn = document.getElementById('themeToggleBtn');

    if (googleSignInBtn && anonymousSignInBtn && signOutBtn && themeToggleBtn) {
        googleSignInBtn.addEventListener('click', googleSignIn);
        anonymousSignInBtn.addEventListener('click', anonymousSignIn);
        signOutBtn.addEventListener('click', signOut);
        themeToggleBtn.addEventListener('click', toggleTheme);
    } else {
        console.error('One or more buttons not found in the DOM.');
    }
});

// Check authentication state on page load
auth.onAuthStateChanged((user) => {
    if (user) {
        displayUserProfile(user);
    } else {
        hideUserProfile();
    }
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

    if (formContainer.style.display === 'none') {
        formContainer.style.display = 'block';
        messagesContainer.style.display = 'none';
        sortAscBtn.style.display = 'none';
        sortDescBtn.style.display = 'none';
        sortMostLikedBtn.style.display = 'none';
        loadUserMessages(); // Load user messages when showing the form
    } else {
        formContainer.style.display = 'none';
        messagesContainer.style.display = 'block';
        sortAscBtn.style.display = 'inline-block';
        sortDescBtn.style.display = 'inline-block';
        sortMostLikedBtn.style.display = 'inline-block';
        showMessages(); // Load all messages when showing the messages container
    }
}
// Function to toggle the send message form
function toggleForm() {
    const formContainer = document.getElementById('formContainer');
    const messagesContainer = document.getElementById('messagesContainer');

    if (formContainer.style.display === 'none') {
        formContainer.style.display = 'block';
        messagesContainer.style.display = 'none';
        loadUserMessages();
    } else {
        formContainer.style.display = 'none';
        messagesContainer.style.display = 'block';
    }
}

// Function to toggle the view messages section
function toggleMessages() {
    const formContainer = document.getElementById('formContainer');
    const messagesContainer = document.getElementById('messagesContainer');

    if (messagesContainer.style.display === 'none') {
        messagesContainer.style.display = 'block';
        formContainer.style.display = 'none';
    } else {
        messagesContainer.style.display = 'none';
        formContainer.style.display = 'block';
    }
}

// Function to send a message with an optional image
function sendMessage() {
    const messageInput = document.getElementById('messageInput').value;
    const imageInput = document.getElementById('imageInput').files[0];
    const user = firebase.auth().currentUser;

    if (!user) {
        alert("User not authenticated.");
        return;
    }

    if (messageInput.trim() === '' && !imageInput) {
        alert("Message or image cannot be empty.");
        return;
    }

    // Create a new message reference
    const newMessageRef = db.ref('messages').push();
    const messageData = {
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
                alert('Message sent successfully!');
                resetForm();
                loadUserMessages(); // Load user messages after sending a new one
            }
        });
    }
}

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

// Function to show and load messages
function showMessages(sortOrder = 'desc') {
    const messagesList = document.getElementById('messagesList');
    const sortButtons = document.querySelectorAll('.buttons button');

    if (messagesList) {
        messagesList.innerHTML = ''; // Clear existing messages before appending new ones

        // Highlight the selected sort button
        sortButtons.forEach(button => button.classList.remove('active'));
        if (sortOrder === 'asc') {
            document.getElementById('sortAscBtn').classList.add('active');
        } else if (sortOrder === 'desc') {
            document.getElementById('sortDescBtn').classList.add('active');
        } else if (sortOrder === 'mostLiked') {
            document.getElementById('sortMostLikedBtn').classList.add('active');
        }

        db.ref('messages').on('value', (snapshot) => {
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
                const messageText = message.text || 'No text provided';
                const timestamp = message.timestamp;
                const imageUrl = message.imageUrl || null;
                const likes = message.likes ? message.likes.length : 0;
                // Create message list item
                const li = document.createElement('li');
                li.innerHTML = `
                    <p>${messageText}</p>
                    ${imageUrl ? `<img src="${imageUrl}" alt="Message Image" style="max-width: 100%; height: auto;">` : ''}
                    <span class="timestamp">${new Date(timestamp).toLocaleString()}</span>
                    <button onclick="toggleLike('${message.id}')">Like (${likes})</button>
                    <button onclick="replyToMessage('${message.id}')">Reply</button>
                    <ul class="replies" id="replies-${message.id}"></ul>
                `;
                messagesList.appendChild(li);

                loadReplies(message.id);
            });
        });
    } else {
        console.error('Messages list element not found in the DOM.');
    }
}
function toggleLike(messageId) {
    const messageRef = db.ref(`messages/${messageId}`);
    messageRef.transaction((message) => {
        if (message) {
            if (message.likes && message.likes.includes(auth.currentUser.uid)) {
                message.likes = message.likes.filter(uid => uid !== auth.currentUser.uid);
            } else {
                message.likes = message.likes || [];
                message.likes.push(auth.currentUser.uid);
            }
        }
        return message;
    });
}
// Function to reply to a message
function replyToMessage(messageId) {
    const replyText = prompt("Enter your reply:");
    if (replyText === null || replyText.trim() === '') return;

    const repliesRef = db.ref(`messages/${messageId}/replies`);
    repliesRef.push({
        text: replyText,
        timestamp: Date.now()
    });
}

// Function to load replies for a specific message
function loadReplies(messageId) {
    const repliesList = document.getElementById(`replies-${messageId}`);
    if (!repliesList) {
        console.error(`Element with id replies-${messageId} not found.`);
        return;
    }
    repliesList.innerHTML = '';

    const repliesRef = db.ref(`messages/${messageId}/replies`);
    repliesRef.on('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const replyData = childSnapshot.val();
            const replyText = replyData.text;
            const replyTimestamp = replyData.timestamp;

            const li = document.createElement('li');
            li.innerHTML = `
                <p>${replyText}</p>
                <span class="timestamp">${new Date(replyTimestamp).toLocaleString()}</span>
            `;
            repliesList.appendChild(li);
        });
    });
}

// Function to toggle dark/light mode
function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');
}

// Load messages on page load
document.addEventListener('DOMContentLoaded', (event) => {
    showMessages();
});
