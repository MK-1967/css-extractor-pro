import React from 'react';
import { ExternalLink } from 'lucide-react';

function FeedPreview({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-6 mt-6 shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Apercu — {items.length} element{items.length > 1 ? 's' : ''} trouve{items.length > 1 ? 's' : ''}
      </h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex gap-4 p-4 border border-gray-200 rounded-xl hover:border-indigo-300 transition-colors"
          >
            {item.image && (
              <img
                src={item.image}
                alt=""
                className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div className="flex-1 min-w-0">
              {item.title && (
                <h4 className="font-bold text-gray-800 mb-1 truncate">{item.title}</h4>
              )}
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-500 text-sm hover:underline flex items-center gap-1 truncate"
                >
                  <ExternalLink size={14} />
                  {item.link}
                </a>
              )}
              {item.date && (
                <span className="text-xs text-gray-400 mt-1 block">{item.date}</span>
              )}
              {item.description && (
                <p className="text-gray-600 text-sm mt-2 line-clamp-2">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FeedPreview;
