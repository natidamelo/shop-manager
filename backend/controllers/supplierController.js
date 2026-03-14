import * as supplierService from '../services/supplierService.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getSuppliers(req, res, next) {
  try {
    const suppliers = await supplierService.getAllSuppliers(req.query.search || '');
    res.json(suppliers);
  } catch (err) {
    next(err);
  }
}

export async function getSupplier(req, res, next) {
  try {
    const supplier = await supplierService.getSupplierById(req.params.id);
    if (!supplier) throw new AppError('Supplier not found', 404);
    res.json(supplier);
  } catch (err) {
    next(err);
  }
}

export async function createSupplier(req, res, next) {
  try {
    const supplier = await supplierService.createSupplier(req.body);
    res.status(201).json(supplier);
  } catch (err) {
    next(err);
  }
}

export async function updateSupplier(req, res, next) {
  try {
    const supplier = await supplierService.updateSupplier(req.params.id, req.body);
    if (!supplier) throw new AppError('Supplier not found', 404);
    res.json(supplier);
  } catch (err) {
    next(err);
  }
}

export async function deleteSupplier(req, res, next) {
  try {
    const supplier = await supplierService.deleteSupplier(req.params.id);
    if (!supplier) throw new AppError('Supplier not found', 404);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
