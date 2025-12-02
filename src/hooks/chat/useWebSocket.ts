'use client';

import { useEffect, useRef, useState } from 'react';
import { SOCKET_EVENTS } from '@/lib/constants';

/**
 * useWebSocket Hook (ViewModel)
 * 
 * Responsibilities:
 * - Manage WebSocket connection
 * - Handle socket events
 * - Provide connection status
 * 
 * Similar to Android ViewModel managing network state
 */
export function useWebSocket(roomId: string, nickname: string) {
  const socketRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connectSocket = () => {
    // Dynamic import socket.io-client
    import('socket.io-client').then(({ io }) => {
      const socket = io(window.location.origin, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });
      
      socketRef.current = socket;

      socket.on(SOCKET_EVENTS.CONNECTION, () => {
        console.log('Connected to Socket.io');
        setIsConnected(true);
        socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId, username: nickname });
      });

      socket.on(SOCKET_EVENTS.DISCONNECT, () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });
    });
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  };

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

  // Cleanup on unmount
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
