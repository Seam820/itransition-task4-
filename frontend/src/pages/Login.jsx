import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
        
            const response = await axios.post('https://itransition-backend-fsn3.onrender.com/api/auth/login', formData);
            
            if (response.data.success) {
                login(response.data.user, response.data.token);
                navigate('/'); 
            }
        } catch (err) {
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error);
            } else {
                setError('Invalid credentials or server error.');
            }
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center min-vh-100">
            <div className="card p-4 shadow-sm" style={{ width: '100%', maxWidth: '400px', borderRadius: '4px' }}>
                <h3 className="text-center mb-3 text-secondary fw-normal">Welcome back</h3>
                <h5 className="text-center mb-4 text-muted small">Sign In to Your Account</h5>

                {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label small text-muted">E-mail</label>
                        <input type="email" name="email" className="form-control form-control-sm" value={formData.email} onChange={handleChange} required style={{ borderRadius: '2px' }} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label small text-muted">Password</label>
                        <input type="password" name="password" className="form-control form-control-sm" value={formData.password} onChange={handleChange} required style={{ borderRadius: '2px' }} />
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm w-100 mt-2" style={{ borderRadius: '2px' }}>Sign In</button>
                </form>
                <div className="text-center mt-3 small">
                    <span className="text-muted">Don't have an account? </span>
                    <Link to="/register" className="text-decoration-none">Sign Up</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
