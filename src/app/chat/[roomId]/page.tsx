'use client';

import { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRoomJoin } from '@/hooks/chat/useRoomJoin';
import { useWebSocket } from '@/hooks/chat/useWebSocket';
import { useChat } from '@/hooks/chat/useChat';
import { RoomJoinForm } from '@/components/chat/RoomJoinForm';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatSettings } from '@/components/chat/ChatSettings';
import { ChatMessageList } from '@/components/chat/ChatMessageList';
import { ChatInput } from '@/components/chat/ChatInput';

import { useTranslation } from '@/i18n/LanguageContext';

/**
 * ChatRoom Component (Orchestrator)
 * 
 * Responsibilities:
 * - Orchestrate hooks and child components
 * - Handle component composition
 * - Minimal business logic (event handlers only)
 */
export default function ChatRoom({ params }: { params: Promise<{ roomId: string }> }) {
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const { roomId } = use(params);
  const roomName = searchParams.get('name') || 'Chat Room';

  // Hooks
  const {
    nickname,
    password,
    setPassword,
    showPassword,
    togglePasswordVisibility,
    isJoined,
    roomInfo,
    cryptoKey,
    joinRoom,
    leaveRoom,
    error
  } = useRoomJoin(roomId, roomName);

  const {
    socketRef,
    isConnected,
    connectSocket,
    disconnectSocket,
    onRoomDeleted,
  } = useWebSocket(roomId, nickname);

  const {
    messages,
    inputMessage,
    setInputMessage,
    chatContainerRef,
    sendMessage,
    initializeChat,
  } = useChat(roomId, roomName, nickname, cryptoKey, socketRef, isConnected);

  // Local state
  const [showSettings, setShowSettings] = useState(false);

  // Auto-join for creator/participant
  useEffect(() => {
    if (roomInfo && nickname && !isJoined) {
      const isCreator = roomInfo.creator === nickname;
      const isParticipant = roomInfo.participants && roomInfo.participants.includes(nickname);

      if (isCreator || isParticipant) {
        setPassword(roomInfo.password);
        joinRoom(new Event('submit') as any);
      }
    }
  }, [roomInfo, nickname, isJoined, setPassword, joinRoom]);

  // Connect socket when joined
  useEffect(() => {
    if (isJoined && nickname) {
      connectSocket();
      initializeChat();
    }
  }, [isJoined, nickname, connectSocket, initializeChat]);

  // Handle room deletion
  useEffect(() => {
    onRoomDeleted(() => {
      alert(t.dashboard.alerts.roomDeleted);
      disconnectSocket();
      leaveRoom();
    });
  }, [onRoomDeleted, disconnectSocket, leaveRoom]);

  // Event handlers
  const handleBack = () => {
    disconnectSocket();
    leaveRoom();
  };

  const handleLeave = () => {
    disconnectSocket();
    leaveRoom();
  };

  const copyInviteLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert(t.dashboard.alerts.linkCopied);
  };

  // Render join form if not joined
  if (!isJoined) {
    return (
      <RoomJoinForm
        roomName={roomName}
        password={password}
        setPassword={setPassword}
        showPassword={showPassword}
        togglePasswordVisibility={togglePasswordVisibility}
        onJoin={joinRoom}
        onBack={leaveRoom}
        error={error}
      />
    );
  }

  // Render chat room
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#1e1e1e',
      color: '#f0f0f0'
    }}>
      <ChatHeader
        roomName={roomName}
        nickname={nickname}
        isConnected={isConnected}
        onBack={handleBack}
        onSettings={() => setShowSettings(!showSettings)}
      />

      {showSettings && (
        <ChatSettings
          roomInfo={roomInfo}
          onCopyLink={copyInviteLink}
          onLeave={handleLeave}
        />
      )}

      <ChatMessageList
        messages={messages}
        nickname={nickname}
        roomCreator={roomInfo?.creator}
        containerRef={chatContainerRef}
      />

      <ChatInput
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        sendMessage={sendMessage}
        isConnected={isConnected}
      />
    </div>
  );
}
