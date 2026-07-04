import express from 'express';
import prisma from '../config/db.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

// @desc    Trigger AI model training & forecast retrieval
// @route   POST /api/predictions/trigger
// @access  Private
router.post('/trigger', protect, async (req, res) => {
  try {
    // 1. Fetch user's historical expenses
    const expenses = await prisma.expense.findMany({
      where: { user_id: req.user.user_id },
      include: { category: true },
      orderBy: { expense_date: 'asc' },
    });

    if (expenses.length < 5) {
      return res.status(400).json({
        message: 'Insufficient historical data. Please log at least 5 expenses before training the prediction model.',
      });
    }

    // Format expenses for AI service
    const formattedExpenses = expenses.map((exp) => ({
      date: exp.expense_date.toISOString(),
      category: exp.category.category_name,
      amount: exp.amount,
      description: exp.description || '',
    }));

    // 2. Call Python FastAPI AI Service training endpoint
    const trainResponse = await fetch(`${AI_SERVICE_URL}/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expenses: formattedExpenses }),
    });

    if (!trainResponse.ok) {
      const errText = await trainResponse.text();
      throw new Error(`AI Service train failed: ${errText}`);
    }

    // 3. Call Python FastAPI AI Service predict endpoint
    const predictResponse = await fetch(`${AI_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expenses: formattedExpenses }),
    });

    if (!predictResponse.ok) {
      const errText = await predictResponse.text();
      throw new Error(`AI Service prediction failed: ${errText}`);
    }

    const predictionData = await predictResponse.json();

    // 4. Save predictions in DB
    const monthPredictions = predictionData.monthly_forecast || [];
    
    // We will upsert the next month's total predicted expense in the Predictions table
    if (monthPredictions.length > 0) {
      const nextMonthForecast = monthPredictions[0]; // Next month is the first index
      await prisma.prediction.create({
        data: {
          user_id: req.user.user_id,
          prediction_month: nextMonthForecast.month,
          predicted_amount: parseFloat(nextMonthForecast.predicted_amount),
          confidence_score: parseFloat(predictionData.confidence_score),
        },
      });
    }

    // Add a notification that prediction is completed
    await prisma.notification.create({
      data: {
        user_id: req.user.user_id,
        title: 'AI Prediction Completed',
        message: `AI model trained successfully! Your predicted expense for next month is ₹${(monthPredictions[0]?.predicted_amount || 0).toFixed(2)} with a confidence score of ${(predictionData.confidence_score * 100).toFixed(0)}%.`,
      },
    });

    res.json({
      message: 'AI models trained and forecasts generated successfully.',
      predictions: predictionData,
    });
  } catch (error) {
    console.error('Prediction trigger error:', error);
    res.status(500).json({
      message: 'AI Prediction service error. Please verify the AI service is running.',
      error: error.message,
    });
  }
});

// @desc    Get historical saved predictions
// @route   GET /api/predictions
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const predictions = await prisma.prediction.findMany({
      where: { user_id: req.user.user_id },
      orderBy: { created_at: 'desc' },
      take: 10,
    });
    res.json(predictions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving predictions.' });
  }
});

// @desc    Get AI Smart Insights
// @route   GET /api/predictions/insights
// @access  Private
router.get('/insights', protect, async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { user_id: req.user.user_id },
      include: { category: true },
      orderBy: { expense_date: 'asc' },
    });

    if (expenses.length < 5) {
      return res.json({
        insights: [
          'Add more expense logs to start generating smart AI budgeting recommendations.',
        ],
      });
    }

    const formattedExpenses = expenses.map((exp) => ({
      date: exp.expense_date.toISOString(),
      category: exp.category.category_name,
      amount: exp.amount,
      description: exp.description || '',
    }));

    // Call Python FastAPI AI Service insights endpoint
    const response = await fetch(`${AI_SERVICE_URL}/insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expenses: formattedExpenses }),
    });

    if (!response.ok) {
      throw new Error('AI Service insights generation failed');
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Insights generation error:', error);
    res.status(500).json({ message: 'Error calling AI insights engine.' });
  }
});

// @desc    Call AI Chatbot advisor
// @route   POST /api/predictions/chat
// @access  Private
router.post('/chat', protect, async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ message: 'Message text is required.' });
  }

  try {
    const expenses = await prisma.expense.findMany({
      where: { user_id: req.user.user_id },
      include: { category: true },
      orderBy: { expense_date: 'asc' },
    });

    const formattedExpenses = expenses.map((exp) => ({
      date: exp.expense_date.toISOString(),
      category: exp.category.category_name,
      amount: exp.amount,
      description: exp.description || '',
    }));

    const response = await fetch(`${AI_SERVICE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expenses: formattedExpenses,
        message: message
      }),
    });

    if (!response.ok) {
      throw new Error('AI Service chat assistant failed');
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Chat bot error:', error);
    res.status(500).json({ message: 'Error communicating with AI Financial Advisor.' });
  }
});

export default router;
