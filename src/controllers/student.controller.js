const logger = require('../utils/logger');
const { encryptData } = require('../utils/encryption');
const { validateStudentRequest, validateStudentRequestBody } = require('../utils/validators/student.validator');
const Student = require('../models/student.model');
const LeaveRequest = require('../models/leaveRequest.model');
const Complaint = require('../models/complaint.model');
const FeePayment = require('../models/feePayment.model');

// Get student profile
const getProfile = async (req, res) => {
    try {
        logger.info("Get student profile request received");

        const result = await validateStudentRequest(req, res);
        if (result.error) {
            return res.status(result.status).json({ message: result.message });
        }

        const student = await Student.findById(result.user._id).select('-encryptedPassword');

        logger.info("Student profile retrieved successfully");

        return res.status(200).json({
            message: "Profile retrieved successfully",
            data: encryptData(student)
        });

    } catch (err) {
        logger.error(err);
        return res.status(500).json({ message: "SERVER ERROR" });
    }
};

// Submit leave request
const submitLeaveRequest = async (req, res) => {
    try {
        logger.info("Submit leave request received");

        const result = await validateStudentRequestBody(req, res);
        if (result.error) {
            return res.status(result.status).json({ message: result.message });
        }

        const { leave_from, leave_to, reason, manager_id } = result.data;

        if (!leave_from || !leave_to || !reason) {
            return res.status(400).json({ message: "leave_from, leave_to and reason are required" });
        }

        const leaveRequest = await LeaveRequest.create({
            student_id: result.user._id,
            manager_id,
            leave_from,
            leave_to,
            reason
        });

        logger.info("Leave request submitted successfully");

        return res.status(200).json({
            message: "Leave request submitted successfully",
            data: encryptData(leaveRequest)
        });

    } catch (err) {
        logger.error(err);
        return res.status(500).json({ message: "SERVER ERROR" });
    }
};

// Submit complaint
const submitComplaint = async (req, res) => {
    try {
        logger.info("Submit complaint request received");

        const result = await validateStudentRequestBody(req, res);
        if (result.error) {
            return res.status(result.status).json({ message: result.message });
        }

        const { title, description, category, manager_id } = result.data;

        if (!title || !description) {
            return res.status(400).json({ message: "Title and description are required" });
        }

        const complaint = await Complaint.create({
            student_id: result.user._id,
            manager_id,
            title,
            description,
            category
        });

        logger.info("Complaint submitted successfully");

        return res.status(200).json({
            message: "Complaint submitted successfully",
            data: encryptData(complaint)
        });

    } catch (err) {
        logger.error(err);
        return res.status(500).json({ message: "SERVER ERROR" });
    }
};

// Get my fee status
const getFeeStatus = async (req, res) => {
    try {
        logger.info("Get fee status request received");

        const result = await validateStudentRequest(req, res);
        if (result.error) {
            return res.status(result.status).json({ message: result.message });
        }

        const feePayments = await FeePayment.find({ student_id: result.user._id });

        logger.info("Fee status retrieved successfully");

        return res.status(200).json({
            message: "Fee status retrieved successfully",
            data: encryptData(feePayments)
        });

    } catch (err) {
        logger.error(err);
        return res.status(500).json({ message: "SERVER ERROR" });
    }
};

module.exports = {
    getProfile,
    submitLeaveRequest,
    submitComplaint,
    getFeeStatus
};
