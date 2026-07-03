import express from 'express';
import prisma from '../config/db.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// @desc    Get user budgets with current month's actual spending
// @route   GET /api/budgets
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const budgets = await prisma.budget.findMany({
      where: { user_id: req.user.user_id },
      include: { category: true },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const aggregate = await prisma.expense.aggregate({
          where: {
            user_id: req.user.user_id,
            category_id: budget.category_id,
            expense_date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const actualSpent = aggregate._sum.amount || 0;
        const utilization = budget.monthly_limit > 0 ? (actualSpent / budget.monthly_limit) * 100 : 0;

        return {
          ...budget,
          actual_spent: Math.round(actualSpent * 100) / 100,
          utilization: Math.round(utilization * 100) / 100,
        };
      })
    );

    res.json(budgetsWithSpent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving budgets.' });
  }
});

// @desc    Set or update a budget (upsert)
// @route   POST /api/budgets
// @access  Private
router.post('/', protect, async (req, res) => {
  const { category_id, monthly_limit } = req.body;

  if (!category_id || monthly_limit === undefined) {
    return res.status(400).json({ message: 'Category ID and monthly limit are required.' });
  }

  try {
    const parsedLimit = parseFloat(monthly_limit);
    if (parsedLimit <= 0) {
      return res.status(400).json({ message: 'Monthly limit must be greater than zero.' });
    }

    const category = await prisma.category.findUnique({
      where: { category_id },
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    const budget = await prisma.budget.upsert({
      where: {
        user_id_category_id: {
          user_id: req.user.user_id,
          category_id,
        },
      },
      update: {
        monthly_limit: parsedLimit,
      },
      create: {
        user_id: req.user.user_id,
        category_id,
        monthly_limit: parsedLimit,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json(budget);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error setting budget.' });
  }
});

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const budget = await prisma.budget.findUnique({
      where: { budget_id: req.params.id },
    });

    if (!budget || budget.user_id !== req.user.user_id) {
      return res.status(404).json({ message: 'Budget not found.' });
    }

    await prisma.budget.delete({
      where: { budget_id: req.params.id },
    });

    res.json({ message: 'Budget deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting budget.' });
  }
});

export default router;
