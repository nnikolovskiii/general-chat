import React, { useEffect, useRef } from 'react';
import type { Message } from './ChatView';
import AudioPlayer from './AudioPlayer';

interface MessagesContainerProps {
  messages: Message[];
  isTyping: boolean;
}

const MessagesContainer: React.FC<MessagesContainerProps> = ({ messages, isTyping }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const getMessageTypeIcon = (message: Message) => {
    if (message.type === 'human') {
      return message.inputType === 'voice' ? '🎤' : '💬';
    }
    return '🤖';
  };

  const getMessageTypeLabel = (message: Message) => {
    if (message.type === 'human') {
      return message.inputType === 'voice' ? 'Voice Message' : 'Text Message';
    }
    return 'AI Assistant';
  };

  const getMessageClass = (message: Message) => {
    // Map 'human' to 'user' for CSS compatibility
    return message.type === 'human' ? 'user' : message.type;
  };

  return (
    <div className="messages-container" ref={containerRef}>
      {messages.map(message => (
        <div key={message.id} className={`message ${getMessageClass(message)}`}>
          <div className="message-type">
            {getMessageTypeIcon(message)} {getMessageTypeLabel(message)}
          </div>
          <div className="message-content">
            {message.content && <div className="text-content">{message.content}</div>}
            {message.inputType === 'voice' && message.audioUrl && (
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
          AI is typing...
        </div>
      )}
    </div>
  );
};

export default MessagesContainer;
