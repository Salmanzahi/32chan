// Spotify API Integration for 32Chan
// This file handles Spotify authentication, search, and track selection

// Spotify API credentials
// Note: In a production environment, these should be stored securely
const spotifyConfig = {
    clientId: 'ce846521760443b5b6932d4d217940ec', // Add your Spotify Client ID here
    redirectUri: 'https://unicraft.fun/callback.html',
    authEndpoint: 'https://accounts.spotify.com/authorize',
    tokenEndpoint: 'https://accounts.spotify.com/api/token',
    scopes: ['user-read-private', 'user-read-email']
};

// Spotify API token management
let spotifyToken = null;
let tokenExpiry = null;

// Check if we have a valid token
export function hasValidSpotifyToken() {
    // Prioritize checking localStorage directly as spotifyToken and tokenExpiry might not be initialized yet
    // if initSpotify() hasn't been called or completed fully across page loads.
    const savedToken = localStorage.getItem('spotify_token');
    const savedExpiry = localStorage.getItem('spotify_token_expiry');
    if (savedToken && savedExpiry && new Date() < new Date(savedExpiry)) {
        // Update module-level variables if they are out of sync
        if (!spotifyToken || spotifyToken !== savedToken) {
            spotifyToken = savedToken;
        }
        if (!tokenExpiry || tokenExpiry.toISOString() !== savedExpiry) {
            tokenExpiry = new Date(savedExpiry);
        }
        return true;
    }
    // Fallback to in-memory variables if localStorage is somehow cleared but app is still running
    return spotifyToken && tokenExpiry && new Date() < tokenExpiry;
}

// Initialize Spotify authentication
export function initSpotify() {
    // Check if we already have a token in localStorage
    const savedToken = localStorage.getItem('spotify_token');
    const savedExpiry = localStorage.getItem('spotify_token_expiry');

    // Check if we're returning from Spotify auth
    const returningFromAuth = localStorage.getItem('spotify_auth_return');
    if (returningFromAuth === 'true') {
        // Clear the flag
        localStorage.removeItem('spotify_auth_return');

        // Don't reset the form to preserve user input
        // Form will only be reset after successful message submission
    }

    if (savedToken && savedExpiry && new Date() < new Date(savedExpiry)) {
        spotifyToken = savedToken;
        tokenExpiry = new Date(savedExpiry);
        return true;
    }

    return false;
}

// Generate a random string for state parameter
export function generateRandomString(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

// Redirect to Spotify authorization page
export function authorizeSpotify() {
    if (!spotifyConfig.clientId) {
        console.error('Spotify Client ID is not configured');
        return;
    }

    // Set a flag to indicate we're about to authenticate with Spotify
    // This will help us know to clear the form when we return
    localStorage.setItem('spotify_auth_initiated', 'true');

    const state = generateRandomString(16);
    localStorage.setItem('spotify_auth_state', state);

    const authUrl = new URL(spotifyConfig.authEndpoint);
    const params = {
        response_type: 'token',
        client_id: spotifyConfig.clientId,
        scope: spotifyConfig.scopes.join(' '),
        redirect_uri: spotifyConfig.redirectUri,
        state: state
    };

    Object.keys(params).forEach(key => authUrl.searchParams.append(key, params[key]));
    window.location.href = authUrl.toString();
}

// Handle the callback from Spotify authorization
export function handleSpotifyCallback() {
    const hash = window.location.hash.substring(1);
    const params = {};

    hash.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        params[key] = decodeURIComponent(value);
    });

    if (params.access_token) {
        // Verify state to prevent CSRF attacks
        const storedState = localStorage.getItem('spotify_auth_state');
        if (params.state !== storedState) {
            console.error('State mismatch');
            return false;
        }

        // Store the token
        spotifyToken = params.access_token;
        const expiresIn = parseInt(params.expires_in, 10) || 3600; // Default to 1 hour
        tokenExpiry = new Date(new Date().getTime() + expiresIn * 1000);

        localStorage.setItem('spotify_token', spotifyToken);
        localStorage.setItem('spotify_token_expiry', tokenExpiry.toISOString());

        // Set a flag to indicate we're returning from Spotify auth
        localStorage.setItem('spotify_auth_return', 'true');

        // Clean up
        localStorage.removeItem('spotify_auth_state');

        return true;
    }

    return false;
}

// Search for tracks on Spotify
export async function searchSpotifyTracks(query) {
    // Always get the latest token from localStorage to ensure we're using the current user's token
    const currentToken = localStorage.getItem('spotify_token');

    if (!currentToken) {
        console.error('No valid Spotify token');
        return [];
    }

    try {
        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        // Check for specific error codes that might indicate auth issues
        if (response.status === 401) {
            console.error('Spotify token expired or invalid');
            localStorage.removeItem('spotify_token');
            localStorage.removeItem('spotify_token_expiry');
            return [];
        }

        if (!response.ok) {
            throw new Error(`Spotify API error: ${response.status}`);
        }

        const data = await response.json();
        return data.tracks.items.map(track => ({
            id: track.id,
            name: track.name,
            artist: track.artists.map(artist => artist.name).join(', '),
            album: track.album.name,
            albumArt: track.album.images[0]?.url,
            previewUrl: track.preview_url,
            externalUrl: track.external_urls.spotify
        }));
    } catch (error) {
        console.error('Error searching Spotify tracks:', error);
        return [];
    }
}

// Get track details by ID
export async function getTrackDetails(trackId) {
    // Always get the latest token from localStorage
    const currentToken = localStorage.getItem('spotify_token');

    if (!currentToken) {
        console.error('No valid Spotify token');
        return null;
    }

    try {
        const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        // Check for auth issues
        if (response.status === 401) {
            console.error('Spotify token expired or invalid');
            localStorage.removeItem('spotify_token');
            localStorage.removeItem('spotify_token_expiry');
            return null;
        }

        if (!response.ok) {
            throw new Error(`Spotify API error: ${response.status}`);
        }

        const track = await response.json();
        return {
            id: track.id,
            name: track.name,
            artist: track.artists.map(artist => artist.name).join(', '),
            album: track.album.name,
            albumArt: track.album.images[0]?.url,
            previewUrl: track.preview_url,
            externalUrl: track.external_urls.spotify
        };
    } catch (error) {
        console.error('Error getting track details:', error);
        return null;
    }
}

// Create Spotify track embed HTML
export function createTrackEmbed(trackId) {
    return `<iframe src="https://open.spotify.com/embed/track/${trackId}"
            width="100%" height="80" frameborder="0" allowtransparency="true"
            allow="encrypted-media"></iframe>`;
}

// Initialize Spotify search UI in the message form
export function initSpotifySearchUI() {
    const spotifySearchContainer = document.getElementById('spotifySearchContainer');
    if (!spotifySearchContainer) return;

    const searchInput = document.getElementById('spotifySearchInput');
    const searchResults = document.getElementById('spotifySearchResults');
    const selectedTrackContainer = document.getElementById('selectedSpotifyTrack');

    // Check if we're returning from Spotify auth
    const returningFromAuth = localStorage.getItem('spotify_auth_return');
    if (returningFromAuth === 'true') {
        // Clear the flag
        localStorage.removeItem('spotify_auth_return');

        // Don't reset the form to preserve user input
        // Form will only be reset after successful message submission
        console.log('Preserving form data after Spotify authentication');
    }

    // Handle search input
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();

        if (query.length < 2) {
            searchResults.innerHTML = '';
            return;
        }

        searchTimeout = setTimeout(async () => {
            searchResults.innerHTML = '<div class="loading">Searching...</div>';
            const tracks = await searchSpotifyTracks(query);

            if (tracks.length === 0) {
                searchResults.innerHTML = '<div class="no-results">No tracks found</div>';
                return;
            }

            searchResults.innerHTML = '';
            tracks.forEach(track => {
                const trackElement = document.createElement('div');
                trackElement.className = 'spotify-track-result';
                trackElement.innerHTML = `
                    <img src="${track.albumArt || './images/suscat.jpg'}" alt="${track.album}" class="track-album-art">
                    <div class="track-info">
                        <div class="track-name">${track.name}</div>
                        <div class="track-artist">${track.artist}</div>
                    </div>
                `;

                trackElement.addEventListener('click', () => {
                    selectSpotifyTrack(track);
                    searchResults.innerHTML = '';
                    searchInput.value = '';
                });

                searchResults.appendChild(trackElement);
            });
        }, 500);
    });

    // This function will be defined globally outside this function
    // so it can be called from anywhere
}

// Select a track and display it in the form
export function selectSpotifyTrack(track) {
    const selectedTrackContainer = document.getElementById('selectedSpotifyTrack');
    if (!selectedTrackContainer) return;

    selectedTrackContainer.innerHTML = `
        <div class="selected-track-info">
            <img src="${track.albumArt || './images/suscat.jpg'}" alt="${track.album}" class="track-album-art">
            <div class="track-details">
                <div class="track-name">${track.name}</div>
                <div class="track-artist">${track.artist}</div>
            </div>
            <button type="button" class="remove-track-btn" onclick="clearSelectedSpotifyTrack()">×</button>
        </div>
    `;

    selectedTrackContainer.dataset.trackId = track.id;
    selectedTrackContainer.dataset.trackData = JSON.stringify(track);
    selectedTrackContainer.style.display = 'block';
}

// Get the selected track data for message submission
export function getSelectedSpotifyTrack() {
    const selectedTrackContainer = document.getElementById('selectedSpotifyTrack');
    if (!selectedTrackContainer || !selectedTrackContainer.dataset.trackData) {
        return null;
    }

    try {
        return JSON.parse(selectedTrackContainer.dataset.trackData);
    } catch (e) {
        console.error('Error parsing selected track data:', e);
        return null;
    }
}

// Clear selected Spotify track function
export function clearSelectedSpotifyTrack() {
    const selectedTrackContainer = document.getElementById('selectedSpotifyTrack');
    if (selectedTrackContainer) {
        selectedTrackContainer.innerHTML = '';
        selectedTrackContainer.dataset.trackId = '';
        selectedTrackContainer.style.display = 'none';
    }
}

// Make functions available globally
window.initSpotify = initSpotify;
window.authorizeSpotify = authorizeSpotify;
window.searchSpotifyTracks = searchSpotifyTracks;
window.selectSpotifyTrack = selectSpotifyTrack;
window.getSelectedSpotifyTrack = getSelectedSpotifyTrack;
window.clearSelectedSpotifyTrack = clearSelectedSpotifyTrack;