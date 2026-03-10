exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                warning: `Access Denied`,
                message: `As a ${req.user.role}, you are not authorized to perform this action. Only ${roles.join(' or ')} can do this.`
            });
        }
        next();
    };
};
