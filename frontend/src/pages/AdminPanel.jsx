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
            setError(err.response?.data?.error || 'Failed to fetch users or session expired.');
            setTimeout(() => logout(), 2000);
        }
    };

    useEffect(() => {
        if (token) {
            fetchUsers();
        }
    }, [token]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = users.map((user) => user.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectUser = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter((item) => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBlock = async () => {
        if (selectedIds.length === 0) return;
        setError('');
        try {
            await axios.post('https://itransition-task4-backend-bey2.onrender.com/api/users/block', { userIds: selectedIds }, config);
            setSelectedIds([]);
            await fetchUsers(); // টেবিল রিফ্রেশ হবে (নিজেকে ব্লক করলে মিডলওয়্যার 403 দিয়ে কিকআউট করবে)
        } catch (err) {
            setError(err.response?.data?.error || 'Action failed.');
        }
    };

    const handleUnblock = async () => {
        if (selectedIds.length === 0) return;
        setError('');
        try {
            await axios.post('https://itransition-task4-backend-bey2.onrender.com/api/users/unblock', { userIds: selectedIds }, config);
            setSelectedIds([]);
            await fetchUsers();
        } catch (err) {
            setError(err.response?.data?.error || 'Action failed.');
        }
    };

    const handleDelete = async () => {
        if (selectedIds.length === 0) return;
        setError('');
        if (!window.confirm('Are you sure you want to delete selected users?')) return;
        try {
            await axios.post('https://itransition-task4-backend-bey2.onrender.com/api/users/delete', { userIds: selectedIds }, config);
            setSelectedIds([]);
            await fetchUsers();
        } catch (err) {
            setError(err.response?.data?.error || 'Action failed.');
        }
    };

    const handleDeleteUnverified = async () => {
        setError('');
        if (!window.confirm('Are you sure you want to delete all unverified users?')) return;
        try {
            await axios.post('https://itransition-task4-backend-bey2.onrender.com/api/users/delete-unverified', {}, config);
            await fetchUsers();
        } catch (err) {
            setError(err.response?.data?.error || 'Action failed.');
        }
    };

    return (
        <div className="container-fluid px-4 py-3">
            <header className="d-flex justify-content-between align-items-center pb-2 mb-4 border-bottom">
                <span className="fs-5 text-secondary fw-semibold">User Management Admin</span>
                <button className="btn btn-outline-danger btn-sm" onClick={logout} style={{ borderRadius: '2px' }}>
                    <i className="bi bi-box-arrow-right me-1"></i> Logout
                </button>
            </header>

            {error && <div className="alert alert-danger py-2 small">{error}</div>}

            <div className="bg-white p-2 border mb-3 d-flex align-items-center gap-2 shadow-sm" style={{ borderRadius: '4px' }}>
                <button className="btn btn-danger btn-sm px-3" onClick={handleBlock} disabled={selectedIds.length === 0} style={{ borderRadius: '2px' }}>Block</button>
                <button className="btn btn-light btn-sm border" onClick={handleUnblock} disabled={selectedIds.length === 0} style={{ borderRadius: '2px' }}><i className="bi bi-unlock-fill text-success"></i></button>
                <button className="btn btn-light btn-sm border" onClick={handleDelete} disabled={selectedIds.length === 0} style={{ borderRadius: '2px' }}><i className="bi bi-trash-fill text-danger"></i></button>
                
                <button className="btn btn-outline-warning btn-sm ms-auto" onClick={handleDeleteUnverified} style={{ borderRadius: '2px' }}>
                    <i className="bi bi-person-x-fill me-1"></i> Delete Unverified
                </button>

                {selectedIds.length > 0 && <span className="text-muted small ms-2">{selectedIds.length} selected</span>}
            </div>

            <div className="table-responsive bg-white border shadow-sm" style={{ borderRadius: '4px' }}>
                <table className="table table-hover table-striped mb-0 align-middle small">
                    <thead className="table-light border-bottom">
                        <tr>
                            <th style={{ width: '40px' }} className="ps-3">
                                <input type="checkbox" className="form-check-input" onChange={handleSelectAll} checked={users.length > 0 && selectedIds.length === users.length} />
                            </th>
                            <th>Name</th>
                            <th>E-mail</th>
                            <th>Last Login</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr><td colSpan="5" className="text-center text-muted py-4">No users found.</td></tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id}>
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