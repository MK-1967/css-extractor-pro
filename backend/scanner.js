const puppeteer = require('puppeteer-core');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

/**
 * Détecte le chemin vers Chrome/Chromium selon le système d'exploitation
 */
function getChromePath() {
  const platform = os.platform();

  if (platform === 'darwin') {
    // macOS - Utilise Google Chrome si installé
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  } else if (platform === 'linux') {
    // Linux/Docker Alpine - Chromium Browser
    return '/usr/bin/chromium-browser';
  } else if (platform === 'win32') {
    // Windows - Chrome par défaut
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  }

  // Fallback : laisser Puppeteer chercher automatiquement
  return undefined;
}

/**
 * Extrait le CSS d'une URL donnée en utilisant un navigateur headless
 */
async function extractCSS(url) {
  let browser;
  try {
    console.log(`Démarrage de l'extraction pour : ${url}`);

    // Lancement de Chromium avec les réglages spécifiques pour Docker/Synology
    browser = await puppeteer.launch({
      executablePath: getChromePath(),
      headless: 'new',
      args: [
        '--no-sandbox',                // Obligatoire pour tourner en root dans Docker
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',     // Utilise le stockage temporaire au lieu de la RAM partagée
        '--disable-gpu',                // Désactive l'accélération matérielle (inutile sur NAS)
        '--ignore-certificate-errors', // Ignore les erreurs SSL pour les sites avec certificats auto-signés
        '--window-size=1920,1080'
      ]
    });
    
    const page = await browser.newPage();
    
    // Définition d'un User-Agent moderne pour éviter d'être bloqué comme un robot
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

    // Navigation vers l'URL avec un timeout de 60 secondes
    // 'networkidle2' attend qu'il n'y ait plus que 2 connexions réseau actives (chargement fini)
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Exécution du script dans le contexte de la page pour récupérer le CSS
    const cssData = await page.evaluate(() => {
      const allCSS = [];
      
      // 1. Récupération des feuilles de style externes et balises <style> via l'objet document
      Array.from(document.styleSheets).forEach((sheet, index) => {
        try {
          // On tente de lire les règles CSS
          const rules = Array.from(sheet.cssRules || sheet.rules || []);
          const css = rules.map(rule => rule.cssText).join('\n');
          if (css) {
            allCSS.push({ 
              type: sheet.href ? 'external' : 'inline', 
              index: index, 
              css: css 
            });
          }
        } catch (e) {
          // Erreur fréquente : CORS (certaines feuilles de style externes sont protégées)
          console.log(`Accès restreint à la feuille de style ${index} :`, e.message);
        }
      });
      
      // 2. Sécurité : On récupère aussi manuellement le texte des balises <style>
      Array.from(document.querySelectorAll('style')).forEach((style, index) => {
        if (style.textContent && !allCSS.some(item => item.css === style.textContent)) {
          allCSS.push({ type: 'inline-manual', index, css: style.textContent });
        }
      });
      
      return allCSS;
    });
    
    await browser.close();
    
    if (cssData.length === 0) {
      throw new Error("Aucun contenu CSS n'a pu être extrait. Le site bloque peut-être l'accès.");
    }

    // Fusion de toutes les sources CSS en un seul bloc de texte
    const combinedCSS = cssData.map(item => `/* Source: ${item.type} #${item.index} */\n${item.css}`).join('\n\n');
    
    return {
      success: true,
      css: combinedCSS,
      filesCount: cssData.length
    };
    
  } catch (error) {
    // En cas d'erreur, on s'assure de fermer le navigateur pour ne pas saturer la RAM du NAS
    if (browser) await browser.close();
    console.error('Erreur lors de l\'extraction :', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Sauvegarde le CSS extrait dans le dossier partagé du NAS
 */
async function saveCSS(url, cssContent) {
  try {
    const domain = new URL(url).hostname.replace(/[^a-z0-9]/gi, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Le dossier /extracted_css est lié à /volume1/web/css-extractor/extracted_css via Docker
    const dirPath = path.join('/extracted_css', domain);
    const fileName = `styles_${timestamp}.css`;
    const filePath = path.join(dirPath, fileName);
    
    // Création du dossier du domaine s'il n'existe pas
    await fs.mkdir(dirPath, { recursive: true });
    
    // Écriture du fichier
    await fs.writeFile(filePath, cssContent, 'utf8');
    
    return {
      success: true,
      path: filePath,
      fileName: fileName,
      domain: domain
    };
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du fichier :', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { extractCSS, saveCSS };

