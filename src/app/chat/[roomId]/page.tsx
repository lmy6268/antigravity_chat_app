'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRoomJoin } from '@/hooks/chat/useRoomJoin';
import { useWebSocket } from '@/hooks/chat/useWebSocket';
import { dialogService } from '@/lib/dialog';
import { useChat } from '@/hooks/chat/useChat';
import { RoomJoinForm } from '@/components/chat/RoomJoinForm';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatSettings } from '@/components/chat/ChatSettings';
import { ChatMessageList } from '@/components/chat/ChatMessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { useTranslation } from '@/i18n/LanguageContext';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@/types/events';

/**
 * ChatRoom Component (Orchestrator)
 *
 * Responsibilities:
 * - Orchestrate hooks and child components
 * - Handle component composition
 * - Minimal business logic (event handlers only)
 */
export default function ChatRoom({ params }: { params: Promise<{ roomId: string }> }) {
  // use()는 다른 hooks 전에 호출해야 함 (Rules of Hooks)
  const { roomId } = use(params);

  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const roomName = searchParams.get('name') || '';

  // Hooks - 모든 hooks를 조건문 전에 호출 (Rules of Hooks)
  const {
    nickname,
    password,
    setPassword,
    showPassword,
    togglePasswordVisibility,
    isJoined,
    isLoading,
    roomInfo,
    cryptoKey,
    joinRoom,
    quitRoom,
    goBack,
    error,
  } = useRoomJoin(roomId, roomName);

  const { socketRef, isConnected, connectSocket, disconnectSocket } = useWebSocket(
    roomId,
    nickname
  );

  const { messages, inputMessage, setInputMessage, chatContainerRef, sendMessage, initializeChat } =
    useChat(roomId, roomName, nickname, cryptoKey, socketRef, isConnected, t);

  // Local state
  const [showSettings, setShowSettings] = useState(false);
  const hasInitializedRef = useRef(false);

  // Connect socket when joined AND cryptoKey is ready (한 번만 실행)
  useEffect(() => {
    if (isJoined && nickname && cryptoKey && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      connectSocket();
      initializeChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isJoined, nickname, cryptoKey]);

  // Handle room deletion (socketRef 변경 시에만 재설정)
  useEffect(() => {
    if (!socketRef.current) return;

    const handleRoomDeleted = () => {
      alert(t.dashboard.alerts.roomDeleted);
      disconnectSocket();
      quitRoom(); // 방이 삭제되었으므로 나가기 처리 (API 호출은 불필요할 수 있으나 클린업 차원)
    };

    socketRef.current.on(SERVER_EVENTS.ROOM_DELETED, handleRoomDeleted);

    return () => {
      if (socketRef.current) {
        socketRef.current.off(SERVER_EVENTS.ROOM_DELETED, handleRoomDeleted);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketRef.current]);

  // Event handlers
  const handleBack = () => {
    disconnectSocket();
    goBack();
  };

  // ...

  const handleLeave = async () => {
    console.log('[ChatRoom] handleLeave called');
    // Check if creator
    const isCreator = roomInfo?.creator === nickname;

    if (isCreator) {
      if (!dialogService.confirm(t.dashboard.alerts.confirmDeleteRoom)) {
        console.log('[ChatRoom] Delete cancelled');
        return;
      }
      console.log('[ChatRoom] Delete confirmed, emitting event');
      // Emit delete-room event to notify others
      if (socketRef.current) {
        socketRef.current.emit(CLIENT_EVENTS.DELETE_ROOM, roomId);
      }
    }

    console.log('[ChatRoom] Disconnecting and quitting');
    disconnectSocket();
    await quitRoom();
  };

  const copyInviteLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    dialogService.alert(t.dashboard.alerts.linkCopied);
  };

  // 로딩 중일 때 (권한 체크 중)
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#1e1e1e',
          color: '#f0f0f0',
        }}
      >
        {t.common.loading}
      </div>
    );
  }

  // 권한이 없어서 비밀번호 입력이 필요한 경우
  if (!isJoined) {
    return (
      <RoomJoinForm
        roomName={roomInfo?.name || roomName}
        password={password}
        setPassword={setPassword}
        showPassword={showPassword}
        togglePasswordVisibility={togglePasswordVisibility}
        onJoin={joinRoom}
        onBack={goBack}
        error={error}
      />
    );
  }

  // Render chat room
  return (
    <ChatContainer>
      <ChatHeader
        roomName={roomInfo?.name || roomName}
        nickname={nickname}
        isConnected={isConnected}
        onBack={handleBack}
        onSettings={() => setShowSettings(!showSettings)}
      />

      {showSettings && (
        <ChatSettings roomInfo={roomInfo} onCopyLink={copyInviteLink} onLeave={handleLeave} />
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
    </ChatContainer>
  );
}
