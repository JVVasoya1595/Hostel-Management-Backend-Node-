# 🏨 HostelCore – Complete Hostel Management Backend System

HostelCore is a secure, scalable, and role-based Hostel Management Backend built using Node.js, Express.js, and MongoDB. It provides full backend functionality for managing hostel operations including admins, managers, students, parents, floors, rooms, and bed allocations with strong encryption and authentication.

---

# 📌 Table of Contents

- Project Overview
- Features
- System Architecture
- Tech Stack
- Installation Guide
- Environment Variables
- Project Structure
- Database Design
- Authentication & Encryption
- API Endpoints
- Role Permissions
- Security Features
- Future Improvements
- Author

---

# 📖 Project Overview

This system is designed to manage hostel operations digitally with secure role-based access control.

The system supports 4 types of users:

- 👑 Admin
- 🧑‍💼 Manager
- 🎓 Student
- 👨‍👩‍👧 Parent

Each role has different permissions and separate encryption logic.

---

# 🚀 Features

## 👑 Admin Features
- Create floors
- Create rooms inside floors
- Define number of beds in rooms
- Manage managers
- Full system control

## 🧑‍💼 Manager Features
- Assign rooms to students
- View available rooms
- Manage student records
- Monitor hostel occupancy

## 🎓 Student Features
- Secure login
- View assigned room
- View hostel details

## 👨‍👩‍👧 Parent Features
- Secure login
- View student's room details
- Monitor student hostel status

---

# 🧠 System Architecture


Client (Frontend)
│
▼
Express Server (Node.js)
│
▼
Controllers
│
▼
Services Layer
│
▼
Models
│
▼
MongoDB Database


---

# 🛠 Tech Stack

Backend Framework: Node.js, Express.js  
Database: MongoDB  
ODM: Mongoose  
Authentication: JWT  
Encryption: bcrypt  
Environment Config: dotenv  
Development Tool: nodemon  

---

# ⚙️ Installation Guide

## Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/Hostel_Core.git
cd Hostel_Core
Step 2: Install Dependencies
npm install
Step 3: Create Environment File

Create .env file in root folder:

PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/hostelcore
JWT_SECRET=hostelcore_secret_key
Step 4: Run Server

Development mode:

npm run dev

Production mode:

npm start

Server runs on:

http://localhost:5000
📁 Complete Project Structure
Hostel_Core/
│
├── server.js
├── package.json
├── .env
│
├── src/
│   ├── app.js
│   │
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── admin.controller.js
│   │   ├── manager.controller.js
│   │   ├── student.controller.js
│   │   ├── parent.controller.js
│   │   ├── floor.controller.js
│   │   └── room.controller.js
│   │
│   ├── models/
│   │   ├── admin.model.js
│   │   ├── manager.model.js
│   │   ├── student.model.js
│   │   ├── parent.model.js
│   │   ├── floor.model.js
│   │   ├── room.model.js
│   │   ├── bed.model.js
│   │   └── notification.model.js
│   │
│   ├── routes/
│   │   ├── admin.routes.js
│   │   ├── manager.routes.js
│   │   ├── student.routes.js
│   │   ├── parent.routes.js
│   │   ├── floor.routes.js
│   │   └── room.routes.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── role.middleware.js
│   │
│   └── utils/
│       └── encryption/
│           ├── admin.encrypt.js
│           ├── manager.encrypt.js
│           ├── student.encrypt.js
│           └── parent.encrypt.js
🗄 Database Design
Admin Schema
name
email
password
role
createdAt
Manager Schema
name
email
password
assignedFloor
Student Schema
name
email
password
roomId
bedId
parentId
Parent Schema
name
email
password
studentId
Floor Schema
floorNumber
rooms[]
Room Schema
roomNumber
floorId
totalBeds
availableBeds
Bed Schema
bedNumber
roomId
studentId
status
🔐 Authentication Flow

Step 1: User sends login request
Step 2: Password verified using bcrypt
Step 3: JWT token generated
Step 4: Token sent to client
Step 5: Token verified on protected routes

🔒 Encryption System

Each role has separate encryption logic for high security:

admin.encrypt.js
manager.encrypt.js
student.encrypt.js
parent.encrypt.js

Encryption process:

Password → bcrypt hash → store in database
Login → compare hash → generate JWT

📡 API Endpoints
Admin APIs

Create Admin

POST /api/admin/register

Admin Login

POST /api/admin/login

Create Floor

POST /api/floor/create

Create Room

POST /api/room/create
Manager APIs

Manager Login

POST /api/manager/login

Assign Room

POST /api/manager/assign-room
Student APIs

Student Login

POST /api/student/login

Get Room Info

GET /api/student/room
Parent APIs

Parent Login

POST /api/parent/login

View Student Info

GET /api/parent/student
👮 Role-Based Access Control
Role	Permissions
Admin	Full Access
Manager	Assign Rooms
Student	View Room
Parent	View Student
🛡 Security Features

bcrypt password hashing

JWT authentication

Role-based authorization

Protected routes

Environment variables

Separate encryption per role

🧪 Testing

Use Postman

Example:

POST http://localhost:5000/api/admin/login
POST http://localhost:5000/api/manager/login
POST http://localhost:5000/api/student/login
POST http://localhost:5000/api/parent/login
📈 Future Improvements

Frontend Integration

Dashboard UI

Email Notifications

Automatic Room Allocation

Analytics Dashboard

Mobile App Support

👨‍💻 Author

Jenil Vasoya
Backend Developer
Node.js | MongoDB | MERN Stack

⭐ Support

If you like this project, give it a star on GitHub ⭐

📜 License

ISC License

🎯 Conclusion

HostelCore provides a complete backend solution for hostel management with secure authentication, encryption, and role-based access. It is scalable, modular, and production-ready.


---
