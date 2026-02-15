import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Layers, ExternalLink, Star, Eye, Loader2, Calendar, AlertCircle } from 'lucide-react';
import API_URL from '../config';

function AggregatedReader() {
  const [feeds, setFeeds] = useState([]);
  const [articles, setArticles] = useState([]);
  const [selectedFeedId, setSelectedFeedId] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, starred
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchFeeds();
  }, []);

  useEffect(() => {
    setOffset(0);
    setArticles([]);
    fetchArticles(true);
    // eslint-disable-next-line
  }, [selectedFeedId, filter]);

  useEffect(() => {
    if (offset > 0) {
      fetchArticles(false);
    }
    // eslint-disable-next-line
  }, [offset]);

  const fetchFeeds = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/feeds`);
      setFeeds(response.data.feeds || []);
    } catch (err) {
      console.error('Fetch feeds error:', err);
    }
  };

  const fetchArticles = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedFeedId) params.append('feed_id', selectedFeedId);
      if (filter === 'unread') params.append('is_read', 'false');
      if (filter === 'starred') params.append('is_starred', 'true');
      params.append('limit', '20');
      params.append('offset', reset ? '0' : offset.toString());

      const response = await axios.get(`${API_URL}/api/articles?${params}`);

      if (reset) {
        setArticles(response.data.articles || []);
      } else {
        setArticles([...articles, ...(response.data.articles || [])]);
      }

      setHasMore(response.data.has_more || false);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de chargement des articles');
      console.error('Fetch articles error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRead = async (articleId, currentState) => {
    try {
      await axios.patch(`${API_URL}/api/articles/${articleId}/read`, { is_read: !currentState });
      setArticles(articles.map(a => a.id === articleId ? { ...a, is_read: !currentState } : a));
      // Refresh feeds pour mettre à jour les compteurs
      fetchFeeds();
    } catch (err) {
      console.error('Toggle read error:', err);
    }
  };

  const toggleStar = async (articleId, currentState) => {
    try {
      await axios.patch(`${API_URL}/api/articles/${articleId}/star`, { is_starred: !currentState });
      setArticles(articles.map(a => a.id === articleId ? { ...a, is_starred: !currentState } : a));
    } catch (err) {
      console.error('Toggle star error:', err);
    }
  };

  const handleFeedClick = (feedId) => {
    setSelectedFeedId(feedId);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const resolveLink = (article) => {
    if (!article.link) return '#';
    if (article.link.startsWith('http')) return article.link;
    try {
      return new URL(article.link, article.feed_url).href;
    } catch {
      return article.link;
    }
  };

  const totalUnread = feeds.reduce((sum, feed) => sum + (feed.unread_count || 0), 0);

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="w-64 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 h-fit sticky top-4">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Layers size={20} />
          Flux
        </h3>

        <div className="space-y-2">
          <button
            onClick={() => handleFeedClick(null)}
            className={`w-full text-left px-3 py-2 rounded-lg transition ${
              selectedFeedId === null
                ? 'bg-white text-indigo-600 font-bold shadow-lg'
                : 'text-white hover:bg-white/20'
            }`}
          >
            <div className="flex justify-between items-center">
              <span>Tous les flux</span>
              {totalUnread > 0 && (
                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {totalUnread}
                </span>
              )}
            </div>
          </button>

          {feeds.length === 0 ? (
            <p className="text-white/50 text-sm px-3 py-2">Aucun flux disponible</p>
          ) : (
            feeds.map(feed => (
              <button
                key={feed.id}
                onClick={() => handleFeedClick(feed.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  selectedFeedId === feed.id
                    ? 'bg-white text-indigo-600 font-bold shadow-lg'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <div className="truncate mb-1">{feed.title}</div>
                <div className="flex justify-between items-center text-xs">
                  <span className="opacity-70">{feed.total_articles} articles</span>
                  {feed.unread_count > 0 && (
                    <span className="bg-orange-500 text-white font-bold px-2 py-0.5 rounded-full">
                      {feed.unread_count}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Articles */}
      <div className="flex-1 space-y-4">
        {/* Filtres */}
        <div className="flex gap-2">
          {['all', 'unread', 'starred'].map(f => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`px-4 py-2 rounded-xl font-bold transition ${
                filter === f
                  ? 'bg-white text-indigo-600 shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {f === 'all' ? '📚 Tous' : f === 'unread' ? '🔴 Non lus' : '⭐ Favoris'}
            </button>
          ))}
        </div>

        {/* Messages d'erreur */}
        {error && (
          <div className="bg-red-500/20 border-2 border-red-400 rounded-xl p-4 flex items-center gap-2 text-white">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Loading initial */}
        {loading && articles.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 size={40} className="animate-spin text-white" />
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 text-center">
            <p className="text-white text-lg mb-2">Aucun article trouvé</p>
            <p className="text-white/70 text-sm">
              {feeds.length === 0
                ? 'Créez votre premier flux dans l\'onglet "Créer un flux"'
                : 'Rafraîchissez vos flux pour importer de nouveaux articles'}
            </p>
          </div>
        ) : (
          <>
            {/* Liste d'articles */}
            <div className="space-y-4">
              {articles.map(article => (
                <div
                  key={article.id}
                  className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all ${
                    article.is_read ? 'opacity-60' : ''
                  } ${article.is_starred ? 'border-2 border-amber-400' : ''}`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg mb-2 ${article.is_read ? 'font-normal text-gray-700' : 'font-bold text-gray-900'}`}>
                        {article.title}
                      </h3>

                      {article.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {article.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-xs">
                        {article.pub_date && (
                          <span className="flex items-center gap-1 text-gray-500">
                            <Calendar size={12} />
                            {new Date(article.pub_date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded font-bold">
                          {article.feed_title}
                        </span>
                        {article.author && (
                          <span className="text-gray-500">Par {article.author}</span>
                        )}
                        {article.category && (
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded">
                            {article.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleRead(article.id, article.is_read)}
                        className={`p-2 rounded-lg transition-colors ${
                          article.is_read
                            ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                        }`}
                        title={article.is_read ? 'Marquer non lu' : 'Marquer lu'}
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        onClick={() => toggleStar(article.id, article.is_starred)}
                        className={`p-2 rounded-lg transition-colors ${
                          article.is_starred
                            ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        title={article.is_starred ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      >
                        <Star size={16} fill={article.is_starred ? 'currentColor' : 'none'} />
                      </button>

                      <a
                        href={resolveLink(article)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gradient-to-br from-orange-400 to-red-500 text-white rounded-lg hover:shadow-lg transition-shadow"
                        title="Ouvrir l'article"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bouton Charger plus */}
            {hasMore && (
              <button
                onClick={() => setOffset(offset + 20)}
                disabled={loading}
                className="w-full py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Chargement...
                  </>
                ) : (
                  'Charger plus d\'articles'
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AggregatedReader;
