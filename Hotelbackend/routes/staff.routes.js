const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db/database");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/* GET ALL STAFF */
router.get("/", requireAuth, requireAdmin, (req, res) => {
  db.all(
    `
    SELECT
      s.id,
      s.name,
      s.phone,
      s.status,
      s.created_at,
      u.email
      
    FROM staff s
    LEFT JOIN users u ON u.staff_id = s.id AND u.role = 'staff'
    ORDER BY s.created_at DESC
    `,
    [],
    (err, rows) => {
      if (err) {
        console.error("Database error while fetching staff:", {
          message: err.message,
          code: err.code,
        });
        return res.status(500).json({ message: "Failed to fetch staff" });
      }
      res.json(rows);
    }
  );
});

/* ADD STAFF (AUTO CREATE USER LOGIN) */
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name, email, phone, password } = req.body;

  // Validation
  if (!name || !email || !phone || !password) {
    return res.status(400).json({
      message: "Name, email, phone number and password are required",
    });
  }

  const nameTrimed = name.trim();
  const emailTrimed = email.trim().toLowerCase();

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailTrimed)) {
    return res.status(400).json({
      message: "Invalid email format",
    });
  }

  // Phone validation
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({
      message: "Phone number must be exactly 10 digits",
    });
  }

  // Password validation
  if (password.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters",
    });
  }

  try {
    // 1️⃣ Check if email already exists
    db.get(
      `SELECT id FROM users WHERE email = ?`,
      [emailTrimed],
      async (err, existingUser) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ message: "Failed to verify email" });
        }

        if (existingUser) {
          return res.status(400).json({
            message: "Email already registered",
          });
        }

        // 2️⃣ Hash password
        try {
          const passwordHash = await bcrypt.hash(password, 10);

          // 3️⃣ Insert into staff table
          db.run(
            `INSERT INTO staff (name, phone, status)
             VALUES (?, ?, 'active')`,
            [nameTrimed, phone],
            async function (err) {
              if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ message: "Failed to add staff" });
              }

              const staffId = this.lastID;

              // 4️⃣ Insert into users table
              db.run(
                `INSERT INTO users (name, email, password, role, staff_id)
                 VALUES (?, ?, ?, 'staff', ?)`,
                [nameTrimed, emailTrimed, passwordHash, staffId],
                (err2) => {
                  if (err2) {
                    console.error("Database error:", err2);
                    return res.status(500).json({
                      message: "Staff added but login creation failed",
                    });
                  }

                  // ✅ Success response
                  res.status(201).json({
                    id: staffId,
                    name: nameTrimed,
                    email: emailTrimed,
                    phone,
                    status: "active",
                    message: "Staff added successfully",
                  });
                }
              );
            }
          );
        } catch (hashError) {
          console.error("Password hashing error:", hashError);
          return res.status(500).json({ message: "Failed to process password" });
        }
      }
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/* DELETE STAFF */
router.delete("/:id", requireAuth, requireAdmin, (req, res) => {
  const staffId = req.params.id;

  // 1. Delete from users table (login)
  db.run(`DELETE FROM users WHERE staff_id = ?`, [staffId], (err) => {
    if (err) {
      console.error("Error deleting user:", err);
      return res.status(500).json({ message: "Failed to delete staff login" });
    }

    // 2. Delete from staff table
    db.run(`DELETE FROM staff WHERE id = ?`, [staffId], (err2) => {
      if (err2) {
        console.error("Error deleting staff:", err2);
        return res.status(500).json({ message: "Failed to delete staff record" });
      }

      res.json({ message: "Staff deleted successfully" });
    });
  });
});

module.exports = router;
