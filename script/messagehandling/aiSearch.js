import { AI_CONFIG } from '../config/aiConfig.js';

/**
 * Performs semantic search using OpenRouter AI
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

        // Prepare messages for analysis using config values
        const messageData = messages
            .slice(0, AI_CONFIG.SEARCH_CONFIG.max_messages)
            .map((m, index) => ({
                index,
                id: m.id,
                title: m.title,
                text: m.text?.substring(0, AI_CONFIG.SEARCH_CONFIG.max_text_length),
                userDisplayName: m.userDisplayName
            }));

        console.log('Sending request to OpenRouter API...');
        const response = await fetch(AI_CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_CONFIG.API_KEY}`,
                'HTTP-Referer': window.location.origin,
            },
            body: JSON.stringify({
                model: AI_CONFIG.MODELS.DEFAULT,
                messages: [
                    {
                        role: 'system',
                        content: `Analyze messages and return relevance scores as JSON array: [{"index":0,"score":95}]`
                    },
                    {
                        role: 'user',
                        content: `Query: "${query}"\nMessages: ${JSON.stringify(messageData)}`
                    }
                ],
                ...AI_CONFIG.REQUEST_CONFIG
            })
        });

        console.log('Received response from API:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('API Error:', errorData);
            
            // Handle credit limit error specifically
            if (errorData.error?.code === 402) {
                console.warn('Credit limit reached, falling back to basic search');
                // Fall back to basic search by returning all messages
                return messages.map((message, index) => ({
                    message,
                    score: AI_CONFIG.SEARCH_CONFIG.default_score
                }));
            }
            
            throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
        }

        const responseText = await response.text();
        console.log('Raw API response:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse API response:', parseError);
            throw new Error('Invalid JSON response from API');
        }

        console.log('Parsed API response:', data);
        
        // Validate response structure
        if (!data) {
            console.error('Empty API response');
            throw new Error('Empty API response');
        }

        if (!data.choices) {
            console.error('Missing choices in API response:', data);
            throw new Error('Missing choices in API response');
        }

        if (!Array.isArray(data.choices)) {
            console.error('Choices is not an array:', data.choices);
            throw new Error('Choices is not an array');
        }

        if (data.choices.length === 0) {
            console.error('Empty choices array');
            throw new Error('Empty choices array');
        }

        const firstChoice = data.choices[0];
        if (!firstChoice) {
            console.error('First choice is undefined');
            throw new Error('First choice is undefined');
        }

        if (!firstChoice.message) {
            console.error('Missing message in first choice:', firstChoice);
            throw new Error('Missing message in first choice');
        }

        if (!firstChoice.message.content) {
            console.error('Missing content in message:', firstChoice.message);
            throw new Error('Missing content in message');
        }

        // Extract and clean the response
        const aiResponse = firstChoice.message.content;
        console.log('AI Response:', aiResponse);
        
        const cleanResponse = aiResponse
            .replace(/```json\n|\n```|```/g, '') // Remove markdown
            .replace(/[\n\r]/g, '') // Remove newlines
            .trim();

        console.log('Cleaned response:', cleanResponse);

        // Parse and validate the response
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(cleanResponse);
        } catch (parseError) {
            console.error('Failed to parse AI response:', cleanResponse);
            throw new Error('Invalid JSON response from AI');
        }

        console.log('Parsed AI response:', parsedResponse);

        // Handle different response formats and ensure we get an array
        let results;
        if (Array.isArray(parsedResponse)) {
            results = parsedResponse;
        } else if (typeof parsedResponse === 'object') {
            // Try to extract array from different possible locations
            if (Array.isArray(parsedResponse.results)) {
                results = parsedResponse.results;
            } else if (Array.isArray(parsedResponse.matches)) {
                results = parsedResponse.matches;
            } else if (Array.isArray(parsedResponse.data)) {
                results = parsedResponse.data;
            } else {
                // If we can't find an array, try to convert the object to an array
                results = Object.entries(parsedResponse)
                    .filter(([key, value]) => typeof value === 'object' && 'index' in value && 'score' in value)
                    .map(([_, value]) => value);
            }
        }

        // If we still don't have an array, create one from the parsed response
        if (!Array.isArray(results)) {
            console.warn('Converting non-array response to array format');
            results = [{
                index: 0,
                score: 100
            }];
        }

        // Validate and process results
        const validResults = results
            .filter(r => r && typeof r.index === 'number' && typeof r.score === 'number')
            .map(r => ({
                index: Math.min(Math.max(0, r.index), messages.length - 1),
                score: Math.min(Math.max(0, r.score), 100)
            }))
            .sort((a, b) => b.score - a.score);

        // Ensure we have at least the minimum number of results
        const minResults = Math.min(AI_CONFIG.SEARCH_CONFIG.min_results, messages.length);
        const finalResults = validResults.length >= minResults 
            ? validResults.slice(0, Math.max(minResults, validResults.filter(r => r.score > 50).length))
            : validResults;

        // Map to final message format
        return finalResults.map(result => ({
            message: messages[result.index],
            score: result.score
        }));
    } catch (error) {
        console.error('AI Search Error:', error);
        // Return all messages with default score if AI search fails
        return messages.map((message, index) => ({
            message,
            score: AI_CONFIG.SEARCH_CONFIG.default_score
        }));
    }
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