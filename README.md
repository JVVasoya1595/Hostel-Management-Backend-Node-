# HostelCore Backend

HostelCore Backend is a Node.js, Express, and MongoDB API for managing hostel operations with role-based modules for admins, managers, students, and parents.

This repository is the backend only. It currently includes the core data models, encrypted request handling, dashboard and workflow endpoints, and room/floor allocation logic.

## Status

- Phase 1: Backend foundation completed
- Phase 2.1: Admin module completed
- Phase 2.2: Manager module completed
- Phase 2.3: Student module completed
- Phase 2.4: Parent module completed
- Phase 2.5: Operational modules partially covered through notifications, fees, leave requests, complaints, and attendance
- Phase 3 and Phase 4: Not yet implemented in this repository

## Implemented Modules

### Admin

- Dashboard and profile
- Manager, student, and parent CRUD
- Floor and room management
- Bed allocation and unallocation
- Fee recording and summaries
- Notification management

### Manager

- Dashboard and assignment overview
- Managed student listing and updates
- Student check-in and check-out
- Room vacancy tracking
- Complaint handling
- Leave request tracking
- Attendance recording and reporting

### Student

- Dashboard and profile updates
- Room assignment view
- Leave request submission and history
- Complaint submission and history
- Fee tracking
- Hostel policy access

### Parent

- Dashboard and profile updates
- Linked student status tracking
- Fee history access
- Complaint visibility
- Communication portal
- Emergency contact management

## Tech Stack

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- CryptoJS
- dotenv
- nodemon

## Project Structure

```text
hostelcore-backend/
├── server.js
├── package.json
├── .env.example
├── src/
│   ├── app.js
│   ├── config/
│   ├── controllers/
│   ├── data/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
```

## Environment Variables

Create a local `.env` file with:

```env
PORT=5010
MONGO_URI=mongodb://localhost:27017/hostelcore
JWT_SECRET=replace-with-a-secure-random-secret
ENCRYPTION_SECRET=replace-with-a-secure-random-encryption-secret
```

## Installation

```bash
npm install
```

## Running the Server

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Health check:

```http
GET /api/health
```

## API Design

All role module endpoints use encrypted payload exchange.

- `GET` routes expect encrypted request data in the `:data` route parameter
- `POST`, `PUT`, and `DELETE` routes expect a JSON body in this shape:

```json
{
  "data": "<encrypted-payload>"
}
```

Responses usually follow this shape:

```json
{
  "message": "Success message",
  "data": "<encrypted-response-payload>"
}
```

## Important Auth Note

Authentication helper services exist in:

- `src/services/adminAuth.service.js`
- `src/services/managerAuth.service.js`
- `src/services/studentAuth.service.js`
- `src/services/parentAuth.service.js`

At the moment, login and register routes are not exposed in `src/routes`. The current API surface is centered on protected module endpoints and encrypted request validation.

## Route Summary

### Core

- `GET /api/health`

### Admin

- `/api/admin/profile/:data`
- `/api/admin/dashboard/:data`
- `/api/admin/managers`
- `/api/admin/students`
- `/api/admin/parents`
- `/api/admin/floors`
- `/api/admin/rooms`
- `/api/admin/room-allocation`
- `/api/admin/fees`
- `/api/admin/notifications`

### Manager

- `/api/manager/profile/:data`
- `/api/manager/dashboard/:data`
- `/api/manager/assignment/:data`
- `/api/manager/students`
- `/api/manager/check-in`
- `/api/manager/check-out`
- `/api/manager/rooms/vacancy/:data`
- `/api/manager/leave-requests/:data`
- `/api/manager/complaints`
- `/api/manager/attendance`

### Student

- `/api/student/profile`
- `/api/student/dashboard/:data`
- `/api/student/room-assignment/:data`
- `/api/student/leave-requests`
- `/api/student/complaints`
- `/api/student/fees/:data`
- `/api/student/policies/:data`

### Parent

- `/api/parent/profile`
- `/api/parent/dashboard/:data`
- `/api/parent/students/:data`
- `/api/parent/fees/:data`
- `/api/parent/complaints/:data`
- `/api/parent/communications`
- `/api/parent/emergency-contacts`

### Utility Modules

- `/api/floor/*`
- `/api/room/*`

## Data Model Highlights

Key entities:

- Admin
- Manager
- Student
- Parent
- Floor
- Room
- Bed
- Attendance
- LeaveRequest
- Complaint
- FeePayment
- Notification
- ParentCommunication

Parent access is scoped through `parent.student_ids`. If a parent is not linked to any students, parent dashboard and child-access endpoints will return no accessible student records.

## Logging

Application logs are written to:

```text
logs/app.log
```

## Current Limitations

- No public login/register route layer yet
- No frontend in this repository
- No payment gateway integration yet
- No automated test suite yet
- No deployment, monitoring, or backup pipeline yet

## Next Recommended Work

- Phase 2.5 operational endpoint expansion
- Public auth route layer
- Seed data and automated integration tests
- Frontend dashboards
- Production deployment and monitoring

## License

ISC
