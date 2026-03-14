import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        shopName: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data } = await authAPI.register(formData);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/');
            window.location.reload(); // Refresh to update layout state
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Create Your Shop</h1>
                    <p className="text-slate-400">Join ShopManager and start selling</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Your Name</label>
                        <input
                            type="text"
                            name="name"
                            required
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Shop Name</label>
                        <input
                            type="text"
                            name="shopName"
                            required
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="My Awesome Shop"
                            value={formData.shopName}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            required
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            required
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-indigo-500/30 disabled:opacity-50 mt-4"
                    >
                        {loading ? 'Creating Shop...' : 'Create Account'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-400">
                    Already have a shop?{' '}
                    <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                        Log in
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
