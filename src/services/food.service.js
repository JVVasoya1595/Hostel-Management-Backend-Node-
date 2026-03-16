const FoodMenu = require('../models/foodMenu.model');
const FoodSlotMark = require('../models/foodSlotMark.model');

const sanitize = (document) => {
    if (!document) return null;
    return typeof document.toObject === 'function' ? document.toObject() : { ...document };
};

const normalizeDate = (value, label) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error(`${label} must be a valid date`);
    date.setHours(0, 0, 0, 0);
    return date;
};

const publishMenu = async (actor, payload = {}) => {
    const date = normalizeDate(payload.date || new Date(), 'date');
    const published_by = { role: String(actor.user.role || '').trim().toUpperCase(), user_id: actor.user._id };

    const menu = await FoodMenu.findOneAndUpdate(
        { date },
        {
            date,
            breakfast: payload.breakfast || {},
            lunch: payload.lunch || {},
            dinner: payload.dinner || {},
            published_by,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return sanitize(menu);
};

const getMenu = async (filters = {}) => {
    const date = filters.date ? normalizeDate(filters.date, 'date') : null;
    const query = date ? { date } : {};
    const menus = await FoodMenu.find(query).sort({ date: -1 }).limit(Number(filters.limit) || 30);
    return menus.map(sanitize);
};

const markFoodSlots = async (studentId, payload = {}) => {
    const date = normalizeDate(payload.date || new Date(), 'date');

    const mark = await FoodSlotMark.findOneAndUpdate(
        { student_id: studentId, date },
        {
            student_id: studentId,
            date,
            breakfast: Boolean(payload.breakfast),
            lunch: Boolean(payload.lunch),
            dinner: Boolean(payload.dinner),
            updated_at: new Date(),
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return sanitize(mark);
};

const getReport = async (filters = {}) => {
    const date = normalizeDate(filters.date || new Date(), 'date');
    const marks = await FoodSlotMark.find({ date }).lean();

    const summary = marks.reduce((acc, mark) => {
        acc.total += 1;
        if (mark.breakfast) acc.breakfast += 1;
        if (mark.lunch) acc.lunch += 1;
        if (mark.dinner) acc.dinner += 1;
        return acc;
    }, { date, total: 0, breakfast: 0, lunch: 0, dinner: 0 });

    return summary;
};

module.exports = {
    publishMenu,
    getMenu,
    markFoodSlots,
    getReport,
};

