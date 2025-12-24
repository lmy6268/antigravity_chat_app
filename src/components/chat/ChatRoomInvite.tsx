import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/i18n/LanguageContext';
import type { UserDTO } from '@/types/dto';
import type { Friend } from '@/types/friend';

interface SearchResult {
  id: string;
  username: string;
  public_key?: string;
}

interface ChatRoomInviteProps {
  onInvite: (user: UserDTO) => Promise<boolean>;
  currentParticipants: string[];
  currentUser: string;
}

export function ChatRoomInvite({
  onInvite,
  currentParticipants,
  currentUser,
}: ChatRoomInviteProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [invitingUser, setInvitingUser] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);

  // 친구 목록 로드
  useEffect(() => {
    const loadFriends = async () => {
      try {
        const res = await fetch(`/api/friends?username=${currentUser}`);
        if (res.ok) {
          const data = await res.json();
          // status가 'accepted'인 친구만 필터링
          const acceptedFriends = (data.friends || []).filter(
            (f: Friend) => f.status === 'accepted',
          );
          setFriends(acceptedFriends);
        } else {
          console.error('Failed to load friends:', res.status, await res.text());
        }
      } catch (error) {
        console.error('Error loading friends:', error);
      }
    };
    void loadFriends();
  }, [currentUser]);

  // Debounced search - 친구 목록에서만 검색
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      try {
        // 친구 목록에서 검색어로 필터링
        const filtered = friends
          .filter((friend) =>
            friend.username
              .toLowerCase()
              .includes(searchQuery.toLowerCase().trim()),
          )
          .map((friend) => ({
            id: friend.friendId,
            username: friend.username,
            public_key: friend.publicKey,
          }))
          .filter(
            (u) =>
              !currentParticipants.includes(u.username) &&
              u.username !== currentUser,
          );

        setSearchResults(filtered);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, currentParticipants, friends, currentUser]);

  const handleInvite = useCallback(
    async (user: SearchResult) => {
      try {
        setInvitingUser(user.username);
        // Convert SearchResult to UserDTO (ensure public_key is present if needed by onInvite)
        const userDTO: UserDTO = {
          id: user.id,
          username: user.username,
          public_key: user.public_key,
        };

        const success = await onInvite(userDTO);
        if (success) {
          setSearchQuery('');
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Invite error:', error);
      } finally {
        setInvitingUser(null);
      }
    },
    [onInvite],
  );

  return (
    <div
      style={{
        marginBottom: '20px',
        borderBottom: '1px solid #555',
        paddingBottom: '15px',
      }}
    >
      <h4 style={{ margin: '0 0 10px 0', color: '#ddd' }}>
        {t.chat.invite || 'Invite User'}
      </h4>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder={t.dashboard.friends.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #555',
            backgroundColor: '#252526',
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
              backgroundColor: '#333',
              border: '1px solid #555',
              borderRadius: '4px',
              marginTop: '4px',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 150,
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            }}
          >
            {isSearching && (
              <div
                style={{
                  padding: '8px',
                  color: '#888',
                  textAlign: 'center',
                  fontSize: '13px',
                }}
              >
                {t.common.loading}
              </div>
            )}

            {!isSearching && searchResults.length === 0 && (
              <div
                style={{
                  padding: '8px',
                  color: '#888',
                  textAlign: 'center',
                  fontSize: '13px',
                }}
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
                    padding: '8px',
                    borderBottom: '1px solid #444',
                  }}
                >
                  <span style={{ color: '#f0f0f0', fontSize: '14px' }}>
                    {user.username}
                  </span>
                  <button
                    onClick={() => handleInvite(user)}
                    disabled={invitingUser === user.username}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor:
                        invitingUser === user.username ? '#555' : '#007acc',
                      color: 'white',
                      cursor:
                        invitingUser === user.username
                          ? 'not-allowed'
                          : 'pointer',
                      fontSize: '11px',
                    }}
                  >
                    {invitingUser === user.username ? 'Inviting...' : 'Invite'}
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
