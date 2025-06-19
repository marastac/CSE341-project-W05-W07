require('dotenv').config();

// DEBUG: Check environment variables
console.log('🔍 MONGODB_URI:', process.env.MONGODB_URI ? 'EXISTS' : 'MISSING');
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 PORT:', process.env.PORT);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection con configuración mejorada
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Additional configurations to prevent disconnections
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      heartbeatFrequencyMS: 30000, // Check connection every 30 seconds
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    });

    console.log('✅ Connected to MongoDB:', conn.connection.host);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    // Don't exit process, keep trying to reconnect
    setTimeout(connectDB, 5000);
  }
};

// Connect to database
connectDB();

// Connection events handling
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
  // Attempt to reconnect
  setTimeout(connectDB, 5000);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

// MongoDB Schemas
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

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores allowed']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
  },
  fullName: { 
    type: String, 
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters long']
  },
  bio: { 
    type: String, 
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  profilePicture: { 
    type: String, 
    default: 'https://via.placeholder.com/150'
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

userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Models
const Theme = mongoose.model('Theme', themeSchema);
const User = mongoose.model('User', userSchema);

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Portfolio Builder API',
      version: '1.0.0',
      description: 'This is an API server for a portfolio builder website.',
      contact: {
        name: 'Contact the developer'
      },
      license: {
        name: 'Apache 2.0'
      }
    },
    servers: [
      {
        url: 'https://cse341-project-w05-w07.onrender.com',
        description: 'Production server'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
  },
  apis: ['./server.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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

// Error handling middleware
const handleError = (res, error) => {
  console.error('Error:', error);
  
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
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format'
    });
  }
  
  return res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: error.message
  });
};

// Routes

/**
 * @swagger
 * components:
 *   schemas:
 *     Theme:
 *       type: object
 *       required:
 *         - themeName
 *         - primaryColor
 *         - secondaryColor
 *         - fontFamily
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated ID
 *         themeName:
 *           type: string
 *           description: Unique name for the theme
 *         primaryColor:
 *           type: string
 *           description: Primary color in hex format
 *         secondaryColor:
 *           type: string
 *           description: Secondary color in hex format
 *         fontFamily:
 *           type: string
 *           enum: [Arial, Helvetica, Times New Roman, Georgia, Verdana, Roboto, Open Sans]
 *           description: Font family for the theme
 *         isActive:
 *           type: boolean
 *           description: Whether the theme is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - fullName
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated ID
 *         username:
 *           type: string
 *           description: Unique username
 *         email:
 *           type: string
 *           description: User's email address
 *         fullName:
 *           type: string
 *           description: User's full name
 *         bio:
 *           type: string
 *           description: User's biography
 *         profilePicture:
 *           type: string
 *           description: URL to profile picture
 *         isActive:
 *           type: boolean
 *           description: Whether the user is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// Home Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Portfolio Builder API',
    version: '1.0.0',
    documentation: '/api-docs',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    readyState: mongoose.connection.readyState
  });
});

// ============ THEME ROUTES ============

/**
 * @swagger
 * /theme/{themeName}:
 *   get:
 *     summary: Find themes by name
 *     tags: [Themes]
 *     parameters:
 *       - in: path
 *         name: themeName
 *         schema:
 *           type: string
 *         required: true
 *         description: Theme name to search for
 *     responses:
 *       200:
 *         description: Theme found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Theme'
 *       404:
 *         description: Theme not found
 *       500:
 *         description: Server error
 */
app.get('/theme/:themeName', checkDBConnection, async (req, res) => {
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
    handleError(res, error);
  }
});

// ============ USER ROUTES ============

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
 *                 count:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       500:
 *         description: Server error
 */
app.get('/user', checkDBConnection, async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    handleError(res, error);
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
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - fullName
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               fullName:
 *                 type: string
 *               bio:
 *                 type: string
 *               profilePicture:
 *                 type: string
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
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
app.post('/user', checkDBConnection, async (req, res) => {
  try {
    const userData = req.body;
    const newUser = new User(userData);
    await newUser.save();
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
    });
  } catch (error) {
    handleError(res, error);
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
 *         schema:
 *           type: string
 *         required: true
 *         description: Username to search for
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
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
app.get('/user/:username', checkDBConnection, async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username, isActive: true });
    
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
    handleError(res, error);
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
 *         schema:
 *           type: string
 *         required: true
 *         description: Username of user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               fullName:
 *                 type: string
 *               bio:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
app.put('/user/:username', checkDBConnection, async (req, res) => {
  try {
    const { username } = req.params;
    const updateData = req.body;
    
    // Remove username from update data to prevent changes
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
    handleError(res, error);
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
 *         schema:
 *           type: string
 *         required: true
 *         description: Username of user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
app.delete('/user/:username', checkDBConnection, async (req, res) => {
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
    handleError(res, error);
  }
});

// Additional Theme CRUD Operations
/**
 * @swagger
 * /theme:
 *   get:
 *     summary: Get all themes
 *     tags: [Themes]
 *     responses:
 *       200:
 *         description: List of all themes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Theme'
 */
app.get('/theme', checkDBConnection, async (req, res) => {
  try {
    const themes = await Theme.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: themes.length,
      data: themes
    });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * @swagger
 * /theme:
 *   post:
 *     summary: Create a new theme
 *     tags: [Themes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - themeName
 *               - primaryColor
 *               - secondaryColor
 *               - fontFamily
 *             properties:
 *               themeName:
 *                 type: string
 *               primaryColor:
 *                 type: string
 *               secondaryColor:
 *                 type: string
 *               fontFamily:
 *                 type: string
 *     responses:
 *       201:
 *         description: Theme created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
app.post('/theme', checkDBConnection, async (req, res) => {
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
    handleError(res, error);
  }
});

/**
 * @swagger
 * /theme/{themeName}:
 *   put:
 *     summary: Update theme by name
 *     tags: [Themes]
 *     parameters:
 *       - in: path
 *         name: themeName
 *         schema:
 *           type: string
 *         required: true
 *         description: Theme name to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               primaryColor:
 *                 type: string
 *               secondaryColor:
 *                 type: string
 *               fontFamily:
 *                 type: string
 *     responses:
 *       200:
 *         description: Theme updated successfully
 *       404:
 *         description: Theme not found
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
app.put('/theme/:themeName', checkDBConnection, async (req, res) => {
  try {
    const { themeName } = req.params;
    const updateData = req.body;
    
    // Remove themeName from update data to prevent changes
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
    handleError(res, error);
  }
});

/**
 * @swagger
 * /theme/{themeName}:
 *   delete:
 *     summary: Delete theme by name (soft delete)
 *     tags: [Themes]
 *     parameters:
 *       - in: path
 *         name: themeName
 *         schema:
 *           type: string
 *         required: true
 *         description: Theme name to delete
 *     responses:
 *       200:
 *         description: Theme deleted successfully
 *       404:
 *         description: Theme not found
 *       500:
 *         description: Server error
 */
app.delete('/theme/:themeName', checkDBConnection, async (req, res) => {
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
    handleError(res, error);
  }
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    availableEndpoints: {
      documentation: '/api-docs',
      themes: '/theme',
      users: '/user',
      health: '/health'
    }
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
  console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
  
  // Log MongoDB connection status
  if (mongoose.connection.readyState === 1) {
    console.log('💾 MongoDB: Connected');
  } else {
    console.log('💾 MongoDB: Connecting...');
  }
});

// Handle server errors
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

module.exports = app;