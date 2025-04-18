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
    //sata
    // Search Configuration
    SEARCH_CONFIG: {
        max_messages: 5,
        max_text_length: 200,
        min_results: 3,
        default_score: 50
    }
}; 
