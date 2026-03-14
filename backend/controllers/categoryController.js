import * as categoryService from '../services/categoryService.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getCategories(req, res, next) {
  try {
    const categories = await categoryService.getAllCategories(req.user.shop_id);
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

export async function getCategory(req, res, next) {
  try {
    const category = await categoryService.getCategoryById(req.params.id, req.user.shop_id);
    if (!category) throw new AppError('Category not found', 404);
    res.json(category);
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req, res, next) {
  try {
    const category = await categoryService.createCategory({ ...req.body, shopId: req.user.shop_id });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const category = await categoryService.updateCategory(req.params.id, { ...req.body, shopId: req.user.shop_id });
    if (!category) throw new AppError('Category not found', 404);
    res.json(category);
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const category = await categoryService.deleteCategory(req.params.id, req.user.shop_id);
    if (!category) throw new AppError('Category not found', 404);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
