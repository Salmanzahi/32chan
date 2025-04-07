import { isAdmin, db, storage, loadUserMessages} from "../../../mainalt.js";
import { dbConfig } from "../../../config.js";
import { showAlert } from "../../alert/alert.js";
import { getUrlParameter } from "../../fetchparam.js";
import { saveRoomToHistory } from "../roomhistory.js";

const param = getUrlParameter('id');

// Example of how the parameter would look in different URLs:
// https://yourdomain.com/private.html?id=room123
// https://yourdomain.com/private.html?id=privateRoom456
// https://yourdomain.com/private.html?id=secretChat789

document.addEventListener('DOMContentLoaded', () => {
    if (param) {
        showAlert(`Room ID: ${param}`, 'info');
        
        // Get room details to update history
        const roomRef = db.ref(`${dbConfig.privateroomPath}/${param}`);
        roomRef.once('value')
            .then((snapshot) => {
                const roomData = snapshot.val();
                if (roomData) {
                    const user = firebase.auth().currentUser;
                    if (user) {
                        // Update room in history with current timestamp
                        const isCreator = user.uid === roomData.creator;
                        saveRoomToHistory(roomData.room, param, isCreator);
                    }
                }
            })
            .catch((error) => {
                console.error('Error loading room details:', error);
            });
    }
});

