const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

// ======================
// REGISTER PAGE
// ======================
router.get("/register", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  const error = req.query.error || null;
  res.render("auth/register", { error });
});

// ======================
// REGISTER USER
// ======================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.render("auth/register", {
        error: "All fields are required.",
      });
    }

    if (password.length < 6) {
      return res.render("auth/register", {
        error: "Password must be at least 6 characters long.",
      });
    }

    const emailLower = email.trim().toLowerCase();

    // Check existing user
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.render("auth/register", {
        error: "Email is already registered. Please login.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      name: name.trim(),
      email: emailLower,
      password: hashedPassword,
    });

    await user.save();

    res.redirect("/login?success=Account+created+successfully.+Please+login.");
  } catch (err) {
    console.error("Register Error:", err);
    res.render("auth/register", {
      error: "An error occurred during registration. Please try again.",
    });
  }
});

// ======================
// LOGIN PAGE
// ======================
router.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  const error = req.query.error || null;
  const success = req.query.success || null;
  res.render("auth/login", { error, success });
});

// ======================
// LOGIN USER
// ======================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render("auth/login", {
        error: "Please provide both email and password.",
        success: null,
      });
    }

    const emailLower = email.trim().toLowerCase();

    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return res.render("auth/login", {
        error: "Invalid email or password.",
        success: null,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("auth/login", {
        error: "Invalid email or password.",
        success: null,
      });
    }

    // Store user data in session
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
    };

    res.redirect("/dashboard");
  } catch (err) {
    console.error("Login Error:", err);
    res.render("auth/login", {
      error: "An error occurred during login. Please try again.",
      success: null,
    });
  }
});

// ======================
// LOGOUT
// ======================
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout Error:", err);
    }
    res.clearCookie("connect.sid");
    res.redirect("/login?success=You+have+been+logged+out.");
  });
});

module.exports = router;