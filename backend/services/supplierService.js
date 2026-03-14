import Supplier from '../models/Supplier.js';

export async function getAllSuppliers(shopId, search = '') {
  const query = { shop: shopId };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }
  const suppliers = await Supplier.find(query).sort({ name: 1 }).lean();
  return suppliers.map((s) => ({ ...s, id: s._id.toString() }));
}

export async function getSupplierById(id, shopId) {
  const supplier = await Supplier.findOne({ _id: id, shop: shopId }).lean();
  return supplier ? { ...supplier, id: supplier._id.toString() } : null;
}

export async function createSupplier(data) {
  const supplier = await Supplier.create({
    name: data.name,
    phone: data.phone || undefined,
    email: data.email || undefined,
    address: data.address || undefined,
    notes: data.notes || undefined,
    shop: data.shopId,
  });
  return { ...supplier.toObject(), id: supplier._id.toString() };
}

export async function updateSupplier(id, data) {
  const update = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.phone !== undefined) update.phone = data.phone;
  if (data.email !== undefined) update.email = data.email;
  if (data.address !== undefined) update.address = data.address;
  if (data.notes !== undefined) update.notes = data.notes;

  const supplier = await Supplier.findOneAndUpdate({ _id: id, shop: data.shopId }, update, { new: true });
  return supplier ? { ...supplier.toObject(), id: supplier._id.toString() } : null;
}

export async function deleteSupplier(id, shopId) {
  const result = await Supplier.findOneAndDelete({ _id: id, shop: shopId });
  return result;
}
