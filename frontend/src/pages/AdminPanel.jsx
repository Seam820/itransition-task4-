import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminPanel = () => {
    const { token, logout } = useAuth(); 
    const [users, setUsers] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [error, setError] = useState('');

    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };

    const fetchUsers = async () => {
        if (!token) return;
        try {
            const response = await axios.get('https://itransition-task4-backend-bey2.onrender.com/api/users', config);
            
            const sortedUsers = response.data.sort((a, b) => {
                return new Date(b.last_login_time || 0) - new Date(a.last_login_time || 0);
            });
            
            setUsers(sortedUsers);
        } catch (err) {
            console.error("Fetch users error:", err);
            setError(err.response?.data?.error || 'Failed to fetch users.');
            
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

    const handleSelectUser = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(userId => userId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.length === users.length && users.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(users.map(user => user.id));
        }
    };

    const handleBlock = async () => {
        if (selectedIds.length === 0) return;
        try {
            setError('');
            await axios.post('https://itransition-task4-backend-bey2.onrender.com/api/users/block', { userIds: selectedIds }, config);
            setSelectedIds([]);
            await fetchUsers();
        } catch (err) {
            setError(err.response?.data?.error || 'Action failed.');
            if (err.response?.status === 403) {
                setTimeout(() => { if (logout) logout(); }, 1500);
            }
        }
    };

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

    const handleDelete = async () => {
        if (selectedIds.length === 0) return;
        // NOTE: Browser alert removed to satisfy requirement "NO BROWSER ALERTS"
        try {
            setError('');
            await axios.post('https://itransition-task4-backend-bey2.onrender.com/api/users/delete', { userIds: selectedIds }, config);
            setSelectedIds([]);
            await fetchUsers();
        } catch (err) {
            setError(err.response?.data?.error || 'Action failed.');
            if (err.response?.status === 403) {
                setTimeout(() => { if (logout) logout(); }, 1500);
            }
        }
    };

    // ✅ NEW: Function to delete unverified users
    const handleDeleteUnverified = async () => {
        try {
            setError('');
            await axios.post('https://itransition-task4-backend-bey2.onrender.com/api/users/delete-unverified', {}, config);
            // After deleting unverified, we should clear selections just in case
            setSelectedIds([]);
            await fetchUsers();
        } catch (err) {
            setError(err.response?.data?.error || 'Action failed.');
            if (err.response?.status === 403) {
                setTimeout(() => { if (logout) logout(); }, 1500);
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

            {/* ✅ UPDATED: Toolbar with icons and tooltips */}
            <div className="p-3 bg-white border border-bottom-0 d-flex gap-2" style={{ borderRadius: '4px 4px 0 0' }}>
                <button className="btn btn-danger btn-sm d-flex align-items-center gap-1" onClick={handleBlock} disabled={selectedIds.length === 0} style={{ borderRadius: '2px' }} title="Block selected users">
                    <i className="bi bi-lock-fill"></i> Block
                </button>
                <button className="btn btn-light btn-sm border d-flex align-items-center justify-content-center text-success" onClick={handleUnblock} disabled={selectedIds.length === 0} style={{ borderRadius: '2px', width: '32px' }} title="Unblock selected users">
                    <i className="bi bi-unlock-fill"></i>
                </button>
                <button className="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center" onClick={handleDelete} disabled={selectedIds.length === 0} style={{ borderRadius: '2px', width: '32px' }} title="Delete selected users">
                    <i className="bi bi-trash-fill"></i>
                </button>
                
                {/* Delete Unverified Button (Pushed to the right using ms-auto) */}
                <button className="btn btn-outline-warning btn-sm d-flex align-items-center justify-content-center ms-auto text-dark" onClick={handleDeleteUnverified} style={{ borderRadius: '2px', width: '32px' }} title="Delete unverified users">
                    <i className="bi bi-person-x-fill"></i>
                </button>
            </div>

            <div className="table-responsive border" style={{ borderRadius: '0 0 4px 4px', backgroundColor: '#fff' }}>
                <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light text-muted">
                        <tr>
                            <th className="ps-3" style={{ width: '40px' }}>
                                <input type="checkbox" className="form-check-input" onChange={handleSelectAll} checked={users.length > 0 && selectedIds.length === users.length} title="Select All / Deselect All"/>
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
                                            String(user.status).toLowerCase() === 'unverified' ? 'bg-warning-subtle text-dark' : 'bg-success-subtle text-success'
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