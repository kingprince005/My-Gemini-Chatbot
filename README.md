# Gemini AI Chatbot

A standalone HTML chatbot powered by Google's Gemini AI model. This chatbot allows you to interact with Gemini directly in your browser without any server setup.

## Features

- Clean, modern UI with dark/light mode
- No server required - runs entirely in your browser
- API key securely stored in your browser's localStorage
- Demo mode for testing without an API key
- Voice input support (in compatible browsers)
- Syntax highlighting for code responses
- Chat history saving and export
- Works offline once loaded

## How to Use

1. **Launch the Chatbot**:
   - Double-click `run-chatbot.bat` to open in your default browser
   - Or open `gemini-chatbot/standalone.html` directly in any browser

2. **Set Up Your API Key**:
   - You'll need a Google Gemini API key to use the chatbot
   - Get a free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Enter your API key when prompted and click "Save API Key"
   - Or click "Try Demo Mode" to test without an API key

3. **Chat with Gemini**:
   - Type your questions or commands in the input field
   - Press Enter or click the send button
   - Use Shift+Enter for new lines in your message
   - Click on voice input icon (if available) to speak your query

## Troubleshooting

If you're having issues:

1. **API Key Not Saving**: Clear your browser cache or try using Incognito mode
2. **Blank Screen**: Ensure JavaScript is enabled in your browser
3. **Invalid API Key Errors**: Get a new key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Developer Notes

This is a standalone HTML application with no external dependencies. The entire code is contained within `standalone.html` file.

## License

This project is open source and available for personal or commercial use. Attribution is appreciated but not required. 