const { Pool } = require('pg');

// Khởi tạo kết nối PostgreSQL / Supabase
// Anh có thể thay đổi connectionString hoặc dùng các biến môi trường process.env.DATABASE_URL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/angiang_shipping',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Kiểm tra kết nối cơ sở dữ liệu
pool.connect((err, client, release) => {
    if (err) {
        console.error('Lỗi kết nối cơ sở dữ liệu PostgreSQL:', err.stack);
    } else {
        console.log('Kết nối cơ sở dữ liệu thành công!');
        release();
    }
});

/**
 * Khởi tạo các bảng dữ liệu nếu chưa tồn tại
 */
async function initDatabase() {
    const queryText = `
        -- 1. Bảng Quản lý Người dùng hệ thống
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            fullname VARCHAR(100) NOT NULL,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'admin',
            status VARCHAR(20) DEFAULT 'Hoạt động',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 2. Bảng Quản lý Tàu & Đội tàu
        CREATE TABLE IF NOT EXISTS ships (
            id SERIAL PRIMARY KEY,
            ship_name VARCHAR(100) NOT NULL,
            capacity DECIMAL(10, 2),
            horsepower VARCHAR(50),
            status VARCHAR(50) DEFAULT 'Đang hoạt động',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 3. Bảng Khách hàng & Doanh nghiệp đối tác
        CREATE TABLE IF NOT EXISTS customers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            contact_info TEXT NOT NULL,
            project_link VARCHAR(255),
            status VARCHAR(50) DEFAULT 'Hoạt động',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 4. Bảng Đơn hàng vận tải
        CREATE TABLE IF NOT EXISTS transport_orders (
            id SERIAL PRIMARY KEY,
            customer_id INT REFERENCES customers(id),
            ship_id INT REFERENCES ships(id),
            cargo_details TEXT,
            route VARCHAR(150),
            price DECIMAL(15, 2),
            order_status VARCHAR(50) DEFAULT 'Đang thực hiện',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 5. Bảng Tài chính (Thu / Chi)
        CREATE TABLE IF NOT EXISTS financials (
            id SERIAL PRIMARY KEY,
            type VARCHAR(20) NOT NULL, -- 'Thu' hoặc 'Chi'
            category VARCHAR(100), -- 'Nhiên liệu', 'Cảng phí', 'Lương',...
            amount DECIMAL(15, 2) NOT NULL,
            description TEXT,
            transaction_date DATE DEFAULT CURRENT_DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await pool.query(queryText);
        console.log('Đã khởi tạo và kiểm tra cấu trúc các bảng thành công.');
    } catch (error) {
        console.error('Lỗi khi khởi tạo bảng cơ sở dữ liệu:', error);
    }
}

// Tự động chạy hàm khởi tạo bảng khi import module
initDatabase();

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};