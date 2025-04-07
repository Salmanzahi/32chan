/**
 * chat.js
 * Handles direct messaging functionality for 32chan
 */

import { db, storage } from '../../mainalt.js';
import { dbConfig } from '../../config.js';
import { showAlert } from '../../script/alert/alert.js';

// References to DOM elements
const userSearchInput = document.getElementById('userSearchInput');
const modalSearchInput = document.getElementById('modalSearchInput');
const searchResults = document.getElementById('searchResults');
const modalSearchResults = document.getElementById('modalSearchResults');
const conversationsList = document.getElementById('conversationsList');
const messagesContainer = document.getElementById('messagesContainer');
const messagesList = document.getElementById('messagesList');
const welcomeScreen = document.getElementById('welcomeScreen');
const messageInput = document.getElementById('messageInput');
const messageForm = document.getElementById('messageForm');
const chatHeader = document.getElementById('chatHeader');
const chatUserAvatar = document.getElementById('chatUserAvatar');
const chatUsername = document.getElementById('chatUsername');
const chatUserStatus = document.getElementById('chatUserStatus');
const messageInputContainer = document.getElementById('messageInputContainer');
const newChatBtn = document.getElementById('newChatBtn');
const userSearchModal = document.getElementById('userSearchModal');
const closeModalBtn = document.getElementById('closeModalBtn');

// Firebase auth
const auth = firebase.auth();

// Current chat state
let currentUser = null;
let currentChat = null;
let conversations = {};
let searchTimeout = null;
let usersCache = {};

// Add a session storage flag to track initial load
let hasInitializedChat = false;

// Initialize the chat page
function initChatPage() {
    // Check if user is authenticated
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Check if user is anonymous (only allow Google-signed users)
            if (user.isAnonymous) {
                showAlert('Direct messaging is only available for Google-signed users. Please sign in with Google.', 'error');
                setTimeout(() => {
                    window.location.href = './index.html';
                }, 3000);
                return;
            }
            
            // Set current user
            currentUser = user;
            
            // Set up listeners
            setupEventListeners();
            
            // Load conversations and handle initial view
            loadUserConversations();
        } else {
            // No user is signed in, redirect to home page
            showAlert('Please sign in to use direct messaging.', 'error');
            setTimeout(() => {
                window.location.href = './index.html';
            }, 3000);
        }
    });
}

// Set up event listeners
function setupEventListeners() {
    // User search
    userSearchInput.addEventListener('input', handleUserSearch);
    modalSearchInput.addEventListener('input', handleModalSearch);
    
    // Show all users when search input is focused
    userSearchInput.addEventListener('focus', () => loadAllUsers(searchResults, false));
    modalSearchInput.addEventListener('focus', () => loadAllUsers(modalSearchResults, true));
    
    // Message form
    messageForm.addEventListener('submit', handleSendMessage);
    
    // New chat button
    newChatBtn.addEventListener('click', () => {
        userSearchModal.classList.remove('hidden');
        // Load all users when modal is opened
        loadAllUsers(modalSearchResults, true);
    });
    closeModalBtn.addEventListener('click', () => userSearchModal.classList.add('hidden'));
    
    // Close modal on outside click
    userSearchModal.addEventListener('click', (e) => {
        if (e.target === userSearchModal) {
            userSearchModal.classList.add('hidden');
        }
    });
}

// Load all available users
function loadAllUsers(resultsContainer, isModal) {
    // Reference to users in database
    const usersRef = db.ref('users');
    
    // Get all users (limited to first 20 for performance)
    usersRef.orderByChild('customDisplayName')
        .limitToFirst(30)
        .once('value')
        .then((snapshot) => {
            // Clear previous results
            resultsContainer.innerHTML = '';
            
            if (!snapshot.exists()) {
                resultsContainer.innerHTML = '<div class="p-3 text-gray-400">No users found</div>';
                if (!isModal) {
                    resultsContainer.classList.remove('hidden');
                }
                return;
            }
            
            // Show results container
            if (!isModal) {
                resultsContainer.classList.remove('hidden');
            }
            
            // Process and display users
            displayUserResults(snapshot, resultsContainer, isModal);
        })
        .catch((error) => {
            console.error("Error loading users:", error);
            showAlert('Error loading users', 'error');
        });
}

// Display user results in the container
function displayUserResults(snapshot, resultsContainer, isModal) {
    // Array to hold user data for sorting
    const users = [];
    
    // Process users
    snapshot.forEach((userSnapshot) => {
        const userData = userSnapshot.val();
        const userId = userSnapshot.key;
        
        // Skip current user
        if (userId === currentUser.uid) {
            return;
        }
        
        // Skip users without a custom display name
        if (!userData.customDisplayName) {
            return;
        }
        
        // Skip users who have set searchable to false
        if (userData.searchable === false) {
            return;
        }
        
        // Add to array for sorting
        users.push({
            id: userId,
            data: userData
        });
        
        // Cache user data
        usersCache[userId] = userData;
    });
    
    // Sort users alphabetically by display name
    users.sort((a, b) => {
        const nameA = a.data.customDisplayName.toLowerCase();
        const nameB = b.data.customDisplayName.toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    // Display no results message if empty
    if (users.length === 0) {
        resultsContainer.innerHTML = '<div class="p-3 text-gray-400">No users found</div>';
        return;
    }
    
    // Create and append user elements
    users.forEach(user => {
        // Create result item
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.dataset.userId = user.id;
        
        // Get user avatar
        const userAvatar = user.data.photoURL || './images/suscat.jpg';
        
        resultItem.innerHTML = `
            <img src="${userAvatar}" alt="${user.data.customDisplayName}" class="search-result-avatar">
            <div class="search-result-info">
                <div class="search-result-name">${user.data.customDisplayName}</div>
                ${user.data.email ? `<div class="search-result-email">${user.data.email}</div>` : ''}
            </div>
        `;
        
        // Add click handler
        resultItem.addEventListener('click', () => {
            startOrOpenConversation(user.id);
            
            // Hide search results
            resultsContainer.innerHTML = '';
            if (!isModal) {
                resultsContainer.classList.add('hidden');
            }
            
            // Clear search input
            if (isModal) {
                modalSearchInput.value = '';
                userSearchModal.classList.add('hidden');
            } else {
                userSearchInput.value = '';
            }
        });
        
        // Add to results container
        resultsContainer.appendChild(resultItem);
    });
}

// Handle user search
function handleUserSearch(e) {
    const query = e.target.value.trim();
    
    // Clear previous timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // If query is empty, show all users
    if (!query) {
        loadAllUsers(searchResults, false);
        return;
    }
    
    // Set timeout to avoid too many searches
    searchTimeout = setTimeout(() => {
        searchUsers(query, searchResults, false);
    }, 300);
}

// Handle modal search
function handleModalSearch(e) {
    const query = e.target.value.trim();
    
    // Clear previous timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // If query is empty, show all users
    if (!query) {
        loadAllUsers(modalSearchResults, true);
        return;
    }
    
    // Set timeout to avoid too many searches
    searchTimeout = setTimeout(() => {
        searchUsers(query, modalSearchResults, true);
    }, 300);
}

// Search for users
function searchUsers(query, resultsContainer, isModal) {
    // Case insensitive search - convert query to lowercase
    query = query.toLowerCase();
    
    // If we already have users cached (from loadAllUsers), filter them locally
    if (Object.keys(usersCache).length > 0) {
        // Filter users from cache based on lowercase username comparison
        const filteredUsers = [];
        
        Object.keys(usersCache).forEach(userId => {
            // Skip current user
            if (userId === currentUser.uid) return;
            
            const userData = usersCache[userId];
            
            // Skip users without a custom display name
            if (!userData.customDisplayName) return;
            
            // Skip users who have set searchable to false
            if (userData.searchable === false) return;
            
            // Case insensitive comparison
            const displayName = userData.customDisplayName.toLowerCase();
            if (displayName.includes(query)) {
                filteredUsers.push({
                    id: userId,
                    data: userData
                });
            }
        });
        
        // Sort and display the filtered results
        filteredUsers.sort((a, b) => {
            const nameA = a.data.customDisplayName.toLowerCase();
            const nameB = b.data.customDisplayName.toLowerCase();
            return nameA.localeCompare(nameB);
        });
        
        // Clear the results container
        resultsContainer.innerHTML = '';
        
        // Check if we have results
        if (filteredUsers.length === 0) {
            resultsContainer.innerHTML = '<div class="p-3 text-gray-400">No users found</div>';
            return;
        }
        
        // Display the filtered users
        filteredUsers.forEach(user => {
            // Create result item
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.dataset.userId = user.id;
            
            // Get user avatar
            const userAvatar = user.data.photoURL || './images/suscat.jpg';
            
            resultItem.innerHTML = `
                <img src="${userAvatar}" alt="${user.data.customDisplayName}" class="search-result-avatar">
                <div class="search-result-info">
                    <div class="search-result-name">${user.data.customDisplayName}</div>
                    ${user.data.email ? `<div class="search-result-email">${user.data.email}</div>` : ''}
                </div>
            `;
            
            // Add click handler
            resultItem.addEventListener('click', () => {
                startOrOpenConversation(user.id);
                
                // Hide search results
                resultsContainer.innerHTML = '';
                if (!isModal) {
                    resultsContainer.classList.add('hidden');
                }
                
                // Clear search input
                if (isModal) {
                    modalSearchInput.value = '';
                    userSearchModal.classList.add('hidden');
                } else {
                    userSearchInput.value = '';
                }
            });
            
            // Add to results container
            resultsContainer.appendChild(resultItem);
        });
    } else {
        // If cache is empty, search in the database
        const usersRef = db.ref('users');
        
        // We can't do case-insensitive search directly in Firebase,
        // so we'll get more results and filter them afterward
        usersRef.orderByChild('customDisplayName')
            .limitToFirst(50)
            .once('value')
            .then((snapshot) => {
                // Process results and filter them manually
                const filteredResults = {};
                
                // Get matching users
                snapshot.forEach(childSnapshot => {
                    const userData = childSnapshot.val();
                    
                    // Skip users who have set searchable to false
                    if (userData.searchable === false) return;
                    
                    if (userData.customDisplayName && 
                        userData.customDisplayName.toLowerCase().includes(query)) {
                        filteredResults[childSnapshot.key] = userData;
                    }
                });
                
                // Create a new snapshot-like object with filtered results
                const filteredSnapshot = {
                    val: () => filteredResults,
                    exists: () => Object.keys(filteredResults).length > 0,
                    forEach: (callback) => {
                        Object.keys(filteredResults).forEach(key => {
                            callback({
                                key: key,
                                val: () => filteredResults[key]
                            });
                        });
                    }
                };
                
                // Display results
                displayUserResults(filteredSnapshot, resultsContainer, isModal);
            })
            .catch((error) => {
                console.error("Error searching users:", error);
                showAlert('Error searching users', 'error');
            });
    }
}

// Add conversation to list
function addConversationToList(conversation) {
    // Get other user ID
    const otherUserId = conversation.participants.find(id => id !== currentUser.uid);
    
    // Get other user data
    getUserData(otherUserId).then(userData => {
        // Create conversation item
        const conversationItem = document.createElement('div');
        conversationItem.className = 'conversation-item';
        if (conversation.unreadCount && conversation.unreadCount > 0 && currentChat !== conversation.id) {
            conversationItem.classList.add('has-new-message');
        }
        conversationItem.dataset.conversationId = conversation.id;
        
        // Get user avatar
        const userAvatar = userData.photoURL || './images/suscat.jpg';
        
        // Format last message time
        const lastMessageTime = conversation.lastMessageTime ? formatMessageTime(conversation.lastMessageTime) : '';
        
        conversationItem.innerHTML = `
            <img src="${userAvatar}" alt="${userData.customDisplayName}" class="conversation-avatar">
            <div class="conversation-info">
                <div class="conversation-name">${userData.customDisplayName}</div>
                <div class="conversation-last-message">${conversation.lastMessage || 'Start a conversation'}</div>
            </div>
            <div class="conversation-meta">
                ${lastMessageTime ? `<div class="conversation-time">${lastMessageTime}</div>` : ''}
                ${conversation.unreadCount ? `<div class="conversation-unread">${conversation.unreadCount}</div>` : ''}
            </div>
        `;
        
        // Add click handler
        conversationItem.addEventListener('click', () => {
            openConversation(conversation.id);
            
            // Remove new message indicator when clicking
            conversationItem.classList.remove('has-new-message');
            
            // Show chat area on mobile
            if (window.innerWidth < 768) {
                const sidebar = document.getElementById('sidebar');
                const chatArea = document.getElementById('chatArea');
                if (sidebar && chatArea) {
                    sidebar.classList.add('hidden');
                    chatArea.classList.remove('hidden');
                    chatArea.style.display = 'flex';
                    setTimeout(forceScrollToBottom, 100);
                }
            }
        });
        
        // Add to conversations list
        conversationsList.appendChild(conversationItem);
        
        // If this is the current conversation, mark it as active
        if (currentChat && currentChat === conversation.id) {
            conversationItem.classList.add('active');
        }
        
        // If this is the first conversation and we haven't loaded any chat yet
        if (!currentChat && !window.hasLoadedInitialChat) {
            window.hasLoadedInitialChat = true;
            setTimeout(() => {
                openConversation(conversation.id);
                if (window.innerWidth < 768) {
                    const sidebar = document.getElementById('sidebar');
                    const chatArea = document.getElementById('chatArea');
                    if (sidebar && chatArea) {
                        sidebar.classList.add('hidden');
                        chatArea.classList.remove('hidden');
                        chatArea.style.display = 'flex';
                        forceScrollToBottom();
                    }
                }
            }, 100);
        }
    });
}

// Start or open a conversation
function startOrOpenConversation(otherUserId) {
    // Check if conversation already exists
    const conversationId = [currentUser.uid, otherUserId].sort().join('_');
    
    // Check if conversation exists in our local cache
    if (conversations[conversationId]) {
        openConversation(conversationId);
        return;
    }
    
    // Check if conversation exists in database
    db.ref(`conversations/${conversationId}`).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                // Conversation exists, open it
                openConversation(conversationId);
            } else {
                // Create new conversation
                createNewConversation(otherUserId);
            }
        })
        .catch((error) => {
            console.error("Error checking conversation:", error);
            showAlert('Error starting conversation', 'error');
        });
}

// Create a new conversation
function createNewConversation(otherUserId) {
    // Generate conversation ID (sorted UIDs to ensure consistency)
    const conversationId = [currentUser.uid, otherUserId].sort().join('_');
    
    // Create conversation in database
    db.ref(`conversations/${conversationId}`).set({
        participants: [currentUser.uid, otherUserId],
        createdAt: firebase.database.ServerValue.TIMESTAMP,
    })
    .then(() => {
        // Add conversation to user's conversations
        const updates = {};
        updates[`userConversations/${currentUser.uid}/${conversationId}`] = {
            participants: [currentUser.uid, otherUserId],
            otherUserId: otherUserId,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };
        updates[`userConversations/${otherUserId}/${conversationId}`] = {
            participants: [currentUser.uid, otherUserId],
            otherUserId: currentUser.uid,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        return db.ref().update(updates);
    })
    .then(() => {
        // Open the conversation
        openConversation(conversationId);
    })
    .catch((error) => {
        console.error("Error creating conversation:", error);
        showAlert('Error creating conversation', 'error');
    });
}

// Load user conversations
function loadUserConversations() {
    // Reference to user's conversations
    const userConversationsRef = db.ref(`userConversations/${currentUser.uid}`);
    
    // Listen for conversations
    userConversationsRef.on('value', (snapshot) => {
        // Clear previous conversations
        conversationsList.innerHTML = '';
        conversations = {};
        
        if (!snapshot.exists()) {
            // Show empty state
            conversationsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments empty-icon"></i>
                    <p>No conversations yet</p>
                    <p class="text-sm mt-2">Search for users to start chatting!</p>
                </div>
            `;
            return;
        }
        
        // Process conversations
        const conversationsData = snapshot.val();
        const conversationsArray = [];
        
        // Convert to array for sorting
        Object.keys(conversationsData).forEach(conversationId => {
            if (conversationsData[conversationId]) {
                conversationsData[conversationId].id = conversationId;
                conversationsArray.push(conversationsData[conversationId]);
                
                // Store in conversations object
                conversations[conversationId] = conversationsData[conversationId];
            }
        });
        
        // Sort by last message time (descending)
        conversationsArray.sort((a, b) => {
            const timeA = a.lastMessageTime || 0;
            const timeB = b.lastMessageTime || 0;
            return timeB - timeA;
        });
        
        // Add conversations to list
        conversationsArray.forEach(conversation => {
            addConversationToList(conversation);
        });
    });
}

// Open a conversation
function openConversation(conversationId) {
    // Don't reopen the same conversation
    if (currentChat === conversationId) {
        return;
    }
    
    // Remove any existing message listeners
    if (currentChat) {
        db.ref(`messages/${currentChat}`).off();
    }
    
    // Set current chat
    currentChat = conversationId;
    
    // Update UI
    const conversationItems = document.querySelectorAll('.conversation-item');
    conversationItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.conversationId === conversationId) {
            item.classList.remove('has-new-message');
            item.classList.add('active');
        }
    });
    
    // Get conversation data
    const conversation = conversations[conversationId];
    if (!conversation) {
        showAlert('Conversation not found', 'error');
        return;
    }
    
    // Get other user ID
    const otherUserId = conversation.participants.find(id => id !== currentUser.uid);
    
    // Get other user data
    getUserData(otherUserId).then(userData => {
        // Update chat header
        chatUserAvatar.src = userData.photoURL || './images/suscat.jpg';
        chatUsername.textContent = userData.customDisplayName;
        chatUserStatus.textContent = 'Online'; // TODO: Implement online status
        
        // Show message input
        messageInputContainer.classList.remove('hidden');
        
        // Hide welcome screen and show messages list
        welcomeScreen.classList.add('hidden');
        messagesList.classList.remove('hidden');
        
        // Load messages
        loadMessages(conversationId);
        
        // Mark conversation as read
        markConversationAsRead(conversationId);
        
        // Show chat area on mobile
        if (window.innerWidth < 768) {
            const sidebar = document.getElementById('sidebar');
            const chatArea = document.getElementById('chatArea');
            if (sidebar && chatArea) {
                sidebar.classList.add('hidden');
                chatArea.classList.remove('hidden');
                chatArea.style.display = 'flex';
                setTimeout(forceScrollToBottom, 100);
            }
        }
    });
}

// Function to scroll to bottom of messages
function scrollToBottom() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// More robust scroll to bottom that ensures it works on mobile
function forceScrollToBottom() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
        // Small delay to ensure DOM is fully updated
        setTimeout(() => {
            // Force scroll to very bottom
            messagesContainer.scrollTop = 999999;
            // Double-check with calculated scrollHeight for absolute certainty
            messagesContainer.scrollTop = messagesContainer.scrollHeight + 1000;
        }, 100);
    }
}

// Load messages for a conversation
function loadMessages(conversationId) {
    // Don't load messages if this isn't the current active conversation
    if (conversationId !== currentChat) {
        return;
    }
    
    // Clear previous messages
    messagesList.innerHTML = '';
    
    // Reference to conversation messages
    const messagesRef = db.ref(`messages/${conversationId}`);
    
    // Listen for messages
    messagesRef.orderByChild('timestamp').on('value', (snapshot) => {
        // Verify this is still the active conversation
        if (conversationId !== currentChat) {
            // If not the current conversation anymore, remove the listener
            messagesRef.off();
            return;
        }
        
        // Clear previous messages
        messagesList.innerHTML = '';
        
        if (!snapshot.exists()) {
            // Show empty state
            messagesList.innerHTML = `
                <div class="empty-state">
                    <p>No messages yet</p>
                    <p class="text-sm mt-2">Start the conversation!</p>
                </div>
            `;
            return;
        }
        
        // Process messages
        snapshot.forEach((messageSnapshot) => {
            const message = messageSnapshot.val();
            addMessageToList(message);
        });
        
        // Scroll to bottom with the more robust method
        forceScrollToBottom();
    });
    
    // Remove listener when switching conversations
    return () => messagesRef.off();
}

// Add a message to the messages list
function addMessageToList(message) {
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.senderId === currentUser.uid ? 'message-sent' : 'message-received'}`;
    
    // Format message time
    const messageTime = formatMessageTime(message.timestamp);
    
    // Create the message bubble and time elements separately
    const bubbleElement = document.createElement('div');
    bubbleElement.className = 'message-bubble';
    bubbleElement.textContent = message.text;
    
    const timeElement = document.createElement('div');
    timeElement.className = 'message-time';
    timeElement.textContent = messageTime;
    
    // Append them to the message element
    messageElement.appendChild(bubbleElement);
    messageElement.appendChild(timeElement);
    
    // Add to messages list
    messagesList.appendChild(messageElement);
}

// Handle send message
function handleSendMessage(e) {
    e.preventDefault();
    
    // Get message text
    const messageText = messageInput.value.trim();
    
    if (!messageText) {
        return;
    }
    
    if (!currentChat) {
        showAlert('No conversation selected', 'error');
        return;
    }
    
    // Clear message input
    messageInput.value = '';
    
    // Send message
    sendMessage(currentChat, messageText);
}

// Send a message
function sendMessage(conversationId, text) {
    // Reference to conversation
    const conversation = conversations[conversationId];
    
    if (!conversation) {
        showAlert('Conversation not found', 'error');
        return;
    }
    
    // Get other user ID
    const otherUserId = conversation.participants.find(id => id !== currentUser.uid);
    
    // Create message
    const message = {
        text: text,
        senderId: currentUser.uid,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        read: false
    };
    
    // Add message to database
    db.ref(`messages/${conversationId}`).push(message)
        .then(() => {
            // Update last message in conversation
            const updates = {};
            updates[`userConversations/${currentUser.uid}/${conversationId}/lastMessage`] = text;
            updates[`userConversations/${currentUser.uid}/${conversationId}/lastMessageTime`] = firebase.database.ServerValue.TIMESTAMP;
            updates[`userConversations/${otherUserId}/${conversationId}/lastMessage`] = text;
            updates[`userConversations/${otherUserId}/${conversationId}/lastMessageTime`] = firebase.database.ServerValue.TIMESTAMP;
            updates[`userConversations/${otherUserId}/${conversationId}/unreadCount`] = firebase.database.ServerValue.increment(1);
            
            return db.ref().update(updates);
        })
        .catch((error) => {
            console.error("Error sending message:", error);
            showAlert('Error sending message', 'error');
        });
}

// Mark conversation as read
function markConversationAsRead(conversationId) {
    // Update unread count
    db.ref(`userConversations/${currentUser.uid}/${conversationId}/unreadCount`).set(0)
        .catch((error) => {
            console.error("Error marking conversation as read:", error);
        });
    
    // Mark messages as read
    db.ref(`messages/${conversationId}`).orderByChild('senderId').equalTo(currentUser.uid).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                const updates = {};
                
                snapshot.forEach((messageSnapshot) => {
                    updates[`messages/${conversationId}/${messageSnapshot.key}/read`] = true;
                });
                
                return db.ref().update(updates);
            }
        })
        .catch((error) => {
            console.error("Error marking messages as read:", error);
        });
}

// Get user data
async function getUserData(userId) {
    // Check cache first
    if (usersCache[userId]) {
        return usersCache[userId];
    }
    
    // Get user data from database
    try {
        const snapshot = await db.ref(`users/${userId}`).once('value');
        const userData = snapshot.val() || {};
        
        // Cache user data
        usersCache[userId] = userData;
        
        return userData;
    } catch (error) {
        console.error("Error getting user data:", error);
        return {};
    }
}

// Format message time
function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    
    // Check if today
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Check if yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }
    
    // Check if this week
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
        return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initChatPage);

document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    const chatArea = document.getElementById('chatArea');
    const backBtn = document.getElementById('backToConversations');
    
    // Function to show chat area and hide sidebar on mobile
    function showChatArea() {
        if (window.innerWidth < 768) {
            sidebar.classList.add('hidden');
            chatArea.classList.remove('hidden');
            // Force scroll to bottom when switching to chat view
            setTimeout(forceScrollToBottom, 300);
        }
    }
    
    // Function to show sidebar and hide chat area on mobile
    function showSidebar() {
        if (window.innerWidth < 768) {
            sidebar.classList.remove('hidden');
            chatArea.classList.add('hidden');
        }
    }
    
    // Back button click handler
    if (backBtn) {
        backBtn.addEventListener('click', showSidebar);
    }
    
    // Handle conversation item clicks to show chat area
    document.addEventListener('click', function(e) {
        const conversationItem = e.target.closest('.conversation-item');
        if (conversationItem) {
            showChatArea();
        }
    });
    
    // Update openConversation to handle mobile view
    const originalOpenConversation = window.openConversation;
    window.openConversation = function(conversationId) {
        originalOpenConversation(conversationId);
        if (window.innerWidth < 768) {
            showChatArea();
        }
    };
    
    // Create MutationObserver to watch for new messages
    const messagesList = document.getElementById('messagesList');
    if (messagesList) {
        const observer = new MutationObserver(forceScrollToBottom);
        observer.observe(messagesList, { childList: true, subtree: true });
    }
    
    // Set multiple timeouts to ensure proper scrolling
    setTimeout(forceScrollToBottom, 300);
    setTimeout(forceScrollToBottom, 600);
    setTimeout(forceScrollToBottom, 1000);
    
    // Listen for input focus to scroll down
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('focus', forceScrollToBottom);
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 768) {
            // On desktop, ensure both panels are visible
            sidebar.classList.remove('hidden');
            chatArea.classList.remove('hidden');
        }
        // Force scroll to bottom on any resize (orientation change)
        setTimeout(forceScrollToBottom, 300);
    });
    
    // Show both panels on desktop at page load
    if (window.innerWidth >= 768) {
        sidebar.classList.remove('hidden');
        chatArea.classList.remove('hidden');
    }
    
    // Listen for orientation change on mobile
    window.addEventListener('orientationchange', function() {
        setTimeout(forceScrollToBottom, 500);
    });
    
    // Handle send message form submission
    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
        const originalSubmitHandler = messageForm.onsubmit;
        messageForm.addEventListener('submit', function(e) {
            // Let the original handler run first
            if (originalSubmitHandler) {
                originalSubmitHandler(e);
            }
            // Then force scroll after a slight delay
            setTimeout(forceScrollToBottom, 300);
        });
    }
});