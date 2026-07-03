import express from 'express';
import prisma from '../config/db.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// @desc    Get all categories (system default + user specific)
// @route   GET /api/categories
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { user_id: null }, // System defaults
          { user_id: req.user.user_id } // User specific
        ]
      },
      orderBy: { category_name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving categories.' });
  }
});

// @desc    Create a custom category
// @route   POST /api/categories
// @access  Private
router.post('/', protect, async (req, res) => {
  const { category_name, icon, color } = req.body;

  if (!category_name || !icon || !color) {
    return res.status(400).json({ message: 'Category name, icon, and color are required.' });
  }

  try {
    // Check if category name exists globally or for this user
    const existing = await prisma.category.findFirst({
      where: {
        category_name: {
          equals: category_name,
          mode: 'insensitive'
        },
        OR: [
          { user_id: null },
          { user_id: req.user.user_id }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'A category with this name already exists.' });
    }

    const newCategory = await prisma.category.create({
      data: {
        category_name,
        icon,
        color,
        user_id: req.user.user_id
      }
    });

    res.status(201).json(newCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating category.' });
  }
});

// @desc    Delete a custom category
// @route   DELETE /api/categories/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { category_id: req.params.id }
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    // Ensure it is a custom category owned by the user
    if (!category.user_id || category.user_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Cannot delete system categories or other users\' categories.' });
    }

    await prisma.category.delete({
      where: { category_id: req.params.id }
    });

    res.json({ message: 'Category deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting category.' });
  }
});

export default router;
