const express = require('express');
const app = express();

app.use(express.json());

// Allow cross-origin requests from the frontend
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/manager', require('./routes/manager.routes'));
app.use('/api/student', require('./routes/student.routes'));
app.use('/api/parent', require('./routes/parent.routes'));
app.use('/api/warden', require('./routes/warden.routes'));
app.use('/api/admissions', require('./routes/admissions.routes'));
app.use('/api/documents', require('./routes/documents.routes'));
app.use('/api/gate-pass', require('./routes/gatePass.routes'));
app.use('/api/entry-exit', require('./routes/entryExit.routes'));
app.use('/api/maintenance', require('./routes/maintenance.routes'));
app.use('/api/food', require('./routes/food.routes'));
app.use('/api/id-cards', require('./routes/idCards.routes'));
app.use('/api/accessories', require('./routes/accessories.routes'));
app.use('/api/vehicles', require('./routes/vehicles.routes'));
app.use('/api/refunds', require('./routes/refunds.routes'));
app.use('/api/permissions', require('./routes/permissions.routes'));
app.use('/api/floor', require('./routes/floor.routes'));
app.use('/api/room', require('./routes/room.routes'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`);
    res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

module.exports = app;
