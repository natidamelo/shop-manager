import mongoose from 'mongoose';
import Expense from '../models/Expense.js';

export async function getAllExpenses(filters = {}) {
    const query = {};
    if (filters.from) query.date = { $gte: new Date(filters.from) };
    if (filters.to) {
        query.date = query.date || {};
        query.date.$lte = new Date(filters.to);
    }
    if (filters.category) query.category = filters.category;

    return await Expense.find(query).sort({ date: -1 }).lean();
}

export async function createExpense(data) {
    if (data.created_by && !mongoose.Types.ObjectId.isValid(data.created_by)) {
        delete data.created_by;
    }
    return await Expense.create(data);
}

export async function deleteExpense(id) {
    return await Expense.findByIdAndDelete(id);
}

export async function updateExpense(id, data) {
    return await Expense.findByIdAndUpdate(id, data, { new: true });
}
