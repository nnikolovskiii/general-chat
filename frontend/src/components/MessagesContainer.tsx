// Path: frontend/src/components/MessagesContainer.tsx

import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown'; // <-- Import the library
import type { Message } from './ChatView';
import AudioPlayer from './AudioPlayer';
import MessageToggle from './MessageToggle';
import { Bot } from 'lucide-react';

interface MessagesContainerProps {
  messages: Message[];
  isTyping: boolean;
}

const MessagesContainer: React.FC<MessagesContainerProps> = ({ messages, isTyping }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showAudioStates, setShowAudioStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const newStates: Record<string, boolean> = {};
    messages.forEach(message => {
      if (message.content && message.audioUrl) {
        if (!(message.id in showAudioStates)) {
          newStates[message.id] = false;
        }
      }
    });
    
    if (Object.keys(newStates).length > 0) {
      setShowAudioStates(prev => ({ ...prev, ...newStates }));
    }
  }, [messages, showAudioStates]);

  const toggleMessageView = (messageId: string) => {
    setShowAudioStates(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const MessageBody: React.FC<{ message: Message }> = ({ message }) => {
    const showAudio = showAudioStates[message.id] || false;
    
    return (
      <div className="message-content">
        <MessageToggle
          showAudio={showAudio}
          onToggle={() => toggleMessageView(message.id)}
          hasText={!!message.content}
          hasAudio={!!message.audioUrl}
        />

        {message.content && !(message.audioUrl && showAudio) && (
          // Use ReactMarkdown to render the text content
          <div className="text-content">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        
        {message.audioUrl && (!message.content || showAudio) && (
            <div className="audio-content">
              <AudioPlayer audioUrl={message.audioUrl} />
            </div>
        )}
      </div>
    );
  };

  return (
      <div className="messages-container" ref={containerRef}>
        <div className="messages-list">
          {messages.map(message => (
            <div key={message.id} className={`message ${message.type === 'human' ? 'user' : 'ai'}`}>
              {message.type === 'human' ? (
                <div className="message-bubble">
                  <MessageBody message={message} />
                </div>
              ) : (
                <>
                  <div className="ai-message-header">
                    <Bot size={16} />
                    <span>AI Assistant</span>
                  </div>
                  <div className="message-bubble">
                    <MessageBody message={message} />
                  </div>
                </>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="typing-indicator">
              <Bot size={16} />
              <div className="dots">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
              <span>AI is thinking...</span>
            </div>
          )}
        </div>
      </div>
  );
};

export default MessagesContainer;
