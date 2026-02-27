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



// Routes
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/manager', require('./routes/manager.routes'));
app.use('/api/student', require('./routes/student.routes'));
app.use('/api/parent', require('./routes/parent.routes'));
app.use('/api/floor', require('./routes/floor.routes'));
app.use('/api/room', require('./routes/room.routes'));

module.exports = app;