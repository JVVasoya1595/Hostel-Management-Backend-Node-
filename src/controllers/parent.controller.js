const logger = require('../utils/logger');
const { encryptData } = require('../utils/encryption');
const { validateParentRequest, validateParentRequestBody } = require('../utils/validators/parent.validator');
const Parent = require('../models/parent.model');
const Student = require('../models/student.model');
const FeePayment = require('../models/feePayment.model');
const Complaint = require('../models/complaint.model');

// Get parent profile
const getProfile = async (req, res) => {
    try {
        logger.info("Get parent profile request received");

        const result = await validateParentRequest(req, res);
        if (result.error) {
            return res.status(result.status).json({ message: result.message });
        }

        const parent = await Parent.findById(result.user._id).select('-encryptedPassword');

        logger.info("Parent profile retrieved successfully");

        return res.status(200).json({
            message: "Profile retrieved successfully",
            data: encryptData(parent)
        });

    } catch (err) {
        logger.error(err);
        return res.status(500).json({ message: "SERVER ERROR" });
    }
};

// Get child information
const getChildInfo = async (req, res) => {
    try {
        logger.info("Get child info request received");

        const result = await validateParentRequest(req, res);
        if (result.error) {
            return res.status(result.status).json({ message: result.message });
        }

        const { student_id } = result.data;

        if (!student_id) {
            return res.status(400).json({ message: "student_id is required" });
        }

        const student = await Student.findById(student_id).select('-encryptedPassword');

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        logger.info("Child info retrieved successfully");

        return res.status(200).json({
            message: "Child information retrieved successfully",
            data: encryptData(student)
        });

    } catch (err) {
        logger.error(err);
        return res.status(500).json({ message: "SERVER ERROR" });
    }
};

// Get child fee status
const getChildFeeStatus = async (req, res) => {
    try {
        logger.info("Get child fee status request received");

        const result = await validateParentRequest(req, res);
        if (result.error) {
            return res.status(result.status).json({ message: result.message });
        }

        const { student_id } = result.data;

        if (!student_id) {
            return res.status(400).json({ message: "student_id is required" });
        }

        const feePayments = await FeePayment.find({ student_id });

        logger.info("Child fee status retrieved successfully");

        return res.status(200).json({
            message: "Child fee status retrieved successfully",
            data: encryptData(feePayments)
        });

    } catch (err) {
        logger.error(err);
        return res.status(500).json({ message: "SERVER ERROR" });
    }
};

// Get child complaints
const getChildComplaints = async (req, res) => {
    try {
        logger.info("Get child complaints request received");

        const result = await validateParentRequest(req, res);
        if (result.error) {
            return res.status(result.status).json({ message: result.message });
        }

        const { student_id } = result.data;

        if (!student_id) {
            return res.status(400).json({ message: "student_id is required" });
        }

        const complaints = await Complaint.find({ student_id }).populate('manager_id', '-encryptedPassword');

        logger.info("Child complaints retrieved successfully");

        return res.status(200).json({
            message: "Child complaints retrieved successfully",
            data: encryptData(complaints)
        });

    } catch (err) {
        logger.error(err);
        return res.status(500).json({ message: "SERVER ERROR" });
    }
};

module.exports = {
    getProfile,
    getChildInfo,
    getChildFeeStatus,
    getChildComplaints
};
