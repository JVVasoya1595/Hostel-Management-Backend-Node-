const Notification = require('../models/notification.model');

const createNotification = async (student_id, room_number, floor_number) => {
    return Notification.create({
        student_id,
        room_number,
        floor_number,
        title: 'Room allocation updated',
        message: `Student has been allotted room ${room_number} on floor ${floor_number}.`,
        type: 'ROOM_ALLOCATION',
        recipient_role: 'PARENT',
    });
};

const createAdminNotification = async ({
    title,
    message,
    type = 'ANNOUNCEMENT',
    recipient_role = 'ALL',
    created_by = null,
    student_id = null,
    room_number = null,
    floor_number = null,
}) => {
    return Notification.create({
        title,
        message,
        type,
        recipient_role,
        created_by,
        student_id,
        room_number,
        floor_number,
    });
};

const getAllNotifications = async ({ limit } = {}) => {
    let query = Notification.find()
        .populate('student_id', 'name email')
        .populate('created_by', 'name email')
        .sort({ createdAt: -1 });

    if (limit) {
        query = query.limit(limit);
    }

    return query;
};

const deleteNotification = async (notificationId) => {
    return Notification.findByIdAndDelete(notificationId);
};

module.exports = {
    createNotification,
    createAdminNotification,
    getAllNotifications,
    deleteNotification,
};
