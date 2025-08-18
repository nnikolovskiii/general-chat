import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(identifier, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.body}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.appMenu}>
            {[...Array(9)].map((_, i) => (
              <div key={i} style={i === 0 ? { ...styles.appMenuDot, ...styles.activeAppMenuDot } : styles.appMenuDot}></div>
            ))}
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>AC</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>Accountant</div>
              <div style={{ fontSize: '12px', color: '#a0aec0' }}>Login</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarSection}>
          <Link to="/" style={styles.sidebarItem}>
            <div style={styles.sidebarItemIcon}>🏠</div>
            Home
          </Link>
        </div>
        <div style={styles.sidebarSection}>
          <div style={styles.sidebarHeader}>
            <div style={styles.sidebarTitle}>Authentication</div>
          </div>
          <a href="#" style={{ ...styles.sidebarItem, ...styles.activeSidebarItem }}>
            <div style={styles.sidebarItemIcon}>🔑</div>
            Login
          </a>
          <Link to="/register" style={styles.sidebarItem}>
            <div style={styles.sidebarItemIcon}>📝</div>
            Register
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Login</h1>
          <p style={styles.pageSubtitle}>Sign in to your account</p>
        </div>

        <div style={styles.loginSection}>
          {error && (
            <div style={styles.errorMessage}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} style={styles.loginForm}>
            <div style={styles.formGroup}>
              <label htmlFor="identifier" style={styles.label}>Email or Username</label>
              <input
                type="text"
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={styles.input}
                required
                placeholder="Enter your email or username"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label htmlFor="password" style={styles.label}>Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
                placeholder="Enter your password"
              />
            </div>
            
            <button 
              type="submit" 
              style={isLoading ? { ...styles.loginButton, ...styles.loginButtonDisabled } : styles.loginButton}
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
            
            <div style={styles.registerLink}>
              Don't have an account? <Link to="/register">Register</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Styles similar to FileUploadDashboard
const styles: { [key: string]: React.CSSProperties } = {
  body: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#f8fafc',
    color: '#2d3748',
    height: '100vh',
    overflow: 'hidden',
  },
  header: {
    background: '#1a202c',
    color: 'white',
    padding: '0 24px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  appMenu: {
    width: '24px',
    height: '24px',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2px',
  },
  appMenuDot: {
    width: '6px',
    height: '6px',
    background: '#4a5568',
    borderRadius: '50%',
  },
  activeAppMenuDot: {
    background: '#48bb78',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 600,
    fontSize: '14px',
  },
  sidebar: {
    width: '280px',
    background: 'white',
    borderRight: '1px solid #e2e8f0',
    position: 'fixed',
    top: '64px',
    bottom: 0,
    left: 0,
    overflowY: 'auto',
    padding: '24px 0',
  },
  sidebarSection: {
    marginBottom: '32px',
  },
  sidebarItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 24px',
    color: '#4a5568',
    textDecoration: 'none',
    fontSize: '14px',
    borderLeft: '3px solid transparent',
    transition: 'all 0.2s ease',
  },
  activeSidebarItem: {
    background: '#edf2f7',
    color: '#2d3748',
    borderLeftColor: '#4299e1',
  },
  sidebarItemIcon: {
    width: '20px',
    height: '20px',
    marginRight: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    marginBottom: '12px',
  },
  sidebarTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#2d3748',
  },
  mainContent: {
    marginLeft: '280px',
    marginTop: '64px',
    padding: '32px',
    height: 'calc(100vh - 64px)',
    overflowY: 'auto',
  },
  pageHeader: {
    marginBottom: '32px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#2d3748',
    marginBottom: '8px',
  },
  pageSubtitle: {
    color: '#718096',
    fontSize: '16px',
  },
  loginSection: {
    background: 'white',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    maxWidth: '500px',
    margin: '0 auto',
  },
  loginForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#4a5568',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '16px',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  loginButton: {
    background: '#4299e1',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '10px',
  },
  loginButtonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  registerLink: {
    textAlign: 'center',
    marginTop: '16px',
    fontSize: '14px',
    color: '#718096',
  },
  errorMessage: {
    background: '#fed7d7',
    color: '#e53e3e',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
  },
};

export default Login;
