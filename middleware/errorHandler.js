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

// Express error handling middleware
const errorHandler = (error, req, res, next) => {
  handleError(res, error);
};

module.exports = errorHandler;