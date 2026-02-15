const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/articles - Liste paginée des articles avec filtres
router.get('/', async (req, res) => {
  try {
    const {
      feed_id,
      is_read,
      is_starred,
      limit = 20,
      offset = 0
    } = req.query;

    let query = `
      SELECT a.*, f.title as feed_title, f.source_url as feed_url
      FROM articles a
      JOIN feeds f ON a.feed_id = f.id
      WHERE 1=1
    `;
    const params = [];

    // Filtre par flux
    if (feed_id) {
      query += ' AND a.feed_id = ?';
      params.push(feed_id);
    }

    // Filtre lu/non lu
    if (is_read === 'true') {
      query += ' AND a.is_read = 1';
    } else if (is_read === 'false') {
      query += ' AND a.is_read = 0';
    }

    // Filtre favoris
    if (is_starred === 'true') {
      query += ' AND a.is_starred = 1';
    }

    // Tri et pagination
    query += ' ORDER BY a.pub_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [articles] = await pool.query(query, params);

    res.json({
      success: true,
      articles,
      has_more: articles.length === parseInt(limit)
    });

  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/articles/:id - Détails d'un article spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [articles] = await pool.query(`
      SELECT a.*, f.title as feed_title, f.source_url as feed_url
      FROM articles a
      JOIN feeds f ON a.feed_id = f.id
      WHERE a.id = ?
    `, [id]);

    if (articles.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json({ success: true, article: articles[0] });

  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/articles/:id/read - Marquer comme lu/non lu
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_read } = req.body;

    if (typeof is_read !== 'boolean') {
      return res.status(400).json({ error: 'is_read must be a boolean' });
    }

    await pool.query(
      'UPDATE articles SET is_read = ?, read_at = ? WHERE id = ?',
      [is_read, is_read ? new Date() : null, id]
    );

    console.log(`Article ${id} marked as ${is_read ? 'read' : 'unread'}`);
    res.json({ success: true });

  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/articles/:id/star - Favoriser/défavoriser
router.patch('/:id/star', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_starred } = req.body;

    if (typeof is_starred !== 'boolean') {
      return res.status(400).json({ error: 'is_starred must be a boolean' });
    }

    await pool.query(
      'UPDATE articles SET is_starred = ?, starred_at = ? WHERE id = ?',
      [is_starred, is_starred ? new Date() : null, id]
    );

    console.log(`Article ${id} ${is_starred ? 'starred' : 'unstarred'}`);
    res.json({ success: true });

  } catch (error) {
    console.error('Star error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/articles/bulk - Actions en masse sur plusieurs articles
router.patch('/bulk', async (req, res) => {
  try {
    const { article_ids, action } = req.body;

    if (!Array.isArray(article_ids) || article_ids.length === 0) {
      return res.status(400).json({ error: 'article_ids must be a non-empty array' });
    }

    let query;
    let params;

    switch (action) {
      case 'mark_read':
        query = 'UPDATE articles SET is_read = 1, read_at = NOW() WHERE id IN (?)';
        params = [article_ids];
        break;

      case 'mark_unread':
        query = 'UPDATE articles SET is_read = 0, read_at = NULL WHERE id IN (?)';
        params = [article_ids];
        break;

      case 'star':
        query = 'UPDATE articles SET is_starred = 1, starred_at = NOW() WHERE id IN (?)';
        params = [article_ids];
        break;

      case 'unstar':
        query = 'UPDATE articles SET is_starred = 0, starred_at = NULL WHERE id IN (?)';
        params = [article_ids];
        break;

      default:
        return res.status(400).json({ error: 'Invalid action. Use: mark_read, mark_unread, star, unstar' });
    }

    const [result] = await pool.query(query, params);

    console.log(`Bulk action ${action} applied to ${result.affectedRows} articles`);
    res.json({ success: true, affected_rows: result.affectedRows });

  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
