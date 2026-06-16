import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminPanel = () => {
    const { token, logout } = useAuth(); // AuthContext থেকে টোকেন নেওয়া হলো
    const [users, setUsers] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [error, setError] = useState('');

    // এক্সিওস রিকোয়েস্টের জন্য হেডার কনফিগারেশন
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };

    // ১. সমস্ত ইউজার ফেচ করার ফাংশন
    const fetchUsers = async () => {
        if (!token) return;
        try {
            const response = await axios.get('https://itransition-task4-backend-bey2.onrender.com/api/users', config);
            
            // লাস্ট লগইন টাইম অনুযায়ী ডিসেন্ডিং (Descending) সর্টিং
            const sortedUsers = response.data.sort((a, b) => {
                return new Date(b.last_login_time || 0) - new Date(a.last_login_time || 0);
            });
            
            setUsers(sortedUsers);
        } catch (err) {
            console.error("Fetch users error:", err);
            setError(err.response?.data?.error || 'Failed to fetch users.');
            
            // ⚠️ ফিক্স: শুধুমাত্র তখনই লগআউট করাবে যদি টোকেন ইনভ্যালিড (401) বা ইউজার নিজে ব্লকড (403) হয়।
            // সাধারণ কোনো এররের জন্য হুট করে লগআউট করিয়ে বের করে দেবে না।
            if (err.response?.status === 401 || err.response?.status === 403) {
                setTimeout(() => {
                    if (logout) logout();
                }, 2000);
            }
        }
    };

    useEffect(() => {
        if (token) {
            fetchUsers();
        }
    }, [token]);

    // চেকবক্স সিলেক্ট করার লজিক
    const handleSelectUser = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(userId => userId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.length === users.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(users.map(user => user.id));
        }
    };

    // 🚫 ব্লক ফাংশন (ফিক্সড)
    const handleBlock = async () => {
        if (selectedIds.length === 0) return;
        try {
            setError('');
            await axios.post('https://itransition-task4-backend-bey2.onrender.com/api/users/block', { userIds: selectedIds }, config);
            setSelectedIds([]);
            await fetchUsers(); // ব্লক করার পর সফলভাবে লিস্ট আপডেট হবে
        } catch (err) {
            setError(err.response?.data?.error || 'Action failed.');
            // যদি নিজে নিজেকে ব্লক করে ফেলে তবেই কেবল কিক আউট করবে
            if (err.response?.status === 403) {
                setTimeout(() => {
                    if (logout) logout();
                }, 1500);
            }
        }
    };

    // 🔓 আনব্লক ফাংশন
    const handleUnblock = async () => {
        if (selectedIds.length === 0) return;
        try {
            setError('');
            await axios.post('https://itransition-task4-backend-bey2.onrender.com/api/users/unblock', { userIds: selectedIds }, config);
            setSelectedIds([]);
            await fetchUsers();
        } catch (err) {
            setError(err.response?.data?.error || 'Action failed.');
        }
    };

    // 🗑️ ডিলিট ফাংশন
    const handleDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm("Are you sure you want to delete selected users?")) return;
        try {
            setError('');
            await axios.post('https://itransition-task4-backend-bey2.onrender.com/api/users/delete', { userIds: selectedIds }, config);
            setSelectedIds([]);
            await fetchUsers();
        } catch (err) {
            setError(err.response?.data?.error || 'Action failed.');
            if (err.response?.status === 403) {
                setTimeout(() => {
                    if (logout) logout();
                }, 1500);
            }
        }
    };

    return (
        <div className="container mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-normal text-secondary">User Management Admin Panel</h2>
                <button className="btn btn-outline-danger btn-sm" onClick={logout} style={{ borderRadius: '2px' }}>
                    Logout
                </button>
            </div>

            {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}

            {/* টুলবার */}
            <div className="p-3 bg-white border border-bottom-0 d-flex gap-2" style={{ borderRadius: '4px 4px 0 0' }}>
                <button className="btn btn-danger btn-sm d-flex align-items-center gap-1" onClick={handleBlock} disabled={selectedIds.length === 0} style={{ borderRadius: '2px' }}>
                    <i className="bi bi-lock-fill"></i> Block
                </button>
                <button className="btn btn-light btn-sm border d-flex align-items-center gap-1 text-secondary" onClick={handleUnblock} disabled={selectedIds.length === 0} style={{ borderRadius: '2px' }}>
                    <i className="bi bi-unlock-fill"></i> Unblock
                </button>
                <button className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1" onClick={handleDelete} disabled={selectedIds.length === 0} style={{ borderRadius: '2px' }}>
                    <i className="bi bi-trash-fill"></i> Delete
                </button>
            </div>

            {/* ইউজার টেবিল */}
            <div className="table-responsive border" style={{ borderRadius: '0 0 4px 4px', backgroundColor: '#fff' }}>
                <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light text-muted">
                        <tr>
                            <th className="ps-3" style={{ width: '40px' }}>
                                <input type="checkbox" className="form-check-input" onChange={handleSelectAll} checked={users.length > 0 && selectedIds.length === users.length} />
                            </th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Last Login</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center py-4 text-muted">No users found.</td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className={selectedIds.includes(user.id) ? 'table-primary-subtle' : ''}>
                                    <td className="ps-3">
                                        <input type="checkbox" className="form-check-input" onChange={() => handleSelectUser(user.id)} checked={selectedIds.includes(user.id)} />
                                    </td>
                                    <td className="fw-semibold text-secondary">{user.name}</td>
                                    <td className="text-muted">{user.email}</td>
                                    <td className="text-muted">{user.last_login_time ? new Date(user.last_login_time).toLocaleString() : 'N/A'}</td>
                                    <td>
                                        <span className={`badge px-2 py-1 fw-normal ${
                                            String(user.status).toLowerCase() === 'blocked' ? 'bg-danger-subtle text-danger' : 
                                            String(user.status).toLowerCase() === 'active' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'
                                        }`} style={{ borderRadius: '2px' }}>
                                            {user.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminPanel;