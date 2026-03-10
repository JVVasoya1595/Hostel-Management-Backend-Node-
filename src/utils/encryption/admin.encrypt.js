const CryptoJS = require('crypto-js');

exports.decryptData = (encryptedData) => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, process.env.ENCRYPTION_SECRET);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

exports.encryptData = (data) => {
  return CryptoJS.AES.encrypt(
    JSON.stringify(data),
    process.env.ENCRYPTION_SECRET
  ).toString();
};
