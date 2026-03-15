import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            required: true,
            default: 'Other'
        },
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        description: { type: String },
        created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    },
    { timestamps: true, toJSON: { virtuals: true } }
);

expenseSchema.virtual('id').get(function () {
    return this._id.toString();
});

export default mongoose.model('Expense', expenseSchema);
