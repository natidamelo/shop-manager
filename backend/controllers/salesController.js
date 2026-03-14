import * as salesService from '../services/salesService.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getSales(req, res, next) {
  try {
    const { from, to, customerId, paymentStatus } = req.query;
    const sales = await salesService.getAllSales({ from, to, customerId, paymentStatus });
    res.json(sales);
  } catch (err) {
    next(err);
  }
}

export async function getSale(req, res, next) {
  try {
    const sale = await salesService.getSaleById(req.params.id);
    if (!sale) throw new AppError('Sale not found', 404);
    res.json(sale);
  } catch (err) {
    next(err);
  }
}

export async function createSale(req, res, next) {
  try {
    const { items, total_amount, customer_id, discount, tax, notes, amount_paid, payment_method } =
      req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Sale must have at least one item', 400);
    }
    const sale = await salesService.createSale(
      { items, total_amount, customer_id, discount, tax, notes, amount_paid, payment_method },
      req.user.id
    );
    res.status(201).json(sale);
  } catch (err) {
    next(err);
  }
}

export async function addPayment(req, res, next) {
  try {
    const { amount, method, note } = req.body;
    if (!amount || parseFloat(amount) <= 0) {
      throw new AppError('Payment amount must be greater than 0', 400);
    }
    const sale = await salesService.addPayment(req.params.id, { amount, method, note });
    if (!sale) throw new AppError('Sale not found', 404);
    res.json(sale);
  } catch (err) {
    next(err);
  }
}
