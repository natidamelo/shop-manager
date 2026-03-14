import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  product_name: { type: String },
  quantity: { type: Number, required: true },
  unit_price: { type: Number, required: true },
  unit_cost: { type: Number, required: true, default: 0 },
  subtotal: { type: Number, required: true },
});

const paymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    method: { type: String, default: 'cash', enum: ['cash', 'card', 'transfer', 'other'] },
    note: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const saleSchema = new mongoose.Schema(
  {
    sale_number: { type: String, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    total_amount: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    amount_paid: { type: Number, default: 0 },
    payment_status: {
      type: String,
      default: 'paid',
      enum: ['paid', 'partial', 'unpaid'],
    },
    status: { type: String, default: 'completed', enum: ['pending', 'completed', 'cancelled'] },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
    items: [saleItemSchema],
    payments: [paymentSchema],
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

saleSchema.virtual('id').get(function () {
  return this._id.toString();
});
saleSchema.virtual('customer_id').get(function () {
  return this.customer?.toString() || null;
});
saleSchema.virtual('balance_due').get(function () {
  return Math.max(0, (this.total_amount || 0) - (this.amount_paid || 0));
});

export default mongoose.model('Sale', saleSchema);
