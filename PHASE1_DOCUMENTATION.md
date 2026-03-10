# Hostel Management System - Phase 1 Build Plan & Architecture

## 📋 Overview

Phase 1 implements a **simple, secure, and scalable** backend for the Hostel Management System with standardized patterns across all modules.

---

## 🏗️ Architecture

### Core Pattern

All endpoints follow a **simple request-response pattern** with **encrypted data transmission**:

```
Client → Encrypt Data with ENCRYPTION_SECRET → Send in params/body
Server → Validate + Decrypt → Process → Encrypt Response → Send back
```

### Technology Stack

- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Encryption**: CryptoJS (AES)
- **Authentication**: JWT
- **Logging**: Winston

---

## 📁 Project Structure

```
hostelcore-backend/
├── src/
│   ├── app.js              # Express app setup
│   ├── server.js           # Server entry point
│   ├── config/
│   │   └── db.js           # MongoDB connection
│   ├── controllers/        # Business logic
│   │   ├── admin.controller.js
│   │   ├── manager.controller.js
│   │   ├── student.controller.js
│   │   └── parent.controller.js
│   ├── models/            # Database schemas
│   │   ├── admin.model.js
│   │   ├── manager.model.js
│   │   ├── student.model.js
│   │   ├── parent.model.js
│   │   ├── floor.model.js
│   │   ├── room.model.js
│   │   ├── bed.model.js
│   │   ├── leaveRequest.model.js
│   │   ├── complaint.model.js
│   │   └── feePayment.model.js
│   ├── routes/            # API endpoints
│   │   ├── admin.routes.js
│   │   ├── manager.routes.js
│   │   ├── student.routes.js
│   │   ├── parent.routes.js
│   │   ├── floor.routes.js
│   │   └── room.routes.js
│   ├── utils/
│   │   ├── logger.js           # Winston logger
│   │   ├── encryption.js       # Encrypt/Decrypt functions
│   │   └── validators/         # Role-based validation
│   │       ├── admin.validator.js
│   │       ├── manager.validator.js
│   │       ├── student.validator.js
│   │       └── parent.validator.js
│   └── middleware/
│       ├── auth.middleware.js   # JWT verification (optional)
│       └── role.middleware.js   # Role authorization (optional)
├── .env
├── package.json
└── logs/
    └── app.log
```

---

## 🔐 Encryption & Validation Pattern

### How It Works

1. **Client sends encrypted data** in request params/body
2. **Validator decrypts** and verifies JWT token
3. **Validator checks** user ID, email, and role match token
4. **Controller processes** request with decrypted data
5. **Response is encrypted** before sending back

### Example Validator

```javascript
// From admin.validator.js
const validateAdminRequest = async (req, res) => {
  try {
    // 1. Decrypt incoming data
    decryptedData = decryptData(req.params.data);
    newData = decryptData(decryptedData.data);
    
    // 2. Extract token and user info
    const { token, id, email, role } = newData;
    
    // 3. Verify JWT token
    dt = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Check user exists and role matches
    const admin = await Admin.findById(id);
    if (!admin || role !== "admin") {
      return { error: true, status: 403, message: "Unauthorized" };
    }
    
    // 5. Validate all fields match
    const isIdValid = dt.id === id;
    const isEmailValid = dt.email === email;
    const isRoleValid = dt.role === role && role === "admin";
    
    if (!isIdValid || !isEmailValid || !isRoleValid) {
      return { error: true, status: 403, message: "Unauthorized" };
    }
    
    // 6. Return validated data
    return { error: false, user: admin, data: newData };
  } catch (err) {
    logger.error("Validation error: ", err);
    return { error: true, status: 500, message: "Server Error" };
  }
};
```

### Example Controller

```javascript
// From admin.controller.js
const getAllStudents = async (req, res) => {
  try {
    logger.info("Get all students request received");
    
    // 1. Validate request
    const result = await validateAdminRequest(req, res);
    if (result.error) {
      return res.status(result.status).json({ message: result.message });
    }
    
    // 2. Process request
    const students = await Student.find().select('-encryptedPassword');
    
    logger.info("Students retrieved successfully");
    
    // 3. Encrypt and respond
    return res.status(200).json({
      message: "Students retrieved successfully",
      data: encryptData(students)
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: "SERVER ERROR" });
  }
};
```

---

## 📡 API Endpoints

### Admin Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/profile/:data` | Get admin profile |
| GET | `/api/admin/students/:data` | Get all students |
| GET | `/api/admin/managers/:data` | Get all managers |
| GET | `/api/admin/parents/:data` | Get all parents |

### Manager Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/manager/profile/:data` | Get manager profile |
| GET | `/api/manager/students/:data` | Get assigned students |
| GET | `/api/manager/leave-requests/:data` | Get leave requests |
| GET | `/api/manager/complaints/:data` | Get complaints |

### Student Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/student/profile/:data` | Get student profile |
| GET | `/api/student/fee-status/:data` | Get fee payment status |
| POST | `/api/student/leave-request` | Submit leave request |
| POST | `/api/student/complaint` | Submit complaint |

### Parent Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/parent/profile/:data` | Get parent profile |
| GET | `/api/parent/child-info/:data` | Get child information |
| GET | `/api/parent/child-fee-status/:data` | Get child fee status |
| GET | `/api/parent/child-complaints/:data` | Get child complaints |

### Floor & Room Modules

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/floor/all/:data` | Get all floors |
| GET | `/api/room/all/:data` | Get all rooms |
| GET | `/api/room/available/:data` | Get available rooms |

---

## 🔒 Security Features

### Encryption
- **Algorithm**: AES (Advanced Encryption Standard)
- **Library**: CryptoJS
- **Key**: ENCRYPTION_SECRET (from .env)

### JWT Validation
- **Token Verification**: Using JWT_SECRET
- **Claim Validation**: User ID, Email, Role
- **Token Expiration**: 7 days (configurable)

### Logging
- **Console Output**: Real-time logs
- **File Storage**: `logs/app.log`
- **Database Storage**: MongoDB `logs` collection

---

## 📊 Database Models

### User Models
- **Admin**: System administrator
- **Manager**: Floor/Building manager
- **Student**: Hostel resident
- **Parent**: Student's parent/guardian

### Operational Models
- **Floor**: Building floor/wing
- **Room**: Individual room on a floor
- **Bed**: Individual bed in a room
- **LeaveRequest**: Student leave applications
- **Complaint**: Issue/complaint reports
- **FeePayment**: Monthly fee tracking

---

## 🚀 Getting Started

### Prerequisites
```bash
- Node.js v14+
- MongoDB running on localhost:27017
- Environment variables configured (.env file)
```

### Installation
```bash
cd hostelcore-backend
npm install
```

### Environment Setup
```bash
# Copy .env file and update values
PORT=5010
MONGO_URI=mongodb://localhost:27017/hostelcore
JWT_SECRET=your-jwt-secret-key
ENCRYPTION_SECRET=your-encryption-key
```

### Running the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Testing Endpoints
```bash
# Health check
GET http://localhost:5010/api/health

# Example: Get admin students
GET http://localhost:5010/api/admin/students/[encrypted-data]
```

---

## 🔄 Request-Response Flow

### GET Request Example

**1. Client Side**
```javascript
const data = {
  token: "eyJhbGc...",
  id: "user_id",
  email: "admin@example.com",
  role: "admin"
};

const encryptedData = CryptoJS.AES.encrypt(
  JSON.stringify(data),
  "ENCRYPTION_SECRET"
).toString();

// Send to: GET /api/admin/students/[encryptedData]
```

**2. Server Side**
```javascript
// Validate & Decrypt
const decrypted = decryptData(encryptedData);
// Extract user info
const { token, id, email, role } = decrypted;
// Verify JWT
const verified = jwt.verify(token, JWT_SECRET);
// Validate match
if (verified.id !== id) throw error;
// Process request
const students = await Student.find();
// Encrypt response
const encrypted = encryptData(students);
```

---

## 📝 Common Patterns

### Standard Error Responses
```javascript
// Validation error
res.status(400).json({ message: "Invalid data" });

// Unauthorized
res.status(401).json({ message: "Unauthorized" });

// Forbidden
res.status(403).json({ message: "Unauthorized" });

// Not found
res.status(404).json({ message: "Resource not found" });

// Server error
res.status(500).json({ message: "SERVER ERROR" });
```

### Standard Success Response
```javascript
res.status(200).json({
  message: "Operation successful",
  data: encryptData(result)
});
```

---

## 🔧 Next Steps (Phase 2)

1. **Authentication Module**
   - Register endpoint
   - Login endpoint
   - Password reset

2. **Advanced Features**
   - File uploads (documents/photos)
   - Email notifications
   - SMS alerts
   - Dashboard analytics

3. **Additional Endpoints**
   - Create operations (POST)
   - Update operations (PUT)
   - Delete operations (DELETE)

4. **Frontend Development**
   - Admin dashboard
   - Manager portal
   - Student app
   - Parent app

---

## 📚 Code Examples

### Adding New Endpoint

1. **Create Controller Method**
```javascript
const newFeature = async (req, res) => {
  try {
    logger.info("New feature request received");
    
    const result = await validateAdminRequest(req, res);
    if (result.error) {
      return res.status(result.status).json({ message: result.message });
    }
    
    // Your business logic here
    const data = await Model.find();
    
    logger.info("Feature completed successfully");
    
    return res.status(200).json({
      message: "Success",
      data: encryptData(data)
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: "SERVER ERROR" });
  }
};
```

2. **Add Route**
```javascript
router.get('/feature/:data', controller.newFeature);
```

3. **Export in Controller**
```javascript
module.exports = {
  // ... existing exports
  newFeature
};
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: Decryption failing
- **Solution**: Check ENCRYPTION_SECRET matches between client & server

**Issue**: JWT verification error
- **Solution**: Ensure token is valid and not expired

**Issue**: User not found
- **Solution**: Verify user ID exists in database

**Issue**: Role mismatch
- **Solution**: Check user role in database matches token claim

---

## 📞 Support

For issues or questions:
1. Check logs in `logs/app.log`
2. Check MongoDB logs
3. Verify .env configuration
4. Review validator logic for the specific endpoint

---

**Created**: March 10, 2026
**Phase**: 1 (Foundation & Validation)
**Status**: Ready for development
