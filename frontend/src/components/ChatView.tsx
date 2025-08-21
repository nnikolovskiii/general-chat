import React, { useState, useEffect, useCallback } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatHeader from './ChatHeader';
import MessagesContainer from './MessagesContainer';
import InputArea from './InputArea';
import './ChatView.css';
import { getChatsUrl, fetchThreadMessages, sendMessageToThread, createNewThread } from '../lib/api';

export interface Message {
  id: string;
  type: 'human' | 'ai'; // Updated to match langgraph format
  content: string;
  inputType?: 'voice' | 'text';
  audioUrl?: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  thread_id: string;
  messages: Message[];
  createdAt: Date;
}

export interface BackendChat {
  chat_id: string;
  user_id: string;
  thread_id: string;
  created_at: string;
  updated_at: string;
}

const ChatView: React.FC = () => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch chats from backend when component mounts
  useEffect(() => {
    fetchChats();
  }, []);

  // Fetch messages for current chat when it changes
  useEffect(() => {
    if (currentChatId) {
      fetchMessagesForCurrentChat();
    }
  }, [currentChatId]);

  const fetchChats = async () => {
    setLoading(true);
    try {
      const response = await fetch(getChatsUrl('get-all'), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const backendChats: BackendChat[] = await response.json();
        // Convert backend chats to frontend chat sessions
        const convertedChats: ChatSession[] = backendChats.map(chat => ({
          id: chat.chat_id,
          thread_id: chat.thread_id,
          title: `Chat ${chat.chat_id.substring(0, 8)}`,
          messages: [],
          createdAt: new Date(chat.created_at)
        }));
        
        // Only set chat sessions if we have chats from backend
        if (convertedChats.length > 0) {
          setChatSessions(convertedChats);
          setCurrentChatId(convertedChats[0].id);
        } else {
          // If no chats from backend, create a new chat
          createNewChat();
        }
      } else {
        console.error('Failed to fetch chats:', response.statusText);
        // Create a new chat if fetching fails
        createNewChat();
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      // Create a new chat if fetching fails
      createNewChat();
    } finally {
      setLoading(false);
    }
  };

  const fetchMessagesForCurrentChat = useCallback(async () => {
    if (!currentChatId) return;

    const currentChat = chatSessions.find(chat => chat.id === currentChatId);
    if (!currentChat || !currentChat.thread_id) return;

    try {
      const threadMessages = await fetchThreadMessages(currentChat.thread_id);
      
      // Convert langgraph messages to frontend format
      const convertedMessages: Message[] = threadMessages.map((msg, index) => ({
        id: `msg_${index}_${Date.now()}`,
        type: msg.type === 'human' ? 'human' : 'ai',
        content: msg.content,
        timestamp: new Date()
      }));

      setChatSessions(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, messages: convertedMessages }
          : chat
      ));
    } catch (error) {
      console.error('Error fetching messages for thread:', error);
      // If we can't fetch messages, keep the current messages or set empty array
      setChatSessions(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, messages: [] }
          : chat
      ));
    }
  }, [currentChatId, chatSessions]);

  const createNewChat = async () => {
    setCreatingChat(true);
    setError(null);
    
    try {
      const title = `Chat ${chatSessions.length + 1}`;
      const newThreadData = await createNewThread(title);
      
      const newChat: ChatSession = {
        id: newThreadData.chat_id,
        thread_id: newThreadData.thread_id,
        title: newThreadData.title,
        messages: [{
          id: 'msg_' + Date.now(),
          type: 'ai',
          content: "Hello! I'm ready to chat with you. How can I help you today?",
          timestamp: new Date()
        }],
        createdAt: new Date(newThreadData.created_at)
      };

      setChatSessions(prev => [...prev, newChat]);
      setCurrentChatId(newThreadData.chat_id);
    } catch (error) {
      console.error('Error creating new chat:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create new chat';
      setError(errorMessage);
      
      // Show a more user-friendly error message
      setTimeout(() => {
        setError(null);
      }, 5000);
      
      // Fallback to creating a mock chat if API fails
      const chatId = 'chat_' + Date.now();
      const threadId = 'thread_' + Date.now();
      const newChat: ChatSession = {
        id: chatId,
        thread_id: threadId,
        title: `Chat ${chatSessions.length + 1} (Offline)`,
        messages: [{
          id: 'msg_' + Date.now(),
          type: 'ai',
          content: "I'm having trouble connecting to the chat service. You can still type messages, but they won't be saved. Please try refreshing the page.",
          timestamp: new Date()
        }],
        createdAt: new Date()
      };

      setChatSessions(prev => [...prev, newChat]);
      setCurrentChatId(chatId);
    } finally {
      setCreatingChat(false);
    }
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

  const addMessage = (type: 'human' | 'ai', content: string, inputType?: 'voice' | 'text', audioUrl?: string) => {
    if (!currentChatId) return;

    const message: Message = {
      id: 'msg_' + Date.now(),
      type,
      content,
      inputType,
      audioUrl,
      timestamp: new Date()
    };

    setChatSessions(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? { ...chat, messages: [...chat.messages, message] }
        : chat
    ));
  };

  const sendRealMessage = async (userMessage: string | undefined, inputType: 'voice' | 'text', audioPath?: string) => {
    if (!currentChatId) return;

    const currentChat = chatSessions.find(chat => chat.id === currentChatId);
    if (!currentChat || !currentChat.thread_id) return;

    setIsTyping(true);

    try {
      if (!userMessage){
        addMessage('human', "Sending audio!", inputType, audioPath);
      }else{
      // Add user message immediately
      addMessage('human', userMessage, inputType);
      }

      // Send message to langgraph
      await sendMessageToThread(currentChat.thread_id, userMessage, audioPath);

      // Wait a bit then fetch updated messages
      setTimeout(async () => {
        await fetchMessagesForCurrentChat();
        setIsTyping(false);
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      // Add error message
      addMessage('ai', 'Sorry, there was an error sending your message. Please try again.');
    }
  };

  const handleSendMessage = (inputType: 'voice' | 'text', message?: string, audioPath?: string) => {
    sendRealMessage(message, inputType, audioPath);
  };

  const currentChat = chatSessions.find(chat => chat.id === currentChatId);

  return (
    <div className={`chat-view ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {error && (
        <div className="error-banner">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{error}</span>
            <button 
              className="error-dismiss" 
              onClick={() => setError(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <ChatSidebar
        chatSessions={chatSessions}
        currentChatId={currentChatId}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onCreateNewChat={createNewChat}
        onSwitchChat={switchToChat}
        loading={loading}
        creatingChat={creatingChat}
      />
      
      <div className="main-chat">
        <ChatHeader 
          title={currentChat?.title || 'Chat'} 
        />
        
        <MessagesContainer 
          messages={currentChat?.messages || []}
          isTyping={isTyping}
        />
        
        <InputArea 
          onSendMessage={handleSendMessage}
          disabled={creatingChat}
        />
      </div>
    </div>
  );
};

export default ChatView;
