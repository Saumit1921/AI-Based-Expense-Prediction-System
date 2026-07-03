import express from 'express';
import prisma from '../config/db.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Helper: Get start and end date of past periods
const getDateRanges = (preset, start_date, end_date) => {
  const today = new Date();
  let start = new Date(today.getFullYear(), today.getMonth(), 1); // default current month
  let end = new Date();

  switch (preset) {
    case 'today':
      start = new Date(today.setHours(0, 0, 0, 0));
      end = new Date(today.setHours(23, 59, 59, 999));
      break;
    case 'week':
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(today.setDate(diff));
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
      break;
    case 'quarter':
      const quarter = Math.floor(today.getMonth() / 3);
      start = new Date(today.getFullYear(), quarter * 3, 1);
      end = new Date(today.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59);
      break;
    case 'year':
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
      break;
    case 'custom':
      if (start_date) start = new Date(start_date);
      if (end_date) end = new Date(end_date);
      break;
    default:
      break;
  }
  return { start, end };
};

// @desc    Get detailed financial report summaries
// @route   GET /api/reports/summary
// @access  Private
router.get('/summary', protect, async (req, res) => {
  const { filter_preset = 'month', start_date, end_date } = req.query;
  const { start, end } = getDateRanges(filter_preset, start_date, end_date);

  try {
    // 1. Fetch expenses in range
    const expenses = await prisma.expense.findMany({
      where: {
        user_id: req.user.user_id,
        expense_date: { gte: start, lte: end },
      },
      include: { category: true },
      orderBy: { expense_date: 'desc' },
    });

    // 2. Fetch categories
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ user_id: null }, { user_id: req.user.user_id }],
      },
    });

    // 3. Fetch budgets
    const budgets = await prisma.budget.findMany({
      where: { user_id: req.user.user_id },
      include: { category: true },
    });

    // Calculations
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Category distribution
    const categoryDistribution = categories.map((cat) => {
      const catExpenses = expenses.filter((e) => e.category_id === cat.category_id);
      const amount = catExpenses.reduce((sum, e) => sum + e.amount, 0);
      const percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
      
      const budget = budgets.find((b) => b.category_id === cat.category_id);
      const budgetLimit = budget ? budget.monthly_limit : 0;
      const budgetUtilization = budgetLimit > 0 ? (amount / budgetLimit) * 100 : 0;

      return {
        category_id: cat.category_id,
        category_name: cat.category_name,
        color: cat.color,
        icon: cat.icon,
        total_amount: Math.round(amount * 100) / 100,
        percentage: Math.round(percentage * 10) / 10,
        budget_limit: budgetLimit,
        budget_utilization: Math.round(budgetUtilization * 10) / 10,
      };
    }).filter(c => c.total_amount > 0);

    // Payment methods aggregation
    const paymentMethods = {};
    expenses.forEach((e) => {
      paymentMethods[e.payment_method] = (paymentMethods[e.payment_method] || 0) + e.amount;
    });
    const paymentDistribution = Object.keys(paymentMethods).map((method) => ({
      method,
      amount: Math.round(paymentMethods[method] * 100) / 100,
    }));

    // Weekly trend (split into weeks in the range)
    const weeklyData = {};
    expenses.forEach((e) => {
      const d = new Date(e.expense_date);
      // Get week number/start of week
      const startOfWeek = new Date(d.setDate(d.getDate() - d.getDay() + 1)).toISOString().substring(0, 10);
      weeklyData[startOfWeek] = (weeklyData[startOfWeek] || 0) + e.amount;
    });

    const weeklyTrend = Object.keys(weeklyData).map((week) => ({
      week,
      amount: Math.round(weeklyData[week] * 100) / 100,
    })).sort((a, b) => a.week.localeCompare(b.week));

    // Calculate growth compared to previous period
    // e.g., if month, compare to previous month
    let previousStart = new Date(start);
    let previousEnd = new Date(end);

    if (filter_preset === 'month') {
      previousStart.setMonth(previousStart.getMonth() - 1);
      previousEnd.setMonth(previousEnd.getMonth() - 1);
    } else if (filter_preset === 'week') {
      previousStart.setDate(previousStart.getDate() - 7);
      previousEnd.setDate(previousEnd.getDate() - 7);
    } else {
      // default 30 days back
      previousStart.setDate(previousStart.getDate() - 30);
      previousEnd.setDate(previousEnd.getDate() - 30);
    }

    const previousExpenses = await prisma.expense.aggregate({
      where: {
        user_id: req.user.user_id,
        expense_date: { gte: previousStart, lte: previousEnd },
      },
      _sum: { amount: true },
    });

    const previousTotalSpent = previousExpenses._sum.amount || 0;
    const growthRate = previousTotalSpent > 0 
      ? ((totalSpent - previousTotalSpent) / previousTotalSpent) * 100 
      : 0;

    res.json({
      period: filter_preset,
      start_date: start,
      end_date: end,
      total_spent: Math.round(totalSpent * 100) / 100,
      previous_spent: Math.round(previousTotalSpent * 100) / 100,
      growth_rate: Math.round(growthRate * 10) / 10,
      expense_count: expenses.length,
      category_distribution: categoryDistribution,
      payment_distribution: paymentDistribution,
      weekly_trend: weeklyTrend,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating report summary.' });
  }
});

// @desc    Export expenses list as CSV
// @route   GET /api/reports/export/csv
// @access  Private
router.get('/export/csv', protect, async (req, res) => {
  const { filter_preset = 'month', start_date, end_date } = req.query;
  const { start, end } = getDateRanges(filter_preset, start_date, end_date);

  try {
    const expenses = await prisma.expense.findMany({
      where: {
        user_id: req.user.user_id,
        expense_date: { gte: start, lte: end },
      },
      include: { category: true },
      orderBy: { expense_date: 'desc' },
    });

    // Generate CSV String
    let csvContent = 'Date,Category,Amount,Payment Method,Description\n';
    
    expenses.forEach((e) => {
      const formattedDate = new Date(e.expense_date).toISOString().replace(/T/, ' ').replace(/\..+/, '');
      const description = e.description ? `"${e.description.replace(/"/g, '""')}"` : '';
      csvContent += `${formattedDate},${e.category.category_name},${e.amount},${e.payment_method},${description}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Expense_Report_${filter_preset}_${Date.now()}.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error exporting CSV.' });
  }
});

export default router;
