'use client';

import { useState, useEffect, useRef } from 'react';
import { encryptMessage, decryptMessage } from '@/lib/crypto';
import { CLIENT_EVENTS, SERVER_EVENTS } from '@/types/events';
import { withParams } from '@/i18n/LanguageContext';
import type { en } from '@/i18n/locales/en';
import type { MessageUIModel } from '@/types/uimodel';
import { Socket } from 'socket.io-client';
import {
  EncryptedMessagePayload,
  ChatHistoryPayload,
  ChatMessage,
} from '@/types/chat';

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
  socketRef: React.MutableRefObject<Socket | null>,
  isConnected: boolean,
  t: DeepReadonly<typeof en>,
) {
  const [messages, setMessages] = useState<MessageUIModel[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const cryptoKeyRef = useRef<CryptoKey | null>(null);
  const historyRequestedRef = useRef(false);
  const pendingHistoryRef = useRef(false);

  // cryptoKey ref 동기화
  useEffect(() => {
    cryptoKeyRef.current = cryptoKey;

    // cryptoKey가 늦게 준비되었고 히스토리가 보류된 경우 다시 요청
    if (
      cryptoKey &&
      pendingHistoryRef.current &&
      socketRef.current &&
      isConnected
    ) {
      pendingHistoryRef.current = false;
      historyRequestedRef.current = true;
      socketRef.current.emit(CLIENT_EVENTS.REQUEST_HISTORY, roomId);
    }
  }, [cryptoKey, isConnected, roomId, socketRef]);

  // cryptoKey 준비되면 히스토리 요청
  useEffect(() => {

    if (
      cryptoKey &&
      socketRef.current &&
      isConnected &&
      !historyRequestedRef.current
    ) {
      // roomId를 함께 보내서 서버에서 socket.roomId가 아직 설정되지 않았더라도 처리 가능하게 함
      socketRef.current.emit(CLIENT_EVENTS.REQUEST_HISTORY, roomId);
      historyRequestedRef.current = true;
    }
  }, [cryptoKey, socketRef, isConnected, roomId]);

  // 메시지 변경 시 자동으로 하단 스크롤
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // 시스템 메시지 추가
  const addSystemMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}-${Math.random()}`,
        sender: 'System',
        text: text,
        timestamp: new Date().toLocaleTimeString(),
        isMine: false,
        isSystem: true,
      },
    ]);
  };

  // 메시지 리스너 설정
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isConnected) return;

    const handleMessage = async (payload: EncryptedMessagePayload) => {
      if (!cryptoKeyRef.current) {
        console.warn('[useChat] No cryptoKey - skipping message');
        return;
      }

      try {
        if (payload.iv && payload.data) {
          const decryptedString = await decryptMessage(
            payload.iv,
            payload.data,
            cryptoKeyRef.current,
          );
          const messageData = JSON.parse(decryptedString);

          setMessages((prev) => [
            ...prev,
            {
              id: payload.id || `msg-${Date.now()}-${Math.random()}`,
              sender: messageData.senderNickname,
              text: messageData.text,
              timestamp: new Date(
                payload.timestamp || Date.now(),
              ).toLocaleTimeString(),
              isMine: messageData.senderNickname === nickname,
              isSystem: false,
            },
          ]);
        }
      } catch (e) {
        console.warn('Failed to decrypt:', e);
      }
    };

    socket.on(SERVER_EVENTS.MESSAGE_RECEIVED, handleMessage);

    // Handle batch history messages
    const handleHistory = async (payload: ChatHistoryPayload) => {
      if (!cryptoKeyRef.current) {
        console.warn('[useChat] No cryptoKey - skipping history');
        pendingHistoryRef.current = true;
        return;
      }

      try {
        const validMessages: MessageUIModel[] = [];

        for (const msg of payload.messages) {
          if (msg.iv && msg.data) {
            try {
              const decryptedString = await decryptMessage(
                msg.iv,
                msg.data,
                cryptoKeyRef.current!,
              );
              const messageData = JSON.parse(decryptedString);

              validMessages.push({
                id: msg.id || `msg-${Date.now()}-${Math.random()}`,
                sender: messageData.senderNickname,
                text: messageData.text,
                timestamp: new Date(
                  msg.timestamp || Date.now(),
                ).toLocaleTimeString(),
                isMine: messageData.senderNickname === nickname,
                isSystem: false,
              });
            } catch (err) {
              console.warn(
                '[useChat] Failed to decrypt individual message:',
                err,
              );
            }
          }
        }

        setMessages((prev) => [...prev, ...validMessages]);
      } catch (e) {
        console.warn('Failed to decrypt history:', e);
      }
    };

    socket.on(SERVER_EVENTS.HISTORY_RECEIVED, handleHistory);

    return () => {
      if (socket) {
        socket.off(SERVER_EVENTS.MESSAGE_RECEIVED, handleMessage);
        socket.off(SERVER_EVENTS.HISTORY_RECEIVED, handleHistory);
      }
    };
  }, [socketRef, nickname, isConnected]);

  // 메시지 전송
  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (
      !inputMessage.trim() ||
      !cryptoKey ||
      !socketRef.current ||
      !isConnected
    )
      return;

    const messagePayload = JSON.stringify({
      text: inputMessage,
      senderNickname: nickname,
    });

    try {
      const encrypted = await encryptMessage(messagePayload, cryptoKey);

      // 로컬 UI에 즉시 추가
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          sender: nickname,
          text: inputMessage,
          timestamp: new Date().toLocaleTimeString(),
          isMine: true,
          isSystem: false,
        },
      ]);

      // 서버로 전송
      socketRef.current.emit(CLIENT_EVENTS.SEND_MESSAGE, {
        roomId,
        iv: encrypted.iv,
        data: encrypted.data,
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

  // roomName이 변경되면(로딩 완료 등) 시스템 메시지의 방 이름을 업데이트하거나 새로운 안내 메시지 추가
  // 여기서는 간단히 useEffect로 roomName이 유효해질 때 환영 메시지를 한 번 더 띄우거나,
  // 기존 로직을 보완. 다만 initializeChat은 연결 시점에 한 번 불리므로,
  // roomName이 나중에 로드되는 경우를 대비해 별도 처리가 필요할 수 있음.
  // 현재 구조상 initializeChat을 useEffect로 roomName 변경 시 호출하면 중복 환영 인사가 될 수 있으므로,
  // 가장 간단한 방법은 initializeChat 호출 시점의 roomName을 신뢰하는 것임.
  // 하지만 page.tsx에서 roomInfo가 로드되면 roomName이 업데이트되므로,
  // 이를 반영하려면 initializeChat을 useEffect 의존성에 넣거나 해야 함.

  // 더 나은 UX: roomName이 '...' 이었다가 실제 이름으로 바뀌면 시스템 메시지 업데이트?
  // 복잡도를 낮추기 위해, page.tsx에서 cryptoKey와 nickname이 준비된 시점에(이미 roomInfo 로드됨)
  // initializeChat을 부르므로 큰 문제는 없을 것으로 예상됨.
  // 다만 혹시 모르니 roomName 변경 로그만 남김.
  useEffect(() => {
  }, [roomName]);

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
