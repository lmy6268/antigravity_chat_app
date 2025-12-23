import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/i18n/LanguageContext';

interface SearchResult {
  id: string;
  username: string;
}

interface AddFriendFormProps {
  onSubmit: (targetUsername: string) => Promise<void>;
}

export function AddFriendForm({ onSubmit }: AddFriendFormProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(searchQuery)}`,
        );
        const data = await res.json();
        setSearchResults(data.users || []);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSendRequest = useCallback(
    async (username: string) => {
      try {
        setSendingTo(username);
        await onSubmit(username);
        alert(t.dashboard.friends.requestSent);
        setSearchQuery('');
        setSearchResults([]);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : t.common.error;
        alert(errorMessage);
      } finally {
        setSendingTo(null);
      }
    },
    [onSubmit, t],
  );

  return (
    <div style={{ marginBottom: '30px' }}>
      <h3>{t.dashboard.friends.addTitle}</h3>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder={t.dashboard.friends.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #3e3e3e',
            backgroundColor: '#1e1e1e',
            color: 'white',
            boxSizing: 'border-box',
          }}
        />

        {/* Search Results Dropdown */}
        {searchQuery.trim().length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: '#252526',
              border: '1px solid #3e3e3e',
              borderRadius: '6px',
              marginTop: '5px',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 10,
            }}
          >
            {isSearching && (
              <div
                style={{ padding: '10px', color: '#888', textAlign: 'center' }}
              >
                {t.common.loading}
              </div>
            )}

            {!isSearching && searchResults.length === 0 && (
              <div
                style={{ padding: '10px', color: '#888', textAlign: 'center' }}
              >
                {t.dashboard.friends.noResults}
              </div>
            )}

            {!isSearching &&
              searchResults.map((user) => (
                <div
                  key={user.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px',
                    borderBottom: '1px solid #3e3e3e',
                  }}
                >
                  <span style={{ color: '#f0f0f0' }}>{user.username}</span>
                  <button
                    onClick={() => handleSendRequest(user.username)}
                    disabled={sendingTo === user.username}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor:
                        sendingTo === user.username ? '#555' : '#007acc',
                      color: 'white',
                      cursor:
                        sendingTo === user.username ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    {t.dashboard.friends.sendRequest}
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
