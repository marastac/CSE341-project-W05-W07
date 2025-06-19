const express = require('express');
const { generateToken, authenticate, invalidateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login to get authentication token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simple authentication (in production, verify against database)
  if (username === 'admin' && password === 'password123') {
    const token = generateToken();
    res.json({
      success: true,
      message: 'Login successful',
      token: token,
      instructions: 'Use this token in Authorization header as: Bearer [token]'
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials',
      hint: 'Use username: admin, password: password123'
    });
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout and invalidate token
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Authentication required
 */
router.post('/logout', authenticate, (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  invalidateToken(token);
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = router;