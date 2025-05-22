// AI Configuration
export const AI_CONFIG = {
    // API Configurations
    API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    API_KEY: 'AIzaSyCk6ZkzIX-4e_ebVQvNWBmzo5w0X4J4C3k', // Replace with your actual Gemini API key

    // Model Configuration
    MODELS: {
        DEFAULT: 'gemini-2.0-flash', // Gemini model name (used for logging)
    },

    // Request Configuration
    REQUEST_CONFIG: {
        temperature: 0.8,
        maxOutputTokens: 100, // Gemini uses maxOutputTokens instead of max_tokens
        topK: 40,
        topP: 0.95
    },

    // Search Configuration
    SEARCH_CONFIG: {
        max_messages: 5,
        max_text_length: 200,
        min_results: 3,
        default_score: 50
    },

    // Response format mapping (helps with compatibility)
    RESPONSE_MAPPING: {
        choices_path: 'candidates',
        message_path: 'content',
        content_path: 'parts[0].text'
    }
};
