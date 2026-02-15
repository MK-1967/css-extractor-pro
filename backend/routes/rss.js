const express = require('express');
const router = express.Router();
const { generateRSS, extractElements } = require('../rssGenerator');
const { extractRSS } = require('../rss_scanner');

// Extract elements from a page with CSS selectors (preview)
router.post('/extract', async (req, res) => {
  try {
    const { url, selectors, max } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`Extracting elements from: ${url}`);

    const result = await extractElements(url, selectors, { max: max || 10 });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      items: result.items
    });

  } catch (error) {
    console.error('Extract error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate RSS feed (POST - download)
router.post('/generate', async (req, res) => {
  try {
    const { url, selectors, feedTitle, feedDescription, max } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`Generating RSS for: ${url}`);

    const result = await generateRSS(url, selectors, {
      title: feedTitle,
      description: feedDescription
    }, { max: max || 10 });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.set('Content-Type', 'application/rss+xml');
    res.send(result.rss);

  } catch (error) {
    console.error('Generate RSS error:', error);
    res.status(500).json({ error: error.message });
  }
});

// RSS feed permalink (GET - for RSS readers to subscribe)
router.get('/feed', async (req, res) => {
  try {
    const { url, item, title, link, description, date, image, feedTitle, feedDescription, max } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    const selectors = {};
    if (item) selectors.item = item;
    if (title) selectors.title = title;
    if (link) selectors.link = link;
    if (description) selectors.description = description;
    if (date) selectors.date = date;
    if (image) selectors.image = image;

    console.log(`Feed request for: ${url}`);

    const result = await generateRSS(url, selectors, {
      title: feedTitle || 'Feed Creator RSS',
      description: feedDescription || ''
    }, { max: parseInt(max) || 10 });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=900');
    res.send(result.rss);

  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Parse an existing RSS feed
router.post('/parse', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`Parsing RSS feed: ${url}`);

    const result = await extractRSS(url);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result);

  } catch (error) {
    console.error('Parse RSS error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
