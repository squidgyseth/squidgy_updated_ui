const http = require('http');
const fs = require('fs');
const path = require('path');

// Use environment port or default to 3000
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript', // Changed to application/javascript
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Create server handler function that can be used by both http server and serverless
const handleRequest = (req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Special handling for app.js
  if (req.url === '/app.js') {
    console.log('Serving app.js with application/javascript MIME type');
    const appJsPath = path.join(__dirname, 'app.js');
    fs.readFile(appJsPath, (err, content) => {
      if (err) {
        console.error('Error reading app.js:', err);
        res.writeHead(500);
        res.end('Error loading app.js');
        return;
      }
      res.writeHead(200, { 
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end(content, 'utf-8');
    });
    return;
  }
  
  // Special handling for styles.css
  if (req.url === '/styles.css') {
    console.log('Serving styles.css with text/css MIME type');
    const cssPath = path.join(__dirname, 'styles.css');
    fs.readFile(cssPath, (err, content) => {
      if (err) {
        console.error('Error reading styles.css:', err);
        res.writeHead(500);
        res.end('Error loading styles.css');
        return;
      }
      res.writeHead(200, { 
        'Content-Type': 'text/css',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end(content, 'utf-8');
    });
    return;
  }
  
  // Special handling for newsletter-editor.html
  if (req.url === '/newsletter-editor.html') {
    console.log('Serving newsletter-editor.html');
    const htmlPath = path.join(__dirname, 'newsletter-editor.html');
    fs.readFile(htmlPath, (err, content) => {
      if (err) {
        console.error('Error reading newsletter-editor.html:', err);
        res.writeHead(500);
        res.end('Error loading newsletter-editor.html');
        return;
      }
      res.writeHead(200, { 
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end(content, 'utf-8');
    });
    return;
  }
  
  // Handle root URL
  let filePath = req.url === '/' 
    ? path.join(__dirname, 'index.html')
    : path.join(__dirname, req.url);
  
  // Get the file extension
  const extname = path.extname(filePath);
  let contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  // Debug
  console.log(`Serving ${filePath} with content type ${contentType}`);
  
  // Read the file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Page not found
        fs.readFile(path.join(__dirname, '404.html'), (err, content) => {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(content || '404 Not Found', 'utf-8');
        });
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        // Add CORS headers for Vercel deployment
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end(content, 'utf-8');
    }
  });
};

// Create and start server when running directly
if (require.main === module) {
  const server = http.createServer(handleRequest);
  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Press Ctrl+C to stop the server`);
  });
}

// Export the handler for serverless environments like Vercel
module.exports = handleRequest;
