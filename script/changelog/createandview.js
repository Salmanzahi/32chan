import { isAdmin, db, storage } from "../../mainalt.js";
import { dbConfig } from "../../config.js";
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

    newMessageRef.set(messageData)
      .then(() => {
          showAlert("Changelog added successfully!", "success");
      })
      .catch(error => {
          showAlert("Error adding changelog: " + error.message, "error");
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