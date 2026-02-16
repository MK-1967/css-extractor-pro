import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Download, Link2, Loader2, Copy, Check, Save, Rss, X } from 'lucide-react';
import API_URL from '../config';
import FeedPreview from './FeedPreview';

const SELECTOR_FIELDS = [
  { key: 'item', label: 'Conteneur item', placeholder: 'article, div.post, .card', hint: 'Element qui contient chaque article' },
  { key: 'title', label: 'Titre', placeholder: 'h2, .title, h3 a', hint: 'Selecteur du titre dans chaque item' },
  { key: 'link', label: 'Lien', placeholder: 'a, a.read-more', hint: 'Selecteur du lien dans chaque item' },
  { key: 'description', label: 'Description', placeholder: 'p, .excerpt, .summary', hint: 'Selecteur de la description' },
  { key: 'date', label: 'Date', placeholder: 'time, .date, span.published', hint: 'Selecteur de la date (time, span...)' },
  { key: 'image', label: 'Image', placeholder: 'img, img.thumbnail', hint: 'Selecteur de l\'image' },
];

function FeedCreator({ editingFeed, onClearEdit }) {
  const [mode, setMode] = useState('rss'); // 'rss' ou 'css'
  const [rssUrl, setRssUrl] = useState('');
  const [rssTitle, setRssTitle] = useState('');
  const [rssLoading, setRssLoading] = useState(false);
  const [rssError, setRssError] = useState(null);
  const [rssSuccess, setRssSuccess] = useState(null);

  const handleImportRSS = async (e) => {
    e.preventDefault();
    setRssLoading(true);
    setRssError(null);
    setRssSuccess(null);

    try {
      const response = await axios.post(`${API_URL}/api/feeds/import-rss`, {
        url: rssUrl,
        title: rssTitle || undefined
      });

      if (response.data.success) {
        setRssSuccess(`Flux "${response.data.title}" importé ! ${response.data.new_articles || 0} articles ajoutés.`);
        setRssUrl('');
        setRssTitle('');
      }
    } catch (err) {
      setRssError(err.response?.data?.error || 'Erreur lors de l\'import du flux RSS');
    } finally {
      setRssLoading(false);
    }
  };

  const [url, setUrl] = useState('');
  const [selectors, setSelectors] = useState({
    item: '', title: '', link: '', description: '', date: '', image: ''
  });
  const [feedInfo, setFeedInfo] = useState({ title: '', description: '' });
  const [maxItems, setMaxItems] = useState(10);
  const [previewItems, setPreviewItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permalinkUrl, setPermalinkUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (editingFeed) {
      setMode('css');
      setUrl(editingFeed.source_url || '');
      setSelectors({
        item: editingFeed.selector_item || '',
        title: editingFeed.selector_title || '',
        link: editingFeed.selector_link || '',
        description: editingFeed.selector_description || '',
        date: editingFeed.selector_date || '',
        image: editingFeed.selector_image || '',
      });
      setFeedInfo({
        title: editingFeed.title || '',
        description: editingFeed.description || '',
      });
      setMaxItems(editingFeed.max_items || 10);
      setPreviewItems([]);
      setPermalinkUrl('');
      setError(null);
    }
  }, [editingFeed]);

  const buildPermalink = () => {
    const params = new URLSearchParams();
    params.set('url', url);
    if (selectors.item) params.set('item', selectors.item);
    if (selectors.title) params.set('title', selectors.title);
    if (selectors.link) params.set('link', selectors.link);
    if (selectors.description) params.set('description', selectors.description);
    if (selectors.date) params.set('date', selectors.date);
    if (selectors.image) params.set('image', selectors.image);
    if (feedInfo.title) params.set('feedTitle', feedInfo.title);
    if (feedInfo.description) params.set('feedDescription', feedInfo.description);
    params.set('max', maxItems.toString());
    return `${API_URL}/api/rss/feed?${params.toString()}`;
  };

  const handlePreview = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPreviewItems([]);

    try {
      const response = await axios.post(`${API_URL}/api/rss/extract`, {
        url,
        selectors,
        max: maxItems
      });
      setPreviewItems(response.data.items || []);
      setPermalinkUrl(buildPermalink());
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'extraction');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadRSS = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/api/rss/generate`, {
        url,
        selectors,
        feedTitle: feedInfo.title || 'Mon flux RSS',
        feedDescription: feedInfo.description || 'Flux RSS genere par Feed Creator',
        max: maxItems
      }, { responseType: 'blob' });

      const blob = new Blob([response.data], { type: 'application/rss+xml' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'feed.rss';
      link.click();
      window.URL.revokeObjectURL(downloadUrl);

      setPermalinkUrl(buildPermalink());
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la generation du flux RSS');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPermalink = () => {
    navigator.clipboard.writeText(permalinkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveFeed = async () => {
    setSaving(true);
    setError(null);

    try {
      if (editingFeed) {
        // Mode édition : PUT pour mettre à jour
        const response = await axios.put(`${API_URL}/api/feeds/${editingFeed.id}`, {
          title: feedInfo.title || 'Flux sans titre',
          description: feedInfo.description || '',
          source_url: url,
          selectors: selectors,
          max_items: maxItems,
        });

        if (response.data.success) {
          alert('Flux mis à jour avec succès !');
          if (onClearEdit) onClearEdit();
        }
      } else {
        // Mode création : POST
        const response = await axios.post(`${API_URL}/api/feeds`, {
          title: feedInfo.title || 'Flux sans titre',
          description: feedInfo.description || '',
          source_url: url,
          selectors: selectors,
          max_items: maxItems,
          import_articles: true
        });

        if (response.data.success) {
          alert(`Flux sauvegardé avec succès !\n${response.data.import_result?.new_articles || 0} articles importés.`);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde du flux');
    } finally {
      setSaving(false);
    }
  };

  const updateSelector = (key, value) => {
    setSelectors(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Toggle RSS / CSS */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setMode('rss')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all ${
            mode === 'rss'
              ? 'bg-orange-500 text-white shadow-lg'
              : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
          }`}
        >
          <Rss size={18} />
          Importer un flux RSS
        </button>
        <button
          onClick={() => setMode('css')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all ${
            mode === 'css'
              ? 'bg-indigo-500 text-white shadow-lg'
              : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
          }`}
        >
          <Search size={18} />
          Scraping CSS
        </button>
      </div>

      {/* Import RSS */}
      {mode === 'rss' && (
        <form onSubmit={handleImportRSS} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <div className="mb-4">
            <label className="block text-white font-bold mb-2 text-lg">URL du flux RSS</label>
            <input
              type="url"
              value={rssUrl}
              onChange={(e) => setRssUrl(e.target.value)}
              placeholder="https://www.telerama.fr/rss/cinema.xml"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-300/30 text-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-white/80 text-sm mb-1">Titre personnalisé (optionnel)</label>
            <input
              type="text"
              value={rssTitle}
              onChange={(e) => setRssTitle(e.target.value)}
              placeholder="Le titre sera détecté automatiquement"
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-orange-300 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={rssLoading}
            className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors w-full justify-center"
          >
            {rssLoading ? <Loader2 size={20} className="animate-spin" /> : <Rss size={20} />}
            {rssLoading ? 'Import en cours...' : 'Importer dans l\'agrégateur'}
          </button>

          {rssError && (
            <div className="mt-4 p-4 bg-red-500/20 border-2 border-red-400 rounded-xl text-white">
              {rssError}
            </div>
          )}
          {rssSuccess && (
            <div className="mt-4 p-4 bg-emerald-500/20 border-2 border-emerald-400 rounded-xl text-white font-bold">
              {rssSuccess}
            </div>
          )}
        </form>
      )}

      {/* Scraping CSS (existant) */}
      {mode === 'css' && <form onSubmit={handlePreview} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        {/* Bannière mode édition */}
        {editingFeed && (
          <div className="mb-4 p-3 bg-amber-500/20 border-2 border-amber-400 rounded-xl flex items-center justify-between">
            <span className="text-white font-bold">
              Edition du flux : "{editingFeed.title}"
            </span>
            <button
              type="button"
              onClick={() => { if (onClearEdit) onClearEdit(); }}
              className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm"
            >
              <X size={14} />
              Annuler
            </button>
          </div>
        )}
        {/* URL */}
        <div className="mb-6">
          <label className="block text-white font-bold mb-2 text-lg">URL de la page</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/page-a-surveiller"
            required
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300/30 text-lg"
          />
        </div>

        {/* Selectors grid */}
        <div className="mb-6">
          <label className="block text-white font-bold mb-3">Selecteurs CSS</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SELECTOR_FIELDS.map(field => (
              <div key={field.key}>
                <label className="block text-white/80 text-sm mb-1">{field.label}</label>
                <input
                  type="text"
                  value={selectors[field.key]}
                  onChange={(e) => updateSelector(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-indigo-300 text-sm"
                />
                <span className="text-white/40 text-xs mt-1 block">{field.hint}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Feed info + max items */}
        <div className="mb-6">
          <label className="block text-white font-bold mb-3">Configuration du flux</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-white/80 text-sm mb-1">Titre du flux</label>
              <input
                type="text"
                value={feedInfo.title}
                onChange={(e) => setFeedInfo(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Mon flux personnalise"
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-indigo-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm mb-1">Description</label>
              <input
                type="text"
                value={feedInfo.description}
                onChange={(e) => setFeedInfo(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description du flux"
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-indigo-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm mb-1">Nombre max d'items</label>
              <input
                type="number"
                value={maxItems}
                onChange={(e) => setMaxItems(parseInt(e.target.value) || 10)}
                min={1}
                max={50}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-indigo-300 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
            Apercu
          </button>
          <button
            type="button"
            onClick={handleDownloadRSS}
            disabled={loading || !url}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
          >
            <Download size={20} />
            Telecharger RSS
          </button>
          {permalinkUrl && (
            <button
              type="button"
              onClick={handleCopyPermalink}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors"
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
              {copied ? 'Copie !' : 'Copier l\'URL du flux'}
            </button>
          )}

          {(previewItems.length > 0 || editingFeed) && (
            <button
              type="button"
              onClick={handleSaveFeed}
              disabled={saving}
              className={`flex items-center gap-2 px-6 py-3 ${editingFeed ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-500 hover:bg-green-600'} disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors w-full justify-center`}
            >
              {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              {saving ? 'Sauvegarde...' : editingFeed ? 'Mettre a jour le flux' : 'Sauvegarder ce flux'}
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border-2 border-red-400 rounded-xl text-white">
            {error}
          </div>
        )}
      </form>}

      {/* Permalink display */}
      {mode === 'css' && permalinkUrl && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
          <label className="block text-white font-bold mb-2 flex items-center gap-2">
            <Link2 size={18} />
            URL du flux RSS (a copier dans votre lecteur RSS)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={permalinkUrl}
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white/90 text-sm font-mono"
              onClick={(e) => e.target.select()}
            />
            <button
              onClick={handleCopyPermalink}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors flex-shrink-0"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </div>
      )}

      {/* Preview */}
      {mode === 'css' && <FeedPreview items={previewItems} />}
    </div>
  );
}

export default FeedCreator;
