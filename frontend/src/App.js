import React, { useState } from 'react';
import { Rss, Palette, PlusCircle, BookOpen, Layers } from 'lucide-react';
import FeedCreator from './components/FeedCreator';
import CSSExtractor from './components/CSSExtractor';
import RSSReader from './components/RSSReader';
import FeedLibrary from './components/FeedLibrary';
import AggregatedReader from './components/AggregatedReader';

const TABS = [
  { id: 'feed', label: 'Creer un flux', icon: PlusCircle },
  { id: 'library', label: 'Bibliothèque', icon: BookOpen },
  { id: 'aggregator', label: 'Agrégateur', icon: Layers },
  { id: 'css', label: 'Extraction CSS', icon: Palette },
  { id: 'rss', label: 'Lecteur RSS', icon: Rss },
];

function App() {
  const [activeTab, setActiveTab] = useState('feed');
  const [editingFeed, setEditingFeed] = useState(null);

  const handleEditFeed = (feed) => {
    setEditingFeed(feed);
    setActiveTab('feed');
  };

  const handleClearEdit = () => {
    setEditingFeed(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-800 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Feed <span className="text-amber-300">Creator</span>
          </h1>
          <p className="text-lg text-white/80">
            Creez des flux RSS a partir de n'importe quelle page web
          </p>
        </header>

        {/* Tabs */}
        <nav className="flex justify-center gap-2 mb-8">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (tab.id !== 'feed') setEditingFeed(null); }}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-indigo-600 shadow-lg shadow-indigo-500/30'
                    : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <main>
          {activeTab === 'feed' && <FeedCreator editingFeed={editingFeed} onClearEdit={handleClearEdit} />}
          {activeTab === 'library' && <FeedLibrary onEditFeed={handleEditFeed} />}
          {activeTab === 'aggregator' && <AggregatedReader />}
          {activeTab === 'css' && <CSSExtractor />}
          {activeTab === 'rss' && <RSSReader />}
        </main>
      </div>
    </div>
  );
}

export default App;
