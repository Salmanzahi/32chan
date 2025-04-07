// Global functions that need to be accessible from HTML onclick handlers

// Import the functions from the modules
import { sendMessage as sendMessageModule } from './messagehandling/sendmsg.js';
import { toggleView as toggleViewModule } from './messagehandling/toggleview.js';
import { showMessages as showMessagesModule } from './messagehandling/viewmsg.js';
import { loadUserMessages as loadUserMessagesModule } from '../mainalt.js';

// Make them available globally
window.sendMessage = sendMessageModule;
window.toggleView = toggleViewModule;
window.showMessages = showMessagesModule;
window.loadUserMessages = loadUserMessagesModule;

// Add any other functions that need to be globally accessible here
// Example: window.anotherFunction = anotherFunctionModule;