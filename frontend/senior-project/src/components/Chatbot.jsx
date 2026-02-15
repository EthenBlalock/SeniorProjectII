import { useState, useEffect, useRef } from "react";
import "./Chatbot.css";
import ChatForm from "./ChatForm";
import { useAuth } from "../hooks/AuthContext";


const ChatbotIcon = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
            <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z" />
        </svg>
    );
};

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const chatBodyRef = useRef(null);
    const { auth, loadingAuth } = useAuth();


    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    // Send initial greeting
    useEffect(() => {
        const initialMessage = {
            type: 'bot',
            text: 'Hello! I\'m your UpScale financial assistant. How can I help you today?',
            timestamp: new Date()
        };
        setMessages([initialMessage]);
    }, []);

    async function getChatBotResponse(auth, userInput) {
        try {
            const res = await fetch("/api/react/chatbot", { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    auth: auth, 
                    "user_input": userInput
                }),
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json = await res.json();
            return json["reply"];
        } catch (err) {
            console.error('Failed to get chatbot response:', err);
            return "I'm sorry, I'm having trouble connecting right now. Please try again.";
        }
    }

    const handleSendMessage = async (userInput) => {
        if (!userInput.trim()) return;

        // Add user message
        const userMessage = {
            type: 'user',
            text: userInput,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);

        // Show loading
        setIsLoading(true);

        // Get bot response
        const botReply = await getChatBotResponse(auth, userInput);

        // Add bot message
        const botMessage = {
            type: 'bot',
            text: botReply,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
    };

    const toggleChatbot = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="container">
            {/* Toggle Button when closed */}
            {!isOpen && (
                <button className="chatbot-toggle" onClick={toggleChatbot}>
                    <span className="material-symbols-outlined">mode_comment</span>
                </button>
            )}

            {/* Chatbot Popup */}
            {isOpen && (
                <div className="chatbot-popup">
                    {/* Chatbot Header */}
                    <div className="chat-header">
                        <div className="header-info">
                            <ChatbotIcon/>
                            <h2 className="logo-text">AI Assistant</h2>
                        </div>
                        <button 
                            className="material-symbols-outlined"
                            onClick={toggleChatbot}
                        >
                            keyboard_arrow_down
                        </button>
                    </div>

                    {/* Chatbot Body */}
                    <div className="chat-body" ref={chatBodyRef}>
                        {messages.map((message, index) => (
                            <div 
                                key={index} 
                                className={`message-${message.type}-message`}
                            >
                                <ChatbotIcon/>
                                <p className="message-text">
                                    {message.text}
                                </p>
                            </div>
                        ))}

                        {/* Loading Indicator */}
                        {isLoading && (
                            <div className="message-bot-message">
                                <ChatbotIcon/>
                                <div className="message-text loading-message">
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chatbot footer */}
                    <div className="chat-footer">
                        <ChatForm onSendMessage={handleSendMessage} isLoading={isLoading} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chatbot;
