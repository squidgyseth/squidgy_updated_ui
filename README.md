# Peritus Newsletter Interface

A web-based interface for generating the Peritus newsletter using Claude AI via OpenRouter.

## Overview

This application provides a simple chat interface that allows Peritus team members to input their weekly guidelines and receive a generated newsletter. The system supports both text and voice input methods.

## Features

- **Chat Interface**: Simple and intuitive chat UI for interacting with Claude AI
- **Text Input**: Standard text input for providing guidelines
- **Voice Mode Toggle**: Switch between text and voice conversation modes
- **Voice Conversation**: Fully voice-based conversation with automatic speech detection and text-to-speech responses
- **Session Management**: Unique session IDs to maintain conversation context across interactions
- **Newsletter Settings**: Configure template ID and number of images for newsletter generation
- **Newsletter Display**: Renders the generated newsletter HTML directly in the interface
- **Image Upload**: Replace image placeholders in the newsletter with uploaded images
- **Newsletter Download**: Download the completed newsletter as an HTML file
- **Instructions Tab**: Contains information on how to use the system
- **Knowledge Base Tab**: Contains reference information for the newsletter generation

## Technical Details

- The application is built with vanilla HTML, CSS, and JavaScript
- Voice features use the Web Speech API:
  - Speech Recognition (SpeechRecognition or webkitSpeechRecognition) for voice input
  - Speech Synthesis (SpeechSynthesisUtterance) for text-to-speech output
- Automatic silence detection (2 seconds) to determine when the user has finished speaking
- Communication with Claude AI is handled via an n8n webhook
- The webhook endpoint is: `https://n8n.theaiteam.uk/webhook/50a96b33-becb-4fa1-bd57-535251afdeeb`

### n8n Workflow

The application connects to an n8n workflow that:
1. Receives messages via webhook
2. Processes them using Claude Sonnet 4.5 via OpenRouter
3. Maintains conversation memory for each user session
4. Returns formatted responses with a status indicator

### Response Format

The n8n webhook returns responses in this JSON format:
```json
{
  "response": "The AI-generated response text with markdown formatting",
  "Status": "Waiting" or "Ready"
}
```

The interface handles this format by:
- Displaying the response with proper formatting (headers, bold, checkboxes, etc.)
- Showing a completion notification when Status changes to "Ready"
- Making checkboxes interactive for user selection

## Setup

### Option 1: Direct File Access
1. Clone this repository
2. Open `index.html` directly in a web browser

### Option 2: Local Server (Recommended for Voice Features)
1. Clone this repository
2. Make sure you have Node.js installed
3. Run the server using one of these methods:
   - Double-click the `start-server.bat` file (Windows)
   - Run `node server.js` in a terminal
4. Open your browser and navigate to `http://localhost:3000`

**Note:** Using the local server is recommended for proper functionality of voice features, as some browsers restrict speech recognition APIs when running from local files.

### Option 3: Deploy to Vercel
1. Fork this repository to your GitHub account
2. Sign up for a Vercel account at https://vercel.com
3. Create a new project in Vercel and connect it to your GitHub repository
4. Configure the project with the following settings:
   - Framework Preset: `Other`
   - Root Directory: `./`
   - Build Command: `npm install`
   - Output Directory: `./`
5. Deploy the project
6. Your application will be available at the URL provided by Vercel

## Usage

### Text Input Mode
1. Ensure the "Voice Conversation Mode" toggle is off
2. Enter this week's guidelines using text input
3. You can also use the microphone button for quick voice-to-text input
4. Submit your input
5. The system will process your request and generate a newsletter
6. Review the generated newsletter and request any necessary adjustments

### Voice Conversation Mode
1. Turn on the "Voice Conversation Mode" toggle at the top of the chat
2. Click the "Start Speaking" button
3. Speak your guidelines - the system will automatically detect when you've finished speaking (after 2 seconds of silence)
4. Review your transcribed text and click "Send" or "Cancel"
5. The system will process your request and generate a response
6. The response will be read aloud automatically
7. After the response is read, the system will automatically start listening again for your next input

### Session Management
1. Each browser instance maintains a unique session ID stored in local storage
2. The session ID is displayed at the top of the chat interface
3. All messages sent to the webhook include this session ID to maintain conversation context
4. To start a new session, click the "New Session" button
5. Starting a new session will:
   - Generate a new unique session ID
   - Clear the current conversation history
   - Begin a fresh conversation with Claude

### Newsletter Settings
1. Navigate to the Settings tab
2. Configure the following options:
   - **Template ID**: Select the newsletter template to use (currently supports templates 1-3)
   - **Number of Images**: Specify how many images should be included in the newsletter
3. Click "Save Settings" to apply the changes
4. Settings are stored in your browser's local storage and will persist between sessions

### Newsletter Editing
1. After answering all the required questions, the system will generate a newsletter
2. The newsletter will be displayed directly in the chat interface
3. Image placeholders marked with `[IMG_HERE]` will be converted to upload buttons
4. To add an image:
   - Click the "Upload Image" button below a placeholder
   - Select an image file from your device
   - The image will be displayed in the newsletter
5. To change an uploaded image:
   - Click the "Change Image" button that appears after uploading
   - Select a new image file
6. When finished editing:
   - Click the "Download Newsletter" button at the bottom of the newsletter
   - The newsletter will be saved as an HTML file with all your uploaded images embedded

## Browser Compatibility

The application works best in modern browsers:
- Chrome (recommended for voice input)
- Firefox
- Edge
- Safari

Note: Voice input functionality may not be available in all browsers.

## Future Enhancements

- User authentication
- Newsletter template selection
- History of previous newsletters
- Direct editing of generated newsletters
- Integration with email delivery systems
