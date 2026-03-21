import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import AdminDashboard from './components/AdminDashboard';
import { getToken, getUser } from './services/auth';
import './styles/App.css';

function App() {
  const [auth, setAuth] = useState({
    token: getToken(),
    user: getUser()
  });

  const login = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setAuth({ token, user });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth({ token: null, user: null });
  };

  const getDashboard = () => {
    if (!auth.user) return null;
    
    switch (auth.user.role) {
      case 'student':
        return <StudentDashboard user={auth.user} onLogout={logout} />;
      case 'teacher':
        return <TeacherDashboard user={auth.user} onLogout={logout} />;
      case 'admin':
        return <AdminDashboard user={auth.user} onLogout={logout} />;
      default:
        return null;
    }
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={
              !auth.token ? 
                <Login onLogin={login} /> : 
                <Navigate to="/dashboard" replace />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              auth.token ? getDashboard() : <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/" 
            element={<Navigate to={auth.token ? "/dashboard" : "/login"} replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;