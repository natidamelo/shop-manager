import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
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
customerSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.model('Customer', customerSchema);
