import Notification from '../models/Notification.js';

/**
 * @desc    Get all notifications for the logged-in user
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching notifications.' });
  }
};

/**
 * @desc    Mark all unread notifications as read
 * @route   PUT /api/notifications/mark-read
 * @access  Private
 */
export const markAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { $set: { read: true } });
    res.status(200).json({ success: true, message: 'Notifications marked as read.' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ success: false, message: 'Server error while updating notifications.' });
  }
};