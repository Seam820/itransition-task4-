import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'react-serif'; // অথবা আপনার প্রজেক্টের স্বাভাবিক axios ইমপোর্ট রাখুন
import axiosActual from 'axios'; 
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // ✅ ফিক্স: লোডিং স্টেট যোগ করা হলো
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        // ⚠️ এটি অত্যন্ত জরুরি! ফর্ম সাবমিট হলে পেজ রিলোড বা রিফ্রেশ হওয়া আটকাবে
        e.preventDefault(); 
        
        setError(""); // আগের কোনো এরর থাকলে তা পরিষ্কার করুন
        setLoading(true);

        try {
            // ✅ ফিক্স: সরাসরি email, password এর বদলে formData থেকে পাঠানো হলো
            const response = await axiosActual.post("https://itransition-task4-backend-bey2.onrender.com/api/auth/login", {
                email: formData.email,
                password: formData.password
            });

            if (response.data.success) {
                // আপনার AuthContext এর লগইন মেথড বা টোকেন স্টোরেজ রান করুন
                if (login) {
                    login(response.data.token, response.data.user);
                } else {
                    localStorage.setItem("token", response.data.token);
                }
                // সফল হলে ড্যাশবোর্ডে নিয়ে যাবে
                navigate('/');
            }
        } catch (err) {
            console.error("Login error details:", err);
            
            // 🚀 ব্যাকএন্ডের পাঠানো আসল এরর মেসেজটি স্টেটে সেট করা হচ্ছে যা স্ক্রিনে আটকে থাকবে
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error); // এখানে "Your account is blocked. Access denied." সেট হবে
            } else {
                setError("Invalid email or password. Please try again.");
            }
        } finally {
            setLoading(false); // লোডিং বন্ধ হবে কিন্তু এরর মেসেজ স্ক্রিনেই রয়ে যাবে
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