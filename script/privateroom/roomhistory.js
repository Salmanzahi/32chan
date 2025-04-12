import { showAlert } from "../alert/alert.js";
import { db } from "../mainalt.js";

// Function to save room to history when created or joined
export function saveRoomToHistory(roomName, roomId, isCreator) {
    try {
        // Get current user
        const user = firebase.auth().currentUser;
        if (!user) return;
        
        // Reference to user's room history in Firebase
        const userRoomHistoryRef = db.ref(`users/${user.uid}/roomHistory/${roomId}`);
        
        // Room data to save
        const roomData = {
            roomId: roomId,
            roomName: roomName,
            timestamp: Date.now(),
            isCreator: isCreator,
            lastVisited: Date.now()
        };
        
        // Save to Firebase
        userRoomHistoryRef.set(roomData, (error) => {
            if (error) {
                console.error('Error saving room to history:', error);
                showAlert('Error updating room history', 'error');
            }
        });
    } catch (error) {
        console.error('Error saving room to history:', error);
    }
}

// Function to load room history
export function loadRoomHistory() {
    return new Promise((resolve, reject) => {
        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                resolve([]);
                return;
            }
            
            // Reference to user's room history in Firebase
            const userRoomHistoryRef = db.ref(`users/${user.uid}/roomHistory`);
            
            userRoomHistoryRef.once('value')
                .then((snapshot) => {
                    const roomHistory = [];
                    
                    if (snapshot.exists()) {
                        // Convert Firebase object to array
                        const historyData = snapshot.val();
                        
                        Object.keys(historyData).forEach(roomId => {
                            roomHistory.push({
                                ...historyData[roomId],
                                roomId: roomId // Ensure roomId is included
                            });
                        });
                    }
                    
                    // Sort by last visited (most recent first)
                    resolve(roomHistory.sort((a, b) => b.lastVisited - a.lastVisited));
                })
                .catch((error) => {
                    console.error('Error loading room history from Firebase:', error);
                    resolve([]);
                });
        } catch (error) {
            console.error('Error in loadRoomHistory:', error);
            resolve([]);
        }
    });
}

// Function to setup real-time listener for room history updates
let roomHistoryListener = null;

export function setupRoomHistoryListener() {
    try {
        // Remove any existing listener
        removeRoomHistoryListener();
        
        const user = firebase.auth().currentUser;
        if (!user) return;
        
        // Reference to user's room history in Firebase
        const userRoomHistoryRef = db.ref(`users/${user.uid}/roomHistory`);
        
        // Set up real-time listener
        roomHistoryListener = userRoomHistoryRef.on('value', (snapshot) => {
            // When data changes, update the display
            displayRoomHistory();
        }, (error) => {
            console.error('Error in room history listener:', error);
        });
    } catch (error) {
        console.error('Error setting up room history listener:', error);
    }
}

// Function to remove room history listener
export function removeRoomHistoryListener() {
    try {
        const user = firebase.auth().currentUser;
        if (!user || !roomHistoryListener) return;
        
        // Reference to user's room history in Firebase
        const userRoomHistoryRef = db.ref(`users/${user.uid}/roomHistory`);
        
        // Remove the listener
        userRoomHistoryRef.off('value', roomHistoryListener);
        roomHistoryListener = null;
    } catch (error) {
        console.error('Error removing room history listener:', error);
    }
}

// Function to display room history on the page
export function displayRoomHistory() {
    try {
        const historySection = document.getElementById('roomHistory');
        if (!historySection) return;
        
        // Show loading indicator
        historySection.innerHTML = '<p class="text-gray-300">Loading room history...</p>';
        
        // Load room history from Firebase (returns a Promise)
        loadRoomHistory()
            .then(roomHistory => {
                // Clear existing content
                historySection.innerHTML = '';
                
                if (roomHistory.length === 0) {
                    historySection.innerHTML = '<p class="text-gray-300">No room history found.</p>';
                    return;
                }
                
                // Create room history list
                const historyList = document.createElement('div');
                historyList.className = 'space-y-2';
                
                roomHistory.forEach(room => {
                    const roomItem = document.createElement('div');
                    roomItem.className = 'bg-gray-700 p-3 rounded-lg flex justify-between items-center';
                    
                    const date = new Date(room.timestamp);
                    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                    
                    roomItem.innerHTML = `
                        <div>
                            <h3 class="text-white font-semibold">${room.roomName}</h3>
                            <p class="text-gray-300 text-sm">${formattedDate}</p>
                            <span class="text-xs ${room.isCreator ? 'text-green-400' : 'text-blue-400'}">
                                ${room.isCreator ? 'Creator' : 'Member'}
                            </span>
                        </div>
                        <button class="join-room-btn bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
                            data-room-id="${room.roomId}">
                            Join
                        </button>
                    `;
                    
                    historyList.appendChild(roomItem);
                });
                
                historySection.appendChild(historyList);
                
                // Add event listeners to join buttons
                document.querySelectorAll('.join-room-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        const roomId = this.getAttribute('data-room-id');
                        window.location.href = `room.html?id=${roomId}`;
                    });
                });
            })
            .catch(error => {
                console.error('Error displaying room history:', error);
                historySection.innerHTML = '<p class="text-gray-300">Error loading room history.</p>';
            });
    } catch (error) {
        console.error('Error in displayRoomHistory:', error);
        const historySection = document.getElementById('roomHistory');
        if (historySection) {
            historySection.innerHTML = '<p class="text-gray-300">Error loading room history.</p>';
        }
    }
}

// Initialize room history display when DOM is loaded and user is authenticated
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already authenticated
    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
        displayRoomHistory();
        setupRoomHistoryListener();
    }
    
    // Add auth state listener to handle authentication changes
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            displayRoomHistory();
            setupRoomHistoryListener();
        } else {
            // Clean up listener when user logs out
            removeRoomHistoryListener();
        }
    });
});

// Clean up listener when page unloads
window.addEventListener('beforeunload', () => {
    removeRoomHistoryListener();
});