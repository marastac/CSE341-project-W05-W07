# Portfolio Builder API

A comprehensive RESTful API server for a portfolio builder website with complete CRUD operations, MongoDB integration, and Swagger documentation.

## 🎯 Features

- **Complete CRUD Operations** for Themes and Users
- **MongoDB Integration** with Mongoose ODM
- **Swagger/OpenAPI Documentation**
- **Input Validation** and Error Handling
- **CORS Support** for cross-origin requests
- **Professional Error Responses**
- **Soft Delete** functionality

## 🚀 Live Demo

- **API Base URL**: `https://cse341-code-student.onrender.com`
- **API Documentation**: `https://cse341-code-student.onrender.com/api-docs`

## 📋 Prerequisites

- Node.js (v16.0.0 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-username/portfolio-builder-api.git
cd portfolio-builder-api
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/portfolio_builder
NODE_ENV=development
```

4. **Start the server**

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📚 API Documentation

### Base URL

- Local: `http://localhost:3000`
- Production: `https://cse341-code-student.onrender.com`

### Interactive Documentation

Visit `/api-docs` for complete Swagger UI documentation with testing capabilities.

## 🎨 Theme Endpoints

### GET /theme

Get all active themes

```json
Response: {
  "success": true,
  "count": 2,
  "data": [...]
}
```

### GET /theme/{themeName}

Find theme by name

```json
Response: {
  "success": true,
  "data": {
    "_id": "...",
    "themeName": "Modern Dark",
    "primaryColor": "#1a1a1a",
    "secondaryColor": "#ffffff",
    "fontFamily": "Roboto",
    "isActive": true
  }
}
```

### POST /theme

Create new theme

```json
Request Body: {
  "themeName": "Modern Dark",
  "primaryColor": "#1a1a1a",
  "secondaryColor": "#ffffff",
  "fontFamily": "Roboto"
}
```

### PUT /theme/{themeName}

Update existing theme

```json
Request Body: {
  "primaryColor": "#2a2a2a",
  "secondaryColor": "#f5f5f5"
}
```

### DELETE /theme/{themeName}

Soft delete theme (sets isActive to false)

## 👥 User Endpoints

### GET /user

Get all active users

```json
Response: {
  "success": true,
  "count": 5,
  "data": [...]
}
```

### GET /user/{username}

Get user by username

```json
Response: {
  "success": true,
  "data": {
    "_id": "...",
    "username": "johndoe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "bio": "Web Developer",
    "profilePicture": "https://...",
    "isActive": true
  }
}
```

### POST /user

Create new user

```json
Request Body: {
  "username": "johndoe",
  "email": "john@example.com",
  "fullName": "John Doe",
  "bio": "Web Developer and Designer",
  "profilePicture": "https://example.com/photo.jpg"
}
```

### PUT /user/{username}

Update existing user

```json
Request Body: {
  "email": "newemail@example.com",
  "bio": "Senior Web Developer"
}
```

### DELETE /user/{username}

Soft delete user (sets isActive to false)

## 🔧 Data Models

### Theme Schema

```javascript
{
  themeName: String (required, unique),
  primaryColor: String (required, hex format),
  secondaryColor: String (required, hex format),
  fontFamily: String (required, enum),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### User Schema

```javascript
{
  username: String (required, unique, 3-20 chars),
  email: String (required, unique, valid email),
  fullName: String (required, min 2 chars),
  bio: String (max 500 chars),
  profilePicture: String (URL),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

## ⚠️ Error Handling

The API implements comprehensive error handling:

- **400 Bad Request**: Validation errors, duplicate entries, invalid ID format
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side errors

### Error Response Format

```json
{
  "success": false,
  "error": "Validation Error",
  "details": ["Username is required", "Email format is invalid"]
}
```

## 🧪 Testing

### Manual Testing with Swagger UI

1. Visit `/api-docs
