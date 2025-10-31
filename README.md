# Peritus Newsletter Interface

A web-based interface for generating the Peritus newsletter using Claude AI via OpenRouter.

## Overview

This application provides a simple chat interface that allows Peritus team members to input their weekly guidelines and receive a generated newsletter. The system supports both text and voice input methods, with a powerful newsletter editor for customization.

## Features

- **Chat Interface**: Simple and intuitive chat UI for interacting with Claude AI
- **Text Input**: Standard text input for providing guidelines
- **Voice Mode Toggle**: Switch between text and voice conversation modes
- **Voice Conversation**: Fully voice-based conversation with automatic speech detection and text-to-speech responses
- **Session Management**: Unique session IDs to maintain conversation context across interactions
- **Newsletter Settings**: Configure template ID and number of images for newsletter generation
- **Newsletter Editor**: Advanced editor with the following capabilities:
  - **Live Text Editing**: Click any text in the newsletter to edit it directly
  - **Rich Text Formatting**: Bold, italic, underline, font size, font family, and text color
  - **Image Management**: Upload and replace image placeholders
  - **Save Options**: 
    - Save locally to browser storage
    - Save to Supabase database
    - Download as HTML file
- **Database Integration**: Newsletters are automatically saved to Supabase for persistence
- **Instructions Tab**: Contains information on how to use the system
- **Knowledge Base Tab**: Contains reference information for the newsletter generation

## Technical Details

- The application is built with vanilla HTML, CSS, and JavaScript
- Backend powered by Node.js with Express
- Voice features use the Web Speech API:
  - Speech Recognition (SpeechRecognition or webkitSpeechRecognition) for voice input
  - Speech Synthesis (SpeechSynthesisUtterance) for text-to-speech output
- Automatic silence detection (2 seconds) to determine when the user has finished speaking
- Communication with Claude AI is handled via an n8n webhook
- The webhook endpoint is: `https://n8n.theaiteam.uk/webhook/50a96b33-becb-4fa1-bd57-535251afdeeb`
- Database: Supabase (PostgreSQL) for newsletter storage
  - Table: `Peritus Newsletter`
  - Stores newsletter HTML with timestamps

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
2. Click "Open in Editor" to launch the newsletter editor in a new window
3. In the editor, you can:
   - **Edit Text**: Click any text element to edit it directly
   - **Format Text**: Use the formatting toolbar to apply bold, italic, underline, change font size, font family, and text color
   - **Upload Images**: 
     - Select an image placeholder from the sidebar
     - Click "Select Image" to upload an image
     - The image will replace the placeholder in the newsletter
   - **Save Your Work**:
     - **Save**: Saves changes to browser storage
     - **Save to Database**: Saves the newsletter to Supabase database
     - **Download Newsletter**: Downloads the newsletter as a standalone HTML file
4. All images are embedded as base64 data, so the downloaded HTML is completely self-contained

## Browser Compatibility

The application works best in modern browsers:
- Chrome (recommended for voice input)
- Firefox
- Edge
- Safari

Note: Voice input functionality may not be available in all browsers.

## Project Structure

```
peritus-newsletter/
├── index.html              # Main application interface
├── app.js                  # Main application logic
├── styles.css              # Application styles
├── newsletter-editor.html  # Newsletter editor interface
├── server.js               # Node.js server with API endpoints
├── package.json            # Node.js dependencies
├── templates/              # Newsletter templates
├── public/                 # Public assets
└── api/                    # API routes
```

## API Endpoints

### POST /api/save-newsletter
Saves a newsletter to the Supabase database.

**Request Body:**
```json
{
  "html": "<html>...</html>"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Newsletter saved to database successfully",
  "data": [...]
}
```

## Environment Variables

The application uses the following configuration:
- **Supabase URL**: `https://plucnavrxntdcjptpqgq.supabase.co`
- **Supabase Key**: Configured in `server.js`
- **Port**: 3000 (default) or set via `PORT` environment variable

## Future Enhancements

- User authentication
- Newsletter template management
- History of previous newsletters with retrieval
- Email delivery integration
- Multi-user collaboration
- Newsletter analytics
