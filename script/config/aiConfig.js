// AI Configuration
export const AI_CONFIG = {
    // API Configurations
    API_URL: 'https://openrouter.ai/api/v1/chat/completions',
    API_KEY: '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',
    
    // Model Configuration
    MODELS: {
        DEFAULT: 'google/gemini-2.0-flash-exp:free',
        FALLBACK: 'google/gemini-2.0-flash-exp:free'
    },
    
    // Request Configuration
    REQUEST_CONFIG: {
        temperature: 0.1,
        max_tokens: 100,
        response_format: { type: "json_object" }
    },
    
    // Search Configuration
    SEARCH_CONFIG: {
        max_messages: 5,
        max_text_length: 200,
        min_results: 3,
        default_score: 50
    }
}; 