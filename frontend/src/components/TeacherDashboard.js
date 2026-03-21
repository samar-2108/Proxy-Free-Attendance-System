import React, { useState, useEffect } from 'react';
import { classroomAPI, attendanceAPI } from '../services/api';
import '../styles/Dashboard.css';


const TeacherDashboard = ({ user, onLogout }) => {
  const [classrooms, setClassrooms] = useState([]);
  const [showClassroomForm, setShowClassroomForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const response = await classroomAPI.getMyClassrooms();
      setClassrooms(response.data);
    } catch (error) {
      showMessage('Error fetching classrooms', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const terminateClassroom = async (classroomId) => {
    if (!window.confirm('Are you sure you want to terminate this classroom? Students will not be able to mark attendance.')) {
      return;
    }

    try {
      await classroomAPI.terminate(classroomId);
      showMessage('Classroom terminated successfully!', 'success');
      fetchClassrooms();
    } catch (error) {
      showMessage('Error terminating classroom', 'error');
    }
  };

  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires - now;
    
    if (diffMs <= 0) return 'Expired';
    
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };

  const isClassroomActive = (classroom) => {
    if (!classroom.isActive || classroom.terminatedByTeacher) return false;
    
    if (classroom.expiresAt) {
      const now = new Date();
      const expires = new Date(classroom.expiresAt);
      return expires > now;
    }
    
    return classroom.isActive;
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="user-info">
            <h1>Welcome, {user.name}! 👨‍🏫</h1>
            <p className="user-role">Teacher Dashboard</p>
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

        <section className="section">
          <div className="section-header">
            <div>
              <h2>My Classrooms</h2>
              <p>Create and manage your classrooms - Auto-expire after 5 minutes</p>
            </div>
            <button 
              onClick={() => setShowClassroomForm(!showClassroomForm)}
              className="primary-button"
            >
              {showClassroomForm ? 'Cancel' : '+ Create Classroom'}
            </button>
          </div>

          {showClassroomForm && (
            <ClassroomForm 
              onClassroomCreated={() => {
                setShowClassroomForm(false);
                fetchClassrooms();
                showMessage('Classroom created successfully!', 'success');
              }}
              onCancel={() => setShowClassroomForm(false)}
            />
          )}

          {loading ? (
            <div className="loading">Loading classrooms...</div>
          ) : classrooms.length === 0 ? (
            <div className="empty-state">
              <p>No classrooms created yet. Create your first classroom to get started.</p>
            </div>
          ) : (
            <div className="classrooms-grid">
              {classrooms.map(classroom => (
                <ClassroomCard 
                  key={classroom._id} 
                  classroom={classroom}
                  onTerminate={terminateClassroom}
                  getTimeRemaining={getTimeRemaining}
                  isClassroomActive={isClassroomActive}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const ClassroomForm = ({ onClassroomCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    radius: '30'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getCurrentLocation = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        });
        setLoading(false);
      },
      (error) => {
        let errorMessage = 'Failed to get location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'Please try again.';
        }
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radius: parseInt(formData.radius)
      };

      await classroomAPI.create(submitData);
      onClassroomCreated();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create classroom');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="classroom-form-container">
      <form onSubmit={handleSubmit} className="classroom-form">
        <h3>Create New Classroom</h3>
        
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label>Classroom Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
            placeholder="e.g., Mathematics Class, Science Lab"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Latitude *</label>
            <input
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) => setFormData({...formData, latitude: e.target.value})}
              required
              placeholder="e.g., 28.6129"
            />
          </div>
          <div className="form-group">
            <label>Longitude *</label>
            <input
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) => setFormData({...formData, longitude: e.target.value})}
              required
              placeholder="e.g., 77.2295"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Allowed Radius (meters) *</label>
          <input
            type="number"
            value={formData.radius}
            onChange={(e) => setFormData({...formData, radius: e.target.value})}
            required
            min="10"
            max="100"
            placeholder="e.g., 30"
          />
          <small>Students must be within this distance to mark attendance</small>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={loading}
            className="secondary-button"
          >
            {loading ? 'Getting Location...' : '📍 Use Current Location'}
          </button>
          
          <div className="action-buttons">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="cancel-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="primary-button"
            >
              {loading ? 'Creating...' : 'Create Classroom'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

const ClassroomCard = ({ classroom, onTerminate, getTimeRemaining, isClassroomActive }) => {
  const [showReport, setShowReport] = useState(false);
  const [attendance, setAttendance] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(classroom.expiresAt));

  useEffect(() => {
    if (isClassroomActive(classroom)) {
      const interval = setInterval(() => {
        setTimeRemaining(getTimeRemaining(classroom.expiresAt));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [classroom, getTimeRemaining, isClassroomActive]);

  const fetchAttendance = async () => {
    try {
      const response = await attendanceAPI.getReport(classroom._id);
      setAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const getStatus = () => {
    if (classroom.terminatedByTeacher) {
      return { text: 'Terminated by Teacher', class: 'terminated' };
    }
    if (!isClassroomActive(classroom)) {
      return { text: 'Expired', class: 'expired' };
    }
    return { text: 'Active', class: 'active' };
  };

  const status = getStatus();

  return (
    <div className={`classroom-card teacher ${status.class}`}>
      <div className="classroom-header">
        <div>
          <h3>{classroom.name}</h3>
          <span className={`status status-${status.class}`}>
            {status.text}
          </span>
        </div>
        {isClassroomActive(classroom) && (
          <button 
            onClick={() => onTerminate(classroom._id)}
            className="terminate-button"
          >
            Terminate
          </button>
        )}
      </div>
      
      <div className="classroom-details">
        <div className="detail-item">
          <span className="label">Location:</span>
          <span className="value">
            {classroom.location.latitude.toFixed(6)}, {classroom.location.longitude.toFixed(6)}
          </span>
        </div>
        <div className="detail-item">
          <span className="label">Allowed Radius:</span>
          <span className="value">{classroom.radius} meters</span>
        </div>
        {isClassroomActive(classroom) && classroom.expiresAt && (
          <div className="detail-item">
            <span className="label">Time Remaining:</span>
            <span className="value time-remaining">{timeRemaining}</span>
          </div>
        )}
        <div className="detail-item">
          <span className="label">Created:</span>
          <span className="value">
            {new Date(classroom.createdAt).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="classroom-actions">
        <button 
          onClick={() => {
            setShowReport(!showReport);
            if (!showReport) fetchAttendance();
          }}
          className="secondary-button"
        >
          {showReport ? 'Hide Report' : 'View Attendance'}
        </button>
      </div>

      {showReport && (
        <div className="attendance-report-container">
          <AttendanceReport attendance={attendance} />
        </div>
      )}
    </div>
  );
};

const AttendanceReport = ({ attendance }) => {
  const getStatusBadge = (status) => {
    return status === 'present' ? 'status-present' : 'status-absent';
  };

  return (
    <div className="attendance-report">
      <div className="report-header">
        <h4>Attendance Report</h4>
        <span className="total-count">{attendance.length} students</span>
      </div>

      {attendance.length === 0 ? (
        <div className="empty-state">
          <p>No attendance records yet.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Class</th>
                <th>Roll No</th>
                <th>Status</th>
                <th>Distance</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map(record => (
                <tr key={record._id}>
                  <td className="student-name">
                    {record.studentName}
                  </td>
                  <td className="student-class">
                    {record.studentClass}
                  </td>
                  <td className="student-rollno">
                    {record.studentRollNo}
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadge(record.status)}`}>
                      {record.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="distance">
                    {Math.round(record.distance)}m
                  </td>
                  <td className="timestamp">
                    {new Date(record.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;