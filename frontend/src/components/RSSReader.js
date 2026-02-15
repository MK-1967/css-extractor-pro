import React, { useState } from 'react';
import axios from 'axios';
import { Rss, Loader2, ExternalLink, Calendar, User } from 'lucide-react';
import API_URL from '../config';

function RSSReader() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [feedTitle, setFeedTitle] = useState('');
  const [articles, setArticles] = useState([]);

  const handleParse = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setArticles([]);
    setFeedTitle('');

    try {
      const response = await axios.post(`${API_URL}/api/rss/parse`, { url });
      if (response.data.success) {
        setArticles(response.data.articles || []);
        setFeedTitle(response.data.title || '');
      } else {
        setError(response.data.error || 'Erreur inconnue');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la lecture du flux RSS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleParse} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="mb-4">
          <label className="block text-white font-bold mb-2 text-lg">URL du flux RSS</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.lemonde.fr/rss/une.xml"
            required
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-300/30 text-lg"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors w-full justify-center"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Rss size={20} />}
          {loading ? 'Chargement...' : 'Lire le flux RSS'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border-2 border-red-400 rounded-xl text-white">
            {error}
          </div>
        )}
      </form>

      {articles.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            {feedTitle && <span>{feedTitle} — </span>}
            {articles.length} article{articles.length > 1 ? 's' : ''}
          </h3>

          <div className="space-y-3">
            {articles.map((article, index) => (
              <div
                key={index}
                className="flex gap-4 p-4 border border-gray-200 rounded-xl hover:border-orange-300 transition-colors bg-gradient-to-r from-orange-50 to-amber-50"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 mb-1">{article.title}</h4>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{article.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    {article.pubDate && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(article.pubDate).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                    {article.author && (
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {article.author}
                      </span>
                    )}
                    {article.category && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded font-bold">
                        {article.category}
                      </span>
                    )}
                  </div>
                </div>
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 text-white rounded-xl flex-shrink-0 hover:shadow-lg transition-shadow"
                  title="Lire l'article"
                >
                  <ExternalLink size={20} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default RSSReader;
