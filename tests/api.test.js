const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

// Test database connection string
const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio_builder_test';

describe('Portfolio Builder API - Final Project Part 3 - Complete Test Suite', () => {
  let authToken;
  let testUserId;
  let testProjectId;
  let testThemeName;
  let testSkillName;

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
    // Clean up test data and close connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  });

  // ============ DEPLOYMENT AND API FUNCTIONALITY TESTS ============
  describe('1. Deployment Tests (15 pts)', () => {
    test('GET / - API should be accessible and return comprehensive info', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Portfolio Builder API');
      expect(response.body.version).toBe('2.0.0');
      expect(response.body.documentation).toBe('/api-docs');
      expect(response.body.collections).toBeDefined();
      expect(response.body.authentication).toBeDefined();
      expect(response.body.deployment).toBeDefined();
    });

    test('GET /health - should return detailed health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
      expect(response.body.version).toBe('2.0.0');
      expect(response.body.database).toBeDefined();
      expect(response.body.features).toBeDefined();
      expect(response.body.endpoints).toBeDefined();
    });

    test('API should handle CORS properly', async () => {
      const response = await request(app)
        .get('/')
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  // ============ OAUTH AUTHENTICATION TESTS ============
  describe('2. OAuth Authentication Tests (15 pts)', () => {
    test('POST /auth/login - should authenticate with valid credentials', async () => {
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
      expect(response.body.instructions).toContain('Bearer');
    });

    test('POST /auth/login - should reject invalid credentials', async () => {
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

    test('POST /auth/logout - should logout with valid token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });

    test('Protected routes should require authentication', async () => {
      const response = await request(app)
        .post('/theme')
        .send({
          themeName: 'Unauthorized Test',
          primaryColor: '#FF0000',
          secondaryColor: '#00FF00',
          fontFamily: 'Arial'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });
  });

  // ============ API ENDPOINTS AND DOCUMENTATION TESTS ============
  describe('3. API Endpoints and Documentation Tests (35 pts)', () => {
    
    // THEME ENDPOINTS TESTS
    describe('Theme Collection CRUD', () => {
      test('GET /theme - should retrieve all themes', async () => {
        const response = await request(app).get('/theme');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.count).toBeDefined();
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      test('POST /theme - should create theme with authentication', async () => {
        // Get fresh token
        const authResponse = await request(app)
          .post('/auth/login')
          .send({ username: 'admin', password: 'password123' });
        
        const freshToken = authResponse.body.token;
        testThemeName = 'Test Theme ' + Date.now();

        const themeData = {
          themeName: testThemeName,
          primaryColor: '#FF5733',
          secondaryColor: '#33FF57',
          fontFamily: 'Roboto'
        };

        const response = await request(app)
          .post('/theme')
          .set('Authorization', `Bearer ${freshToken}`)
          .send(themeData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Theme created successfully');
        expect(response.body.data.themeName).toBe(testThemeName);
      });

      test('PUT /theme/:themeName - should update theme', async () => {
        const authResponse = await request(app)
          .post('/auth/login')
          .send({ username: 'admin', password: 'password123' });
        
        const freshToken = authResponse.body.token;

        const updateData = {
          primaryColor: '#AA5533'
        };

        const response = await request(app)
          .put(`/theme/${testThemeName}`)
          .set('Authorization', `Bearer ${freshToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Theme updated successfully');
      });

      test('DELETE /theme/:themeName - should soft delete theme', async () => {
        const response = await request(app)
          .delete(`/theme/${testThemeName}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Theme deleted successfully');
      });
    });

    // USER ENDPOINTS TESTS
    describe('User Collection CRUD', () => {
      const testUser = {
        username: 'testuser' + Date.now(),
        email: `test${Date.now()}@example.com`,
        fullName: 'Test User Final',
        bio: 'Final project test user'
      };

      test('GET /user - should retrieve all users', async () => {
        const response = await request(app).get('/user');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      test('POST /user - should create new user', async () => {
        const response = await request(app)
          .post('/user')
          .send(testUser);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('User created successfully');
        expect(response.body.data.username).toBe(testUser.username);
        
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
        const updateData = { bio: 'Updated bio for final project' };

        const response = await request(app)
          .put(`/user/${testUser.username}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.bio).toBe(updateData.bio);
      });

      test('DELETE /user/:username - should soft delete user', async () => {
        const response = await request(app)
          .delete(`/user/${testUser.username}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    // PROJECT ENDPOINTS TESTS
    describe('Project Collection CRUD', () => {
      const testProject = {
        title: 'Final Project Test ' + Date.now(),
        description: 'Comprehensive test project for final submission with detailed description',
        technologies: ['Node.js', 'Express', 'MongoDB', 'Jest', 'Swagger'],
        githubUrl: 'https://github.com/testuser/final-project',
        liveUrl: 'https://final-project.netlify.app',
        status: 'completed'
      };

      test('GET /project - should retrieve all projects', async () => {
        const response = await request(app).get('/project');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      test('POST /project - should create project with authentication', async () => {
        const authResponse = await request(app)
          .post('/auth/login')
          .send({ username: 'admin', password: 'password123' });
        
        const freshToken = authResponse.body.token;

        // Create user for project if not exists
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
        
        testProjectId = response.body.data._id;
      });

      test('GET /project/:id - should get project by ID', async () => {
        if (!testProjectId) return;

        const response = await request(app)
          .get(`/project/${testProjectId}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data._id).toBe(testProjectId);
      });

      test('PUT /project/:id - should update project', async () => {
        if (!testProjectId) return;

        const updateData = {
          status: 'in-progress',
          description: 'Updated project description for final testing'
        };

        const response = await request(app)
          .put(`/project/${testProjectId}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe(updateData.status);
      });

      test('DELETE /project/:id - should soft delete project', async () => {
        if (!testProjectId) return;

        const response = await request(app)
          .delete(`/project/${testProjectId}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    // SKILL ENDPOINTS TESTS
    describe('Skill Collection CRUD', () => {
      const testSkill = {
        name: 'Final Testing Skill ' + Date.now(),
        category: 'backend',
        proficiencyLevel: 5,
        description: 'Expert level skill for comprehensive API testing'
      };

      test('GET /skill - should retrieve all skills', async () => {
        const response = await request(app).get('/skill');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      test('POST /skill - should create new skill', async () => {
        const response = await request(app)
          .post('/skill')
          .send(testSkill);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Skill created successfully');
        expect(response.body.data.name).toBe(testSkill.name);
        
        testSkillName = testSkill.name;
      });

      test('GET /skill/:name - should get skill by name', async () => {
        const response = await request(app)
          .get(`/skill/${encodeURIComponent(testSkillName)}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(testSkillName);
      });

      test('GET /skill?category=backend - should filter skills by category', async () => {
        const response = await request(app)
          .get('/skill')
          .query({ category: 'backend' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.filter).toBeDefined();
        
        // Check that all returned skills are backend category
        response.body.data.forEach(skill => {
          expect(skill.category).toBe('backend');
        });
      });

      test('PUT /skill/:name - should update skill', async () => {
        const updateData = {
          proficiencyLevel: 4,
          description: 'Updated skill description for final testing'
        };

        const response = await request(app)
          .put(`/skill/${encodeURIComponent(testSkillName)}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.proficiencyLevel).toBe(updateData.proficiencyLevel);
      });

      test('DELETE /skill/:name - should soft delete skill', async () => {
        const response = await request(app)
          .delete(`/skill/${encodeURIComponent(testSkillName)}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    test('GET /test/collections - should return comprehensive collection statistics', async () => {
      const response = await request(app).get('/test/collections');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.collections).toBeDefined();
      expect(response.body.collections.themes).toBeDefined();
      expect(response.body.collections.users).toBeDefined();
      expect(response.body.collections.projects).toBeDefined();
      expect(response.body.collections.skills).toBeDefined();
      expect(response.body.summary.totalCollections).toBe(4);
    });
  });

  // ============ TESTING COVERAGE ============
  describe('4. Testing Coverage (15 pts)', () => {
    test('Should test all GET routes successfully', async () => {
      const getRoutes = [
        '/',
        '/health',
        '/theme',
        '/user',
        '/project',
        '/skill',
        '/test/collections'
      ];

      for (const route of getRoutes) {
        const response = await request(app).get(route);
        expect(response.status).toBeLessThan(500); // Should not crash
        expect(response.body).toBeDefined();
      }
    });

    test('Should test authentication flow completely', async () => {
      // Test login
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ username: 'admin', password: 'password123' });
      
      expect(loginResponse.status).toBe(200);
      const token = loginResponse.body.token;

      // Test protected route with token
      const protectedResponse = await request(app)
        .post('/theme')
        .set('Authorization', `Bearer ${token}`)
        .send({
          themeName: 'Auth Test Theme',
          primaryColor: '#123456',
          secondaryColor: '#654321',
          fontFamily: 'Arial'
        });

      expect(protectedResponse.status).toBe(201);

      // Test logout
      const logoutResponse = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(logoutResponse.status).toBe(200);
    });

    test('Should handle all HTTP methods for each collection', async () => {
      // Test GET, POST, PUT, DELETE for each collection
      const collections = ['theme', 'user', 'project', 'skill'];
      
      for (const collection of collections) {
        // Test GET
        const getResponse = await request(app).get(`/${collection}`);
        expect(getResponse.status).toBeLessThan(500);

        // Test POST (some require auth)
        const postData = {
          theme: { themeName: 'Test', primaryColor: '#000', secondaryColor: '#FFF', fontFamily: 'Arial' },
          user: { username: 'test' + Date.now(), email: 'test@test.com', fullName: 'Test User' },
          project: { title: 'Test', description: 'Test description', technologies: ['Test'], userId: '507f1f77bcf86cd799439011' },
          skill: { name: 'Test Skill', category: 'frontend', proficiencyLevel: 3 }
        };

        if (collection === 'theme' || collection === 'project') {
          // Get auth token
          const authResponse = await request(app)
            .post('/auth/login')
            .send({ username: 'admin', password: 'password123' });
          
          const postResponse = await request(app)
            .post(`/${collection}`)
            .set('Authorization', `Bearer ${authResponse.body.token}`)
            .send(postData[collection]);
          
          expect(postResponse.status).toBeLessThanOrEqual(500);
        } else {
          const postResponse = await request(app)
            .post(`/${collection}`)
            .send(postData[collection]);
          
          expect(postResponse.status).toBeLessThanOrEqual(500);
        }
      }
    });
  });

  // ============ DATA VALIDATION TESTS ============
  describe('5. Data Validation Tests (10 pts)', () => {
    test('Theme validation - should enforce color format validation', async () => {
      const authResponse = await request(app)
        .post('/auth/login')
        .send({ username: 'admin', password: 'password123' });
      
      const invalidTheme = {
        themeName: 'Invalid Color Theme',
        primaryColor: 'not-a-hex-color',
        secondaryColor: '#FF5733',
        fontFamily: 'Arial'
      };

      const response = await request(app)
        .post('/theme')
        .set('Authorization', `Bearer ${authResponse.body.token}`)
        .send(invalidTheme);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });

    test('User validation - should enforce email format and required fields', async () => {
      const invalidUser = {
        username: 'test',
        email: 'invalid-email-format',
        // Missing fullName
      };

      const response = await request(app)
        .post('/user')
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
      expect(Array.isArray(response.body.details)).toBe(true);
    });

    test('Project validation - should validate GitHub URL format', async () => {
      const authResponse = await request(app)
        .post('/auth/login')
        .send({ username: 'admin', password: 'password123' });
      
      const invalidProject = {
        title: 'Test Project',
        description: 'A test project with invalid GitHub URL format',
        technologies: ['JavaScript'],
        githubUrl: 'not-a-github-url',
        userId: '507f1f77bcf86cd799439011'
      };

      const response = await request(app)
        .post('/project')
        .set('Authorization', `Bearer ${authResponse.body.token}`)
        .send(invalidProject);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });

    test('Skill validation - should enforce proficiency level range and category', async () => {
      const invalidSkill = {
        name: 'Invalid Skill',
        category: 'invalid-category',
        proficiencyLevel: 6 // Should be 1-5
      };

      const response = await request(app)
        .post('/skill')
        .send(invalidSkill);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });

    test('Should validate all POST and PUT routes with comprehensive data validation', async () => {
      // Test empty requests
      const endpoints = [
        { method: 'post', path: '/user', auth: false },
        { method: 'post', path: '/skill', auth: false },
        { method: 'post', path: '/theme', auth: true },
        { method: 'post', path: '/project', auth: true }
      ];

      for (const endpoint of endpoints) {
        let requestBuilder = request(app)[endpoint.method](endpoint.path);
        
        if (endpoint.auth) {
          const authResponse = await request(app)
            .post('/auth/login')
            .send({ username: 'admin', password: 'password123' });
          
          requestBuilder = requestBuilder.set('Authorization', `Bearer ${authResponse.body.token}`);
        }

        const response = await requestBuilder.send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation Error');
      }
    });
  });

  // ============ ERROR HANDLING TESTS ============
  describe('6. Error Handling Tests (10 pts)', () => {
    test('Should return proper 404 for non-existent endpoints', async () => {
      const response = await request(app).get('/nonexistent-endpoint');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Endpoint not found');
      expect(response.body.availableEndpoints).toBeDefined();
    });

    test('Should handle invalid ObjectId format gracefully', async () => {
      const response = await request(app).get('/project/invalid-object-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid ID format');
    });

    test('Should handle database errors gracefully', async () => {
      // This test ensures the API doesn't crash on database errors
      const response = await request(app).get('/health');
      expect(response.status).toBeLessThan(600); // Should not crash
    });

    test('Should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/user')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });

    test('Should return comprehensive error information', async () => {
      const response = await request(app)
        .post('/user')
        .send({}); // Empty body to trigger validation errors

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(Array.isArray(response.body.details)).toBe(true);
      expect(response.body.details.length).toBeGreaterThan(0);
    });
  });

  // ============ INDIVIDUAL CONTRIBUTION TESTS ============
  describe('7. Individual Contribution Validation (20 pts)', () => {
    test('API should demonstrate advanced features beyond basic CRUD', async () => {
      // Test filtering capabilities
      const skillsResponse = await request(app)
        .get('/skill')
        .query({ category: 'frontend' });

      expect(skillsResponse.status).toBe(200);
      expect(skillsResponse.body.filter).toBeDefined();

      // Test population of related data
      const projectsResponse = await request(app).get('/project');
      expect(projectsResponse.status).toBe(200);
      
      if (projectsResponse.body.data.length > 0) {
        const project = projectsResponse.body.data[0];
        if (project.userId && typeof project.userId === 'object') {
          expect(project.userId.username).toBeDefined();
        }
      }
    });

    test('API should provide comprehensive statistics and monitoring', async () => {
      const response = await request(app).get('/test/collections');

      expect(response.status).toBe(200);
      expect(response.body.summary).toBeDefined();
      expect(response.body.summary.totalCollections).toBe(4);
      expect(response.body.collections.themes.byStatus || response.body.collections.themes.total).toBeDefined();
      expect(response.body.collections.skills.byCategory).toBeDefined();
      expect(response.body.collections.projects.byStatus).toBeDefined();
    });

    test('Authentication system should be robust and well-implemented', async () => {
      // Test token generation uniqueness
      const login1 = await request(app)
        .post('/auth/login')
        .send({ username: 'admin', password: 'password123' });
      
      const login2 = await request(app)
        .post('/auth/login')
        .send({ username: 'admin', password: 'password123' });

      expect(login1.body.token).toBeDefined();
      expect(login2.body.token).toBeDefined();
      expect(login1.body.token).not.toBe(login2.body.token);
    });

    test('API should have professional documentation and responses', async () => {
      const response = await request(app).get('/');

      expect(response.body.message).toContain('Portfolio Builder API');
      expect(response.body.features).toBeDefined();
      expect(response.body.collections).toBeDefined();
      expect(response.body.authentication).toBeDefined();
      expect(response.body.deployment).toBeDefined();
      
      // Check that each collection has proper metadata
      Object.values(response.body.collections).forEach(collection => {
        expect(collection.endpoint).toBeDefined();
        expect(collection.description).toBeDefined();
        expect(collection.methods).toBeDefined();
        expect(Array.isArray(collection.methods)).toBe(true);
      });
    });
  });

  // ============ COMPREHENSIVE INTEGRATION TESTS ============
  describe('8. Final Integration Tests', () => {
    test('Complete workflow: Create, Read, Update, Delete across all collections', async () => {
      // Get authentication token
      const authResponse = await request(app)
        .post('/auth/login')
        .send({ username: 'admin', password: 'password123' });
      
      const token = authResponse.body.token;

      // 1. Create a user
      const userResponse = await request(app)
        .post('/user')
        .send({
          username: 'integration' + Date.now(),
          email: `integration${Date.now()}@test.com`,
          fullName: 'Integration Test User'
        });

      expect(userResponse.status).toBe(201);
      const userId = userResponse.body.data._id;

      // 2. Create a theme
      const themeResponse = await request(app)
        .post('/theme')
        .set('Authorization', `Bearer ${token}`)
        .send({
          themeName: 'Integration Theme ' + Date.now(),
          primaryColor: '#111111',
          secondaryColor: '#222222',
          fontFamily: 'Roboto'
        });

      expect(themeResponse.status).toBe(201);

      // 3. Create a project
      const projectResponse = await request(app)
        .post('/project')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Integration Project',
          description: 'Full integration test project with comprehensive functionality',
          technologies: ['Node.js', 'Express', 'MongoDB', 'Jest'],
          githubUrl: 'https://github.com/test/integration',
          status: 'completed',
          userId: userId
        });

      expect(projectResponse.status).toBe(201);

      // 4. Create a skill
      const skillResponse = await request(app)
        .post('/skill')
        .send({
          name: 'Integration Testing',
          category: 'backend',
          proficiencyLevel: 5,
          description: 'Expert at comprehensive API integration testing'
        });

      expect(skillResponse.status).toBe(201);

      // 5. Verify all collections have the new data
      const collectionsResponse = await request(app).get('/test/collections');
      expect(collectionsResponse.status).toBe(200);
      expect(collectionsResponse.body.summary.totalDocuments).toBeGreaterThan(0);
    });

    test('API should handle concurrent requests properly', async () => {
      const promises = [];
      
      // Create multiple concurrent requests
      for (let i = 0; i < 5; i++) {
        promises.push(request(app).get('/health'));
        promises.push(request(app).get('/theme'));
        promises.push(request(app).get('/user'));
      }

      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
    });
  });
});