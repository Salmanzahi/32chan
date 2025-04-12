import { isAdmin, db, storage } from "../mainalt.js";
import { dbConfig } from "../config/config.js";
import { showAlert } from "../alert/alert.js";

export function addChangelog() {
    const changelogTitleInput = document.getElementById('changelogTitleInput').value;
    const changelogMsgInput = document.getElementById('changelogMsgInput').value;
    const user = firebase.auth().currentUser;

    if (!user) {
        alert("User not authenticated.");
        return;
    }

    // Create a new message reference and set the data
    const newMessageRef = db.ref(dbConfig.changelogPath).push();
    const messageData = {
        title: changelogTitleInput || null,
        text: changelogMsgInput || null,
        timestamp: Date.now(),
        userId: user.uid,
    };

    

    newMessageRef.set(messageData, (error) => {
        if (error) {
            console.error('Failed to save message:', error);
            showAlert('Error saving changelog', 'error');
        } else {
            // showAlert('Changelog saved successfully!', 'success');
            // Clear input fields after successful save
            showAlert('Changelog saved successfully!', 'success');
            document.getElementById('changelogTitleInput').value = '';
            document.getElementById('changelogMsgInput').value = '';
        }
    });
}

window.addChangelog = addChangelog;







// export function viewChangelog() {
//     const changelogContainer = document.getElementById('changelogContainer');
//     const changelogRef = db.ref(dbConfig.changelogPath);
//     changelogRef.on('value', (snapshot) => {
//         changelogContainer.innerHTML = '';
//         snapshot.forEach((childSnapshot) => {
//             const changelog = childSnapshot.val();
//             const changelogElement = document.createElement('div');
//             changelogElement.innerHTML = `
//                 <h3>${changelog.title}</h3>
//                 <p>${changelog.text}</p>
//             `;
//             changelogContainer.appendChild(changelogElement);
//         });
//     });
// }