const Vehicle = require('../models/vehicle.model');

const sanitize = (document) => {
    if (!document) return null;
    return typeof document.toObject === 'function' ? document.toObject() : { ...document };
};

const registerVehicle = async (managerId, payload = {}) => {
    const student_id = payload.student_id;
    const registration_number = String(payload.registration_number || '').trim();
    if (!student_id || !registration_number) throw new Error('student_id and registration_number are required');

    const vehicle = await Vehicle.create({
        student_id,
        vehicle_type: payload.vehicle_type || 'OTHER',
        registration_number,
        make: payload.make || null,
        model: payload.model || null,
        color: payload.color || null,
        is_active: true,
        registered_by_manager_id: managerId,
    });

    return sanitize(vehicle);
};

const deactivateVehicle = async (managerId, payload = {}) => {
    const vehicle_id = payload.vehicle_id || payload.id;
    if (!vehicle_id) throw new Error('vehicle_id is required');

    const vehicle = await Vehicle.findById(vehicle_id);
    if (!vehicle) throw new Error('Vehicle not found');

    vehicle.is_active = false;
    vehicle.registered_by_manager_id = managerId;
    await vehicle.save();
    return sanitize(vehicle);
};

const listVehicles = async (filters = {}) => {
    const query = {};
    if (filters.student_id) query.student_id = filters.student_id;
    if (filters.is_active !== undefined) query.is_active = Boolean(filters.is_active);

    const vehicles = await Vehicle.find(query).sort({ createdAt: -1 });
    return vehicles.map(sanitize);
};

module.exports = {
    registerVehicle,
    deactivateVehicle,
    listVehicles,
};

