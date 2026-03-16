const Notification = require('../models/notification.model');

const ROLE_VALUES = ['ADMIN', 'MANAGER', 'STUDENT', 'PARENT', 'ALL'];
const DELIVERY_CHANNELS = ['IN_APP', 'EMAIL', 'SMS'];

const normalizeRole = (role, { allowAll = false } = {}) => {
    const normalizedRole = String(role || '').trim().toUpperCase();
    const allowedRoles = allowAll ? ROLE_VALUES : ROLE_VALUES.filter((value) => value !== 'ALL');
    if (!allowedRoles.includes(normalizedRole)) {
        throw new Error(`recipient_role must be one of ${allowedRoles.join(', ')}`);
    }

    return normalizedRole;
};

const normalizeDeliveryChannels = (channels) => {
    if (channels === undefined || channels === null || channels === '') {
        return ['IN_APP'];
    }

    const values = Array.isArray(channels)
        ? channels
        : String(channels).split(',');

    const normalized = [...new Set(
        values
            .map((value) => String(value || '').trim().toUpperCase())
            .filter(Boolean)
    )];

    if (!normalized.length) {
        return ['IN_APP'];
    }

    normalized.forEach((channel) => {
        if (!DELIVERY_CHANNELS.includes(channel)) {
            throw new Error(`delivery_channels must contain only ${DELIVERY_CHANNELS.join(', ')}`);
        }
    });

    return normalized;
};

const normalizeStudentIds = (studentIds) => {
    if (!studentIds) {
        return [];
    }

    if (Array.isArray(studentIds)) {
        return studentIds.filter(Boolean);
    }

    return [studentIds];
};

const normalizeUnreadOnly = (value) => {
    if (value === undefined || value === null || value === '') {
        return false;
    }

    if (typeof value === 'boolean') {
        return value;
    }

    const normalized = String(value).trim().toLowerCase();
    return ['true', '1', 'yes'].includes(normalized);
};

const createNotification = async (student_id, room_number, floor_number) => {
    return Notification.create({
        student_id,
        room_number,
        floor_number,
        title: 'Room allocation updated',
        message: `Student has been allotted room ${room_number} on floor ${floor_number}.`,
        type: 'ROOM_ALLOCATION',
        recipient_role: 'PARENT',
        delivery_channels: ['IN_APP'],
    });
};

const createRoleNotification = async ({
    title,
    message,
    type = 'ANNOUNCEMENT',
    recipient_role = 'ALL',
    created_by = null,
    student_id = null,
    room_number = null,
    floor_number = null,
    delivery_channels = ['IN_APP'],
}) => {
    const normalizedRecipientRole = normalizeRole(recipient_role, { allowAll: true });

    return Notification.create({
        title,
        message,
        type,
        recipient_role: normalizedRecipientRole,
        created_by,
        student_id,
        room_number,
        floor_number,
        delivery_channels: normalizeDeliveryChannels(delivery_channels),
    });
};

const createAdminNotification = async (payload) => createRoleNotification(payload);

const notifyStudentAndParents = async ({
    student,
    title,
    message,
    type,
    created_by = null,
    delivery_channels = ['IN_APP'],
}) => {
    const room_number = student?.room_id?.room_number || null;
    const floor_number = student?.room_id?.floor_id?.floor_number || null;

    return Promise.all([
        createRoleNotification({
            title,
            message,
            type,
            recipient_role: 'STUDENT',
            created_by,
            student_id: student?._id || null,
            room_number,
            floor_number,
            delivery_channels,
        }),
        createRoleNotification({
            title,
            message,
            type,
            recipient_role: 'PARENT',
            created_by,
            student_id: student?._id || null,
            room_number,
            floor_number,
            delivery_channels,
        }),
    ]);
};

const buildNotificationQuery = ({
    recipient_role = null,
    student_ids = [],
    type = null,
    user_id = null,
    unread_only = false,
}) => {
    const query = {};

    if (recipient_role) {
        const normalizedRole = normalizeRole(recipient_role);
        query.recipient_role = { $in: [normalizedRole, 'ALL'] };
    }

    const normalizedStudentIds = normalizeStudentIds(student_ids);
    if (normalizedStudentIds.length) {
        query.$and = [
            {
                $or: [
                    { student_id: null },
                    { student_id: { $in: normalizedStudentIds } },
                ],
            },
        ];
    }

    if (type) {
        query.type = String(type).trim().toUpperCase();
    }

    if (normalizeUnreadOnly(unread_only)) {
        if (!user_id || !recipient_role) {
            throw new Error('user_id and recipient_role are required for unread notification queries');
        }

        query.read_by = {
            $not: {
                $elemMatch: {
                    user_id,
                    role: normalizeRole(recipient_role),
                },
            },
        };
    }

    return query;
};

const getAllNotifications = async ({ limit, ...filters } = {}) => {
    let query = Notification.find(buildNotificationQuery(filters))
        .populate('student_id', 'name email')
        .populate('created_by', 'name email')
        .sort({ createdAt: -1 });

    if (limit) {
        const normalizedLimit = Number(limit);
        if (Number.isInteger(normalizedLimit) && normalizedLimit > 0) {
            query = query.limit(normalizedLimit);
        }
    }

    return query;
};

const getNotificationsForRole = async (recipient_role, filters = {}) => getAllNotifications({
    ...filters,
    recipient_role,
});

const markNotificationsRead = async ({
    recipient_role,
    user_id,
    notification_id,
    notification_ids = [],
    student_ids = [],
}) => {
    const normalizedRole = normalizeRole(recipient_role);
    if (!user_id) {
        throw new Error('user_id is required');
    }

    const normalizedNotificationIds = Array.isArray(notification_ids)
        ? notification_ids
        : [notification_ids];

    const requestedIds = [
        notification_id,
        ...normalizedNotificationIds,
    ].filter(Boolean);

    if (!requestedIds.length) {
        throw new Error('notification_id or notification_ids is required');
    }

    const query = buildNotificationQuery({
        recipient_role: normalizedRole,
        student_ids,
    });
    query._id = { $in: requestedIds };

    const notifications = await Notification.find(query)
        .populate('student_id', 'name email')
        .populate('created_by', 'name email')
        .sort({ createdAt: -1 });

    if (!notifications.length) {
        throw new Error('Notification not found');
    }

    const now = new Date();
    for (const notification of notifications) {
        const alreadyRead = (notification.read_by || []).some((entry) => (
            String(entry.user_id) === String(user_id)
            && entry.role === normalizedRole
        ));

        if (!alreadyRead) {
            notification.read_by.push({
                user_id,
                role: normalizedRole,
                read_at: now,
            });
        }

        notification.is_read = true;
        notification.read_at = now;
        await notification.save();
    }

    return {
        total: notifications.length,
        notifications,
    };
};

const deleteNotification = async (notificationId) => {
    return Notification.findByIdAndDelete(notificationId);
};

module.exports = {
    createNotification,
    createRoleNotification,
    createAdminNotification,
    notifyStudentAndParents,
    getAllNotifications,
    getNotificationsForRole,
    markNotificationsRead,
    deleteNotification,
};
