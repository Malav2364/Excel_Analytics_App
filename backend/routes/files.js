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
      data: file.data, // Include the data in the response
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
      .select('fileName fileSize createdAt headers _id') // Ensure headers and _id are selected
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

// Get file charts
router.get('/files/:fileId/charts', auth, async (req, res) => {
  try {
    console.log('Fetching charts for file:', req.params.fileId);
    const file = await File.findById(req.params.fileId);
    if (!file) {
      console.log('File not found:', req.params.fileId);
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user has access to the file
    if (file.uploadedBy.toString() !== req.user.id) {
      console.log('Access denied for user:', req.user.id);
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('Charts found:', file.charts);
    res.json(file.charts || []);
  } catch (error) {
    console.error('Error retrieving charts:', error);
    res.status(500).json({ message: 'Error retrieving charts', error: error.message });
  }
});

// Add a new chart to file
router.post('/files/:fileId/charts', auth, async (req, res) => {
  try {
    console.log('Adding chart to file:', req.params.fileId);
    console.log('Chart data:', req.body);

    const file = await File.findById(req.params.fileId);
    if (!file) {
      console.log('File not found:', req.params.fileId);
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user has access to the file
    if (file.uploadedBy.toString() !== req.user.id) {
      console.log('Access denied for user:', req.user.id);
      return res.status(403).json({ message: 'Access denied' });
    }

    const { type, xAxis, yAxis, zAxis, name } = req.body;

    // Validate chart configuration
    if (!type || !xAxis || !yAxis || !name) {
      console.log('Missing required chart configuration');
      return res.status(400).json({ message: 'Missing required chart configuration' });
    }

    // Validate that the axes exist in the data
    if (!file.headers.includes(xAxis) || !file.headers.includes(yAxis) || (zAxis && !file.headers.includes(zAxis))) {
      console.log('Invalid axis selection');
      return res.status(400).json({ message: 'Invalid axis selection' });
    }

    // Create chart data first
    const chartData = {
      type,
      xAxis,
      yAxis,
      name,
      data: {}
    };

    // Add zAxis if present
    if (zAxis) {
      chartData.zAxis = zAxis;
    }

    // Process the data based on chart type
    try {
      if (type === 'scatter') {
        // For scatter plots, we want individual data points
        const points = file.data.map(item => ({
          x: parseFloat(item[xAxis]), // Ensure numeric conversion
          y: parseFloat(item[yAxis])  // Ensure numeric conversion
        })).filter(point => !isNaN(point.x) && !isNaN(point.y)); // Filter out points with NaN values

        if (points.length === 0) {
          console.log('No valid data points found for scatter plot');
          return res.status(400).json({ message: 'No valid data points found for scatter plot after filtering non-numeric values.' });
        }
        chartData.data = { points }; // Store as an array of points
      } else {
        // Existing aggregation logic for other chart types (bar, line, pie, area, bar3d, scatter3d)
        const xValues = [...new Set(file.data.map(item => item[xAxis]))].filter(val => val !== null && val !== undefined && val !== '');
        
        if (xValues.length === 0) {
          console.log('No valid data found for x-axis');
          return res.status(400).json({ message: 'No valid data found for x-axis' });
        }

        const yValues = xValues.map(xValue => {
          const filteredData = file.data.filter(item => item[xAxis] === xValue);
          const sum = filteredData.reduce((acc, item) => {
            const value = parseFloat(item[yAxis]);
            return acc + (isNaN(value) ? 0 : value);
          }, 0);
          return sum;
        });

        if (type === 'bar3d' || type === 'scatter3d') { // scatter3d might need raw points too, but let's adjust one by one
          if (!zAxis) {
            console.log('Missing zAxis for 3D chart type:', type);
            return res.status(400).json({ message: `zAxis is required for ${type} chart.` });
          }
          if (!file.headers.includes(zAxis)) {
             console.log('Invalid zAxis selection for 3D chart');
             return res.status(400).json({ message: 'Invalid zAxis selection for 3D chart' });
          }
          const zValues = xValues.map(xValue => {
            const filteredData = file.data.filter(item => item[xAxis] === xValue);
            const sum = filteredData.reduce((acc, item) => {
              const value = parseFloat(item[zAxis]);
              return acc + (isNaN(value) ? 0 : value);
            }, 0);
            return sum;
          });
          chartData.data = { x: xValues, y: yValues, z: zValues };
        } else {
          chartData.data = { x: xValues, y: yValues };
        }

        if (chartData.data.x.length === 0 || chartData.data.y.length === 0) {
          console.log('Failed to process chart data with aggregation');
          return res.status(400).json({ message: 'Failed to process chart data with aggregation' });
        }
      }

      // Add the processed chart to the file
      file.charts.push(chartData);
      await file.save();

      console.log('Chart added successfully');
      res.json(file.charts[file.charts.length - 1]);
    } catch (error) {
      console.error('Error processing chart data:', error);
      res.status(500).json({ message: 'Error processing chart data', error: error.message });
    }
  } catch (error) {
    console.error('Error adding chart:', error);
    res.status(500).json({ message: 'Error adding chart', error: error.message });
  }
});

// Update a chart
router.put('/files/:fileId/charts/:chartId', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user has access to the file
    if (file.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { type, xAxis, yAxis, name } = req.body;

    // Validate chart configuration
    if (!type || !xAxis || !yAxis || !name) {
      return res.status(400).json({ message: 'Missing required chart configuration' });
    }

    // Find and update chart
    const chart = file.charts.id(req.params.chartId);
    if (!chart) {
      return res.status(404).json({ message: 'Chart not found' });
    }

    chart.type = type;
    chart.xAxis = xAxis;
    chart.yAxis = yAxis;
    chart.name = name;

    await file.save();
    res.json(chart);
  } catch (error) {
    res.status(500).json({ message: 'Error updating chart', error: error.message });
  }
});

// Delete a chart
router.delete('/files/:fileId/charts/:chartId', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user has access to the file
    if (file.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove chart
    file.charts.pull(req.params.chartId);
    await file.save();

    res.json({ message: 'Chart deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting chart', error: error.message });
  }
});

export default router;
