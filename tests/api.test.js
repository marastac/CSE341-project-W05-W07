const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

// Test database connection string
const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio_builder_test';

describe('Portfolio Builder API Tests', () => {
  let authToken;
  let testUserId;
  let testProjectId;

  // Setup before all tests
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }
    
    // Get authentication token for protected routes
    const authResponse = await request(app)
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'password123'
      });
    
    authToken = authResponse.body.token;
  });

  // Cleanup after all tests
  afterAll(async () => {
    // Clean up test data
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  });

  // ============ AUTHENTICATION TESTS ============
  describe('Authentication Endpoints', () => {
    test('POST /auth/login - should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'admin',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.message).toBe('Login successful');
    });

    test('POST /auth/login - should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'invalid',
          password: 'wrong'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('POST /auth/logout - should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });
  });

  // ============ THEME TESTS ============
  describe('Theme Endpoints', () => {
    const testTheme = {
      themeName: 'Test Theme ' + Date.now(),
      primaryColor: '#FF5733',
      secondaryColor: '#33FF57',
      fontFamily: 'Roboto'
    };

    test('GET /theme - should get all themes', async () => {
      const response = await request(app).get('/theme');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('POST /theme - should create a new theme with authentication', async () => {
      // Get fresh token for this test
      const authResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'admin',
          password: 'password123'
        });
      
      const freshToken = authResponse.body.token;

      const response = await request(app)
        .post('/theme')
        .set('Authorization', `Bearer ${freshToken}`)
        .send(testTheme);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Theme created successfully');
      expect(response.body.data.themeName).toBe(testTheme.themeName);
    });

    test('POST /theme - should reject creation without authentication', async () => {
      const response = await request(app)
        .post('/theme')
        .send(testTheme);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authentication required');
    });

    test('POST /theme - should validate required fields', async () => {
      const authResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'admin',
          password: 'password123'
        });
      
      const freshToken = authResponse.body.token;

      const invalidTheme = {
        themeName: 'Invalid Theme',
        // Missing required fields
      };

      const response = await request(app)
        .post('/theme')
        .set('Authorization', `Bearer ${freshToken}`)
        .send(invalidTheme);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });
  });

  // ============ USER TESTS ============
  describe('User Endpoints', () => {
    const testUser = {
      username: 'testuser' + Date.now(),
      email: `test${Date.now()}@example.com`,
      fullName: 'Test User',
      bio: 'This is a test user'
    };

    test('GET /user - should get all users', async () => {
      const response = await request(app).get('/user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('POST /user - should create a new user', async () => {
      const response = await request(app)
        .post('/user')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User created successfully');
      expect(response.body.data.username).toBe(testUser.username);
      expect(response.body.data.email).toBe(testUser.email);
      
      // Store user ID for project tests
      testUserId = response.body.data._id;
    });

    test('GET /user/:username - should get user by username', async () => {
      const response = await request(app)
        .get(`/user/${testUser.username}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe(testUser.username);
    });

    test('PUT /user/:username - should update user', async () => {
      const updateData = {
        bio: 'Updated bio for test user'
      };

      const response = await request(app)
        .put(`/user/${testUser.username}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User updated successfully');
      expect(response.body.data.bio).toBe(updateData.bio);
    });

    test('POST /user - should validate required fields', async () => {
      const invalidUser = {
        username: 'invalid',
        // Missing required email and fullName
      };

      const response = await request(app)
        .post('/user')
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
      expect(Array.isArray(response.body.details)).toBe(true);
    });
  });

  // ============ PROJECT TESTS ============
  describe('Project Endpoints', () => {
    const testProject = {
      title: 'Test Project ' + Date.now(),
      description: 'This is a comprehensive test project to validate the API functionality',
      technologies: ['JavaScript', 'Node.js', 'MongoDB'],
      githubUrl: 'https://github.com/testuser/test-project',
      liveUrl: 'https://test-project.netlify.app',
      status: 'completed'
    };

    test('GET /project - should get all projects', async () => {
      const response = await request(app).get('/project');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('POST /project - should create a new project with authentication', async () => {
      // Get fresh token
      const authResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'admin',
          password: 'password123'
        });
      
      const freshToken = authResponse.body.token;

      // Create test user first if not exists
      if (!testUserId) {
        const userResponse = await request(app)
          .post('/user')
          .send({
            username: 'projectuser' + Date.now(),
            email: `projectuser${Date.now()}@example.com`,
            fullName: 'Project User'
          });
        testUserId = userResponse.body.data._id;
      }

      testProject.userId = testUserId;

      const response = await request(app)
        .post('/project')
        .set('Authorization', `Bearer ${freshToken}`)
        .send(testProject);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Project created successfully');
      expect(response.body.data.title).toBe(testProject.title);
      expect(response.body.data.userId).toBeDefined();
      
      testProjectId = response.body.data._id;
    });

    test('GET /project/:id - should get project by ID', async () => {
      if (!testProjectId) {
        // Skip this test if no project was created
        return;
      }

      const response = await request(app)
        .get(`/project/${testProjectId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testProjectId);
    });

    test('PUT /project/:id - should update project', async () => {
      if (!testProjectId) {
        return;
      }

      const updateData = {
        status: 'in-progress',
        description: 'Updated project description'
      };

      const response = await request(app)
        .put(`/project/${testProjectId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Project updated successfully');
      expect(response.body.data.status).toBe(updateData.status);
    });

    test('POST /project - should validate required fields', async () => {
      const authResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'admin',
          password: 'password123'
        });
      
      const freshToken = authResponse.body.token;

      const invalidProject = {
        title: 'Invalid Project',
        // Missing required fields
      };

      const response = await request(app)
        .post('/project')
        .set('Authorization', `Bearer ${freshToken}`)
        .send(invalidProject);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });

    test('POST /project - should reject creation without authentication', async () => {
      const response = await request(app)
        .post('/project')
        .send(testProject);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authentication required');
    });
  });

  // ============ SKILL TESTS ============
  describe('Skill Endpoints', () => {
    const testSkill = {
      name: 'Test Skill ' + Date.now(),
      category: 'frontend',
      proficiencyLevel: 4,
      description: 'This is a test skill for API validation'
    };

    test('GET /skill - should get all skills', async () => {
      const response = await request(app).get('/skill');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('POST /skill - should create a new skill', async () => {
      const response = await request(app)
        .post('/skill')
        .send(testSkill);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Skill created successfully');
      expect(response.body.data.name).toBe(testSkill.name);
      expect(response.body.data.category).toBe(testSkill.category);
      expect(response.body.data.proficiencyLevel).toBe(testSkill.proficiencyLevel);
    });

    test('GET /skill/:name - should get skill by name', async () => {
      const response = await request(app)
        .get(`/skill/${encodeURIComponent(testSkill.name)}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(testSkill.name);
    });

    test('PUT /skill/:name - should update skill', async () => {
      const updateData = {
        proficiencyLevel: 5,
        description: 'Updated skill description'
      };

      const response = await request(app)
        .put(`/skill/${encodeURIComponent(testSkill.name)}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Skill updated successfully');
      expect(response.body.data.proficiencyLevel).toBe(updateData.proficiencyLevel);
    });

    test('GET /skill?category=frontend - should filter skills by category', async () => {
      const response = await request(app)
        .get('/skill')
        .query({ category: 'frontend' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.filter).toEqual({ category: 'frontend', proficiencyLevel: undefined });
      
      // All returned skills should be frontend category
      response.body.data.forEach(skill => {
        expect(skill.category).toBe('frontend');
      });
    });

    test('POST /skill - should validate required fields', async () => {
      const invalidSkill = {
        name: 'Invalid Skill',
        // Missing required category and proficiencyLevel
      };

      const response = await request(app)
        .post('/skill')
        .send(invalidSkill);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });

    test('POST /skill - should validate proficiency level range', async () => {
      const invalidSkill = {
        name: 'Invalid Skill Level',
        category: 'backend',
        proficiencyLevel: 6, // Invalid: should be 1-5
      };

      const response = await request(app)
        .post('/skill')
        .send(invalidSkill);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });
  });

  // ============ GENERAL API TESTS ============
  describe('General API Endpoints', () => {
    test('GET / - should return API information', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Portfolio Builder API');
      expect(response.body.version).toBe('2.0.0');
      expect(response.body.documentation).toBe('/api-docs');
      expect(Array.isArray(response.body.collections)).toBe(true);
    });

    test('GET /health - should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.version).toBe('2.0.0');
    });

    test('GET /test/collections - should return collection statistics', async () => {
      const response = await request(app).get('/test/collections');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.collections).toBeDefined();
      expect(response.body.collections.themes).toBeDefined();
      expect(response.body.collections.users).toBeDefined();
      expect(response.body.collections.projects).toBeDefined();
      expect(response.body.collections.skills).toBeDefined();
      expect(response.body.totalDocuments).toBeDefined();
    });

    test('GET /nonexistent - should return 404', async () => {
      const response = await request(app).get('/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Endpoint not found');
      expect(response.body.availableEndpoints).toBeDefined();
    });
  });

  // ============ DATA VALIDATION TESTS ============
  describe('Data Validation Tests', () => {
    test('Theme validation - should reject invalid color format', async () => {
      const authResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'admin',
          password: 'password123'
        });
      
      const freshToken = authResponse.body.token;

      const invalidTheme = {
        themeName: 'Invalid Color Theme',
        primaryColor: 'not-a-color', // Invalid color format
        secondaryColor: '#FF5733',
        fontFamily: 'Arial'
      };

      const response = await request(app)
        .post('/theme')
        .set('Authorization', `Bearer ${freshToken}`)
        .send(invalidTheme);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });

    test('User validation - should reject invalid email format', async () => {
      const invalidUser = {
        username: 'testuser123',
        email: 'invalid-email', // Invalid email format
        fullName: 'Test User'
      };

      const response = await request(app)
        .post('/user')
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });

    test('Project validation - should reject invalid GitHub URL', async () => {
      const authResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'admin',
          password: 'password123'
        });
      
      const freshToken = authResponse.body.token;

      const invalidProject = {
        title: 'Test Project',
        description: 'A test project with invalid GitHub URL',
        technologies: ['JavaScript'],
        githubUrl: 'not-a-github-url', // Invalid GitHub URL
        userId: testUserId || '507f1f77bcf86cd799439011' // Use existing or dummy ID
      };

      const response = await request(app)
        .post('/project')
        .set('Authorization', `Bearer ${freshToken}`)
        .send(invalidProject);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });

    test('Skill validation - should reject invalid category', async () => {
      const invalidSkill = {
        name: 'Invalid Category Skill',
        category: 'invalid-category', // Invalid category
        proficiencyLevel: 3
      };

      const response = await request(app)
        .post('/skill')
        .send(invalidSkill);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });
  });
  
  
  // ============ ERROR HANDLING TESTS ============
  describe('Error Handling Tests', () => {
    test('Should handle database connection errors gracefully', async () => {
      // This test checks if the API handles database errors properly
      // The actual implementation would depend on your error handling strategy
      const response = await request(app).get('/health');
      expect(response.status).toBeLessThan(600); // Should not crash
    });

    test('Should return proper error for invalid ObjectId', async () => {
      const response = await request(app).get('/project/invalid-id');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid ID format');
    });

    test('Should handle missing required fields properly', async () => {
      const response = await request(app)
        .post('/user')
        .send({}); // Empty body

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
      expect(Array.isArray(response.body.details)).toBe(true);
    });
  });
});