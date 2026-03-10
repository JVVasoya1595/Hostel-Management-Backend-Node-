const fs = require('fs');
const path = require('path');

const logsDirectory = path.resolve(__dirname, '../../logs');
const logFilePath = path.join(logsDirectory, 'app.log');

const serialize = (value) => {
    if (value instanceof Error) {
        return value.stack || value.message;
    }

    if (typeof value === 'string') {
        return value;
    }

    try {
        return JSON.stringify(value);
    } catch (error) {
        return String(value);
    }
};

const write = (level, ...parts) => {
    const message = parts.map(serialize).join(' ');
    const line = `${new Date().toISOString()} [${level.toUpperCase()}]: ${message}`;

    if (level === 'error') {
        console.error(line);
    } else if (level === 'warn') {
        console.warn(line);
    } else {
        console.log(line);
    }

    try {
        fs.mkdirSync(logsDirectory, { recursive: true });
        fs.appendFileSync(logFilePath, `${line}\n`);
    } catch (error) {
        console.error(`${new Date().toISOString()} [ERROR]: Failed to write log file ${serialize(error)}`);
    }
};

module.exports = {
    info: (...parts) => write('info', ...parts),
    warn: (...parts) => write('warn', ...parts),
    error: (...parts) => write('error', ...parts),
};
