import * as customerService from '../services/customerService.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getCustomers(req, res, next) {
  try {
    const customers = await customerService.getAllCustomers(req.user.shop_id, req.query.search || '');
    res.json(customers);
  } catch (err) {
    next(err);
  }
}

export async function getCustomer(req, res, next) {
  try {
    const customer = await customerService.getCustomerById(req.params.id, req.user.shop_id);
    if (!customer) throw new AppError('Customer not found', 404);
    res.json(customer);
  } catch (err) {
    next(err);
  }
}

export async function createCustomer(req, res, next) {
  try {
    const customer = await customerService.createCustomer({ ...req.body, shopId: req.user.shop_id });
    res.status(201).json(customer);
  } catch (err) {
    next(err);
  }
}

export async function updateCustomer(req, res, next) {
  try {
    const customer = await customerService.updateCustomer(req.params.id, { ...req.body, shopId: req.user.shop_id });
    if (!customer) throw new AppError('Customer not found', 404);
    res.json(customer);
  } catch (err) {
    next(err);
  }
}

export async function deleteCustomer(req, res, next) {
  try {
    const customer = await customerService.deleteCustomer(req.params.id, req.user.shop_id);
    if (!customer) throw new AppError('Customer not found', 404);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
