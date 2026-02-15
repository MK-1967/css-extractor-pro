require('dotenv').config();
console.log('=== Starting CSS Extractor Backend ===');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

console.log('Loading routes...');
const scanRoutes = require('./routes/scan');
console.log('✓ scan routes loaded');
const filesRoutes = require('./routes/files');
console.log('✓ files routes loaded');
const rssRoutes = require('./routes/rss');
console.log('✓ rss routes loaded');
const feedsRoutes = require('./routes/feeds');
console.log('✓ feeds routes loaded');
const articlesRoutes = require('./routes/articles');
console.log('✓ articles routes loaded');

const app = express();
const PORT = process.env.PORT || 3002;

console.log('Configuring middleware...');
// Middleware
app.use(cors());
app.use(bodyParser.json());

console.log('Registering routes...');
// Routes
app.use('/api/scan', scanRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/rss', rssRoutes);
app.use('/api/feeds', feedsRoutes);
app.use('/api/articles', articlesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Feed Creator API is running' });
});

console.log(`Starting server on port ${PORT}...`);
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log(`   Local: http://127.0.0.1:${PORT}`);
  console.log(`   Network: http://10.40.10.107:${PORT}`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});
