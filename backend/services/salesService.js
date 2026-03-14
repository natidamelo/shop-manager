import mongoose from 'mongoose';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';

function generateSaleNumber() {
  return `SALE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function derivePaymentStatus(totalAmount, amountPaid) {
  if (amountPaid <= 0) return 'unpaid';
  if (amountPaid >= totalAmount) return 'paid';
  return 'partial';
}

function formatSale(s) {
  return {
    ...s,
    id: s._id.toString(),
    customer_id: s.customer?._id?.toString() || null,
    customer_name: s.customer?.name || null,
    customer_phone: s.customer?.phone || null,
    customer_email: s.customer?.email || null,
    created_at: s.createdAt,
    balance_due: Math.max(0, (s.total_amount || 0) - (s.amount_paid || 0)),
    payments: (s.payments || []).map((p) => ({
      ...p,
      id: p._id?.toString(),
      created_at: p.createdAt,
    })),
  };
}

export async function getAllSales(filters = {}) {
  const query = {};
  if (filters.from) query.createdAt = { $gte: new Date(filters.from) };
  if (filters.to) {
    query.createdAt = query.createdAt || {};
    query.createdAt.$lte = new Date(filters.to);
  }
  if (filters.customerId) query.customer = new mongoose.Types.ObjectId(filters.customerId);
  if (filters.paymentStatus) query.payment_status = filters.paymentStatus;

  const sales = await Sale.find(query)
    .populate('customer', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return sales.map((s) => ({
    ...s,
    id: s._id.toString(),
    customer_id: s.customer?._id?.toString() || null,
    customer_name: s.customer?.name || null,
    created_at: s.createdAt,
    balance_due: Math.max(0, (s.total_amount || 0) - (s.amount_paid || 0)),
  }));
}

export async function getSaleById(id) {
  const sale = await Sale.findById(id)
    .populate('customer', 'name phone email')
    .lean();
  if (!sale) return null;

  const items = (sale.items || []).map((i) => ({
    ...i,
    id: i._id?.toString(),
    product_id: i.product?.toString(),
    product_name: i.product_name,
  }));

  return formatSale({ ...sale, items });
}

export async function createSale(data, userId) {
  const saleNumber = generateSaleNumber();

  const items = [];
  for (const item of data.items || []) {
    const product = await Product.findById(item.product_id);
    if (!product) throw new Error(`Product ${item.product_id} not found`);
    items.push({
      product: item.product_id,
      product_name: product.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      unit_cost: product.cost_price || 0,
      subtotal: item.subtotal,
    });
    await Product.findByIdAndUpdate(item.product_id, {
      $inc: { stock_quantity: -item.quantity },
      $set: { updatedAt: new Date() },
    });
  }

  const totalAmount = data.total_amount ?? 0;
  const amountPaid = Math.min(data.amount_paid ?? totalAmount, totalAmount);
  const paymentStatus = derivePaymentStatus(totalAmount, amountPaid);

  // Record the initial payment if any amount was paid
  const initialPayments = amountPaid > 0
    ? [{
      amount: amountPaid,
      method: data.payment_method || 'cash',
      note: 'Initial payment',
    }]
    : [];

  const sale = await Sale.create({
    sale_number: saleNumber,
    customer: data.customer_id || undefined,
    total_amount: totalAmount,
    discount: data.discount ?? 0,
    tax: data.tax ?? 0,
    amount_paid: amountPaid,
    payment_status: paymentStatus,
    status: 'completed',
    created_by: mongoose.Types.ObjectId.isValid(userId) ? userId : undefined,
    notes: data.notes || undefined,
    items,
    payments: initialPayments,
  });

  return getSaleById(sale._id);
}

export async function addPayment(saleId, paymentData) {
  const sale = await Sale.findById(saleId);
  if (!sale) throw new Error('Sale not found');

  const paymentAmount = parseFloat(paymentData.amount);
  if (!paymentAmount || paymentAmount <= 0) throw new Error('Payment amount must be greater than 0');

  const newAmountPaid = Math.min(
    (sale.amount_paid || 0) + paymentAmount,
    sale.total_amount
  );
  const paymentStatus = derivePaymentStatus(sale.total_amount, newAmountPaid);

  sale.payments.push({
    amount: paymentAmount,
    method: paymentData.method || 'cash',
    note: paymentData.note || undefined,
  });
  sale.amount_paid = newAmountPaid;
  sale.payment_status = paymentStatus;

  await sale.save();
  return getSaleById(sale._id);
}
