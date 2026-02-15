const pool = require('../config/db');
const { extractElements } = require('../rssGenerator');
const { extractRSS } = require('../rss_scanner');
const crypto = require('crypto');

/**
 * Récupère les articles d'un flux et les importe dans la base de données
 * Réutilise extractElements() de rssGenerator.js
 */
async function fetchAndImportArticles(feedId) {
  try {
    // 1. Récupérer la configuration du flux depuis la BD
    const [feeds] = await pool.query('SELECT * FROM feeds WHERE id = ?', [feedId]);

    if (feeds.length === 0) {
      return { success: false, error: 'Feed not found' };
    }

    const feed = feeds[0];

    // 2. Construire l'objet selectors pour extractElements
    const selectors = {
      item: feed.selector_item,
      title: feed.selector_title,
      link: feed.selector_link,
      description: feed.selector_description,
      date: feed.selector_date,
      image: feed.selector_image
    };

    console.log(`Fetching articles for feed ${feedId}: ${feed.title}`);

    // 3. Déterminer le type de flux (RSS natif ou scraping CSS)
    const isRSSFeed = !feed.selector_item;
    let items;

    if (isRSSFeed) {
      // Flux RSS natif → utiliser rss-parser
      const rssResult = await extractRSS(feed.source_url);
      if (!rssResult.success) {
        console.error(`Failed to parse RSS: ${rssResult.error}`);
        return { success: false, error: rssResult.error };
      }
      items = rssResult.articles.map(a => ({
        title: a.title,
        link: a.link,
        description: a.description,
        date: a.pubDate,
        author: a.author,
        category: a.category
      }));
    } else {
      // Flux scraping CSS → utiliser extractElements
      const result = await extractElements(feed.source_url, selectors, { max: feed.max_items });
      if (!result.success) {
        console.error(`Failed to extract elements: ${result.error}`);
        return { success: false, error: result.error };
      }
      items = result.items;
    }

    console.log(`Extracted ${items.length} items from ${feed.source_url}`);

    // 4. Importer les articles dans la base de données
    let newCount = 0;
    let duplicateCount = 0;

    for (const item of items) {
      // Résoudre les URLs relatives en absolues
      if (item.link && !item.link.startsWith('http')) {
        item.link = new URL(item.link, feed.source_url).href;
      }
      if (item.image && !item.image.startsWith('http')) {
        item.image = new URL(item.image, feed.source_url).href;
      }

      if (!item.link) {
        console.warn('Skipping item without link:', item.title);
        continue;
      }

      const guid = generateArticleGuid(item.link);

      try {
        const [insertResult] = await pool.query(
          `INSERT INTO articles (feed_id, guid, title, link, description, image_url, author, category, pub_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE title = VALUES(title), link = VALUES(link), description = VALUES(description), image_url = VALUES(image_url)`,
          [
            feedId,
            guid,
            item.title || 'Sans titre',
            item.link,
            item.description || '',
            item.image || null,
            item.author || null,
            item.category || null,
            item.date ? new Date(item.date) : new Date()
          ]
        );

        if (insertResult.affectedRows > 0 && insertResult.insertId > 0) {
          newCount++;
        } else {
          duplicateCount++;
        }
      } catch (err) {
        console.error('Error inserting article:', err.message);
        duplicateCount++;
      }
    }

    // 5. Mettre à jour last_fetched_at du flux
    await pool.query('UPDATE feeds SET last_fetched_at = NOW() WHERE id = ?', [feedId]);

    console.log(`Import complete: ${newCount} new, ${duplicateCount} duplicates`);

    return {
      success: true,
      new_articles: newCount,
      duplicate_articles: duplicateCount,
      total: items.length
    };

  } catch (error) {
    console.error('Fetch and import error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Importe un flux RSS existant : crée le feed + importe les articles
 */
async function importRSSFeed(url, customTitle) {
  try {
    // 1. Parser le flux RSS
    const rssResult = await extractRSS(url);
    if (!rssResult.success) {
      return { success: false, error: rssResult.error };
    }

    const feedTitle = customTitle || rssResult.title || 'Flux RSS importé';

    // 2. Créer le feed en base (sélecteurs vides = flux RSS natif)
    const [result] = await pool.query(
      `INSERT INTO feeds (title, description, source_url, selector_item, selector_title,
       selector_link, selector_description, selector_date, selector_image, max_items)
       VALUES (?, ?, ?, '', '', '', '', '', '', 50)`,
      [feedTitle, rssResult.description || '', url]
    );

    const feedId = result.insertId;
    console.log(`RSS feed created with ID: ${feedId} - ${feedTitle}`);

    // 3. Importer les articles
    const importResult = await fetchAndImportArticles(feedId);

    return {
      success: true,
      feed_id: feedId,
      title: feedTitle,
      ...importResult
    };
  } catch (error) {
    console.error('Import RSS feed error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Génère un GUID unique pour un article basé sur son lien
 * Utilise MD5 hash pour éviter les doublons
 */
function generateArticleGuid(link) {
  return crypto.createHash('md5').update(link).digest('hex');
}

module.exports = { fetchAndImportArticles, importRSSFeed };
