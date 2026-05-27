// ==========================================
// App.jsx - Main App Component
// Handles routing between Login and Dashboard
// ==========================================

import { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import './index.css';

function App() {
  // State to track if user is logged in
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // On app load, check if a session token already exists in localStorage
  useEffect(() => {
    const token = localStorage.getItem('arshi-token');
    if (token) {
      // Restore session (demo: just set a user object)
      setUser({ username: 'arshigps' });
    }
    setCheckingAuth(false);
  }, []);

  // Called after successful login
  const handleLogin = (userData) => {
    setUser(userData);
  };

  // Called on logout
  const handleLogout = () => {
    setUser(null);
  };

  // Show nothing while checking auth to avoid flash
  if (checkingAuth) {
    return null;
  }

  // Render login or dashboard based on auth state
  return user ? (
    <Dashboard user={user} onLogout={handleLogout} />
  ) : (
    <LoginPage onLogin={handleLogin} />
  );
}

export default App;
