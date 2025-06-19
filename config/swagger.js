const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Portfolio Builder API',
      version: '2.0.0',
      description: 'Complete API server for a portfolio builder website with OAuth, comprehensive CRUD operations, and testing',
      contact: {
        name: 'API Support',
        email: 'support@portfoliobuilder.com'
      },
      license: {
        name: 'Apache 2.0',
        url: 'https://www.apache.org/licenses/LICENSE-2.0.html'
      }
    },
    servers: [
      {
        url: 'https://cse341-code-student.onrender.com',
        description: 'Production server'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Theme: {
          type: 'object',
          required: ['themeName', 'primaryColor', 'secondaryColor', 'fontFamily'],
          properties: {
            themeName: {
              type: 'string',
              description: 'Unique name for the theme',
              example: 'Modern Dark'
            },
            primaryColor: {
              type: 'string',
              pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$',
              description: 'Primary color in hex format',
              example: '#FF5733'
            },
            secondaryColor: {
              type: 'string',
              pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$',
              description: 'Secondary color in hex format',
              example: '#33FF57'
            },
            fontFamily: {
              type: 'string',
              enum: ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Roboto', 'Open Sans'],
              description: 'Font family for the theme',
              example: 'Roboto'
            },
            isActive: {
              type: 'boolean',
              default: true,
              description: 'Whether the theme is active'
            }
          }
        },
        User: {
          type: 'object',
          required: ['username', 'email', 'fullName'],
          properties: {
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 20,
              pattern: '^[a-zA-Z0-9_]+$',
              description: 'Unique username',
              example: 'john_doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john@example.com'
            },
            fullName: {
              type: 'string',
              minLength: 2,
              description: 'Full name of the user',
              example: 'John Doe'
            },
            bio: {
              type: 'string',
              maxLength: 500,
              description: 'User biography',
              example: 'Full-stack developer with 5 years of experience'
            },
            profilePicture: {
              type: 'string',
              format: 'uri',
              description: 'URL to profile picture',
              example: 'https://example.com/profile.jpg'
            },
            isActive: {
              type: 'boolean',
              default: true,
              description: 'Whether the user is active'
            }
          }
        },
        Project: {
          type: 'object',
          required: ['title', 'description', 'technologies', 'userId'],
          properties: {
            title: {
              type: 'string',
              minLength: 3,
              maxLength: 100,
              description: 'Project title',
              example: 'Portfolio Website'
            },
            description: {
              type: 'string',
              minLength: 10,
              maxLength: 1000,
              description: 'Project description',
              example: 'A modern portfolio website built with React and Node.js'
            },
            technologies: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Technologies used in the project',
              example: ['React', 'Node.js', 'MongoDB']
            },
            githubUrl: {
              type: 'string',
              pattern: '^https://github.com/.*',
              description: 'GitHub repository URL',
              example: 'https://github.com/username/project'
            },
            liveUrl: {
              type: 'string',
              format: 'uri',
              description: 'Live project URL',
              example: 'https://myproject.netlify.app'
            },
            imageUrl: {
              type: 'string',
              format: 'uri',
              description: 'Project image URL',
              example: 'https://example.com/project-image.jpg'
            },
            status: {
              type: 'string',
              enum: ['planning', 'in-progress', 'completed', 'on-hold'],
              description: 'Project status',
              example: 'completed'
            },
            userId: {
              type: 'string',
              description: 'User ID who owns the project',
              example: '507f1f77bcf86cd799439011'
            },
            isActive: {
              type: 'boolean',
              default: true,
              description: 'Whether the project is active'
            }
          }
        },
        Skill: {
          type: 'object',
          required: ['name', 'category', 'proficiencyLevel'],
          properties: {
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              description: 'Skill name',
              example: 'JavaScript'
            },
            category: {
              type: 'string',
              enum: ['frontend', 'backend', 'database', 'devops', 'mobile', 'design', 'other'],
              description: 'Skill category',
              example: 'frontend'
            },
            proficiencyLevel: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              description: 'Proficiency level from 1 to 5',
              example: 4
            },
            description: {
              type: 'string',
              maxLength: 200,
              description: 'Skill description',
              example: 'Expert level JavaScript developer'
            },
            iconUrl: {
              type: 'string',
              format: 'uri',
              description: 'Skill icon URL',
              example: 'https://example.com/js-icon.png'
            },
            isActive: {
              type: 'boolean',
              default: true,
              description: 'Whether the skill is active'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Validation Error'
            },
            message: {
              type: 'string',
              example: 'The request could not be processed'
            },
            details: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['Username is required', 'Email format is invalid']
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully'
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            count: {
              type: 'integer',
              description: 'Number of items returned'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication endpoints'
      },
      {
        name: 'Themes',
        description: 'Theme management endpoints'
      },
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Projects',
        description: 'Project management endpoints'
      },
      {
        name: 'Skills',
        description: 'Skill management endpoints'
      }
    ]
  },
  apis: ['./routes/*.js'] // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;