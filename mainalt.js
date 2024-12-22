// Firebase configuration
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

const auth = firebase.auth();
// References to Firebase services
const db = firebase.database();
const storage = firebase.storage();
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

// Function to handle Sign-Out
function signOut() {
    auth.signOut().then(() => {
        console.log('User signed out');
        hideUserProfile();
    }).catch((error) => {
        console.error('Error during sign-out:', error);
        alert('Failed to sign out: ' + error.message);
    });
}

// Function to display user profile
function displayUserProfile(user) {
    console.log('Displaying user profile');
    document.getElementById('userProfile').style.display = 'block';
    document.getElementById('googleSignInBtn').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('userPhoto').src = user.photoURL;
    document.getElementById('userName').textContent = user.displayName;
}

// Function to hide user profile
function hideUserProfile() {
    console.log('Hiding user profile');
    document.getElementById('userProfile').style.display = 'none';
    document.getElementById('googleSignInBtn').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
}

// Add event listeners to your sign-in and sign-out buttons
document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
    document.getElementById('googleSignInBtn').addEventListener('click', googleSignIn);
    document.getElementById('signOutBtn').addEventListener('click', signOut);
});

// Check authentication state on page load
auth.onAuthStateChanged((user) => {
    if (user) {
        displayUserProfile(user);
    } else {
        hideUserProfile();
    }
});
// Function to toggle the send message form
function toggleForm() {
    document.getElementById('formContainer').style.display = 'block';
    document.getElementById('messagesContainer').style.display = 'none';
}

// Function to send a message with an optional image
function sendMessage() {
    const messageInput = document.getElementById('messageInput').value;
    const imageInput = document.getElementById('imageInput').files[0];

    if (messageInput.trim() === '' && !imageInput) {
        alert("Message or image cannot be empty.");
        return;
    }

    // Create a new message reference
    const newMessageRef = db.ref('messages').push();
    const messageData = {
        text: messageInput || null,
        timestamp: Date.now(),
        likes: 0,
        replies: [],
        anonymous: true // Mark the message as anonymous
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
            }
        });
    }
}

// Function to reset form fields
function resetForm() {
    document.getElementById('messageInput').value = '';
    document.getElementById('imageInput').value = '';
}

// Function to show messages
function showMessages() {
    document.getElementById('formContainer').style.display = 'none';
    document.getElementById('messagesContainer').style.display = 'block';

    const messagesList = document.getElementById('messagesList');
    messagesList.innerHTML = ''; // Clear existing messages

    db.ref('messages').orderByChild('timestamp').on('value', (snapshot) => {
        const messages = [];
        snapshot.forEach((childSnapshot) => {
            const messageData = childSnapshot.val();
            messages.push({ id: childSnapshot.key, ...messageData });
        });

        messagesList.innerHTML = '';
        messages.reverse().forEach((message) => {
            const messageText = message.text || 'No text provided';
            const timestamp = message.timestamp;
            const likes = message.likes || 0;
            const imageUrl = message.imageUrl || null;

            // Create message list item
            const li = document.createElement('li');
            li.innerHTML = `
                <p>${messageText}</p>
                ${imageUrl ? `<img src="${imageUrl}" alt="Message Image" style="max-width: 100%; height: auto;">` : ''}
                <span class="timestamp">${new Date(timestamp).toLocaleString()}</span>
                <button onclick="likeMessage('${message.id}')">Like (${likes})</button>
                <button onclick="replyToMessage('${message.id}')">Reply</button>
                <ul class="replies" id="replies-${message.id}"></ul>
            `;
            messagesList.appendChild(li);

            loadReplies(message.id);
        });
    });
}

// Function to like a message
function likeMessage(messageId) {
    const messageRef = db.ref('messages/' + messageId);
    messageRef.transaction((message) => {
        if (message) {
            message.likes = (message.likes || 0) + 1;
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
