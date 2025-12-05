const pool = require("../db/db");

exports.createSchedule = async (req, res) => {
  const { timeFrom, timeTo } = req.body;
  if (!timeFrom || !timeTo) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const result = await pool.query(
      `INSERT INTO schedules 
             (timeFrom, timeTo, created_at, updated_at)
             VALUES ($1,$2,NOW(),NOW())
             RETURNING id, timeFrom, timeTo`,
      [timeFrom, timeTo]
    );

    res.status(201).json({
      message: "Schedule created successfully",
      schedule: result.rows[0],
    });
  } catch (err) {
    console.error("Create schedule:", timeFrom, timeTo);
    console.error(err);
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

exports.listSchedules = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM schedules");
    res.status(200).json({ schedules: result.rows });
  } catch (err) {
    console.error("List schedules:");
    console.error(err);
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

exports.updateSchedule = async (req, res) => {
  const { id } = req.params;
  const { timeFrom, timeTo } = req.body;
  if (!id || !timeFrom || !timeTo) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const result = await pool.query(
      `UPDATE schedules 
             SET timeFrom = $1, timeTo = $2, updated_at = NOW()
             WHERE id = $3
             RETURNING id, timeFrom, timeTo`,
      [timeFrom, timeTo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    res.status(200).json({
      message: "Schedule updated successfully",
      schedule: result.rows[0],
    });
  } catch (err) {
    console.error("Update schedule:", id, timeFrom, timeTo);
    console.error(err);
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

exports.createScheduleForField = async (req, res) => {
  const { id_schedule, id_type, id_field, amount_available, status } = req.body;
  if (
    !id_schedule ||
    !id_type ||
    !id_field ||
    amount_available == null ||
    !status
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const result = await pool.query(
      `INSERT INTO schedule_for_field 
             (id_schedule, id_type, id_field, amount_available, status, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,NOW(),NOW())
             RETURNING *`,
      [id_schedule, id_type, id_field, amount_available, status]
    );

    res.status(201).json({
      message: "Schedule for field created successfully",
      scheduleForField: result.rows[0],
    });
  } catch (err) {
    console.error(
      "Create schedule for field:",
      id_schedule,
      id_type,
      id_field,
      amount_available,
      status
    );
    console.error(err);
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

exports.updateScheduleForField = async (req, res) => {
  const { id } = req.params;
  const { id_schedule, id_type, id_field, amount_available, status } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const result = await pool.query(
      `UPDATE schedule_for_field 
             SET id_schedule = COALESCE($1, id_schedule),
                 id_type = COALESCE($2, id_type),
                 id_field = COALESCE($3, id_field),
                 amount_available = COALESCE($4, amount_available),
                 status = COALESCE($5, status),
                 updated_at = NOW()
             WHERE id = $6
             RETURNING *`,
      [id_schedule, id_type, id_field, amount_available, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Schedule for field not found" });
    }

    res.status(200).json({
      message: "Schedule for field updated successfully",
      scheduleForField: result.rows[0],
    });
  } catch (err) {
    console.error(
      "Update schedule for field:",
      id,
      id_schedule,
      id_type,
      id_field,
      amount_available,
      status
    );
    console.error(err);
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

exports.getListScheduleForField = async (req, res) => {
  try {
    const { id_schedule, id_type, id_field, available } = req.query;

    let baseQuery = `
      SELECT 
        sf.id,
        sf.amount_available,
        sf.status,
        s.start_time,
        s.end_time,
        f.name AS field_name,
        ft.name AS field_type_name
      FROM schedule_for_field sf
      LEFT JOIN schedules s ON sf.id_schedule = s.id
      LEFT JOIN fields f ON sf.id_field = f.id
      LEFT JOIN field_types ft ON sf.id_type = ft.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Filter theo khung giờ
    if (id_schedule) {
      baseQuery += ` AND sf.id_schedule = $${paramIndex++}`;
      params.push(id_schedule);
    }

    // Filter theo loại sân
    if (id_type) {
      baseQuery += ` AND sf.id_type = $${paramIndex++}`;
      params.push(id_type);
    }

    // Filter theo sân
    if (id_field) {
      baseQuery += ` AND sf.id_field = $${paramIndex++}`;
      params.push(id_field);
    }

    // Filter xem sân còn chỗ (còn slot)
    if (available === "true") {
      baseQuery += ` AND sf.amount_available > 0 AND sf.status = 'available'`;
    }

    baseQuery += " ORDER BY sf.id DESC";

    const result = await pool.query(baseQuery, params);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("getListScheduleForField ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
