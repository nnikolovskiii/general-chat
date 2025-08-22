// Path: frontend/src/components/MessagesContainer.tsx

import React, { useEffect, useRef, useState } from 'react';
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
          newStates[message.id] = false; // Default to show text
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

  return (
      <div className="messages-container" ref={containerRef}>
        <div className="messages-list">
          {messages.map(message => (
            <div key={message.id} className={`message ${message.type === 'human' ? 'user' : 'ai'}`}>
              {message.type === 'human' ? (
                <div className="message-bubble">
                  <div className="message-content">{message.content}</div>
                </div>
              ) : (
                <>
                  <div className="ai-message-header">
                    <Bot size={16} />
                    <span>Thought for 43s</span> {/* Placeholder */}
                  </div>
                  <div className="message-bubble">
                    <div className="message-content">
                      <MessageToggle
                        showAudio={showAudioStates[message.id] || false}
                        onToggle={() => toggleMessageView(message.id)}
                        hasText={!!message.content}
                        hasAudio={!!message.audioUrl}
                      />

                      {message.content && !(message.audioUrl && showAudioStates[message.id]) && (
                        <div className="text-content">{message.content}</div>
                      )}
                      
                      {message.audioUrl && (!message.content || showAudioStates[message.id]) && (
                          <div className="audio-content">
                            <AudioPlayer audioUrl={message.audioUrl} />
                          </div>
                      )}
                    </div>
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