-- Schéma de base de données pour CSS Extractor - Lecteur RSS Agrégateur
-- Créé le: 2026-02-13

-- Set UTF-8 pour caractères internationaux
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Table des flux RSS sauvegardés
CREATE TABLE IF NOT EXISTS feeds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  source_url VARCHAR(500) NOT NULL,

  -- Sélecteurs CSS pour scraping (stockage en colonnes séparées)
  selector_item VARCHAR(255),
  selector_title VARCHAR(255),
  selector_link VARCHAR(255),
  selector_description VARCHAR(255),
  selector_date VARCHAR(255),
  selector_image VARCHAR(255),

  max_items INT DEFAULT 10,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_fetched_at DATETIME,
  is_active BOOLEAN DEFAULT true,

  INDEX idx_source_url (source_url(255)),
  INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des articles agrégés
CREATE TABLE IF NOT EXISTS articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  feed_id INT NOT NULL,
  title VARCHAR(500) NOT NULL,
  link VARCHAR(1000) NOT NULL,
  description TEXT,
  image_url VARCHAR(1000),
  author VARCHAR(255),
  category VARCHAR(100),
  pub_date DATETIME,

  -- État utilisateur
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  read_at DATETIME,
  starred_at DATETIME,

  -- Gestion des doublons (MD5 hash du link)
  guid VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (feed_id) REFERENCES feeds(id) ON DELETE CASCADE,
  UNIQUE KEY unique_article (feed_id, guid),
  INDEX idx_feed_id (feed_id),
  INDEX idx_is_read (is_read),
  INDEX idx_is_starred (is_starred),
  INDEX idx_pub_date (pub_date),
  INDEX idx_guid (guid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Assurer que la base utilise utf8mb4
ALTER DATABASE css_extractor CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
