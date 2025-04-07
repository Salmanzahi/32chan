import { isAdmin, db, storage, loadUserMessages} from "../../mainalt.js";
import { dbConfig } from "../../config.js";
import { showAlert } from "../alert/alert.js";
import { saveRoomToHistory } from "./roomhistory.js";


export function createRoom() {
const room = document.getElementById("roomCreateName").value;
const code = document.getElementById("roomCreateCode").value;
const user = firebase.auth().currentUser;
const newMessageRef = db.ref(dbConfig.privateroomPath).push();
    const messageData = {
        room: room || null,
        code: code || null,
        timestamp: Date.now(),
        creator: user.uid,
    };

    

    newMessageRef.set(messageData, (error) => {
        if (error) {
            console.error('Failed to save message:', error);
            showAlert('Error saving room', 'error');
        } else {
            // Save room to history
            saveRoomToHistory(room, newMessageRef.key, true);
            
            showAlert('Room created successfully!', 'success');
            // Clear input fields after successful save
            document.getElementById("roomCreateName").value = '';
            document.getElementById("roomCreateCode").value = '';
        }
    });
}

window.createRoom = createRoom;

export function joinRoom() {
    const room = document.getElementById("roomJoinName").value;
    const code = document.getElementById("roomJoinCode").value;

const roomRef = db.ref(dbConfig.privateroomPath);
roomRef.orderByChild('room').equalTo(room).once('value')
    .then((snapshot) => {
        const rooms = snapshot.val();
        if (!rooms) {
            showAlert('Room not found', 'error');
            return;
        }

        // Check if room exists and code matches
        const roomKey = Object.keys(rooms)[0];
        const roomData = rooms[roomKey];
        
        if (roomData.code === code) {
            const user = firebase.auth().currentUser;
            
            // If user is the creator, no need to add to users list
            if (user.uid === roomData.creator) {
                // Save room to history (as creator)
                saveRoomToHistory(room, roomKey, true);
                
                showAlert('Successfully joined room!', 'success');
                document.getElementById("roomJoinName").value = '';
                document.getElementById("roomJoinCode").value = '';
                window.location.href = `room.html?id=${roomKey}`;
                return;
            }

            const roomUsersRef = db.ref(`${dbConfig.privateroomPath}/${roomKey}/users`);
            
            // Check if user already exists in the room
            roomUsersRef.orderByChild('userId').equalTo(user.uid).once('value')
                .then((snapshot) => {
                    if (!snapshot.exists()) {
                        // User doesn't exist in room, add them
                        const newUserRef = roomUsersRef.push();
                        const userData = {
                            userId: user.uid,
                            joinedAt: Date.now()
                        };
                        
                        return newUserRef.set(userData)
                            .then(() => {
                                // Save room to history (as member)
                                saveRoomToHistory(room, roomKey, false);
                                
                                showAlert('Successfully joined room!', 'success');
                                document.getElementById("roomJoinName").value = '';
                                document.getElementById("roomJoinCode").value = '';
                                window.location.href = `room.html?id=${roomKey}`;
                            });
                    }
                    // User already exists, no need to add again
                    // Update room in history (as member)
                    saveRoomToHistory(room, roomKey, false);
                    
                    showAlert('Successfully joined room!', 'success');
                    document.getElementById("roomJoinName").value = '';
                    document.getElementById("roomJoinCode").value = '';
                    window.location.href = `room.html?id=${roomKey}`;
                    return Promise.resolve();
                })
                .catch((error) => {
                    console.error('Failed to add user to room:', error);
                    showAlert('Error joining room', 'error');
                });
        } else {
            showAlert('Invalid room code', 'error');
        }
    })
    .catch((error) => {
        console.error('Error joining room:', error);
        showAlert('Error joining room', 'error');
    });
}
window.joinRoom = joinRoom;