const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Skill name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Skill name must be at least 2 characters long'],
    maxlength: [50, 'Skill name cannot exceed 50 characters']
  },
  category: {
    type: String,
    required: [true, 'Skill category is required'],
    enum: ['frontend', 'backend', 'database', 'devops', 'mobile', 'design', 'other'],
    lowercase: true
  },
  proficiencyLevel: {
    type: Number,
    required: [true, 'Proficiency level is required'],
    min: [1, 'Proficiency level must be between 1 and 5'],
    max: [5, 'Proficiency level must be between 1 and 5']
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters'],
    default: ''
  },
  iconUrl: {
    type: String,
    default: 'https://via.placeholder.com/50x50'
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
skillSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Skill', skillSchema);