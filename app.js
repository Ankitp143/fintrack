const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const connectMongo = require("connect-mongo");
const MongoStore = connectMongo.default || connectMongo.MongoStore || connectMongo;
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

require("dotenv").config();

const app = express();

// ======================
// DATABASE CONNECTION
// ======================
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fintrack";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// ======================
// SECURITY MIDDLEWARE
// ======================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
        ],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// Rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 login/register requests per windowMs
  message: "Too many auth requests from this IP, please try again after 15 minutes.",
});

app.use("/login", authLimiter);
app.use("/register", authLimiter);

// ======================
// GENERAL MIDDLEWARE
// ======================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ======================
// SESSION CONFIGURATION
// ======================
const sessionConfig = {
  secret: process.env.SESSION_SECRET || "fintrack_super_secret_key_2026",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
};

// Use MongoStore in production or if MONGO_URI is set to a remote server
if (process.env.NODE_ENV === "production" && process.env.MONGO_URI) {
  sessionConfig.store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: "sessions",
    ttl: 24 * 60 * 60,
  });
}

app.use(session(sessionConfig));

// ======================
// VIEW ENGINE
// ======================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Make logged-in user available to all EJS templates
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// ======================
// ROUTES MOUNTING
// ======================
const authRoutes = require("./routes/authRoutes");
const financeRoutes = require("./routes/financeRoutes");

// Homepage
app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  res.render("index");
});

app.use("/", authRoutes);
app.use("/", financeRoutes);

// ======================
// 404 & ERROR HANDLING
// ======================
app.use((req, res, next) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>404 - Page Not Found | FinTrack</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
      </head>
      <body class="bg-dark text-white d-flex align-items-center justify-content-center vh-100 text-center">
        <div>
          <h1 class="display-1 text-danger">404</h1>
          <h3 class="mb-4">Page Not Found</h3>
          <p class="text-secondary mb-4">The page you are looking for does not exist or has been moved.</p>
          <a href="/dashboard" class="btn btn-primary">Return to Dashboard</a>
        </div>
      </body>
    </html>
  `);
});

app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>500 - Internal Server Error | FinTrack</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
      </head>
      <body class="bg-dark text-white d-flex align-items-center justify-content-center vh-100 text-center">
        <div>
          <h1 class="display-1 text-warning">500</h1>
          <h3 class="mb-4">Something went wrong</h3>
          <p class="text-secondary mb-4">An unexpected error occurred on the server. Please try again later.</p>
          <a href="/dashboard" class="btn btn-primary">Return to Dashboard</a>
        </div>
      </body>
    </html>
  `);
});

// ======================
// SERVER START
// ======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`FinTrack Server running on port ${PORT}`);
});