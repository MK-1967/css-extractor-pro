const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

router.get('/', async (req, res) => {
  try {
    const extractedDir = '/extracted_css';
    const domains = await fs.readdir(extractedDir);
    
    const filesList = [];
    
    for (const domain of domains) {
      const domainPath = path.join(extractedDir, domain);
      const files = await fs.readdir(domainPath);
      
      for (const file of files) {
        const filePath = path.join(domainPath, file);
        const stats = await fs.stat(filePath);
        
        filesList.push({
          domain: domain,
          filename: file,
          path: filePath,
          size: stats.size,
          created: stats.birthtime
        });
      }
    }
    
    res.json({ files: filesList });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
