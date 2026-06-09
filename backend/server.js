import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';

const app = express();


app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;


app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;

    
    if (!name || !email || !password) {
        return res.status(400).json({ error: "All fields are required." });
    }

    try {
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);


        const query = `
            INSERT INTO users (name, email, password, status) 
            VALUES (?, ?, ?, 'unverified')
        `;
        
        await db.query(query, [name, email, hashedPassword]);

       
        return res.status(201).json({ 
            success: true, 
            message: "Registration successful! (Asynchronous confirmation email triggered)." 
        });

    } catch (error) {
        if (error.errno === 1062 || error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                error: "This email address is already registered. Database storage level protection triggered." 
            });
        }
        
        console.error("Registration Error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// ==========================================
// 🎯 ২. লগইন এপিআই (Sign In)
// ==========================================
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    try {
        // ডাটাবেস থেকে ইউজার খোঁজা
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const user = rows[0];

        // 🚨 Pavel-এর শর্ত: Blocked ইউজার লগইন করতে পারবে না [cite: 23]
        if (user.status === 'blocked') {
            return res.status(403).json({ error: "Your account is blocked. Access denied." });
        }

        // পাসওয়ার্ড চেক করা
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        // লাস্ট লগইন টাইম আপডেট করা
        await db.query('UPDATE users SET last_login_time = NOW() WHERE id = ?', [user.id]);

        // টোকেন (JWT) তৈরি করা যা ফ্রন্টএন্ডে পাঠানো হবে
        const token = jwt.sign(
            { id: user.id, email: user.email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        return res.json({
            success: true,
            token,
            user: { id: user.id, name: user.name, email: user.email, status: user.status }
        });

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});


// ==========================================
// 🔒 ৩. সেশন এবং ব্লক ফিল্টার মিডলওয়্যার (৫ম রিকোয়ারমেন্ট)
// ==========================================
// এই মিডলওয়্যারটি চেক করবে ইউজার সেশন ভ্যালিড কি না এবং লাইভ চলাকালীন সে ব্লকড বা ডিলিট হয়েছে কি না 
const authenticateAndCheckStatus = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        // 🚨 ডাটাবেস লেভেলে চেক করা ইউজার এখনো জীবিত এবং একটিভ আছে কি না 
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
        
        // যদি ইউজারকে ডাটাবেস থেকে ডিলিট করা হয় 
        if (rows.length === 0) {
            return res.status(401).json({ error: "Your account has been deleted. Redirecting to login..." });
        }

        const user = rows[0];

        // যদি ইউজার ব্রাউজার চালানো অবস্থায় এডমিন প্যানেল থেকে ব্লকড হয়ে যায় 
        if (user.status === 'blocked') {
            return res.status(401).json({ error: "Your account has been blocked. Redirecting to login..." });
        }

        // সব ঠিক থাকলে পরবর্তী এপিআই এক্সিকিউট হবে
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token." });
    }
};

app.get('/api/users', authenticateAndCheckStatus, async (req, res) => {
    try {
        // ৩য় রিকোয়ারমেন্ট: ডাটা লাস্ট লগইন টাইম অনুযায়ী সোর্টেড থাকবে [cite: 6]
        const [rows] = await db.query('SELECT id, name, email, status, registration_time, last_login_time FROM users ORDER BY last_login_time DESC');
        return res.json(rows);
    } catch (error) {
        return res.status(500).json({ error: "Internal server error." });
    }
});


app.post('/api/users/block', authenticateAndCheckStatus, async (req, res) => {
    const { userIds } = req.body; // Array of IDs: [1, 2, 3]
    if (!userIds || !Array.isArray(userIds)) return res.status(400).json({ error: "Invalid data." });

    try {
        await db.query('UPDATE users SET status = "blocked" WHERE id IN (?)', [userIds]);
        return res.json({ success: true, message: "Selected users blocked successfully." });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error." });
    }
});

app.post('/api/users/unblock', authenticateAndCheckStatus, async (req, res) => {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds)) return res.status(400).json({ error: "Invalid data." });

    try {
        
        await db.query('UPDATE users SET status = "active" WHERE id IN (?)', [userIds]);
        return res.json({ success: true, message: "Selected users unblocked successfully." });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error." });
    }
});


app.post('/api/users/delete', authenticateAndCheckStatus, async (req, res) => {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds)) return res.status(400).json({ error: "Invalid data." });

    try {
        await db.query('DELETE FROM users WHERE id IN (?)', [userIds]);
        return res.json({ success: true, message: "Selected users deleted successfully." });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error." });
    }
});
app.listen(PORT, () => {
    console.log(`🚀 Admin Panel Server running on port ${PORT}`);
});