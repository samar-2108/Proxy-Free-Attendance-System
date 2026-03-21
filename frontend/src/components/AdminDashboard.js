import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import '../styles/Dashboard.css';


const AdminDashboard = ({ user, onLogout }) => {
  const [teachers, setTeachers] = useState([]);
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [teacherForm, setTeacherForm] = useState({ name: '', teacherId: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await adminAPI.getTeachers();
      setTeachers(response.data);
    } catch (error) {
      showMessage('Error fetching teachers', 'error');
    }
  };

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const createTeacher = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await adminAPI.createTeacher(teacherForm);
      showMessage(response.data.message, 'success');
      setTeacherForm({ name: '', teacherId: '', password: '' });
      setShowTeacherForm(false);
      fetchTeachers();
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to create teacher', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = (teacherId, password) => {
    const text = `Teacher ID: ${teacherId}\nPassword: ${password}`;
    navigator.clipboard.writeText(text);
    showMessage('Credentials copied to clipboard!', 'success');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="user-info">
            <h1>Welcome, {user.name}! 👑</h1>
            <p className="user-role">Admin Dashboard - Teacher Management</p>
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
              <h2>Teacher Accounts</h2>
              <p>Create and manage teacher accounts for classroom management</p>
            </div>
            <button 
              onClick={() => setShowTeacherForm(!showTeacherForm)}
              className="primary-button"
            >
              {showTeacherForm ? 'Cancel' : '+ Create Teacher Account'}
            </button>
          </div>

          {showTeacherForm && (
            <div className="teacher-form-container">
              <form onSubmit={createTeacher} className="teacher-form">
                <h3>Create New Teacher Account</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Teacher Name *</label>
                    <input
                      type="text"
                      value={teacherForm.name}
                      onChange={(e) => setTeacherForm({...teacherForm, name: e.target.value})}
                      required
                      placeholder="Enter teacher's full name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Teacher ID *</label>
                    <input
                      type="text"
                      value={teacherForm.teacherId}
                      onChange={(e) => setTeacherForm({...teacherForm, teacherId: e.target.value})}
                      required
                      placeholder="e.g., TEACH001, MATH001"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="text"
                    value={teacherForm.password}
                    onChange={(e) => setTeacherForm({...teacherForm, password: e.target.value})}
                    required
                    placeholder="Set a password for the teacher"
                    minLength="6"
                  />
                  <small>Share these credentials with the teacher for login</small>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => setShowTeacherForm(false)}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="primary-button"
                  >
                    {loading ? 'Creating...' : 'Create Teacher Account'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {teachers.length === 0 ? (
            <div className="empty-state">
              <p>No teacher accounts created yet.</p>
              <p>Create teacher accounts to allow them to manage classrooms.</p>
            </div>
          ) : (
            <div className="teachers-grid">
              {teachers.map(teacher => (
                <div key={teacher._id} className="teacher-card">
                  <div className="teacher-header">
                    <h3>{teacher.name}</h3>
                    <span className={`status ${teacher.isActive ? 'active' : 'inactive'}`}>
                      {teacher.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="teacher-details">
                    <div className="detail-item">
                      <span className="label">Teacher ID:</span>
                      <span className="value teacher-id">{teacher.teacherId}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Created:</span>
                      <span className="value">
                        {new Date(teacher.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="teacher-actions">
                    <button 
                      onClick={() => copyCredentials(teacher.teacherId, '********')}
                      className="secondary-button"
                    >
                      📋 Copy Credentials
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Instructions Section */}
        <section className="section">
          <div className="section-header">
            <h2>How It Works</h2>
          </div>
          <div className="instructions">
            <div className="instruction-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Create Teacher Accounts</h4>
                <p>Create teacher accounts with unique Teacher IDs and passwords</p>
              </div>
            </div>
            <div className="instruction-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Share Credentials</h4>
                <p>Share the Teacher ID and password with respective teachers</p>
              </div>
            </div>
            <div className="instruction-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Teachers Create Classes</h4>
                <p>Teachers login with their credentials to create geofenced classrooms</p>
              </div>
            </div>
            <div className="instruction-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Students Mark Attendance</h4>
                <p>Students register and mark attendance when in class geofence</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;