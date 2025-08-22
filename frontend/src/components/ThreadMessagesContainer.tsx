import React, { useRef } from 'react';
import type { Message } from './ChatView';
import AudioPlayer from './AudioPlayer';

interface ThreadMessagesContainerProps {
  messages: Message[];
  isTyping: boolean;
}

const ThreadMessagesContainer: React.FC<ThreadMessagesContainerProps> = ({ messages, isTyping }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added or typing indicator appears
  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

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

  const formatAdditionalKwargs = (additional_kwargs?: { [key: string]: any }) => {
    if (!additional_kwargs || Object.keys(additional_kwargs).length === 0) {
      return null;
    }

    // Filter out file_url since it's already displayed as audio
    const filteredKwargs = { ...additional_kwargs };
    delete filteredKwargs.file_url;

    if (Object.keys(filteredKwargs).length === 0) {
      return null;
    }

    return (
      <div className="additional-kwargs">
        <div className="kwargs-header">Additional Metadata:</div>
        <pre className="kwargs-content">
          {JSON.stringify(filteredKwargs, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="thread-messages-container" ref={containerRef}>
      {messages.map(message => (
        <div key={message.id} className={`thread-message ${message.type === 'human' ? 'user' : 'ai'}`}>
          <div className="thread-message-type">
            {getMessageTypeIcon(message)} {getMessageTypeLabel(message)}
          </div>
          <div className="thread-message-content">
            {/* The backend provides the enhanced transcript in the content field */}
            {message.content && (
              <div className="thread-text-content">{message.content}</div>
            )}

            {/* If an audioUrl exists, display the audio player to replay the original audio */}
            {message.audioUrl && (
              <div className="thread-audio-content">
                <AudioPlayer audioUrl={message.audioUrl} />
              </div>
            )}

            {/* Display all additional_kwargs */}
            {formatAdditionalKwargs(message.additional_kwargs)}
          </div>
        </div>
      ))}

      {isTyping && (
        <div className="thread-typing-indicator">
          <div className="thread-typing-dots">
            <div className="thread-dot"></div>
            <div className="thread-dot"></div>
            <div className="thread-dot"></div>
          </div>
          AI is thinking...
        </div>
      )}
    </div>
  );
};

export default ThreadMessagesContainer;
