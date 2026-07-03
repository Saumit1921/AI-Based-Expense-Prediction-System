import express from 'express';
import prisma from '../config/db.js';
import { protect, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply protect & isAdmin to all routes in this file
router.use(protect);
router.use(isAdmin);

// @desc    Get system global dashboard analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
router.get('/analytics', async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalExpensesCount = await prisma.expense.count();
    const totalExpensesSum = await prisma.expense.aggregate({
      _sum: { amount: true },
    });
    const totalBudgetsCount = await prisma.budget.count();
    const totalPredictionsCount = await prisma.prediction.count();

    // User growth (grouped by month registered)
    const users = await prisma.user.findMany({
      select: { created_at: true },
    });
    const registrationsByMonth = {};
    users.forEach((u) => {
      const month = new Date(u.created_at).toISOString().substring(0, 7);
      registrationsByMonth[month] = (registrationsByMonth[month] || 0) + 1;
    });

    const userGrowth = Object.keys(registrationsByMonth).map((month) => ({
      month,
      registrations: registrationsByMonth[month],
    })).sort((a, b) => a.month.localeCompare(b.month));

    // Category distribution globally
    const categories = await prisma.category.findMany();
    const globalCategoryDistribution = await Promise.all(
      categories.map(async (cat) => {
        const sumAgg = await prisma.expense.aggregate({
          where: { category_id: cat.category_id },
          _sum: { amount: true },
        });
        return {
          category_name: cat.category_name,
          color: cat.color,
          total_spent: sumAgg._sum.amount || 0,
        };
      })
    );

    res.json({
      total_users: totalUsers,
      total_expenses_count: totalExpensesCount,
      total_expenses_sum: Math.round((totalExpensesSum._sum.amount || 0) * 100) / 100,
      total_budgets_count: totalBudgetsCount,
      total_predictions_count: totalPredictionsCount,
      user_growth: userGrowth,
      global_category_distribution: globalCategoryDistribution.filter(c => c.total_spent > 0),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating administrator analytics.' });
  }
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        user_id: true,
        full_name: true,
        email: true,
        role: true,
        created_at: true,
        _count: {
          select: { expenses: true, budgets: true }
        }
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving users.' });
  }
});

// @desc    Change user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
router.put('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!role || !['USER', 'ADMIN'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role specified.' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { user_id: req.params.id },
      data: { role },
      select: {
        user_id: true,
        full_name: true,
        email: true,
        role: true,
      },
    });
    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error changing user role.' });
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.params.id },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.user_id === req.user.user_id) {
      return res.status(400).json({ message: 'Administrators cannot delete their own accounts.' });
    }

    await prisma.user.delete({
      where: { user_id: req.params.id },
    });

    res.json({ message: 'User and all associated data deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting user.' });
  }
});

// @desc    Get all system expenses
// @route   GET /api/admin/expenses
// @access  Private/Admin
router.get('/expenses', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      include: {
        category: true,
        user: {
          select: { full_name: true, email: true }
        }
      },
      orderBy: { expense_date: 'desc' },
      take: 100, // limit to recent 100 for safety
    });
    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving system-wide expenses.' });
  }
});

export default router;
