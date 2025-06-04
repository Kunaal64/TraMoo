import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-001" });

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Scroll to bottom of messages when new message arrives
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) {
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
  }, [messages]);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage = { type: 'user', text: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const result = await model.generateContent(input);
      const response = await result.response;
      const text = response.text();
      setMessages((prevMessages) => [...prevMessages, { type: 'bot', text: text }]);
    } catch (error) {
      console.error('Error communicating with Gemini API:', error);
      setMessages((prevMessages) => [...prevMessages, { type: 'bot', text: 'Sorry, I am having trouble connecting. Please try again later. (Quota Exceeded)' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        className="bg-orange-500 text-white p-4 rounded-full shadow-lg hover:bg-orange-600 focus:outline-none transition-all duration-300 transform hover:scale-105"
        onClick={toggleChatbot}
        aria-label={isOpen ? 'Close Chatbot' : 'Open Chatbot'}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="bg-white rounded-xl shadow-2xl w-80 h-96 flex flex-col mt-4 border border-gray-100 animate-fade-in-up overflow-hidden">
          <div className="flex-none p-4 border-b border-gray-100 bg-orange-500 text-white rounded-t-xl flex justify-between items-center">
            <h2 className="text-lg font-semibold">Travel Assistant</h2>
            <button onClick={toggleChatbot} className="text-white hover:opacity-80 focus:outline-none p-1 rounded-full transition-colors" aria-label="Close Chatbot">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div id="chat-window" className="flex-grow p-4 overflow-y-auto bg-gray-50 text-gray-800 text-sm leading-relaxed custom-scrollbar">
            {messages.map((msg, index) => (
              <div key={index} className={`mb-3 flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <span className={`inline-block px-4 py-2 rounded-xl max-w-[75%] shadow-sm border ${msg.type === 'user' ? 'bg-orange-100 border-orange-200 text-gray-800' : 'bg-gray-100 border-gray-200 text-gray-800'}`}>
                  {msg.text}
                </span>
              </div>
            ))}
            {loading && <div className="text-center text-gray-500 mt-2 text-xs italic">Typing...</div>}
          </div>
          <div className="flex-none p-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                className="flex-grow border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors duration-200 text-gray-900"
                placeholder="Ask about travel..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
                disabled={loading}
                aria-label="Chat input"
              />
              <button
                className="bg-orange-500 text-white p-3 rounded-full shadow-md hover:bg-orange-600 focus:outline-none transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                onClick={handleSendMessage}
                disabled={loading}
                aria-label="Send message"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot; 