const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
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
    title: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    category: { 
        type: String, 
        enum: ['MAINTENANCE', 'CLEANLINESS', 'NOISE', 'OTHER'], 
        default: 'OTHER' 
    },
    status: { 
        type: String, 
        enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], 
        default: 'OPEN' 
    },
    resolution_date: { 
        type: Date, 
        default: null 
    },
    comments: { 
        type: String, 
        default: null 
    }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
