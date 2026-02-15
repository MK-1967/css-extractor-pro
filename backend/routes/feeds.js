const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { fetchAndImportArticles, importRSSFeed } = require('../services/feedService');

// GET /api/feeds - Liste tous les flux avec statistiques
router.get('/', async (req, res) => {
  try {
    const [feeds] = await pool.query(`
      SELECT
        f.*,
        COUNT(a.id) as total_articles,
        SUM(CASE WHEN a.is_read = 0 THEN 1 ELSE 0 END) as unread_count
      FROM feeds f
      LEFT JOIN articles a ON f.id = a.feed_id
      WHERE f.is_active = 1
      GROUP BY f.id
      ORDER BY f.updated_at DESC
    `);

    res.json({ success: true, feeds });
  } catch (error) {
    console.error('Get feeds error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/feeds/:id - Détails d'un flux spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [feeds] = await pool.query('SELECT * FROM feeds WHERE id = ?', [id]);

    if (feeds.length === 0) {
      return res.status(404).json({ error: 'Feed not found' });
    }

    res.json({ success: true, feed: feeds[0] });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/feeds - Créer et sauvegarder un nouveau flux
router.post('/', async (req, res) => {
  try {
    const { title, description, source_url, selectors, max_items, import_articles } = req.body;

    // Validation
    if (!title || !source_url || !selectors) {
      return res.status(400).json({ error: 'Missing required fields: title, source_url, selectors' });
    }

    console.log(`Creating new feed: ${title}`);

    const [result] = await pool.query(
      `INSERT INTO feeds (title, description, source_url, selector_item,
       selector_title, selector_link, selector_description, selector_date,
       selector_image, max_items) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || '',
        source_url,
        selectors.item || '',
        selectors.title || '',
        selectors.link || '',
        selectors.description || '',
        selectors.date || '',
        selectors.image || '',
        max_items || 10
      ]
    );

    const feedId = result.insertId;
    console.log(`Feed created with ID: ${feedId}`);

    // Import initial des articles si demandé
    let importResult = null;
    if (import_articles) {
      console.log(`Importing initial articles for feed ${feedId}`);
      importResult = await fetchAndImportArticles(feedId);
    }

    res.json({
      success: true,
      feed_id: feedId,
      import_result: importResult
    });

  } catch (error) {
    console.error('Create feed error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/feeds/:id - Modifier un flux
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, selectors, max_items } = req.body;

    await pool.query(
      `UPDATE feeds SET title = ?, description = ?, selector_item = ?,
       selector_title = ?, selector_link = ?, selector_description = ?,
       selector_date = ?, selector_image = ?, max_items = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        title,
        description || '',
        selectors.item || '',
        selectors.title || '',
        selectors.link || '',
        selectors.description || '',
        selectors.date || '',
        selectors.image || '',
        max_items || 10,
        id
      ]
    );

    console.log(`Feed ${id} updated`);
    res.json({ success: true });

  } catch (error) {
    console.error('Update feed error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/feeds/:id - Supprimer un flux
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM feeds WHERE id = ?', [id]);

    console.log(`Feed ${id} deleted`);
    res.json({ success: true });

  } catch (error) {
    console.error('Delete feed error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/feeds/import-rss - Importer un flux RSS existant dans l'agrégateur
router.post('/import-rss', async (req, res) => {
  try {
    const { url, title } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`Importing RSS feed: ${url}`);
    const result = await importRSSFeed(url, title);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('Import RSS error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/feeds/:id/refresh - Rafraîchir un flux manuellement
router.post('/:id/refresh', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`Manual refresh requested for feed ${id}`);
    const result = await fetchAndImportArticles(id);

    res.json(result);

  } catch (error) {
    console.error('Refresh feed error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
