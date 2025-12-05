const pool = require("../db/db");

exports.getListFields = async (req, res) => {
  try {
    let {
      search = "",
      page = 1,
      limit = 10,
      id_type_field,
      id_type_sport,
      id_location,
    } = req.query;

    const offset = (page - 1) * limit;

    // Convert empty strings or non-numbers thành null
    id_type_field = id_type_field ? parseInt(id_type_field) : null;
    id_type_sport = id_type_sport ? parseInt(id_type_sport) : null;
    id_location = id_location ? parseInt(id_location) : null;

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
      WHERE LOWER(f.name) LIKE LOWER($1)
        ${id_type_field ? "AND f.id_type_field = $4" : ""}
        ${id_type_sport ? "AND f.id_type_sport = $5" : ""}
        ${id_location ? "AND f.id_location = $6" : ""}
      ORDER BY f.id DESC
      LIMIT $2 OFFSET $3
    `;

    const params = [`%${search}%`, limit, offset];

    if (id_type_field) params.push(id_type_field);
    if (id_type_sport) params.push(id_type_sport);
    if (id_location) params.push(id_location);

    const result = await pool.query(query, params);

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
        id_price = COALESCE($10, id_price),
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
      id_price,
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

    res.json({
      success: true,
      message: "Field deleted (soft)",
      data: result.rows[0],
    });
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

exports.listTypesFields = async (req, res) => {
  try {
    const fieldTypes = pool.query(`SELECT * FROM field_types ORDER BY id ASC`);
    if (!fieldTypes)
      return res.status(404).json({ message: "No field types found" });

    res.json({ success: true, data: (await fieldTypes).rows });
  } catch (error) {
    console.error("listTypesFields ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.createTypeField = async (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Missing required field: name" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO field_types (name, description, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       RETURNING *`,
      [name, description]
    );

    res.status(200).json({ message: "SUCCESS", fieldType: result.rows[0] });
  } catch (error) {
    console.error("ERROR QUERY:", error);
    res.status(500).json({ error: "Server error", detail: error.message });
  }
};

exports.updateFieldType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!id) return res.status(400).json({ message: "Missing type field id" });

    const query = `
      UPDATE field_types
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `;

    const result = await pool.query(query, [name, description, id]);

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Field type not found" });

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("updateFieldType ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteFieldType = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Missing type field id" });

    const query = `
      DELETE FROM field_types
      WHERE id = $1
      RETURNING *;
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Field type not found" });
    res.json({
      success: true,
      message: "Field type deleted",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("deleteFieldType ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.listTypesSports = async (req, res) => {
  try {
    const sportTypes = pool.query(`SELECT * FROM sport_types ORDER BY id ASC`);
    if (!sportTypes)
      return res.status(404).json({ message: "No sport types found" });

    res.json({ success: true, data: (await sportTypes).rows });
  } catch (error) {
    console.error("listTypesSports ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.createTypeSport = async (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Missing required field: name" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO sport_types (name, description, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING *`,
      [name, description]
    );

    res.status(200).json({ message: "SUCCESS", sportType: result.rows[0] });
  } catch (error) {
    console.error("ERROR QUERY:", error);
    res.status(500).json({ error: "Server error", detail: error.message });
  }
};

exports.updateSportType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!id) return res.status(400).json({ message: "Missing type sport id" });

    const query = `
      UPDATE sport_types
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `;

    const result = await pool.query(query, [name, description, id]);

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Sport type not found" });

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("updateSportType ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteSportType = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Missing type sport id" });

    const query = `
      DELETE FROM sport_types
      WHERE id = $1
      RETURNING *;
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Sport type not found" });
    res.json({
      success: true,
      message: "Sport type deleted",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("deleteSportType ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.listAvailableFields = async (req, res) => {
  try {
    const { date, id_schedule } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Missing date parameter" });
    }

    let query = `
  SELECT 
    f.id AS field_id,
    f.name AS field_name,
    f.address,
    f.id_type_field,
    ft.name AS field_type_name,
    f.id_type_sport,
    st.name AS sport_type_name,
    f.id_location,
    l.name AS location_name,
    sf.id AS schedule_for_field_id,
    s.time_from,
    s.time_to,
    fp.price AS price_per_hour,
    sf.amount_available - COALESCE(b.total_booked, 0) AS remaining
  FROM fields f
  JOIN field_types ft ON f.id_type_field = ft.id
  JOIN sport_types st ON f.id_type_sport = st.id
  JOIN locations l ON f.id_location = l.id
  JOIN schedule_for_field sf ON sf.id_field = f.id
  JOIN schedules s ON sf.id_schedule = s.id

  -- Lấy giá theo loại sân + thứ + khung giờ
  LEFT JOIN field_price fp 
    ON fp.id_type_field = f.id_type_field
    AND fp.day_of_week = EXTRACT(DOW FROM $1::date)
    AND s.time_from::time >= fp.start_time
    AND s.time_to::time <= fp.end_time

  -- Tính số giờ đã book  
  LEFT JOIN (
    SELECT id_field, id_schedule, SUM(hour) AS total_booked
    FROM booking
    WHERE date = $1
    GROUP BY id_field, id_schedule
  ) b ON b.id_field = f.id AND b.id_schedule = sf.id_schedule

  WHERE sf.status = 'available'
`;

    const params = [date];

    if (id_schedule) {
      query += ` AND sf.id_schedule = $2`;
      params.push(id_schedule);
    }

    query += ` ORDER BY f.name ASC`;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No available fields found" });
    }

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("listAvailableFields ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
