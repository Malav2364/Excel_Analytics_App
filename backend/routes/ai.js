import express from 'express';
import { generateInsights } from '../services/aiService.js';
import File from '../models/File.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// POST /api/ai/:fileId/insights - Generate AI insights for a file
router.post('/:fileId/insights', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Ensure the user requesting insights is the one who uploaded the file
    if (file.uploadedBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'User not authorized to access this file' });
    }

    // Check if data is extracted and available
    if (!file.data || file.data.length === 0) {
      return res.status(400).json({ message: 'No data available in the file to generate insights' });
    }

    const insights = await generateInsights(file.data, file.fileName);
    res.json(insights);

  } catch (error) {
    console.error('Error in AI insights route:', error);
    res.status(500).json({ message: 'Server error while generating insights' });
  }
});

export default router;
