const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");

const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

// Protect all finance routes
router.use(authMiddleware);

// Helper to format currency safely for PDF and UI
function formatCurrency(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ======================
// DASHBOARD
// ======================
router.get("/dashboard", async (req, res) => {
  try {
    const userId = req.session.user._id;

    // 1. Calculate overall financial summary from ALL user transactions
    const allTransactions = await Transaction.find({ userId });
    let income = 0;
    let expense = 0;

    allTransactions.forEach((t) => {
      if (t.type === "income") {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    });

    const balance = income - expense;

    // 2. Filter transactions array for the Recent Transactions Table only
    const search = (req.query.search || "").trim();
    const type = (req.query.type || "").trim();

    let tableQuery = { userId };

    if (search) {
      tableQuery.title = { $regex: search, $options: "i" };
    }

    if (type === "income" || type === "expense") {
      tableQuery.type = type;
    }

    const filteredTransactions = await Transaction.find(tableQuery).sort({
      date: -1,
      createdAt: -1,
    });

    res.render("dashboard/dashboard", {
      user: req.session.user,
      transactions: filteredTransactions,
      income,
      expense,
      balance,
      search,
      type,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.render("dashboard/dashboard", {
      user: req.session.user,
      transactions: [],
      income: 0,
      expense: 0,
      balance: 0,
      search: "",
      type: "",
      success: null,
      error: "Error loading dashboard data.",
    });
  }
});

// ======================
// ADD TRANSACTION PAGE & POST
// ======================
router.get("/add-transaction", (req, res) => {
  res.render("dashboard/addTransaction", {
    user: req.session.user,
    success: req.query.success || null,
    error: req.query.error || null,
  });
});

router.post("/add-transaction", async (req, res) => {
  try {
    const { title, amount, type, category, customCategory, date, recurring } =
      req.body;

    const parsedAmount = parseFloat(amount);
    if (!title || isNaN(parsedAmount) || parsedAmount <= 0 || !type) {
      return res.render("dashboard/addTransaction", {
        user: req.session.user,
        error: "Please provide a valid title, positive amount, and type.",
        success: null,
      });
    }

    // Category handling
    let finalCategory = category;
    if (category === "Other" && customCategory && customCategory.trim()) {
      finalCategory = customCategory.trim();
    } else if (!finalCategory || finalCategory === "Other") {
      finalCategory = "General";
    }

    const transactionDate = date ? new Date(date) : new Date();

    const transaction = new Transaction({
      userId: req.session.user._id,
      title: title.trim(),
      amount: parsedAmount,
      type,
      category: finalCategory,
      date: transactionDate,
      recurring: recurring === "true" || recurring === true,
    });

    await transaction.save();

    res.redirect("/dashboard?success=Transaction+added+successfully");
  } catch (err) {
    console.error("Add Transaction Error:", err);
    res.render("dashboard/addTransaction", {
      user: req.session.user,
      error: "Error adding transaction. Please check your input.",
      success: null,
    });
  }
});

// ======================
// EDIT TRANSACTION PAGE & POST
// ======================
router.get("/edit/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.redirect("/dashboard?error=Invalid+transaction+ID");
    }

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.session.user._id,
    });

    if (!transaction) {
      return res.redirect("/dashboard?error=Transaction+not+found");
    }

    res.render("dashboard/editTransaction", {
      user: req.session.user,
      transaction,
      error: req.query.error || null,
      success: req.query.success || null,
    });
  } catch (err) {
    console.error("Edit Transaction Page Error:", err);
    res.redirect("/dashboard?error=Error+loading+edit+page");
  }
});

router.post("/edit/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.redirect("/dashboard?error=Invalid+transaction+ID");
    }

    const { title, amount, type, category, customCategory, date, recurring } =
      req.body;

    const parsedAmount = parseFloat(amount);
    if (!title || isNaN(parsedAmount) || parsedAmount <= 0 || !type) {
      const transaction = await Transaction.findById(req.params.id);
      return res.render("dashboard/editTransaction", {
        user: req.session.user,
        transaction,
        error: "Please provide a valid title, positive amount, and type.",
        success: null,
      });
    }

    let finalCategory = category;
    if (category === "Other" && customCategory && customCategory.trim()) {
      finalCategory = customCategory.trim();
    } else if (!finalCategory) {
      finalCategory = "General";
    }

    const updateData = {
      title: title.trim(),
      amount: parsedAmount,
      type,
      category: finalCategory,
      recurring: recurring === "true" || recurring === true,
    };

    if (date) {
      updateData.date = new Date(date);
    }

    const updated = await Transaction.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.session.user._id,
      },
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.redirect("/dashboard?error=Transaction+not+found+or+unauthorized");
    }

    res.redirect("/dashboard?success=Transaction+updated+successfully");
  } catch (err) {
    console.error("Update Transaction Error:", err);
    res.redirect("/dashboard?error=Error+updating+transaction");
  }
});

// ======================
// DELETE TRANSACTION
// ======================
router.get("/delete/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.redirect("/dashboard?error=Invalid+transaction+ID");
    }

    const deleted = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.session.user._id,
    });

    if (!deleted) {
      return res.redirect("/dashboard?error=Transaction+not+found+or+unauthorized");
    }

    res.redirect("/dashboard?success=Transaction+deleted+successfully");
  } catch (err) {
    console.error("Delete Transaction Error:", err);
    res.redirect("/dashboard?error=Error+deleting+transaction");
  }
});

// ======================
// ANALYTICS PAGE
// ======================
router.get("/analytics", async (req, res) => {
  try {
    const userId = req.session.user._id;
    const transactions = await Transaction.find({ userId });

    let income = 0;
    let expense = 0;
    let categoryData = {};

    transactions.forEach((t) => {
      if (t.type === "income") {
        income += t.amount;
      } else {
        expense += t.amount;
        if (categoryData[t.category]) {
          categoryData[t.category] += t.amount;
        } else {
          categoryData[t.category] = t.amount;
        }
      }
    });

    const balance = income - expense;

    let topCategory = "No Expenses";
    let maxExpense = 0;
    for (const cat in categoryData) {
      if (categoryData[cat] > maxExpense) {
        maxExpense = categoryData[cat];
        topCategory = cat;
      }
    }

    res.render("dashboard/analytics", {
      user: req.session.user,
      income,
      expense,
      balance,
      totalTransactions: transactions.length,
      topCategory,
      categoryData,
    });
  } catch (err) {
    console.error("Analytics Error:", err);
    res.redirect("/dashboard?error=Error+loading+analytics");
  }
});

// ======================
// BUDGET PAGE & POST
// ======================
router.get("/budget", async (req, res) => {
  try {
    const userId = req.session.user._id;

    // Fetch budget
    const budget = await Budget.findOne({ userId });
    const budgetAmount = budget ? budget.amount : 0;

    // Calculate expense for the CURRENT CALENDAR MONTH
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const currentMonthExpenses = await Transaction.find({
      userId,
      type: "expense",
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    let totalExpense = 0;
    currentMonthExpenses.forEach((t) => {
      totalExpense += t.amount;
    });

    const remaining = budgetAmount - totalExpense;

    const monthName = now.toLocaleString("default", { month: "long", year: "numeric" });

    res.render("dashboard/budget", {
      user: req.session.user,
      budgetAmount,
      totalExpense,
      remaining,
      monthName,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) {
    console.error("Budget Error:", err);
    res.redirect("/dashboard?error=Error+loading+budget");
  }
});

router.post("/budget", async (req, res) => {
  try {
    const userId = req.session.user._id;
    const amount = parseFloat(req.body.amount);

    if (isNaN(amount) || amount < 0) {
      return res.redirect("/budget?error=Please+enter+a+valid+positive+budget+amount");
    }

    await Budget.findOneAndUpdate(
      { userId },
      { amount },
      { upsert: true, new: true }
    );

    res.redirect("/budget?success=Monthly+budget+updated+successfully");
  } catch (err) {
    console.error("Save Budget Error:", err);
    res.redirect("/budget?error=Error+saving+budget");
  }
});

// ======================
// DOWNLOAD PDF REPORT
// ======================
router.get("/download-report", async (req, res) => {
  try {
    const userId = req.session.user._id;
    let { startDate, endDate } = req.query;

    let query = { userId };
    let dateFilterText = "All Time";

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
      dateFilterText = `${startDate || "Beginning"} to ${endDate || "Present"}`;
    }

    const transactions = await Transaction.find(query).sort({ date: 1 });

    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=FinTrack-Report-${Date.now()}.pdf`
    );

    doc.pipe(res);

    // --- PDF Header ---
    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("FinTrack Financial Statement", { align: "center" });

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Generated for: ${req.session.user.name} (${req.session.user.email})`, {
        align: "center",
      })
      .text(`Date Range: ${dateFilterText}`, { align: "center" })
      .text(`Generated On: ${new Date().toLocaleDateString()}`, { align: "center" });

    doc.moveDown(1.5);

    // --- Financial Summary Box ---
    let income = 0;
    let expense = 0;
    transactions.forEach((t) => {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    });
    const balance = income - expense;

    doc.fontSize(14).font("Helvetica-Bold").text("Financial Summary");
    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Total Income  : ${formatCurrency(income)}`)
      .text(`Total Expense : ${formatCurrency(expense)}`)
      .text(`Net Balance   : ${formatCurrency(balance)}`)
      .text(`Total Count   : ${transactions.length} transactions`);

    doc.moveDown(1.5);

    // --- Transactions Section ---
    doc.fontSize(14).font("Helvetica-Bold").text("Transaction Breakdown");
    doc.moveDown(0.5);

    if (transactions.length === 0) {
      doc
        .fontSize(11)
        .font("Helvetica-Oblique")
        .text("No transactions found for the specified date range.", {
          align: "center",
        });
    } else {
      // Table Headers
      const startX = 40;
      let startY = doc.y;
      
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Date", startX, startY, { width: 75 });
      doc.text("Title", startX + 80, startY, { width: 140 });
      doc.text("Type", startX + 225, startY, { width: 60 });
      doc.text("Category", startX + 290, startY, { width: 100 });
      doc.text("Amount", startX + 395, startY, { width: 100, align: "right" });

      doc.moveDown(0.5);
      doc
        .moveTo(startX, doc.y)
        .lineTo(startX + 515, doc.y)
        .stroke();
      doc.moveDown(0.5);

      doc.font("Helvetica").fontSize(9);

      transactions.forEach((t) => {
        // Page overflow check
        if (doc.y > 720) {
          doc.addPage();
          startY = doc.y;
          doc.fontSize(10).font("Helvetica-Bold");
          doc.text("Date", startX, startY, { width: 75 });
          doc.text("Title", startX + 80, startY, { width: 140 });
          doc.text("Type", startX + 225, startY, { width: 60 });
          doc.text("Category", startX + 290, startY, { width: 100 });
          doc.text("Amount", startX + 395, startY, { width: 100, align: "right" });
          doc.moveDown(0.5);
          doc
            .moveTo(startX, doc.y)
            .lineTo(startX + 515, doc.y)
            .stroke();
          doc.moveDown(0.5);
          doc.font("Helvetica").fontSize(9);
        }

        const formattedDate = new Date(t.date).toLocaleDateString("en-IN");
        const currentY = doc.y;

        doc.text(formattedDate, startX, currentY, { width: 75 });
        doc.text(t.title, startX + 80, currentY, { width: 140, height: 12, ellipsis: true });
        doc.text(t.type.toUpperCase(), startX + 225, currentY, { width: 60 });
        doc.text(t.category, startX + 290, currentY, { width: 100, height: 12, ellipsis: true });
        doc.text(formatCurrency(t.amount), startX + 395, currentY, {
          width: 100,
          align: "right",
        });

        doc.moveDown(0.6);
      });
    }

    doc.end();
  } catch (err) {
    console.error("PDF Download Error:", err);
    res.redirect("/dashboard?error=Error+generating+PDF+report");
  }
});

// ======================
// PROFILE & EDIT PROFILE
// ======================
router.get("/profile", async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId);
    const transactions = await Transaction.find({ userId });

    let income = 0;
    let expense = 0;

    transactions.forEach((t) => {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    });

    const balance = income - expense;

    res.render("dashboard/profile", {
      user,
      totalTransactions: transactions.length,
      income,
      expense,
      balance,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) {
    console.error("Profile Error:", err);
    res.redirect("/dashboard?error=Error+loading+profile");
  }
});

router.get("/profile/edit", async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    res.render("dashboard/editProfile", {
      user,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) {
    console.error("Edit Profile Page Error:", err);
    res.redirect("/profile?error=Error+loading+profile+edit+page");
  }
});

router.post("/profile/edit", async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !name.trim()) {
      const user = await User.findById(req.session.user._id);
      return res.render("dashboard/editProfile", {
        user,
        error: "Name is required.",
        success: null,
      });
    }

    const user = await User.findById(req.session.user._id);
    user.name = name.trim();

    if (password && password.trim()) {
      if (password.trim().length < 6) {
        return res.render("dashboard/editProfile", {
          user,
          error: "Password must be at least 6 characters long.",
          success: null,
        });
      }
      user.password = await bcrypt.hash(password.trim(), 10);
    }

    await user.save();

    // Update session user name
    req.session.user.name = user.name;

    res.redirect("/profile?success=Profile+updated+successfully");
  } catch (err) {
    console.error("Profile Update Error:", err);
    res.redirect("/profile?error=Error+updating+profile");
  }
});

module.exports = router;