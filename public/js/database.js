const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Tạo file cơ sở dữ liệu SQLite trong thư mục dự án
const dbFile = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Lỗi kết nối SQLite:', err.message);
    } else {
        console.log('Đã kết nối cơ sở dữ liệu SQLite thành công tại:', dbFile);
    }
});

/**
 * Khởi tạo các bảng dữ liệu cho hệ thống quản trị nếu chưa tồn tại
 */
function initDatabase() {
    db.serialize(() => {
        // 1. Bảng Quản lý Người dùng hệ thống
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullname TEXT NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'admin',
            status TEXT DEFAULT 'Hoạt động',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 2. Bảng Quản lý Tàu & Đội tàu
        db.run(`CREATE TABLE IF NOT EXISTS ships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ship_name TEXT NOT NULL,
            capacity DECIMAL,
            horsepower TEXT,
            status TEXT DEFAULT 'Đang hoạt động',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 3. Bảng Khách hàng & Doanh nghiệp đối tác
        db.run(`CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contact_info TEXT NOT NULL,
            project_link TEXT,
            status TEXT DEFAULT 'Hoạt động',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`);

        // 4. Bảng Đơn hàng vận tải
        db.run(`CREATE TABLE IF NOT EXISTS transport_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            ship_id INTEGER,
            cargo_details TEXT,
            route TEXT,
            price DECIMAL,
            order_status TEXT DEFAULT 'Đang thực hiện',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(customer_id) REFERENCES customers(id),
            FOREIGN KEY(ship_id) REFERENCES ships(id)
        )`);

        // 5. Bảng Tài chính (Thu / Chi)
        db.run(`CREATE TABLE IF NOT EXISTS financials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            category TEXT,
            amount DECIMAL,
            description TEXT,
            transaction_date DATE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    });
}

// Chạy khởi tạo bảng
initDatabase();

/**
 * Hàm truy vấn chuẩn hóa tương thích ngược với câu lệnh async/await của PostgreSQL
 * Giúp file server.js không cần phải sửa đổi lại cấu trúc gọi database.query()
 */
module.exports = {
    query: (text, params = []) => {
        return new Promise((resolve, reject) => {
            // Chuyển đổi cú pháp tham số $1, $2, $3 của Postgres thành dấu hỏi chấm ? của SQLite
            let sqliteText = text.replace(/\$\d+/g, '?');
            
            const lowerQuery = text.trim().toLowerCase();
            if (lowerQuery.startsWith('select')) {
                db.all(sqliteText, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve({ rows });
                });
            } else {
                db.run(sqliteText, params, function(err) {
                    if (err) reject(err);
                    else {
                        // Trả về cấu trúc giả lập kết quả trả về của pg (rowCount và insertId)
                        resolve({ 
                            rows: [{ id: this.lastID }], 
                            rowCount: this.changes 
                        });
                    }
                });
            }
        });
    }
};