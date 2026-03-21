import React, { useState, useEffect } from 'react';
import { classroomAPI, attendanceAPI } from '../services/api';
import '../styles/Dashboard.css';


const StudentDashboard = ({ user, onLogout }) => {
  const [classrooms, setClassrooms] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchClassrooms();
    fetchAttendanceHistory();
    
    // Refresh classrooms every 30 seconds
    const interval = setInterval(() => {
      fetchClassrooms();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchClassrooms = async () => {
    try {
      const response = await classroomAPI.getActiveClassrooms();
      setClassrooms(response.data);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      const response = await attendanceAPI.getHistory();
      setAttendanceHistory(response.data);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    }
  };

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const markAttendance = async (classroom) => {
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Get current location
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;

      const response = await attendanceAPI.mark({
        classroomId: classroom._id,
        latitude,
        longitude
      });

      const { status, distance, message } = response.data;
      
      if (status === 'present') {
        showMessage(`✅ ${message}`, 'success');
      } else {
        showMessage(`❌ ${message}`, 'warning');
      }

      fetchAttendanceHistory();
    } catch (error) {
      console.error('Attendance error:', error);
      
      if (error.response?.data?.message) {
        showMessage(error.response.data.message, 'error');
      } else if (error.code === error.PERMISSION_DENIED) {
        showMessage('Location access denied. Please enable location permissions.', 'error');
      } else if (error.code === error.TIMEOUT) {
        showMessage('Location request timed out. Please try again.', 'error');
      } else {
        showMessage('Failed to mark attendance. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    return status === 'present' ? 'status-present' : 'status-absent';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="user-info">
            <h1>Welcome, {user.name}! 🎓</h1>
            <p className="user-role">Student Dashboard</p>
            <p className="student-details">
              Class: {user.class} | Roll No: {user.rollNo} | ID: {user.studentId}
            </p>
          </div>
          <button onClick={onLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Active Classes Section */}
        <section className="section">
          <div className="section-header">
            <h2>Active Classes</h2>
            <p>Mark your attendance for ongoing classes</p>
          </div>

          {classrooms.length === 0 ? (
            <div className="empty-state">
              <p>No active classes at the moment.</p>
              <p>Classes will appear here when teachers start them.</p>
            </div>
          ) : (
            <div className="classrooms-grid">
              {classrooms.map(classroom => (
                <div key={classroom._id} className="classroom-card student">
                  <div className="classroom-info">
                    <h3>{classroom.name}</h3>
                    <p className="classroom-meta">
                      👨‍🏫 Teacher: {classroom.teacherName}
                    </p>
                    <p className="classroom-meta">
                      📍 Radius: {classroom.radius}m
                    </p>
                    <p className="classroom-location">
                      Location: {classroom.location.latitude.toFixed(6)}, {classroom.location.longitude.toFixed(6)}
                    </p>
                  </div>
                  <button
                    onClick={() => markAttendance(classroom)}
                    disabled={loading}
                    className={`attendance-button ${loading ? 'loading' : ''}`}
                  >
                    {loading ? '🔄 Getting Location...' : '📍 Mark Attendance'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Attendance History Section */}
        <section className="section">
          <div className="section-header">
            <h2>Attendance History</h2>
            <p>Your recent attendance records</p>
          </div>

          {attendanceHistory.length === 0 ? (
            <div className="empty-state">
              <p>No attendance records yet.</p>
              <p>Mark your first attendance above!</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Distance</th>
                    <th>Your Location</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.map(record => (
                    <tr key={record._id}>
                      <td className="classroom-name">
                        <strong>{record.classroomName}</strong>
                      </td>
                      <td className="timestamp">
                        {formatDate(record.timestamp)}
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBadge(record.status)}`}>
                          {record.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="distance">
                        {Math.round(record.distance)}m
                      </td>
                      <td className="location">
                        {record.studentLocation.latitude.toFixed(6)},<br />
                        {record.studentLocation.longitude.toFixed(6)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default StudentDashboard;