export interface EncryptedMessagePayload {
  iv: string;
  data: string;
  id?: string;
  timestamp?: string | number;
}

export interface ChatHistoryPayload {
  messages: EncryptedMessagePayload[];
}

export interface ChatMessage {
  text: string;
  senderNickname: string;
}
