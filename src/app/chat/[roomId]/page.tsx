'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRoomJoin } from '@/hooks/chat/useRoomJoin';
import { useWebSocket } from '@/hooks/chat/useWebSocket';
import { dialogService } from '@/lib/dialog';
import { useChat } from '@/hooks/chat/useChat';
import { useTranslation } from '@/i18n/LanguageContext';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@/types/events';
import { RoomJoinForm } from '@/components/chat/RoomJoinForm';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatSettings } from '@/components/chat/ChatSettings';
import { ChatMessageList } from '@/components/chat/ChatMessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatShareModal } from '@/components/chat/ChatShareModal';
import { buildFullUrl } from '@/lib/utils/url';
import { routes } from '@/lib/routes';

/**
 * Global animations for chat page transitions
 */
const ChatTransitions = () => (
  <style jsx global>{`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `}</style>
);

/**
 * ChatRoom Component (Orchestrator)
 *
 * Responsibilities:
 * - Orchestrate hooks and child components
 * - Handle component composition
 * - Minimal business logic (event handlers only)
 */
export default function ChatRoom({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
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

  const { socketRef, isConnected, connectSocket, disconnectSocket } =
    useWebSocket(roomId, nickname);

  const {
    messages,
    inputMessage,
    setInputMessage,
    chatContainerRef,
    sendMessage,
    initializeChat,
  } = useChat(
    roomId,
    roomInfo?.name || roomName,
    nickname,
    cryptoKey,
    socketRef,
    isConnected,
    t,
  );

  // Local state
  const [showSettings, setShowSettings] = useState(false);
  const [settingsClosing, setSettingsClosing] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [slideState, setSlideState] = useState<
    'entering' | 'entered' | 'exiting'
  >('entering');
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
    const socket = socketRef.current;
    if (!isConnected || !socket) return;

    const handleRoomDeleted = () => {
      dialogService.alert(t.dashboard.alerts.roomDeleted);
      disconnectSocket();
      quitRoom(); // 방이 삭제되었으므로 나가기 처리
    };

    socket.on(SERVER_EVENTS.ROOM_DELETED, handleRoomDeleted);

    return () => {
      if (socket) {
        socket.off(SERVER_EVENTS.ROOM_DELETED, handleRoomDeleted);
      }
    };
  }, [isConnected, disconnectSocket, quitRoom, t, socketRef]);

  // Event handlers
  const handleBack = () => {
    setSlideState('exiting');
    setTimeout(() => {
      disconnectSocket();
      goBack();
    }, 220);
  };

  // ...

  const handleLeave = async () => {
    // Check if creator
    const isCreator = roomInfo?.creator === nickname;

    if (isCreator) {
      if (!dialogService.confirm(t.dashboard.alerts.confirmDeleteRoom)) {
        return;
      }
      // Emit delete-room event to notify others
      if (socketRef.current) {
        socketRef.current.emit(CLIENT_EVENTS.DELETE_ROOM, roomId);
      }
    }

    disconnectSocket();
    await quitRoom();
  };

  const buildInviteLink = async () => {
    return buildFullUrl(routes.chat.room(roomId));
  };

  const copyInviteLink = async () => {
    const link = await buildInviteLink();
    navigator.clipboard.writeText(link);
    dialogService.alert(t.dashboard.alerts.linkCopied);
  };

  const openSettings = () => {
    setSettingsClosing(false);
    setShowSettings(true);
  };

  const closeSettings = () => {
    setSettingsClosing(true);
    setTimeout(() => {
      setShowSettings(false);
      setSettingsClosing(false);
    }, 220);
  };

  useEffect(() => {
    // Trigger enter slide-in
    requestAnimationFrame(() => setSlideState('entered'));
  }, []);

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
          width: '100%',
        }}
      >
        <LoadingSpinner size={40} color="#0070f3" />
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
  const slideTransform =
    slideState === 'entering'
      ? 'translateX(-100%)'
      : slideState === 'entered'
        ? 'translateX(0)'
        : 'translateX(100%)';

  return (
    <div
      style={{
        transform: slideTransform,
        transition: 'transform 220ms ease',
        willChange: 'transform',
      }}
    >
      <ChatContainer>
        <ChatHeader
          roomName={roomInfo?.name || roomName}
          onBack={handleBack}
          onSettings={openSettings}
          onShare={() => setShowShare(true)}
        />

        {showSettings && (
          <div
            onClick={closeSettings}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.35)',
              zIndex: 110,
              opacity: settingsClosing ? 0 : 1,
              transition: 'opacity 200ms ease',
              pointerEvents: settingsClosing ? 'none' : 'auto',
            }}
          />
        )}

        {showSettings && (
          <ChatSettings
            roomInfo={roomInfo}
            onCopyLink={copyInviteLink}
            onLeave={handleLeave}
            onClose={closeSettings}
            currentUser={nickname}
            isConnected={isConnected}
            isClosing={settingsClosing}
          />
        )}

        {showShare && (
          <ChatShareModal
            onClose={() => setShowShare(false)}
            buildLink={buildInviteLink}
            password={roomInfo?.password}
          />
        )}

        <ChatTransitions />

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
    </div>
  );
}
