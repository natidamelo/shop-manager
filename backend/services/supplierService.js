import Supplier from '../models/Supplier.js';

export async function getAllSuppliers(search = '') {
  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      }
    : {};
  const suppliers = await Supplier.find(query).sort({ name: 1 }).lean();
  return suppliers.map((s) => ({ ...s, id: s._id.toString() }));
}

export async function getSupplierById(id) {
  const supplier = await Supplier.findById(id).lean();
  return supplier ? { ...supplier, id: supplier._id.toString() } : null;
}

export async function createSupplier(data) {
  const supplier = await Supplier.create({
    name: data.name,
    phone: data.phone || undefined,
    email: data.email || undefined,
    address: data.address || undefined,
    notes: data.notes || undefined,
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

  const supplier = await Supplier.findByIdAndUpdate(id, update, { new: true });
  return supplier ? { ...supplier.toObject(), id: supplier._id.toString() } : null;
}

export async function deleteSupplier(id) {
  const result = await Supplier.findByIdAndDelete(id);
  return result;
}
