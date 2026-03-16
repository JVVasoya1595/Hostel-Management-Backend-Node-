const Warden = require('../models/warden.model');
const GatePass = require('../models/gatePass.model');
const EntryExitLog = require('../models/entryExitLog.model');

const sanitize = (document) => {
    if (!document) return null;
    const object = typeof document.toObject === 'function' ? document.toObject() : { ...document };
    delete object.encryptedPassword;
    return object;
};

const getProfile = async (wardenId) => sanitize(await Warden.findById(wardenId).select('-encryptedPassword'));

const getDashboard = async (wardenId) => {
    const [pendingGatePasses, recentMovements] = await Promise.all([
        GatePass.countDocuments({ status: { $in: ['PENDING_PARENT', 'PENDING_MANAGER'] } }),
        EntryExitLog.find().sort({ scanned_at: -1 }).limit(10).lean(),
    ]);

    return {
        warden_id: wardenId,
        gate_passes: {
            pending: pendingGatePasses,
        },
        recent_movements: recentMovements,
    };
};

module.exports = {
    getProfile,
    getDashboard,
};

