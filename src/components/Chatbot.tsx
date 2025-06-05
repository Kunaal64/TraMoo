import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import botAvatar from '@/assets/bot-avatar.svg';
import userAvatar from '@/assets/user-avatar.svg';
import dayjs from 'dayjs';

type Message = {
  _id: string;
  type: 'user' | 'bot';
  text: string;
  timestamp: string;
  fullDate?: string;
  displayDateSeparator?: boolean;
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

  .chat-message-container {
    display: flex;
    align-items: flex-end;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .chat-message-container.user {
    justify-content: flex-end;
  }

  .chat-avatar {
    width: 2rem;
    height: 2rem;
    border-radius: 9999px;
    flex-shrink: 0;
  }

  .chat-message {
    animation: fadeIn 0.2s ease-out forwards;
    display: flex;
    flex-direction: column;
    
    &.user {
      align-items: flex-end;
      .message-bubble {
        background: linear-gradient(135deg, #4f46e5, #6366f1);
        color: white;
        border-radius: 1.5rem 1.5rem 0.5rem 1.5rem;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }
    }
    
    &.assistant {
      align-items: flex-start;
      .message-bubble {
        background: linear-gradient(135deg, #ADD8E6, #87CEEB); /* Light blue gradient for assistant in light mode */
        color: var(--text-primary-light);
        border-radius: 1.5rem 1.5rem 1.5rem 0.5rem;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
      }
    }
    
    .dark .chat-message.assistant .message-bubble { /* Steel blue/cadet blue gradient for assistant in dark mode */
      background: linear-gradient(135deg, #4682B4, #5F9EA0);
      color: var(--text-primary-dark);
    }
    
    .message-bubble {
      padding: 0.875rem 1.125rem;
      max-width: 100%;
      line-height: 1.5;
      word-wrap: break-word;
      transition: all 0.2s ease;
      border: 1px solid rgba(0, 0, 0, 0.05);
      position: relative;
      
      p {
        margin: 0.25rem 0;
      }
      
      &:hover {
        transform: translateY(-1px);
      }
    }
    
    .message-bubble .message-time {
      font-size: 0.65rem;
      opacity: 0.7;
      margin-top: 0.5rem;
      text-align: right;
      color: inherit;
    }

    .chat-message.user .message-bubble .message-time {
      color: rgba(255, 255, 255, 0.8);
    }

    .chat-message.assistant .message-bubble .message-time {
      color: rgba(0, 0, 0, 0.6);
    }
    .dark .chat-message.assistant .message-bubble .message-time {
      color: rgba(255, 255, 255, 0.6);
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
          
          const formattedMessages: Message[] = history.map((msg, index) => {
            const currentMessageDate = dayjs(msg.timestamp);
            let displayDateSeparator = false;
            let fullDateString: string | undefined;

            if (index === 0) {
              displayDateSeparator = true;
            } else {
              const prevMessageDate = dayjs(history[index - 1].timestamp);
              if (!currentMessageDate.isSame(prevMessageDate, 'day')) {
                displayDateSeparator = true;
              }
            }

            if (displayDateSeparator) {
              fullDateString = currentMessageDate.format('MMMM D, YYYY');
            }

            return {
              _id: msg._id,
              type: msg.sender as 'user' | 'bot',
              text: msg.message,
              timestamp: currentMessageDate.format('h:mm A'),
              fullDate: fullDateString,
              displayDateSeparator: displayDateSeparator,
              chatSessionId: msg.chatSessionId
            };
          });
          
          setMessages(formattedMessages);
          setShowWelcomeMessage(history.length === 0);
        } catch (error) {
          console.error('Error fetching chat history:', error);
          toast({
            title: "Error",
            description: "Failed to load chat history. Please try again.",
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
    if (!input.trim() || loading) return;

    const chatSessionId = getChatSessionId();
    const newMessageText = input.trim();

    // Get current date for potential separator
    const now = dayjs();
    let displayDateSeparator = false;
    let fullDateString: string | undefined;

    if (messages.length === 0) {
      displayDateSeparator = true;
    } else {
      const lastMessageDate = dayjs(messages[messages.length - 1].timestamp);
      if (!now.isSame(lastMessageDate, 'day')) {
        displayDateSeparator = true;
      }
    }

    if (displayDateSeparator) {
        fullDateString = now.format('MMMM D, YYYY');
    }

    // Add user message to state immediately with formatted timestamp and date info
    const newUserMessage: Message = {
      _id: `temp-user-${Date.now()}`,
      type: 'user',
      text: newMessageText,
      timestamp: now.format('h:mm A'),
      fullDate: fullDateString,
      displayDateSeparator: displayDateSeparator,
      chatSessionId: chatSessionId,
    };

    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiService.sendChatMessage(newMessageText, chatSessionId);
      const botResponseText = response.messages[1]?.text || 'No response from bot.';

      // Get current date for bot message timestamp
      const botMessageTime = dayjs();
      let botDisplayDateSeparator = false;
      let botFullDateString: string | undefined;

      // Check if bot message is on a new day compared to the last message (user's message)
      // We use `now` here because `now` represents the timestamp of the user's message just sent.
      if (!botMessageTime.isSame(now, 'day')) {
        botDisplayDateSeparator = true;
        botFullDateString = botMessageTime.format('MMMM D, YYYY');
      }

      const botMessage: Message = {
        _id: `temp-bot-${Date.now()}`,
        type: 'bot',
        text: botResponseText,
        timestamp: botMessageTime.format('h:mm A'),
        fullDate: botFullDateString,
        displayDateSeparator: botDisplayDateSeparator,
        chatSessionId: chatSessionId,
      };

      setMessages((prevMessages) => {
        // Find and replace the temporary user message with its final ID if available (optional, but good practice)
        // For now, just add the bot message
        return [...prevMessages, botMessage];
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Update the last user message to show an error
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === newUserMessage._id ? { ...msg, error: true } : msg
        )
      );
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
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
    <>
      {/* Chatbot Open Button (always bottom right) */}
      {!isOpen && (
        <button
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 transform hover:-translate-y-1"
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {/* Chatbot Box (responsive positioning) */}
      {isOpen && (
        <div 
          className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-[95vw] h-full max-h-[85vh] flex flex-col overflow-hidden rounded-t-3xl md:bottom-6 md:right-6 md:left-auto md:transform-none md:h-[32rem] md:max-w-[24rem] md:rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-gray-200 dark:border-slate-700 backdrop-blur-lg bg-opacity-95 dark:bg-opacity-95 z-[90]"
          style={{
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="chat-header flex-none p-4 text-white rounded-t-3xl flex justify-between items-center bg-gradient-to-r from-indigo-500 to-purple-600">
            <div className="flex items-center space-x-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white p-1">
                <img 
                  src={botAvatar}
                  alt="Travel Assistant"
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-lg font-semibold text-white">Travel Assistant</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleClearChat}
                disabled={isClearing}
                className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                aria-label="Clear chat history"
                title="Clear chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close chat"
                title="Close chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div 
            ref={chatWindowRef} 
            className="chat-window flex-grow p-3 sm:p-4 overflow-y-auto text-sm leading-relaxed custom-scrollbar flex flex-col"
            style={{
              scrollBehavior: 'smooth',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(99, 102, 241, 0.5) transparent',
              msOverflowStyle: 'none',
            }}
          >
            {showWelcomeMessage && messages.length === 0 && !loading && !isClearing ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
                <div className="w-full max-w-xs mx-auto">
                  <div className="relative mb-6 w-24 h-24 mx-auto">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center p-2">
                      <img
                        src={botAvatar}
                        alt="Travel Assistant Avatar"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3 text-center">
                    Travel Assistant
                  </h1>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-6 text-center px-2">
                    Hi {user?.name || 'there'}! I'm here to help with your travel plans. What would you like to know?
                  </p>
                  <div className="w-full space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-2 text-center">TRY ASKING:</p>
                    <button 
                      onClick={() => {
                        setInput('Best time to visit Paris');
                        const sendButton = document.querySelector('button[aria-label="Send message"]') as HTMLButtonElement;
                        setTimeout(() => sendButton?.click(), 100);
                      }}
                      className="w-full py-2 px-3 text-sm bg-gray-100 dark:bg-slate-800 rounded-lg text-left text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors duration-200 shadow-sm truncate"
                    >
                      Best time to visit Paris
                    </button>
                    <button 
                      onClick={() => {
                        setInput('Packing list for a beach trip');
                        const sendButton = document.querySelector('button[aria-label="Send message"]') as HTMLButtonElement;
                        setTimeout(() => sendButton?.click(), 100);
                      }}
                      className="w-full py-2 px-3 text-sm bg-gray-100 dark:bg-slate-800 rounded-lg text-left text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors duration-200 shadow-sm truncate"
                    >
                      Packing list for a beach trip
                    </button>
                    <button 
                      onClick={() => {
                        setInput('Top attractions in Tokyo');
                        const sendButton = document.querySelector('button[aria-label="Send message"]') as HTMLButtonElement;
                        setTimeout(() => sendButton?.click(), 100);
                      }}
                      className="w-full py-2 px-3 text-sm bg-gray-100 dark:bg-slate-800 rounded-lg text-left text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors duration-200 shadow-sm truncate"
                    >
                      Top attractions in Tokyo
                    </button>
                  </div>
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
                {messages.map((message, index) => (
                  <React.Fragment key={message._id}>
                    {message.displayDateSeparator && (
                      <div className="text-center text-xs text-gray-500 dark:text-gray-400 my-4">
                        {message.fullDate}
                      </div>
                    )}
                    <div
                      className={`chat-message-container ${message.type}`}
                    >
                      {message.type === 'bot' && (
                        <img src={botAvatar} alt="Bot Avatar" className="chat-avatar" />
                      )}
                      <div className={`chat-message ${message.type} max-w-full md:max-w-[85%]`}>
                        <div className="message-bubble">
                          <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                            {message.text}
                          </ReactMarkdown>
                          <div className="message-time">
                            {message.timestamp}
                          </div>
                        </div>
                      </div>
                      {message.type === 'user' && user && (
                        <img
                          src={userAvatar}
                          alt="User Avatar"
                          className="chat-avatar"
                        />
                      )}
                    </div>
                  </React.Fragment>
                ))}
                {loading && messages.length > 0 && (
                  <div className="chat-message-container assistant">
                    <img src={botAvatar} alt="Bot Avatar" className="chat-avatar" />
                    <div className="chat-message assistant">
                      <div className="message-bubble">
                        <span className="loading-dots">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex-none p-4 border-t border-gray-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-b-3xl">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex-grow relative">
                <input
                  type="text"
                  className="chat-input w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full py-2.5 pl-4 pr-10 sm:pr-14 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 text-sm shadow-sm transition-all duration-200"
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
    </>
  );
};

export default Chatbot; 