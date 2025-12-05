'use client';

import { useState, useEffect, useRef } from 'react';
import { encryptMessage, decryptMessage } from '@/lib/crypto';
import { CLIENT_EVENTS, SERVER_EVENTS } from '@/types/events';
import { withParams } from '@/i18n/LanguageContext';
import type { en } from '@/i18n/locales/en';
import type { MessageUIModel } from '@/types/uimodel';

type DeepReadonly<T> = T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

/**
 * useChat Hook (ViewModel)
 * 
 * 책임:
 * - 채팅 메시지 상태 관리
 * - 메시지 암호화/복호화 처리
 * - 메시지 송수신
 * - 자동 스크롤 하단 이동
 * 
 * Android ViewModel과 유사하게 채팅 데이터 관리
 */

export function useChat(
  roomId: string,
  roomName: string,
  nickname: string,
  cryptoKey: CryptoKey | null,
  socketRef: React.MutableRefObject<any>,
  isConnected: boolean,
  t: DeepReadonly<typeof en>
) {
  const [messages, setMessages] = useState<MessageUIModel[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const cryptoKeyRef = useRef<CryptoKey | null>(null);

  // cryptoKey ref 동기화
  useEffect(() => {
    cryptoKeyRef.current = cryptoKey;
    console.log('[useChat] cryptoKey updated:', !!cryptoKey);
  }, [cryptoKey]);

  // cryptoKey 준비되면 히스토리 요청
  useEffect(() => {
    console.log('[useChat] History request check:', { 
      hasCryptoKey: !!cryptoKey, 
      hasSocket: !!socketRef.current, 
      isConnected 
    });
    
    if (cryptoKey && socketRef.current && isConnected) {
      console.log('[useChat] ✅ Requesting history...');
      // roomId를 함께 보내서 서버에서 socket.roomId가 아직 설정되지 않았더라도 처리 가능하게 함
      socketRef.current.emit(CLIENT_EVENTS.REQUEST_HISTORY, roomId);
    } else {
      console.log('[useChat] ❌ Cannot request history yet');
    }
  }, [cryptoKey, socketRef, isConnected, roomId]);

  // 메시지 변경 시 자동으로 하단 스크롤
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // 시스템 메시지 추가
  const addSystemMessage = (text: string) => {
    setMessages((prev) => [...prev, { 
      id: `sys-${Date.now()}-${Math.random()}`,
      sender: 'System', 
      text: text, 
      timestamp: new Date().toLocaleTimeString(),
      isMine: false,
      isSystem: true 
    }]);
  };

  // 메시지 리스너 설정
  useEffect(() => {
    if (!socketRef.current) return;

    const handleMessage = async (payload: any) => {
      console.log('[useChat] Message received:', payload);
      console.log('[useChat] cryptoKeyRef.current:', !!cryptoKeyRef.current);
      
      if (!cryptoKeyRef.current) {
        console.warn('[useChat] No cryptoKey - skipping message');
        return;
      }

      try {
        if (payload.iv && payload.data) {
          const decryptedString = await decryptMessage(payload.iv, payload.data, cryptoKeyRef.current);
          const messageData = JSON.parse(decryptedString);
          
          console.log('[useChat] Decrypted message:', messageData);
          
          setMessages((prev) => [...prev, { 
            id: payload.id || `msg-${Date.now()}-${Math.random()}`,
            sender: messageData.senderNickname, 
            text: messageData.text,
            timestamp: new Date(payload.timestamp || Date.now()).toLocaleTimeString(),
            isMine: messageData.senderNickname === nickname,
            isSystem: false
          }]);
        }
      } catch (e) {
        console.warn('Failed to decrypt:', e);
      }
    };

    socketRef.current.on(SERVER_EVENTS.MESSAGE_RECEIVED, handleMessage);

    return () => {
      if (socketRef.current) {
        socketRef.current.off(SERVER_EVENTS.MESSAGE_RECEIVED, handleMessage);
      }
    };
  }, [socketRef, nickname]);

  // 메시지 전송
  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !cryptoKey || !socketRef.current || !isConnected) return;

    const messagePayload = JSON.stringify({
      text: inputMessage,
      senderNickname: nickname
    });

    try {
      const encrypted = await encryptMessage(messagePayload, cryptoKey);

      // 로컬 UI에 즉시 추가
      setMessages((prev) => [...prev, { 
        id: `local-${Date.now()}`,
        sender: nickname, 
        text: inputMessage,
        timestamp: new Date().toLocaleTimeString(),
        isMine: true,
        isSystem: false
      }]);

      // 서버로 전송
      socketRef.current.emit(CLIENT_EVENTS.SEND_MESSAGE, {
        roomId,
        iv: encrypted.iv,
        data: encrypted.data
      });
      
      setInputMessage('');
    } catch (e) {
      console.error('Encryption failed:', e);
      addSystemMessage(t.common.failedToSendMessage);
    }
  };

  // 연결 및 환영 메시지 추가
  const initializeChat = () => {
    addSystemMessage(withParams(t.chat.welcomeMessage, { roomName, nickname }));
  };

  return {
    messages,
    inputMessage,
    setInputMessage,
    chatContainerRef,
    sendMessage,
    addSystemMessage,
    initializeChat,
  };
}
