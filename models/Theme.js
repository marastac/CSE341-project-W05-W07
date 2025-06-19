const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema({
  themeName: { 
    type: String, 
    required: [true, 'Theme name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Theme name must be at least 2 characters long']
  },
  primaryColor: { 
    type: String, 
    required: [true, 'Primary color is required'],
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format']
  },
  secondaryColor: { 
    type: String, 
    required: [true, 'Secondary color is required'],
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format']
  },
  fontFamily: { 
    type: String, 
    required: [true, 'Font family is required'],
    enum: ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Roboto', 'Open Sans']
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
themeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Theme', themeSchema);