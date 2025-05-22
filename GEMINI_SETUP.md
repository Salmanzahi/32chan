# Gemini API Integration Setup

This application now uses Google's Gemini API for AI features. Follow these steps to set up your Gemini API key and get the AI features working.

## Getting a Gemini API Key

1. Visit the [Google AI Studio](https://makersuite.google.com/app/apikey) (you'll need to sign in with a Google account)
2. Click on "Get API key" or "Create API key"
3. Follow the prompts to create a new API key
4. Copy your new API key - you'll need it for the next step

## Configuring the Application

1. Open the file `script/config/aiConfig.js` in your code editor
2. Replace the placeholder API key with your actual Gemini API key:

```javascript
// Change this line:
API_KEY: 'YOUR_GEMINI_API_KEY',

// To this (replace with your actual key):
API_KEY: 'AIza...', // Your actual key will start with AIza
```

3. Save the file

## Testing the Integration

After setting up your API key, you can test the AI features:

1. Open the application in your browser
2. Navigate to the message board
3. Try using the AI search feature or the AI post assistant
4. If everything is working correctly, you should see AI-generated responses

## Troubleshooting

If you encounter issues:

- **Error 400**: Your prompt might be too long or contain content that violates Gemini's usage policies
- **Error 401**: Your API key might be invalid or incorrectly formatted
- **Error 429**: You've exceeded your API quota (free tier has limits)
- **No Response**: Check your browser console for specific error messages

## API Quotas and Limits

The free tier of Gemini API has the following limits:

- 60 queries per minute
- Limited number of tokens per day
- Maximum context size of 30,720 tokens

If you need higher limits, you can upgrade to a paid tier through Google Cloud.

## Additional Resources

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Google AI Studio](https://makersuite.google.com/)
- [Gemini API Pricing](https://ai.google.dev/pricing)
