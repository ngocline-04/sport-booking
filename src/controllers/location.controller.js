const pool = require("../db/db");
exports.listLocations = async (req, res) => {
  try {
    const search = req.query.search || ""; // không truyền thì = rỗng

    const query = `
      SELECT * 
      FROM locations
      WHERE LOWER(name) LIKE LOWER($1)
      ORDER BY name ASC
    `;

    const result = await pool.query(query, [`%${search}%`]);

    if (result.rows.length === 0)
      return res.status(404).json({ message: "No locations found" });

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("listLocations ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.createLocation = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (name) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    }
    const insertQuery = `
      INSERT INTO locations (name, description)
      VALUES ($1, $2)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [name, description]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("createLocation ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    if (id == null) {
      return res
        .status(400)
        .json({ success: false, message: "ID is required" });
    }
    const updateQuery = `   

        UPDATE locations    
        SET name = $1, description = $2
        WHERE id = $3
        RETURNING *  
    `;

    const result = await pool.query(updateQuery, [name, description, id]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Location not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("updateLocation ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    if (id == null) {
      return res
        .status(400)
        .json({ success: false, message: "ID is required" });
    }

    const deleteQuery = `
        DELETE FROM locations
        WHERE id = $1
        RETURNING *
        `;
    const result = await pool.query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Location not found" });
    }

    res.json({ success: true, message: "Location deleted successfully" });
  } catch (error) {
    console.error("deleteLocation ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
