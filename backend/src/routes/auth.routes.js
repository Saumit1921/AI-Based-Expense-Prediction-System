import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { protect } from '../middleware/auth.middleware.js';
import { sendLoginNotification } from '../utils/mailer.js';
import crypto from 'crypto';

const router = express.Router();

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_jwt_token_key_123456', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
router.post('/signup', async (req, res) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ message: 'Please enter all fields.' });
  }

  try {
    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        full_name,
        email,
        password: hashedPassword,
      },
    });

    // Automatically seed basic budgets for the user
    let categories = await prisma.category.findMany();
    if (categories.length === 0) {
      const defaultCategories = [
        { category_name: 'Food', icon: 'Utensils', color: '#EF4444' },
        { category_name: 'Transport', icon: 'Car', color: '#3B82F6' },
        { category_name: 'Shopping', icon: 'ShoppingBag', color: '#10B981' },
        { category_name: 'Entertainment', icon: 'Tv', color: '#F59E0B' },
        { category_name: 'Utilities', icon: 'Zap', color: '#8B5CF6' },
        { category_name: 'Health', icon: 'Heart', color: '#EC4899' },
        { category_name: 'Education', icon: 'GraduationCap', color: '#6366F1' },
        { category_name: 'Bills', icon: 'FileText', color: '#6B7280' },
        { category_name: 'Rent', icon: 'Home', color: '#14B8A6' },
        { category_name: 'Salary', icon: 'DollarSign', color: '#22C55E' },
        { category_name: 'Investments', icon: 'TrendingUp', color: '#06B6D4' },
        { category_name: 'Others', icon: 'HelpCircle', color: '#94A3B8' }
      ];
      
      await prisma.category.createMany({
        data: defaultCategories
      });
      categories = await prisma.category.findMany();
    }
    const budgetLimits = [
      { name: 'Food', limit: 12000 },
      { name: 'Transport', limit: 3000 },
      { name: 'Shopping', limit: 8000 },
      { name: 'Entertainment', limit: 5000 },
      { name: 'Bills', limit: 8000 },
      { name: 'Rent', limit: 16000 },
    ];
    
    for (const b of budgetLimits) {
      const cat = categories.find(c => c.category_name === b.name);
      if (cat) {
        await prisma.budget.create({
          data: {
            user_id: user.user_id,
            category_id: cat.category_id,
            monthly_limit: b.limit,
          }
        });
      }
    }

    // Clone historical expenses from the default Demo user
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@example.com' },
    });
    
    if (demoUser) {
      const demoExpenses = await prisma.expense.findMany({
        where: { user_id: demoUser.user_id },
      });
      
      const expensesToInsert = demoExpenses.map((exp) => ({
        expense_id: crypto.randomUUID(),
        user_id: user.user_id,
        category_id: exp.category_id,
        amount: exp.amount,
        payment_method: exp.payment_method,
        description: exp.description,
        expense_date: exp.expense_date,
      }));

      const chunkSize = 200;
      for (let i = 0; i < expensesToInsert.length; i += chunkSize) {
        await prisma.expense.createMany({
          data: expensesToInsert.slice(i, i + chunkSize),
        });
      }
    }

    // Automatically seed basic notifications for a new user
    await prisma.notification.create({
      data: {
        user_id: user.user_id,
        title: 'Account Created Successfully!',
        message: `Welcome, ${full_name}! Your dashboard is pre-populated with demo history. Start tracking your expenses now!`,
      }
    });

    res.status(201).json({
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      token: generateToken(user.user_id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Server error during signup: ${error.message}` });
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter email and password.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Trigger email notification async
      sendLoginNotification(user.full_name, user.email).catch(err => {
        console.error('Email alert failed:', err);
      });

      res.json({
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        token: generateToken(user.user_id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Server error during login: ${error.message}` });
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  res.json(req.user);
});

// @desc    Change Password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ message: 'Please enter both current and new passwords.' });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
    });

    if (dbUser && (await bcrypt.compare(current_password, dbUser.password))) {
      const hashedNewPassword = await bcrypt.hash(new_password, 10);
      await prisma.user.update({
        where: { user_id: req.user.user_id },
        data: { password: hashedNewPassword },
      });
      res.json({ message: 'Password updated successfully!' });
    } else {
      res.status(400).json({ message: 'Incorrect current password.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error changing password.' });
  }
});

// @desc    Forgot Password (Simulation)
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found with this email.' });
    }

    // In production, send email reset link. For demonstration:
    res.json({
      message: 'Password reset instructions have been simulated & sent to your email.',
      debug_reset_link: `/reset-password?user=${user.user_id}`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during forgot password process.' });
  }
});

// @desc    Verify Email (Simulation)
// @route   POST /api/auth/verify-email
// @access  Private
router.post('/verify-email', protect, async (req, res) => {
  res.json({
    message: 'Your email has been verified successfully (simulated).'
  });
});

export default router;
