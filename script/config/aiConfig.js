// AI Configuration
export const AI_CONFIG = {
    // API Configurations
    API_URL: 'https://openrouter.ai/api/v1/chat/completions',
    API_KEY: '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',
    // Model Configuration
    MODELS: {
        DEFAULT: 'google/gemini-2.0-flash-exp:free',
        // FALLBACK: 'google/gemini-2.5-pro-exp-03-25:free'
    },
    
    // Request Configuration
    REQUEST_CONFIG: {
        temperature: 0.8,
        max_tokens: 100
    },
    //sata
    // Search Configuration
    SEARCH_CONFIG: {
        max_messages: 5,
        max_text_length: 200,
        min_results: 3,
        default_score: 50
    }
}; 
