exports.authorize = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({
                warning: `Access Denied`,
                message: `As a ${req.user.role}, you are not authorized to perform this action. Only a ${role} can do this.`
            });
        }
        next();
    };
};
