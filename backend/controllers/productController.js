import * as productService from '../services/productService.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getProducts(req, res, next) {
  try {
    const { categoryId, search, lowStock } = req.query;
    const products = await productService.getAllProducts({
      categoryId: categoryId || undefined,
      search: search || undefined,
      lowStockOnly: lowStock === 'true',
    });
    res.json(products);
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req, res, next) {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) throw new AppError('Product not found', 404);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req, res, next) {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    if (!product) throw new AppError('Product not found', 404);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const product = await productService.deleteProduct(req.params.id);
    if (!product) throw new AppError('Product not found', 404);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
