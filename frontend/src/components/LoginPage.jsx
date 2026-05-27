// ==========================================
// LoginPage Component
// Clean, professional login page for Arshi GPS staff
// ==========================================

import { useState } from 'react';
import { loginUser } from '../api';

function LoginPage({ onLogin }) {
  // State hooks for form inputs and UI states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);

    try {
      // Call the login API
      const response = await loginUser({ username: username.trim(), password });

      if (response.data.success) {
        // Save token and redirect to dashboard
        localStorage.setItem('arshi-token', response.data.token);
        onLogin(response.data.user);
      }
    } catch (err) {
      // Show error message from server or a default message
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Company Logo Area */}
        <div className="login-logo">
          <div className="login-logo-icon">📡</div>
          <h1>Arshi GPS</h1>
          <p>Vehicle Entry Management System</p>
        </div>

        {/* Error Alert */}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Login Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            id="login-button"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
