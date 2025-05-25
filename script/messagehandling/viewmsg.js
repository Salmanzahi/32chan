import { isAdmin, db, storage } from "../mainalt.js";
import { adminRoles } from "../config/role.js";
import { dbConfig } from "../config/config.js";
import { sanitizeText } from "../santizeText/sanitize.js";
import { loadReplies, replyToMessage, showReplyForm } from "./replyhandling.js";
import { shareMessage } from "./share.js";
import { performAISearch, highlightRelevantText } from "./aiSearch.js";
// Global variables for lazy loading
let allMessages = [];
let currentDisplayedCount = 0;
let currentSortOrder = 'desc';
const MESSAGES_PER_LOAD = 5;
let isLazyLoadingEnabled = false; // New global variable for lazy loading toggle
let lastScrollPosition = 0; // Track scroll position

// Global variables for search
let searchTimeout;
let isAISearchEnabled = false;
const searchInput = document.getElementById('postSearchInput');
const searchButton = document.getElementById('searchButton');
const aiSearchToggle = document.getElementById('aiSearchToggle');
const aiSearchStatus = document.getElementById('aiSearchStatus');
const aiSearchLoader = document.getElementById('aiSearchLoader');

/**
 * Performs search on messages using either regular or AI search
 * @param {string} searchTerm - Search term
 * @returns {Promise<void>}
 */
async function searchPosts(searchTerm) {
    const messages = document.querySelectorAll('#messagesList li');
    const searchTermLower = searchTerm.toLowerCase();

    if (!searchTerm.trim()) {
        messages.forEach(message => message.style.display = 'block');
        return;
    }

    if (isAISearchEnabled && searchTerm.trim()) {
        try {
            aiSearchLoader.style.display = 'block';
            const relevantMessages = await performAISearch(searchTerm, Array.from(messages).map(m => ({
                id: m.getAttribute('data-id'),
                title: m.querySelector('.title')?.textContent || '',
                text: m.querySelector('.message-text')?.textContent || '',
                userDisplayName: m.querySelector('.user-name')?.textContent || ''
            })));

            if (relevantMessages === null) {
                // AI search failed, fall back to regular search
                performRegularSearch(messages, searchTermLower);
            } else {
                // Hide all messages first
                messages.forEach(message => {
                    message.style.display = 'none';
                });

                // Show and highlight relevant messages with their scores
                relevantMessages.forEach(({ message: relevantMessage, score }) => {
                    const messageElement = Array.from(messages).find(m =>
                        m.getAttribute('data-id') === relevantMessage.id
                    );

                    if (messageElement) {
                        messageElement.style.display = 'block';

                        // Add similarity score and highlight text
                        const titleEl = messageElement.querySelector('.title');
                        const textEl = messageElement.querySelector('.message-text');

                        if (titleEl) {
                            titleEl.innerHTML = highlightRelevantText(
                                titleEl.textContent,
                                searchTerm,
                                score
                            );
                        }

                        if (textEl) {
                            textEl.innerHTML = highlightRelevantText(
                                textEl.textContent,
                                searchTerm,
                                score
                            );
                        }

                        // Add a visual indicator for match quality
                        messageElement.style.borderLeft = `4px solid ${getMatchQualityColor(score)}`;
                        messageElement.style.transition = 'border-left-color 0.3s ease';
                    }
                });

                // Show "no results" message if no messages are displayed
                const visibleMessages = document.querySelectorAll('#messagesList li[style*="display: block"]').length;
                if (visibleMessages === 0) {
                    showNoResultsMessage("No exact matches found. Showing closest results:");
                }
            }
        } catch (error) {
            console.error('AI Search failed:', error);
            performRegularSearch(messages, searchTermLower);
        } finally {
            aiSearchLoader.style.display = 'none';
        }
    } else {
        performRegularSearch(messages, searchTermLower);
    }

    updateSearchResultsCount();
}

/**
 * Performs regular keyword-based search
 * @param {NodeList} messages - List of message elements
 * @param {string} searchTerm - Lowercase search term
 */
function performRegularSearch(messages, searchTerm) {
    messages.forEach(message => {
        const title = message.querySelector('.title')?.textContent?.toLowerCase() || '';
        const content = message.querySelector('.message-text')?.textContent?.toLowerCase() || '';
        const author = message.querySelector('.user-name')?.textContent?.toLowerCase() || '';

        const matches = title.includes(searchTerm) ||
                       content.includes(searchTerm) ||
                       author.includes(searchTerm);

        message.style.display = matches ? 'block' : 'none';
    });
}

/**
 * Shows a message when no exact matches are found
 * @param {string} message - Message to display
 */
function showNoResultsMessage(message) {
    let noResultsEl = document.getElementById('no-results-message');
    if (!noResultsEl) {
        noResultsEl = document.createElement('div');
        noResultsEl.id = 'no-results-message';
        noResultsEl.className = 'no-results-message';
        const messagesList = document.getElementById('messagesList');
        messagesList.parentNode.insertBefore(noResultsEl, messagesList);
    }
    noResultsEl.textContent = message;
    noResultsEl.style.display = 'block';
}

/**
 * Updates the search results count display
 */
function updateSearchResultsCount() {
    const visibleMessages = document.querySelectorAll('#messagesList li[style*="display: block"]').length;
    const totalMessages = document.querySelectorAll('#messagesList li').length;

    let countEl = document.getElementById('search-results-count');
    if (!countEl) {
        countEl = document.createElement('div');
        countEl.id = 'search-results-count';
        countEl.className = 'search-results-count';
        const searchContainer = document.querySelector('.search-info');
        if (searchContainer) {
            searchContainer.appendChild(countEl);
        }
    }

    countEl.textContent = `Showing ${visibleMessages} of ${totalMessages} posts`;
}

/**
 * Gets color for match quality indicator
 * @param {number} score - Similarity score
 * @returns {string} - CSS color value
 */
function getMatchQualityColor(score) {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFC107';
    return '#FF5722';
}

// Add event listeners for search
if (searchInput && searchButton) {
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchPosts(e.target.value);
        }, 300);
    });

    searchButton.addEventListener('click', () => {
        searchPosts(searchInput.value);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchPosts(searchInput.value);
        }
    });
}

// Add event listener for AI search toggle
if (aiSearchToggle) {
    aiSearchToggle.addEventListener('click', () => {
        isAISearchEnabled = !isAISearchEnabled;
        aiSearchToggle.classList.toggle('active');
        aiSearchStatus.textContent = `AI Search: ${isAISearchEnabled ? 'On' : 'Off'}`;

        // Re-run search with new mode if there's a search term
        if (searchInput.value.trim()) {
            searchPosts(searchInput.value);
        }
    });
}

/**
 * Preserves scroll position during DOM updates
 * @param {Function} callback - Function to execute after saving scroll position
 */
function preserveScrollPosition(callback) {
    // Save current scroll position
    lastScrollPosition = window.scrollY;

    // Execute the callback
    callback();

    // Restore scroll position after a short delay to allow DOM to update
    setTimeout(() => {
        window.scrollTo(0, lastScrollPosition);
    }, 100);
}

/**
 * Creates a message element from message data
 * @param {Object} message - Message data object
 * @param {Object} user - Current user object
 * @returns {HTMLElement} - Created message element
 */
export function createMessageElement(message, user) {
    const safeTitle = sanitizeText(message.title || 'Legacy Post');
    const safeAdminName = message.adminName ? sanitizeText(message.adminName) : null;
    const safeMessageText = sanitizeText(message.text || 'No text provided');
    const timestamp = message.timestamp;
    const imageUrl = message.imageURL ? sanitizeText(message.imageURL) : null;
    const likes = message.likes || 0;

    // Check if current user has liked this message
    const isLiked = user && message.likedBy && message.likedBy[user.uid];
    const likedClass = isLiked ? 'liked' : '';

    // Create message list item
    const li = document.createElement('li');
    li.setAttribute('data-id', message.id);
    li.style.backgroundColor = "#1e1e1e";
    li.style.padding = "15px";
    li.style.border = "1px solid #333";
    li.style.borderRadius = "8px";
    li.style.marginBottom = "10px";
    li.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.5)";
    li.style.transition = "box-shadow 0.3s ease-in-out";
    li.style.listStyle = "none";
    // Check if profile should be displayed
    const showProfile = message.showProfile;
    const userDisplayName = message.userDisplayName ? sanitizeText(message.userDisplayName) : null;
    const userPhotoURL = message.userPhotoURL ? sanitizeText(message.userPhotoURL) : null;

    // Check if the message is from an admin user
    const isUserAdmin = message.userId && adminRoles && adminRoles.admins && adminRoles.admins.includes(message.userId);

    // Check if message was posted in anonymous mode
    // The condition: if anonymous username is different from the regular username
    // This specific check will be performed when displaying user messages
    const isAnonymousMode = message.isAnonymousMode === true;
    const displayName = userDisplayName + (isAnonymousMode ? ' <span style="color: gray;">[Anonymous]</span>' : '');

    li.innerHTML = `
        <div class="header">
            ${showProfile && userDisplayName ? `
            <div class="user-profile">
                ${isAnonymousMode ?
                    `<img src="./images/suscat.jpg" alt="Anonymous User">` :
                    `<img src="${userPhotoURL || './images/suscat.jpg'}" alt="User Photo">`
                }
                <div>
                    <div class="user-name">${displayName}</div>
                    ${isUserAdmin ? `<div class="admin-tag">[ADMIN]</div>` : ''}
                </div>
            </div>` : ''}
            <div class="title">${safeTitle}</div>
            <div class="timestamp">${new Date(timestamp).toLocaleString()}</div>
        </div>
        <div class="content">
            <div class="message-text" style="color:#ffff">${safeMessageText}</div>
            ${imageUrl ? `
            <div class="message-image" style="margin-top: 10px;">
                <img src="${imageUrl}" alt="Message Image" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            </div>` : ''}
            ${message.spotifyTrack ? `
            <div class="spotify-track-embed">
                <iframe src="https://open.spotify.com/embed/track/${message.spotifyTrack.id}"
                width="100%" height="80" frameborder="0" allowtransparency="true"
                allow="encrypted-media"></iframe>
            </div>` : ''}
        </div>
        <div class="actions">
            <button onclick="toggleLike('${message.id}')" class="action-btn ${likedClass}">
                <svg class="like-icon" width="16" height="16" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                ${likes}
            </button>
            <button onclick="replyToMessage('${message.id}', event)" class="action-btn">
                <svg class="reply-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 10h10a5 5 0 0 1 5 5v6M3 10l6 6m-6-6l6-6"/>
                </svg>
                Reply
            </button>
            <button onclick="shareMessage('${message.id}')" class="action-btn">
                <svg class="share-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="18" cy="5" r="3"/>
                    <circle cx="6" cy="12" r="3"/>
                    <circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share and View
            </button>
            ${isAdmin() ? `
                <button onclick="editPost('${message.id}')" class="action-btn">
                    <svg class="edit-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                </button>
                <button onclick="deletePost('${message.id}')" class="action-btn">
                    <svg class="delete-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                    Delete
                </button>
            ` : ''}
            ${(user && message.userId === user.uid && !isAdmin()) ? `
                <button onclick="editUserPost('${message.id}')" class="action-btn">
                    <svg class="edit-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                </button>
                <button onclick="deleteUserPost('${message.id}')" class="action-btn">
                    <svg class="delete-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                    Delete
                </button>
            ` : ''}
        </div>
        <ul class="replies" id="replies-${message.id}"></ul>
        <div class="reply-form" style="display: none;">
            <textarea class="reply-textarea" placeholder="Write your reply..."></textarea>
            <div class="reply-actions">
                <button class="submit-reply-btn">Submit Reply</button>
                <button class="cancel-reply-btn">Cancel</button>
            </div>
        </div>
    `;

    return li;
}
window.replyToMessage = replyToMessage;
/**
 * Displays a list of messages in the messages list
 * @param {Array} messages - Array of message objects to display
 */
function displayMessages(messages) {
    const messagesList = document.getElementById('messagesList');

    messages.forEach(message => {
        const user = firebase.auth().currentUser;
        const messageElement = createMessageElement(message, user);
        messagesList.appendChild(messageElement);
        loadReplies(message.id);
    });
}

/**
 * Updates the UI elements based on the current state
 */
function updateUIElements() {
    const noMorePostsMessage = document.getElementById('no-more-posts');
    const infiniteScrollLoader = document.getElementById('infinite-scroll-loader');

    if (currentDisplayedCount >= allMessages.length && noMorePostsMessage) {
        noMorePostsMessage.style.display = 'block';
        if (infiniteScrollLoader) {
            infiniteScrollLoader.style.display = 'none';
        }
    } else {
        // Hide the no more posts message
        if (noMorePostsMessage) {
            noMorePostsMessage.style.display = 'none';
        }
        // Set up the scroll listener for lazy loading only if it's enabled
        if (isLazyLoadingEnabled) {
            setupScrollListener();
        }
    }
}

/**
 * Sorts messages based on the specified sort order
 * @param {Array} messages - Array of messages to sort
 * @param {string} sortOrder - Sort order ('asc', 'desc', or 'mostLiked')
 * @returns {Array} - Sorted array of messages
 */
function sortMessages(messages, sortOrder) {
    if (sortOrder === 'asc') {
        return messages.sort((a, b) => a.timestamp - b.timestamp);
    } else if (sortOrder === 'desc') {
        return messages.sort((a, b) => b.timestamp - a.timestamp);
    } else if (sortOrder === 'mostLiked') {
        return messages.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }
    return messages;
}

/**
 * Updates the active sort button based on the current sort order
 * @param {string} sortOrder - Current sort order
 */
function updateSortButtons(sortOrder) {
    const sortButtons = document.querySelectorAll('.sort-btn');

    // Remove active class from all buttons
    sortButtons.forEach(button => button.classList.remove('active'));

    // Add active class to the selected button
    if (sortOrder === 'asc') {
        document.getElementById('sortAscBtn').classList.add('active');
    } else if (sortOrder === 'desc') {
        document.getElementById('sortDescBtn').classList.add('active');
    } else if (sortOrder === 'mostLiked') {
        document.getElementById('sortMostLikedBtn').classList.add('active');
    }
}

// Initialize lazy loading toggle
document.addEventListener('DOMContentLoaded', () => {
    const lazyLoadingToggle = document.getElementById('lazyLoadingToggle');
    if (lazyLoadingToggle) {
        lazyLoadingToggle.checked = isLazyLoadingEnabled;
        lazyLoadingToggle.addEventListener('change', (e) => {
            preserveScrollPosition(() => {
                isLazyLoadingEnabled = e.target.checked;
                showMessages(currentSortOrder);
            });
        });
    }

    // Initialize the scroll listener
    setupScrollListener();
});

export function showMessages(sortOrder = 'desc') {
    // Track if this is a sort change rather than initial load
    const isSortChange = sortOrder !== currentSortOrder && currentDisplayedCount > 0;

    // Only allow scrolling on initial load, not when changing sort
    const shouldScrollToMessage = !isSortChange && window.scrollToMessageAfterLoad;

    // If this is a sort change, we don't want to scroll again
    if (isSortChange) {
        window.scrollToMessageAfterLoad = null;
    }

    preserveScrollPosition(() => {
        const messagesList = document.getElementById('messagesList');

        // Show loading indicator
        const loader = document.getElementById('notme');
        if (loader) {
            loader.style.display = 'block';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 100);
        }

        if (messagesList) {
            // Update sort buttons
            updateSortButtons(sortOrder);

            // Update current sort order for lazy loading
            currentSortOrder = sortOrder;

            const messagesRef = db.ref(dbConfig.messagesPath);
            messagesRef.off('value'); // Detach any existing listener

            messagesRef.on('value', (snapshot) => {
                // Clear the list for every snapshot update
                messagesList.innerHTML = '';

                const messages = [];
                snapshot.forEach((childSnapshot) => {
                    const messageData = childSnapshot.val();
                    messages.push({ id: childSnapshot.key, ...messageData });
                });

                // Store all messages for lazy loading
                allMessages = messages;

                // Sort messages based on the selected sort order
                const sortedMessages = sortMessages(messages, sortOrder);

                // Reset the displayed count
                currentDisplayedCount = 0;

                // If lazy loading is disabled, show all messages at once
                if (!isLazyLoadingEnabled) {
                    currentDisplayedCount = sortedMessages.length;
                    displayMessages(sortedMessages);
                } else {
                    // Only display the first batch of messages
                    const initialMessages = sortedMessages.slice(0, MESSAGES_PER_LOAD);
                    currentDisplayedCount = initialMessages.length;
                    displayMessages(initialMessages);
                }

                // Update UI elements
                updateUIElements();

                // Dispatch a custom event to indicate messages have been loaded
                document.dispatchEvent(new CustomEvent('messagesLoaded', {
                    detail: { messageCount: allMessages.length }
                }));

                // Only scroll to message if this is not a sort change
                if (shouldScrollToMessage) {
                    const messageIdToScrollTo = window.scrollToMessageAfterLoad;
                    window.scrollToMessageAfterLoad = null; // Clear the flag

                    console.log(`Messages loaded, attempting to scroll to: ${messageIdToScrollTo}`);

                    // Give time for the messages to render
                    setTimeout(() => {
                        if (typeof window.scrollToMessage === 'function') {
                            window.scrollToMessage(messageIdToScrollTo);
                        } else {
                            console.error('scrollToMessage function not available');
                        }
                    }, 1000); // Increased delay to ensure DOM is ready
                }
            });
        }
    });
}

// Function to toggle lazy loading
export function toggleLazyLoading() {
    preserveScrollPosition(() => {
        isLazyLoadingEnabled = !isLazyLoadingEnabled;
        // Refresh the messages display with the new setting
        showMessages(currentSortOrder);
    });
}

// Function to set up scroll event listener
function setupScrollListener() {
    // Remove any existing scroll event listener first
    window.removeEventListener('scroll', handleScroll);

    // Add the scroll event listener
    window.addEventListener('scroll', handleScroll);
}

// Function to handle scroll events
function handleScroll() {
    const infiniteScrollLoader = document.getElementById('infinite-scroll-loader');
    const messagesList = document.getElementById('messagesList');

    if (!messagesList || currentDisplayedCount >= allMessages.length) return;

    // Calculate if we're near the bottom of the page
    const lastMessage = messagesList.lastElementChild;
    if (!lastMessage) return;

    const lastMessageRect = lastMessage.getBoundingClientRect();
    const isNearBottom = lastMessageRect.bottom <= window.innerHeight + 200; // 200px threshold

    if (isNearBottom) {
        // Remove scroll listener to prevent multiple triggers
        window.removeEventListener('scroll', handleScroll);

        // Show the loader
        if (infiniteScrollLoader) {
            infiniteScrollLoader.style.display = 'block';
        }

        // Load more messages after a small delay to show the loader
        setTimeout(() => {
            loadMoreMessages();

            // Only reattach the scroll listener if there are more messages to load
            if (currentDisplayedCount < allMessages.length) {
                setupScrollListener();
            }
        }, 500);
    }
}

// Function to load more messages when scrolling
function loadMoreMessages(callback) {
    const messagesList = document.getElementById('messagesList');
    const infiniteScrollLoader = document.getElementById('infinite-scroll-loader');
    const noMorePostsMessage = document.getElementById('no-more-posts');

    if (!messagesList || currentDisplayedCount >= allMessages.length) {
        // Hide the loader
        if (infiniteScrollLoader) {
            infiniteScrollLoader.style.display = 'none';
        }

        // Show the no more posts message
        if (noMorePostsMessage) {
            noMorePostsMessage.style.display = 'block';
        }

        // Call callback if provided
        if (callback) callback(false); // false indicates no more messages to load
        return;
    }

    // Calculate the start and end indices for the next batch
    const startIndex = currentDisplayedCount;
    const endIndex = Math.min(startIndex + MESSAGES_PER_LOAD, allMessages.length);
    console.log(`Loading posts from ${startIndex} to ${endIndex} of ${allMessages.length} total posts`);

    // Get the next batch of messages
    const nextBatch = allMessages.slice(startIndex, endIndex);

    // Get current user
    const user = firebase.auth().currentUser;

    // Append the next batch of messages to the list
    nextBatch.forEach(message => {
        const messageElement = createMessageElement(message, user);
        messagesList.appendChild(messageElement);
        loadReplies(message.id);
    });

    // Update the count of displayed messages
    currentDisplayedCount = endIndex;

    // Hide the loader
    if (infiniteScrollLoader) {
        infiniteScrollLoader.style.display = 'none';
    }

    // Show the no more posts message if we've loaded all messages
    if (currentDisplayedCount >= allMessages.length && noMorePostsMessage) {
        noMorePostsMessage.style.display = 'block';
    }

    // Call callback if provided
    if (callback) callback(true); // true indicates messages were loaded successfully
}

// // Add a global function to handle like button clicks
// window.toggleLike = function(messageId) {
//     preserveScrollPosition(() => {
//         // Your existing toggleLike logic here
//         // ...
//     });
// };

window.showMessages = showMessages;
window.loadMoreMessages = loadMoreMessages;