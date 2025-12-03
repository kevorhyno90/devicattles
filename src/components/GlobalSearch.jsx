/**
 * Global Search Component
 * 
 * Features:
 * - Search across all modules
 * - Recent searches
 * - Quick actions
 * - Keyboard shortcuts (Ctrl/Cmd + K)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataLayer } from '../lib/dataLayer';

export default function GlobalSearch({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Load recent searches
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cattalytics:recentSearches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K to open
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
      
      // Escape to close
      if (e.key === 'Escape') {
        onClose();
      }
      
      // Arrow navigation
      if (results && isOpen) {
        const allResults = [
          ...(results.animals || []),
          ...(results.crops || []),
          ...(results.tasks || []),
          ...(results.finance || []),
          ...(results.inventory || [])
        ];
        
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && allResults[selectedIndex]) {
          e.preventDefault();
          handleResultClick(allResults[selectedIndex]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Search function
  const performSearch = async (term) => {
    if (!term || term.trim().length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const searchResults = await DataLayer.globalSearch(term);
      setResults(searchResults);
      
      // Save to recent searches
      const newRecent = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem('cattalytics:recentSearches', JSON.stringify(newRecent));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle result click
  const handleResultClick = (result) => {
    if (result.type === 'animal' || result.breed) {
      navigate('/animals');
    } else if (result.planted || result.expectedHarvest) {
      navigate('/crops');
    } else if (result.title && result.dueDate) {
      navigate('/tasks');
    } else if (result.type === 'income' || result.type === 'expense') {
      navigate('/finance');
    } else if (result.quantity !== undefined) {
      navigate('/inventory');
    }
    onClose();
  };

  // Quick actions
  const quickActions = [
    { label: 'Add Animal', icon: '🐄', action: () => navigate('/animals') },
    { label: 'Add Crop', icon: '🌾', action: () => navigate('/crops') },
    { label: 'Add Task', icon: '✓', action: () => navigate('/tasks') },
    { label: 'Add Transaction', icon: '💰', action: () => navigate('/finance') },
    { label: 'Add Inventory', icon: '📦', action: () => navigate('/inventory') }
  ];

  if (!isOpen) return null;

  const totalResults = results 
    ? (results.animals?.length || 0) + (results.crops?.length || 0) + 
      (results.tasks?.length || 0) + (results.finance?.length || 0) + 
      (results.inventory?.length || 0)
    : 0;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search animals, crops, tasks, transactions... (Ctrl+K)"
              className="w-full px-4 py-3 pl-12 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <span className="absolute left-4 top-3.5 text-gray-400 text-xl">🔍</span>
            {loading && (
              <span className="absolute right-4 top-3.5 text-gray-400">Searching...</span>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 120px)' }}>
          {!searchTerm && recentSearches.length > 0 && (
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Recent Searches</h3>
              <div className="space-y-1">
                {recentSearches.map((recent, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSearchTerm(recent)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    🕒 {recent}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!searchTerm && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      action.action();
                      onClose();
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <span className="text-2xl">{action.icon}</span>
                    <span className="text-gray-700 dark:text-gray-300">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results && totalResults === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">🔍</div>
              <p>No results found for "{searchTerm}"</p>
            </div>
          )}

          {results && totalResults > 0 && (
            <div className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Found {totalResults} result{totalResults !== 1 ? 's' : ''}
              </p>

              {/* Animals */}
              {results.animals && results.animals.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    🐄 Animals ({results.animals.length})
                  </h3>
                  <div className="space-y-1">
                    {results.animals.slice(0, 5).map((animal, idx) => (
                      <button
                        key={animal.id}
                        onClick={() => handleResultClick(animal)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{animal.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {animal.tagNumber} • {animal.type} • {animal.breed}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Crops */}
              {results.crops && results.crops.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    🌾 Crops ({results.crops.length})
                  </h3>
                  <div className="space-y-1">
                    {results.crops.slice(0, 5).map((crop, idx) => (
                      <button
                        key={crop.id}
                        onClick={() => handleResultClick(crop)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{crop.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {crop.field} • {crop.status}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {results.tasks && results.tasks.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    ✓ Tasks ({results.tasks.length})
                  </h3>
                  <div className="space-y-1">
                    {results.tasks.slice(0, 5).map((task, idx) => (
                      <button
                        key={task.id}
                        onClick={() => handleResultClick(task)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{task.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {task.priority} • {task.status}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Finance */}
              {results.finance && results.finance.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    💰 Transactions ({results.finance.length})
                  </h3>
                  <div className="space-y-1">
                    {results.finance.slice(0, 5).map((transaction, idx) => (
                      <button
                        key={transaction.id}
                        onClick={() => handleResultClick(transaction)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{transaction.description}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {transaction.type} • ${transaction.amount}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Inventory */}
              {results.inventory && results.inventory.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    📦 Inventory ({results.inventory.length})
                  </h3>
                  <div className="space-y-1">
                    {results.inventory.slice(0, 5).map((item, idx) => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(item)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Quantity: {item.quantity} • {item.category}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
          <div>
            <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">↑↓</kbd> Navigate
            <span className="mx-2">•</span>
            <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">Enter</kbd> Select
          </div>
          <div>
            <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">Esc</kbd> Close
          </div>
        </div>
      </div>
    </div>
  );
}
