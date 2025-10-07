const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// MIME type middleware
app.use((req, res, next) => {
  const ext = path.extname(req.path).toLowerCase();
  if (ext === '.js') {
    res.type('application/javascript');
  } else if (ext === '.css') {
    res.type('text/css');
  } else if (ext === '.html') {
    res.type('text/html');
  }
  next();
});

// Serve static files
app.use(express.static(__dirname, {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.set('Content-Type', 'text/css');
    }
  }
}));

// Handle API routes here if needed

// Explicitly handle JavaScript files to ensure correct MIME type
app.get('*.js', (req, res) => {
  const filePath = path.join(__dirname, req.path);
  if (fs.existsSync(filePath)) {
    res.set('Content-Type', 'application/javascript');
    return res.sendFile(filePath);
  }
  res.status(404).send('File not found');
});

// For all other routes, serve the index.html file
app.get('*', (req, res) => {
  // Check if the requested file exists
  const filePath = path.join(__dirname, req.path);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }
  
  // Default to index.html
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for serverless use
module.exports = app;
