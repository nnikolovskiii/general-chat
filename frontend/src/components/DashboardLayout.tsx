// Path: accountant-ui/src/components/DashboardLayout.tsx
import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './DashboardLayout.css';

const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
};

const Header: React.FC = () => {
    const { user } = useAuth();
    return (
        <div className="header">
            <div className="header-left">
                <div className="app-menu">
                    <div className="app-menu-dot active"></div><div className="app-menu-dot"></div><div className="app-menu-dot"></div>
                    <div className="app-menu-dot"></div><div className="app-menu-dot"></div><div className="app-menu-dot"></div>
                    <div className="app-menu-dot"></div><div className="app-menu-dot"></div><div className="app-menu-dot"></div>
                </div>
            </div>
            <div className="header-right">
                <div className="user-info">
                    <div className="user-avatar">{getInitials(user?.full_name)}</div>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{user?.full_name}</div>
                        <div style={{ fontSize: 12, color: '#a0aec0' }}>Personal</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Sidebar: React.FC<{ isCollapsed: boolean; toggleCollapse: () => void }> = ({ isCollapsed, toggleCollapse }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <button className="sidebar-toggle" onClick={toggleCollapse}>
                {isCollapsed ? '→' : '←'}
            </button>


            <div className="sidebar-section">
                <div className="sidebar-header">
                    <div className="sidebar-title">{!isCollapsed && 'File Management'}</div>
                </div>
                <Link to="/upload_files" className={`sidebar-item ${location.pathname === '/upload_files' ? 'active' : ''}`}>
                    <div className="sidebar-item-icon">📤</div>
                    {!isCollapsed && 'Upload Files'}
                </Link>
                <Link to="/files" className={`sidebar-item ${location.pathname === '/files' ? 'active' : ''}`}>
                    <div className="sidebar-item-icon">📊</div>
                    {!isCollapsed && 'View Files'}
                </Link>
            </div>

            <div className="sidebar-section">
                <div className="sidebar-header">
                    <div className="sidebar-title">{!isCollapsed && 'Communication'}</div>
                </div>
                <Link to="/chat" className={`sidebar-item ${location.pathname === '/chat' ? 'active' : ''}`}>
                    <div className="sidebar-item-icon">💬</div>
                    {!isCollapsed && 'Voice & Text Chat'}
                </Link>
            </div>

            <div className="sidebar-section">
                <div className="sidebar-header">
                    <div className="sidebar-title">{!isCollapsed && 'Profile'}</div>
                </div>
                <div className="sidebar-item">
                    <div className="sidebar-item-icon">👤</div>
                    {!isCollapsed && user?.email}
                </div>
                <a href="#" onClick={(e) => { e.preventDefault(); logout(); }} className="sidebar-item">
                    <div className="sidebar-item-icon">🚪</div>
                    {!isCollapsed && 'Logout'}
                </a>
            </div>
        </div>
    );
};

const DashboardLayout: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div>
            <Header />
            <Sidebar isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
            <main className={`main-content ${isCollapsed ? 'expanded' : ''}`}>
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
