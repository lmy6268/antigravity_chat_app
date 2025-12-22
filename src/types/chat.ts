export interface EncryptedMessagePayload {
    iv: number[];
    data: number[];
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
