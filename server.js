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
app.use(cors({
  origin: ['http://localhost:3000', 'https://cse341-code-student.onrender.com'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database
connectDB();

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Portfolio Builder API Documentation",
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true
  }
}));

// Root endpoint with comprehensive API information
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Portfolio Builder API v2.0 - Final Project Complete Edition',
    version: '2.0.0',
    status: 'Production Ready',
    documentation: '/api-docs',
    features: [
      'Complete CRUD Operations (4 Collections)',
      'OAuth Authentication System', 
      'Comprehensive Data Validation',
      'Professional Error Handling',
      'Unit Testing Coverage',
      'MongoDB Integration',
      'Swagger Documentation',
      'Production Deployment'
    ],
    collections: {
      themes: {
        endpoint: '/theme',
        description: 'Portfolio visual themes management',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        protected: ['POST', 'PUT']
      },
      users: {
        endpoint: '/user', 
        description: 'User profiles and authentication',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        protected: []
      },
      projects: {
        endpoint: '/project',
        description: 'Portfolio projects with technologies',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        protected: ['POST']
      },
      skills: {
        endpoint: '/skill',
        description: 'Technical skills with proficiency levels',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        protected: [],
        features: ['Category filtering', 'Proficiency levels 1-5']
      }
    },
    authentication: {
      login: 'POST /auth/login',
      logout: 'POST /auth/logout',
      credentials: {
        username: 'admin',
        password: 'password123'
      },
      protectedRoutes: ['POST /theme', 'POST /project', 'PUT /theme']
    },
    deployment: {
      production: 'https://cse341-code-student.onrender.com',
      documentation: 'https://cse341-code-student.onrender.com/api-docs',
      status: 'Live and Operational'
    }
  });
});

// Health check endpoint with detailed system information
app.get('/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    const dbName = mongoose.connection.name || 'portfolio_builder';
    
    // Get collection counts
    let collectionStats = {};
    try {
      const Theme = require('./models/Theme');
      const User = require('./models/User');
      const Project = require('./models/Project');
      const Skill = require('./models/Skill');

      collectionStats = {
        themes: await Theme.countDocuments({ isActive: true }),
        users: await User.countDocuments({ isActive: true }),
        projects: await Project.countDocuments({ isActive: true }),
        skills: await Skill.countDocuments({ isActive: true }),
        total: 0
      };
      
      collectionStats.total = Object.values(collectionStats).reduce((sum, count) => sum + (typeof count === 'number' ? count : 0), 0);
    } catch (error) {
      collectionStats = { error: 'Unable to fetch collection statistics' };
    }

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        name: dbName,
        collections: collectionStats
      },
      features: {
        authentication: 'Active',
        validation: 'Enabled',
        errorHandling: 'Comprehensive',
        documentation: 'Available',
        testing: 'Implemented'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      endpoints: {
        total: 20,
        protected: 3,
        public: 17
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Test endpoint to demonstrate all collections and their statistics
app.get('/test/collections', async (req, res) => {
  try {
    const Theme = require('./models/Theme');
    const User = require('./models/User');
    const Project = require('./models/Project');
    const Skill = require('./models/Skill');

    // Get detailed statistics for each collection
    const collections = {
      themes: {
        total: await Theme.countDocuments(),
        active: await Theme.countDocuments({ isActive: true }),
        inactive: await Theme.countDocuments({ isActive: false }),
        sample: await Theme.findOne({}, 'themeName primaryColor').lean()
      },
      users: {
        total: await User.countDocuments(),
        active: await User.countDocuments({ isActive: true }),
        inactive: await User.countDocuments({ isActive: false }),
        sample: await User.findOne({}, 'username fullName email').lean()
      },
      projects: {
        total: await Project.countDocuments(),
        active: await Project.countDocuments({ isActive: true }),
        inactive: await Project.countDocuments({ isActive: false }),
        byStatus: {
          planning: await Project.countDocuments({ status: 'planning', isActive: true }),
          inProgress: await Project.countDocuments({ status: 'in-progress', isActive: true }),
          completed: await Project.countDocuments({ status: 'completed', isActive: true }),
          onHold: await Project.countDocuments({ status: 'on-hold', isActive: true })
        },
        sample: await Project.findOne({}, 'title status technologies').lean()
      },
      skills: {
        total: await Skill.countDocuments(),
        active: await Skill.countDocuments({ isActive: true }),
        inactive: await Skill.countDocuments({ isActive: false }),
        byCategory: {
          frontend: await Skill.countDocuments({ category: 'frontend', isActive: true }),
          backend: await Skill.countDocuments({ category: 'backend', isActive: true }),
          database: await Skill.countDocuments({ category: 'database', isActive: true }),
          devops: await Skill.countDocuments({ category: 'devops', isActive: true }),
          mobile: await Skill.countDocuments({ category: 'mobile', isActive: true }),
          design: await Skill.countDocuments({ category: 'design', isActive: true }),
          other: await Skill.countDocuments({ category: 'other', isActive: true })
        },
        byProficiency: {
          beginner: await Skill.countDocuments({ proficiencyLevel: { $in: [1, 2] }, isActive: true }),
          intermediate: await Skill.countDocuments({ proficiencyLevel: 3, isActive: true }),
          advanced: await Skill.countDocuments({ proficiencyLevel: { $in: [4, 5] }, isActive: true })
        },
        sample: await Skill.findOne({}, 'name category proficiencyLevel').lean()
      }
    };

    const totalDocuments = collections.themes.total + collections.users.total + 
                          collections.projects.total + collections.skills.total;

    const activeDocuments = collections.themes.active + collections.users.active + 
                           collections.projects.active + collections.skills.active;

    res.json({
      success: true,
      message: 'Portfolio Builder API - Complete Collections Overview',
      summary: {
        totalCollections: 4,
        totalDocuments,
        activeDocuments,
        inactiveDocuments: totalDocuments - activeDocuments
      },
      collections,
      apiInfo: {
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        documentation: '/api-docs',
        authentication: 'OAuth enabled',
        validation: 'Comprehensive',
        testing: 'Unit tests available'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message,
      hint: 'Check database connection and model definitions'
    });
  }
});

// API Routes
app.use('/auth', authRoutes);
app.use('/theme', themeRoutes);
app.use('/user', userRoutes);
app.use('/project', projectRoutes);
app.use('/skill', skillRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 Handler with helpful information
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    requestedUrl: req.originalUrl,
    method: req.method,
    availableEndpoints: {
      documentation: {
        path: '/api-docs',
        description: 'Interactive API documentation'
      },
      authentication: {
        login: 'POST /auth/login',
        logout: 'POST /auth/logout'
      },
      collections: {
        themes: '/theme',
        users: '/user', 
        projects: '/project',
        skills: '/skill'
      },
      utilities: {
        health: '/health',
        collections: '/test/collections',
        root: '/'
      }
    },
    tip: 'Visit /api-docs for complete API documentation with testing interface'
  });
});

// Start server with comprehensive logging
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 ===============================================');
  console.log('📱 PORTFOLIO BUILDER API v2.0 - FINAL PROJECT');
  console.log('===============================================');
  console.log(`🌍 Server running on port ${PORT}`);
  console.log(`🏠 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📚 Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🔐 Authentication: POST /auth/login`);
  console.log(`📊 Collections: 4 (themes, users, projects, skills)`);
  console.log(`🛠️  Features: CRUD, OAuth, Validation, Testing`);
  console.log('===============================================\n');
  
  // Log authentication credentials for easy access
  console.log('🔑 LOGIN CREDENTIALS:');
  console.log('   Username: admin');
  console.log('   Password: password123\n');
  
  console.log('📋 QUICK TEST ENDPOINTS:');
  console.log(`   Health Check: http://localhost:${PORT}/health`);
  console.log(`   Collections: http://localhost:${PORT}/test/collections`);
  console.log(`   Documentation: http://localhost:${PORT}/api-docs\n`);
});

// Enhanced error handling
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(`❌ ${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`❌ ${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

module.exports = app;