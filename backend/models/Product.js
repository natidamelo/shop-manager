import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, unique: true, sparse: true },
    description: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    price: { type: Number, required: true, default: 0 },
    cost_price: { type: Number, default: 0 },
    stock_quantity: { type: Number, required: true, default: 0 },
    low_stock_threshold: { type: Number, default: 10 },
    unit: { type: String, default: 'pcs' },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);
productSchema.virtual('id').get(function () {
  return this._id.toString();
});
productSchema.virtual('category_id').get(function () {
  return this.category?.toString() || null;
});

export default mongoose.model('Product', productSchema);
