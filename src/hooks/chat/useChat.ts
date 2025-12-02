'use client';

import { useState, useEffect, useRef } from 'react';
import { encryptMessage, decryptMessage } from '@/lib/crypto';
import { SOCKET_EVENTS } from '@/lib/constants';

interface Message {
  sender: string;
  text: string;
  isSystem?: boolean;
}

/**
 * useChat Hook (ViewModel)
 * 
 * Responsibilities:
 * - Manage chat messages state
 * - Handle message encryption/decryption
 * - Send and receive messages
 * - Auto-scroll to bottom
 * 
 * Similar to Android ViewModel managing chat data
 */
export function useChat(
  roomId: string,
  roomName: string,
  nickname: string,
  cryptoKey: CryptoKey | null,
  socketRef: React.MutableRefObject<any>,
  isConnected: boolean
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const cryptoKeyRef = useRef<CryptoKey | null>(null);

  // Sync cryptoKey ref
  useEffect(() => {
    cryptoKeyRef.current = cryptoKey;
  }, [cryptoKey]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Add system message
  const addSystemMessage = (text: string) => {
    setMessages((prev) => [...prev, { sender: 'System', text, isSystem: true }]);
  };

  // Setup message listener
  useEffect(() => {
    if (!socketRef.current) return;

    const handleMessage = async (payload: any) => {
      if (!cryptoKeyRef.current) return;

      try {
        if (payload.iv && payload.data) {
          const decryptedString = await decryptMessage(payload.iv, payload.data, cryptoKeyRef.current);
          const messageData = JSON.parse(decryptedString);
          
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

    socketRef.current.on(SOCKET_EVENTS.MESSAGE, handleMessage);

    return () => {
      if (socketRef.current) {
        socketRef.current.off(SOCKET_EVENTS.MESSAGE, handleMessage);
      }
    };
  }, [socketRef]);

  // Send message
  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !cryptoKey || !socketRef.current || !isConnected) return;

    const messagePayload = JSON.stringify({
      text: inputMessage,
      senderNickname: nickname
    });

    try {
      const encrypted = await encryptMessage(messagePayload, cryptoKey);

      // Add to local UI immediately
      setMessages((prev) => [...prev, { 
        sender: nickname, 
        text: inputMessage,
        isSystem: false
      }]);

      // Emit to server
      socketRef.current.emit(SOCKET_EVENTS.MESSAGE, {
        roomId,
        userId: nickname,
        content: messagePayload,
        isEncrypted: true,
        iv: encrypted.iv,
        data: encrypted.data,
        payload: encrypted
      });
      
      setInputMessage('');
    } catch (e) {
      console.error('Encryption failed:', e);
      addSystemMessage('Failed to send message.');
    }
  };

  // Connect and add welcome message
  const initializeChat = () => {
    addSystemMessage(`Welcome to ${roomName}, ${nickname}!`);
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
