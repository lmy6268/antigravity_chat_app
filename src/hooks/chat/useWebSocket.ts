'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { SOCKET_EVENTS } from '@/lib/constants';

/**
 * useWebSocket Hook (ViewModel)
 * 
 * 책임:
 * - WebSocket 연결 관리
 * - 소켓 이벤트 처리
 * - 연결 상태 제공
 * 
 * Android ViewModel과 유사하게 네트워크 상태 관리
 */
export function useWebSocket(roomId: string, nickname: string) {
  const socketRef = useRef<any>(null);
  const isConnectingRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);

  const connectSocket = useCallback(() => {
    if (socketRef.current || isConnectingRef.current) return; // 이미 연결되었거나 연결 중이면 무시

    isConnectingRef.current = true;

    // socket.io-client 동적 import
    import('socket.io-client').then(({ io }) => {
      // 이미 연결되었거나 cleanup된 경우 방어
      if (socketRef.current) {
        isConnectingRef.current = false;
        return;
      }

      const socket = io(window.location.origin, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        // forceNew: true // 필요 시 주석 해제
      });
      
      socketRef.current = socket;
      isConnectingRef.current = false;

      socket.on(SOCKET_EVENTS.CONNECT, () => {
        console.log('Connected to Socket.io');
        setIsConnected(true);
        socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId, username: nickname });
      });

      socket.on(SOCKET_EVENTS.DISCONNECT, () => {
        console.log('Socket disconnected');
        setIsConnected(false);
        isConnectingRef.current = false;
      });
    });
  }, [roomId, nickname]);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    isConnectingRef.current = false;
  }, []);

  const emitMessage = (event: string, payload: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, payload);
    }
  };

  const onMessage = (callback: (payload: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(SOCKET_EVENTS.MESSAGE, callback);
    }
  };

  const onRoomDeleted = (callback: () => void) => {
    if (socketRef.current) {
      socketRef.current.on(SOCKET_EVENTS.ROOM_DELETED, callback);
    }
  };

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  return {
    socketRef,
    isConnected,
    connectSocket,
    disconnectSocket,
    emitMessage,
    onMessage,
    onRoomDeleted,
  };
}
