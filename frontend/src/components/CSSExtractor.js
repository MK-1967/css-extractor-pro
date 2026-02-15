import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Palette, Loader2, Download } from 'lucide-react';
import API_URL from '../config';

function CSSExtractor() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/files`);
      const cssFiles = (response.data.files || response.data || []).filter(
        f => f.filename?.endsWith('.css') || f.name?.endsWith('.css')
      );
      setFiles(cssFiles);
    } catch (err) {
      console.error('Erreur lors de la recuperation des fichiers', err);
    }
  };

  const handleExtract = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(`${API_URL}/api/scan`, { url });
      setResult(response.data);
      fetchFiles();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'extraction CSS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleExtract} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="mb-4">
          <label className="block text-white font-bold mb-2 text-lg">URL du site</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-300/30 text-lg"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors w-full justify-center"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Palette size={20} />}
          {loading ? 'Extraction en cours...' : 'Extraire le CSS'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border-2 border-red-400 rounded-xl text-white">
            {error}
          </div>
        )}

        {result && result.success && (
          <div className="mt-4 p-4 bg-emerald-500/20 border-2 border-emerald-400 rounded-xl text-white">
            <p className="font-bold">CSS extrait avec succes !</p>
            <p className="text-sm mt-1 opacity-80">{result.filesCount} fichiers CSS identifies</p>
          </div>
        )}
      </form>

      {files.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Fichiers CSS extraits ({files.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-purple-300 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded mb-1">
                    CSS
                  </span>
                  <p className="font-bold text-sm text-gray-800 truncate">{file.domain}</p>
                  <p className="text-xs text-gray-500 truncate">{file.filename || file.name}</p>
                </div>
                <a
                  href={`${API_URL}${file.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-3 p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors flex-shrink-0"
                >
                  <Download size={18} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CSSExtractor;
