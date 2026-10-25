const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

router.post(
  "/signup",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Please enter a password with 6 or more characters").isLength({ min: 6 }),
  ],
  async (req, res) => {
    console.log("📝 Signup request received:", { 
      name: req.body.name, 
      email: req.body.email,
      hasPassword: !!req.body.password 
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("❌ Validation errors:", errors.array());
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { name, email, password, role } = req.body;
    try {
      let user = await User.findOne({ email });
      if (user) {
        console.log("❌ User already exists:", email);
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      console.log("✅ Creating new user...");
      user = new User({ name, email, password, role: role || "member" });
      await user.save();
      console.log("✅ User saved successfully:", user._id);

      const payload = {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "24h" },
        (err, token) => {
          if (err) {
            console.error("❌ JWT signing error:", err);
            return res.status(500).json({
              success: false,
              message: "Token generation failed"
            });
          }
          console.log("✅ Token generated successfully");
          res.status(201).json({ 
            success: true,
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            }
          });
        }
      );
    } catch (err) {
      console.error("❌ Signup error:", err.message);
      console.error("Full error:", err);
      res.status(500).json({
        success: false,
        message: "Server error during registration"
      });
    }
  }
);

router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    console.log("🔐 Login request received:", { email: req.body.email });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        console.log("❌ User not found:", email);
        return res.status(400).json({
          success: false,
          message: "Invalid Credentials",
        });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        console.log("❌ Password mismatch for:", email);
        return res.status(400).json({
          success: false,
          message: "Invalid Credentials",
        });
      }

      const payload = {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "24h" },
        (err, token) => {
          if (err) {
            console.error("❌ JWT signing error:", err);
            return res.status(500).json({
              success: false,
              message: "Token generation failed"
            });
          }
          console.log("✅ Login successful for:", email);
          res.status(200).json({ 
            success: true,
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            }
          });
        }
      );
    } catch (err) {
      console.error("❌ Login error:", err.message);
      res.status(500).json({
        success: false,
        message: "Server error during login"
      });
    }
  }
);

router.get("/search", async (req, res) => {
  const query = req.query.query || req.query.q;

  if (!query) {
    return res.status(400).json({ message: "Query parameter is required." });
  }

  try {
    const users = await User.find({
      $or: [{ name: { $regex: query, $options: "i" } }, { email: { $regex: query, $options: "i" } }],
    }).select("_id name email");

    res.status(200).json(users);
  } catch (error) {
    console.error("❌ Error searching users:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Test route to check database connection
router.get("/test", async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.json({ 
      success: true, 
      message: "Database connected", 
      userCount,
      jwtSecret: !!process.env.JWT_SECRET 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Database connection failed", 
      error: error.message 
    });
  }
});

module.exports = router;


