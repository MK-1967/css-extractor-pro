const Parser = require('rss-parser');
const fs = require('fs').promises;
const path = require('path');
const parser = new Parser();

/**
 * Extrait les articles d'un flux RSS
 * Retourne maintenant les articles structurés pour affichage dans le frontend
 */
async function extractRSS(url) {
  try {
    const feed = await parser.parseURL(url);
    
    // Extraction des articles avec toutes leurs informations
    const articles = feed.items.map(item => ({
      title: item.title || 'Sans titre',
      link: item.link || '#',
      description: item.contentSnippet || item.description || 'Pas de description disponible',
      pubDate: item.pubDate || item.isoDate || 'Date inconnue',
      author: item.creator || item.author || null,
      category: item.categories ? item.categories[0] : null
    }));
    
    // Sauvegarde optionnelle dans un fichier texte (comme avant)
    let content = `FLUX: ${feed.title}\n${'-'.repeat(40)}\n`;
    feed.items.forEach(item => {
      content += `\nTITRE: ${item.title}\nLIEN: ${item.link}\nDATE: ${item.pubDate}\n`;
    });
    
    return { 
      success: true, 
      title: feed.title,
      description: feed.description || '',
      articles: articles,  // NOUVEAU : Retour des articles structurés
      itemsCount: articles.length,
      content: content  // Garde la compatibilité avec l'ancien système
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Sauvegarde le contenu RSS dans un fichier texte
 */
async function saveRSS(title, content) {
  try {
    const domain = title.replace(/[^a-z0-9]/gi, '_');
    const dirPath = path.join('/extracted_css', 'RSS_FEEDS');
    const filePath = path.join(dirPath, `rss_${domain}_${Date.now()}.txt`);
    
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, content, 'utf8');
    
    return { 
      success: true, 
      path: filePath 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

module.exports = { extractRSS, saveRSS };
