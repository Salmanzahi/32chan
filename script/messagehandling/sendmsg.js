import { isAdmin, db, storage, loadUserMessages} from "../../mainalt.js";
import { dbConfig } from "../../config.js";
import { showAlert } from "../alert/alert.js";
import { getSelectedSpotifyTrack } from "../spotify/spotify.js";

export function sendMessage() {
    const titleInput = document.getElementById('titleInput').value;
    const messageInput = document.getElementById('messageInput').value;
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

    // Create a new message reference
    const newMessageRef = db.ref(dbConfig.messagesPath).push();
    const showProfile = document.getElementById('showProfileToggle').checked;
    
    // Get selected Spotify track if any
    const spotifyTrack = getSelectedSpotifyTrack();
    
    const messageData = {
        title: titleInput || null,
        text: messageInput || null,
        timestamp: Date.now(),
        userId: user.uid,
        replies: [],
        showProfile: showProfile,
        spotifyTrack: spotifyTrack
    };
    
    // Add user profile data if toggle is checked
    if (showProfile) {
        messageData.userDisplayName = user.displayName || 'Anonymous';
        messageData.userPhotoURL = user.photoURL || './images/suscat.jpg';
    }


  

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
                showAlert('Failed to upload image.', 'error');
            }, 
            () => {
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    messageData.imageUrl = downloadURL;
                    newMessageRef.set(messageData, (error) => {
                        if (error) {
                            console.error('Failed to save message:', error);
                            showAlert('Failed to save message.', 'error');
                        } else {
                            showAlert('Message sent successfully!', 'success');
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
                showAlert('Failed to save message.', 'error');
            } else {
                showAlert('Message sent successfully!', 'success');
                resetForm();
                loadUserMessages(); // Load user messages after sending a new one
            }
        });
    }
}
window.sendMessage = sendMessage;

export function resetForm() {
    const messageInput = document.getElementById('messageInput');
    const imageInput = document.getElementById('imageInput');
    const titleInput = document.getElementById('titleInput');

    if (messageInput && imageInput) {
        messageInput.value = '';
        imageInput.value = '';
        titleInput.value = '';
        
        // Clear selected Spotify track if any
        if (window.clearSelectedSpotifyTrack) {
            window.clearSelectedSpotifyTrack();
        }
    } else {
        console.error('One or more form elements not found in the DOM.');
    }
}
window.resetForm = resetForm;