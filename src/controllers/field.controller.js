const pool = require("../db/db");


exports.createField = async (req, res) => {
  const {
    name,
    address,
    contact,
    description,
    open,
    close,
    id_type_field,
    id_type_sport,
    id_location,
    amount_available,
    status = "available",
  } = req.body;

  console.log("REQ BODY:", req.body);

  if (
    !name ||
    !address ||
    !contact ||
    !id_type_field ||
    !id_type_sport ||
    !id_location ||
    amount_available === undefined ||
    !open ||
    !close
  ) {
    return res.status(400).json({ error: "Missing required field(s)" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO fields 
       (name, address, contact, description, open, close, id_type_field, id_type_sport, id_location, amount_available, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5::time,$6::time,$7,$8,$9,$10,$11,NOW(),NOW())
       RETURNING *`,
      [
        name,
        address,
        contact,
        description,
        open,
        close,
        id_type_field,
        id_type_sport,
        id_location,
        amount_available,
        status,
      ]
    );

    res.status(200).json({ message: "SUCCESS", field: result.rows[0] });
  } catch (error) {
    console.error("ERROR QUERY:", error);
    res.status(500).json({ error: "Lỗi server", detail: error.message });
  }
};
