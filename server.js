const express = require('express');
const path = require('path');
const db = require('./database'); // Kết nối từ file database.js (SQLite)

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware phân tích dữ liệu JSON và URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// CẤU HÌNH THƯ MỤC TĨNH (STATIC FOLDERS)
// ==========================================
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));


// ==========================================
// 1. CÁC ĐỊNH TUYẾN GIAO DIỆN (FRONTEND ROUTES)
// ==========================================

// Trang chủ (index.html nằm trong public hoặc thư mục gốc tùy cấu trúc của anh)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Trang đăng nhập (Hỗ trợ cả /login và /login.html trỏ chuẩn về file login.html)
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Trang Trung tâm điều hành (Dashboard Hub)
app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Phân hệ Quản lý Tàu & Đội tàu
app.get('/admin-ships.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-ships.html'));
});

// Phân hệ Quản lý Dịch vụ & Đơn hàng
app.get('/admin-services.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-services.html'));
});

// Phân hệ Quản lý Tài chính
app.get('/admin-finance.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-finance.html'));
});

// Phân hệ Quản lý Người dùng
app.get('/admin-users.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-users.html'));
});


// ==========================================
// 2. CÁC API BACKEND XỬ LÝ DỮ LIỆU (DATABASE APIS)
// ==========================================

// --- API QUẢN LÝ TÀU ---
app.get('/api/ships', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM ships ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/ships', async (req, res) => {
    const { ship_name, capacity, horsepower, status, notes } = req.body;
    try {
        const queryText = `INSERT INTO ships (ship_name, capacity, horsepower, status, notes) VALUES ($1, $2, $3, $4, $5)`;
        const result = await db.query(queryText, [ship_name, capacity, horsepower, status, notes]);
        res.json({ success: true, id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- API QUẢN LÝ KHÁCH HÀNG ---
app.get('/api/customers', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM customers ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/customers', async (req, res) => {
    const { name, contact_info, project_link, status } = req.body;
    try {
        const queryText = `INSERT INTO customers (name, contact_info, project_link, status) VALUES ($1, $2, $3, $4)`;
        const result = await db.query(queryText, [name, contact_info, project_link, status]);
        res.json({ success: true, id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- API TÀI CHÍNH (THU / CHI) ---
app.get('/api/financials', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM financials ORDER BY transaction_date DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/financials', async (req, res) => {
    const { type, category, amount, description, transaction_date } = req.body;
    try {
        const queryText = `INSERT INTO financials (type, category, amount, description, transaction_date) VALUES ($1, $2, $3, $4, $5)`;
        const result = await db.query(queryText, [type, category, amount, description, transaction_date || new Date().toISOString()]);
        res.json({ success: true, id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- API QUẢN LÝ NGƯỜI DÙNG ---
app.get('/api/users', async (req, res) => {
    try {
        const result = await db.query('SELECT id, fullname, username, role, status, created_at FROM users ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ==========================================
// 3. KHỞI ĐỘNG SERVER
// ==========================================
app.listen(PORT, () => {
    console.log(`Hệ thống đang vận hành tại địa chỉ: http://localhost:${PORT}`);
});