// src/controllers/auth.controller.js
const pool = require("../db/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try {
        // Check email đã tồn tại chưa
        const existing = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: "Email đã tồn tại" });
        }

        // Hash password
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        // Insert user
        const result = await pool.query(
            `INSERT INTO users 
             (username, email, password, role_id, created_at, updated_at)
             VALUES ($1,$2,$3,1,NOW(),NOW())
             RETURNING id, username, email, role_id`,
            [username, email, hashedPassword]
        );

        res.status(201).json({ message: "Đăng ký thành công", user: result.rows[0] });
    } catch (err) {
        console.log("Insert user:", username, email);
        console.error(err);
        res.status(500).json({ error: "Lỗi server", detail: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const userResult = await pool.query(
            "SELECT id, username, email, role_id FROM users WHERE email = $1",
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: "Email không tồn tại" });
        }

        const user = userResult.rows[0];

        // Lấy password riêng (để tránh trả ra FE)
        const passCheck = await pool.query(
            "SELECT password FROM users WHERE email = $1",
            [email]
        );

        const valid = bcrypt.compareSync(password, passCheck.rows[0].password);

        if (!valid) {
            return res.status(401).json({ error: "Sai mật khẩu" });
        }

        // Tạo JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role_id: user.role_id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            message: "Đăng nhập thành công",
            token,
            user, // Trả thêm thông tin người dùng
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi server", detail: err.message });
    }
};

