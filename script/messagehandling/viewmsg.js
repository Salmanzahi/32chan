import { isAdmin, db, storage } from "../mainalt.js";
import { adminRoles } from "../config/role.js";
import { dbConfig } from "../config/config.js";
import { sanitizeText } from "../santizeText/sanitize.js";
import { loadReplies, replyToMessage, showReplyForm } from "./replyhandling.js";
import { shareMessage } from "./share.js";
import { performAISearch, highlightRelevantText } from "./aiSearch.js";


let allMessages = [];
let currentDisplayedCount = 0;
let currentSortOrder = 'desc';
const MESSAGES_PER_LOAD = 5;
let isLazyLoadingEnabled = false;
let lastScrollPosition = 0; 

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

                // updateSearchResultsDisplay will handle the no results message
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

    updateSearchResultsDisplay();
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
/**
 * Updates the display for search results, including count and no-results message.
 */
function updateSearchResultsDisplay() {
    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;

    const visibleMessages = messagesList.querySelectorAll('li[style*="display: block"]').length;
    const totalMessages = messagesList.querySelectorAll('li').length;

    // Update or create the search results count element
    let countEl = document.getElementById('search-results-count');
    const searchContainer = document.querySelector('.search-info');

    if (!countEl && searchContainer) {
        countEl = document.createElement('div');
        countEl.id = 'search-results-count';
        countEl.className = 'search-results-count';
        searchContainer.appendChild(countEl);
    }
    if (countEl) {
        countEl.textContent = `Showing ${visibleMessages} of ${totalMessages} posts`;
    }

    // Update or create the no-results message element
    let noResultsEl = document.getElementById('no-results-message');
    if (!noResultsEl && messagesList.parentNode) {
        noResultsEl = document.createElement('div');
        noResultsEl.id = 'no-results-message';
        noResultsEl.className = 'no-results-message';
        messagesList.parentNode.insertBefore(noResultsEl, messagesList);
    }

    if (noResultsEl) {
        if (searchInput && searchInput.value.trim() && visibleMessages === 0 && totalMessages > 0) {
            noResultsEl.textContent = isAISearchEnabled ? "No exact matches found. Showing closest results:" : "No posts match your search.";
            noResultsEl.style.display = 'block';
        } else {
            noResultsEl.style.display = 'none';
        }
    }
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

/**
 * Initializes search-related event listeners.
 */
function initializeSearchEventListeners() {
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchPosts(e.target.value);
            }, 300);
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchPosts(searchInput.value);
            }
        });
    }

    if (searchButton) {
        searchButton.addEventListener('click', () => {
            searchPosts(searchInput.value);
        });
    }

    if (aiSearchToggle) {
        aiSearchToggle.addEventListener('click', () => {
            isAISearchEnabled = !isAISearchEnabled;
            aiSearchToggle.classList.toggle('active');
            if (aiSearchStatus) {
                aiSearchStatus.textContent = `AI Search: ${isAISearchEnabled ? 'On' : 'Off'}`;
            }
            // Re-run search with new mode if there's a search term
            if (searchInput && searchInput.value.trim()) {
                searchPosts(searchInput.value);
            }
        });
    }
}

// Initialize search event listeners on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    initializeSearchEventListeners();
    // ... other DOMContentLoaded logic ...
});

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
/**
 * Generates the HTML for the user profile section of a message.
 * @param {Object} message - The message object.
 * @param {string} userDisplayName - The display name of the user.
 * @param {string} userPhotoURL - The photo URL of the user.
 * @param {boolean} isAnonymousMode - Whether the message is in anonymous mode.
 * @param {boolean} isUserAdmin - Whether the user is an admin.
 * @param {boolean} isUserExclusive - Whether the user has exclusive role.
 * @returns {string} HTML string for the user profile.
 */
function createUserProfileHTML(message, userDisplayName, userPhotoURL, isAnonymousMode, isUserAdmin, isUserExclusive) {
    if (!message.showProfile || !userDisplayName) return '';

    const profileImage = isAnonymousMode ? './images/suscat.jpg' : (userPhotoURL || './images/suscat.jpg');
    const altText = isAnonymousMode ? 'Anonymous User' : 'User Photo';
    const displayNameHTML = userDisplayName + (isAnonymousMode ? ' <span style="color: gray;">[Anonymous]</span>' : '');
    const adminTagHTML = isUserAdmin ? '<div class="admin-tag">[ADMIN]</div>' : '';
    const exclusiveTagHTML = isUserExclusive ? '<div class="exclusive-tag">[EXCLUSIVE]</div>' : '';

    return `
        <div class="user-profile">
            <img src="${profileImage}" alt="${altText}">
            <div>
                <div class="user-name">${displayNameHTML}</div>
                ${adminTagHTML}
                ${exclusiveTagHTML}
            </div>
        </div>`;
}

/**
 * Generates the HTML for the message content (text, image, Spotify track).
 * @param {string} safeMessageText - Sanitized message text.
 * @param {string|null} imageUrl - URL of the image, or null.
 * @param {Object|null} spotifyTrack - Spotify track object, or null.
 * @returns {string} HTML string for the message content.
 */
function createMessageContentHTML(safeMessageText, imageUrl, spotifyTrack) {
    const imageHTML = imageUrl ? `
        <div class="message-image" style="margin-top: 10px;">
            <img src="${imageUrl}" alt="Message Image" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
        </div>` : '';

    const spotifyHTML = spotifyTrack ? `
        <div class="spotify-track-embed">
            <iframe src="https://open.spotify.com/embed/track/${spotifyTrack.id}"
            width="100%" height="80" frameborder="0" allowtransparency="true"
            allow="encrypted-media"></iframe>
        </div>` : '';

    return `
        <div class="message-text" style="color:#ffff">${safeMessageText}</div>
        ${imageHTML}
        ${spotifyHTML}`; 
}

/**
 * Generates the HTML for the action buttons (like, reply, share, edit, delete).
 * @param {Object} message - The message object.
 * @param {Object} user - The current user object.
 * @param {boolean} isLiked - Whether the current user has liked the message.
 * @param {number} likes - The number of likes for the message.
 * @returns {string} HTML string for the action buttons.
 */
function createActionButtonsHTML(message, user, isLiked, likes) {
    const likedClass = isLiked ? 'liked' : '';
    const likeButtonFill = isLiked ? 'currentColor' : 'none'; 

    const adminButtons = isAdmin() ? `
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
    ` : '';

    const userEditDeleteButtons = (user && message.userId === user.uid && !isAdmin()) ? `
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
    ` : '';

    return `
        <button onclick="toggleLike('${message.id}')" class="action-btn ${likedClass}">
            <svg class="like-icon" width="16" height="16" viewBox="0 0 24 24" fill="${likeButtonFill}" stroke="currentColor" stroke-width="2">
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
        ${adminButtons}
        ${userEditDeleteButtons}
    `;
}

export function createMessageElement(message, user) {
    const safeTitle = sanitizeText(message.title || 'Legacy Post');
    const safeMessageText = sanitizeText(message.text || 'No text provided');
    const timestamp = message.timestamp;
    const imageUrl = message.imageURL ? sanitizeText(message.imageURL) : null;
    const likes = message.likes || 0;
    const isLiked = user && message.likedBy && message.likedBy[user.uid];

    const userDisplayName = message.userDisplayName ? sanitizeText(message.userDisplayName) : null;
    const userPhotoURL = message.userPhotoURL ? sanitizeText(message.userPhotoURL) : null;
    const isUserAdmin = message.userId && adminRoles && adminRoles.admins && adminRoles.admins.includes(message.userId);
    const isUserExclusive = message.userId && adminRoles && adminRoles.exclusive && adminRoles.exclusive.includes(message.userId);
    const isAnonymousMode = message.isAnonymousMode === true;

    const li = document.createElement('li');
    li.setAttribute('data-id', message.id);
    li.style.cssText = `
        background-color: #1e1e1e;
        padding: 15px;
        border: 1px solid #333;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        transition: box-shadow 0.3s ease-in-out;
        list-style: none;
    `;

    const userProfileHTML = createUserProfileHTML(message, userDisplayName, userPhotoURL, isAnonymousMode, isUserAdmin, isUserExclusive);
    const messageContentHTML = createMessageContentHTML(safeMessageText, imageUrl, message.spotifyTrack);
    const actionButtonsHTML = createActionButtonsHTML(message, user, isLiked, likes);

    li.innerHTML = `
        <div class="header">
            ${userProfileHTML}
            <div class="title">${safeTitle}</div>
            <div class="timestamp">${new Date(timestamp).toLocaleString()}</div>
        </div>
        <div class="content">
            ${messageContentHTML}
        </div>
        <div class="actions">
            ${actionButtonsHTML}
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
function displayMessages(messagesToDisplay) {
    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;

    const fragment = document.createDocumentFragment();
    const currentUser = firebase.auth().currentUser;

    messagesToDisplay.forEach(message => {
        const messageElement = createMessageElement(message, currentUser);
        fragment.appendChild(messageElement);
        // It's generally better to load replies after all messages are in the DOM
        // or consider a more targeted approach if performance is an issue.
    });
    messagesList.appendChild(fragment);

    // Load replies after appending all messages
    messagesToDisplay.forEach(message => {
        loadReplies(message.id);
    });
}

/**
 * Updates the UI elements based on the current state
 */
function updateUIElements() {
    const noMorePostsMessage = document.getElementById('no-more-posts');
    const infiniteScrollLoader = document.getElementById('infinite-scroll-loader');

    const allMessagesLoaded = currentDisplayedCount >= allMessages.length;

    if (noMorePostsMessage) {
        noMorePostsMessage.style.display = allMessagesLoaded ? 'block' : 'none';
    }

    if (infiniteScrollLoader) {
        infiniteScrollLoader.style.display = allMessagesLoaded ? 'none' : (isLazyLoadingEnabled ? 'block' : 'none');
    }

    if (!allMessagesLoaded && isLazyLoadingEnabled) {
        setupScrollListener(); // Ensure listener is active if more posts and lazy loading is on
    } else {
        removeScrollListener(); // Remove listener if all posts loaded or lazy loading off
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

// Initialize lazy loading toggle and other DOM dependent features
document.addEventListener('DOMContentLoaded', () => {
    initializeSearchEventListeners(); // Moved from global scope

    const lazyLoadingToggle = document.getElementById('lazyLoadingToggle');
    if (lazyLoadingToggle) {
        lazyLoadingToggle.checked = isLazyLoadingEnabled;
        lazyLoadingToggle.addEventListener('change', (e) => {
            preserveScrollPosition(() => {
                isLazyLoadingEnabled = e.target.checked;
                // When toggling lazy loading, we need to re-evaluate how messages are shown.
                // If turning on, we might need to load more. If turning off, show all.
                showMessages(currentSortOrder); 
            });
        });
    }

    // Initial setup for scroll listener based on lazy loading state
    if (isLazyLoadingEnabled) {
        setupScrollListener();
    }

    // Initial call to show messages
    showMessages(); 
});

/**
 * Fetches and displays messages based on sort order and lazy loading settings.
 * @param {string} [newSortOrder='desc'] - The new sort order for messages.
 */
export function showMessages(newSortOrder = 'desc') {
    const isSortChange = newSortOrder !== currentSortOrder;
    const messagesList = document.getElementById('messagesList');
    const loader = document.getElementById('notme');

    if (!messagesList) return;

    preserveScrollPosition(() => {
        if (loader) loader.style.display = 'block';

        if (isSortChange || !isLazyLoadingEnabled) {
            messagesList.innerHTML = '';
            currentDisplayedCount = 0;
            allMessages = []; // Reset messages if sort order changes or lazy loading is off
        }
        currentSortOrder = newSortOrder;
        updateSortButtons(currentSortOrder);

        const db = firebase.database();
        const messagesRef = db.ref(dbConfig.messagesPath);

        messagesRef.once('value', snapshot => {
            if (loader) loader.style.display = 'none'; // Hide loader once data is fetched

            if (!snapshot.exists()) {
                messagesList.innerHTML = '<p>No messages yet.</p>';
                updateUIElements();
                updateSearchResultsDisplay();
                return;
            }

            if (allMessages.length === 0) { // Fetch all messages only if not already loaded
                const fetchedMessages = [];
                snapshot.forEach(childSnapshot => {
                    fetchedMessages.push({ id: childSnapshot.key, ...childSnapshot.val() });
                });
                allMessages = sortMessages(fetchedMessages, currentSortOrder);
            } else if (isSortChange) {
                // Re-sort existing messages if only sort order changed
                allMessages = sortMessages([...allMessages], currentSortOrder);
            }

            const messagesToLoad = isLazyLoadingEnabled 
                ? allMessages.slice(currentDisplayedCount, currentDisplayedCount + MESSAGES_PER_LOAD)
                : allMessages.slice(0); // Get a copy if not lazy loading to avoid modifying original `allMessages` if it's used elsewhere
            
            displayMessages(messagesToLoad);
            currentDisplayedCount += messagesToLoad.length;

            updateUIElements();
            updateSearchResultsDisplay();

            // Handle scrolling to a specific message if `window.scrollToMessageAfterLoad` is set
            if (window.scrollToMessageAfterLoad) {
                const messageIdToScroll = window.scrollToMessageAfterLoad;
                // Ensure this only happens once per load or sort change for that specific message
                if (!isSortChange || (isSortChange && newSortOrder === currentSortOrder)) { 
                    const messageElement = document.querySelector(`li[data-id="${messageIdToScroll}"]`);
                    if (messageElement) {
                        messageElement.scrollIntoView({ behavior: 'smooth' });
                    }
                }
                // Reset only if we scrolled or it was a sort change that would negate the previous scroll target
                if (document.querySelector(`li[data-id="${messageIdToScroll}"]`) || isSortChange) {
                    window.scrollToMessageAfterLoad = null;
                }
            }

        }).catch(error => {
            console.error("Error fetching messages: ", error);
            if (loader) loader.style.display = 'none';
            messagesList.innerHTML = '<p>Error loading messages.</p>';
        });
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