import express from 'express';
import { auth } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import File from '../models/File.js';
import fs from 'fs';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);
const router = express.Router();

// Upload and process Excel file
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  console.log('File upload request received');
  
  if (!req.file) {
    console.log('No file received in request');
    return res.status(400).json({ message: 'No file uploaded' });
  }

  console.log('File received:', {
    name: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    path: req.file.path
  });

  try {
    if (!req.file.path || !fs.existsSync(req.file.path)) {
      throw new Error('Invalid file path or file not found');
    }

    // Read the Excel file
    let workbook;
    try {
      workbook = XLSX.readFile(req.file.path);
    } catch (err) {
      throw new Error(`Failed to read Excel file: ${err.message}`);
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Excel file has no sheets');
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      raw: false,
      defval: '' // Return empty string for empty cells
    });
    
    if (!data || data.length === 0) {
      throw new Error('Excel file is empty or contains no data');
    }

    // Extract headers
    const headers = Object.keys(data[0] || {});

    console.log('Excel file parsed successfully');

    // Create new file document
    const file = new File({
      fileName: req.file.originalname,
      uploadedBy: req.user.id,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      data: data,
      headers: headers
    });

    await file.save();
    console.log('File saved to database');

    // Delete the temporary file
    await unlinkAsync(req.file.path);

    res.json({
      _id: file._id,
      fileName: file.fileName,
      fileSize: file.fileSize,
      headers: file.headers,
      createdAt: file.createdAt
    });
  } catch (error) {
    console.error('Error processing file:', error);
    
    // Clean up the uploaded file if it exists
    if (req.file && req.file.path) {
      try {
        if (fs.existsSync(req.file.path)) {
          await unlinkAsync(req.file.path);
        }
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }
    }

    // Send appropriate error response
    let statusCode = 500;
    let message = 'Internal server error while processing file';

    if (error.message.includes('Failed to read Excel file')) {
      statusCode = 400;
      message = 'Invalid Excel file format';
    } else if (error.message.includes('Excel file is empty')) {
      statusCode = 400;
      message = 'Excel file is empty';
    } else if (error.message.includes('Invalid file path')) {
      statusCode = 400;
      message = 'File upload failed';
    }

    res.status(statusCode).json({ 
      message,
      details: error.message
    });
  }
});

// Get user's files
router.get('/files', auth, async (req, res) => {
  try {
    const files = await File.find({ uploadedBy: req.user.id })
      .select('fileName fileSize createdAt')
      .sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ message: 'Error fetching files' });
  }
});

// Get file by ID
router.get('/files/:id', auth, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      uploadedBy: req.user.id
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.json(file);
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ message: 'Error fetching file' });
  }
});

// Delete file
router.delete('/files/:id', auth, async (req, res) => {
  try {
    const file = await File.findOneAndDelete({
      _id: req.params.id,
      uploadedBy: req.user.id
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Error deleting file' });
  }
});

export default router;
