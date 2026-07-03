import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../config/db.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Multer Config for receipt upload
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadDir = 'uploads/receipts/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Images and PDFs only!'));
    }
  },
});

// Helper: Check budget threshold and trigger notifications
const checkBudgetAlert = async (userId, categoryId) => {
  try {
    const budget = await prisma.budget.findUnique({
      where: {
        user_id_category_id: {
          user_id: userId,
          category_id: categoryId,
        },
      },
      include: {
        category: true,
      },
    });

    if (!budget) return;

    // Get current month range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const aggregate = await prisma.expense.aggregate({
      where: {
        user_id: userId,
        category_id: categoryId,
        expense_date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const totalSpent = aggregate._sum.amount || 0;
    const utilization = (totalSpent / budget.monthly_limit) * 100;

    if (utilization >= 100) {
      await prisma.notification.create({
        data: {
          user_id: userId,
          title: `Budget Exceeded: ${budget.category.category_name}`,
          message: `You have spent ₹${totalSpent.toFixed(2)} of your ₹${budget.monthly_limit.toFixed(2)} budget for ${budget.category.category_name} (${utilization.toFixed(0)}%).`,
        },
      });
    } else if (utilization >= 90) {
      await prisma.notification.create({
        data: {
          user_id: userId,
          title: `Budget Warning: ${budget.category.category_name}`,
          message: `You have spent ₹${totalSpent.toFixed(2)} of your ₹${budget.monthly_limit.toFixed(2)} budget for ${budget.category.category_name} (${utilization.toFixed(0)}% used).`,
        },
      });
    }
  } catch (error) {
    console.error('Error checking budget status:', error);
  }
};

// @desc    Get all expenses with search & filters
// @route   GET /api/expenses
// @access  Private
router.get('/', protect, async (req, res) => {
  const {
    search,
    category_id,
    payment_method,
    filter_preset, // "today", "week", "month", "quarter", "year", "custom"
    start_date,
    end_date,
    min_amount,
    max_amount,
    page = 1,
    limit = 100,
  } = req.query;

  const where = {
    user_id: req.user.user_id,
  };

  // Category filter
  if (category_id) {
    where.category_id = category_id;
  }

  // Payment method filter
  if (payment_method) {
    where.payment_method = payment_method;
  }

  // Amount range filters
  if (min_amount || max_amount) {
    where.amount = {};
    if (min_amount) where.amount.gte = parseFloat(min_amount);
    if (max_amount) where.amount.lte = parseFloat(max_amount);
  }

  // Search filter (description & category name)
  if (search) {
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      {
        category: {
          category_name: { contains: search, mode: 'insensitive' },
        },
      },
    ];
  }

  // Date filters based on preset
  let start;
  let end = new Date();
  
  if (filter_preset) {
    const today = new Date();
    switch (filter_preset) {
      case 'today':
        start = new Date(today.setHours(0, 0, 0, 0));
        break;
      case 'week':
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
        start = new Date(today.setDate(diff));
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'quarter':
        const currentQuarter = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), currentQuarter * 3, 1);
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (start_date) start = new Date(start_date);
        if (end_date) end = new Date(end_date);
        break;
      default:
        break;
    }
  }

  if (start) {
    where.expense_date = {
      gte: start,
      lte: end,
    };
  }

  try {
    const expenses = await prisma.expense.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        expense_date: 'desc',
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    const totalCount = await prisma.expense.count({ where });

    res.json({
      expenses,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving expenses.' });
  }
});

// @desc    Get expense by ID
// @route   GET /api/expenses/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { expense_id: req.params.id },
      include: { category: true },
    });

    if (!expense || expense.user_id !== req.user.user_id) {
      return res.status(404).json({ message: 'Expense record not found.' });
    }

    res.json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving expense record.' });
  }
});

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private
router.post('/', protect, async (req, res) => {
  const { category_id, amount, payment_method, description, expense_date, receipt_url } = req.body;

  if (!category_id || !amount || !payment_method || !expense_date) {
    return res.status(400).json({ message: 'Category, amount, payment method, and date are required.' });
  }

  try {
    const newExpense = await prisma.expense.create({
      data: {
        user_id: req.user.user_id,
        category_id,
        amount: parseFloat(amount),
        payment_method,
        description,
        expense_date: new Date(expense_date),
        receipt_url,
      },
      include: {
        category: true,
      },
    });

    // Check budget limit for category
    await checkBudgetAlert(req.user.user_id, category_id);

    res.status(201).json(newExpense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating expense record.' });
  }
});

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { category_id, amount, payment_method, description, expense_date, receipt_url } = req.body;

  try {
    const expense = await prisma.expense.findUnique({
      where: { expense_id: req.params.id },
    });

    if (!expense || expense.user_id !== req.user.user_id) {
      return res.status(404).json({ message: 'Expense record not found.' });
    }

    const updatedExpense = await prisma.expense.update({
      where: { expense_id: req.params.id },
      data: {
        category_id: category_id || expense.category_id,
        amount: amount ? parseFloat(amount) : expense.amount,
        payment_method: payment_method || expense.payment_method,
        description: description !== undefined ? description : expense.description,
        expense_date: expense_date ? new Date(expense_date) : expense.expense_date,
        receipt_url: receipt_url !== undefined ? receipt_url : expense.receipt_url,
      },
      include: {
        category: true,
      },
    });

    // Check budget limit for category
    await checkBudgetAlert(req.user.user_id, updatedExpense.category_id);

    res.json(updatedExpense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating expense record.' });
  }
});

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { expense_id: req.params.id },
    });

    if (!expense || expense.user_id !== req.user.user_id) {
      return res.status(404).json({ message: 'Expense record not found.' });
    }

    await prisma.expense.delete({
      where: { expense_id: req.params.id },
    });

    res.json({ message: 'Expense record deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting expense record.' });
  }
});

// @desc    Simulate OCR receipt upload
// @route   POST /api/expenses/upload-receipt
// @access  Private
router.post('/upload-receipt', protect, upload.single('receipt'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a file.' });
  }

  try {
    // Generate a file url
    const fileUrl = `/uploads/receipts/${req.file.filename}`;

    // Simulate OCR analysis: wait 1.5 seconds, then return structured mock fields
    const ocrData = {
      receipt_url: fileUrl,
      amount: parseFloat((Math.random() * 500 + 50).toFixed(2)),
      suggested_category: 'Food',
      date: new Date().toISOString().substring(0, 10),
      detected_merchant: 'Fintech Bistro & Coffee',
      confidence: 94,
    };

    res.json({
      message: 'Receipt uploaded and scanned successfully (OCR simulated).',
      ocrData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error parsing receipt.' });
  }
});

export default router;
