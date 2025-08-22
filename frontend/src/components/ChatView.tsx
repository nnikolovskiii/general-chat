// Path: frontend/src/components/ChatView.tsx

import React, { useState, useEffect, useCallback } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatHeader from './ChatHeader';
import MessagesContainer from './MessagesContainer';
import InputArea from './InputArea';
import './ChatView.css';
import { getChatsUrl, fetchThreadMessages, sendMessageToThread, createNewThread, type BackendMessage } from '../lib/api';

// A cleaner, frontend-specific interface for a message object.
export interface Message {
  id: string;
  type: 'human' | 'ai';
  content: string;
  audioUrl?: string; // Holds the file_url for audio files
  additional_kwargs?: { [key: string]: any }; // Additional metadata from backend
  timestamp: Date;
}

export interface ChatSession {
  id: string; // This is the chat_id
  title: string;
  thread_id: string;
  messages: Message[];
  createdAt: Date;
}

// Type from the backend for the list of chats
export interface BackendChat {
  chat_id: string;
  user_id: string;
  thread_id: string;
  created_at: string;
  updated_at: string;
}

// Helper to convert backend messages to our frontend Message format
const convertBackendMessages = (messages: BackendMessage[]): Message[] => {
  return messages
      .filter(msg => msg.type === 'human' || msg.type === 'ai') // Ignore system messages for display
      .map((msg, index) => ({
        id: `msg_${index}_${Date.now()}`,
        type: msg.type as 'human' | 'ai',
        content: msg.content,
        audioUrl: msg.additional_kwargs?.file_url,
        additional_kwargs: msg.additional_kwargs, // Preserve additional_kwargs
        timestamp: new Date() // Ideally, the backend would provide a timestamp
      }));
};

const ChatView: React.FC = () => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth <= 768);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [creatingChat, setCreatingChat] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized fetch function for messages to avoid re-renders
  const fetchMessagesForCurrentChat = useCallback(async () => {
    const currentChat = chatSessions.find(chat => chat.id === currentChatId);
    if (!currentChat || !currentChat.thread_id) return;

    // Prevents showing stale messages from another chat
    setChatSessions(prev => prev.map(chat =>
        chat.id === currentChatId ? { ...chat, messages: [] } : chat
    ));

    try {
      const backendMessages = await fetchThreadMessages(currentChat.thread_id);

      // --- ADDED CONSOLE LOG ---
      console.log("--- Fetched Backend Messages for Thread:", currentChat.thread_id, "---");
      console.log(JSON.stringify(backendMessages, null, 2));
      // --- END OF ADDED CONSOLE LOG ---

      const convertedMessages = convertBackendMessages(backendMessages);

      // --- DEBUG LOG ---
      console.log("--- Converted Messages ---");
      convertedMessages.forEach((msg, index) => {
        console.log(`Message ${index}:`, {
          id: msg.id,
          type: msg.type,
          content: msg.content,
          audioUrl: msg.audioUrl,
          additional_kwargs: msg.additional_kwargs
        });
      });
      // --- END DEBUG LOG ---

      setChatSessions(prev => prev.map(chat =>
          chat.id === currentChatId
              ? { ...chat, messages: convertedMessages }
              : chat
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Could not fetch messages.';
      console.error('Error fetching messages for thread:', errorMessage);
      setError(`Failed to load messages for this chat. ${errorMessage}`);
    }
  }, [currentChatId, chatSessions]);


  // Effect to fetch chats on initial component mount
  useEffect(() => {
    const fetchInitialChats = async () => {
      setLoadingChats(true);
      try {
        const response = await fetch(getChatsUrl('/get-all'), {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to fetch chat history.');

        const backendChats: BackendChat[] = await response.json();

        if (backendChats.length > 0) {
          const convertedChats: ChatSession[] = backendChats.map(chat => ({
            id: chat.chat_id,
            thread_id: chat.thread_id,
            title: `Chat ${chat.chat_id.substring(0, 8)}`,
            messages: [],
            createdAt: new Date(chat.created_at)
          })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort newest first

          setChatSessions(convertedChats);
          setCurrentChatId(convertedChats[0].id);
        } else {
          // If the user has no chats, create a new one automatically.
          await createNewChat();
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        console.error('Error fetching chats:', errorMessage);
        setError(`Could not load chat history. ${errorMessage}`);
        // As a fallback, create a local-only chat session.
        await createNewChat();
      } finally {
        setLoadingChats(false);
      }
    };

    fetchInitialChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to fetch messages when the current chat changes
  useEffect(() => {
    if (currentChatId) {
      fetchMessagesForCurrentChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChatId]);


  const createNewChat = async () => {
    setCreatingChat(true);
    setError(null);
    try {
      const newThreadData = await createNewThread(`New Chat`);
      const newChat: ChatSession = {
        id: newThreadData.chat_id,
        thread_id: newThreadData.thread_id,
        title: newThreadData.title,
        messages: [{
          id: 'msg_welcome_' + Date.now(),
          type: 'ai',
          content: "Hello! How can I assist you today?",
          timestamp: new Date()
        }],
        createdAt: new Date(newThreadData.created_at)
      };

      setChatSessions(prev => [newChat, ...prev]); // Add to the top of the list
      setCurrentChatId(newChat.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create new chat.';
      console.error('Error creating new chat:', errorMessage);
      setError(errorMessage);
    } finally {
      setCreatingChat(false);
    }
  };

  const switchToChat = (chatId: string) => {
    setCurrentChatId(chatId);
    if (window.innerWidth <= 768) {
      setSidebarCollapsed(true);
    }
  };

  // Optimistically adds a message to the UI while the backend processes it.
  const addOptimisticMessage = (content: string, audioUrl?: string) => {
    if (!currentChatId) return;

    const optimisticMessage: Message = {
      id: 'msg_optimistic_' + Date.now(),
      type: 'human',
      content,
      audioUrl,
      timestamp: new Date()
    };

    setChatSessions(prev => prev.map(chat =>
        chat.id === currentChatId
            ? { ...chat, messages: [...chat.messages, optimisticMessage] }
            : chat
    ));
  };

  const handleSendMessage = async (text?: string, audioPath?: string) => {
    const currentChat = chatSessions.find(chat => chat.id === currentChatId);
    if (!currentChat || !currentChat.thread_id) {
      setError("No active chat session selected.");
      return;
    }

    // Don't send if both text and audio are empty.
    if (!text?.trim() && !audioPath) return;

    setIsTyping(true);

    // Add optimistic message to UI immediately.
    const optimisticText = text || "Audio message sent...";
    addOptimisticMessage(optimisticText, audioPath);

    try {
      await sendMessageToThread(currentChat.thread_id, text, audioPath);
      // After sending, wait a moment then refresh the message history from the backend
      // to get the true state.
      setTimeout(async () => {
        await fetchMessagesForCurrentChat();
        setIsTyping(false);
      }, 2000); // 2-second delay to allow backend processing time
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error('Error sending message:', errorMessage);
      setError(`Failed to send message: ${errorMessage}`);
      setIsTyping(false);
      // Optionally, remove the optimistic message on failure or show an error state.
    }
  };

  const currentChat = chatSessions.find(chat => chat.id === currentChatId);

  return (
      <div className={`chat-view ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {error && (
            <div className="error-banner">
              <div className="error-content">
                <span className="error-icon">⚠️</span>
                <span className="error-message">{error}</span>
                <button className="error-dismiss" onClick={() => setError(null)}>×</button>
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
            loading={loadingChats}
            creatingChat={creatingChat}
        />

        <div className="main-chat">
          <ChatHeader title={currentChat?.title || 'Chat'} />
          <MessagesContainer messages={currentChat?.messages || []} isTyping={isTyping} />
          <InputArea onSendMessage={handleSendMessage} disabled={creatingChat || isTyping} />
        </div>
      </div>
  );
};

export default ChatView;
