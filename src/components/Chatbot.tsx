import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import botAvatar from '@/assets/bot-avatar.svg';

type Message = {
  _id: string;
  type: 'user' | 'bot';
  text: string;
  timestamp: string;
  chatSessionId?: string;
  error?: boolean;
};

// Keyframes and theme variables
const styles = `
  :root {
    --primary-light: #4f46e5;
    --primary-dark: #6366f1;
    --secondary-light: #f8fafc;
    --secondary-dark: #1e293b;
    --text-primary-light: #1e293b;
    --text-primary-dark: #f8fafc;
    --text-secondary-light: #64748b;
    --text-secondary-dark: #94a3b8;
    --bg-light: #ffffff;
    --bg-dark: #0f172a;
    --card-bg-light: #f8fafc;
    --card-bg-dark: #1e293b;
    --border-light: #e2e8f0;
    --border-dark: #334155;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .chat-container {
    @apply transition-colors duration-300;
  }

  .chat-header {
    background: linear-gradient(135deg, var(--primary-light), var(--primary-dark));
    @apply bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-90;
  }

  .chat-window {
    /* For Webkit browsers (Chrome, Safari, newer Edge) */
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
      margin: 8px 0;
    }
    &::-webkit-scrollbar-thumb {
      background-color: rgba(99, 102, 241, 0.5);
      border-radius: 3px;
      &:hover {
        background-color: rgba(99, 102, 241, 0.7);
      }
    }
    /* For Firefox */
    scrollbar-width: thin;
    scrollbar-color: rgba(99, 102, 241, 0.5) transparent;
    /* For IE/Edge */
    -ms-overflow-style: none;
    scrollbar-face-color: rgba(99, 102, 241, 0.5);
    scrollbar-track-color: transparent;
  }

  .chat-message {
    animation: fadeIn 0.2s ease-out forwards;
    max-width: 85%;
    margin-bottom: 0.75rem;
    
    &.user {
      margin-left: auto;
      
      .message-bubble {
        background: linear-gradient(135deg, #4f46e5, #6366f1);
        color: white;
        border-radius: 1.5rem 1.5rem 0.25rem 1.5rem;
        margin-left: auto;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
    }
    
    &.assistant {
      margin-right: auto;
      
      .message-bubble {
        background: #f1f5f9;
        color: #1e293b;
        border-radius: 1.5rem 1.5rem 1.5rem 0.25rem;
        margin-right: auto;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
    }
    
    .message-bubble {
      padding: 0.875rem 1.125rem;
      max-width: 100%;
      line-height: 1.5;
      word-wrap: break-word;
      transition: all 0.2s ease;
      border: 1px solid rgba(0, 0, 0, 0.05);
      
      p {
        margin: 0.25rem 0;
      }
      
      &:hover {
        transform: translateY(-1px);
      }
    }
    
    .message-time {
      font-size: 0.7rem;
      opacity: 0.7;
      margin-top: 0.25rem;
      text-align: right;
    }
  }

  .chat-input {
    @apply transition-all duration-200;
    background-color: var(--card-bg-light);
    border-color: var(--border-light);
    color: var(--text-primary-light);
  }

  .dark .chat-input {
    background-color: var(--card-bg-dark);
    border-color: var(--border-dark);
    color: var(--text-primary-dark);
  }

  .chat-input:focus {
    @apply ring-2 ring-offset-2 ring-blue-500 border-transparent;
  }

  .chat-bubble-user {
    background: linear-gradient(135deg, #4f46e5, #6366f1);
    @apply text-white rounded-2xl rounded-tr-none;
  }

  .chat-bubble-bot {
    background: var(--card-bg-light);
    @apply text-gray-800 border border-gray-200 rounded-2xl rounded-tl-none;
  }

  .dark .chat-bubble-bot {
    background: var(--card-bg-dark);
    @apply text-gray-100 border-gray-700;
  }

  .chat-window {
    background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
    @apply transition-colors duration-300;
  }

  .dark .chat-window {
    background: linear-gradient(to bottom, #0f172a, #1e293b);
  }
`;

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const { user, token } = useAuth();
  const { toast } = useToast();

  // Log the user object to help debug avatar issue
  useEffect(() => {
    console.log('Current user:', user);
  }, [user]);

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
          
          const formattedMessages: Message[] = history.map(msg => ({
            _id: msg._id,
            type: msg.sender as 'user' | 'bot',
            text: msg.message,
            timestamp: new Date(msg.timestamp).toLocaleTimeString(),
            chatSessionId: msg.chatSessionId
          }));
          
          setMessages(formattedMessages);
          setShowWelcomeMessage(history.length === 0);
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
      } else if (isOpen && !user) {
        setShowWelcomeMessage(true);
      }
    };

    fetchChatHistory();
  }, [isOpen, user, token, toast]);

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

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
    setShowWelcomeMessage(false);

    try {
      const response = await apiService.sendChatMessage(messageText, chatSessionId);
      
      if (response.success && response.messages?.length) {
        setMessages(prev => {
          const filtered = prev.filter(msg => msg._id !== tempMessageId);
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
      setIsClearing(true);
      const chatSessionId = getChatSessionId();
      await apiService.clearChatHistory(chatSessionId);
      setMessages([]);
      setShowWelcomeMessage(true);
      
      // Auto-dismiss the clearing state after 3 seconds
      setTimeout(() => {
        setIsClearing(false);
      }, 3000);
      
      toast({
        title: "Chat Cleared",
        description: "Your chat history has been cleared.",
        variant: "success",
      });
    } catch (error) {
      console.error('Error clearing chat history:', error);
      setIsClearing(false);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to clear chat history.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 chat-container" style={{ maxWidth: 'calc(100% - 2rem)' }}>
      {!isOpen ? (
        <button
          className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 transform hover:-translate-y-1"
          onClick={() => setIsOpen(true)}
          aria-label="Open Chatbot"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-[24rem] h-[32rem] flex flex-col overflow-hidden border border-gray-200 dark:border-slate-700 backdrop-blur-lg bg-opacity-95 dark:bg-opacity-95"
          style={{
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="chat-header flex-none p-4 text-white rounded-t-3xl flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative w-10 h-10 rounded-full bg-white dark:bg-slate-800 p-0.5">
                  <img 
                    src={botAvatar} 
                    alt="Assistant" 
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Travel Assistant</h2>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <p className="text-xs opacity-90">Online</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleClearChat}
                className="p-2 rounded-full hover:bg-white/20"
                aria-label="Clear Chat History"
                title="Clear chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-white/20"
                aria-label="Close Chatbot"
                title="Close chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div 
            ref={chatWindowRef} 
            className="chat-window flex-grow p-4 overflow-y-auto text-sm leading-relaxed custom-scrollbar flex flex-col"
            style={{ 
              scrollBehavior: 'smooth',
              maxHeight: 'calc(100% - 120px)',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(99, 102, 241, 0.5) transparent',
              msOverflowStyle: 'none',
            }}
          >
            {showWelcomeMessage && messages.length === 0 && !loading && !isClearing ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="relative mb-6 w-24 h-24">
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 dark:from-indigo-500/5 dark:to-purple-600/5 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 dark:from-indigo-500/5 dark:to-purple-600/5 rounded-full blur-lg"></div>
                  <div className="relative w-full h-full rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                      TA
                    </div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                  Travel Assistant
                </h3>
                {user ? (
                  <p className="mb-6 text-gray-600 dark:text-gray-300 max-w-md">
                    Hi <span className="font-semibold text-indigo-600 dark:text-indigo-400">{user.name.split(' ')[0]}</span>! I'm here to help with your travel plans. What would you like to know?
                  </p>
                ) : (
                  <p className="mb-6 text-gray-600 dark:text-gray-300 max-w-md">
                    Get personalized travel assistance. Log in to save your chat history and unlock more features.
                  </p>
                )}
                <div className="w-full max-w-xs mx-auto bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-200/50 dark:border-slate-700/50">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">TRY ASKING:</p>
                  <ul className="space-y-2">
                    {["Best time to visit Paris", "Packing list for a beach trip", "Top attractions in Tokyo"].map((item, i) => (
                      <li 
                        key={i} 
                        className="text-sm px-4 py-2.5 bg-white dark:bg-slate-800/80 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-slate-700/50 shadow-xs"
                        onClick={() => {
                          setInput(item);
                          setTimeout(() => {
                            const input = document.querySelector('.chat-input') as HTMLInputElement;
                            input?.focus();
                          }, 0);
                        }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (messages.length === 0 || isClearing) && !loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <div className="relative mb-4">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                  <div className="relative w-16 h-16 rounded-full bg-white dark:bg-slate-800 p-1">
                    <img 
                      src={botAvatar} 
                      alt="Assistant" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                  {isClearing ? 'Chat Cleared' : 'Start a conversation'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs px-4 mb-3">
                  {isClearing 
                    ? 'Your chat history has been cleared.' 
                    : 'Type a message to begin chatting with the Travel Assistant'}
                </p>
                {isClearing && (
                  <button 
                    onClick={() => setIsClearing(false)}
                    className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity shadow-sm"
                  >
                    Got it
                  </button>
                )}
              </div>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <div 
                    key={msg._id || index} 
                    className={`chat-message mb-4 flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`flex items-start max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse ml-auto' : 'flex-row'}`}>
                      {msg.type === 'user' ? (
                        <div className="relative">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 blur transition duration-200"></div>
                          <div 
                            className="relative w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-600 dark:text-indigo-300 font-semibold text-lg border-2 border-white dark:border-slate-800"
                            title={user?.name || 'User'}
                          >
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        </div>
                      ) : (
                        <div className="relative group">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 blur transition duration-300"></div>
                          <div className="relative w-8 h-8 rounded-full bg-white dark:bg-slate-800 p-0.5">
                            <img 
                              src={botAvatar}
                              alt="Assistant"
                              className="w-full h-full rounded-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                      <div className={`mx-2 ${msg.type === 'user' ? 'ml-3' : 'mr-3'}`}>
                        <div className={`message-bubble ${msg.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-slate-800'}`}>
                          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{msg.text}</ReactMarkdown>
                          <div className="message-time">
                            {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        {msg.error && (
                          <span className="text-red-500 text-xs mt-1">
                            Message not sent. Please try again.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center space-x-2 p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full w-fit ml-14 mt-2 shadow-sm border border-gray-200 dark:border-slate-700">
                    <div className="flex space-x-1.5">
                      {[...Array(3)].map((_, i) => (
                        <div 
                          key={i}
                          className="w-2 h-2 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full animate-bounce" 
                          style={{ 
                            animationDelay: `${i * 150}ms`,
                            transform: 'translateY(0)'
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Travel Assistant is typing...</span>
                  </div>
                )}
              </>
            )}
            </div>
            <div className="flex-none p-4 border-t border-gray-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-b-3xl">
              <div className="flex items-center space-x-3">
                <div className="flex-grow relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="chat-input w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full py-2.5 pl-12 pr-14 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 text-sm shadow-sm transition-all duration-200"
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
                </div>
                <button
                  className={`p-2.5 rounded-full transition-all duration-200 ${
                    input.trim() 
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-md hover:shadow-lg hover:scale-105' 
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  }`}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot; 