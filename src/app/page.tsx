'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { useTranslation, withParams } from '@/i18n/LanguageContext';
import { useRoomList } from '@/hooks/dashboard/useRoomList';
import { useRoomCreate } from '@/hooks/dashboard/useRoomCreate';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { RoomList } from '@/components/dashboard/RoomList';
import { CreateRoomModal } from '@/components/dashboard/CreateRoomModal';

interface Friend {
  id: string;
  username: string;
  status: 'pending' | 'accepted';
  isSender: boolean;
}

export default function Dashboard() {
  const router = useRouter();
  const { t } = useTranslation();

  // User State
  const [nickname, setNickname] = useState('');
  const [isProfileSet, setIsProfileSet] = useState(false);
  const [activeTab, setActiveTab] = useState<'rooms' | 'friends'>('rooms');

  // Hooks
  const { myRooms, joinRoom, setMyRooms } = useRoomList(nickname);
  const { createRoom, isCreating } = useRoomCreate(nickname, (newRoom) => {
    setMyRooms(prev => [...prev, newRoom]);
    setShowCreateModal(false);
  });

  // Friends State (To be refactored into hook later)
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendUsername, setFriendUsername] = useState('');

  // UI State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrRoomUrl, setQrRoomUrl] = useState('');
  const [qrRoomName, setQrRoomName] = useState('');

  // Load user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('chat_user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(storedUser);
    setNickname(user.username);
    setIsProfileSet(true);

    // Friends fetch (Room fetch is handled by useRoomList)
    fetchFriends(user.username);
  }, [router]);

  const fetchFriends = async (username: string) => {
    try {
      const res = await fetch(`/api/friends?username=${username}`);
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendUsername) return;

    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: nickname,
          targetUsername: friendUsername
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.common.error);

      alert(t.dashboard.friends.requestSent);
      setFriendUsername('');
      fetchFriends(nickname);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleFriendAction = async (friendId: string, action: 'accept' | 'reject' | 'delete') => {
    try {
      const method = action === 'delete' ? 'DELETE' : 'PUT';
      const body = action !== 'delete' ? JSON.stringify({ status: action === 'accept' ? 'accepted' : 'rejected' }) : undefined;

      const res = await fetch(`/api/friends/${friendId}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      });

      if (!res.ok) throw new Error('Action failed');

      fetchFriends(nickname);
    } catch (error) {
      console.error('Error updating friend:', error);
      alert(t.common.error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('chat_user');
    localStorage.removeItem('chat_nickname');
    setIsProfileSet(false);
    setNickname('');
    router.push('/login');
  };

  if (!isProfileSet) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1e1e1e', color: '#f0f0f0', padding: '15px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        <DashboardHeader nickname={nickname} onLogout={handleLogout} />

        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #3e3e3e' }}>
          <button
            onClick={() => setActiveTab('rooms')}
            style={{
              padding: '10px 20px', background: 'none', border: 'none', color: activeTab === 'rooms' ? '#007acc' : '#aaa',
              borderBottom: activeTab === 'rooms' ? '2px solid #007acc' : 'none', cursor: 'pointer', fontSize: '16px'
            }}
          >
            {t.dashboard.tabs.rooms}
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            style={{
              padding: '10px 20px', background: 'none', border: 'none', color: activeTab === 'friends' ? '#007acc' : '#aaa',
              borderBottom: activeTab === 'friends' ? '2px solid #007acc' : 'none', cursor: 'pointer', fontSize: '16px'
            }}
          >
            {t.dashboard.tabs.friends}
          </button>
        </div>

        {activeTab === 'rooms' ? (
          <RoomList
            rooms={myRooms}
            onJoinRoom={joinRoom}
            onCreateClick={() => setShowCreateModal(true)}
          />
        ) : (
          <>
            <div style={{ marginBottom: '30px' }}>
              <h3>{t.dashboard.friends.addTitle}</h3>
              <form onSubmit={handleSendFriendRequest} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder={t.dashboard.friends.enterUsername}
                  value={friendUsername}
                  onChange={(e) => setFriendUsername(e.target.value)}
                  style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #3e3e3e', backgroundColor: '#1e1e1e', color: 'white' }}
                />
                <button type="submit" style={{
                  padding: '10px 20px', borderRadius: '6px', border: 'none',
                  backgroundColor: '#007acc', color: 'white', cursor: 'pointer'
                }}>
                  {t.dashboard.friends.sendRequest}
                </button>
              </form>
            </div>

            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <h3>{t.dashboard.friends.listTitle}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {friends.filter(f => f.status === 'accepted').map(friend => (
                    <div key={friend.id} style={{
                      padding: '15px', backgroundColor: '#252526', borderRadius: '8px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
                    }}>
                      <span style={{ fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>{friend.username}</span>
                      <button onClick={() => handleFriendAction(friend.id, 'delete')} style={{
                        padding: '5px 10px', borderRadius: '4px', border: 'none', backgroundColor: '#d9534f', color: 'white', cursor: 'pointer', fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)'
                      }}>
                        {t.dashboard.friends.remove}
                      </button>
                    </div>
                  ))}
                  {friends.filter(f => f.status === 'accepted').length === 0 && (
                    <div style={{ color: '#aaa', fontStyle: 'italic', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>
                      {t.dashboard.friends.noFriends}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3>{t.dashboard.friends.requestsTitle}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {friends.filter(f => f.status === 'pending').map(friend => (
                    <div key={friend.id} style={{
                      padding: '15px', backgroundColor: '#252526', borderRadius: '8px',
                      display: 'flex', flexDirection: 'column', gap: '10px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{friend.username}</span>
                        <span style={{ fontSize: '12px', color: '#aaa' }}>
                          {friend.isSender ? t.dashboard.friends.sent : t.dashboard.friends.received}
                        </span>
                      </div>
                      {!friend.isSender && (
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => handleFriendAction(friend.id, 'accept')} style={{
                            flex: 1, padding: '5px', borderRadius: '4px', border: 'none', backgroundColor: '#28a745', color: 'white', cursor: 'pointer', fontSize: '12px'
                          }}>
                            {t.dashboard.friends.accept}
                          </button>
                          <button onClick={() => handleFriendAction(friend.id, 'reject')} style={{
                            flex: 1, padding: '5px', borderRadius: '4px', border: 'none', backgroundColor: '#d9534f', color: 'white', cursor: 'pointer', fontSize: '12px'
                          }}>
                            {t.dashboard.friends.reject}
                          </button>
                        </div>
                      )}
                      {friend.isSender && (
                        <button onClick={() => handleFriendAction(friend.id, 'delete')} style={{
                          width: '100%', padding: '5px', borderRadius: '4px', border: 'none', backgroundColor: '#6c757d', color: 'white', cursor: 'pointer', fontSize: '12px'
                        }}>
                          {t.dashboard.friends.cancel}
                        </button>
                      )}
                    </div>
                  ))}
                  {friends.filter(f => f.status === 'pending').length === 0 && (
                    <div style={{ color: '#aaa', fontStyle: 'italic' }}>
                      {t.dashboard.friends.noRequests}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Create Room Modal */}
        {showCreateModal && (
          <CreateRoomModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={createRoom}
            isCreating={isCreating}
          />
        )}

        {/* QR Code Modal (Keeping as is for now, maybe refactor later) */}
        {showQRModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }} onClick={() => setShowQRModal(false)}>
            <div style={{
              backgroundColor: '#252526', padding: '30px', borderRadius: '12px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '90%'
            }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: 0, color: '#f0f0f0' }}>{withParams(t.dashboard.qr.joinTitle, { roomName: qrRoomName })}</h3>
              <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
                <QRCodeCanvas value={qrRoomUrl} size={200} />
              </div>
              <p style={{ color: '#aaa', fontSize: '14px', textAlign: 'center', wordBreak: 'break-all' }}>
                {qrRoomUrl}
              </p>
              <button onClick={() => setShowQRModal(false)} style={{
                padding: '10px 20px', borderRadius: '6px', border: 'none',
                backgroundColor: '#333', color: '#f0f0f0', cursor: 'pointer'
              }}>
                {t.common.close}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
