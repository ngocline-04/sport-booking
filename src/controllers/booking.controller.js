const pool = require("../db/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
exports.createBooking = async (req, res) => {
  try {
    const { id_field, id_schedule, date, hour } = req.body;
    const user_id = req.user.id; // lấy từ token

    if (!id_field || !id_schedule || !date || !hour) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1. Lấy thông tin sân → để lấy id_type_field
    const fieldResult = await pool.query(
      "SELECT id_type_field FROM fields WHERE id = $1",
      [id_field]
    );

    if (fieldResult.rows.length === 0) {
      return res.status(404).json({ error: "Field not found" });
    }

    const id_type_field = fieldResult.rows[0].id_type_field;

    // 2. Lấy thông tin giờ từ schedules
    const scheduleResult = await pool.query(
      "SELECT time_from, time_to FROM schedules WHERE id = $1",
      [id_schedule]
    );

    if (scheduleResult.rows.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    const { time_from, time_to } = scheduleResult.rows[0];

    // 3. Lấy thứ trong tuần
    const dayOfWeek = new Date(date).getDay(); // 0 = CN, 1 = T2...

    // 4. Lấy giá sân đúng với loại sân + thứ + khung giờ
    const priceQuery = `
      SELECT price 
      FROM field_price
      WHERE id_type_field = $1
        AND day_of_week = $2
        AND start_time <= $3
        AND end_time >= $4
      LIMIT 1;
    `;

    const priceResult = await pool.query(priceQuery, [
      id_type_field,
      dayOfWeek,
      time_from,
      time_to,
    ]);

    if (priceResult.rows.length === 0) {
      return res.status(400).json({
        error: "Không tìm thấy giá sân phù hợp",
        detail: {
          id_type_field,
          dayOfWeek,
          time_from,
          time_to,
        },
      });
    }

    const price_per_hour = Number(priceResult.rows[0].price);
    const total_amount = price_per_hour * hour;

    // 5. Thêm booking
    const insertResult = await pool.query(
      `INSERT INTO booking
        (id_field, id_schedule, time, hour, date, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id_field, id_schedule, `${time_from} - ${time_to}`, hour, date, user_id]
    );

    res.json({
      success: true,
      message: "Booking successful",
      price_per_hour,
      total_amount,
      booking: insertResult.rows[0],
    });

  } catch (err) {
    console.error("createBooking ERROR:", err);
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};


exports.updateBooking = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const id_booking = req.params.id;
    const { time, hour } = req.body;

    if (!id_booking)
      return res.status(400).json({ message: "Missing booking id" });

    // 1. Lấy booking cũ
    const oldBookingQuery = `SELECT * FROM booking WHERE id = $1`;
    const oldBookingResult = await client.query(oldBookingQuery, [id_booking]);

    if (oldBookingResult.rows.length === 0)
      return res.status(404).json({ message: "Booking not found" });

    const oldBooking = oldBookingResult.rows[0];

    // 2. Update booking (chỉ update time + hour)
    const updateQuery = `
      UPDATE booking 
      SET time = $1, hour = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `;

    const updatedBookingResult = await client.query(updateQuery, [
      time,
      hour,
      id_booking,
    ]);

    const booking = updatedBookingResult.rows[0];

    // 3. Hủy bill cũ (cancel)
    const cancelBillQuery = `
      UPDATE bill
      SET status = 'cancelled', updated_at = NOW()
      WHERE id_booking = $1 AND status = 'pending'
      RETURNING *;
    `;
    await client.query(cancelBillQuery, [id_booking]);

    // 4. Lấy loại sân để tính giá
    const fieldTypeQuery = `
      SELECT id_type_field 
      FROM fields 
      WHERE id = $1
    `;

    const fieldTypeResult = await client.query(fieldTypeQuery, [
      booking.id_field,
    ]);

    const id_type_field = fieldTypeResult.rows[0].id_type_field;

    // 5. Lấy thứ trong tuần từ booking.date
    const dowQuery = `SELECT EXTRACT(DOW FROM $1::date) AS dow`;
    const dowResult = await client.query(dowQuery, [booking.date]);

    const day_of_week = dowResult.rows[0].dow;

    // 6. Lấy giá tại thời điểm mới
    const priceQuery = `
      SELECT price
      FROM field_price
      WHERE id_type_field = $1
        AND day_of_week = $2
        AND $3::time BETWEEN start_time AND end_time
      LIMIT 1;
    `;

    const priceResult = await client.query(priceQuery, [
      id_type_field,
      day_of_week,
      time,
    ]);

    if (priceResult.rows.length === 0)
      throw new Error("Không tìm thấy giá sân phù hợp");

    const price = parseFloat(priceResult.rows[0].price);

    // 7. Tính tổng tiền bill mới
    const newAmount = price * hour;

    // 8. Tạo bill mới
    const billQuery = `
      INSERT INTO bill (id_transaction, id_booking, user_received, amount)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const id_transaction = `PAY_${Date.now()}`;

    const newBill = await client.query(billQuery, [
      id_transaction,
      id_booking,
      booking.user_id,
      newAmount,
    ]);

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Booking updated and new bill created",
      booking,
      bill: newBill.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("updateBooking ERROR:", err);
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};

exports.listMyBookings = async (req, res) => {
  try {
    const user_id = req.user.id; // lấy từ middleware verify token

    const result = await pool.query(
      `SELECT * FROM booking WHERE user_id = $1 ORDER BY date DESC, time ASC`,
      [user_id]
    );

    res.json({ success: true, bookings: result.rows });
  } catch (err) {
    console.error("listMyBookings ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
