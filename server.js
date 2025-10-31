const http = require('http');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Use environment port or default to 3000
const PORT = process.env.PORT || 3000;

// Initialize Supabase client
const supabaseUrl = 'https://plucnavrxntdcjptpqgq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsdWNuYXZyeG50ZGNqcHRwcWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNTA1ODQsImV4cCI6MjA2NzcyNjU4NH0.lRBLUJFH1Vpo-VV2AVufRuSj8kImDNhX0nRQTZtmwFI';
const supabase = createClient(supabaseUrl, supabaseKey);

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
  
  // Handle OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400' // 24 hours
    });
    res.end();
    return;
  }
  
  // Handle POST request to save newsletter to database
  if (req.method === 'POST' && req.url === '/api/save-newsletter') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const { html } = JSON.parse(body);
        
        if (!html) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'HTML content is required' }));
          return;
        }
        
        // Save to Supabase
        const { data, error } = await supabase
          .from('Peritus Newsletter')
          .insert([
            { 'Newsletter HTML': html }
          ])
          .select();
        
        if (error) {
          console.error('Supabase error:', error);
          res.writeHead(500, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({ error: error.message }));
          return;
        }
        
        res.writeHead(200, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: true, 
          message: 'Newsletter saved to database successfully',
          data: data 
        }));
        
      } catch (error) {
        console.error('Error saving newsletter:', error);
        res.writeHead(500, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ error: 'Failed to save newsletter' }));
      }
    });
    
    return;
  }
  
  // Limit URL length to avoid ENAMETOOLONG errors
  if (req.url.length > 1000) {
    console.error('URL too long:', req.url.substring(0, 100) + '...');
    res.writeHead(414, { 'Content-Type': 'text/plain' });
    res.end('URL too long');
    return;
  }
  
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
  
  // Handle root URL and directory requests
  let filePath = req.url === '/' 
    ? path.join(__dirname, 'index.html')
    : path.join(__dirname, req.url);
  
  // If the URL ends with a slash, try to serve index.html from that directory
  if (req.url.endsWith('/') && req.url !== '/') {
    filePath = path.join(__dirname, req.url, 'index.html');
  }
  
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
