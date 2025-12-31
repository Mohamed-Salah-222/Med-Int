import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, X, Loader2 } from "lucide-react";
import { chatbotAPI } from "../services/api";
import { ChatMessage } from "../types";

interface LessonChatbotProps {
  lessonId: string;
  lessonTitle: string;
}

function LessonChatbot({ lessonId, lessonTitle }: LessonChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hi! I'm your AI tutor for "${lessonTitle}". I'm here to help you understand the content better. Ask me anything! 📚`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [usageLoading, setUsageLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const MESSAGE_LIMIT = 15;

  // Fetch usage on mount
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await chatbotAPI.getUsage(lessonId);
        setMessageCount(response.data.messageCount);
      } catch (error) {
        console.error("Error fetching usage:", error);
      } finally {
        setUsageLoading(false);
      }
    };

    fetchUsage();
  }, [lessonId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || messageCount >= MESSAGE_LIMIT) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await chatbotAPI.sendMessage(lessonId, inputMessage, conversationHistory);

      const aiMessage: ChatMessage = {
        role: "assistant",
        content: response.data.response,
        timestamp: response.data.timestamp,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setMessageCount(response.data.messageCount);
    } catch (error: any) {
      console.error("Chatbot error:", error);

      if (error.response?.status === 429) {
        const errorMessage: ChatMessage = {
          role: "assistant",
          content: "You have reached your 15-message limit for this lesson. 📚",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } else {
        const errorMessage: ChatMessage = {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="fixed right-6 bottom-6 z-50 bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white p-4 rounded-full shadow-2xl hover:shadow-[#7A9D96]/50 transition-all duration-300 hover:scale-110 group">
        <div className="relative">
          <Bot className="w-7 h-7" />
          <Sparkles className="w-4 h-4 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
        </div>
        <div className="absolute -top-12 right-0 bg-[#2C2C2C] text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Ask AI Tutor ✨</div>
      </button>
    );
  }

  return (
    <div className="fixed right-6 bottom-6 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border-2 border-[#7A9D96]/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div>
            <h3 className="font-bold text-sm">AI Tutor</h3>
            <p className="text-xs text-white/80">Always here to help</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {usageLoading ? (
            <div className="bg-white/20 text-xs px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm">
              <Loader2 className="w-3 h-3 animate-spin" />
            </div>
          ) : (
            <div className="bg-white/20 text-xs px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm">
              {messageCount}/{MESSAGE_LIMIT}
            </div>
          )}
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#7A9D96]/5 to-[#6A8D86]/5">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}>
            <div className={`flex items-start space-x-2 max-w-[85%]`}>
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] rounded-full flex items-center justify-center shadow-md">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              <div className={`rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white rounded-br-none shadow-md" : "bg-white border-2 border-[#E8E8E6] text-[#2C2C2C] rounded-bl-none shadow-sm"}`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-white/70" : "text-[#6B6B6B]"}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {msg.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-[#2C2C2C] to-[#1A1A1A] rounded-full flex items-center justify-center shadow-md">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-fadeIn">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-[#7A9D96] to-[#6A8D86] rounded-full flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white border-2 border-[#E8E8E6] rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 text-[#7A9D96] animate-spin" />
                  <span className="text-sm text-[#6B6B6B]">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Limit Warning */}
      {messageCount >= MESSAGE_LIMIT && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-t-2 border-orange-200 px-4 py-2.5">
          <p className="text-xs text-orange-800 font-semibold text-center flex items-center justify-center space-x-1">
            <span>⚠️</span>
            <span>You've reached your 15-message limit for this lesson</span>
          </p>
        </div>
      )}

      {/* Input */}
      <div className="border-t-2 border-[#E8E8E6] p-4 bg-white">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={messageCount >= MESSAGE_LIMIT || isLoading}
            placeholder={messageCount >= MESSAGE_LIMIT ? "Message limit reached" : "Ask me anything..."}
            className="flex-1 border-2 border-[#E8E8E6] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A9D96] focus:border-transparent disabled:bg-[#FAFAF8] disabled:cursor-not-allowed transition-all"
          />
          <button onClick={handleSendMessage} disabled={!inputMessage.trim() || messageCount >= MESSAGE_LIMIT || isLoading} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white p-3 rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95">
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-[#6B6B6B] mt-2 text-center">AI responses may not always be accurate. Use for learning guidance only.</p>
      </div>
    </div>
  );
}

export default LessonChatbot;
