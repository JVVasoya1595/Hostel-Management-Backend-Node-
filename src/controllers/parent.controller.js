const service = require('../services/parentAuth.service');

exports.register = async (req, res) => {
    try {
        const user = await service.register(req.body);
        res.json(user);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const token = await service.login(req.body.email, req.body.password);
        res.json({ token });
    } catch (err) {
        res.status(401).json({ message: err.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const profile = await service.getProfile(req.user.id);
        if (!profile) return res.status(404).json({ message: "Parent not found" });
        res.json(profile);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};