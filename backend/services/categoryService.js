import Category from '../models/Category.js';
import Product from '../models/Product.js';

export async function getAllCategories() {
  const categories = await Category.find().sort({ name: 1 }).lean();
  const counts = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id?.toString(), c.count]));

  return categories.map((c) => ({
    ...c,
    id: c._id.toString(),
    product_count: countMap[c._id.toString()] || 0,
  }));
}

export async function getCategoryById(id) {
  const category = await Category.findById(id).lean();
  return category ? { ...category, id: category._id.toString() } : null;
}

export async function createCategory(data) {
  const category = await Category.create({
    name: data.name,
    description: data.description || undefined,
  });
  return { ...category.toObject(), id: category._id.toString() };
}

export async function updateCategory(id, data) {
  const update = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.description !== undefined) update.description = data.description;

  const category = await Category.findByIdAndUpdate(id, update, { new: true });
  return category ? { ...category.toObject(), id: category._id.toString() } : null;
}

export async function deleteCategory(id) {
  const result = await Category.findByIdAndDelete(id);
  return result;
}
