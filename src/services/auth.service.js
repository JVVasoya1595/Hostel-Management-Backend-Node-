const jwt = require('jsonwebtoken');
const Admin = require('../models/admin.model');
const Manager = require('../models/manager.model');
const Warden = require('../models/warden.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');
const { encryptData, decryptData } = require('../utils/encryption');

const ROLE_CONFIG = {
    admin: {
        key: 'admin',
        label: 'Admin',
        role: 'ADMIN',
        Model: Admin,
    },
    manager: {
        key: 'manager',
        label: 'Manager',
        role: 'MANAGER',
        Model: Manager,
    },
    warden: {
        key: 'warden',
        label: 'Warden',
        role: 'WARDEN',
        Model: Warden,
    },
    student: {
        key: 'student',
        label: 'Student',
        role: 'STUDENT',
        Model: Student,
    },
    parent: {
        key: 'parent',
        label: 'Parent',
        role: 'PARENT',
        Model: Parent,
    },
};

const USER_MODELS = [Admin, Manager, Warden, Student, Parent];

const sanitizeDocument = (document) => {
    if (!document) {
        return null;
    }

    const object = typeof document.toObject === 'function'
        ? document.toObject()
        : { ...document };

    delete object.encryptedPassword;
    return object;
};

const getRoleConfig = (roleKey) => {
    const normalizedRoleKey = String(roleKey || '').trim().toLowerCase();
    const config = ROLE_CONFIG[normalizedRoleKey];
    if (!config) {
        throw new Error('Unsupported auth role');
    }

    return config;
};

const normalizeEmail = (email) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
        throw new Error('email is required');
    }

    return normalizedEmail;
};

const normalizePassword = (password) => {
    const normalizedPassword = String(password || '');
    if (!normalizedPassword.trim()) {
        throw new Error('password is required');
    }

    return normalizedPassword;
};

const ensureUniqueEmail = async (email) => {
    const matches = await Promise.all(
        USER_MODELS.map((Model) => Model.findOne({ email }).select('_id'))
    );

    if (matches.some(Boolean)) {
        throw new Error('Email already exists');
    }
};

const signToken = (user) => jwt.sign(
    {
        id: user._id,
        role: user.role,
        email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
);

const buildAuthPayload = (user) => {
    const token = signToken(user);

    return {
        token,
        role: user.role,
        user: sanitizeDocument(user),
        actor: {
            id: String(user._id),
            email: user.email,
            role: String(user.role || '').trim().toLowerCase(),
            token,
        },
    };
};

const register = async (roleKey, payload = {}) => {
    const { Model, role, label } = getRoleConfig(roleKey);
    const name = String(payload.name || '').trim();
    const email = normalizeEmail(payload.email);
    const password = normalizePassword(payload.password);

    if (!name) {
        throw new Error('name is required');
    }

    await ensureUniqueEmail(email);

    const createPayload = { ...payload };
    delete createPayload.password;
    delete createPayload.encryptedPassword;
    delete createPayload._id;
    delete createPayload.createdAt;
    delete createPayload.updatedAt;

    const user = await Model.create({
        ...createPayload,
        name,
        email,
        role,
        encryptedPassword: encryptData({ password }),
    });

    return {
        message: `${label} registered successfully`,
        ...buildAuthPayload(user),
    };
};

const login = async (roleKey, payload = {}) => {
    const { Model, label } = getRoleConfig(roleKey);
    const email = normalizeEmail(payload.email);
    const password = normalizePassword(payload.password);

    const user = await Model.findOne({ email });
    if (!user) {
        throw new Error(`${label} not found`);
    }

    let decryptedPassword;
    try {
        decryptedPassword = decryptData(user.encryptedPassword);
    } catch (error) {
        throw new Error('Invalid password');
    }

    if (!decryptedPassword || decryptedPassword.password !== password) {
        throw new Error('Invalid password');
    }

    return {
        message: `${label} logged in successfully`,
        ...buildAuthPayload(user),
    };
};

module.exports = {
    register,
    login,
};
