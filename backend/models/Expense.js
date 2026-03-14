import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            required: true,
            enum: ['Rent', 'Utilities', 'Salary', 'Marketing', 'Supplies', 'Maintenance', 'Insurance', 'Other'],
            default: 'Other'
        },
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        description: { type: String },
        created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true, toJSON: { virtuals: true } }
);

expenseSchema.virtual('id').get(function () {
    return this._id.toString();
});

export default mongoose.model('Expense', expenseSchema);
