const mongoose = require('mongoose');

const feePaymentSchema = new mongoose.Schema({
    student_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Student', 
        required: true 
    },
    amount: { 
        type: Number, 
        required: true 
    },
    month: { 
        type: String, 
        required: true 
    },
    year: { 
        type: Number, 
        required: true 
    },
    payment_date: { 
        type: Date, 
        default: null 
    },
    status: { 
        type: String, 
        enum: ['PENDING', 'PAID', 'OVERDUE'], 
        default: 'PENDING' 
    },
    transaction_id: { 
        type: String, 
        default: null 
    },
    payment_method: { 
        type: String, 
        enum: ['CASH', 'ONLINE', 'BANK_TRANSFER'], 
        default: null 
    }
}, { timestamps: true });

module.exports = mongoose.model('FeePayment', feePaymentSchema);
