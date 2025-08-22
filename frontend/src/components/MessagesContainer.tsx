// Path: frontend/src/components/MessagesContainer.tsx

import React, { useEffect, useRef, useState } from 'react';
import type { Message } from './ChatView';
import AudioPlayer from './AudioPlayer';
import MessageToggle from './MessageToggle';

interface MessagesContainerProps {
  messages: Message[];
  isTyping: boolean;
}

// --- START OF REFACTORED CODE ---

const MessagesContainer: React.FC<MessagesContainerProps> = ({ messages, isTyping }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showAudioStates, setShowAudioStates] = useState<Record<string, boolean>>({});

  // Auto-scroll to bottom when new messages are added or typing indicator appears
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Initialize showAudio states for new messages
  useEffect(() => {
    const newStates: Record<string, boolean> = {};
    messages.forEach(message => {
      if (message.content && message.audioUrl) {
        // Only initialize if not already set
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

  const getMessageTypeIcon = (message: Message) => {
    if (message.type === 'human') {
      // If there's an audio URL, it was a voice message.
      return message.audioUrl ? '🎤' : '👤';
    }
    return '🤖';
  };

  const getMessageTypeLabel = (message: Message) => {
    if (message.type === 'human') {
      return message.audioUrl ? 'User Input (Voice)' : 'User Input (Text)';
    }
    return 'AI Assistant';
  };

  return (
      <div className="messages-container" ref={containerRef}>
        {messages.map(message => (
            <div key={message.id} className={`message ${message.type === 'human' ? 'user' : 'ai'}`}>
              <div className="message-type">
                {getMessageTypeIcon(message)} {getMessageTypeLabel(message)}
              </div>
              <div className="message-content">
                {/* Show toggle button only if message has both text and audio */}
                <MessageToggle
                  showAudio={showAudioStates[message.id] || false}
                  onToggle={() => toggleMessageView(message.id)}
                  hasText={!!message.content}
                  hasAudio={!!message.audioUrl}
                />

                {/* The backend provides the enhanced transcript in the content field */}
                {message.content && !(message.audioUrl && showAudioStates[message.id]) && (
                  <div className="text-content">{message.content}</div>
                )}

                {/* Debug log for audioUrl */}
                {message.audioUrl && !(message.content && !showAudioStates[message.id]) && (
                  <div style={{ fontSize: '10px', color: 'gray', marginBottom: '5px' }}>
                    Debug: audioUrl = {message.audioUrl}
                  </div>
                )}

                {/* If an audioUrl exists, display the audio player to replay the original audio */}
                {message.audioUrl && (!message.content || showAudioStates[message.id]) && (
                    <div className="audio-content">
                      <AudioPlayer audioUrl={message.audioUrl} />
                    </div>
                )}
              </div>
            </div>
        ))}

        {isTyping && (
            <div className="typing-indicator">
              <div className="typing-dots">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
              AI is thinking...
            </div>
        )}
      </div>
  );
};

export default MessagesContainer;
// --- END OF REFACTORED CODE ---
