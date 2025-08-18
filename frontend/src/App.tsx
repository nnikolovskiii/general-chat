// Path: accountant-ui/src/App.tsx
import { Routes, Route, Link, Navigate } from 'react-router-dom'
import './App.css'
import FileUploadDashboard from './pages/FileUploadDashboard'
import CodesView from './pages/CodesView.tsx'
import Chat from './pages/Chat'
import Login from './pages/Login'
import Register from './pages/Register'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'

// Home component with authentication check
const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="app-container">
      <h1>Welcome to Accountant UI</h1>
      {isAuthenticated ? (
        <div>
          <p>Hello, {user?.full_name || 'User'}!</p>
          <nav>
            <ul>
              <li>
                <Link to="/upload_files">Go to File Upload Dashboard</Link>
              </li>
            </ul>
          </nav>
        </div>
      ) : (
        <div>
          <p>Please log in to access the application.</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <Link to="/login" className="login-button">Login</Link>
            <Link to="/register" className="login-button" style={{ backgroundColor: '#48bb78' }}>Register</Link>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App component wrapped with AuthProvider
function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat-demo" element={<Chat />} />

        {/* Protected routes with Dashboard Layout */}
        <Route 
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/upload_files" element={<FileUploadDashboard />} />
          <Route path="/files" element={<CodesView />} />
          <Route path="/chat" element={<Chat />} />
          {/* Add other dashboard routes here in the future */}
        </Route>

        {/* Redirect any unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
