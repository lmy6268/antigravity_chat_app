'use client';

import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useRouter } from 'next/navigation';
import { generateRoomKey, generateSalt, encryptRoomKeyWithPassword } from '@/lib/crypto';

interface Room {
  id: string;
  name: string;
  password?: string;
}

interface Friend {
  id: string;
  username: string;
  status: 'pending' | 'accepted';
  isSender: boolean;
}

export default function Dashboard() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [isProfileSet, setIsProfileSet] = useState(false);
  const [activeTab, setActiveTab] = useState<'rooms' | 'friends'>('rooms');
  
  // Rooms State
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  
  // Friends State
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendUsername, setFriendUsername] = useState('');
  
  // Create Room State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // QR Code State
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrRoomUrl, setQrRoomUrl] = useState('');
  const [qrRoomName, setQrRoomName] = useState('');

  const handleShowQR = (roomId: string, roomName: string) => {
    const url = `${window.location.origin}/chat/${roomId}?name=${encodeURIComponent(roomName)}`;
    setQrRoomUrl(url);
    setQrRoomName(roomName);
    setShowQRModal(true);
  };

  // Load from server on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('chat_user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(storedUser);
    setNickname(user.username);
    setIsProfileSet(true);

    fetchRooms(user.username);
    fetchFriends(user.username);
  }, [router]);

  const fetchRooms = async (username: string) => {
    try {
      const res = await fetch(`/api/users/${username}/rooms`);
      if (res.ok) {
        const data = await res.json();
        setMyRooms(data.rooms || []);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

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

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName || !newRoomPassword) return;

    const roomId = crypto.randomUUID();
    
    try {
      // 1. Generate AES Room Key
      const roomKey = await generateRoomKey();

      // 2. Generate Salt
      const salt = generateSalt();

      // 3. Encrypt Room Key with Password (Open Chat Style)
      const encryptedKey = await encryptRoomKeyWithPassword(roomKey, newRoomPassword, salt);

      // 4. Call API to create room on server
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: roomId,
          name: newRoomName,
          password: newRoomPassword, // Still sending password for server-side auth/legacy check if needed, or we can rely solely on client-side decryption
          creator: nickname,
          salt: salt,
          encryptedKey: encryptedKey
        })
      });

      if (!res.ok) throw new Error('Failed to create room');

      const newRoom: Room = {
        id: roomId,
        name: newRoomName,
        password: newRoomPassword
      };

      setMyRooms((prev) => [...prev, newRoom]);
      setShowCreateModal(false);
      setNewRoomName('');
      setNewRoomPassword('');
      
      // Navigate to the new room
      router.push(`/chat/${newRoom.id}?name=${encodeURIComponent(newRoom.name)}`);
    } catch (error: any) {
      console.error('Error creating room:', error);
      alert(`Failed to create room: ${error.message}`);
    }
  };

  const handleJoinRoom = (roomId: string, roomName: string) => {
    router.push(`/chat/${roomId}?name=${encodeURIComponent(roomName)}`);
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
      if (!res.ok) throw new Error(data.error || 'Failed to send request');

      alert('Friend request sent!');
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
      alert('Failed to update friend status');
    }
  };

  if (!isProfileSet) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1e1e1e', color: '#f0f0f0', padding: '15px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <header style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px',
          paddingBottom: '15px', borderBottom: '1px solid #3e3e3e', flexWrap: 'wrap', gap: '10px'
        }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>Chat Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>Hello, <strong>{nickname}</strong></span>
            <button onClick={() => {
              localStorage.removeItem('chat_user');
              localStorage.removeItem('chat_nickname');
              setIsProfileSet(false);
              setNickname('');
              router.push('/login');
            }} style={{
              padding: '6px 12px', borderRadius: '4px', border: '1px solid #d9534f',
              backgroundColor: 'transparent', color: '#d9534f', cursor: 'pointer', fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)'
            }}>
              Logout
            </button>
          </div>
        </header>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #3e3e3e' }}>
          <button 
            onClick={() => setActiveTab('rooms')}
            style={{
              padding: '10px 20px', background: 'none', border: 'none', color: activeTab === 'rooms' ? '#007acc' : '#aaa',
              borderBottom: activeTab === 'rooms' ? '2px solid #007acc' : 'none', cursor: 'pointer', fontSize: '16px'
            }}
          >
            Rooms
          </button>
          <button 
            onClick={() => setActiveTab('friends')}
            style={{
              padding: '10px 20px', background: 'none', border: 'none', color: activeTab === 'friends' ? '#007acc' : '#aaa',
              borderBottom: activeTab === 'friends' ? '2px solid #007acc' : 'none', cursor: 'pointer', fontSize: '16px'
            }}
          >
            Friends
          </button>
        </div>

        {activeTab === 'rooms' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>My Rooms</h2>
              <button onClick={() => setShowCreateModal(true)} style={{
                padding: '10px 20px', borderRadius: '6px', border: 'none',
                backgroundColor: '#28a745', color: 'white', fontWeight: 'bold', cursor: 'pointer'
              }}>
                + Create Room
              </button>
            </div>

            {myRooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#aaa', backgroundColor: '#252526', borderRadius: '8px' }}>
                You haven't joined any rooms yet. Create one to get started!
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                {myRooms.map((room) => (
                  <div key={room.id} onClick={() => handleJoinRoom(room.id, room.name)} style={{
                    backgroundColor: '#252526', padding: '20px', borderRadius: '8px',
                    cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid #3e3e3e'
                  }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>{room.name}</h3>
                    <div style={{ fontSize: '12px', color: '#aaa' }}>ID: {room.id.slice(0, 8)}...</div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ marginBottom: '30px' }}>
              <h3>Add Friend</h3>
              <form onSubmit={handleSendFriendRequest} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={friendUsername}
                  onChange={(e) => setFriendUsername(e.target.value)}
                  style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #3e3e3e', backgroundColor: '#1e1e1e', color: 'white' }}
                />
                <button type="submit" style={{
                  padding: '10px 20px', borderRadius: '6px', border: 'none',
                  backgroundColor: '#007acc', color: 'white', cursor: 'pointer'
                }}>
                  Send Request
                </button>
              </form>
            </div>

            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <h3>Friends</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {friends.filter(f => f.status === 'accepted').map(friend => (
                    <div key={friend.id} style={{
                      padding: '15px', backgroundColor: '#252526', borderRadius: '8px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
                    }}>
                      <span style={{ fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>{friend.username}</span>
                      <button onClick={() => handleFriendAction(friend.id, 'delete')} style={{
                        padding: '5px 10px', borderRadius: '4px', border: 'none', backgroundColor: '#d9534f', color: 'white', cursor: 'pointer', fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)'
                      }}>Remove</button>
                    </div>
                  ))}
                  {friends.filter(f => f.status === 'accepted').length === 0 && (
                    <div style={{ color: '#aaa', fontStyle: 'italic', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>No friends yet</div>
                  )}
                </div>
              </div>

              <div>
                <h3>Requests</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {friends.filter(f => f.status === 'pending').map(friend => (
                    <div key={friend.id} style={{
                      padding: '15px', backgroundColor: '#252526', borderRadius: '8px',
                      display: 'flex', flexDirection: 'column', gap: '10px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{friend.username}</span>
                        <span style={{ fontSize: '12px', color: '#aaa' }}>{friend.isSender ? 'Sent' : 'Received'}</span>
                      </div>
                      {!friend.isSender && (
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => handleFriendAction(friend.id, 'accept')} style={{
                            flex: 1, padding: '5px', borderRadius: '4px', border: 'none', backgroundColor: '#28a745', color: 'white', cursor: 'pointer', fontSize: '12px'
                          }}>Accept</button>
                          <button onClick={() => handleFriendAction(friend.id, 'reject')} style={{
                            flex: 1, padding: '5px', borderRadius: '4px', border: 'none', backgroundColor: '#d9534f', color: 'white', cursor: 'pointer', fontSize: '12px'
                          }}>Reject</button>
                        </div>
                      )}
                      {friend.isSender && (
                         <button onClick={() => handleFriendAction(friend.id, 'delete')} style={{
                          width: '100%', padding: '5px', borderRadius: '4px', border: 'none', backgroundColor: '#6c757d', color: 'white', cursor: 'pointer', fontSize: '12px'
                        }}>Cancel</button>
                      )}
                    </div>
                  ))}
                  {friends.filter(f => f.status === 'pending').length === 0 && (
                    <div style={{ color: '#aaa', fontStyle: 'italic' }}>No pending requests</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Create Room Modal */}
        {showCreateModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <form onSubmit={handleCreateRoom} style={{
              backgroundColor: '#252526', padding: '30px', borderRadius: '12px',
              width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '15px'
            }}>
              <h2 style={{ margin: '0 0 10px 0' }}>Create New Room</h2>
              <input
                type="text"
                placeholder="Room Name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                required
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #3e3e3e', backgroundColor: '#1e1e1e', color: 'white' }}
              />
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Room Password"
                  value={newRoomPassword}
                  onChange={(e) => setNewRoomPassword(e.target.value)}
                  required
                  style={{ 
                    padding: '10px', 
                    paddingRight: '40px',
                    borderRadius: '6px', 
                    border: '1px solid #3e3e3e', 
                    backgroundColor: '#1e1e1e', 
                    color: 'white',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#aaa',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{
                  flex: 1, padding: '10px', borderRadius: '6px', border: 'none', backgroundColor: '#6c757d', color: 'white', cursor: 'pointer'
                }}>Cancel</button>
                <button type="submit" style={{
                  flex: 1, padding: '10px', borderRadius: '6px', border: 'none', backgroundColor: '#007acc', color: 'white', cursor: 'pointer'
                }}>Create</button>
              </div>
            </form>
          </div>
        )}
      </div>
      {/* QR Code Modal */}
      {showQRModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setShowQRModal(false)}>
          <div style={{
            backgroundColor: '#252526', padding: '30px', borderRadius: '12px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '90%'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: 0, color: '#f0f0f0' }}>Join {qrRoomName}</h3>
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
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
