'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Message {
  sender: string;
  text: string;
  isSystem?: boolean;
}

export default function ChatRoom({ params }: { params: Promise<{ roomId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Unwrap params
  const { roomId } = use(params);
  const roomName = searchParams.get('name') || 'Chat Room';

  // State
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [roomInfo, setRoomInfo] = useState<any>(null); // Room metadata from server
  
  // Crypto & WS
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const cryptoKeyRef = useRef<CryptoKey | null>(null);

  // Sync ref
  useEffect(() => {
    cryptoKeyRef.current = cryptoKey;
  }, [cryptoKey]);

  // Load nickname & check for cached password
  // Load nickname
  useEffect(() => {
    const storedUser = localStorage.getItem('chat_user');
    if (!storedUser) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(`/chat/${roomId}?name=${encodeURIComponent(roomName)}`);
      router.push(`/login?redirect=${returnUrl}`);
      return;
    }
    const user = JSON.parse(storedUser);
    setNickname(user.username);
  }, [roomId, roomName, router]);

  // Auto-join for creator OR existing participant when roomInfo is loaded
  useEffect(() => {
    if (roomInfo && nickname && !isJoined) {
      const isCreator = roomInfo.creator === nickname;
      const isParticipant = roomInfo.participants && roomInfo.participants.includes(nickname);

      if (isCreator || isParticipant) {
        // Auto-join using the password from roomInfo
        setPassword(roomInfo.password);
        handleJoin(roomInfo.password, nickname);
      }
    }
  }, [roomInfo, nickname, isJoined]);

  // Fetch room info from server
  useEffect(() => {
    const fetchRoomInfo = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        if (res.ok) {
          const data = await res.json();
          setRoomInfo(data.room);
        }
      } catch (error) {
        console.error('Error fetching room info:', error);
      }
    };
    fetchRoomInfo();
  }, [roomId]);

  // Auto-scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleJoin = async (pwd: string, nick: string) => {
    if (!pwd || !nick) return;

    try {
      const key = await deriveKey(pwd);
      setCryptoKey(key);
      setIsJoined(true);
      connectSocket(nick);
    } catch (error) {
      console.error('Error deriving key:', error);
      alert('Failed to setup encryption.');
    }
  };

  const connectSocket = (nick: string) => {
    // Clean up existing connection first
    if (wsRef.current) {
      (wsRef.current as any).off('message');
      (wsRef.current as any).disconnect();
      wsRef.current = null;
    }

    // Dynamically import socket.io-client
    import('socket.io-client').then(({ io }) => {
      const socket = io('http://localhost:3000');
      wsRef.current = socket as any;

      socket.on('connect', () => {
        console.log('Connected to Socket.io');
        // Join room with username
        socket.emit('join', { roomId, username: nick });
        addSystemMessage(`Welcome to ${roomName}, ${nick}!`);
      });

      socket.on('message', (payload) => {
        handleIncomingMessage(payload);
      });

      socket.on('roomDeleted', () => {
        alert('The room has been deleted by the creator.');
        if (wsRef.current) {
          (wsRef.current as any).disconnect();
          wsRef.current = null;
        }
        router.push('/');
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    });
  };

  const handleIncomingMessage = async (payload: any) => {
    if (!cryptoKeyRef.current) return;

    try {
      // Socket.io sends the payload object directly (not stringified)
      if (payload.iv && payload.data) {
        const decryptedString = await decryptMessage(payload.iv, payload.data, cryptoKeyRef.current);
        const messageData = JSON.parse(decryptedString); // { text, senderNickname }
        
        setMessages((prev) => [...prev, { 
          sender: messageData.senderNickname, 
          text: messageData.text,
          isSystem: false
        }]);
      }
    } catch (e) {
      console.warn('Failed to decrypt:', e);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !cryptoKey || !wsRef.current) return;

    const messagePayload = JSON.stringify({
      text: inputMessage,
      senderNickname: nickname
    });

    try {
      const encryptedData = await encryptMessage(messagePayload, cryptoKey);
      
      // Socket.io emit - server will broadcast to all clients including sender
      (wsRef.current as any).emit('message', {
        roomId,
        payload: encryptedData
      });
      
      // Clear input (message will appear when server broadcasts it back)
      setInputMessage('');
    } catch (e) {
      console.error('Encryption failed:', e);
      addSystemMessage('Failed to send message.');
    }
  };

  const addSystemMessage = (text: string) => {
    setMessages((prev) => [...prev, { sender: 'System', text, isSystem: true }]);
  };

  const copyInviteLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Invite link copied to clipboard!');
  };

  const handleLeaveRoom = async () => {
    if (roomInfo && roomInfo.creator === nickname) {
      if (confirm('You are the creator. Leaving will DELETE this room for everyone. Are you sure?')) {
        try {
          // Delete room via API
          await fetch(`/api/rooms/${roomId}`, { method: 'DELETE' });
          
          // Notify others via socket
          if (wsRef.current) {
            (wsRef.current as any).emit('roomDeleted', roomId);
            (wsRef.current as any).disconnect();
            wsRef.current = null;
          }
          router.push('/');
        } catch (e) {
          console.error('Failed to delete room:', e);
          alert('Failed to delete room.');
        }
      }
    } else {
      // Normal leave
      if (wsRef.current) {
        (wsRef.current as any).disconnect();
        wsRef.current = null;
      }
      router.push('/');
    }
  };

  // --- Web Crypto API Helpers ---
  async function deriveKey(password: string) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    const salt = enc.encode("websocket-demo-salt"); 
    return window.crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async function encryptMessage(text: string, key: CryptoKey) {
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      enc.encode(text)
    );
    return {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    };
  }

  async function decryptMessage(ivArr: number[], dataArr: number[], key: CryptoKey) {
    const iv = new Uint8Array(ivArr);
    const data = new Uint8Array(dataArr);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      data
    );
    const dec = new TextDecoder();
    return dec.decode(decrypted);
  }

  // --- Render ---

  if (!isJoined) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', backgroundColor: '#1e1e1e', color: '#f0f0f0'
      }}>
        <div style={{
          backgroundColor: '#252526', padding: '40px', borderRadius: '12px',
          display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '400px'
        }}>
          <h2 style={{ margin: '0 0 10px 0', textAlign: 'center' }}>Join {roomName}</h2>
          <p style={{ textAlign: 'center', color: '#aaa' }}>Enter password to decrypt messages.</p>
          
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Room Password"
            style={{
              padding: '12px', borderRadius: '6px', border: '1px solid #3e3e3e',
              backgroundColor: '#1e1e1e', color: 'white', fontSize: '16px'
            }}
          />
          
          <button onClick={() => handleJoin(password, nickname)} style={{
            padding: '14px', borderRadius: '6px', border: 'none',
            backgroundColor: '#007acc', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer'
          }}>
            Join Room
          </button>
          
          <button onClick={() => router.push('/')} style={{
            padding: '10px', borderRadius: '6px', border: 'none',
            backgroundColor: 'transparent', color: '#aaa', cursor: 'pointer'
          }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      backgroundColor: '#1e1e1e', color: '#f0f0f0'
    }}>
      {/* Header */}
      <div style={{
        padding: '15px 20px', backgroundColor: '#252526', borderBottom: '1px solid #3e3e3e',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => router.push('/')} style={{
            background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '20px'
          }}>←</button>
          <h2 style={{ margin: 0 }}>{roomName}</h2>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ color: '#aaa', fontSize: '14px' }}>{nickname}</span>
          <button onClick={async () => {
            setShowSettings(!showSettings);
            // Refresh room info when opening settings
            if (!showSettings) {
              try {
                const res = await fetch(`/api/rooms/${roomId}`);
                if (res.ok) {
                  const data = await res.json();
                  setRoomInfo(data.room);
                }
              } catch (error) {
                console.error('Error refreshing room info:', error);
              }
            }
          }} style={{
            background: 'none', border: 'none', color: '#f0f0f0', cursor: 'pointer', fontSize: '20px'
          }}>⚙️</button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{
          position: 'absolute', top: '60px', right: '20px',
          backgroundColor: '#333', padding: '20px', borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', flexDirection: 'column', gap: '15px', width: '280px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #555', paddingBottom: '10px' }}>Room Settings</h3>
          
          {/* Room Info */}
          {roomInfo && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <div>
                <strong style={{ color: '#aaa' }}>Creator:</strong>
                <div style={{ marginTop: '4px' }}>{roomInfo.creator}</div>
              </div>
              <div>
                <strong style={{ color: '#aaa' }}>Password:</strong>
                <div style={{ marginTop: '4px', fontFamily: 'monospace', backgroundColor: '#252526', padding: '6px', borderRadius: '4px' }}>
                  {roomInfo.password}
                </div>
              </div>
              <div>
                <strong style={{ color: '#aaa' }}>Active Participants:</strong>
                <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {roomInfo.participants && roomInfo.participants.length > 0 ? (
                    roomInfo.participants.map((participant: string, idx: number) => (
                      <div key={idx} style={{ padding: '4px 8px', backgroundColor: '#252526', borderRadius: '4px' }}>
                        {participant}
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#888', fontStyle: 'italic' }}>No active participants</div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <button onClick={copyInviteLink} style={{
            padding: '8px', borderRadius: '4px', border: 'none', backgroundColor: '#007acc', color: 'white', cursor: 'pointer'
          }}>
            Copy Room Link
          </button>
          <button onClick={() => {
            // Disconnect socket when explicitly leaving room
            if (wsRef.current) {
              (wsRef.current as any).disconnect();
              wsRef.current = null;
            }
            router.push('/');
          }} style={{
            padding: '8px', borderRadius: '4px', border: 'none', backgroundColor: '#d9534f', color: 'white', cursor: 'pointer'
          }}>
            Leave Room
          </button>
        </div>
      )}

      {/* Chat Area */}
      <div ref={chatContainerRef} style={{
        flex: 1, overflowY: 'auto', padding: '20px',
        display: 'flex', flexDirection: 'column', gap: '12px'
      }}>
        {messages.map((msg, index) => {
          const isMe = msg.sender === nickname;
          const isSystem = msg.isSystem;

          if (isSystem) {
            return (
              <div key={index} style={{ alignSelf: 'center', backgroundColor: '#333', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', color: '#aaa' }}>
                {msg.text}
              </div>
            );
          }

          return (
            <div key={index} style={{
              alignSelf: isMe ? 'flex-end' : 'flex-start',
              maxWidth: '70%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: isMe ? 'flex-end' : 'flex-start'
            }}>
              <span style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px', marginLeft: '4px' }}>
                {msg.sender}
                {roomInfo && msg.sender === roomInfo.creator && (
                  <span style={{ color: '#ffd700', marginLeft: '6px', fontWeight: 'bold' }}>(Creator)</span>
                )}
              </span>
              <div style={{
                backgroundColor: isMe ? '#007acc' : '#2d2d2d',
                padding: '10px 15px',
                borderRadius: '12px',
                borderTopRightRadius: isMe ? '2px' : '12px',
                borderTopLeftRadius: isMe ? '12px' : '2px',
                color: 'white',
                wordBreak: 'break-word'
              }}>
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} style={{
        padding: '20px', backgroundColor: '#252526', display: 'flex', gap: '10px'
      }}>
        <input
          type="text"
          placeholder="Type a message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          style={{
            flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #3e3e3e',
            backgroundColor: '#1e1e1e', color: 'white', fontSize: '16px'
          }}
        />
        <button type="submit" style={{
          padding: '12px 24px', borderRadius: '6px', border: 'none',
          backgroundColor: '#007acc', color: 'white', fontWeight: 'bold', cursor: 'pointer'
        }}>
          Send
        </button>
      </form>
    </div>
  );
}
