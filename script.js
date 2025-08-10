// Global variables - permanent API key set
window.API_KEY = "AIzaSyA43dU9vEsDOZbFIT5sm2xtoDswz883cVc";
window.IS_DEMO_MODE = false;

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded event fired");
    
    // Initialize variables
    // Get DOM elements using more reliable selectors
    const chatList = document.querySelector(".chat-list");
    const typingForm = document.querySelector(".typing-form");
    const inputField = document.querySelector(".typing-input");
    const sendButton = document.querySelector(".typing-form .icon");
    const suggestionList = document.querySelector(".suggestion-list");
    const header = document.querySelector(".header");
    const voiceInputBtn = document.querySelector(".voice-input");
    const voiceStatus = document.querySelector(".voice-status");
    const statusText = document.querySelector(".status-text");
    const exportChatBtn = document.querySelector(".export-chat");
    
    // Controls
    const clearChatBtn = document.querySelector(".clear-btn");
    const themeToggleBtn = document.querySelector(".action-buttons .icon:nth-child(1)");
    
    // Sidebar elements
    const sidebar = document.getElementById("sidebar");
    const sidebarToggle = document.getElementById("sidebarToggle");
    const menuBtn = document.getElementById("menuBtn");
    const newChatBtn = document.getElementById("newChatBtn");
    const historyList = document.getElementById("historyList");
    
    // API key is permanently set, no overlay needed
    
    // API key is permanently set, no need to check localStorage
    console.log("Using permanent API key");
    
    // API key is permanently set, no overlay to hide

    // API key functions removed - using permanent key

    let isListening = false;
    let recognition = null;
    let chatHistory = loadChatHistory();
    let currentChatId = null;
    let chatSessions = loadChatSessions();

    // Initialize SpeechRecognition if available
    function initSpeechRecognition() {
        const voiceInputBtn = document.querySelector(".voice-input");
        
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                isListening = true;
                voiceInputBtn.classList.add("active");
                voiceStatus.style.display = "block";
                statusText.textContent = "Listening...";
            };

            recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join('');
                
                inputField.value = transcript;
                statusText.textContent = "Processing: " + transcript;
            };

            recognition.onend = () => {
                isListening = false;
                voiceInputBtn.classList.remove("active");
                voiceStatus.style.display = "none";
                
                // If input has content, submit after a short delay
                if (inputField.value.trim()) {
                    setTimeout(() => {
                        handleOutgoingChat();
                    }, 500);
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                isListening = false;
                voiceInputBtn.classList.remove("active");
                voiceStatus.style.display = "none";
            };

            // Add click event for voice input
            voiceInputBtn.addEventListener('click', toggleSpeechRecognition);
        } else {
            // Hide the voice input button if not supported
            voiceInputBtn.style.display = 'none';
        }
    }

    // Toggle speech recognition
    function toggleSpeechRecognition() {
        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    }

    // Load chat history from localStorage
    function loadChatHistory() {
        const savedHistory = localStorage.getItem("chatHistory");
        return savedHistory ? JSON.parse(savedHistory) : [];
    }

    // Save chat history to localStorage
    function saveChatHistory() {
        const messages = [];
        document.querySelectorAll(".chat-list .message").forEach(message => {
            if (message.classList.contains("loading")) return;
            
            const text = message.querySelector(".text").textContent;
            const isUser = message.classList.contains("outgoing");
            
            messages.push({
                role: isUser ? "user" : "assistant",
                content: text
            });
        });
        
        localStorage.setItem("chatHistory", JSON.stringify(messages));
        saveCurrentChatSession();
    }

    // Load chat sessions from localStorage
    function loadChatSessions() {
        const savedSessions = localStorage.getItem("chatSessions");
        return savedSessions ? JSON.parse(savedSessions) : [];
    }

    // Save chat sessions to localStorage
    function saveChatSessions() {
        localStorage.setItem("chatSessions", JSON.stringify(chatSessions));
    }

    // Update sidebar with chat history
    function updateSidebarHistory() {
        historyList.innerHTML = "";
        
        if (chatSessions.length === 0) {
            historyList.innerHTML = '<p style="color: var(--subheading-color); text-align: center; padding: 1rem; font-size: 0.8rem;">No chat history yet</p>';
            return;
        }

        chatSessions.forEach(session => {
            const historyItem = document.createElement("div");
            historyItem.className = "history-item";
            if (session.id === currentChatId) {
                historyItem.classList.add("active");
            }
            
            historyItem.innerHTML = `<p>${session.title}</p>`;
            
            historyItem.addEventListener("click", () => {
                loadChatSession(session);
            });
            
            historyList.appendChild(historyItem);
        });
    }

    // Save current chat as a session
    function saveCurrentChatSession() {
        const messages = [];
        document.querySelectorAll(".chat-list .message").forEach(message => {
            if (message.classList.contains("loading")) return;
            
            const text = message.querySelector(".text").textContent;
            const isUser = message.classList.contains("outgoing");
            
            messages.push({
                role: isUser ? "user" : "assistant",
                content: text
            });
        });

        if (messages.length === 0) return;

        const chatTitle = messages[0].content.substring(0, 50) + 
                         (messages[0].content.length > 50 ? '...' : '');
        
        const sessionData = {
            id: currentChatId || Date.now().toString(),
            title: chatTitle,
            messages: messages,
            timestamp: Date.now()
        };

        const existingIndex = chatSessions.findIndex(session => session.id === sessionData.id);
        
        if (existingIndex >= 0) {
            chatSessions[existingIndex] = sessionData;
        } else {
            chatSessions.unshift(sessionData);
            currentChatId = sessionData.id;
        }

        // Keep only last 50 sessions
        if (chatSessions.length > 50) {
            chatSessions = chatSessions.slice(0, 50);
        }

        saveChatSessions();
        updateSidebarHistory();
    }

    // Load a chat session
    function loadChatSession(session) {
        currentChatId = session.id;
        chatList.innerHTML = "";
        header.style.display = "none";
        
        session.messages.forEach(message => {
            if (message.role === "user") {
                // User message
                const html = `<div class="message-content">
                    <img src="image/user.jpeg" alt="User" class="avatar user-avatar">
                    <p class="text">${message.content}</p>
                </div>`;
                const outgoingDiv = createMessageElement(html, "outgoing");
                chatList.appendChild(outgoingDiv);
            } else {
                // Bot message
                const html = `<div class="message-content">
                    <img src="image/Gemini logo.png" alt="Gemini Image" class="avatar">
                    <p class="text">${message.content}</p>
                    <span class="icon material-symbols-rounded">content_copy</span>
                </div>`;
                const incomingDiv = createMessageElement(html, "incoming");
                chatList.appendChild(incomingDiv);
                
                // Add copy functionality
                const copyBtn = incomingDiv.querySelector(".icon");
                copyBtn.addEventListener("click", () => {
                    navigator.clipboard.writeText(message.content);
                    
                    // Show copied indication
                    copyBtn.textContent = "done";
                    setTimeout(() => copyBtn.textContent = "content_copy", 1500);
                });
                
                // Apply syntax highlighting to bot messages
                applySyntaxHighlighting(incomingDiv.querySelector(".text"));
            }
        });
        
        chatList.scrollTop = chatList.scrollHeight;
        updateSidebarHistory();
    }

    // Start a new chat
    function startNewChat() {
        currentChatId = null;
        chatList.innerHTML = "";
        header.style.display = "block";
        inputField.value = "";
        inputField.focus();
        updateSidebarHistory();
    }

    // Toggle sidebar
    function toggleSidebar() {
        sidebar.classList.toggle("collapsed");
        // Update body class for responsive adjustments
        document.body.classList.toggle("sidebar-open", !sidebar.classList.contains("collapsed"));
    }

    // Initialize sidebar state
    function initializeSidebar() {
        // Ensure sidebar starts collapsed
        sidebar.classList.add("collapsed");
        // Ensure body doesn't have sidebar-open class initially
        document.body.classList.remove("sidebar-open");
    }

    // Create message element
    function createMessageElement(content, className, additionalClass = "") {
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${className} ${additionalClass}`;
        messageDiv.innerHTML = content;
        return messageDiv;
    }

    // Function to restore chat history
    function restoreChatHistory() {
        chatList.innerHTML = "";
        const savedHistory = localStorage.getItem("chatHistory");
        
        if (savedHistory) {
            try {
                const parsedHistory = JSON.parse(savedHistory);
                
                parsedHistory.forEach(item => {
                    if (item.role === "user") {
                        // User message
                        const html = `<div class="message-content">
                            <img src="image/user.jpeg" alt="User" class="avatar user-avatar">
                            <p class="text">${item.content}</p>
                        </div>`;
                        const outgoingDiv = createMessageElement(html, "outgoing");
                        chatList.appendChild(outgoingDiv);
                    } else {
                        // Bot message
                        const html = `<div class="message-content">
                            <img src="image/Gemini logo.png" alt="Gemini Image" class="avatar">
                            <p class="text">${item.content}</p>
                            <span class="icon material-symbols-rounded">content_copy</span>
                        </div>`;
                        const incomingDiv = createMessageElement(html, "incoming");
                        chatList.appendChild(incomingDiv);
                        
                        // Add copy functionality
                        const copyBtn = incomingDiv.querySelector(".icon");
                        const textElement = incomingDiv.querySelector(".text");
                        
                        copyBtn.addEventListener("click", () => {
                            navigator.clipboard.writeText(item.content);
                            
                            // Show copied indication
                            copyBtn.textContent = "done";
                            setTimeout(() => copyBtn.textContent = "content_copy", 1500);
                        });
                        
                        // Apply syntax highlighting to bot messages
                        applySyntaxHighlighting(textElement);
                    }
                });
                
                chatList.scrollTop = chatList.scrollHeight;
            } catch (e) {
                console.error("Error restoring chat history:", e);
            }
        }
    }

    // Apply code syntax highlighting
    function applySyntaxHighlighting(element) {
        const codeBlocks = element.querySelectorAll('pre');
        
        codeBlocks.forEach(block => {
            let content = block.innerHTML;
            
            // Simple syntax highlighting for common languages
            // Keywords
            content = content.replace(/\b(function|return|if|else|for|while|var|let|const|class|import|export|from|try|catch|finally|switch|case|break|continue|default|async|await|new|this|typeof|instanceof)\b/g, '<span class="keyword">$1</span>');
            
            // Strings
            content = content.replace(/(['"`])(.*?)(['"`])/g, '<span class="string">$1$2$3</span>');
            
            // Comments
            content = content.replace(/\/\/(.*)/g, '<span class="comment">//$1</span>');
            content = content.replace(/\/\*([\s\S]*?)\*\//g, '<span class="comment">/*$1*/</span>');
            
            // Functions
            content = content.replace(/(\w+)(\s*\()/g, '<span class="function">$1</span>$2');
            
            // Numbers
            content = content.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
            
            block.innerHTML = content;
        });
    }

    // Handle outgoing chat
    const handleOutgoingChat = () => {
        const userMessage = inputField.value.trim();
        if (!userMessage) return;
        
        console.log("Processing user message:", userMessage);

        // If this is the first message, create a new chat session
        if (!currentChatId) {
            currentChatId = Date.now().toString();
        }

        // Hide header when conversation starts
        header.style.display = "none";

        // Create and display user message
        const html = `<div class="message-content">
            <img src="image/user.jpeg" alt="User Image" class="avatar user-avatar">
            <p class="text">${userMessage.replace(/\n/g, '<br>')}</p>
        </div>`;

        const outgoingMessageDiv = createMessageElement(html, "outgoing");
        chatList.appendChild(outgoingMessageDiv);
        chatList.scrollTop = chatList.scrollHeight;

        // Clear input field
        inputField.value = ""; 
        
        // Save chat history with user message
        saveChatHistory();
        
        // Show loading animation and generate response
        showLoadingAnimation(userMessage);
    };

    // Show loading animation
    const showLoadingAnimation = (message) => {
        // Create animated typing dots
        const html = `<div class="message-content">
            <img src="image/Gemini logo.png" alt="Gemini Image" class="avatar">
            <div class="loading-indicator">
                <div class="typing-dots">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
            </div>
        </div>`;

        const loadingDiv = createMessageElement(html, "incoming", "loading");
        chatList.appendChild(loadingDiv);
        chatList.scrollTop = chatList.scrollHeight;

        // Show thinking message after delay
        setTimeout(() => {
            if (document.querySelector(".loading")) {
                const thinkingText = document.createElement("p");
                thinkingText.className = "thinking-text";
                thinkingText.textContent = "Thinking...";
                thinkingText.style.color = "var(--text-color)";
                thinkingText.style.opacity = "0.7";
                thinkingText.style.fontSize = "0.9rem";
                thinkingText.style.marginTop = "5px";
                thinkingText.style.textAlign = "center";
                thinkingText.style.fontStyle = "italic";
                
                const loadingIndicator = document.querySelector(".loading .loading-indicator");
                if (loadingIndicator) {
                    loadingIndicator.appendChild(thinkingText);
                }
            }
        }, 1500);

        // Small delay before calling API for better UX
        setTimeout(() => generateAPIResponse(message), 800);
    };

    // Fetch response from Gemini API
    const generateAPIResponse = async (message) => {
        try {
            console.log("Generating response for:", message);
            console.log("API Key available:", !!API_KEY);
            console.log("Demo mode:", IS_DEMO_MODE);
            
            // API key is permanently set, so this check is not needed
            if (!API_KEY) {
                console.error("API key not available");
                const loadingElem = document.querySelector(".loading");
                if (loadingElem) loadingElem.remove();
                displayBotError("API key configuration error. Please refresh the page.");
                return;
            }

            // If in demo mode, generate mock responses
            if (IS_DEMO_MODE) {
                console.log("Using demo mode response");
                
                // Remove loading indicator
                const loadingElem = document.querySelector(".loading");
                if (loadingElem) loadingElem.remove();
                
                // Create a demo response based on the prompt
                let demoResponse = "I'm running in demo mode without an API key. ";
                
                if (message.toLowerCase().includes("hello") || message.toLowerCase().includes("hi")) {
                    demoResponse += "Hello! How can I help you today?";
                } else if (message.toLowerCase().includes("javascript")) {
                    demoResponse += "JavaScript is a programming language commonly used for web development. Here's a simple example:\n\n```javascript\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet('World'));\n```";
                } else if (message.toLowerCase().includes("game night")) {
                    demoResponse += "Here are some budget-friendly game night ideas:\n\n1. Card games like UNO, playing cards\n2. Board games you already own\n3. Snacks: chips, popcorn, homemade treats\n4. Drinks: soft drinks or make your own punch\n5. Music playlist for atmosphere";
                } else {
                    demoResponse += "This is a simulated response in demo mode. To get real AI responses, please add your Gemini API key.";
                }
                
                // Display demo response
                displayBotResponse(demoResponse);
                return;
            }

            // Using real API with the provided key
            console.log("Using real API with key:", API_KEY.substring(0, 4) + "****");
            
            // Define the models to try in order of preference (using correct model names)
            const models = [
                "gemini-1.5-flash",
                "gemini-1.5-pro",
                "gemini-pro"
            ];
            
            // API versions to try (v1beta is more stable for newer models)
            const apiVersions = ["v1beta"];
            
            let response = null;
            let errorMessage = "";
            let success = false;
            
            // Try different models and API versions
            for (const apiVersion of apiVersions) {
                for (const model of models) {
                    if (success) break;
                    
                    try {
                        console.log(`Trying model: ${model} with API version: ${apiVersion}`);
                        
                        const API_URL = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${API_KEY}`;
                        
                        response = await fetch(API_URL, {
                            method: "POST",
                            headers: { 
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                contents: [{ 
                                    parts: [{ text: message }] 
                                }],
                                generationConfig: {
                                    temperature: 0.9,
                                    topK: 1,
                                    topP: 1,
                                    maxOutputTokens: 2048
                                },
                                safetySettings: [
                                    {
                                        category: "HARM_CATEGORY_HARASSMENT",
                                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                                    },
                                    {
                                        category: "HARM_CATEGORY_HATE_SPEECH",
                                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                                    },
                                    {
                                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                                    },
                                    {
                                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                                    }
                                ]
                            })
                        });
                
                        if (response.ok) {
                            success = true;
                            console.log(`Success with model: ${model} and API version: ${apiVersion}`);
                            break;
                        } else {
                            const errorData = await response.json();
                            errorMessage = errorData.error?.message || `Failed with model: ${model}`;
                            console.error(`Failed with model: ${model} - ${errorMessage}`);
                        }
                    } catch (error) {
                        console.error(`Error with model ${model}:`, error);
                        errorMessage = error.message;
                    }
                }
                
                if (success) break;
            }
            
            // Remove loading indicator
            const loadingElem = document.querySelector(".loading");
            if (loadingElem) loadingElem.remove();

            if (!success) {
                // Show error message
                const errorResponseText = `API Error: ${errorMessage || "Failed to connect to Gemini API. Please check your API key."}`;
                displayBotError(errorResponseText);
                
                // Log API key errors for debugging
                if (errorMessage && (errorMessage.includes("API key") || errorMessage.includes("auth") || errorMessage.includes("key"))) {
                    console.error("API key error:", errorMessage);
                }
                
                return;
            }

            // Process successful response
            const data = await response.json();
            
            // Extract Gemini's response
            const geminiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
            
            // Display the bot's response
            displayBotResponse(geminiReply);
        } catch (error) {
            console.error("API Error:", error);
            
            // Remove loading and show error message
            const loadingElem = document.querySelector(".loading");
            if (loadingElem) loadingElem.remove();
            
            displayBotError("Sorry, I'm having trouble connecting. Please check your API key and internet connection.");
        }
    };
    
    // Helper to display bot responses with typing animation
    function displayBotResponse(text) {
        // Remove any existing loading message
        const loadingElem = document.querySelector(".loading");
        if (loadingElem) loadingElem.remove();
        
        // Create the message container
        const html = `<div class="message-content">
            <img src="image/Gemini logo.png" alt="Gemini Image" class="avatar">
            <p class="text"></p>
            <span class="icon material-symbols-rounded">content_copy</span>
        </div>`;

        const incomingMessageDiv = createMessageElement(html, "incoming");
        chatList.appendChild(incomingMessageDiv);
        chatList.scrollTop = chatList.scrollHeight;
        
        // Get the text element to type into
        const textElement = incomingMessageDiv.querySelector(".text");
        
        // Type each character with a small delay
        let i = 0;
        const typingSpeed = 5; // lower = faster
        const minDelay = 15; // minimum delay between characters in ms
        const maxDelay = 30; // maximum delay between characters in ms
        
        // Check if text contains code blocks, if so, we'll type it faster
        const containsCodeBlock = text.includes("```");
        const speedFactor = containsCodeBlock ? 0.5 : 1;
        
        function typeNextCharacter() {
            if (i < text.length) {
                // Handle HTML tags properly by looking ahead
                if (text.charAt(i) === '<') {
                    // Find the end of this tag
                    const tagEnd = text.indexOf('>', i);
                    if (tagEnd !== -1) {
                        textElement.innerHTML += text.substring(i, tagEnd + 1);
                        i = tagEnd + 1;
                        setTimeout(typeNextCharacter, minDelay); // Process tags quickly
                        return;
                    }
                }
                
                textElement.innerHTML += text.charAt(i);
                i++;
                
                // Scroll to keep up with the typing
                chatList.scrollTop = chatList.scrollHeight;
                
                // Randomize typing speed slightly for a more natural effect
                // Type faster in code blocks
                const delay = Math.floor(Math.random() * (maxDelay - minDelay) + minDelay) * speedFactor;
                setTimeout(typeNextCharacter, delay);
            } else {
                // Done typing, now apply syntax highlighting
                applySyntaxHighlighting(textElement);
                
                // Save chat history
                saveChatHistory();
            }
        }
        
        // For very long responses (like code), type faster
        if (text.length > 500) {
            // Still show the typing effect but faster
            text = text.replace(/\n/g, '<br>');
            textElement.innerHTML = text;
            applySyntaxHighlighting(textElement);
            saveChatHistory();
        } else {
            // Start the typing animation for shorter responses
            setTimeout(typeNextCharacter, 200);
        }

        // Add copy functionality
        const copyBtn = incomingMessageDiv.querySelector(".icon");
        copyBtn.addEventListener("click", () => {
            navigator.clipboard.writeText(text);
            
            // Show copied indication
            copyBtn.textContent = "done";
            setTimeout(() => copyBtn.textContent = "content_copy", 1500);
        });
    }
    
    // Helper to display error messages
    function displayBotError(errorText) {
        const errorHtml = `<div class="message-content">
            <img src="image/Gemini logo.png" alt="Gemini Image" class="avatar">
            <p class="text error">${errorText}</p>
            <span class="icon material-symbols-rounded">content_copy</span>
        </div>`;
        
        const errorDiv = createMessageElement(errorHtml, "incoming");
        chatList.appendChild(errorDiv);
        chatList.scrollTop = chatList.scrollHeight;
        
        // Add copy functionality
        const copyBtn = errorDiv.querySelector(".icon");
        copyBtn.addEventListener("click", () => {
            navigator.clipboard.writeText(errorText);
            
            // Show copied indication
            copyBtn.textContent = "done";
            setTimeout(() => copyBtn.textContent = "content_copy", 1500);
        });
        
        // Save chat history
        saveChatHistory();
    }

    // Event listeners
    typingForm.addEventListener("submit", (e) => {
        e.preventDefault();
        handleOutgoingChat();
    });

    // Handle Enter key for sending messages
    inputField.addEventListener("keydown", (e) => {
        // Enter sends the message, Shift+Enter creates a new line
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleOutgoingChat();
        }
    });

    // Process suggestion click
    suggestionList.querySelectorAll(".suggestion").forEach(suggestion => {
        suggestion.addEventListener("click", () => {
            const text = suggestion.querySelector(".text").textContent;
            inputField.value = text;
            handleOutgoingChat();
        });
    });

    // Theme toggle
    const topThemeToggleBtn = document.querySelector(".theme-toggle-btn");
    topThemeToggleBtn.addEventListener("click", toggleTheme);
    
    // Clear chat
    clearChatBtn.addEventListener("click", clearAllChats);
    
    // Sidebar event listeners
    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", toggleSidebar);
    }
    
    if (menuBtn) {
        menuBtn.addEventListener("click", toggleSidebar);
    }
    
    if (newChatBtn) {
        newChatBtn.addEventListener("click", startNewChat);
    }
    
    // Export chat button
    exportChatBtn.addEventListener("click", () => {
        exportChat();
    });

    // Toggle theme between light and dark mode
    function toggleTheme() {
        document.body.classList.toggle("light-mode");
        const isDarkMode = !document.body.classList.contains("light-mode");
        localStorage.setItem("gemini_dark_mode", isDarkMode);
        
        // Update both theme toggle icons
        const themeIcons = document.querySelectorAll(".action-buttons .icon:nth-child(1), .theme-toggle-btn span");
        themeIcons.forEach(icon => {
            icon.textContent = isDarkMode ? "dark_mode" : "light_mode";
        });
    }
    
    // Check and apply saved theme preference
    function applySavedTheme() {
        const darkModePreference = localStorage.getItem("gemini_dark_mode");
        
        if (darkModePreference === "false") {
            document.body.classList.add("light-mode");
            const themeIcons = document.querySelectorAll(".action-buttons .icon:nth-child(1), .theme-toggle-btn span");
            themeIcons.forEach(icon => {
                icon.textContent = "dark_mode";
            });
        }
    }
    
    // Call to apply theme
    applySavedTheme();
    
    // Clear all chats
    function clearAllChats() {
        if (confirm("Are you sure you want to clear all chats?")) {
            // Clear the chat list
            chatList.innerHTML = "";
            
            // Clear localStorage chat history
            localStorage.removeItem("chatHistory");
            
            // Show header again
            header.style.display = "block";
            
            console.log("All chats cleared");
        }
    }

    // Create a new message element
    function createMessageElement(content, ...classes) {
        const div = document.createElement("div");
        div.classList.add("message", ...classes);
        div.innerHTML = content;
        return div;
    }

    // Initialize speech recognition
    initSpeechRecognition();
    
    // Load and display any saved chat history
    loadChatHistory();
    
    // Show welcome message if this is the first time or no chat history
    function showWelcomeMessage() {
        if (chatHistory.length === 0) {
            // Wait a moment before showing the welcome message
            setTimeout(() => {
                const welcomeMessage = "👋 Welcome to Gemini AI Chatbot! I'm here to help you with information, answer questions, have interesting conversations, and assist with various tasks. How can I help you today?";
                
                // Create a special welcome message
                const html = `<div class="message-content welcome-message">
                    <img src="image/Gemini logo.png" alt="Gemini Image" class="avatar">
                    <div>
                        <p class="text"></p>
                        <div class="welcome-tips" style="margin-top: 15px; display: none;">
                            <p style="margin-bottom: 10px; font-weight: 500;">Quick tips:</p>
                            <ul style="padding-left: 20px; margin-bottom: 10px;">
                                <li>Ask me any question or click a suggestion above</li>
                                <li>Use the mic icon for voice input</li>
                                <li>Click the theme icon to toggle dark/light mode</li>
                                <li>Export your chat history using the download icon</li>
                            </ul>
                            <p>I'm powered by Google's Gemini AI. Enjoy chatting!</p>
                        </div>
                    </div>
                    <span class="icon material-symbols-rounded">content_copy</span>
                </div>`;

                const incomingMessageDiv = createMessageElement(html, "incoming", "welcome");
                chatList.appendChild(incomingMessageDiv);
                
                // Type out the welcome message
                const textElement = incomingMessageDiv.querySelector(".text");
                let i = 0;
                const typingSpeed = 20;
                
                function typeWelcome() {
                    if (i < welcomeMessage.length) {
                        textElement.textContent += welcomeMessage.charAt(i);
                        i++;
                        chatList.scrollTop = chatList.scrollHeight;
                        setTimeout(typeWelcome, typingSpeed);
                    } else {
                        // Show tips after welcome message is typed
                        const tipsElement = incomingMessageDiv.querySelector(".welcome-tips");
                        tipsElement.style.display = "block";
                        
                        // Save to chat history
                        saveChatHistory();
                    }
                }
                
                setTimeout(typeWelcome, 500);
                
                // Add copy functionality
                const copyBtn = incomingMessageDiv.querySelector(".icon");
                copyBtn.addEventListener("click", () => {
                    navigator.clipboard.writeText(welcomeMessage);
                    
                    // Show copied indication
                    copyBtn.textContent = "done";
                    setTimeout(() => copyBtn.textContent = "content_copy", 1500);
                });
            }, 1000);
        }
    }

    // Load and display any saved chat history
    loadChatHistory();
    
    // Show welcome message if no chat history
    showWelcomeMessage();
    
    // Initialize sidebar
    initializeSidebar();
    updateSidebarHistory();
});

// Function to export chat
function exportChat() {
    const savedHistory = localStorage.getItem("chatHistory");
    
    if (!savedHistory || JSON.parse(savedHistory).length === 0) {
        alert("No chat history to export!");
        return;
    }
    
    try {
        const parsedHistory = JSON.parse(savedHistory);
        let exportText = "# Gemini Chat Export\n\n";
        
        parsedHistory.forEach(item => {
            if (item.role === "user") {
                exportText += `## User:\n${item.content}\n\n`;
            } else {
                exportText += `## Gemini:\n${item.content}\n\n`;
            }
        });
        
        // Create a blob and downloadable link
        const blob = new Blob([exportText], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        
        // Generate filename with date
        const date = new Date();
        const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        const filename = `gemini-chat-${formattedDate}.md`;
        
        a.href = url;
        a.download = filename;
        a.click();
        
        // Clean up
        URL.revokeObjectURL(url);
        
        console.log("Chat exported successfully");
    } catch (e) {
        console.error("Error exporting chat:", e);
        alert("Error exporting chat. Please try again.");
    }
}

