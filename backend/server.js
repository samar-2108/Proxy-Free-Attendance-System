const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.log('❌ MongoDB error:', err.message));

// User Model
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, enum: ['student', 'teacher', 'admin'] },
  studentId: { type: String, sparse: true },
  class: String,
  rollNo: String,
  mobile: String,
  isActive: { type: Boolean, default: true },
  teacherId: { type: String, sparse: true } // For teacher accounts
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Classroom Model
const classroomSchema = new mongoose.Schema({
  name: String,
  teacherId: String,
  teacherName: String,
  location: {
    latitude: Number,
    longitude: Number
  },
  radius: Number,
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 5 * 60 * 1000) },
  terminatedByTeacher: { type: Boolean, default: false }
}, { timestamps: true });

classroomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const Classroom = mongoose.model('Classroom', classroomSchema);

// Attendance Model
const attendanceSchema = new mongoose.Schema({
  studentId: String,
  studentName: String,
  studentClass: String,
  studentRollNo: String,
  classroomId: String,
  classroomName: String,
  timestamp: Date,
  studentLocation: {
    latitude: Number,
    longitude: Number
  },
  status: String,
  distance: Number,
  attemptNumber: Number
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

// Haversine formula for distance calculation
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}

// Auth middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ message: 'Invalid token' });

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalid' });
  }
};

// Initialize Admin
const initAdmin = async () => {
  try {
    console.log('🔧 Checking admin account...');
    
    // First, delete any existing admin to avoid conflicts
    await User.deleteMany({ role: 'admin' });
    
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@school.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });
    
    console.log('✅ ADMIN ACCOUNT CREATED SUCCESSFULLY!');
    console.log('📧 Email: admin@school.com');
    console.log('🔑 Password: admin123');
    console.log('👑 Role: Admin');
    
  } catch (error) {
    console.log('❌ ERROR creating admin account:', error.message);
  }
};

// Routes

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: '✅ Backend working!' });
});

// Student registration
app.post('/api/auth/student/register', async (req, res) => {
  try {
    const { name, email, password, studentId, class: studentClass, rollNo, mobile } = req.body;

    // Validation
    if (!name || !email || !password || !studentId || !studentClass || !rollNo) {
      return res.status(400).json({ message: 'All fields required' });
    }

    // Check if student ID or email exists
    const existingUser = await User.findOne({ 
      $or: [{ studentId }, { email }] 
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Student ID or Email already exists' });
    }

    // Create student
    const hashedPassword = await bcrypt.hash(password, 10);
    const student = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'student',
      studentId,
      class: studentClass,
      rollNo,
      mobile
    });

    const token = jwt.sign(
      { userId: student._id, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
        studentId: student.studentId,
        class: student.class,
        rollNo: student.rollNo
      }
    });

  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login for all users
app.post('/api/auth/login', async (req, res) => {
  try {
    const { loginId, password, role } = req.body;

    // Find user based on role and login ID
    let user;
    if (role === 'student') {
      user = await User.findOne({ 
        studentId: loginId, 
        role: 'student',
        isActive: true 
      });
    } else if (role === 'teacher') {
      user = await User.findOne({ 
        teacherId: loginId, 
        role: 'teacher',
        isActive: true 
      });
    } else if (role === 'admin') {
      user = await User.findOne({ 
        email: loginId, 
        role: 'admin' 
      });
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        teacherId: user.teacherId,
        class: user.class,
        rollNo: user.rollNo
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Admin: Create teacher account
app.post('/api/admin/teachers', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { name, teacherId, password } = req.body;
    
    // Check if teacher ID already exists
    const existingTeacher = await User.findOne({ teacherId });
    if (existingTeacher) {
      return res.status(400).json({ message: 'Teacher ID already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const teacher = await User.create({
      name,
      teacherId,
      password: hashedPassword,
      role: 'teacher',
      email: `${teacherId}@school.com` // Auto-generate email
    });

    res.json({ 
      message: 'Teacher account created successfully!',
      teacher: { 
        id: teacher._id, 
        name: teacher.name, 
        teacherId: teacher.teacherId,
        password: password // Return the plain password for admin to share
      }
    });

  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({ message: 'Failed to create teacher account' });
  }
});

// Admin: Get all teachers
app.get('/api/admin/teachers', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const teachers = await User.find({ role: 'teacher' })
      .select('name teacherId createdAt isActive')
      .sort({ createdAt: -1 });

    res.json(teachers);
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ message: 'Failed to fetch teachers' });
  }
});

// Teacher: Create classroom
app.post('/api/classrooms', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Teacher access required' });
    }

    const { name, latitude, longitude, radius } = req.body;

    const classroom = await Classroom.create({
      name,
      teacherId: req.user._id.toString(),
      teacherName: req.user.name,
      location: { 
        latitude: parseFloat(latitude), 
        longitude: parseFloat(longitude) 
      },
      radius: parseInt(radius) || 30,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    res.json(classroom);

  } catch (error) {
    console.error('Create classroom error:', error);
    res.status(500).json({ message: 'Failed to create classroom' });
  }
});

// Teacher: Get my classrooms
app.get('/api/classrooms/my-classrooms', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Teacher access required' });
    }

    const classrooms = await Classroom.find({ 
      teacherId: req.user._id.toString() 
    }).sort({ createdAt: -1 });

    res.json(classrooms);
  } catch (error) {
    console.error('Get classrooms error:', error);
    res.status(500).json({ message: 'Failed to fetch classrooms' });
  }
});

// Student: Get active classrooms
app.get('/api/classrooms/active', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Student access required' });
    }

    const now = new Date();
    const classrooms = await Classroom.find({ 
      isActive: true,
      terminatedByTeacher: false,
      expiresAt: { $gt: now }
    });

    res.json(classrooms);
  } catch (error) {
    console.error('Get active classrooms error:', error);
    res.status(500).json({ message: 'Failed to fetch classrooms' });
  }
});

// Mark attendance
app.post('/api/attendance/mark', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(400).json({ message: 'Only students can mark attendance' });
    }

    const { classroomId, latitude, longitude } = req.body;

    // Check if already marked attendance today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      studentId: req.user._id.toString(),
      classroomId: classroomId,
      timestamp: { $gte: today, $lt: tomorrow }
    });

    if (existingAttendance) {
      return res.status(400).json({ 
        message: 'Attendance already marked for today',
        existingRecord: existingAttendance
      });
    }

    // Get classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Check if classroom is active
    const now = new Date();
    if (classroom.terminatedByTeacher || !classroom.isActive) {
      return res.status(400).json({ message: 'Classroom is no longer active' });
    }

    if (classroom.expiresAt && classroom.expiresAt < now) {
      return res.status(400).json({ message: 'Classroom has expired' });
    }

    // Calculate distance using Haversine
    const distance = haversineDistance(
      parseFloat(latitude),
      parseFloat(longitude),
      classroom.location.latitude,
      classroom.location.longitude
    );

    const status = distance <= classroom.radius ? 'present' : 'absent';

    // Get attempt number (how many times student tried today)
    const attemptCount = await Attendance.countDocuments({
      studentId: req.user._id.toString(),
      timestamp: { $gte: today, $lt: tomorrow }
    });

    // Create attendance record
    const attendance = await Attendance.create({
      studentId: req.user._id.toString(),
      studentName: req.user.name,
      studentClass: req.user.class,
      studentRollNo: req.user.rollNo,
      classroomId: classroomId,
      classroomName: classroom.name,
      timestamp: new Date(),
      studentLocation: { latitude, longitude },
      status,
      distance: Math.round(distance),
      attemptNumber: attemptCount + 1
    });

    res.json({
      success: true,
      status,
      distance: Math.round(distance),
      message: status === 'present' 
        ? `Attendance marked successfully! (${Math.round(distance)}m)` 
        : `You are ${Math.round(distance - classroom.radius)}m outside the allowed radius.`
    });

  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Failed to mark attendance' });
  }
});

// Teacher: Get attendance report
app.get('/api/attendance/report/:classroomId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Teacher access required' });
    }

    // Verify classroom belongs to teacher
    const classroom = await Classroom.findOne({
      _id: req.params.classroomId,
      teacherId: req.user._id.toString()
    });

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Get unique students (only their first attempt)
    const uniqueStudents = await Attendance.aggregate([
      { $match: { classroomId: req.params.classroomId } },
      { $sort: { timestamp: 1 } },
      {
        $group: {
          _id: "$studentId",
          doc: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$doc" } },
      { $sort: { timestamp: -1 } }
    ]);

    res.json(uniqueStudents);
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ message: 'Failed to get attendance report' });
  }
});

// Teacher: Terminate classroom
app.delete('/api/classrooms/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Teacher access required' });
    }

    const classroom = await Classroom.findOne({
      _id: req.params.id,
      teacherId: req.user._id.toString()
    });

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    classroom.terminatedByTeacher = true;
    classroom.isActive = false;
    await classroom.save();

    res.json({ 
      message: 'Classroom terminated successfully',
      classroom 
    });

  } catch (error) {
    console.error('Terminate classroom error:', error);
    res.status(500).json({ message: 'Failed to terminate classroom' });
  }
});

// Student: Get attendance history
app.get('/api/attendance/history', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Student access required' });
    }

    const history = await Attendance.find({ 
      studentId: req.user._id.toString() 
    })
    .sort({ timestamp: -1 })
    .limit(20);

    res.json(history);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Failed to fetch history' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await initAdmin();
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 API: http://localhost:${PORT}/api`);
  console.log(`👑 Admin login: admin@school.com / admin123`);
});