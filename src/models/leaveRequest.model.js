const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
    student_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Student', 
        required: true 
    },
    manager_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Manager', 
        required: true 
    },
    leave_from: { 
        type: Date, 
        required: true 
    },
    leave_to: { 
        type: Date, 
        required: true 
    },
    reason: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['PENDING', 'APPROVED', 'REJECTED'], 
        default: 'PENDING' 
    },
    approval_date: { 
        type: Date, 
        default: null 
    },
    remarks: { 
        type: String, 
        default: null 
    }
}, { timestamps: true });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
