import Customer from '../models/Customer.js';

export async function getAllCustomers(search = '') {
  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      }
    : {};
  const customers = await Customer.find(query).sort({ name: 1 }).lean();
  return customers.map((c) => ({ ...c, id: c._id.toString() }));
}

export async function getCustomerById(id) {
  const customer = await Customer.findById(id).lean();
  return customer ? { ...customer, id: customer._id.toString() } : null;
}

export async function createCustomer(data) {
  const customer = await Customer.create({
    name: data.name,
    phone: data.phone || undefined,
    email: data.email || undefined,
    address: data.address || undefined,
    notes: data.notes || undefined,
  });
  return { ...customer.toObject(), id: customer._id.toString() };
}

export async function updateCustomer(id, data) {
  const update = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.phone !== undefined) update.phone = data.phone;
  if (data.email !== undefined) update.email = data.email;
  if (data.address !== undefined) update.address = data.address;
  if (data.notes !== undefined) update.notes = data.notes;

  const customer = await Customer.findByIdAndUpdate(id, update, { new: true });
  return customer ? { ...customer.toObject(), id: customer._id.toString() } : null;
}

export async function deleteCustomer(id) {
  const result = await Customer.findByIdAndDelete(id);
  return result;
}
