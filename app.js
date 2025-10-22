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
    const templatePreview = document.getElementById('template-preview');
    const ctaList = document.getElementById('cta-list');
    const addCtaBtn = document.getElementById('add-cta-btn');
    
    // Session Management
    const sessionIdDisplay = document.getElementById('session-id');
    
    // Always generate a new session ID on page load
    let sessionId = generateSessionId();
    localStorage.setItem('peritus_session_id', sessionId);
    
    // Display the session ID if the element exists
    if (sessionIdDisplay) {
        sessionIdDisplay.textContent = `Session ID: ${sessionId}`;
    }
    
    // Newsletter Settings
    let settings = {
        templateId: 'templates/classic/',
        imageCount: 3,
        ctas: []
    };
    
    // Store template HTML content
    let templateHtmlContent = '';
    
    // Load settings from local storage if they exist
    const savedSettings = localStorage.getItem('peritus_newsletter_settings');
    if (savedSettings) {
        try {
            settings = JSON.parse(savedSettings);
            
            // Migrate old template IDs to new folder structure
            if (settings.templateId === '1' || settings.templateId === '2' || settings.templateId === '3' ||
                settings.templateId === 'ai_studio_code.html' || 
                settings.templateId === 'ai_studio_code (1).html' || 
                settings.templateId === 'ai_studio_code (2).html' ||
                settings.templateId === 'ai_studio_code_classic.html' ||
                settings.templateId === 'ai_studio_code_inverted.html' ||
                settings.templateId === 'ai_studio_code_split.html' ||
                settings.templateId === 'templates/ai_studio_code_classic.html' ||
                settings.templateId === 'templates/ai_studio_code_inverted.html' ||
                settings.templateId === 'templates/ai_studio_code_split.html') {
                const templateMap = {
                    '1': 'templates/classic/',
                    '2': 'templates/inverted/',
                    '3': 'templates/split/',
                    'ai_studio_code.html': 'templates/classic/',
                    'ai_studio_code (1).html': 'templates/inverted/',
                    'ai_studio_code (2).html': 'templates/split/',
                    'ai_studio_code_classic.html': 'templates/classic/',
                    'ai_studio_code_inverted.html': 'templates/inverted/',
                    'ai_studio_code_split.html': 'templates/split/',
                    'templates/ai_studio_code_classic.html': 'templates/classic/',
                    'templates/ai_studio_code_inverted.html': 'templates/inverted/',
                    'templates/ai_studio_code_split.html': 'templates/split/'
                };
                settings.templateId = templateMap[settings.templateId] || 'templates/classic/';
                // Save the migrated settings
                localStorage.setItem('peritus_newsletter_settings', JSON.stringify(settings));
            }
            
            // Update form fields with saved settings
            if (templateIdSelect) templateIdSelect.value = settings.templateId;
            if (imageCountInput) imageCountInput.value = settings.imageCount;
            
            // Ensure ctas array exists
            if (!settings.ctas) settings.ctas = [];
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
    
    // Load the initial template HTML
    loadTemplateHtml(settings.templateId).then(html => {
        templateHtmlContent = html;
        console.log('Initial template loaded on page load');
    });
    
    // Store loaded template HTML for previews
    let templateHtmlCache = {};
    
    // Function to update template preview
    async function updateTemplatePreview(templateFileName) {
        if (!templatePreview) return;
        
        console.log('Updating template preview for:', templateFileName);
        
        // Show loading state
        templatePreview.innerHTML = '<div class="preview-loading">Loading template preview...</div>';
        
        try {
            // Check if we have it cached
            let html = templateHtmlCache[templateFileName];
            
            // If not cached, fetch it
            if (!html) {
                const response = await fetch(templateFileName);
                if (!response.ok) {
                    throw new Error(`Failed to load template: ${response.status}`);
                }
                html = await response.text();
                templateHtmlCache[templateFileName] = html;
                console.log('Template HTML loaded and cached:', templateFileName);
            }
            
            // Create a scaled preview container
            const previewContainer = document.createElement('div');
            previewContainer.style.cssText = `
                width: 100%;
                height: 450px;
                overflow: auto;
                background: white;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            `;
            
            // Create inner container with scale
            const innerContainer = document.createElement('div');
            innerContainer.style.cssText = `
                transform: scale(0.5);
                transform-origin: top left;
                width: 200%;
            `;
            innerContainer.innerHTML = html;
            
            previewContainer.appendChild(innerContainer);
            
            // Clear and add the preview
            templatePreview.innerHTML = '';
            templatePreview.appendChild(previewContainer);
            
            console.log('Template preview rendered successfully');
            
        } catch (error) {
            console.error('Error loading template preview:', error);
            templatePreview.innerHTML = `
                <div class="preview-loading" style="color: #d32f2f;">
                    Failed to load template preview.<br>
                    <small>Make sure you're running the local server.</small>
                </div>
            `;
        }
    }
    
    // Initialize template preview on page load
    if (templatePreview) {
        updateTemplatePreview(settings.templateId);
    }
    
    // Add event listener to template selection dropdown
    if (templateIdSelect) {
        templateIdSelect.addEventListener('change', (e) => {
            updateTemplatePreview(e.target.value);
        });
    }
    
    // Send message function
    function sendMessage(customMessage = null) {
        // If customMessage is an event object (from direct click handler), ignore it
        if (customMessage && typeof customMessage === 'object' && customMessage.type) {
            customMessage = null;
        }
        
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
    
    // Function to load template HTML
    async function loadTemplateHtml(templateFileName) {
        try {
            console.log('Loading template:', templateFileName);
            const response = await fetch(templateFileName);
            if (response.ok) {
                const html = await response.text();
                console.log('Template loaded successfully, length:', html.length);
                return html;
            } else {
                console.error('Failed to load template:', response.status);
                return '';
            }
        } catch (error) {
            console.error('Error loading template:', error);
            return '';
        }
    }
    
    // Send data to webhook
    async function sendToWebhook(message, isVoiceMode = false) {
        // Always use the main chat container
        const messageContainer = chatMessages;
        
        // Show processing indicator
        addMessageToChat('system', 'Processing your request...', messageContainer);
        
        // Load the template HTML if not already loaded or if template changed
        if (!templateHtmlContent || templateHtmlContent === '') {
            templateHtmlContent = await loadTemplateHtml(settings.templateId);
        }
        
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
                    template_html: templateHtmlContent,
                    image_count: settings.imageCount,
                    ctas: settings.ctas
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
                        buttonContainer.style.cssText = 'display: flex; margin-top: 16px;';
                        
                        // Create a large, prominent edit button
                        const editorBtn = document.createElement('button');
                        editorBtn.style.cssText = 'width: 100%; background: linear-gradient(135deg, #007aff, #0051d5); color: white; border: none; padding: 14px 24px; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);';
                        editorBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Newsletter';
                        editorBtn.addEventListener('click', () => openNewsletterEditor(data.response));
                        editorBtn.addEventListener('mouseenter', (e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 16px rgba(0, 122, 255, 0.4)';
                        });
                        editorBtn.addEventListener('mouseleave', (e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 12px rgba(0, 122, 255, 0.3)';
                        });
                        
                        // Add the button to the container
                        buttonContainer.appendChild(editorBtn);
                        
                        // Create a message div for the button
                        const messageDiv = document.createElement('div');
                        messageDiv.className = 'message system highlight';
                        
                        const contentDiv = document.createElement('div');
                        contentDiv.className = 'message-content';
                        
                        // Different message based on Status
                        if (isReadyStatus) {
                            // Special handling for Status: Ready - Compact Apple-style design
                            contentDiv.innerHTML = `
                                <div style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08); border: 1px solid rgba(0, 0, 0, 0.04); display: flex; align-items: center; gap: 20px;">
                                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #34c759, #30d158); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(52, 199, 89, 0.25);">
                                        <i class="fas fa-check" style="font-size: 24px; color: white;"></i>
                                    </div>
                                    <div style="flex: 1;">
                                        <h3 style="margin: 0 0 4px 0; color: #1d1d1f; font-size: 19px; font-weight: 600; letter-spacing: -0.015em;">Newsletter Ready</h3>
                                        <p style="margin: 0; color: #86868b; font-size: 15px; line-height: 1.4;">Customize text, upload images, and adjust formatting.</p>
                                    </div>
                                </div>
                            `;
                        } else {
                            // For other newsletter-like content
                            contentDiv.innerHTML = `
                                <div style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08); border: 1px solid rgba(0, 0, 0, 0.04); display: flex; align-items: center; gap: 20px;">
                                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #007aff, #0051d5); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0, 122, 255, 0.25);">
                                        <i class="fas fa-newspaper" style="font-size: 22px; color: white;"></i>
                                    </div>
                                    <div style="flex: 1;">
                                        <h3 style="margin: 0 0 4px 0; color: #1d1d1f; font-size: 19px; font-weight: 600; letter-spacing: -0.015em;">Newsletter Detected</h3>
                                        <p style="margin: 0; color: #86868b; font-size: 15px; line-height: 1.4;">Open the editor to customize your newsletter.</p>
                                    </div>
                                </div>
                            `;
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
    
    // Function to reset the session
    function resetSession() {
        // Generate a new session ID
        sessionId = generateSessionId();
        localStorage.setItem('peritus_session_id', sessionId);
        
        // Update the display
        if (sessionIdDisplay) {
            sessionIdDisplay.textContent = `Session ID: ${sessionId}`;
        }
        
        // Clear the chat messages
        if (chatMessages) {
            chatMessages.innerHTML = '';
            
            // Add a system message about the new session
            addMessageToChat('system', 'A new session has been started. Your conversation history has been cleared.', chatMessages);
        }
    }
    
    // Function to open the newsletter editor in a popup window
    function openNewsletterEditor(newsletterHtml) {
        console.log('Opening newsletter editor...');
        
        try {
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
            
            // Always store the HTML in localStorage to avoid URL length issues
            console.log('Storing newsletter HTML in localStorage_for_editor, length:', newsletterHtml.length);
            localStorage.setItem('newsletter_html_for_editor', newsletterHtml);
            
            // Open the editor without any HTML parameter
            const editorWindow = window.open(
                'newsletter-editor.html',
                'NewsletterEditor',
                'width=1200,height=800,resizable=yes,scrollbars=yes'
            );
            
            // Check if the popup was blocked
            if (!editorWindow || editorWindow.closed || typeof editorWindow.closed === 'undefined') {
                console.error('Popup was blocked!');
                alert('Popup blocked! Please allow popups for this site to use the newsletter editor.');
            } else {
                console.log('Editor window opened successfully');
            }
        } catch (error) {
            console.error('Error opening newsletter editor:', error);
            alert('Error opening newsletter editor: ' + error.message);
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
        // Generate multiple random parts for increased entropy
        const randomPart1 = Math.random().toString(36).substring(2, 10);
        const randomPart2 = Math.random().toString(36).substring(2, 10);
        
        // Add precise timestamp with milliseconds for uniqueness
        const timestamp = new Date().getTime();
        
        // Add a random number between 1-1000 for extra uniqueness
        const extraRandom = Math.floor(Math.random() * 1000) + 1;
        
        // Combine all parts into a unique ID
        return `peritus-${timestamp}-${randomPart1}-${extraRandom}-${randomPart2}`;
    }
    
    // Add event listeners for UI elements
    
    // Text mode - send button
    sendBtn.addEventListener('click', () => sendMessage());
    
    // Text mode - enter key
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Reset session button
    const resetSessionBtn = document.getElementById('reset-session-btn');
    if (resetSessionBtn) {
        resetSessionBtn.addEventListener('click', () => {
            // Confirm before resetting
            if (confirm('Are you sure you want to start a new session? This will clear the current conversation.')) {
                resetSession();
            }
        });
    }
    
    // CTA Management Functions
    function createCtaItem(name = '', link = '') {
        const ctaItem = document.createElement('div');
        ctaItem.className = 'cta-item';
        
        ctaItem.innerHTML = `
            <div class="cta-item-inputs">
                <input type="text" class="cta-name" placeholder="CTA Name (e.g., Learn More)" value="${name}">
                <input type="text" class="cta-link" placeholder="Link (optional, e.g., https://example.com)" value="${link}">
            </div>
            <button type="button" class="remove-cta-btn">Remove</button>
        `;
        
        // Add remove functionality
        const removeBtn = ctaItem.querySelector('.remove-cta-btn');
        removeBtn.addEventListener('click', () => {
            ctaItem.remove();
        });
        
        return ctaItem;
    }
    
    function loadCtas() {
        if (!ctaList) return;
        
        ctaList.innerHTML = '';
        
        if (settings.ctas && settings.ctas.length > 0) {
            settings.ctas.forEach(cta => {
                const ctaItem = createCtaItem(cta.name, cta.link || '');
                ctaList.appendChild(ctaItem);
            });
        }
    }
    
    function getCtasFromForm() {
        if (!ctaList) return [];
        
        const ctaItems = ctaList.querySelectorAll('.cta-item');
        const ctas = [];
        
        ctaItems.forEach(item => {
            const name = item.querySelector('.cta-name').value.trim();
            const link = item.querySelector('.cta-link').value.trim();
            
            if (name) { // Only add if name is not empty
                ctas.push({
                    name: name,
                    link: link || null // Set to null if empty
                });
            }
        });
        
        return ctas;
    }
    
    // Add CTA button handler
    if (addCtaBtn) {
        addCtaBtn.addEventListener('click', () => {
            const ctaItem = createCtaItem();
            ctaList.appendChild(ctaItem);
        });
    }
    
    // Load CTAs on page load
    loadCtas();
    
    // Settings form handling
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', async () => {
            // Update settings object
            settings.templateId = templateIdSelect.value;
            settings.imageCount = parseInt(imageCountInput.value, 10);
            settings.ctas = getCtasFromForm();
            
            // Load the new template HTML
            console.log('Loading template HTML for:', settings.templateId);
            templateHtmlContent = await loadTemplateHtml(settings.templateId);
            
            if (templateHtmlContent) {
                console.log('Template HTML loaded successfully');
            } else {
                console.error('Failed to load template HTML');
                alert('Warning: Could not load the selected template. Please try again.');
                return;
            }
            
            // Save to local storage
            localStorage.setItem('peritus_newsletter_settings', JSON.stringify(settings));
            
            // Show confirmation
            console.log('Settings saved with CTAs:', settings.ctas);
            alert('Settings saved successfully! Template loaded and ready to use.');
            
            // Switch to chat tab
            const chatTabBtn = document.querySelector('.tab-btn[data-tab="chat"]');
            if (chatTabBtn) {
                chatTabBtn.click();
            }
        });
    }
    
    // Placeholder voice conversation functions (to be implemented)
    function startVoiceConversation() {
        console.log('Voice conversation mode - to be implemented');
        alert('Voice conversation mode is not yet implemented.');
    }
    
    function stopVoiceConversation(manual) {
        console.log('Stop voice conversation - to be implemented');
    }
    
    function sendVoiceTranscript() {
        console.log('Send voice transcript - to be implemented');
    }
    
    function cancelVoiceTranscript() {
        console.log('Cancel voice transcript - to be implemented');
    }
    
    // Text mode voice input
    if (voiceInputBtn) voiceInputBtn.addEventListener('click', startVoiceInput);
    if (stopRecordingBtn) stopRecordingBtn.addEventListener('click', stopVoiceInput);
    
    // Voice conversation mode
    if (startVoiceBtn) startVoiceBtn.addEventListener('click', startVoiceConversation);
    if (stopVoiceBtn) stopVoiceBtn.addEventListener('click', () => stopVoiceConversation(true));
    if (sendTranscriptBtn) sendTranscriptBtn.addEventListener('click', sendVoiceTranscript);
    if (cancelTranscriptBtn) cancelTranscriptBtn.addEventListener('click', cancelVoiceTranscript);
    
    // Handle page unload to stop recording and speech
    window.addEventListener('beforeunload', () => {
        if (isRecording && recognition) {
            recognition.stop();
        }
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
    });
});
