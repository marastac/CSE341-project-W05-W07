require('dotenv').config();

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

// Import configurations
const connectDB = require('./config/database');
const swaggerSpec = require('./config/swagger');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const themeRoutes = require('./routes/themes');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const skillRoutes = require('./routes/skills');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database
connectDB();

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Portfolio Builder API v2.0',
    version: '2.0.0',
    documentation: '/api-docs',
    features: ['CRUD Operations', 'OAuth Authentication', 'Data Validation', 'Comprehensive Testing'],
    collections: ['themes', 'users', 'projects', 'skills']
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/theme', themeRoutes);
app.use('/user', userRoutes);
app.use('/project', projectRoutes);
app.use('/skill', skillRoutes);

// Agregar después de las rutas principales en server.js, antes del error handler

// Test endpoint to check collections
app.get('/test/collections', async (req, res) => {
  try {
    const Theme = require('./models/Theme');
    const User = require('./models/User');
    const Project = require('./models/Project');
    const Skill = require('./models/Skill');

    const collections = {
      themes: await Theme.countDocuments({ isActive: true }),
      users: await User.countDocuments({ isActive: true }),
      projects: await Project.countDocuments({ isActive: true }),
      skills: await Skill.countDocuments({ isActive: true })
    };

    const totalDocuments = Object.values(collections).reduce((sum, count) => sum + count, 0);

    res.json({
      success: true,
      message: 'Collections statistics retrieved successfully',
      collections,
      totalDocuments,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Error handling middleware
app.use(errorHandler);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    availableEndpoints: {
      documentation: '/api-docs',
      authentication: '/auth/login',
      themes: '/theme',
      users: '/user',
      projects: '/project',
      skills: '/skill',
      health: '/health'
    }
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🔐 Authentication: POST /auth/login (username: admin, password: password123)`);
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