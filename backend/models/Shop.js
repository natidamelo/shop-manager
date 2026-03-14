import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        owner_email: { type: String, required: true },
        settings: {
            currency: { type: String, default: 'USD' },
            logo_url: { type: String },
        },
    },
    { timestamps: true, toJSON: { virtuals: true } }
);

shopSchema.virtual('id').get(function () {
    return this._id.toString();
});

export default mongoose.model('Shop', shopSchema);
