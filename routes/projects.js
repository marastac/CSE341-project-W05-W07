const express = require('express');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const User = require('../models/User');
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

// Middleware to validate ObjectId
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format'
    });
  }
  next();
};

/**
 * @swagger
 * /project:
 *   get:
 *     summary: Get all projects
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [planning, in-progress, completed, on-hold]
 *         description: Filter projects by status
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter projects by user ID
 *     responses:
 *       200:
 *         description: List of all projects
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
 *                     $ref: '#/components/schemas/Project'
 *                 filter:
 *                   type: object
 *                   description: Applied filters
 */
router.get('/', checkDBConnection, async (req, res) => {
  try {
    const { status, userId } = req.query;
    let filter = { isActive: true };
    
    if (status) {
      filter.status = status;
    }
    
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user ID format'
        });
      }
      filter.userId = userId;
    }
    
    const projects = await Project.find(filter)
      .populate('userId', 'username fullName email')
      .sort({ createdAt: -1 });
    
    const response = {
      success: true,
      count: projects.length,
      data: projects
    };
    
    if (status || userId) {
      response.filter = { status, userId };
    }
    
    res.json(response);
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
 * /project/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       404:
 *         description: Project not found
 */
router.get('/:id', checkDBConnection, validateObjectId, async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findOne({ 
      _id: id,
      isActive: true
    }).populate('userId', 'username fullName email');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      data: project
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
 * /project:
 *   post:
 *     summary: Create a new project (Protected Route)
 *     tags: [Projects]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Project'
 *           example:
 *             title: "Portfolio Website"
 *             description: "A modern portfolio website built with React and Node.js"
 *             technologies: ["React", "Node.js", "MongoDB"]
 *             githubUrl: "https://github.com/username/portfolio"
 *             liveUrl: "https://myportfolio.netlify.app"
 *             status: "completed"
 *             userId: "507f1f77bcf86cd799439011"
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 */
router.post('/', checkDBConnection, authenticate, async (req, res) => {
  try {
    const projectData = req.body;
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'technologies', 'userId'];
    const missingFields = requiredFields.filter(field => !projectData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: missingFields.map(field => `${field} is required`)
      });
    }
    
    // Validate userId exists
    if (!mongoose.Types.ObjectId.isValid(projectData.userId)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: ['Invalid user ID format']
      });
    }
    
    const userExists = await User.findById(projectData.userId);
    if (!userExists) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: ['User not found']
      });
    }
    
    const newProject = new Project(projectData);
    await newProject.save();
    
    // Populate user data in response
    await newProject.populate('userId', 'username fullName email');
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: newProject
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
 * /project/{id}:
 *   put:
 *     summary: Update project by ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               technologies:
 *                 type: array
 *                 items:
 *                   type: string
 *               githubUrl:
 *                 type: string
 *               liveUrl:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [planning, in-progress, completed, on-hold]
 *           example:
 *             status: "completed"
 *             description: "Updated project description"
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       404:
 *         description: Project not found
 */
router.put('/:id', checkDBConnection, validateObjectId, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Don't allow direct userId updates
    delete updateData.userId;
    
    const updatedProject = await Project.findOneAndUpdate(
      { _id: id, isActive: true },
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'username fullName email');
    
    if (!updatedProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject
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
 * /project/{id}:
 *   delete:
 *     summary: Delete project by ID (soft delete)
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       404:
 *         description: Project not found
 */
router.delete('/:id', checkDBConnection, validateObjectId, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedProject = await Project.findOneAndUpdate(
      { _id: id, isActive: true },
      { isActive: false },
      { new: true }
    );
    
    if (!deletedProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Project deleted successfully'
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