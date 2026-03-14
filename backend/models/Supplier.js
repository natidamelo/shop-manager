import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    notes: { type: String },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);
supplierSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.model('Supplier', supplierSchema);
