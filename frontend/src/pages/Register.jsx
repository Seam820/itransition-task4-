import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            
            const response = await axios.post('http://localhost:5000/api/auth/register', formData);
            
            if (response.data.success) {
                setSuccess(response.data.message);
                setFormData({ name: '', email: '', password: '' });
                
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (err) {
            
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error);
            } else {
                setError('Something went wrong. Please try again.');
            }
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center min-vh-100">
            <div className="card p-4 shadow-sm" style={{ width: '100%', maxWidth: '400px', borderRadius: '4px' }}>
                <h3 className="text-center mb-3 text-secondary fw-normal">Start your journey</h3>
                <h5 className="text-center mb-4 text-muted small">Sign Up to The App</h5>

                {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}
                {success && <div className="alert alert-success py-2 small" role="alert">{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label small text-muted">Full Name</label>
                        <input type="text" name="name" className="form-control form-control-sm" value={formData.name} onChange={handleChange} required style={{ borderRadius: '2px' }} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label small text-muted">E-mail</label>
                        <input type="email" name="email" className="form-control form-control-sm" value={formData.email} onChange={handleChange} required style={{ borderRadius: '2px' }} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label small text-muted">Password</label>
                        <input type="password" name="password" className="form-control form-control-sm" value={formData.password} onChange={handleChange} required style={{ borderRadius: '2px' }} />
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm w-100 mt-2" style={{ borderRadius: '2px' }}>Sign Up</button>
                </form>
                <div className="text-center mt-3 small">
                    <span className="text-muted">Already have an account? </span>
                    <Link to="/login" className="text-decoration-none">Sign In</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;