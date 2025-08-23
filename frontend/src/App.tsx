// Path: accountant-ui/src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import FileUploadDashboard from './pages/FileUploadDashboard'
import CodesView from './pages/CodesView.tsx'
import Chat from './pages/Chat'
import Login from './pages/Login'
import Register from './pages/Register'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'

// Main App component wrapped with AuthProvider
function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/chat-demo" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat-demo" element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } />

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

        {/* Redirect any unknown routes to chat-demo */}
        <Route path="*" element={<Navigate to="/chat-demo" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
