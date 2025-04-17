// AI Configuration
export const AI_CONFIG = {
    // API Configurations
    API_URL: 'https://openrouter.ai/api/v1/chat/completions',
    API_KEY: ' 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',
    
    // Model Configuration
    MODELS: {
        DEFAULT: 'qwen/qwen2.5-coder-7b-instruct',
        FALLBACK: 'qwen/qwen2.5-coder-7b-instruct'
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