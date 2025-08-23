import React, { useState, useEffect } from 'react';
import './ChatSidebar.css';
import type { ChatSession } from './ChatView';
import { BotMessageSquare, ChevronLeft, History, Plus, X } from 'lucide-react';

interface ChatSidebarProps {
  chatSessions: ChatSession[];
  currentChatId: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCreateNewChat: () => void;
  onSwitchChat: (chatId: string) => void;
  loading?: boolean;
  creatingChat?: boolean;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chatSessions,
  currentChatId,
  collapsed,
  onToggleCollapse,
  onCreateNewChat,
  onSwitchChat,
  loading,
  creatingChat,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <aside className={`chat-sidebar ${collapsed ? 'collapsed' : ''} ${!collapsed && isMobile ? 'mobile-visible' : ''}`}>
        <div className="sidebar-content">

            <header className="sidebar-header">
                <div className="sidebar-logo">
                    <BotMessageSquare size={24} />
                    <span>AI Assistant</span>
                </div>
                {isMobile ? (
                    <button className="mobile-close-btn" onClick={onToggleCollapse} title="Close sidebar">
                        <X size={20} />
                    </button>
                ) : (
                    <button className="collapse-btn" onClick={onToggleCollapse} title="Collapse sidebar">
                        <ChevronLeft size={18} />
                    </button>
                )}
            </header>

  
            {/* <nav className="sidebar-nav">
                {navItems.map(item => (
                    <a href="#" key={item.label} className={`nav-item ${item.active ? 'active' : ''}`}>
                        {item.icon}
                        <span>{item.label}</span>
                    </a>
                ))}
            </nav> */}

            <section className="history-section">
                <div className="history-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <History size={16} />
                        <span>History</span>
                    </div>
                    <button className="new-chat-btn" onClick={onCreateNewChat} disabled={creatingChat} title="New Chat">
                        {creatingChat ? <div className="loading-spinner" style={{width: 16, height: 16}}></div> : <Plus size={16} />}
                    </button>
                </div>
                <div className="chat-sessions">
                    {loading ? (
                        <div className="loading-state">
                            <div className="loading-spinner"></div>
                            <div>Loading chats...</div>
                        </div>
                    ) : chatSessions.length === 0 ? (
                        <div className="empty-state">
                            No chat sessions yet.
                        </div>
                    ) : (
                        chatSessions.map(chat => (
                            <div
                                key={chat.id}
                                className={`chat-session ${chat.id === currentChatId ? 'active' : ''}`}
                                onClick={() => onSwitchChat(chat.id)}
                            >
                                <div className="chat-title">{chat.title || `Chat ${chat.id.slice(0, 8)}`}</div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    </aside>
  );
};

export default ChatSidebar;
