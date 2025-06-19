const express = require('express');
const mongoose = require('mongoose');
const Theme = require('../models/Theme');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Middleware to check database connection
const checkDBConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      error: 'Database connection unavailable',
      message: 'Please try again in a few moments'
    });
  }
  next();
};

/**
 * @swagger
 * /theme:
 *   get:
 *     summary: Get all themes
 *     tags: [Themes]
 */
router.get('/', checkDBConnection, async (req, res) => {
  try {
    const themes = await Theme.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: themes.length,
      data: themes
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /theme/{themeName}:
 *   get:
 *     summary: Get theme by name
 *     tags: [Themes]
 */
router.get('/:themeName', checkDBConnection, async (req, res) => {
  try {
    const { themeName } = req.params;
    const theme = await Theme.findOne({ 
      themeName: { $regex: new RegExp(themeName, 'i') },
      isActive: true
    });
    
    if (!theme) {
      return res.status(404).json({
        success: false,
        message: 'Theme not found'
      });
    }
    
    res.json({
      success: true,
      data: theme
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /theme:
 *   post:
 *     summary: Create a new theme (Protected Route)
 *     tags: [Themes]
 *     security:
 *       - BearerAuth: []
 */
router.post('/', checkDBConnection, authenticate, async (req, res) => {
  try {
    const themeData = req.body;
    const newTheme = new Theme(themeData);
    await newTheme.save();
    
    res.status(201).json({
      success: true,
      message: 'Theme created successfully',
      data: newTheme
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: errors
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /theme/{themeName}:
 *   put:
 *     summary: Update theme by name
 *     tags: [Themes]
 */
router.put('/:themeName', checkDBConnection, authenticate, async (req, res) => {
  try {
    const { themeName } = req.params;
    const updateData = req.body;
    
    delete updateData.themeName;
    
    const updatedTheme = await Theme.findOneAndUpdate(
      { themeName, isActive: true },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedTheme) {
      return res.status(404).json({
        success: false,
        message: 'Theme not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Theme updated successfully',
      data: updatedTheme
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /theme/{themeName}:
 *   delete:
 *     summary: Delete theme by name (soft delete)
 *     tags: [Themes]
 */
router.delete('/:themeName', checkDBConnection, async (req, res) => {
  try {
    const { themeName } = req.params;
    
    const deletedTheme = await Theme.findOneAndUpdate(
      { themeName, isActive: true },
      { isActive: false },
      { new: true }
    );
    
    if (!deletedTheme) {
      return res.status(404).json({
        success: false,
        message: 'Theme not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Theme deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;