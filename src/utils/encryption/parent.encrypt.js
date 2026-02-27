const bcrypt = require('bcrypt');

exports.encrypt = async (password) => {
    return await bcrypt.hash(password, 12);
};

exports.decrypt = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};