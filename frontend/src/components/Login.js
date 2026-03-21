import React, { useState } from 'react';
import { authAPI } from '../services/api';
import '../styles/Login.css';

const Login = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [loginData, setLoginData] = useState({ loginId: '', password: '', role: 'student' });
  const [registerData, setRegisterData] = useState({
    name: '', email: '', password: '', studentId: '', class: '', rollNo: '', mobile: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await authAPI.login(loginData);
      const { token, user } = response.data;
      onLogin(token, user);
    } catch (error) {
      showMessage(error.response?.data?.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await authAPI.studentRegister(registerData);
      const { token, user } = response.data;
      onLogin(token, user);
    } catch (error) {
      showMessage(error.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getLoginPlaceholder = () => {
    switch (loginData.role) {
      case 'student': return 'Enter your Student ID';
      case 'teacher': return 'Enter your Teacher ID';
      case 'admin': return 'Enter admin email';
      default: return 'Enter your ID';
    }
  };

  const getLoginLabel = () => {
    switch (loginData.role) {
      case 'student': return 'Student ID';
      case 'teacher': return 'Teacher ID';
      case 'admin': return 'Admin Email';
      default: return 'ID';
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🎓 Attendance System</h1>
          <p>Smart location-based attendance tracking</p>
        </div>

        <div className="tab-container">
          <button 
            className={`tab-button ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button 
            className={`tab-button ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            Student Sign Up
          </button>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Login As</label>
              <select
                value={loginData.role}
                onChange={(e) => setLoginData({...loginData, role: e.target.value})}
                required
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label>{getLoginLabel()}</label>
              <input
                type="text"
                value={loginData.loginId}
                onChange={(e) => setLoginData({...loginData, loginId: e.target.value})}
                required
                placeholder={getLoginPlaceholder()}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                required
                placeholder="Enter your password"
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            {/* Login Instructions */}
            <div className="login-instructions">
              <p><strong>Login Instructions:</strong></p>
              <ul>
                <li>👑 <strong>Admin:</strong> Use email & password to manage teachers</li>
                <li>👨‍🏫 <strong>Teacher:</strong> Use Teacher ID & password to create classes</li>
                <li>🎓 <strong>Student:</strong> Use Student ID & password to mark attendance</li>
              </ul>
            </div>
          </form>
        )}

        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="login-form">
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                  required
                  placeholder="Enter your full name"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  required
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Student ID *</label>
                <input
                  type="text"
                  value={registerData.studentId}
                  onChange={(e) => setRegisterData({...registerData, studentId: e.target.value})}
                  required
                  placeholder="Enter student ID"
                />
              </div>
              <div className="form-group">
                <label>Class *</label>
                <input
                  type="text"
                  value={registerData.class}
                  onChange={(e) => setRegisterData({...registerData, class: e.target.value})}
                  required
                  placeholder="e.g., 10th Grade"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Roll No *</label>
                <input
                  type="text"
                  value={registerData.rollNo}
                  onChange={(e) => setRegisterData({...registerData, rollNo: e.target.value})}
                  required
                  placeholder="Enter roll number"
                />
              </div>
              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  value={registerData.mobile}
                  onChange={(e) => setRegisterData({...registerData, mobile: e.target.value})}
                  placeholder="Enter mobile number"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                value={registerData.password}
                onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                required
                placeholder="Create a password (min. 6 characters)"
                minLength="6"
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Student Account'}
            </button>
          </form>
        )}

        <div className="login-footer">
          <p>
            {activeTab === 'login' 
              ? "Don't have an account? " 
              : "Already have an account? "}
            <span 
              className="link" 
              onClick={() => setActiveTab(activeTab === 'login' ? 'register' : 'login')}
            >
              {activeTab === 'login' ? 'Sign up here' : 'Sign in here'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;