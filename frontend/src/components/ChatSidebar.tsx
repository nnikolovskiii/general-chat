import React from 'react';
import './ChatSidebar.css';
import type { ChatSession } from './ChatView';

interface ChatSidebarProps {
  chatSessions: ChatSession[];
  currentChatId: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCreateNewChat: () => void;
  onSwitchChat: (chatId: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chatSessions,
  currentChatId,
  collapsed,
  onToggleCollapse,
  onCreateNewChat,
  onSwitchChat
}) => {
  return (
    <div className={`chat-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <button 
        className="collapse-btn" 
        onClick={onToggleCollapse}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? '›' : '‹'}
      </button>
      
      <button className="new-chat-btn" onClick={onCreateNewChat}>
        <span>✨ New Chat Session</span>
        {collapsed && '✨'}
      </button>
      
      <div className="chat-sessions">
        {chatSessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <div className="empty-state-text">
              No chat sessions yet.<br />
              Create your first chat to get started!
            </div>
          </div>
        ) : (
          chatSessions.map(chat => {
            const lastMessage = chat.messages && chat.messages.length > 0 
              ? chat.messages[chat.messages.length - 1]
              : null;
            const preview = lastMessage 
              ? lastMessage.content.substring(0, 50) + (lastMessage.content.length > 50 ? '...' : '')
              : 'No messages yet';
            
            return (
              <div
                key={chat.id}
                className={`chat-session ${chat.id === currentChatId ? 'active' : ''}`}
                onClick={() => onSwitchChat(chat.id)}
              >
                <div className="chat-title">{chat.title || `Chat ${chat.id.slice(0, 8)}`}</div>
                <div className="chat-preview">{preview}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
