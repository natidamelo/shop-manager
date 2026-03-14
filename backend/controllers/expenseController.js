import * as expenseService from '../services/expenseService.js';

export async function getExpenses(req, res, next) {
    try {
        const expenses = await expenseService.getAllExpenses({ ...req.query, shopId: req.user.shop_id });
        res.json(expenses);
    } catch (err) {
        next(err);
    }
}

export async function createExpense(req, res, next) {
    try {
        const expense = await expenseService.createExpense({ ...req.body, created_by: req.user.id, shopId: req.user.shop_id });
        res.status(201).json(expense);
    } catch (err) {
        next(err);
    }
}

export async function updateExpense(req, res, next) {
    try {
        const expense = await expenseService.updateExpense(req.params.id, { ...req.body, shopId: req.user.shop_id });
        res.json(expense);
    } catch (err) {
        next(err);
    }
}

export async function deleteExpense(req, res, next) {
    try {
        await expenseService.deleteExpense(req.params.id, req.user.shop_id);
        res.status(204).end();
    } catch (err) {
        next(err);
    }
}
