const express = require('express');
const mongoose = require('mongoose');
const Skill = require('../models/Skill');

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
 * /skill:
 *   get:
 *     summary: Get all skills
 *     tags: [Skills]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [frontend, backend, database, devops, mobile, design, other]
 *         description: Filter skills by category
 *       - in: query
 *         name: proficiencyLevel
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filter skills by proficiency level
 *     responses:
 *       200:
 *         description: List of all skills
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
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Skill'
 *                 filter:
 *                   type: object
 *                   description: Applied filters
 */
router.get('/', checkDBConnection, async (req, res) => {
  try {
    const { category, proficiencyLevel } = req.query;
    let filter = { isActive: true };
    
    if (category) {
      filter.category = category.toLowerCase();
    }
    
    if (proficiencyLevel) {
      const level = parseInt(proficiencyLevel);
      if (level >= 1 && level <= 5) {
        filter.proficiencyLevel = level;
      }
    }
    
    const skills = await Skill.find(filter).sort({ createdAt: -1 });
    
    const response = {
      success: true,
      count: skills.length,
      data: skills
    };
    
    if (category || proficiencyLevel) {
      response.filter = { category, proficiencyLevel };
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
 * /skill/{name}:
 *   get:
 *     summary: Get skill by name
 *     tags: [Skills]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the skill to retrieve
 *     responses:
 *       200:
 *         description: Skill found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Skill'
 *       404:
 *         description: Skill not found
 */
router.get('/:name', checkDBConnection, async (req, res) => {
  try {
    const { name } = req.params;
    const skill = await Skill.findOne({ 
      name: { $regex: new RegExp(name, 'i') },
      isActive: true
    });
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }
    
    res.json({
      success: true,
      data: skill
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
 * /skill:
 *   post:
 *     summary: Create a new skill
 *     tags: [Skills]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Skill'
 *           example:
 *             name: "JavaScript"
 *             category: "frontend"
 *             proficiencyLevel: 5
 *             description: "Expert level JavaScript developer with 5+ years experience"
 *     responses:
 *       201:
 *         description: Skill created successfully
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
 *                   example: "Skill created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Skill'
 *       400:
 *         description: Validation error
 */
router.post('/', checkDBConnection, async (req, res) => {
  try {
    const skillData = req.body;
    
    // Validate required fields
    const requiredFields = ['name', 'category', 'proficiencyLevel'];
    const missingFields = requiredFields.filter(field => !skillData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: missingFields.map(field => `${field} is required`)
      });
    }
    
    // Validate proficiency level
    if (skillData.proficiencyLevel < 1 || skillData.proficiencyLevel > 5) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: ['Proficiency level must be between 1 and 5']
      });
    }
    
    // Validate category
    const validCategories = ['frontend', 'backend', 'database', 'devops', 'mobile', 'design', 'other'];
    if (!validCategories.includes(skillData.category.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: [`Category must be one of: ${validCategories.join(', ')}`]
      });
    }
    
    const newSkill = new Skill(skillData);
    await newSkill.save();
    
    res.status(201).json({
      success: true,
      message: 'Skill created successfully',
      data: newSkill
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
      return res.status(400).json({
        success: false,
        error: 'Duplicate Entry',
        message: 'Skill name already exists'
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
 * /skill/{name}:
 *   put:
 *     summary: Update skill by name
 *     tags: [Skills]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the skill to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [frontend, backend, database, devops, mobile, design, other]
 *               proficiencyLevel:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               description:
 *                 type: string
 *               iconUrl:
 *                 type: string
 *           example:
 *             proficiencyLevel: 5
 *             description: "Updated skill description"
 *     responses:
 *       200:
 *         description: Skill updated successfully
 *       404:
 *         description: Skill not found
 */
router.put('/:name', checkDBConnection, async (req, res) => {
  try {
    const { name } = req.params;
    const updateData = req.body;
    
    // Don't allow name updates
    delete updateData.name;
    
    // Validate proficiency level if provided
    if (updateData.proficiencyLevel !== undefined) {
      if (updateData.proficiencyLevel < 1 || updateData.proficiencyLevel > 5) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: ['Proficiency level must be between 1 and 5']
        });
      }
    }
    
    // Validate category if provided
    if (updateData.category) {
      const validCategories = ['frontend', 'backend', 'database', 'devops', 'mobile', 'design', 'other'];
      if (!validCategories.includes(updateData.category.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: [`Category must be one of: ${validCategories.join(', ')}`]
        });
      }
    }
    
    const updatedSkill = await Skill.findOneAndUpdate(
      { name: { $regex: new RegExp(`^${name}$`, 'i') }, isActive: true },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedSkill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Skill updated successfully',
      data: updatedSkill
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
 * /skill/{name}:
 *   delete:
 *     summary: Delete skill by name (soft delete)
 *     tags: [Skills]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the skill to delete
 *     responses:
 *       200:
 *         description: Skill deleted successfully
 *       404:
 *         description: Skill not found
 */
router.delete('/:name', checkDBConnection, async (req, res) => {
  try {
    const { name } = req.params;
    
    const deletedSkill = await Skill.findOneAndUpdate(
      { name: { $regex: new RegExp(`^${name}$`, 'i') }, isActive: true },
      { isActive: false },
      { new: true }
    );
    
    if (!deletedSkill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Skill deleted successfully'
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