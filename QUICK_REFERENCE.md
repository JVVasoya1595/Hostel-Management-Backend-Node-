# Phase 1 - Quick Reference Guide

## 🎯 Standard Endpoint Pattern

All endpoints follow this exact pattern:

```javascript
const functionName = async (req, res) => {
  try {
    logger.info("Action description request received");

    // 1. VALIDATE REQUEST
    const result = await validate[Role]Request(req, res);
    if (result.error) {
      return res.status(result.status).json({ message: result.message });
    }

    // 2. EXTRACT VALIDATED DATA
    const { field1, field2 } = result.data;
    
    // Validate required fields
    if (!field1 || !field2) {
      return res.status(400).json({ message: "field1 and field2 are required" });
    }

    // 3. PROCESS REQUEST (Database operations)
    const data = await Model.create({ field1, field2 });
    
    logger.info("Action completed successfully");

    // 4. RETURN ENCRYPTED RESPONSE
    return res.status(200).json({
      message: "Action description succeeded",
      data: encryptData(data)
    });

  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: "SERVER ERROR" });
  }
};
```

---

## 📦 Import Statements

```javascript
// Utilities
const logger = require("../../utils/logger");
const { encryptData, decryptData } = require("../../utils/encryption");

// Validators (choose one based on role)
const { validateAdminRequest, validateAdminRequestBody } = require("../../utils/validators/admin.validator");
const { validateManagerRequest, validateManagerRequestBody } = require("../../utils/validators/manager.validator");
const { validateStudentRequest, validateStudentRequestBody } = require("../../utils/validators/student.validator");
const { validateParentRequest, validateParentRequestBody } = require("../../utils/validators/parent.validator");

// Models
const Admin = require("../../models/admin.model");
const Manager = require("../../models/manager.model");
const Student = require("../../models/student.model");
const Parent = require("../../models/parent.model");
const Floor = require("../../models/floor.model");
const Room = require("../../models/room.model");
const Bed = require("../../models/bed.model");
const LeaveRequest = require("../../models/leaveRequest.model");
const Complaint = require("../../models/complaint.model");
const FeePayment = require("../../models/feePayment.model");
```

---

## 🔗 Route Patterns

### GET Requests (Query Parameters)
```javascript
// In routes file
router.get('/action/:data', controller.actionName);

// Usage
GET /api/admin/students/:encryptedData
```

### POST Requests (Body Parameters)
```javascript
// In routes file
router.post('/action', controller.actionName);

// Usage
POST /api/student/leave-request
{
  "data": "encryptedData"
}
```

---

## 🛡️ Validation Rules

### Role-Based Validation Functions

| Function | Usage | When |
|----------|-------|------|
| `validateAdminRequest` | GET requests | Admin accessing data via params |
| `validateAdminRequestBody` | POST requests | Admin sending data via body |
| `validateManagerRequest` | GET requests | Manager accessing data via params |
| `validateManagerRequestBody` | POST requests | Manager sending data via body |
| `validateStudentRequest` | GET requests | Student accessing data via params |
| `validateStudentRequestBody` | POST requests | Student sending data via body |
| `validateParentRequest` | GET requests | Parent accessing data via params |
| `validateParentRequestBody` | POST requests | Parent sending data via body |

---

## 📊 Status Codes

```javascript
200  // OK - Request successful
201  // Created - Resource created
400  // Bad Request - Invalid data
401  // Unauthorized - Invalid token
403  // Forbidden - User not permitted
404  // Not Found - Resource doesn't exist
500  // Server Error - Internal error
```

---

## 🔐 Encryption/Decryption

### Encrypt
```javascript
const encryptedString = encryptData({ key: "value" });
// Returns: "U2FsdGVkX1..." (encrypted string)
```

### Decrypt
```javascript
const decryptedObject = decryptData(encryptedString);
// Returns: { key: "value" }
```

---

## 📝 Logging

```javascript
// Info level - general information
logger.info("User login successful");

// Warning level - something unexpected
logger.warn("Invalid token");

// Error level - error occurred
logger.error("Database connection failed");
```

---

## Model Quick Reference

### Admin
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  encryptedPassword: String,
  role: "admin",
  createdAt: Date,
  updatedAt: Date
}
```

### LeaveRequest
```javascript
{
  _id: ObjectId,
  student_id: ObjectId (ref: Student),
  manager_id: ObjectId (ref: Manager),
  leave_from: Date,
  leave_to: Date,
  reason: String,
  status: "PENDING|APPROVED|REJECTED",
  approval_date: Date,
  remarks: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Complaint
```javascript
{
  _id: ObjectId,
  student_id: ObjectId (ref: Student),
  manager_id: ObjectId (ref: Manager),
  title: String,
  description: String,
  category: "MAINTENANCE|CLEANLINESS|NOISE|OTHER",
  status: "OPEN|IN_PROGRESS|RESOLVED|CLOSED",
  resolution_date: Date,
  comments: String,
  createdAt: Date,
  updatedAt: Date
}
```

### FeePayment
```javascript
{
  _id: ObjectId,
  student_id: ObjectId (ref: Student),
  amount: Number,
  month: String,
  year: Number,
  payment_date: Date,
  status: "PENDING|PAID|OVERDUE",
  transaction_id: String,
  payment_method: "CASH|ONLINE|BANK_TRANSFER",
  createdAt: Date,
  updatedAt: Date
}
```

---

## Common Queries

### Find with Population
```javascript
const data = await Complaint.find({ manager_id: id })
  .populate('student_id', '-encryptedPassword');
```

### Find with Filtering
```javascript
const data = await LeaveRequest.find({ 
  manager_id: id,
  status: "PENDING"
});
```

### Find and Select
```javascript
const data = await Student.find()
  .select('-encryptedPassword');
```

---

## Error Handling Template

```javascript
// Check required fields
if (!requiredField) {
  return res.status(400).json({ message: "requiredField is required" });
}

// Check resource exists
const resource = await Model.findById(id);
if (!resource) {
  return res.status(404).json({ message: "Resource not found" });
}

// Check authorization
if (result.error) {
  return res.status(result.status).json({ message: result.message });
}
```

---

## Response Template

### Success
```javascript
return res.status(200).json({
  message: "Action description succeeded",
  data: encryptData(result)
});
```

### Error
```javascript
return res.status(400).json({ message: "Error description" });
```

---

## Environment Variables

```bash
PORT=5010                                    # Server port
MONGO_URI=mongodb://localhost:27017/hostelcore  # MongoDB URI
JWT_SECRET=your-jwt-secret-key              # JWT signing key
ENCRYPTION_SECRET=your-encryption-key       # Data encryption key
```

---

## File Locations for Module

### Adding Feature to Admin Module

1. Controller: `src/controllers/admin.controller.js`
2. Routes: `src/routes/admin.routes.js`
3. Validator: `src/utils/validators/admin.validator.js`
4. Models: `src/models/*.model.js`

### Example: Add Admin Dashboard Stats

**1. Controller Add**
```javascript
const getStats = async (req, res) => {
  try {
    logger.info("Get stats request received");
    const result = await validateAdminRequest(req, res);
    if (result.error) {
      return res.status(result.status).json({ message: result.message });
    }
    
    const stats = {
      totalStudents: await Student.countDocuments(),
      totalManagers: await Manager.countDocuments(),
      totalParents: await Parent.countDocuments()
    };
    
    logger.info("Stats retrieved successfully");
    return res.status(200).json({
      message: "Stats retrieved successfully",
      data: encryptData(stats)
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: "SERVER ERROR" });
  }
};

module.exports = {
  // ... existing
  getStats
};
```

**2. Route Add**
```javascript
router.get('/stats/:data', controller.getStats);
```

---

## Testing Checklist

- [ ] Validate request works
- [ ] Data decrypts correctly
- [ ] JWT token verified
- [ ] User role matches
- [ ] Database operation succeeds
- [ ] Response encrypts correctly
- [ ] Error handling works
- [ ] Logging records events
- [ ] Status code is correct

---

## Debugging Tips

1. **Check logs**: `logs/app.log`
2. **Add console logs**: `console.log(data)` then check terminal
3. **Use logger**: `logger.info()`, `logger.error()`
4. **Test with Postman**: Use plain JSON first, then encrypt
5. **Verify tokens**: Check JWT at jwt.io
6. **Check MongoDB**: Verify data with MongoDB compass

---

**Last Updated**: March 10, 2026
**Phase**: 1
