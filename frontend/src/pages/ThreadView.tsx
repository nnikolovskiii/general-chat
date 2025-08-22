import React, { useState, useEffect } from 'react';
import { fetchThreadMessages, type BackendMessage } from '../lib/api';
import ThreadMessagesContainer from '../components/ThreadMessagesContainer';
import type { Message } from '../components/ChatView';
import './ThreadView.css';

// Helper to convert backend messages to our frontend Message format
const convertBackendMessages = (messages: BackendMessage[]): Message[] => {
  return messages
    .filter(msg => msg.type === 'human' || msg.type === 'ai') // Ignore system messages for display
    .map((msg, index) => ({
      id: `msg_${index}_${Date.now()}`,
      type: msg.type as 'human' | 'ai',
      content: msg.content,
      audioUrl: msg.additional_kwargs?.file_url,
      additional_kwargs: msg.additional_kwargs, // Pass through all additional_kwargs
      timestamp: new Date() // Ideally, the backend would provide a timestamp
    }));
};

const ThreadView: React.FC = () => {
  const [threadId, setThreadId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const handleFetchMessages = async () => {
    if (!threadId.trim()) {
      setError('Please enter a thread ID');
      return;
    }

    setLoading(true);
    setError(null);
    setMessages([]);

    try {
      const backendMessages = await fetchThreadMessages(threadId.trim());
      console.log(backendMessages)
      const convertedMessages = convertBackendMessages(backendMessages);
      setMessages(convertedMessages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Could not fetch messages.';
      console.error('Error fetching messages for thread:', errorMessage);
      setError(`Failed to load messages: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFetchMessages();
    }
  };

  return (
    <div className="thread-view">
      <div className="thread-view-header">
        <h2>Thread Messages Viewer</h2>
        <p>Enter a thread ID to fetch and display all messages</p>
      </div>

      <div className="thread-input-container">
        <div className="thread-input-wrapper">
          <input
            type="text"
            value={threadId}
            onChange={(e) => setThreadId(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter thread ID..."
            className="thread-input"
            disabled={loading}
          />
          <button
            onClick={handleFetchMessages}
            disabled={loading || !threadId.trim()}
            className="thread-fetch-button"
          >
            {loading ? 'Fetching...' : 'Fetch Messages'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{error}</span>
            <button className="error-dismiss" onClick={() => setError(null)}>×</button>
          </div>
        </div>
      )}

      <div className="thread-messages-container">
        {messages.length > 0 ? (
          <ThreadMessagesContainer messages={messages} isTyping={isTyping} />
        ) : (
          <div className="empty-state">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading messages...</p>
              </div>
            ) : (
              <div className="no-messages">
                <p>No messages to display. Enter a thread ID and click "Fetch Messages".</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadView;
