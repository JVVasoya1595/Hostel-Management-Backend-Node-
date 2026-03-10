const CryptoJS = require("crypto-js");
const logger = require("./logger");

const decryptData = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, process.env.ENCRYPTION_SECRET);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    logger.error(`Decryption error: ${error.message}`);
    throw new Error("Decryption failed");
  }
};

const encryptData = (data) => {
  try {
    return CryptoJS.AES.encrypt(
      JSON.stringify(data),
      process.env.ENCRYPTION_SECRET
    ).toString();
  } catch (error) {
    logger.error(`Encryption error: ${error.message}`);
    throw new Error("Encryption failed");
  }
};

module.exports = { decryptData, encryptData };
