'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { deriveKey, encryptMessage, decryptMessage } from '../../../../lib/crypto';
import { SOCKET_EVENTS } from '../../../../lib/constants';

interface Message {
  sender: string;
  text: string;
  isSystem?: boolean;
  isEncrypted?: boolean;
  iv?: number[];
  content?: string; // For decrypted content
}

export default function ChatRoom({ params }: { params: Promise<{ roomId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // params 언래핑
  const { roomId } = use(params);
  const roomName = searchParams.get('name') || 'Chat Room';

  // 상태 관리
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [roomInfo, setRoomInfo] = useState<any>(null); // 서버로부터 받은 방 메타데이터
  const [isConnected, setIsConnected] = useState(false);
  
  // 암호화 및 웹소켓
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const cryptoKeyRef = useRef<CryptoKey | null>(null);

  // ref 동기화
  useEffect(() => {
    cryptoKeyRef.current = cryptoKey;
  }, [cryptoKey]);

  // 닉네임 로드
  useEffect(() => {
    const storedUser = localStorage.getItem('chat_user');
    if (!storedUser) {
      // 로그인으로 리다이렉트 (리턴 URL 포함)
      const returnUrl = encodeURIComponent(`/chat/${roomId}?name=${encodeURIComponent(roomName)}`);
      router.push(`/login?redirect=${returnUrl}`);
      return;
    }
    const user = JSON.parse(storedUser);
    setNickname(user.username);
  }, [roomId, roomName, router]);

  // 서버에서 방 정보 가져오기
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

  // 자동 스크롤
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const connectSocket = (nick: string) => {
    // 기존 연결이 있으면 먼저 정리
    if (wsRef.current) {
      (wsRef.current as any).off(SOCKET_EVENTS.MESSAGE);
      (wsRef.current as any).off(SOCKET_EVENTS.ROOM_DELETED);
      (wsRef.current as any).off(SOCKET_EVENTS.DISCONNECT);
      (wsRef.current as any).disconnect();
      wsRef.current = null;
    }

    // socket.io-client 동적 import
    import('socket.io-client').then(({ io }) => {
      // 현재 origin을 사용하여 Socket.io 연결 (dev 및 production 모두 지원)
      const socket = io(window.location.origin, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });
      wsRef.current = socket as any;

      socket.on(SOCKET_EVENTS.CONNECTION, () => {
        console.log('Connected to Socket.io');
        setIsConnected(true);
        // 사용자명으로 방에 참가
        socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId, username: nick });
        addSystemMessage(`Welcome to ${roomName}, ${nick}!`);
      });

      socket.on(SOCKET_EVENTS.MESSAGE, async (payload) => {
        if (!cryptoKeyRef.current) return;

        try {
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
      });

      socket.on(SOCKET_EVENTS.ROOM_DELETED, () => {
        alert('The room has been deleted by the creator.');
        if (wsRef.current) {
          (wsRef.current as any).disconnect();
          wsRef.current = null;
        }
        router.push('/');
      });

      socket.on(SOCKET_EVENTS.DISCONNECT, () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });
    });
  };

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

  // roomInfo가 로드되면 방장 또는 기존 참가자 자동 참가
  useEffect(() => {
    if (roomInfo && nickname && !isJoined) {
      const isCreator = roomInfo.creator === nickname;
      const isParticipant = roomInfo.participants && roomInfo.participants.includes(nickname);

      if (isCreator || isParticipant) {
        // roomInfo의 비밀번호를 사용하여 자동 참가
        setPassword(roomInfo.password);
        handleJoin(roomInfo.password, nickname);
      }
    }
  }, [roomInfo, nickname, isJoined]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !cryptoKey || !wsRef.current) return;

    const messagePayload = JSON.stringify({
      text: inputMessage,
      senderNickname: nickname
    });

    try {
      const encrypted = await encryptMessage(messagePayload, cryptoKey);

      // 본인의 UI에 메시지 즉시 추가
      setMessages((prev) => [...prev, { 
        sender: nickname, 
        text: inputMessage,
        isSystem: false
      }]);

      // Socket.io emit - 서버가 다른 클라이언트들에게만 브로드캠스트
      (wsRef.current as any).emit(SOCKET_EVENTS.MESSAGE, {
        roomId,
        payload: encrypted
      });
      
      // 입력 필드 초기화
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
          // API를 통해 방 삭제
          await fetch(`/api/rooms/${roomId}`, { method: 'DELETE' });
          
          // 소켓으로 다른 사람들에게 알림
          if (wsRef.current) {
            (wsRef.current as any).emit(SOCKET_EVENTS.ROOM_DELETED, roomId);
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
      // 일반 나가기
      if (wsRef.current) {
        (wsRef.current as any).disconnect();
        wsRef.current = null;
      }
      router.push('/');
    }
  };

  // --- Web Crypto API 헬퍼 함수들 ---
  // deriveKey, encryptMessage, decryptMessage 함수는 lib/crypto.ts로 이동했으므로 여기서는 제거합니다.

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
          
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Room Password"
              style={{
                padding: '12px',
                paddingRight: '40px', // Space for the eye icon
                borderRadius: '6px',
                border: '1px solid #3e3e3e',
                backgroundColor: '#1e1e1e',
                color: 'white',
                fontSize: '16px',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
            <button
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
