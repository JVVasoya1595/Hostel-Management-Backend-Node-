const crypto = require('crypto');

const algorithm = 'aes-128-cbc';

exports.encrypt = (text) => {
    const key = Buffer.from(process.env.STUDENT_ENCRYPT_KEY, 'hex');
    const iv = Buffer.from(process.env.STUDENT_ENCRYPT_IV, 'hex');
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
};

exports.decrypt = (encrypted) => {
    const key = Buffer.from(process.env.STUDENT_ENCRYPT_KEY, 'hex');
    const iv = Buffer.from(process.env.STUDENT_ENCRYPT_IV, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
};