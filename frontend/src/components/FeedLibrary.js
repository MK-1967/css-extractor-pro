import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, RefreshCw, Trash2, Loader2, AlertCircle } from 'lucide-react';
import API_URL from '../config';

function FeedLibrary() {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshingId, setRefreshingId] = useState(null);

  useEffect(() => {
    fetchFeeds();
  }, []);

  const fetchFeeds = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/api/feeds`);
      setFeeds(response.data.feeds || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de chargement des flux');
      console.error('Fetch feeds error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (feedId) => {
    try {
      setRefreshingId(feedId);
      const response = await axios.post(`${API_URL}/api/feeds/${feedId}/refresh`);

      if (response.data.success) {
        alert(`Rafraîchissement réussi ! ${response.data.new_articles} nouveaux articles importés.`);
        fetchFeeds(); // Recharger la liste pour mettre à jour les compteurs
      } else {
        alert(`Erreur: ${response.data.error}`);
      }
    } catch (err) {
      alert('Erreur lors du rafraîchissement du flux');
      console.error('Refresh error:', err);
    } finally {
      setRefreshingId(null);
    }
  };

  const handleDelete = async (feedId, feedTitle) => {
    if (!window.confirm(`Supprimer le flux "${feedTitle}" ?\n\nTous les articles associés seront également supprimés.`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/feeds/${feedId}`);
      alert('Flux supprimé avec succès !');
      fetchFeeds();
    } catch (err) {
      alert('Erreur lors de la suppression du flux');
      console.error('Delete error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 size={40} className="animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <BookOpen size={24} />
          Bibliothèque de flux ({feeds.length})
        </h2>

        {error && (
          <div className="bg-red-500/20 border-2 border-red-400 rounded-xl p-4 mb-4 flex items-center gap-2 text-white">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {feeds.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/70 text-lg mb-2">Aucun flux sauvegardé</p>
            <p className="text-white/50">Créez-en un dans l'onglet "Créer un flux" et cliquez sur "Sauvegarder" !</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feeds.map(feed => (
              <div key={feed.id} className="bg-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-lg mb-1 truncate">{feed.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 truncate">{feed.source_url}</p>

                    <div className="flex flex-wrap gap-4 text-xs">
                      <span className="flex items-center gap-1 text-gray-600">
                        📚 <span className="font-bold">{feed.total_articles}</span> articles
                      </span>
                      <span className="flex items-center gap-1 text-orange-600">
                        🔴 <span className="font-bold">{feed.unread_count || 0}</span> non lus
                      </span>
                      <span className="text-gray-500">
                        Mis à jour: {new Date(feed.updated_at).toLocaleDateString('fr-FR')}
                      </span>
                      {feed.last_fetched_at && (
                        <span className="text-gray-500">
                          Dernier rafraîchissement: {new Date(feed.last_fetched_at).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>

                    {/* Affichage des sélecteurs CSS (déplié au hover) */}
                    <details className="mt-3">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                        Voir les sélecteurs CSS
                      </summary>
                      <div className="mt-2 p-3 bg-gray-100 rounded-lg text-xs space-y-1">
                        <div><span className="font-bold">Item:</span> {feed.selector_item}</div>
                        <div><span className="font-bold">Titre:</span> {feed.selector_title}</div>
                        <div><span className="font-bold">Lien:</span> {feed.selector_link}</div>
                        <div><span className="font-bold">Description:</span> {feed.selector_description}</div>
                        <div><span className="font-bold">Date:</span> {feed.selector_date || 'N/A'}</div>
                        <div><span className="font-bold">Image:</span> {feed.selector_image || 'N/A'}</div>
                      </div>
                    </details>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleRefresh(feed.id)}
                      disabled={refreshingId === feed.id}
                      className="p-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors shadow-md hover:shadow-lg"
                      title="Rafraîchir le flux"
                    >
                      <RefreshCw
                        size={18}
                        className={refreshingId === feed.id ? 'animate-spin' : ''}
                      />
                    </button>
                    <button
                      onClick={() => handleDelete(feed.id, feed.title)}
                      className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-md hover:shadow-lg"
                      title="Supprimer le flux"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FeedLibrary;
