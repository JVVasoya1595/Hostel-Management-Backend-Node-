const Notification = require('../models/notification.model');

exports.createNotification = async (student_id, room_number, floor_number) => {
    return await Notification.create({ student_id, room_number, floor_number });
};

exports.getAllNotifications = async () => {
    return await Notification.find().populate('student_id', 'name email').sort({ createdAt: -1 });
};
