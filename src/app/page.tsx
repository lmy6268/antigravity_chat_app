'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Room {
  id: string;
  name: string;
  password?: string; // Storing locally for convenience, in real app be careful
}

export default function Dashboard() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [isProfileSet, setIsProfileSet] = useState(false);
  
  // Rooms State
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  
  // Create Room State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');

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

    // Fetch user's rooms from server instead of localStorage
    const fetchRooms = async () => {
      try {
        const res = await fetch(`/api/users/${user.username}/rooms`);
        if (res.ok) {
          const data = await res.json();
          setMyRooms(data.rooms || []);
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    };
    fetchRooms();
  }, [router]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName || !newRoomPassword) return;

    const roomId = crypto.randomUUID();
    
    try {
      // Call API to create room on server
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: roomId,
          name: newRoomName,
          password: newRoomPassword,
          creator: nickname
        })
      });

      if (!res.ok) {
        throw new Error('Failed to create room');
      }

      const newRoom: Room = {
        id: roomId,
        name: newRoomName,
        password: newRoomPassword
      };

      // Update local state (no localStorage needed - server tracks activeRooms)
      setMyRooms((prev) => [...prev, newRoom]);
      
      setShowCreateModal(false);
      setNewRoomName('');
      setNewRoomPassword('');
      
      // Navigate to the new room
      router.push(`/chat/${newRoom.id}?name=${encodeURIComponent(newRoom.name)}`);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room. Please try again.');
    }
  };

  const handleJoinRoom = (roomId: string, roomName: string) => {
    router.push(`/chat/${roomId}?name=${encodeURIComponent(roomName)}`);
  };

  if (!isProfileSet) {
    return null; // Or a loading spinner
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#1e1e1e', color: '#f0f0f0', padding: '20px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <header style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px',
          paddingBottom: '20px', borderBottom: '1px solid #3e3e3e'
        }}>
          <h1 style={{ margin: 0 }}>Chat Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span>Hello, <strong>{nickname}</strong></span>
            <button onClick={() => {
              // Only clear session data (chat_user for login session)
              localStorage.removeItem('chat_user');
              localStorage.removeItem('chat_nickname'); // Legacy cleanup
              setIsProfileSet(false);
              setNickname('');
              router.push('/login');
            }} style={{
              padding: '6px 12px', borderRadius: '4px', border: '1px solid #d9534f',
              backgroundColor: 'transparent', color: '#d9534f', cursor: 'pointer'
            }}>
              Logout
            </button>
          </div>
        </header>

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
              <input
                type="password"
                placeholder="Room Password"
                value={newRoomPassword}
                onChange={(e) => setNewRoomPassword(e.target.value)}
                required
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #3e3e3e', backgroundColor: '#1e1e1e', color: 'white' }}
              />
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
    </div>
  );
}
