import React, { useState } from "react";

const ChatForm = ({ onSendMessage, isLoading }) => {
    const [inputValue, setInputValue] = useState("");    
    
    const handleFormSubmit = (e) => {
        e.preventDefault();
        
        if (inputValue.trim() && !isLoading) {
            onSendMessage(inputValue);
            setInputValue(""); // Clear input after sending
        }
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    return (
        <form action="#" onSubmit={handleFormSubmit}>
            <input 
                type="text" 
                placeholder="Message..." 
                className="message-input" 
                value={inputValue}
                onChange={handleInputChange}
                disabled={isLoading}
                required
            />
            <button 
                className="material-symbols-outlined"
                type="submit"
                disabled={isLoading}
            >
                arrow_upward
            </button>
        </form>
    );
};

export default ChatForm;
