const express = require("express");
// const bcrypt = require("bcrypt");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

/* ======================
   LOGIN (PUBLIC)
====================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Login attempt:", email);

    // ================= VALIDATION =================
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    // ================= JWT SECRET CHECK =================
    if (!JWT_SECRET) {
      console.error("❌ JWT_SECRET missing in env");
      return res.status(500).json({
        message: "Server misconfiguration",
      });
    }

    // ================= GET USER =================
    const user = await new Promise((resolve, reject) => {
      db.get(
        "SELECT id, name, email, password, role, staff_id FROM users WHERE email = ?",
        [email],
        (err, row) => {
          if (err) {
            console.error("❌ DB ERROR:", err);
            return reject(err);
          }
          resolve(row);
        }
      );
    });

    console.log("👤 User:", user);

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // ================= PASSWORD CHECK =================
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔑 Password match:", isMatch);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // ================= STAFF LOGIN =================
    if (user.role === "staff") {
      const staff = await new Promise((resolve, reject) => {
        db.get(
          "SELECT id, name, phone, status FROM staff WHERE id = ? AND status = 'active'",
          [user.staff_id],
          (err, row) => {
            if (err) {
              console.error("❌ STAFF DB ERROR:", err);
              return reject(err);
            }
            resolve(row);
          }
        );
      });

      if (!staff) {
        return res.status(403).json({
          message: "Staff inactive or not found",
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          role: "staff",
          staffId: staff.id,
          name: staff.name,
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          role: "staff",
          staffId: staff.id,
          name: staff.name,
          phone: staff.phone,
        },
      });
    }

    // ================= ADMIN / KITCHEN =================
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("🔥 LOGIN ERROR:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message, // remove in production if needed
    });
  }
});

/* ======================
   KITCHEN REGISTRATION
   (ADMIN ONLY)
====================== */
router.post("/register-kitchen", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, email and password required",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters",
    });
  }

  db.get(
    "SELECT id FROM users WHERE email = ?",
    [email],
    async (err, existingUser) => {
      if (err) {
        console.error("SELECT ERROR:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (existingUser) {
        return res.status(409).json({
          message: "Email already registered",
        });
      }

      const hash = await bcrypt.hash(password, 10);

      db.run(
        `INSERT INTO users (name, email, password, role)
         VALUES (?, ?, ?, 'kitchen')`,
        [name, email, hash],
        function (err) {
          if (err) {
            console.error("INSERT ERROR:", err); // 🔥 KEY LINE
            return res.status(500).json({
              message: "Kitchen registration failed",
              error: err.message, // TEMP (dev only)
            });
          }

          res.status(201).json({
            message: "Kitchen user registered successfully",
            user: {
              id: this.lastID,
              name,
              email,
              role: "kitchen",
            },
          });
        }
      );
    }
  );
});


/* ======================
   LOGOUT
====================== */
router.post("/logout", (req, res) => {
  res.json({ message: "Logged out" });
});

/* ======================
   PROFILE (PROTECTED)
====================== */
router.get("/profile", requireAuth, (req, res) => {
  if (req.user.role === "staff" && req.user.staffId) {
    db.get(
      "SELECT id, name, phone, status FROM staff WHERE id = ?",
      [req.user.staffId],
      (err, staff) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Error fetching staff profile" });
        }

        if (!staff) {
          return res.status(404).json({ message: "Staff not found" });
        }

        res.json({
          id: req.user.id,
          role: "staff",
          staffId: staff.id,
          name: staff.name,
          phone: staff.phone,
          status: staff.status,
        });
      }
    );
  } else {
    res.json(req.user); // admin / kitchen
  }
});

/* ======================
   STAFF LIST (PUBLIC)
====================== */
router.get("/staff-list", (req, res) => {
  db.all(
    "SELECT id, name FROM staff WHERE status = 'active' ORDER BY name",
    [],
    (err, staffList) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error fetching staff list" });
      }
      res.json(staffList);
    }
  );
});

/* ======================
   CHANGE PASSWORD
====================== */
router.put("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Current and new password required" });
  }

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  db.get(
    "SELECT password FROM users WHERE id = ?",
    [req.user.id],
    async (err, user) => {
      if (err || !user) {
        return res.status(500).json({ message: "User not found" });
      }

      const match = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!match) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }

      const hash = await bcrypt.hash(newPassword, 10);

      db.run(
        "UPDATE users SET password = ? WHERE id = ?",
        [hash, req.user.id],
        function (err) {
          if (err || this.changes === 0) {
            return res
              .status(500)
              .json({ message: "Password update failed" });
          }

          res.json({
            message: "Password changed successfully. Please login again.",
          });
        }
      );
    }
  );
});

module.exports = router;
