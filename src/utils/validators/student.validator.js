const Student = require('../../models/student.model');
const { validateEncryptedRequest } = require('./requestValidator');

const validateStudentRequest = async (req) => validateEncryptedRequest({
    req,
    model: Student,
    expectedRole: 'student',
    source: 'params',
    actorLabel: 'Student',
});

const validateStudentRequestBody = async (req) => validateEncryptedRequest({
    req,
    model: Student,
    expectedRole: 'student',
    source: 'body',
    actorLabel: 'Student POST',
});

module.exports = {
    validateStudentRequest,
    validateStudentRequestBody,
};
