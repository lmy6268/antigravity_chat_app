'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { CLIENT_EVENTS, SERVER_EVENTS, SOCKET_LIFECYCLE } from '@/types/events';

interface ErrorPayload {
  message?: string;
  [key: string]: any;
}

/**
 * useWebSocket Hook (ViewModel)
 *
 * 책임:
 * - 소켓 연결/해제 관리
 * - 소켓 이벤트 리스너 등록/해제
 * - 연결 상태 관리
 */
export function useWebSocket(roomId: string, username: string) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const isConnectingRef = useRef(false);

  const connectSocket = useCallback(() => {
    if (isConnectingRef.current || socketRef.current?.connected) {
      return;
    }

    if (!roomId || !username) return;

    isConnectingRef.current = true;

    const socket = io({
      path: '/api/socket',
      addTrailingSlash: false,
    });

    socketRef.current = socket;

    socket.on(SOCKET_LIFECYCLE.CONNECT, () => {
      setIsConnected(true);
      isConnectingRef.current = false;

      // Join room
      socket.emit(CLIENT_EVENTS.JOIN_ROOM, { roomId, username });
    });

    socket.on(SOCKET_LIFECYCLE.DISCONNECT, () => {
      setIsConnected(false);
      isConnectingRef.current = false;
    });

    socket.on(SERVER_EVENTS.ERROR, (error: ErrorPayload) => {
      console.error('Socket error:', error);
      isConnectingRef.current = false;
    });
  }, [roomId, username]);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      isConnectingRef.current = false;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, [disconnectSocket]);

  return {
    socketRef,
    isConnected,
    connectSocket,
    disconnectSocket,
  };
}
