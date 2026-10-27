# 📍 Proxy-Free Attendance System

A full-stack, location-based attendance management system built with **Node.js, Express, MongoDB, and React**. It eliminates proxy attendance by enforcing real-time GPS geofencing and the Haversine distance algorithm, ensuring students are physically present in the classroom within a strict radius and time window.

---

## 🌟 Key Features

- **🎯 Zero Proxy Geofencing:** Employs the **Haversine formula** to calculate the real-time distance (in meters) between the teacher's classroom coordinates and the student's current location.
- **⏱️ Ephemeral Attendance Windows:** Classroom sessions expire automatically after 5 minutes (enforced via MongoDB TTL index) or can be terminated early by the teacher.
- **👥 Role-Based Access Control (RBAC):**
  - **👑 Administrator:** Manages teachers, creates teacher credentials, and monitors active faculty accounts.
  - **👨‍🏫 Teacher:** Generates geofenced classroom sessions with customizable radii (10m–100m, default 30m), auto-detects current coordinates, monitors live attendance, and views detailed attendance logs.
  - **🎓 Student:** Self-registration, real-time discovery of active classroom sessions, single-click GPS attendance check-in, and personal attendance history tracking.
- **🛡️ Secure Authentication:** Passwords hashed with `bcryptjs` and authenticated via JSON Web Tokens (`jwt`).
- **📱 Responsive UI:** Clean, intuitive interface for desktop, tablet, and mobile browsers.

---

## 🏗️ System Architecture

```
                          ┌────────────────────────┐
                          │   React Frontend (SPA) │
                          │  (Port 3000 / Browser) │
                          └───────────┬────────────┘
                                      │
                        HTTP / REST   │ GPS Coordinates
                        (Axios + JWT) │ (HTML5 Geolocation)
                                      ▼
                          ┌────────────────────────┐
                          │   Node/Express Backend │
                          │      (Port 5000)       │
                          └───────────┬────────────┘
                                      │
                   ┌──────────────────┴──────────────────┐
                   ▼                                     ▼
        ┌──────────────────────┐              ┌──────────────────────┐
        │  Haversine Distance  │              │   MongoDB Database   │
        │      Algorithm       │              │  (Users, Classrooms, │
        │  (Radius Validation) │              │     Attendances)     │
        └──────────────────────┘              └──────────────────────┘
```

---

## 📁 Project Structure

```text
Proxy-Free-Attendance-System/
├── package.json                 # Root script runner for convenience
├── .env.local                   # Root environment configuration
├── backend/                     # Node.js + Express REST API
│   ├── .env.local               # Active backend environment variables
│   ├── .env.example             # Backend template environment file
│   ├── package.json             # Backend dependencies & scripts
│   └── server.js                # Express server, schemas, auth & API routes
└── frontend/                    # React Single Page Application
    ├── .env.local               # Active frontend environment variables
    ├── .env.example             # Frontend template environment file
    ├── package.json             # Frontend dependencies & scripts
    ├── public/
    │   └── index.html           # HTML template
    └── src/
        ├── App.js               # Route controller & authentication state
        ├── index.js             # React application entry point
        ├── components/
        │   ├── AdminDashboard.js    # Teacher creation & administration
        │   ├── TeacherDashboard.js  # Classroom creation & report view
        │   ├── StudentDashboard.js  # Geolocation verification & check-in
        │   └── Login.js             # Unified portal & registration
        ├── services/
        │   ├── api.js           # Axios HTTP client & API bindings
        │   └── auth.js          # LocalStorage token & session helpers
        └── styles/
            ├── App.css
            ├── Dashboard.css
            └── Login.css
```

---

## 📋 Prerequisites

Before installing the project, verify that your computer has the following installed:

1. **Node.js**: `v16.0.0` or higher (v18, v20, or v22 LTS recommended)
   - Verify: `node -v`
2. **npm**: `v8.0.0` or higher
   - Verify: `npm -v`
3. **MongoDB**:
   - **Option A (Local)**: [MongoDB Community Server](https://www.mongodb.com/try/download/community) installed and running locally on port `27017`.
   - **Option B (Cloud)**: A free cloud cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
4. **Web Browser with Geolocation**: Google Chrome, Mozilla Firefox, Microsoft Edge, or Safari with location permissions allowed.

---

## ⚙️ Environment Variables (`.env.local`)

This repository comes pre-configured with `.env.local` files in both the `backend/` and `frontend/` folders.

### Backend (`backend/.env.local`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port on which Express server listens |
| `MONGODB_URI` | `mongodb://localhost:27017/proxy_free_attendance` | Local MongoDB or remote Atlas URI |
| `JWT_SECRET` | `proxy_free_attendance_system_jwt_secret_2026_secure` | Secret string for signing JWT tokens |
| `ADMIN_PASSWORD` | `admin123` | Password for the default admin (`admin@school.com`) |

> **Using MongoDB Atlas?** Update `MONGODB_URI` in `backend/.env.local`:
> ```env
> MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/proxy_free_attendance?retryWrites=true&w=majority
> ```

### Frontend (`frontend/.env.local`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `REACT_APP_API_URL` | `http://localhost:5000/api` | Base URL pointing to the Express backend API |
| `PORT` | `3000` | Local port for React development server |

---

## 🚀 Installation & Running Guide

You can run the project either via **Separate Terminals** (recommended for clarity) or via the **Root Helper Scripts**.

### Method 1: Separate Terminals (Recommended)

#### Step 1: Start Backend Server
Open a terminal in the project directory:

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Start the server (with hot reload via nodemon)
npm run dev

# Or start standard production mode
# npm start
```

You should see:
```text
✅ Connected to MongoDB
🔧 Checking admin account...
✅ ADMIN ACCOUNT CREATED SUCCESSFULLY!
📧 Email: admin@school.com
🔑 Password: admin123
👑 Role: Admin
🚀 Server running on port 5000
📱 API: http://localhost:5000/api
```

#### Step 2: Start Frontend Application
Open a **new, separate terminal** in the project directory:

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start React development server
npm start
```

The browser will automatically open [http://localhost:3000](http://localhost:3000).

---

### Method 2: Monorepo Root Scripts

From the root directory:

```bash
# 1. Install both backend & frontend packages in one command
npm run install:all

# 2. Start backend (Terminal 1)
npm run start:backend

# 3. Start frontend (Terminal 2)
npm run start:frontend
```

---

## 🔑 Default Accounts & Initial Workflow

### 1. Default Administrator Account
The backend automatically provisions an administrator upon starting:
- **Email:** `admin@school.com`
- **Password:** `admin123`
- **Role:** Select `Admin` on the login screen.

### 2. Suggested End-to-End Walkthrough:
1. **Login as Admin:**
   - Log in using `admin@school.com` / `admin123`.
   - In the **Admin Dashboard**, click **"+ Add New Teacher"**.
   - Input Teacher Name (e.g. `Professor Alan`), Teacher ID (e.g. `TCH101`), and Password (e.g. `teach123`).
   - Copy or save the credentials, then **Logout**.

2. **Register as a Student:**
   - On the login screen, click the **"Register as Student"** tab.
   - Enter your name, email, student ID (e.g. `STU001`), class, roll number, mobile, and password.
   - Click **"Register & Login"**.

3. **Teacher Creates a Classroom:**
   - Log in as the Teacher (`Teacher ID: TCH101`, Password: `teach123`, Role: `Teacher`).
   - Click **"+ Create New Classroom"**.
   - Enter the Subject/Classroom Name (e.g. `Computer Networks`).
   - Click **"📍 Use Current Location"** to automatically populate your coordinates, or manually provide latitude and longitude.
   - Set the allowed radius (e.g., `30` meters).
   - Click **"Create Classroom (5 min validity)"**.

4. **Student Marks Attendance:**
   - In another browser tab or window, log in as the Student (`Student ID: STU001`).
   - You will see the active classroom listed with a countdown timer.
   - Click **"📍 Mark Attendance"**.
   - The browser prompts for location permission — click **"Allow"**.
   - The system checks your GPS coordinates against the teacher's classroom coordinates:
     - If you are within 30m: **"✅ Attendance marked successfully! (Xm)"**
     - If you are outside the radius: **"❌ You are Xm outside the allowed radius."**

---

## 🧪 Testing Geofencing from Any PC (Chrome DevTools)

When testing locally on a laptop or desktop without physically walking around:

1. Open your browser's Developer Tools (`F12` or `Ctrl + Shift + I` / `Cmd + Option + I`).
2. Press `Ctrl + Shift + P` (or `Cmd + Shift + P` on macOS) and type **"Sensors"**, then press `Enter`.
3. In the **Sensors** panel under **Location**, select **Other...**.
4. Test different coordinates:
   - **Inside classroom:** Enter the exact coordinates the teacher used (or within a few meters). Click "Mark Attendance" -> Marked **Present**.
   - **Outside classroom:** Change latitude/longitude slightly (e.g. +0.005) -> Marked **Absent / Distance error**.

---

## 📱 Testing on Mobile Phones Over Local Wi-Fi

Modern mobile browsers (Chrome, Safari) require a **Secure Context (`https` or `localhost`)** to access `navigator.geolocation`. If you access your PC's IP (e.g., `http://192.168.1.X:3000`) from a mobile phone:

### Solution: Chrome Insecure Origin Flag (Quickest)
1. On your Android Chrome browser, navigate to: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
2. Enable the flag and add: `http://<YOUR_PC_LOCAL_IP>:3000,http://<YOUR_PC_LOCAL_IP>:5000`
3. Relaunch Chrome. Geolocation permissions will now work over local HTTP.

Alternatively, you can expose your local port with a secure tunnel like [ngrok](https://ngrok.com/):
```bash
ngrok http 3000
```

---

## 📡 API Reference Summary

### Authentication (`/api/auth`)
- `POST /api/auth/student/register`: Register new student and issue JWT token.
- `POST /api/auth/login`: Universal login endpoint for Students, Teachers, and Admins.

### Admin Operations (`/api/admin`) *(Protected: Admin Token)*
- `GET /api/admin/teachers`: List all registered teachers.
- `POST /api/admin/teachers`: Register a new teacher account.

### Classroom Operations (`/api/classrooms`)
- `POST /api/classrooms`: Create an active geofenced classroom session *(Protected: Teacher)*.
- `GET /api/classrooms/my-classrooms`: Fetch all classrooms created by the logged-in teacher *(Protected: Teacher)*.
- `GET /api/classrooms/active`: Fetch currently unexpired, active classrooms *(Protected: Student)*.
- `DELETE /api/classrooms/:id`: Terminate an active classroom immediately *(Protected: Teacher)*.

### Attendance Operations (`/api/attendance`)
- `POST /api/attendance/mark`: Submit student location and compute attendance status *(Protected: Student)*.
- `GET /api/attendance/history`: Retrieve recent attendance records for student *(Protected: Student)*.
- `GET /api/attendance/report/:classroomId`: Retrieve aggregated attendance report for a classroom *(Protected: Teacher)*.

---

## 🛠️ Common Troubleshooting

| Problem | Cause | Solution |
| :--- | :--- | :--- |
| `❌ MongoDB error: connect ECONNREFUSED` | MongoDB service is not running locally | Run `sudo systemctl start mongod` (Linux) or start `MongoDB` service in Services app (Windows), or configure MongoDB Atlas in `.env.local`. |
| `Location access denied` | Browser blocked location permission | Click the lock/info icon in the browser URL bar, set **Location** to **"Allow"**, and refresh the page. |
| `Location request timed out` | OS location services disabled or poor GPS fix | Ensure Location Services are enabled in Windows/macOS/Linux system settings. In Chrome DevTools, use the Sensors panel. |
| `Port 5000 / 3000 already in use` | Another process is occupying the port | Change `PORT` in `backend/.env.local` or `frontend/.env.local`, or terminate the blocking process. |
| `Token invalid` / `No token` | Session expired or token cleared | Click Logout and log back in to renew your JWT authentication token. |

---

## 📄 License

This project is licensed under the ISC License.

