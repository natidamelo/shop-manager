import mongoose from 'mongoose';
import Product from '../models/Product.js';

export async function getAllProducts(filters = {}) {
  const query = { shop: filters.shopId };

  if (!filters.shopId) return [];

  if (filters.categoryId) {
    query.category = new mongoose.Types.ObjectId(filters.categoryId);
  }
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { sku: { $regex: filters.search, $options: 'i' } },
    ];
  }
  if (filters.lowStockOnly) {
    query.$expr = { $lte: ['$stock_quantity', '$low_stock_threshold'] };
  }

  const products = await Product.find(query)
    .populate('category', 'name')
    .sort({ name: 1 })
    .lean();

  return products.map((p) => ({
    ...p,
    id: p._id.toString(),
    category_id: p.category?._id?.toString() || null,
    category_name: p.category?.name || null,
  }));
}

export async function getProductById(id, shopId) {
  const product = await Product.findOne({ _id: id, shop: shopId }).populate('category', 'name').lean();
  if (!product) return null;
  return {
    ...product,
    id: product._id.toString(),
    category_id: product.category?._id?.toString() || null,
    category_name: product.category?.name || null,
  };
}

export async function createProduct(data) {
  const product = await Product.create({
    name: data.name,
    sku: data.sku || undefined,
    description: data.description || undefined,
    category: data.category_id || undefined,
    price: data.price ?? 0,
    cost_price: data.cost_price ?? 0,
    stock_quantity: data.stock_quantity ?? 0,
    low_stock_threshold: data.low_stock_threshold ?? 10,
    unit: data.unit || 'pcs',
    shop: data.shopId,
  });
  return getProductById(product._id, data.shopId);
}

export async function updateProduct(id, data) {
  const update = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.sku !== undefined) update.sku = data.sku;
  if (data.description !== undefined) update.description = data.description;
  if (data.category_id !== undefined) update.category = data.category_id || null;
  if (data.price !== undefined) update.price = data.price;
  if (data.cost_price !== undefined) update.cost_price = data.cost_price;
  if (data.stock_quantity !== undefined) update.stock_quantity = data.stock_quantity;
  if (data.low_stock_threshold !== undefined) update.low_stock_threshold = data.low_stock_threshold;
  if (data.unit !== undefined) update.unit = data.unit;

  const product = await Product.findOneAndUpdate({ _id: id, shop: data.shopId }, update, { new: true });
  return product ? getProductById(product._id, data.shopId) : null;
}

export async function deleteProduct(id, shopId) {
  const result = await Product.findOneAndDelete({ _id: id, shop: shopId });
  return result;
}
