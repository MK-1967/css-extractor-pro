const express = require('express');
const router = express.Router();
const { extractCSS, saveCSS } = require('../scanner');

router.post('/', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    console.log(`Scanning: ${url}`);
    
    const result = await extractCSS(url);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    const saveResult = await saveCSS(url, result.css);
    
    if (!saveResult.success) {
      return res.status(500).json({ error: saveResult.error });
    }
    
    res.json({
      success: true,
      message: 'CSS extracted successfully',
      filesCount: result.filesCount,
      path: saveResult.path,
      domain: saveResult.domain
    });
    
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
