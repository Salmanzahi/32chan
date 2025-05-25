import { AI_CONFIG } from '../config/aiConfig.js';

/**
 * Performs keyword-based search with relevance scoring
 * @param {string} query - Search query
 * @param {Array} messages - Array of messages to search through
 * @returns {Promise<Array>} - Array of relevant messages with similarity scores
 */
export async function performAISearch(query, messages) {
    try {
        if (!query || !messages || !Array.isArray(messages)) {
            console.error('Invalid input parameters:', { query, messages });
            throw new Error('Invalid input parameters');
        }

        console.log('Performing keyword-based search for:', query);

        // Normalize the search query
        const normalizedQuery = normalizeText(query);
        const queryWords = extractKeywords(normalizedQuery);

        if (queryWords.length === 0) {
            console.warn('No valid keywords found in query');
            return [];
        }

        // Score all messages based on keyword relevance
        const scoredMessages = messages.map((message, index) => {
            const score = calculateRelevanceScore(message, queryWords, query);
            return {
                message,
                score,
                index
            };
        });

        // Filter out messages with zero score and sort by relevance
        const relevantMessages = scoredMessages
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score);

        // Return top 5 most relevant messages
        const topResults = relevantMessages.slice(0, AI_CONFIG.SEARCH_CONFIG.max_results);

        console.log(`Found ${relevantMessages.length} relevant messages, returning top ${topResults.length}`);

        return topResults;

    } catch (error) {
        console.error('Keyword Search Error:', error);
        // Return empty array on error instead of all messages
        return [];
    }
}

/**
 * Normalizes text for better matching
 * @param {string} text - Text to normalize
 * @returns {string} - Normalized text
 */
function normalizeText(text) {
    if (!text) return '';

    return text
        .toLowerCase()
        .trim()
        // Remove extra whitespace
        .replace(/\s+/g, ' ')
        // Remove special characters but keep spaces and basic punctuation
        .replace(/[^\w\s\-_.]/g, ' ')
        .trim();
}

/**
 * Extracts meaningful keywords from text
 * @param {string} text - Text to extract keywords from
 * @returns {Array} - Array of keywords
 */
function extractKeywords(text) {
    if (!text) return [];

    // Common stop words to filter out
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
        'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
        'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your',
        'his', 'her', 'its', 'our', 'their', 'what', 'when', 'where', 'why', 'how', 'who', 'which',
        // Indonesian stop words
        'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'dengan', 'pada', 'dalam', 'adalah', 'ini', 'itu',
        'atau', 'juga', 'tidak', 'ada', 'akan', 'sudah', 'telah', 'bisa', 'dapat', 'harus', 'saya',
        'anda', 'dia', 'mereka', 'kita', 'kami', 'nya', 'mu', 'ku', 'se', 'ter', 'ber', 'me'
    ]);

    return text
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word))
        .filter(word => !/^\d+$/.test(word)); // Remove pure numbers
}

/**
 * Calculates relevance score for a message based on keyword matching
 * @param {Object} message - Message object with title, text, userDisplayName
 * @param {Array} queryWords - Array of search keywords
 * @param {string} originalQuery - Original search query
 * @returns {number} - Relevance score (0-100)
 */
function calculateRelevanceScore(message, queryWords, originalQuery) {
    if (!message || queryWords.length === 0) return 0;

    // Extract and normalize message content
    const title = normalizeText(message.title || '');
    const text = normalizeText(message.text || '');
    const author = normalizeText(message.userDisplayName || '');
    const fullContent = `${title} ${text} ${author}`;

    if (!fullContent.trim()) return 0;

    let totalScore = 0;
    let matchedWords = 0;

    // Check for exact phrase match (highest priority)
    const normalizedQuery = normalizeText(originalQuery);
    if (fullContent.includes(normalizedQuery)) {
        totalScore += 50; // Bonus for exact phrase match
    }

    // Score individual keywords
    queryWords.forEach(keyword => {
        let keywordScore = 0;

        // Title matches (highest weight)
        const titleMatches = countMatches(title, keyword);
        if (titleMatches > 0) {
            keywordScore += titleMatches * 15; // 15 points per title match
            matchedWords++;
        }

        // Content matches (medium weight)
        const textMatches = countMatches(text, keyword);
        if (textMatches > 0) {
            keywordScore += textMatches * 8; // 8 points per content match
            matchedWords++;
        }

        // Author matches (lower weight)
        const authorMatches = countMatches(author, keyword);
        if (authorMatches > 0) {
            keywordScore += authorMatches * 5; // 5 points per author match
            matchedWords++;
        }

        // Bonus for exact word match vs partial match
        if (title.includes(` ${keyword} `) || title.startsWith(`${keyword} `) || title.endsWith(` ${keyword}`)) {
            keywordScore += 10; // Exact word match bonus in title
        }
        if (text.includes(` ${keyword} `) || text.startsWith(`${keyword} `) || text.endsWith(` ${keyword}`)) {
            keywordScore += 5; // Exact word match bonus in content
        }

        totalScore += keywordScore;
    });

    // Calculate match percentage
    const matchPercentage = (matchedWords / queryWords.length) * 100;

    // Apply match percentage bonus
    totalScore = totalScore * (0.5 + (matchPercentage / 200)); // 50% base + up to 50% bonus

    // Normalize score to 0-100 range
    const finalScore = Math.min(100, Math.max(0, Math.round(totalScore)));

    return finalScore;
}

/**
 * Counts occurrences of a keyword in text (case-insensitive, partial matches)
 * @param {string} text - Text to search in
 * @param {string} keyword - Keyword to search for
 * @returns {number} - Number of matches
 */
function countMatches(text, keyword) {
    if (!text || !keyword) return 0;

    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = text.match(regex);
    return matches ? matches.length : 0;
}

/**
 * Highlights relevant parts of the text based on AI analysis
 * @param {string} text - Original text
 * @param {string} query - Search query
 * @param {number} score - Similarity score
 * @returns {string} - HTML with highlighted text and score indicator
 */
export function highlightRelevantText(text, query, score) {
    if (!text) return '';

    // Add similarity score indicator
    const scoreIndicator = `<span class="similarity-score" style="font-size: 0.8em; color: ${getScoreColor(score)};">
        ${score ? `${Math.round(score)}% match` : ''}
    </span>`;

    try {
        // Escape special characters in the query for regex
        const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(safeQuery, 'gi');
        const highlightedText = text.replace(regex, match => `<mark class="ai-highlight">${match}</mark>`);

        return `${scoreIndicator} ${highlightedText}`;
    } catch (error) {
        console.error('Error highlighting text:', error);
        return `${scoreIndicator} ${text}`;
    }
}

/**
 * Gets color for similarity score
 * @param {number} score - Similarity score
 * @returns {string} - CSS color value
 */
export function getScoreColor(score) {
    if (!score) return '#666';
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFC107';
    return '#FF5722';
}