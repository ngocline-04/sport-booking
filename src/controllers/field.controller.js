const pool = require("../db/db");

exports.getListFields = async (req, res) => {
  try {
    const {
      search = "",
      page = 1,
      limit = 10,
      id_type_field = null,
      id_type_sport = null,
      id_location = null,
    } = req.query;

    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        f.id,
        f.name,
        f.description,
        f.open,
        f.close,
        f.amount_available,
        f.status,
        l.name AS location_name,
        ft.name AS field_type_name,
        st.name AS sport_type_name
      FROM fields f
      LEFT JOIN locations l ON f.id_location = l.id
      LEFT JOIN field_types ft ON f.id_type_field = ft.id
      LEFT JOIN sport_types st ON f.id_type_sport = st.id
      WHERE
          LOWER(f.name) LIKE LOWER($1)
          AND ($4::INT IS NULL OR f.id_type_field = $4)
          AND ($5::INT IS NULL OR f.id_type_sport = $5)
          AND ($6::INT IS NULL OR f.id_location = $6)
      ORDER BY f.id DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [
      `%${search}%`,
      limit,
      offset,
      id_type_field || null,
      id_type_sport || null,
      id_location || null,
    ]);

    res.json({
      success: true,
      data: result.rows,
    });

  } catch (error) {
    console.error("getListFields ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


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
// ========================
// Update field
// ========================
exports.updateField = async (req, res) => {
  try {
    const { id } = req.params;
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
      status,
    } = req.body;

    // Check required id
    if (!id) return res.status(400).json({ message: "Missing field id" });

    const query = `
      UPDATE fields
      SET
        name = COALESCE($1, name),
        address = COALESCE($2, address),
        contact = COALESCE($3, contact),
        description = COALESCE($4, description),
        open = COALESCE($5, open),
        close = COALESCE($6, close),
        id_type_field = COALESCE($7, id_type_field),
        id_type_sport = COALESCE($8, id_type_sport),
        id_location = COALESCE($9, id_location),
        amount_available = COALESCE($10, amount_available),
        status = COALESCE($11, status),
        updated_at = NOW()
      WHERE id = $12
      RETURNING *;
    `;

    const result = await pool.query(query, [
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
      id,
    ]);

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Field not found" });

    res.json({ success: true, data: result.rows[0] });

  } catch (err) {
    console.error("updateField ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ========================
// Soft delete field
// ========================
exports.deleteField = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Missing field id" });

    const query = `
      UPDATE fields
      SET status = 'unavailable', updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Field not found" });

    res.json({ success: true, message: "Field deleted (soft)", data: result.rows[0] });

  } catch (err) {
    console.error("deleteField ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ========================
// Get field by id
// ========================
exports.getFieldById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Missing field id" });

    const query = `
      SELECT 
        f.id,
        f.name,
        f.description,
        f.open,
        f.close,
        f.amount_available,
        f.status,
        l.name AS location_name,
        ft.name AS field_type_name,
        st.name AS sport_type_name
      FROM fields f
      LEFT JOIN locations l ON f.id_location = l.id
      LEFT JOIN field_types ft ON f.id_type_field = ft.id
      LEFT JOIN sport_types st ON f.id_type_sport = st.id
      WHERE f.id = $1;
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Field not found" });

    res.json({ success: true, data: result.rows[0] });

  } catch (err) {
    console.error("getFieldById ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

