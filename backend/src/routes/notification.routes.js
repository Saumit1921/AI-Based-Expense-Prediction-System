import express from 'express';
import prisma from '../config/db.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// @desc    Get all notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id: req.user.user_id },
      orderBy: { created_at: 'desc' },
    });
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving notifications.' });
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { notification_id: req.params.id },
    });

    if (!notification || notification.user_id !== req.user.user_id) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    const updated = await prisma.notification.update({
      where: { notification_id: req.params.id },
      data: { read_status: true },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating notification.' });
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { user_id: req.user.user_id, read_status: false },
      data: { read_status: true },
    });
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error marking notifications as read.' });
  }
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { notification_id: req.params.id },
    });

    if (!notification || notification.user_id !== req.user.user_id) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    await prisma.notification.delete({
      where: { notification_id: req.params.id },
    });

    res.json({ message: 'Notification deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting notification.' });
  }
});

export default router;
