# FinTrack 💰 — Full-Stack Personal Finance Web Application

**FinTrack** is a production-ready, placement-level full-stack personal finance web application built with **Node.js**, **Express.js**, **MongoDB**, **Mongoose**, **EJS**, **Bootstrap 5**, **Chart.js**, and **PDFKit**.

It enables users to securely track income and expenses, configure monthly budgets, analyze spending trends through interactive visual charts, and export custom date-range PDF financial statements.

---

## 🌟 Key Features

* **Authentication & Authorization**:
  * Secure user registration, login, and logout.
  * Password hashing using **bcryptjs** (salt factor 10).
  * Session-based authentication using **express-session** with HTTP-only cookies.
  * Strict user data isolation — all transaction, budget, and profile queries are strictly scoped to the authenticated user.

* **Transaction Management (CRUD)**:
  * Add, view, edit, and delete transactions.
  * Income and expense classification.
  * Built-in and custom category support ("Other" category selection with custom text entry).
  * Recurring transaction tagging.
  * Search transactions by title (case-insensitive regex).
  * Filter transactions by type (Income vs Expense).

* **Dashboard & Visualizations**:
  * Real-time metrics: Total Income, Total Expense, Net Balance.
  * Interactive **Chart.js** visualizations:
    * Income vs Expense Ratio (Doughnut Chart).
    * Financial Overview (Bar Chart).
  * Table sorting with latest transactions displayed first (`date: -1`).

* **Monthly Budget Tracking**:
  * Set and update monthly budget targets.
  * Expense calculation scoped strictly to the **current calendar month**.
  * Visual progress bar showing percentage of budget consumed.
  * Dynamic alerts for remaining allowance or budget overrun warnings.

* **Financial Analytics**:
  * Spending breakdown by category.
  * Automatic detection of top spending category.
  * Interactive Doughnut chart for category distribution.

* **Date-Range PDF Financial Reports**:
  * Downloadable PDF financial statements powered by **PDFKit**.
  * Filter reports by custom date ranges or quick presets (Last 30 Days, Last 90 Days, This Year, All Time).
  * Handled end-of-day timestamp coverage (`23:59:59.999`).
  * PDFKit-safe currency formatting (`Rs.`) to ensure clean font rendering across viewports.
  * Structured table design with pagination support.

* **User Profile Management**:
  * Detailed account overview: Member Since date, total transaction count, total income/expense/balance.
  * Profile editing: Name update and optional password change.
  * Read-only email address protection.

* **Security & Reliability**:
  * **Helmet** integration for Content Security Policy and HTTP security headers.
  * Rate-limiting via **express-rate-limit** on login and registration endpoints.
  * Data sanitization and server-side validation.
  * Destructive action confirmation dialogs.
  * Clean dismissible alert banners for user feedback.

---

## 🛠️ Technology Stack

* **Backend**: Node.js, Express.js
* **Database**: MongoDB with Mongoose ORM
* **View Engine**: EJS (Embedded JavaScript)
* **Frontend / Styling**: Bootstrap 5, Vanilla CSS, Chart.js
* **Authentication**: bcryptjs, express-session, connect-mongo
* **PDF Generation**: PDFKit
* **Security & Environment**: Helmet, Express-Rate-Limit, Dotenv

---

## 📁 Project Architecture

```text
fintrack/
├── middleware/
│   └── auth.js             # Session authentication protection middleware
├── models/
│   ├── User.js             # User Mongoose schema (name, email, password, timestamps)
│   ├── Transaction.js      # Transaction schema (userId, title, amount, type, category, recurring, date)
│   └── Budget.js           # Budget schema (userId, amount, timestamps)
├── routes/
│   ├── authRoutes.js       # Authentication routes (login, register, logout)
│   └── financeRoutes.js    # Financial routes (dashboard, transactions, analytics, budget, PDF, profile)
├── views/
│   ├── auth/
│   │   ├── login.ejs       # Login page view
│   │   └── register.ejs    # Registration page view
│   ├── dashboard/
│   │   ├── dashboard.ejs   # Main financial dashboard
│   │   ├── addTransaction.ejs # Add transaction form
│   │   ├── editTransaction.ejs# Edit transaction form
│   │   ├── analytics.ejs   # Financial analytics & charts
│   │   ├── budget.ejs      # Monthly budget management
│   │   ├── profile.ejs     # Profile view
│   │   └── editProfile.ejs # Profile editing view
│   └── index.ejs           # Public landing page
├── public/
│   └── css/
│       └── style.css       # Custom stylesheet & responsive drawer layout
├── .env                    # Local environment configuration file
├── .gitignore              # Git ignore rules
├── app.js                  # Core Express application entry point
└── package.json            # Node.js dependencies & scripts
```

---

## 🚀 Local Installation & Setup Guide

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v16 or higher)
* [MongoDB](https://www.mongodb.com/) running locally on port 27017 or a MongoDB Atlas connection string.

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/your-username/fintrack.git
cd fintrack
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/fintrack
SESSION_SECRET=fintrack_super_secret_key_2026
NODE_ENV=development
```

### 4. Running the Application
```bash
# Start development server with auto-reload
npm run dev

# Or start standard production server
npm start
```
Open your browser and navigate to `http://localhost:3000`.

---

## ☁️ Deployment Guide

### Deploying to Render & MongoDB Atlas

1. **Database Setup (MongoDB Atlas)**:
   * Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   * Create a database user and whitelist network access (`0.0.0.0/0` for cloud deployment).
   * Copy your MongoDB connection string (e.g. `mongodb+srv://<username>:<password>@cluster.mongodb.net/fintrack?retryWrites=true&w=majority`).

2. **Web Service Deployment (Render)**:
   * Connect your GitHub repository to [Render](https://render.com/).
   * Select **Web Service**.
   * Set **Build Command**: `npm install`
   * Set **Start Command**: `npm start`
   * Add Environment Variables in Render settings:
     * `MONGO_URI`: *Your MongoDB Atlas Connection String*
     * `SESSION_SECRET`: *A strong random secret string*
     * `NODE_ENV`: `production`

---

## 🔮 Future Roadmap

* **CSV / Excel Export**: Enable exporting transaction logs in `.csv` format alongside PDF statements.
* **Savings Goal Planner**: Create target savings goals with progress tracking.
* **Dark / Light Mode Toggle**: Allow users to toggle UI themes.
* **Email Notifications**: Weekly or monthly summary digests via nodemailer.

---

## 📄 License
This project is open-source and available under the [ISC License](LICENSE).
