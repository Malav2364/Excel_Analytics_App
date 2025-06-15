import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  data: {
    type: Array,
    required: true
  },
  headers: {
    type: [String],
    required: true
  },
  charts: [{
    type: {
      type: String,
      enum: ['bar', 'line', 'pie', 'bar3d', 'scatter3d', 'scatter', 'area'], // Ensuring 'scatter' and 'area' are definitely here
      required: true
    },
    xAxis: {
      type: String,
      required: true
    },
    yAxis: {
      type: String,
      required: true
    },
    zAxis: {
      type: String,
      required: false
    },
    name: {
      type: String,
      required: true
    },
    data: {
      type: Object
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const File = mongoose.model('File', fileSchema);
export default File;
