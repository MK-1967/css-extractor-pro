const axios = require('axios');
const cheerio = require('cheerio');

async function extractElements(url, selectors = {}, options = {}) {
  try {
    console.log(`Fetching: ${url}`);
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      }
    });

    const $ = cheerio.load(response.data);
    const maxItems = options.max || 10;
    const itemSelector = selectors.item || 'article';
    const results = [];

    $(itemSelector).each((index, element) => {
      if (index >= maxItems) return false;

      const item = {};
      const $el = $(element);

      if (selectors.title) {
        const titleEl = $el.find(selectors.title).first();
        item.title = titleEl.length ? titleEl.text().trim() : '';
      }

      if (selectors.link) {
        const linkEl = $el.find(selectors.link).first();
        item.link = linkEl.length ? (linkEl.attr('href') || '') : '';
      }

      if (selectors.description) {
        const descEl = $el.find(selectors.description).first();
        item.description = descEl.length ? descEl.text().trim() : '';
      }

      if (selectors.image) {
        const imgEl = $el.find(selectors.image).first();
        item.image = imgEl.length ? (imgEl.attr('src') || imgEl.attr('data-src') || '') : '';
      }

      if (selectors.date) {
        const dateEl = $el.find(selectors.date).first();
        if (dateEl.length) {
          item.date = dateEl.attr('datetime') || dateEl.text().trim();
        }
      }

      if (item.title || item.link) {
        results.push(item);
      }
    });

    console.log(`Found ${results.length} items`);

    return {
      success: true,
      items: results
    };

  } catch (error) {
    console.error('Error extracting elements:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function generateRSS(url, selectors, feedInfo, options = {}) {
  try {
    const result = await extractElements(url, selectors, options);

    if (!result.success) {
      return result;
    }

    const items = result.items;
    const baseUrl = new URL(url).origin;

    let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(feedInfo.title || 'RSS Feed')}</title>
    <link>${escapeXml(url)}</link>
    <description>${escapeXml(feedInfo.description || 'Generated RSS Feed')}</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
`;

    items.forEach(item => {
      rss += `    <item>\n`;
      if (item.title) {
        rss += `      <title>${escapeXml(item.title)}</title>\n`;
      }
      if (item.link) {
        const fullLink = item.link.startsWith('http') ? item.link : baseUrl + item.link;
        rss += `      <link>${escapeXml(fullLink)}</link>\n`;
      }
      if (item.description) {
        rss += `      <description>${escapeXml(item.description)}</description>\n`;
      }
      if (item.date) {
        const parsed = new Date(item.date);
        const dateStr = isNaN(parsed.getTime()) ? item.date : parsed.toUTCString();
        rss += `      <pubDate>${escapeXml(dateStr)}</pubDate>\n`;
      }
      if (item.image) {
        const fullImage = item.image.startsWith('http') ? item.image : baseUrl + item.image;
        rss += `      <enclosure url="${escapeXml(fullImage)}" type="image/jpeg"/>\n`;
      }
      rss += `    </item>\n`;
    });

    rss += `  </channel>
</rss>`;

    return {
      success: true,
      rss: rss
    };

  } catch (error) {
    console.error('Error generating RSS:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = { extractElements, generateRSS };
