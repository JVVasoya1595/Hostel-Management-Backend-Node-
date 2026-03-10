# Phase 2 - Implementation Roadmap

## 📌 Overview

Phase 2 builds upon Phase 1's foundation by adding authentication, advanced features, and CRUD operations for all modules.

---

## 🎯 Phase 2 Tasks

### 1. Authentication Module

#### 1.1 Admin Authentication

```javascript
// admin.controller.js - Add register & login

const register = async (req, res) => {
  try {
    logger.info("Admin register request received");
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }
    
    const exists = await Admin.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }
    
    const encryptedPassword = encryptData({ password });
    const admin = await Admin.create({ name, email, encryptedPassword, role: "admin" });
    
    logger.info("Admin registered successfully");
    return res.status(201).json({
      message: "Registration successful",
      data: encryptData(admin)
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: "SERVER ERROR" });
  }
};

const login = async (req, res) => {
  try {
    logger.info("Admin login request received");
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }
    
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    const decrypted = decryptData(admin.encryptedPassword);
    if (decrypted.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    logger.info("Admin login successful");
    return res.status(200).json({
      message: "Login successful",
      data: encryptData({ token, admin })
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: "SERVER ERROR" });
  }
};
```

#### 1.2 Repeat for Manager, Student, Parent
- Copy above pattern
- Change role to "manager", "student", "parent"
- Update validation

#### 1.3 Add Routes
```javascript
// admin.routes.js
router.post('/register', controller.register);
router.post('/login', controller.login);

// Repeat for manager, student, parent
```

---

### 2. CRUD Operations - Admin Module

#### 2.1 Create Manager
```javascript
const createManager = async (req, res) => {
  try {
    logger.info("Create manager request received");
    const result = await validateAdminRequestBody(req, res);
    if (result.error) {
      return res.status(result.status).json({ message: result.message });
    }
    
    const { name, email, password, phone } = result.data;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, password required" });
    }
    
    const exists = await Manager.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }
    
    const encryptedPassword = encryptData({ password });
    const manager = await Manager.create({ 
      name, email, encryptedPassword, phone, role: "manager" 
    });
    
    logger.info("Manager created successfully");
    return res.status(201).json({
      message: "Manager created successfully",
      data: encryptData(manager)
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: "SERVER ERROR" });
  }
};

// Route: POST /api/admin/create-manager
```

#### 2.2 Update Manager
```javascript
const updateManager = async (req, res) => {
  try {
    logger.info("Update manager request received");
    const result = await validateAdminRequestBody(req, res);
    if (result.error) {
      return res.status(result.status).json({ message: result.message });
    }
    
    const { manager_id, ...updateData } = result.data;
    if (!manager_id) {
      return res.status(400).json({ message: "manager_id required" });
    }
    
    const manager = await Manager.findByIdAndUpdate(
      manager_id,
      updateData,
      { new: true }
    ).select('-encryptedPassword');
    
    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }
    
    logger.info("Manager updated successfully");
    return res.status(200).json({
      message: "Manager updated successfully",
      data: encryptData(manager)
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: "SERVER ERROR" });
  }
};

// Route: PUT /api/admin/update-manager
```

#### 2.3 Delete Manager
```javascript
const deleteManager = async (req, res) => {
  try {
    logger.info("Delete manager request received");
    const result = await validateAdminRequestBody(req, res);
    if (result.error) {
      return res.status(result.status).json({ message: result.message });
    }
    
    const { manager_id } = result.data;
    if (!manager_id) {
      return res.status(400).json({ message: "manager_id required" });
    }
    
    const manager = await Manager.findByIdAndDelete(manager_id);
    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }
    
    logger.info("Manager deleted successfully");
    return res.status(200).json({
      message: "Manager deleted successfully",
      data: encryptData(manager)
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: "SERVER ERROR" });
  }
};

// Route: DELETE /api/admin/delete-manager
```

#### 2.4 Repeat for Student & Parent

---

### 3. Floor Management

#### 3.1 Create Floor
```javascript
const createFloor = async (req, res) => {
  try {
    logger.info("Create floor request received");
    const result = await validateAdminRequestBody(req, res);
    if (result.error) {
      return res.status(result.status).json({ message: result.message });
    }
    
    const { floor_number, total_capacity } = result.data;
    if (!floor_number) {
      return res.status(400).json({ message: "floor_number required" });
    }
    
    const exists = await Floor.findOne({ floor_number });
    if (exists) {
      return res.status(400).json({ message: "Floor already exists" });
    }
    
    const floor = await Floor.create({ floor_number, total_capacity });
    logger.info("Floor created successfully");
    
    return res.status(201).json({
      message: "Floor created successfully",
      data: encryptData(floor)
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: "SERVER ERROR" });
  }
};
```

#### 3.2 Update Floor Status
```javascript
const updateFloorStatus = async (req, res) => {
  try {
    logger.info("Update floor status request received");
    const result = await validateAdminRequestBody(req, res);
    if (result.error) {
      return res.status(result.status).json({ message: result.message });
    }
    
    const { floor_id, status } = result.data;
    if (!floor_id || !status) {
      return res.status(400).json({ message: "floor_id and status required" });
    }
    
    const floor = await Floor.findByIdAndUpdate(
      floor_id,
      { status },
      { new: true }
    );
    
    if (!floor) {
      return res.status(404).json({ message: "Floor not found" });
    }
    
    logger.info("Floor status updated successfully");
    return res.status(200).json({
      message: "Floor status updated successfully",
      data: encryptData(floor)
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: "SERVER ERROR" });
  }
};
```

---

### 4. Room Management

#### 4.1 Create Room
```javascript
const createRoom = async (req, res) => {
  try {
    logger.info("Create room request received");
    const result = await validateAdminRequestBody(req, res);
    if (result.error) {
      return res.status(result.status).json({ message: result.message });
    }
    
    const { room_number, floor_id, total_beds } = result.data;
    if (!room_number || !floor_id) {
      return res.status(400).json({ message: "room_number and floor_id required" });
    }
    
    const floor = await Floor.findById(floor_id);
    if (!floor) {
      return res.status(404).json({ message: "Floor not found" });
    }
    
    const room = await Room.create({ room_number, floor_id, total_beds });
    logger.info("Room created successfully");
    
    return res.status(201).json({
      message: "Room created successfully",
      data: encryptData(room)
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: "SERVER ERROR" });
  }
};
```

#### 4.2 Assign Student to Room
```javascript
const assignStudentToRoom = async (req, res) => {
  try {
    logger.info("Assign student to room request received");
    const result = await validateManagerRequestBody(req, res);
    if (result.error) {
      return res.status(result.status).json({ message: result.message });
    }
    
    const { room_id, student_id } = result.data;
    if (!room_id || !student_id) {
      return res.status(400).json({ message: "room_id and student_id required" });
    }
    
    const room = await Room.findById(room_id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    
    if (room.occupied_beds >= room.total_beds) {
      return res.status(400).json({ message: "Room is full" });
    }
    
    const bed = await Bed.findOneAndUpdate(
      { room_id, is_occupied: false },
      { is_occupied: true, student_id },
      { new: true }
    );
    
    if (!bed) {
      return res.status(400).json({ message: "No available beds" });
    }
    
    room.occupied_beds += 1;
    if (room.occupied_beds >= room.total_beds) {
      room.status = 'FULL';
    }
    await room.save();
    
    logger.info("Student assigned to room successfully");
    return res.status(200).json({
      message: "Student assigned to room successfully",
      data: encryptData({ bed, room })
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: "SERVER ERROR" });
  }
};
```

---

### 5. Leave Request Management

#### 5.1 Approve Leave Request
```javascript
const approveLeaveRequest = async (req, res) => {
  try {
    logger.info("Approve leave request received");
    const result = await validateManagerRequestBody(req, res);
    if (result.error) {
      return res.status(result.status).json({ message: result.message });
    }
    
    const { leave_id, remarks } = result.data;
    if (!leave_id) {
      return res.status(400).json({ message: "leave_id required" });
    }
    
    const leaveRequest = await LeaveRequest.findByIdAndUpdate(
      leave_id,
      { status: 'APPROVED', approval_date: new Date(), remarks },
      { new: true }
    );
    
    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }
    
    logger.info("Leave request approved successfully");
    return res.status(200).json({
      message: "Leave request approved successfully",
      data: encryptData(leaveRequest)
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: "SERVER ERROR" });
  }
};
```

#### 5.2 Reject Leave Request
```javascript
const rejectLeaveRequest = async (req, res) => {
  try {
    logger.info("Reject leave request received");
    const result = await validateManagerRequestBody(req, res);
    if (result.error) {
      return res.status(result.status).json({ message: result.message });
    }
    
    const { leave_id, remarks } = result.data;
    if (!leave_id) {
      return res.status(400).json({ message: "leave_id required" });
    }
    
    const leaveRequest = await LeaveRequest.findByIdAndUpdate(
      leave_id,
      { status: 'REJECTED', approval_date: new Date(), remarks },
      { new: true }
    );
    
    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }
    
    logger.info("Leave request rejected successfully");
    return res.status(200).json({
      message: "Leave request rejected successfully",
      data: encryptData(leaveRequest)
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: "SERVER ERROR" });
  }
};
```

---

### 6. Complaint Management

#### 6.1 Resolve Complaint
```javascript
const resolveComplaint = async (req, res) => {
  try {
    logger.info("Resolve complaint request received");
    const result = await validateManagerRequestBody(req, res);
    if (result.error) {
      return res.status(result.status).json({ message: result.message });
    }
    
    const { complaint_id, comments } = result.data;
    if (!complaint_id) {
      return res.status(400).json({ message: "complaint_id required" });
    }
    
    const complaint = await Complaint.findByIdAndUpdate(
      complaint_id,
      { status: 'RESOLVED', resolution_date: new Date(), comments },
      { new: true }
    );
    
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }
    
    logger.info("Complaint resolved successfully");
    return res.status(200).json({
      message: "Complaint resolved successfully",
      data: encryptData(complaint)
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: "SERVER ERROR" });
  }
};
```

---

### 7. Fee Management

#### 7.1 Add/Update Fee Payment
```javascript
const recordFeePayment = async (req, res) => {
  try {
    logger.info("Record fee payment request received");
    const result = await validateAdminRequestBody(req, res);
    if (result.error) {
      return res.status(result.status).json({ message: result.message });
    }
    
    const { student_id, amount, month, year, payment_method } = result.data;
    if (!student_id || !amount || !month || !year) {
      return res.status(400).json({ 
        message: "student_id, amount, month, year required" 
      });
    }
    
    const feeRecord = await FeePayment.findOneAndUpdate(
      { student_id, month, year },
      { 
        amount, 
        status: 'PAID', 
        payment_date: new Date(),
        payment_method 
      },
      { new: true, upsert: true }
    );
    
    logger.info("Fee payment recorded successfully");
    return res.status(200).json({
      message: "Fee payment recorded successfully",
      data: encryptData(feeRecord)
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: "SERVER ERROR" });
  }
};
```

---

## 📋 Implementation Checklist

### Week 1: Authentication
- [ ] Admin register & login
- [ ] Manager register & login
- [ ] Student register & login
- [ ] Parent register & login
- [ ] Test all auth endpoints
- [ ] Document auth flow

### Week 2: User Management
- [ ] Create Manager (Admin)
- [ ] Update Manager (Admin)
- [ ] Delete Manager (Admin)
- [ ] Create Student (Admin/Manager)
- [ ] Update Student (Admin)
- [ ] Create Parent (Admin/Manager)
- [ ] Update Parent (Admin)
- [ ] Delete Parent (Admin)

### Week 3: Floor & Room
- [ ] Create Floor (Admin)
- [ ] Update Floor Status (Admin)
- [ ] Delete Floor (Admin)
- [ ] Create Room (Admin)
- [ ] Assign Student to Room (Manager)
- [ ] Get Available Rooms
- [ ] Unassign Student from Room

### Week 4: Operations
- [ ] Approve Leave Request
- [ ] Reject Leave Request
- [ ] Get Leave History
- [ ] Update Complaint Status
- [ ] Record Fee Payment
- [ ] Send Fee Reminder

### Week 5: Testing & Documentation
- [ ] Unit tests for all endpoints
- [ ] Integration tests
- [ ] API documentation
- [ ] Update README
- [ ] Create Postman collection

---

## 🔄 Development Process

For each feature:

1. **Write Controller** - Business logic
2. **Add Route** - API endpoint
3. **Test Locally** - Use Postman/curl
4. **Add Logging** - Debug information
5. **Error Handling** - All edge cases
6. **Documentation** - Comments & guides
7. **Code Review** - Check patterns
8. **Commit & Push** - Version control

---

## 📊 After Phase 2

- Full CRUD operations across all modules
- Complete authentication system
- Role-based access control
- Advanced reporting
- Ready for Phase 3 (Frontend & Deployment)

---

**Target Completion**: 4-5 weeks
**Team Size**: 2-3 developers
**Effort Estimate**: ~200 hours

