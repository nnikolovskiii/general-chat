import React from 'react';
import { Menu } from 'lucide-react';

interface ChatHeaderProps {
  title: string;
  isMobile: boolean;
  onMenuClick: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ title, isMobile, onMenuClick }) => {
  return (
    <div className="chat-header">
      <div className="chat-header-content">
        {isMobile && (
          <button className="menu-button" onClick={onMenuClick}>
            <Menu size={20} />
          </button>
        )}
        <h1>{title}</h1>
      </div>
      <div className="header-actions">
        {/* Placeholder for future actions like edit, share, etc. */}
      </div>
    </div>
  );
};

export default ChatHeader;