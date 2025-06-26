import express from 'express';
import User from '../models/User.js';
import File from '../models/File.js';
import {auth} from '../middleware/auth.js';

const router = express.Router();

// Middleware to check for admin role
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
};

// GET /api/admin/stats - Get dashboard statistics
router.get('/stats', auth, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalFiles = await File.countDocuments();

    // New stats
    const allFiles = await File.find({}, 'fileSize mimeType charts');
    const totalSize = allFiles.reduce((acc, file) => acc + file.fileSize, 0);
    const averageFileSize = totalFiles > 0 ? totalSize / totalFiles : 0;

    const fileTypes = allFiles.reduce((acc, file) => {
      acc[file.mimeType] = (acc[file.mimeType] || 0) + 1;
      return acc;
    }, {});

    const totalCharts = allFiles.reduce((acc, file) => acc + (file.charts ? file.charts.length : 0), 0);

    res.json({ 
        totalUsers, 
        totalFiles,
        averageFileSize,
        fileTypes,
        totalCharts
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/activity - Get recent activities
router.get('/activity', auth, isAdmin, async (req, res) => {
  try {
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('username createdAt');
    const recentFiles = await File.find().sort({ createdAt: -1 }).limit(5).populate('uploadedBy', 'username').select('fileName createdAt uploadedBy');

    const activities = [
      ...recentUsers.map(u => ({ _id: u._id, type: 'user-registration', message: `${u.username} registered`, timestamp: u.createdAt })),
      ...recentFiles.map(f => ({ _id: f._id, type: 'file-upload', message: `${f.fileName} by ${f.uploadedBy ? f.uploadedBy.username : 'Unknown'}`, timestamp: f.createdAt }))
    ];

    // Sort combined activity by date descending
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json(activities.slice(0, 10)); // Send the top 10 latest activities

  } catch (error) {
    console.error('Error fetching admin activity:', error);
    res.status(500).json({ message: 'Failed to fetch admin activity' });
  }
});

// GET /api/admin/users - Get all users
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      const regex = new RegExp(search, 'i'); // Case-insensitive regex
      query = {
        $or: [{ username: regex }, { email: regex }],
      };
    }
    const users = await User.find(query).select('-password'); // Exclude passwords
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/users - Add a new user
router.post('/users', auth, isAdmin, async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }
        user = new User({ username, email, password, role });
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


// DELETE /api/admin/users/:id - Delete a user
router.delete('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
