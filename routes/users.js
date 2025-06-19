const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');

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
 * /user:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', checkDBConnection, async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
});

/**
 * @swagger
 * /user/{username}:
 *   get:
 *     summary: Get user by username
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username of the user to retrieve
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:username', checkDBConnection, async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ 
      username: { $regex: new RegExp(username, 'i') },
      isActive: true
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
});

/**
 * @swagger
 * /user:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *           example:
 *             username: "john_doe"
 *             email: "john@example.com"
 *             fullName: "John Doe"
 *             bio: "Full-stack developer"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', checkDBConnection, async (req, res) => {
  try {
    const userData = req.body;
    
    // Validate required fields
    const requiredFields = ['username', 'email', 'fullName'];
    const missingFields = requiredFields.filter(field => !userData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: missingFields.map(field => `${field} is required`)
      });
    }
    
    const newUser = new User(userData);
    await newUser.save();
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
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
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        error: 'Duplicate Entry',
        message: `${field} already exists`
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
});

/**
 * @swagger
 * /user/{username}:
 *   put:
 *     summary: Update user by username
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               fullName:
 *                 type: string
 *               bio:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *                 format: uri
 *           example:
 *             fullName: "John Smith"
 *             bio: "Senior Full-stack Developer"
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:username', checkDBConnection, async (req, res) => {
  try {
    const { username } = req.params;
    const updateData = req.body;
    
    // Don't allow username updates
    delete updateData.username;
    
    const updatedUser = await User.findOneAndUpdate(
      { username, isActive: true },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
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
    
    res.status(500).json({ 
      success: false, 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
});

/**
 * @swagger
 * /user/{username}:
 *   delete:
 *     summary: Delete user by username (soft delete)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User deleted successfully"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:username', checkDBConnection, async (req, res) => {
  try {
    const { username } = req.params;
    
    const deletedUser = await User.findOneAndUpdate(
      { username, isActive: true },
      { isActive: false },
      { new: true }
    );
    
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
});

module.exports = router;