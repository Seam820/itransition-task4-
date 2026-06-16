import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios'; // ✅ ফিক্সড: শুধুমাত্র স্ট্যান্ডার্ড axios ইম্পোর্ট রাখা হয়েছে
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // ✅ লোডিং স্টেট সচল রাখা হলো
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        // ⚠️ ফর্ম সাবমিট হলে পেজ রিলোড হওয়া আটকাবে
        e.preventDefault(); 
        
        setError(""); // আগের এরর পরিষ্কার করুন
        setLoading(true);

        try {
            // ✅ ফিক্সড: formData থেকে ইমেইল ও পাসওয়ার্ড পাঠানো হচ্ছে
            const response = await axios.post("https://itransition-task4-backend-bey2.onrender.com/api/auth/login", {
                email: formData.email,
                password: formData.password
            });

            if (response.data.success) {
                if (login) {
                    login(response.data.token, response.data.user);
                } else {
                    localStorage.setItem("token", response.data.token);
                }
                // সফল হলে ড্যাশবোর্ডে রিডাইরেক্ট করবে
                navigate('/');
            }
        } catch (err) {
            console.error("Login error details:", err);
            
            // 🚀 ব্যাকএন্ডের পাঠানো আসল ব্লকড এরর মেসেজটি স্টেটে সেট করা হচ্ছে (যা স্ক্রিনে আটকে থাকবে)
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error); // এখানে "Your account is blocked. Access denied." সেট হবে
            } else {
                setError("Invalid email or password. Please try again.");
            }
        } finally {
            setLoading(false); // লোডিং বন্ধ হবে কিন্তু এরর মেসেজ স্ক্রিন থেকে সরবে না
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
            <div className="card p-4 shadow-sm" style={{ width: '350px', borderRadius: '4px' }}>
                <h3 className="text-center mb-1 text-secondary fw-normal">Welcome back</h3>
                <h5 className="text-center mb-4 text-muted small">Sign In to Your Account</h5>

                {/* 🚨 এরর মেসেজ অ্যালার্ট বক্স */}
                {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label small text-muted">E-mail</label>
                        <input 
                            type="email" 
                            name="email" 
                            className="form-control form-control-sm" 
                            value={formData.email} 
                            onChange={handleChange} 
                            required 
                            style={{ borderRadius: '2px' }} 
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label small text-muted">Password</label>
                        <input 
                            type="password" 
                            name="password" 
                            className="form-control form-control-sm" 
                            value={formData.password} 
                            onChange={handleChange} 
                            required 
                            style={{ borderRadius: '2px' }} 
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="btn btn-primary btn-sm w-100 mt-2" 
                        disabled={loading}
                        style={{ borderRadius: '2px' }}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
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