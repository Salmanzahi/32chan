// Browser-compatible environment configuration

// Create a global _env_ object to store environment variables
window._env_ = {
  // Default MongoDB connection string
  MONGODB_URI: 'mongodb://localhost:27017/32chan',
  
  // Add other environment variables as needed
  // EXAMPLE_VAR: 'example-value',
};

// You can override these values in production by creating a env-config.prod.js file
// that sets different values for window._env_