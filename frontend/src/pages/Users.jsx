import { useState, useEffect, useCallback } from 'react';
import { usersAPI } from '../services/api';

const ROLES = ['admin', 'manager', 'staff'];

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const [userFormData, setUserFormData] = useState({ name: '', email: '', role: 'staff', password: '' });
    const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });

    const loadUsers = useCallback(() => {
        setLoading(true);
        usersAPI.getAll()
            .then(res => setUsers(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleUserSubmit = (e) => {
        e.preventDefault();
        const action = selectedUser
            ? usersAPI.update(selectedUser.id, userFormData)
            : usersAPI.create(userFormData);

        action.then(() => {
            setShowUserModal(false);
            setSelectedUser(null);
            setUserFormData({ name: '', email: '', role: 'staff', password: '' });
            loadUsers();
        }).catch(err => alert(err.response?.data?.error || 'Failed to save user'));
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (passwordData.password !== passwordData.confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        usersAPI.updatePassword(selectedUser.id, passwordData.password)
            .then(() => {
                setShowPasswordModal(false);
                setPasswordData({ password: '', confirmPassword: '' });
                alert('Password updated successfully');
            })
            .catch(err => alert(err.response?.data?.error || 'Failed to update password'));
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setUserFormData({ name: user.name, email: user.email, role: user.role, password: '' }); // Password not used for update
        setShowUserModal(true);
    };

    const handleOpenPasswordModal = (user) => {
        setSelectedUser(user);
        setPasswordData({ password: '', confirmPassword: '' });
        setShowPasswordModal(true);
    };

    const handleDeleteUser = (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            usersAPI.delete(id).then(loadUsers).catch(err => alert(err.response?.data?.error || 'Failed to delete'));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">User Management</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage system access and permissions</p>
                </div>
                <button
                    onClick={() => { setSelectedUser(null); setUserFormData({ name: '', email: '', role: 'staff', password: '' }); setShowUserModal(true); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <span>+</span> Add User
                </button>
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="4" className="py-20 text-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mx-auto" /></td></tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{u.name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                                    u.role === 'manager' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                        'bg-slate-50 text-slate-600 border-slate-100'
                                                }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-3">
                                            <button onClick={() => handleEditUser(u)} className="text-primary-600 hover:text-primary-800 text-sm font-medium">Edit</button>
                                            <button onClick={() => handleOpenPasswordModal(u)} className="text-amber-600 hover:text-amber-800 text-sm font-medium">Password</button>
                                            <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Create/Edit Modal */}
            {showUserModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900">{selectedUser ? 'Edit User' : 'Add New User'}</h2>
                        </div>
                        <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input
                                    className="input"
                                    value={userFormData.name}
                                    onChange={e => setUserFormData({ ...userFormData, name: e.target.value })}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    className="input"
                                    value={userFormData.email}
                                    onChange={e => setUserFormData({ ...userFormData, email: e.target.value })}
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <select
                                    className="input"
                                    value={userFormData.role}
                                    onChange={e => setUserFormData({ ...userFormData, role: e.target.value })}
                                    required
                                >
                                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                                </select>
                            </div>
                            {!selectedUser && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Initial Password</label>
                                    <input
                                        type="password"
                                        className="input"
                                        value={userFormData.password}
                                        onChange={e => setUserFormData({ ...userFormData, password: e.target.value })}
                                        placeholder="Min 6 characters"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            )}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowUserModal(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">Save User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Password Reset Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900">Change Password</h2>
                            <p className="text-slate-500 text-sm">Update password for {selectedUser?.name}</p>
                        </div>
                        <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                <input
                                    type="password"
                                    className="input"
                                    value={passwordData.password}
                                    onChange={e => setPasswordData({ ...passwordData, password: e.target.value })}
                                    placeholder="Min 6 characters"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    className="input"
                                    value={passwordData.confirmPassword}
                                    onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    placeholder="Repeat password"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowPasswordModal(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">Update Password</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
