const pool = require("../config/db");

exports.createPrice = async (req, res) => {
  const { name, description, amount } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO prices (name, description, amount) VALUES ($1, $2, $3) RETURNING *",
      [name, description, amount]
    );
    res.status(201).json({ price: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

exports.listPrices = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM prices");
        res.status(200).json({ prices: result.rows });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}