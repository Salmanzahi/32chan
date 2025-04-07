import { editPost, deletePost, toggleLike }  from "./CRUDpost.js";
import { replyToMessage,  toggleViewToMessages, loadReplies, hideReplyForm, showReplyForm, submitReply} from "./replyhandling.js"
import { sendMessage, resetForm } from "./sendmsg.js"
import { toggleView } from "./toggleview.js";
import {showMessages} from "./viewmsg.js"
import { initSpotify, initSpotifySearchUI } from "../spotify/spotify.js";
// Share post feature has been removed
// import { shareMessage } from "./share.js";





window.toggleView = toggleView;
window.toggleLike = toggleLike;
window.shareMessage = shareMessage;
window.deletePost = deletePost;
window.editPost = editPost;
window.submitReply = submitReply;
window.replyToMessage = replyToMessage;
window.toggleViewToMessages = toggleViewToMessages;
window.loadReplies = loadReplies;
window.hideReplyForm = hideReplyForm;
window.sendMessage = sendMessage;
window.resetForm = resetForm;
window.showMessages = showMessages;
window.showReplyForm = showReplyForm;

// Initialize Spotify functionality when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Spotify authentication
    initSpotify();
    
    // Initialize Spotify search UI in the message form
    initSpotifySearchUI();
});