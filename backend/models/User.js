import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, default: 'admin', enum: ['admin', 'manager', 'staff'] },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);
userSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.model('User', userSchema);
