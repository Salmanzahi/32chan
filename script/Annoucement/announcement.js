import { dbConfig, adminAnnouncement } from "../../config.js";

export function loadAdminAnnouncement() {
    const announcementText = document.getElementById('announcement-content');
   
    // Fetch the announcement content from the imported configuration
    const announcementContent = `${adminAnnouncement.announcement}`;

    if (announcementContent) {
        announcementText.textContent = announcementContent;
    } 
}

// Add this line to call the function when the module loads
document.addEventListener('DOMContentLoaded', loadAdminAnnouncement);

window.loadAdminAnnouncement = loadAdminAnnouncement;