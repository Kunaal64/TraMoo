import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import rehypeRaw from 'rehype-raw';

type Message = {
  _id: string;
  type: 'user' | 'bot';
  text: string;
  timestamp: string;
  chatSessionId?: string;
  error?: boolean;
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const { user, token } = useAuth();
  const { toast } = useToast();

  const getChatSessionId = () => {
    if (!user) return 'anonymous';
    return `chat_session_${user._id}`;
  };

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (isOpen && user && token) {
        setLoading(true);
        try {
          const chatSessionId = getChatSessionId();
          const history = await apiService.getChatHistory(chatSessionId);
          
          // Transform the history to match our Message type
          const formattedMessages: Message[] = history.map(msg => ({
            _id: msg._id,
            type: msg.sender as 'user' | 'bot',
            text: msg.message,
            timestamp: new Date(msg.timestamp).toLocaleTimeString(),
            chatSessionId: msg.chatSessionId
          }));
          
          setMessages(formattedMessages);
        } catch (error) {
          console.error('Error fetching chat history:', error);
          toast({
            title: "Error",
            description: "Failed to load chat history.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchChatHistory();
  }, [isOpen, user, token, toast]);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async () => {
    const messageText = input.trim();
    if (messageText === '' || loading) return;
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use the chatbot.",
        variant: "destructive",
      });
      return;
    }

    const chatSessionId = getChatSessionId();
    const tempMessageId = `temp-${Date.now()}`;
    const userMessage = { 
      _id: tempMessageId,
      type: 'user' as const, 
      text: messageText, 
      timestamp: new Date().toLocaleTimeString(),
      chatSessionId
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiService.sendChatMessage(messageText, chatSessionId);
      
      if (response.success && response.messages?.length) {
        // Update messages with the server response
        setMessages(prev => {
          // Remove the temporary message
          const filtered = prev.filter(msg => msg._id !== tempMessageId);
          // Add the server-validated messages
          return [
            ...filtered,
            ...response.messages.map(msg => ({
              _id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: msg.type as 'user' | 'bot',
              text: msg.text,
              timestamp: msg.timestamp,
              chatSessionId
            }))
          ];
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Sorry, I'm having trouble connecting. Please try again later.",
        variant: "destructive",
      });
      
      // Update the message to show it failed
      setMessages(prev => prev.map(msg => 
        msg._id === tempMessageId 
          ? { 
              ...msg, 
              error: true, 
              text: `${msg.text} (Failed to send)`,
              type: 'user' as const
            } 
          : msg
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to clear chat history.",
        variant: "destructive",
      });
      return;
    }
    try {
      const chatSessionId = getChatSessionId();
      await apiService.clearChatHistory(chatSessionId);
      setMessages([]);
      toast({
        title: "Chat Cleared",
        description: "Your chat history has been cleared.",
        variant: "success",
      });
    } catch (error) {
      console.error('Error clearing chat history:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to clear chat history.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="animate-float bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-4 rounded-full shadow-xl hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-300/50 transition-all duration-300"
        onClick={toggleChatbot}
        aria-label={isOpen ? 'Close Chatbot' : 'Open Chatbot'}
        style={{
          animation: 'float 3s ease-in-out infinite',
          boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4), 0 10px 10px -5px rgba(59, 130, 246, 0.2)'
        }}
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
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-3xl shadow-2xl w-96 h-[500px] flex flex-col mt-4 border border-gray-100 overflow-hidden backdrop-blur-sm bg-white/90"
          >
            <div className="flex-none p-4 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-t-3xl flex justify-between items-center shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute -right-0.5 -bottom-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                  <img 
                    src="/bot-avatar.png" 
                    alt="Bot Avatar" 
                    className="w-8 h-8 rounded-full object-cover shadow-sm border-2 border-white/20"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Travel Assistant</h2>
                  <p className="text-xs opacity-80">Online</p>
                </div>
              </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleClearChat}
                className="text-white hover:opacity-80 focus:outline-none p-1 rounded-full transition-colors"
                aria-label="Clear chat history"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button onClick={toggleChatbot} className="text-white hover:opacity-80 focus:outline-none p-1 rounded-full transition-colors" aria-label="Close Chatbot">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              </div>
            </div>
            <div 
              ref={chatWindowRef} 
              className="flex-grow p-4 overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100/50 text-gray-800 text-sm leading-relaxed custom-scrollbar"
              style={{ scrollBehavior: 'smooth' }}
            >
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500"
              >
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-1">Welcome to Travel Assistant</h3>
                <p className="text-sm text-gray-500">Ask me anything about travel destinations, tips, or recommendations!</p>
              </motion.div>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <motion.div 
                    key={msg._id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`mb-3 flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`flex items-start max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse ml-auto' : 'flex-row'}`}>
                      {msg.type !== 'user' && (
                        <img
                          src="/bot-avatar.png"
                          alt="Bot Avatar"
                          className="w-8 h-8 rounded-full object-cover shadow-sm border-2 border-white mt-1"
                        />
                      )}
                      <div className={`mx-2 ${msg.type === 'user' ? 'mr-3' : 'ml-3'}`}>
                        <div 
                          className={`inline-block px-4 py-3 rounded-2xl shadow-sm animate-pop-in ${
                            msg.type === 'user' 
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none' 
                              : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm'
                          }`}
                          style={{
                            animation: 'popIn 0.2s ease-out forwards'
                          }}
                        >
                          {msg.type === 'bot' ? (
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                {msg.text}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          )}
                        </div>
                        <span className={`block text-xs mt-1 text-gray-400 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.type === 'user' && (
                            <span className="ml-1 inline-block">
                              <svg className="w-3.5 h-3.5 text-blue-300 inline" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {loading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-2 p-3 bg-white/50 rounded-full w-fit ml-14 mt-2 shadow-sm border border-gray-100"
                  >
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">Travel Assistant is typing...</span>
                  </motion.div>
                )}
              </>
            )}
            </div>
            <div className="flex-none p-4 border-t border-gray-100 bg-white/80 backdrop-blur-sm">
            <div className="flex items-end space-x-2">
              <div className="flex-grow relative">
                <div className="absolute left-3 bottom-2.5 text-gray-400">
                  <button className="hover:text-blue-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                <input
                  type="text"
                  className="w-full bg-white border border-gray-200 rounded-full py-2.5 pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:ring-offset-2 transition-all duration-200 text-gray-800 placeholder-gray-400 text-sm shadow-sm hover:border-blue-300"
                  placeholder="Ask about travel..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={loading}
                  aria-label="Chat input"
                />
                <div className="absolute right-2 bottom-1.5 flex space-x-1">
                  <button className="text-gray-400 hover:text-blue-500 p-1 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2.5 rounded-full shadow-sm flex-shrink-0 transition-all duration-200 ${
                  input.trim() 
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:shadow-md hover:-translate-y-0.5' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                style={{
                  boxShadow: input.trim() 
                    ? '0 4px 6px -1px rgba(99, 102, 241, 0.2), 0 2px 4px -1px rgba(99, 102, 241, 0.1)'
                    : 'none'
                }}
                onClick={handleSendMessage}
                disabled={!input.trim() || loading}
                aria-label="Send message"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </motion.button>
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chatbot; 