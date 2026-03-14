import Category from '../models/Category.js';
import Product from '../models/Product.js';

export async function getAllCategories(shopId) {
  const categories = await Category.find({ shop: shopId }).sort({ name: 1 }).lean();
  const counts = await Product.aggregate([
    { $match: { shop: shopId } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id?.toString(), c.count]));

  return categories.map((c) => ({
    ...c,
    id: c._id.toString(),
    product_count: countMap[c._id.toString()] || 0,
  }));
}

export async function getCategoryById(id, shopId) {
  const category = await Category.findOne({ _id: id, shop: shopId }).lean();
  return category ? { ...category, id: category._id.toString() } : null;
}

export async function createCategory(data) {
  const category = await Category.create({
    name: data.name,
    description: data.description || undefined,
    shop: data.shopId,
  });
  return { ...category.toObject(), id: category._id.toString() };
}

export async function updateCategory(id, data) {
  const update = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.description !== undefined) update.description = data.description;

  const category = await Category.findOneAndUpdate({ _id: id, shop: data.shopId }, update, { new: true });
  return category ? { ...category.toObject(), id: category._id.toString() } : null;
}

export async function deleteCategory(id, shopId) {
  const result = await Category.findOneAndDelete({ _id: id, shop: shopId });
  return result;
}
