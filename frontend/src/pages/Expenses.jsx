import { useState, useEffect, useCallback } from 'react';
import { expensesAPI } from '../services/api';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0);

const EXPENSE_CATEGORIES = ['Rent', 'Utilities', 'Salary', 'Marketing', 'Supplies', 'Maintenance', 'Insurance', 'Other'];

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [formData, setFormData] = useState({ category: 'Other', amount: '', description: '', date: new Date().toISOString().slice(0, 10) });

    const loadExpenses = useCallback(() => {
        setLoading(true);
        expensesAPI.getAll()
            .then(res => setExpenses(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        loadExpenses();
    }, [loadExpenses]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const action = editingExpense
            ? expensesAPI.update(editingExpense.id, formData)
            : expensesAPI.create(formData);

        action.then(() => {
            setShowModal(false);
            setEditingExpense(null);
            setFormData({ category: 'Other', amount: '', description: '', date: new Date().toISOString().slice(0, 10) });
            loadExpenses();
        }).catch(console.error);
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setFormData({
            category: expense.category,
            amount: expense.amount,
            description: expense.description || '',
            date: new Date(expense.date).toISOString().slice(0, 10)
        });
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            expensesAPI.delete(id).then(loadExpenses).catch(console.error);
        }
    };

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">Operational Expenses</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage your shop's daily costs and overheads</p>
                </div>
                <button
                    onClick={() => { setEditingExpense(null); setFormData({ category: 'Other', amount: '', description: '', date: new Date().toISOString().slice(0, 10) }); setShowModal(true); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <span>+</span> Add Expense
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card p-5 bg-white border-slate-200">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Expenses</p>
                    <p className="text-2xl font-bold text-slate-900">{fmt(totalExpenses)}</p>
                </div>
                <div className="card p-5 bg-white border-slate-200">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Entries</p>
                    <p className="text-2xl font-bold text-slate-900">{expenses.length}</p>
                </div>
                <div className="card p-5 bg-primary-600 text-white border-primary-700">
                    <p className="text-xs font-semibold text-primary-200 uppercase tracking-wider mb-1">Avg. per Entry</p>
                    <p className="text-2xl font-bold">{fmt(totalExpenses / (expenses.length || 1))}</p>
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="5" className="py-20 text-center text-slate-400"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mx-auto" /></td></tr>
                            ) : expenses.length === 0 ? (
                                <tr><td colSpan="5" className="py-20 text-center text-slate-400">No expenses recorded yet.</td></tr>
                            ) : (
                                expenses.map((e) => (
                                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-600">{new Date(e.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">{e.category}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{e.description || '—'}</td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">{fmt(e.amount)}</td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={() => handleEdit(e)} className="text-primary-600 hover:text-primary-800 text-sm font-medium">Edit</button>
                                            <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900">{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                <input
                                    list="expense-categories"
                                    className="input"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="Select or type category..."
                                    required
                                />
                                <datalist id="expense-categories">
                                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="input"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                                <textarea
                                    className="input min-h-[100px] py-2"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="e.g. Monthly rent for shop..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">Save Expense</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
