const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  technologies: [{
    type: String,
    required: true,
    trim: true
  }],
  githubUrl: {
    type: String,
    match: [/^https:\/\/github\.com\/.*/, 'Invalid GitHub URL format']
  },
  liveUrl: {
    type: String,
    match: [/^https?:\/\/.*/, 'Invalid URL format']
  },
  imageUrl: {
    type: String,
    default: 'https://via.placeholder.com/400x300'
  },
  status: {
    type: String,
    enum: ['planning', 'in-progress', 'completed', 'on-hold'],
    default: 'planning'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before saving
projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Project', projectSchema);