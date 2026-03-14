import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: { virtuals: true } }
);
categorySchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.model('Category', categorySchema);
