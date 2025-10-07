document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Chat Interface
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const voiceInputBtn = document.getElementById('voice-input-btn');
    const stopRecordingBtn = document.getElementById('stop-recording-btn');
    const recordingIndicator = document.getElementById('recording-indicator');
    
    // DOM Elements - Voice Mode
    const voiceModeToggle = document.getElementById('voice-mode-toggle');
    const textInputContainer = document.getElementById('text-input-container');
    const voiceControlContainer = document.getElementById('voice-control-container');
    const startVoiceBtn = document.getElementById('start-voice-btn');
    const stopVoiceBtn = document.getElementById('stop-voice-btn');
    const voiceStatus = document.getElementById('voice-status');
    const voiceTranscriptContainer = document.getElementById('voice-transcript-container');
    const voiceTranscript = document.getElementById('voice-transcript');
    const sendTranscriptBtn = document.getElementById('send-transcript-btn');
    const cancelTranscriptBtn = document.getElementById('cancel-transcript-btn');
    
    // DOM Elements - Settings
    const settingsForm = document.getElementById('settings-form');
    const templateIdSelect = document.getElementById('template-id');
    const imageCountInput = document.getElementById('image-count');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    
    // Session Management
    const sessionIdDisplay = document.getElementById('session-id');
    let sessionId = localStorage.getItem('peritus_session_id');
    
    // Generate a new session ID if one doesn't exist
    if (!sessionId) {
        sessionId = generateSessionId();
        localStorage.setItem('peritus_session_id', sessionId);
    }
    
    // Display the session ID if the element exists
    if (sessionIdDisplay) {
        sessionIdDisplay.textContent = `Session ID: ${sessionId}`;
    }
    
    // Newsletter Settings
    let settings = {
        templateId: '1',
        imageCount: 3
    };
    
    // Load settings from local storage if they exist
    const savedSettings = localStorage.getItem('peritus_newsletter_settings');
    if (savedSettings) {
        try {
            settings = JSON.parse(savedSettings);
            
            // Update form fields with saved settings
            if (templateIdSelect) templateIdSelect.value = settings.templateId;
            if (imageCountInput) imageCountInput.value = settings.imageCount;
        } catch (error) {
            console.error('Error parsing saved settings:', error);
        }
    }
    
    // Tab Navigation
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Direct Newsletter Editor Buttons
    const openEditorBtn = document.getElementById('open-editor-btn');
    const mainEditorBtn = document.getElementById('main-editor-btn');
    
    // Function to handle editor button clicks
    const handleEditorButtonClick = () => {
        console.log('Newsletter Editor button clicked');
        // Try to get the newsletter HTML from localStorage or global variable
        const newsletterHtml = localStorage.getItem('newsletter_html') || window.latestNewsletterHtml;
        if (newsletterHtml) {
            openNewsletterEditor(newsletterHtml);
        } else {
            // If no newsletter HTML is found, open the editor anyway
            // It will show an empty editor or error message
            openNewsletterEditor();
        }
    };
    
    // Add event listeners to both buttons
    if (openEditorBtn) {
        openEditorBtn.addEventListener('click', handleEditorButtonClick);
    }
    
    if (mainEditorBtn) {
        mainEditorBtn.addEventListener('click', handleEditorButtonClick);
    }
    
    // OpenRouter API configuration
    const WEBHOOK_URL = 'https://n8n.theaiteam.uk/webhook/50a96b33-becb-4fa1-bd57-535251afdeeb';
    
    // Speech recognition setup
    let recognition = null;
    let SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
    } else {
        console.warn('Speech recognition not supported in this browser');
    }
    
    // Speech synthesis setup
    const speechSynthesis = window.speechSynthesis;
    
    // State variables
    let isRecording = false;
    let transcriptText = '';
    let silenceTimer = null;
    let isSpeaking = false;
    let currentUtterance = null;
    
    // Tab switching functionality
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            console.log('Switching to tab:', tabName);
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show selected tab content
            tabContents.forEach(content => {
                console.log('Checking tab content:', content.id);
                if (content.id === tabName) {
                    console.log('Activating tab content:', content.id);
                    content.classList.add('active');
                    content.style.display = 'block';
                } else {
                    console.log('Deactivating tab content:', content.id);
                    content.classList.remove('active');
                    content.style.display = 'none';
                }
            });
        });
    });
    
    // Initialize tabs - make sure the active tab is visible
    const initializeTabs = () => {
        console.log('Initializing tabs');
        const activeTabBtn = document.querySelector('.tab-btn.active');
        if (activeTabBtn) {
            console.log('Found active tab button:', activeTabBtn.getAttribute('data-tab'));
            activeTabBtn.click();
        } else {
            console.log('No active tab button found, defaulting to chat');
            const chatTabBtn = document.querySelector('.tab-btn[data-tab="chat"]');
            if (chatTabBtn) chatTabBtn.click();
        }
    };
    
    // Initialize tabs after DOM is loaded
    setTimeout(initializeTabs, 100);
    
    // Send message function
    function sendMessage(customMessage = null) {
        const message = customMessage || userInput.value.trim();
        if (message === '') return;
        
        // Add user message to chat
        addMessageToChat('user', message);
        
        // Clear input if we're using the textarea
        if (!customMessage) {
            userInput.value = '';
        }
        
        // Send to webhook (not voice mode)
        sendToWebhook(message, false);
    }
    
    // Voice input functionality for text mode
    function startVoiceInput() {
        if (!recognition) {
            alert('Speech recognition is not supported in your browser. Please use Chrome or Edge for voice features.');
            return;
        }
        
        if (!isRecording) {
            try {
                // Reset state
                transcriptText = '';
                userInput.value = '';
                
                // Configure recognition for text input mode
                recognition.onresult = handleTextModeResult;
                recognition.onerror = handleTextModeError;
                recognition.onend = handleTextModeEnd;
                
                // Start recognition
                recognition.abort(); // Stop any existing recognition
                setTimeout(() => {
                    recognition.start();
                    isRecording = true;
                    recordingIndicator.classList.remove('hidden');
                    console.log('Text mode voice input started');
                }, 100);
                
            } catch (error) {
                console.error('Error starting text mode voice input:', error);
                alert('Error starting voice input. Please try again.');
            }
        }
    }
    
    function handleTextModeResult(event) {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                transcript += event.results[i][0].transcript + ' ';
            }
        }
        
        // Update the input field with the transcript
        if (transcript.trim()) {
            userInput.value = transcript.trim();
            console.log('Text mode transcript:', transcript.trim());
        }
    }
    
    function handleTextModeError(event) {
        console.error('Text mode speech recognition error:', event.error);
        stopVoiceInput();
    }
    
    function handleTextModeEnd() {
        console.log('Text mode recognition ended');
        // We don't restart in text mode, just stop recording
        isRecording = false;
        recordingIndicator.classList.add('hidden');
    }
    
    function stopVoiceInput() {
        console.log('Stopping text mode voice input');
        if (isRecording && recognition) {
            try {
                recognition.abort();
                isRecording = false;
                recordingIndicator.classList.add('hidden');
            } catch (error) {
                console.error('Error stopping text mode voice input:', error);
            }
        }
    }
    
    // Add message to chat
    function addMessageToChat(type, content, targetContainer = chatMessages) {
        // Remove typing indicator if it exists
        if (type !== 'system' || content !== 'Processing your request...') {
            const typingIndicator = targetContainer.querySelector('.message.system:last-child');
            if (typingIndicator && typingIndicator.querySelector('p').textContent === 'Processing your request...') {
                typingIndicator.remove();
            }
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const paragraph = document.createElement('p');
        paragraph.textContent = content;
        
        contentDiv.appendChild(paragraph);
        messageDiv.appendChild(contentDiv);
        targetContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        targetContainer.scrollTop = targetContainer.scrollHeight;
    }
    
    // Add formatted message to chat
    function addFormattedMessageToChat(type, content, targetContainer = chatMessages, useVoice = false) {
        // Remove typing indicator if it exists
        const typingIndicator = targetContainer.querySelector('.message.system:last-child');
        if (typingIndicator && typingIndicator.querySelector('p').textContent === 'Processing your request...') {
            typingIndicator.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Use innerHTML to render the formatted content
        contentDiv.innerHTML = content;
        
        // Add event listeners to any checkboxes that might be in the content
        const checkboxes = contentDiv.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                // When a checkbox is clicked, send an update message
                if (e.target.checked) {
                    const checkboxLabel = e.target.nextSibling?.textContent || 'Option';
                    const message = `I've selected: ${checkboxLabel.trim()}`;
                    
                    // Send the message to the appropriate chat based on which container we're in
                    if (targetContainer === voiceMessages) {
                        addMessageToChat('user', message, voiceMessages);
                        sendToWebhook(message, true);
                    } else {
                        sendMessage(message);
                    }
                }
            });
            // Remove the disabled attribute to make them interactive
            checkbox.removeAttribute('disabled');
        });
        
        messageDiv.appendChild(contentDiv);
        targetContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        targetContainer.scrollTop = targetContainer.scrollHeight;
        
        // If this is a voice conversation and it's an assistant message, read it aloud
        if (useVoice && type === 'assistant') {
            speakText(content);
        }
    }
    
    // Send data to webhook
    async function sendToWebhook(message, isVoiceMode = false) {
        // Always use the main chat container
        const messageContainer = chatMessages;
        
        // Show processing indicator
        addMessageToChat('system', 'Processing your request...', messageContainer);
        
        try {
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    timestamp: new Date().toISOString(),
                    source: 'peritus-newsletter-interface',
                    session_id: sessionId,
                    template_id: settings.templateId,
                    image_count: settings.imageCount
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // If there's a response from the webhook, display it
                if (data && data.response) {
                    // Check if this is a newsletter
                    console.log('Response status:', data.Status);
                    console.log('Full response data:', JSON.stringify(data, null, 2));
                    
                    // Check if it contains [IMG_HERE] - this is the most reliable indicator
                    const containsImgHere = data.response.includes('[IMG_HERE]');
                    
                    // Log this specifically - we'll use this as a trigger
                    if (containsImgHere) {
                        console.log('Newsletter HTML detected');
                    }
                    
                    // Always show the edit button if Status is Ready or if it contains [IMG_HERE]
                    const isReadyStatus = data.Status === 'Ready';
                    const isNewsletter = isReadyStatus || containsImgHere;
                    
                    console.log('Status is Ready:', isReadyStatus);
                    console.log('Contains [IMG_HERE]:', containsImgHere);
                    console.log('Is newsletter:', isNewsletter);
                    
                    // Show the edit button if Status is Ready OR it contains [IMG_HERE]
                    if (isNewsletter) {
                        console.log('Newsletter detected - showing edit button');
                        
                        // Store the newsletter HTML in localStorage
                        console.log('Storing newsletter HTML in localStorage, length:', data.response.length);
                        try {
                            localStorage.setItem('newsletter_html', data.response);
                            console.log('Successfully stored newsletter HTML in localStorage');
                            
                            // Verify storage
                            const storedHtml = localStorage.getItem('newsletter_html');
                            if (storedHtml) {
                                console.log('Verified storage: HTML retrieved from localStorage, length:', storedHtml.length);
                            } else {
                                console.error('Failed to verify storage: Could not retrieve HTML from localStorage');
                            }
                        } catch (error) {
                            console.error('Error storing newsletter HTML in localStorage:', error);
                        }
                        
                        // Also store in a global variable for direct access
                        window.latestNewsletterHtml = data.response;
                        console.log('Also stored newsletter HTML in global variable window.latestNewsletterHtml');
                        
                        // Create a prominent button container
                        const buttonContainer = document.createElement('div');
                        buttonContainer.className = 'newsletter-button-container';
                        
                        // Create a large, prominent edit button
                        const editorBtn = document.createElement('button');
                        editorBtn.className = 'open-editor-btn large';
                        editorBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Newsletter';
                        editorBtn.addEventListener('click', () => openNewsletterEditor(data.response));
                        
                        // Create a backup button that uses stored HTML
                        const backupBtn = document.createElement('button');
                        backupBtn.className = 'open-editor-btn';
                        backupBtn.innerHTML = '<i class="fas fa-file-alt"></i> Open Editor (Backup)';
                        backupBtn.addEventListener('click', () => openNewsletterEditor());
                        
                        // Add the buttons to the container
                        buttonContainer.appendChild(editorBtn);
                        buttonContainer.appendChild(document.createTextNode(' '));
                        buttonContainer.appendChild(backupBtn);
                        
                        // Create a message div for the button
                        const messageDiv = document.createElement('div');
                        messageDiv.className = 'message system highlight';
                        
                        const contentDiv = document.createElement('div');
                        contentDiv.className = 'message-content';
                        
                        // Different message based on Status
                        if (isReadyStatus) {
                            // Special handling for Status: Ready
                            addMessageToChat('system', 'The newsletter is ready! Click the button below to edit it.', messageContainer);
                            contentDiv.innerHTML = '<h3>Newsletter Ready!</h3><p>Your final newsletter has been generated and is ready to edit.</p>';
                        } else {
                            // For other newsletter-like content
                            addMessageToChat('system', 'Newsletter content detected! Click the button below to edit it.', messageContainer);
                            contentDiv.innerHTML = '<h3>Newsletter Content Detected!</h3><p>Click the button below to open the newsletter editor.</p>';
                        }
                        
                        contentDiv.appendChild(buttonContainer);
                        
                        messageDiv.appendChild(contentDiv);
                        messageContainer.appendChild(messageDiv);
                        
                        // Scroll to the button to make sure it's visible
                        setTimeout(() => {
                            messageContainer.scrollTop = messageContainer.scrollHeight;
                        }, 100);
                    } 
                    // Regular response (not a newsletter)
                    else {
                        // Format and display
                        const formattedResponse = formatResponseText(data.response);
                        
                        // Add the formatted message to the appropriate container
                        // If in voice mode, also trigger text-to-speech
                        addFormattedMessageToChat('assistant', formattedResponse, messageContainer, isVoiceMode);
                    }
                } else {
                    // No response data
                    addMessageToChat('assistant', 'Your input has been received. The newsletter will be generated shortly.', messageContainer);
                }
            } else {
                // Response not OK
                addMessageToChat('system', 'There was an error processing your request. Please try again later.', messageContainer);
            }
        } catch (error) {
            console.error('Error sending to webhook:', error);
            addMessageToChat('system', 'There was an error connecting to the server. Please try again later.', messageContainer);
        }
    }
    
    // Format the response text with proper HTML formatting
    function formatResponseText(text) {
        // Replace markdown-style formatting with HTML
        let formatted = text
            // Convert checkboxes
            .replace(/- \[ \]/g, '<input type="checkbox" disabled>')
            .replace(/- \[x\]/g, '<input type="checkbox" checked disabled>')
            
            // Convert headers
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            
            // Convert bold and italic
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            
            // Convert line breaks
            .replace(/\n/g, '<br>');
            
        return formatted;
    }
    
    // Voice conversation functions
    function startVoiceConversation() {
        if (!recognition) {
            voiceStatus.textContent = 'Speech recognition is not supported in your browser.';
            alert('Speech recognition is not supported in your browser. Please use Chrome or Edge for voice features.');
            return;
        }
        
        try {
            // Reset state and clear any previous handlers
            transcriptText = '';
            voiceTranscript.textContent = '';
            voiceTranscriptContainer.classList.add('hidden');
            
            // Update UI
            startVoiceBtn.classList.add('hidden');
            stopVoiceBtn.classList.remove('hidden');
            voiceStatus.textContent = 'Listening...';
            
            // Configure recognition event handlers
            recognition.onresult = handleVoiceResult;
            recognition.onaudiostart = handleAudioStart;
            recognition.onerror = handleRecognitionError;
            recognition.onend = handleRecognitionEnd;
            
            // Start recognition
            recognition.abort(); // Stop any existing recognition
            setTimeout(() => {
                recognition.start();
                isRecording = true;
                console.log('Voice recognition started');
                resetSilenceTimer();
            }, 100);
            
        } catch (error) {
            console.error('Error starting voice recognition:', error);
            voiceStatus.textContent = 'Error starting voice recognition. Please try again.';
        }
    }
    
    // Handle voice recognition results
    function handleVoiceResult(event) {
        // Get the transcript
        let interimTranscript = '';
        let finalTranscript = transcriptText || '';
        
        for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript + ' ';
            } else {
                interimTranscript += event.results[i][0].transcript + ' ';
            }
        }
        
        // Update the current transcript
        transcriptText = finalTranscript;
        
        // Show current speech in status
        if (interimTranscript) {
            voiceStatus.textContent = `Listening: ${interimTranscript}`;
            // Reset silence timer whenever we get speech
            resetSilenceTimer();
        } else if (!finalTranscript) {
            voiceStatus.textContent = 'Listening...';
        }
        
        console.log('Voice transcript updated:', transcriptText);
    }
    
    function handleAudioStart() {
        console.log('Audio capture started');
        resetSilenceTimer();
    }
    
    function handleRecognitionError(event) {
        console.error('Speech recognition error:', event.error);
        stopVoiceConversation(false);
    }
    
    function handleRecognitionEnd() {
        console.log('Recognition ended, isRecording:', isRecording);
        // This can happen if the recognition service disconnects
        if (isRecording) {
            // If we're still supposed to be recording, restart after a short delay
            setTimeout(() => {
                try {
                    recognition.start();
                    console.log('Recognition restarted');
                } catch (error) {
                    console.error('Error restarting recognition:', error);
                    isRecording = false;
                    startVoiceBtn.classList.remove('hidden');
                    stopVoiceBtn.classList.add('hidden');
                }
            }, 300);
        }
    }
    
    function stopVoiceConversation(processTranscript = true) {
        console.log('Stopping voice conversation, process transcript:', processTranscript);
        
        // Stop the recognition
        try {
            if (recognition) {
                recognition.abort(); // Use abort instead of stop for more reliable stopping
            }
        } catch (error) {
            console.error('Error stopping recognition:', error);
        }
        
        // Clear silence timer
        if (silenceTimer) {
            clearTimeout(silenceTimer);
            silenceTimer = null;
        }
        
        // Update state
        isRecording = false;
        
        // Update UI
        startVoiceBtn.classList.remove('hidden');
        stopVoiceBtn.classList.add('hidden');
        voiceStatus.textContent = 'Ready to listen';
        
        // Process the transcript if we have one and are asked to process it
        if (processTranscript && transcriptText && transcriptText.trim()) {
            console.log('Processing transcript:', transcriptText.trim());
            voiceTranscript.textContent = transcriptText.trim();
            voiceTranscriptContainer.classList.remove('hidden');
        } else {
            voiceTranscriptContainer.classList.add('hidden');
        }
    }
    
    function resetSilenceTimer() {
        // Clear existing timer
        if (silenceTimer) {
            clearTimeout(silenceTimer);
        }
        
        // Set new timer for 2 seconds of silence
        silenceTimer = setTimeout(() => {
            // If we have some transcript text, stop and process
            if (transcriptText.trim()) {
                stopVoiceConversation(true);
            }
        }, 2000); // 2 seconds of silence
    }
    
    function sendVoiceTranscript() {
        if (!transcriptText.trim()) return;
        
        // Add user message to chat
        addMessageToChat('user', transcriptText.trim(), chatMessages);
        
        // Send to webhook with voice mode enabled
        sendToWebhook(transcriptText.trim(), true);
        
        // Reset and hide transcript
        transcriptText = '';
        voiceTranscriptContainer.classList.add('hidden');
    }
    
    function cancelVoiceTranscript() {
        // Reset and hide transcript
        transcriptText = '';
        voiceTranscriptContainer.classList.add('hidden');
    }
    
    // Text-to-speech function
    function speakText(text) {
        console.log('Speaking text, voice mode enabled:', voiceModeToggle.checked);
        // Only speak if voice mode is enabled
        if (!voiceModeToggle.checked) return;
        
        try {
            // Stop any current speech
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
            
            // Remove any HTML tags and convert entities
            const cleanText = text.replace(/<[^>]*>/g, '')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&apos;/g, '\'');
            
            console.log('Clean text to speak:', cleanText);
            
            // Create utterance
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = 'en-US';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            // Set state
            isSpeaking = true;
            currentUtterance = utterance;
            
            // Add event handlers
            utterance.onend = () => {
                console.log('Speech ended');
                isSpeaking = false;
                currentUtterance = null;
                
                // If voice mode is still enabled, automatically start listening again
                if (voiceModeToggle.checked && !isRecording) {
                    // Wait a moment before starting to listen again
                    setTimeout(() => {
                        startVoiceConversation();
                    }, 1000);
                }
            };
            
            utterance.onerror = (event) => {
                console.error('Speech synthesis error', event);
                isSpeaking = false;
                currentUtterance = null;
            };
            
            // Speak
            window.speechSynthesis.speak(utterance);
            console.log('Started speaking');
            
            // Chrome bug workaround - keep speech synthesis alive
            if (window.chrome) {
                const keepAlive = setInterval(() => {
                    if (!isSpeaking) {
                        clearInterval(keepAlive);
                        return;
                    }
                    window.speechSynthesis.pause();
                    window.speechSynthesis.resume();
                }, 5000);
            }
            
        } catch (error) {
            console.error('Error in speech synthesis:', error);
        }
    }
    
    // Session Management
    const resetSessionBtn = document.getElementById('reset-session-btn');
    if (resetSessionBtn) {
        resetSessionBtn.addEventListener('click', () => {
            // Confirm before resetting
            if (confirm('Are you sure you want to start a new session? This will clear the current conversation.')) {
                resetSession();
            }
        });
    }
    
    // Settings Form Handling
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Update settings object
            settings.templateId = templateIdSelect.value;
            settings.imageCount = parseInt(imageCountInput.value, 10);
            
            // Save to local storage
            localStorage.setItem('peritus_newsletter_settings', JSON.stringify(settings));
            
            // Show confirmation
            alert('Settings saved successfully!');
            
            // Switch to chat tab
            const chatTabBtn = document.querySelector('.tab-btn[data-tab="chat"]');
            if (chatTabBtn) {
                chatTabBtn.click();
            }
        });
    }
    
    // Voice Mode Toggle
    voiceModeToggle.addEventListener('change', () => {
        if (voiceModeToggle.checked) {
            // Switch to voice conversation mode
            textInputContainer.classList.add('hidden');
            voiceControlContainer.classList.remove('hidden');
        } else {
            // Switch to text input mode
            textInputContainer.classList.remove('hidden');
            voiceControlContainer.classList.add('hidden');
            voiceTranscriptContainer.classList.add('hidden');
            
            // Stop any ongoing voice recording
            if (isRecording) {
                stopVoiceConversation(false);
            }
        }
    });
    
    // Event listeners - Text Mode
    sendBtn.addEventListener('click', sendMessage);
    
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Text mode voice input
    voiceInputBtn.addEventListener('click', startVoiceInput);
    stopRecordingBtn.addEventListener('click', stopVoiceInput);
    
    // Voice conversation mode
    startVoiceBtn.addEventListener('click', startVoiceConversation);
    stopVoiceBtn.addEventListener('click', () => stopVoiceConversation(true));
    sendTranscriptBtn.addEventListener('click', sendVoiceTranscript);
    cancelTranscriptBtn.addEventListener('click', cancelVoiceTranscript);
    
    // Handle page unload to stop recording and speech
    window.addEventListener('beforeunload', () => {
        if (isRecording && recognition) {
            recognition.stop();
        }
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
    });
    
    // Function to open the newsletter editor in a popup window
    function openNewsletterEditor(newsletterHtml) {
        console.log('Opening newsletter editor...');
        
        // Use the provided HTML, or fallback to stored HTML if available
        if (!newsletterHtml || newsletterHtml.length === 0) {
            console.log('No HTML provided to openNewsletterEditor, checking localStorage...');
            newsletterHtml = localStorage.getItem('newsletter_html');
            
            if (!newsletterHtml && window.latestNewsletterHtml) {
                console.log('Using HTML from global variable');
                newsletterHtml = window.latestNewsletterHtml;
            }
            
            if (!newsletterHtml) {
                console.error('No newsletter HTML found in localStorage or global variable');
                alert('No newsletter HTML found. Please try again.');
                return;
            }
        }
        
        console.log('Opening newsletter editor with HTML length:', newsletterHtml.length);
        
        try {
            // Encode the newsletter HTML to pass as a URL parameter
            const encodedHtml = encodeURIComponent(newsletterHtml);
            console.log('Encoded HTML length:', encodedHtml.length);
            
            // Check if the encoded HTML is too large for a URL parameter
            if (encodedHtml.length > 100000) {
                console.warn('Encoded HTML is very large, using localStorage instead of URL parameter');
                // Store in localStorage instead
                localStorage.setItem('newsletter_html_for_editor', newsletterHtml);
                
                // Open the editor without the HTML parameter
                const editorWindow = window.open(
                    'newsletter-editor.html?useLocalStorage=true',
                    'NewsletterEditor',
                    'width=1200,height=800,resizable=yes,scrollbars=yes'
                );
                
                // Check if the popup was blocked
                if (!editorWindow || editorWindow.closed || typeof editorWindow.closed === 'undefined') {
                    console.error('Popup was blocked!');
                    alert('Popup blocked! Please allow popups for this site to use the newsletter editor.');
                } else {
                    console.log('Editor window opened successfully using localStorage');
                }
            } else {
                // Open the editor with the HTML as a URL parameter
                const editorWindow = window.open(
                    `newsletter-editor.html?html=${encodedHtml}`,
                    'NewsletterEditor',
                    'width=1200,height=800,resizable=yes,scrollbars=yes'
                );
                
                // Check if the popup was blocked
                if (!editorWindow || editorWindow.closed || typeof editorWindow.closed === 'undefined') {
                    console.error('Popup was blocked!');
                    alert('Popup blocked! Please allow popups for this site to use the newsletter editor.');
                } else {
                    console.log('Editor window opened successfully using URL parameter');
                }
            }
            
            // Listen for changes from the editor
            window.addEventListener('storage', (event) => {
                if (event.key === 'edited_newsletter_html' && event.newValue) {
                    console.log('Received edited newsletter from editor');
                    
                    // Get the edited newsletter HTML
                    const editedHtml = event.newValue;
                    
                    // Display a message about the saved newsletter
                    addMessageToChat('system', 'Newsletter has been edited and saved!', chatMessages);
                    
                    // Add a download button
                    const downloadBtn = document.createElement('button');
                    downloadBtn.className = 'download-newsletter-btn';
                    downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Newsletter';
                    downloadBtn.addEventListener('click', () => downloadNewsletter(editedHtml));
                    
                    // Create a message div for the button
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message system';
                    
                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'message-content';
                    contentDiv.appendChild(downloadBtn);
                    
                    messageDiv.appendChild(contentDiv);
                    chatMessages.appendChild(messageDiv);
                }
            });
        } catch (error) {
            console.error('Error opening newsletter editor:', error);
            alert('Error opening newsletter editor: ' + error.message);
        }
    }
    
    // Function to download the newsletter as HTML
    function downloadNewsletter(newsletterHtml) {
        // Create a full HTML document
        const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Peritus Newsletter</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        img {
            max-width: 100%;
            height: auto;
        }
        h1, h2, h3 {
            color: #166088;
        }
    </style>
</head>
<body>
    ${newsletterHtml}
</body>
</html>`;
        
        // Create a blob and download link
        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `peritus-newsletter-${new Date().toISOString().slice(0, 10)}.html`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    // Function to generate a unique session ID
    function generateSessionId() {
        // Generate a random string
        const randomPart = Math.random().toString(36).substring(2, 15);
        // Add timestamp for uniqueness
        const timestamp = new Date().getTime().toString(36);
        // Combine with a prefix
        return `peritus-${timestamp}-${randomPart}`;
    }
    
    // Function to reset the session ID
    function resetSession() {
        sessionId = generateSessionId();
        localStorage.setItem('peritus_session_id', sessionId);
        if (sessionIdDisplay) {
            sessionIdDisplay.textContent = `Session ID: ${sessionId}`;
        }
        // Clear the chat messages
        chatMessages.innerHTML = '';
        // Add a system message about the new session
        addMessageToChat('system', 'New session started. Please provide this week\'s guidelines to generate the newsletter.');
    }
    
    // Function to display the newsletter
    function displayNewsletter(newsletterHtml, container) {
        // Create a message div for the newsletter
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant newsletter-container';
        
        // Initialize placeholder counter
        let placeholderCount = 0;
        
        // Create the newsletter content div
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content newsletter';
        
        // Create a wrapper for the newsletter with editing capabilities
        const newsletterWrapper = document.createElement('div');
        newsletterWrapper.className = 'newsletter-wrapper';
        
        console.log('Original newsletter HTML:', newsletterHtml);
        
        // First, let's do a direct string replacement in the HTML content
        // This ensures we catch all instances of [IMG_HERE] even if they're not in proper text nodes
        const processedHtml = newsletterHtml.replace(/\[IMG_HERE\]/g, '<div class="image-upload-placeholder" data-placeholder="true">[IMG_HERE]</div>');
        
        console.log('Processed HTML with placeholders:', processedHtml);
        
        // Set the newsletter HTML content with our processed HTML
        newsletterWrapper.innerHTML = processedHtml;
        
        // Find all our placeholder divs and replace them with upload buttons
        const placeholderDivs = newsletterWrapper.querySelectorAll('.image-upload-placeholder[data-placeholder="true"]');
        console.log('Found placeholder divs:', placeholderDivs.length);
        
        placeholderDivs.forEach(placeholderDiv => {
            // Create a placeholder container
            const placeholderContainer = document.createElement('div');
            placeholderContainer.className = 'image-placeholder-container';
            
            // Create the image element
            const imgElement = document.createElement('img');
            imgElement.src = '[IMG_HERE]';
            imgElement.alt = 'Image placeholder';
            imgElement.style.maxWidth = '100%';
            imgElement.style.height = 'auto';
            const placeholderId = `img-placeholder-${Date.now()}-${placeholderCount}`;
            imgElement.id = placeholderId;
            
            // Create upload button
            const uploadButton = document.createElement('button');
            uploadButton.className = 'image-upload-btn';
            uploadButton.innerHTML = '<i class="fas fa-upload"></i> Upload Image';
            uploadButton.dataset.target = placeholderId;
            
            // Create file input
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.className = 'hidden';
            fileInput.id = `file-${placeholderId}`;
            
            // Add event listeners
            uploadButton.addEventListener('click', () => {
                fileInput.click();
            });
            
            fileInput.addEventListener('change', (event) => {
                if (event.target.files && event.target.files[0]) {
                    const file = event.target.files[0];
                    const reader = new FileReader();
                    
                    reader.onload = (e) => {
                        const targetImg = document.getElementById(placeholderId);
                        if (targetImg) {
                            targetImg.src = e.target.result;
                            targetImg.classList.add('uploaded-image');
                            
                            // Hide the upload button after successful upload
                            uploadButton.classList.add('hidden');
                            
                            // Add a change button
                            const changeButton = document.createElement('button');
                            changeButton.className = 'image-change-btn';
                            changeButton.innerHTML = '<i class="fas fa-exchange-alt"></i> Change Image';
                            changeButton.dataset.target = placeholderId;
                            
                            changeButton.addEventListener('click', () => {
                                fileInput.click();
                            });
                            
                            // Replace upload button with change button
                            uploadButton.parentNode.replaceChild(changeButton, uploadButton);
                        }
                    };
                    
                    reader.readAsDataURL(file);
                }
            });
            
            // Add elements to the container
            placeholderContainer.appendChild(imgElement);
            placeholderContainer.appendChild(uploadButton);
            placeholderContainer.appendChild(fileInput);
            
            // Replace the placeholder div with our upload container
            placeholderDiv.parentNode.replaceChild(placeholderContainer, placeholderDiv);
            
            // Increment placeholder count
            placeholderCount++;
        });
        
        // Also find any image placeholders that might be in the HTML
        const imagePlaceholders = newsletterWrapper.querySelectorAll('img[src="[IMG_HERE]"], img[src=""]');
        
        imagePlaceholders.forEach(placeholder => {
            placeholderCount++;
            const placeholderId = `img-placeholder-${Date.now()}-${placeholderCount}`;
            placeholder.id = placeholderId;
            
            // Create an upload button for this placeholder
            const uploadButton = document.createElement('button');
            uploadButton.className = 'image-upload-btn';
            uploadButton.innerHTML = '<i class="fas fa-upload"></i> Upload Image';
            uploadButton.dataset.target = placeholderId;
            
            // Create a file input that will be triggered by the button
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.className = 'hidden';
            fileInput.id = `file-${placeholderId}`;
            
            // Add event listener to the upload button
            uploadButton.addEventListener('click', () => {
                fileInput.click();
            });
            
            // Add event listener to the file input
            fileInput.addEventListener('change', (event) => {
                if (event.target.files && event.target.files[0]) {
                    const file = event.target.files[0];
                    const reader = new FileReader();
                    
                    reader.onload = (e) => {
                        const targetImg = document.getElementById(placeholderId);
                        if (targetImg) {
                            targetImg.src = e.target.result;
                            targetImg.classList.add('uploaded-image');
                            
                            // Hide the upload button after successful upload
                            uploadButton.classList.add('hidden');
                            
                            // Add a change button
                            const changeButton = document.createElement('button');
                            changeButton.className = 'image-change-btn';
                            changeButton.innerHTML = '<i class="fas fa-exchange-alt"></i> Change Image';
                            changeButton.dataset.target = placeholderId;
                            
                            changeButton.addEventListener('click', () => {
                                fileInput.click();
                            });
                            
                            // Replace upload button with change button
                            uploadButton.parentNode.replaceChild(changeButton, uploadButton);
                        }
                    };
                    
                    reader.readAsDataURL(file);
                }
            });
            
            // Create a container for the placeholder and button
            const placeholderContainer = document.createElement('div');
            placeholderContainer.className = 'image-placeholder-container';
            
            // Replace the placeholder with our container
            placeholder.parentNode.replaceChild(placeholderContainer, placeholder);
            
            // Add the placeholder and button to the container
            placeholderContainer.appendChild(placeholder);
            placeholderContainer.appendChild(uploadButton);
            placeholderContainer.appendChild(fileInput);
        });
        
        // Add download button if there are image placeholders
        if (placeholderCount > 0) {
            const downloadContainer = document.createElement('div');
            downloadContainer.className = 'newsletter-actions';
            
            const downloadButton = document.createElement('button');
            downloadButton.className = 'download-newsletter-btn';
            downloadButton.innerHTML = '<i class="fas fa-download"></i> Download Newsletter';
            downloadButton.addEventListener('click', () => downloadNewsletter(newsletterWrapper));
            
            downloadContainer.appendChild(downloadButton);
            newsletterWrapper.appendChild(downloadContainer);
        }
        
        // Add the newsletter wrapper to the content div
        contentDiv.appendChild(newsletterWrapper);
        
        // Add the content div to the message div
        messageDiv.appendChild(contentDiv);
        
        // Add the message div to the container
        container.appendChild(messageDiv);
        
        // Scroll to the newsletter
        container.scrollTop = container.scrollHeight;
    }
    
    // Function to download the newsletter as HTML
    function downloadNewsletter(newsletterElement) {
        // Clone the newsletter element to avoid modifying the displayed one
        const newsletterClone = newsletterElement.cloneNode(true);
        
        // Remove any buttons and inputs from the clone
        const buttons = newsletterClone.querySelectorAll('button, input, .newsletter-actions');
        buttons.forEach(button => button.remove());
        
        // Clean up any remaining image placeholders
        const remainingPlaceholders = newsletterClone.querySelectorAll('img[src="[IMG_HERE]"], img[src=""]');
        remainingPlaceholders.forEach(placeholder => {
            // Replace with a note about missing image
            const missingNote = document.createElement('div');
            missingNote.style.padding = '15px';
            missingNote.style.backgroundColor = '#f8f9fa';
            missingNote.style.border = '1px dashed #ccc';
            missingNote.style.borderRadius = '4px';
            missingNote.style.textAlign = 'center';
            missingNote.style.margin = '10px 0';
            missingNote.innerHTML = '<em>Image placeholder - no image was uploaded</em>';
            placeholder.parentNode.replaceChild(missingNote, placeholder);
        });
        
        // Clean up any placeholder containers
        const placeholderContainers = newsletterClone.querySelectorAll('.image-placeholder-container');
        placeholderContainers.forEach(container => {
            // Get the image if it exists
            const image = container.querySelector('img.uploaded-image');
            if (image) {
                // Replace the container with just the image
                container.parentNode.replaceChild(image, container);
            }
        });
        
        // Get the HTML content
        const htmlContent = newsletterClone.innerHTML;
        
        // Create a full HTML document
        const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Peritus Newsletter</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        img {
            max-width: 100%;
            height: auto;
        }
        h1, h2, h3 {
            color: #166088;
        }
        .newsletter-section {
            margin-bottom: 30px;
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;
        
        // Create a blob and download link
        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `peritus-newsletter-${new Date().toISOString().slice(0, 10)}.html`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
});
