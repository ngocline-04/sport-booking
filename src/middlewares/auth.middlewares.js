const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: "Missing token" });

  // Bearer <token>
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: "Invalid token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Lưu info user vào req
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};