import React, { useState, useEffect } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatHeader from './ChatHeader';
import MessagesContainer from './MessagesContainer';
import InputArea from './InputArea';
import './ChatView.css';

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  inputType?: 'voice' | 'text';
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

const ChatView: React.FC = () => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Initialize with first chat session
  useEffect(() => {
    createNewChat();
  }, []);

  const createNewChat = () => {
    const chatId = 'chat_' + Date.now();
    const newChat: ChatSession = {
      id: chatId,
      title: `Chat ${chatSessions.length + 1}`,
      messages: [{
        id: 'msg_' + Date.now(),
        type: 'ai',
        content: "Hello! I'm ready to chat with you using voice or text. How can I help you today?",
        timestamp: new Date()
      }],
      createdAt: new Date()
    };

    setChatSessions(prev => [...prev, newChat]);
    setCurrentChatId(chatId);
  };

  const switchToChat = (chatId: string) => {
    setCurrentChatId(chatId);
    
    // Auto-collapse sidebar on mobile after selecting a chat
    if (window.innerWidth <= 768 && !sidebarCollapsed) {
      setTimeout(() => {
        setSidebarCollapsed(true);
      }, 300);
    }
  };

  const addMessage = (type: 'user' | 'ai', content: string, inputType?: 'voice' | 'text') => {
    if (!currentChatId) return;

    const message: Message = {
      id: 'msg_' + Date.now(),
      type,
      content,
      inputType,
      timestamp: new Date()
    };

    setChatSessions(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? { ...chat, messages: [...chat.messages, message] }
        : chat
    ));
  };

  const generateAIResponse = (userMessage: string, inputType: 'voice' | 'text') => {
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      const responses = [
        `I understand you ${inputType === 'voice' ? 'said' : 'wrote'}: "${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}". That's really interesting! Tell me more about that.`,
        `Thanks for your ${inputType} message! I'm processing what you shared. In a real implementation, I would provide more contextual and helpful responses.`,
        `I received your ${inputType} input clearly. This demo shows how the system would handle both voice and text interactions seamlessly.`,
        `Great ${inputType} message! I can see this chat system supports multiple input methods effectively. What else would you like to discuss?`,
        `Your ${inputType} input has been processed successfully. In a production environment, this would connect to advanced AI models for more sophisticated responses.`
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      addMessage('ai', randomResponse);
    }, 2000);
  };

  const handleSendMessage = (message: string, inputType: 'voice' | 'text') => {
    addMessage('user', message, inputType);
    generateAIResponse(message, inputType);
  };

  const currentChat = chatSessions.find(chat => chat.id === currentChatId);

  return (
    <div className="chat-view">
      <ChatSidebar
        chatSessions={chatSessions}
        currentChatId={currentChatId}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onCreateNewChat={createNewChat}
        onSwitchChat={switchToChat}
      />
      
      <div className="main-chat">
        <ChatHeader 
          title={currentChat?.title || 'Voice & Text Chat'} 
        />
        
        <MessagesContainer 
          messages={currentChat?.messages || []}
          isTyping={isTyping}
        />
        
        <InputArea 
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
};

export default ChatView;
