// =========================================
// Arshi GPS Vehicle Entry System - Backend
// =========================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors());                         // Allow cross-origin requests from frontend
app.use(express.json());                 // Parse incoming JSON request bodies

// --- Ensure reports directory exists ---
const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
  console.log('📁 Reports directory created.');
  app.use('/reports', express.static(path.join(__dirname, 'reports'))); // Serve reports folder
}

// --- Import Routes ---
const authRoutes = require('./routes/auth');
const entriesRoutes = require('./routes/entries');
const reportRoutes = require('./routes/report');
const extractRoutes = require('./routes/extract');

// --- API Routes ---
app.use('/api/auth', authRoutes);        // Login route
app.use('/api/entries', entriesRoutes);   // Vehicle entry route
app.use('/api/report', reportRoutes);     // Download report route
app.use('/api/extract', extractRoutes);  // Image extraction route

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Arshi GPS Backend is running!' });
});

// --- Serve Frontend in Production ---
const frontendDistPath = path.join(__dirname, '../frontend/dist');
const indexHtmlPath = path.join(frontendDistPath, 'index.html');

if (fs.existsSync(indexHtmlPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    res.sendFile(indexHtmlPath);
  });
} else {
  app.get('*', (req, res) => {
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Arshi GPS - Setup Status</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 50px; background-color: #f0f2f5; color: #1c1e21; }
          .container { max-width: 600px; margin: 50px auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.08); border-top: 6px solid #4F46E5; }
          h1 { color: #4F46E5; font-size: 28px; margin-bottom: 10px; }
          p { font-size: 16px; line-height: 1.6; color: #4b5563; }
          .code { background: #f3f4f6; padding: 8px 12px; border-radius: 6px; font-family: 'Courier New', Courier, monospace; font-weight: bold; color: #1f2937; display: inline-block; margin: 5px 0; border: 1px solid #e5e7eb; }
          .card { background: #f9fafb; border: 1px solid #f3f4f6; padding: 20px; border-radius: 12px; text-align: left; margin: 25px 0; }
          .card ul { padding-left: 20px; margin: 10px 0 0 0; }
          .card li { margin-bottom: 8px; font-size: 15px; }
          .badge { background: #e0e7ff; color: #4338ca; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-block; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <span class="badge">System Online</span>
          <h1>Backend is Live! 🎉</h1>
          <p>Aapka backend successfully database se connect ho chuka hai aur Render par live chal raha hai.</p>
          <p>Lekin <strong>Frontend Build</strong> abhi missing hai. Isko sahi karne ke liye Render Dashboard par ye do settings update karein:</p>
          
          <div class="card">
            <strong>Render Settings me jaakar Settings tab me ye badlein:</strong>
            <ul>
              <li><strong>Build Command:</strong> <span class="code">npm run build</span></li>
              <li><strong>Start Command:</strong> <span class="code">npm start</span></li>
            </ul>
          </div>
          
          <p>Ye settings save karne ke baad, Render dashboard ke top-right me <strong>"Manual Deploy"</strong> par click karein aur <strong>"Clear Cache & Deploy"</strong> select karein!</p>
        </div>
      </body>
      </html>
    `);
  });
}


// --- Connect to MongoDB & Start Server ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully.');
    app.listen(PORT, () => {
      console.log(`🚀 Arshi GPS Backend Server running on http://localhost:${PORT}\n`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });
