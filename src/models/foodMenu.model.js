const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
    items: { type: [String], default: [] },
    notes: { type: String, default: null, trim: true },
}, { _id: false });

const foodMenuSchema = new mongoose.Schema({
    date: { type: Date, required: true, unique: true },
    breakfast: { type: mealSchema, default: () => ({}) },
    lunch: { type: mealSchema, default: () => ({}) },
    dinner: { type: mealSchema, default: () => ({}) },
    published_by: {
        role: { type: String, enum: ['ADMIN', 'MANAGER'], required: true },
        user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    },
}, { timestamps: true });

module.exports = mongoose.model('FoodMenu', foodMenuSchema);
