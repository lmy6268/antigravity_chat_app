import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ChangeEvent,
} from 'react';
import { Friend } from '@/types/friend';
import { useTranslation } from '@/i18n/LanguageContext';
import { loadUserProfile } from '@/lib/key-storage';

interface SearchResult {
  id: string;
  username: string;
}

interface FriendsTabProps {
  friends: Friend[];
  onSendRequest: (targetUsername: string) => Promise<void>;
  onAccept: (friendId: string) => Promise<void>;
  onReject: (friendId: string) => Promise<void>;
  onRemove: (friendId: string) => Promise<void>;
  onCancel: (friendId: string) => Promise<void>;
}

export function FriendsTab({
  friends,
  onSendRequest,
  onAccept,
  onReject,
  onRemove,
  onCancel,
}: FriendsTabProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  // 현재 로그인한 사용자 정보 로드
  useEffect(() => {
    const initCurrentUser = async () => {
      const user = await loadUserProfile();
      setCurrentUsername(user?.username ?? null);
    };
    void initCurrentUser();
  }, []);

  // 친구 목록 (accepted만)
  const acceptedFriends = useMemo(
    () => friends.filter((f) => f.status === 'accepted'),
    [friends],
  );

  // 친구 사용자명 Set (메모이제이션)
  const friendUsernames = useMemo(
    () => new Set(acceptedFriends.map((f) => f.username.toLowerCase())),
    [acceptedFriends],
  );

  // 받은 친구 요청 (pending이고 isSender가 false)
  const receivedRequests = useMemo(
    () => friends.filter((f) => f.status === 'pending' && !f.isSender),
    [friends],
  );

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
        const users: SearchResult[] = data.users || [];

        // 본인 제외
        const filtered =
          currentUsername != null
            ? users.filter((u) => u.username !== currentUsername)
            : users;

        // 친구인 경우 맨 위로, 친구가 아닌 경우 그 다음으로 정렬
        const sorted = filtered.sort((a, b) => {
          const aIsFriend = friendUsernames.has(a.username.toLowerCase());
          const bIsFriend = friendUsernames.has(b.username.toLowerCase());
          if (aIsFriend && !bIsFriend) return -1;
          if (!aIsFriend && bIsFriend) return 1;
          return 0;
        });

        setSearchResults(sorted);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUsername, friendUsernames]);

  const handleSendRequest = useCallback(
    async (username: string) => {
      if (sendingTo !== null) return;

      try {
        setSendingTo(username);
        await onSendRequest(username);
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
    [onSendRequest, t, sendingTo],
  );

  const isFriend = (username: string) => {
    return friendUsernames.has(username.toLowerCase());
  };

  return (
    <div>
      {/* 검색창 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder={t.dashboard.friends.searchPlaceholder}
            value={searchQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #3e3e3e',
              backgroundColor: '#252526',
              color: 'white',
              boxSizing: 'border-box',
              fontSize: '14px',
            }}
          />

          {/* 검색 결과 */}
          {searchQuery.trim().length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#252526',
                border: '1px solid #3e3e3e',
                borderRadius: '8px',
                marginTop: '8px',
                maxHeight: '400px',
                overflowY: 'auto',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              }}
            >
              {isSearching && (
                <div
                  style={{
                    padding: '16px',
                    color: '#888',
                    textAlign: 'center',
                  }}
                >
                  {t.common.loading}
                </div>
              )}

              {!isSearching && searchResults.length === 0 && (
                <div
                  style={{
                    padding: '16px',
                    color: '#888',
                    textAlign: 'center',
                  }}
                >
                  {t.dashboard.friends.noResults}
                </div>
              )}

              {!isSearching &&
                searchResults.map((user: SearchResult) => {
                  const userIsFriend = isFriend(user.username);
                  return (
                    <div
                      key={user.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        borderBottom: '1px solid #3e3e3e',
                        backgroundColor: userIsFriend ? '#1a3a1a' : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#f0f0f0', fontSize: '14px' }}>
                          {user.username}
                        </span>
                        {userIsFriend && (
                          <span
                            style={{
                              fontSize: '11px',
                              color: '#28a745',
                              backgroundColor: '#28a74522',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            친구
                          </span>
                        )}
                      </div>
                      {!userIsFriend && (
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
                              sendingTo === user.username
                                ? 'not-allowed'
                                : 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          {t.dashboard.friends.sendRequest}
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* 친구 목록 */}
      {searchQuery.trim().length === 0 && (
        <div>
          {/* 받은 친구 요청 */}
          <div style={{ marginBottom: '24px' }}>
            <h3
              style={{
                marginBottom: '12px',
                fontSize: '16px',
                fontWeight: '500',
                color: '#f0f0f0',
              }}
            >
              {t.dashboard.friends.requestsTitle}
            </h3>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {receivedRequests.length > 0 ? (
                receivedRequests.map((request) => (
                  <div
                    key={request.id}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#252526',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '14px', color: '#f0f0f0' }}>
                      {request.username}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => onAccept(request.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: '#28a745',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        {t.dashboard.friends.accept}
                      </button>
                      <button
                        onClick={() => onReject(request.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: '#d9534f',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        {t.dashboard.friends.reject}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    color: '#aaa',
                    fontStyle: 'italic',
                    fontSize: '14px',
                    textAlign: 'center',
                    padding: '20px',
                    backgroundColor: '#252526',
                    borderRadius: '8px',
                  }}
                >
                  {t.dashboard.friends.noRequests}
                </div>
              )}
            </div>
          </div>

          {/* 친구 목록 */}
          <div>
            <h3
              style={{
                marginBottom: '12px',
                fontSize: '16px',
                fontWeight: '500',
                color: '#f0f0f0',
              }}
            >
              {t.dashboard.friends.listTitle}
            </h3>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {acceptedFriends.map((friend) => (
                <div
                  key={friend.id}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#252526',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '14px', color: '#f0f0f0' }}>
                    {friend.username}
                  </span>
                  <button
                    onClick={() => onRemove(friend.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: '#d9534f',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    {t.dashboard.friends.remove}
                  </button>
                </div>
              ))}
              {acceptedFriends.length === 0 && (
                <div
                  style={{
                    color: '#aaa',
                    fontStyle: 'italic',
                    fontSize: '14px',
                    textAlign: 'center',
                    padding: '40px 20px',
                    backgroundColor: '#252526',
                    borderRadius: '8px',
                  }}
                >
                  {t.dashboard.friends.noFriends}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
