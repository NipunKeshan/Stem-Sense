import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Leaf, Loader, Sparkles, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * StemSense AI Chatbot Widget
 * 
 * A floating conversational agent that integrates with the visual analytics system.
 * Capabilities:
 *   - Answers natural language queries about sensor data
 *   - Guides users in exploring the dashboard
 *   - Explains trends, comparisons, and anomalies
 *   - Supports decision-oriented questions
 */
export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '🌱 **Welcome to StemSense AI!**\n\nI\'m your intelligent greenhouse assistant. I can help you:\n\n- Check **current sensor readings**\n- Analyze **trends and patterns**\n- Get **irrigation recommendations**\n- Understand **air quality** data\n\nTry asking: *"What are the current readings?"*',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await axios.post('/api/chat', {
        message: trimmedInput,
        history,
      });

      if (res.data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: res.data.response,
          timestamp: new Date(),
        }]);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ I\'m having trouble connecting. Please check that the backend is running and try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick action buttons for common queries
  const quickActions = [
    { label: '📊 Current Readings', query: 'What are the current readings?' },
    { label: '💧 Watering Advice', query: 'Should I water the plants?' },
    { label: '📈 Show Trends', query: 'Show me data trends' },
    { label: '❓ Help', query: 'What can you do?' },
  ];

  // Markdown renderer configuration
  const MarkdownComponents = {
    h1: ({node, ...props}: any) => <div className="font-bold text-[#1B5E20] text-sm mt-2 mb-1" {...props} />,
    h2: ({node, ...props}: any) => <div className="font-bold text-[#1B5E20] text-sm mt-2 mb-1" {...props} />,
    h3: ({node, ...props}: any) => <div className="font-bold text-[#1B5E20] text-sm mt-2 mb-1 flex items-center gap-1.5" {...props} />,
    p: ({node, ...props}: any) => <p className="mb-2 last:mb-0" {...props} />,
    ul: ({node, ...props}: any) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
    li: ({node, ...props}: any) => <li className="" {...props} />,
    strong: ({node, ...props}: any) => <strong className="font-semibold text-gray-900" {...props} />,
    em: ({node, ...props}: any) => <em className="italic text-gray-600" {...props} />
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open StemSense AI chatbot"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-105"
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div 
          className="fixed bottom-6 right-6 z-50 w-[380px] md:w-[420px] h-[560px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
          role="dialog"
          aria-label="StemSense AI Assistant"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2E7D32] to-[#1B5E20] text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">StemSense AI</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" />
                  <span className="text-[10px] text-green-200 font-medium">Online • Data-Aware</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                    : 'bg-gradient-to-br from-[#2E7D32] to-[#1B5E20]'
                }`}>
                  {msg.role === 'user' 
                    ? <User className="w-3.5 h-3.5 text-white" />
                    : <Sparkles className="w-3.5 h-3.5 text-white" />
                  }
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#2E7D32] text-white rounded-br-md'
                    : 'bg-white border border-gray-100 text-gray-700 rounded-bl-md shadow-sm'
                }`}>
                  <ReactMarkdown components={MarkdownComponents}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader className="w-3.5 h-3.5 text-[#2E7D32] animate-spin" />
                    <span className="text-xs text-gray-400">Analyzing data...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions (shown when few messages) */}
          {messages.length <= 2 && !isLoading && (
            <div className="px-4 py-2 border-t border-gray-100 bg-white flex-shrink-0">
              <div className="flex flex-wrap gap-1.5">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => {
                      setInput(action.query);
                      setTimeout(() => handleSend(), 50);
                      setInput(action.query);
                    }}
                    className="text-[11px] px-2.5 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-[#2E7D32]/10 hover:text-[#2E7D32] transition-colors font-medium"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0">
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your greenhouse..."
                disabled={isLoading}
                aria-label="Type a message"
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="p-1.5 bg-[#2E7D32] text-white rounded-lg hover:bg-[#1B5E20] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-1.5">
              Powered by StemSense AI • Data-aware responses
            </p>
          </div>
        </div>
      )}
    </>
  );
}
