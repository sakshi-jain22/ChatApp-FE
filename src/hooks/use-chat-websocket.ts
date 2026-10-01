import { useEffect, useRef, useSyncExternalStore } from "react";
import { chatWebSocketService } from "../services/chat-websocket-service";

const subscribeToConnection = (listener: () => void): (() => void) =>
  chatWebSocketService.subscribeToConnection(listener);

export interface RealtimeChatMessage {
  id?: number | string;
  sender?: string | { id?: number | string; name?: string; email?: string };
  content: string;
  createdAt?: string;
}

interface UseChatWebSocketOptions {
  token: string | null;
  chatId: number | string | null;
  onMessage: (message: RealtimeChatMessage) => void;
}

export const useChatWebSocket = ({
  token,
  chatId,
  onMessage,
}: UseChatWebSocketOptions) => {
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!token || chatId === null) return;
    return chatWebSocketService.subscribe(token, chatId, (message) => {
      onMessageRef.current(message);
    });
  }, [token, chatId]);

  const isConnected = useSyncExternalStore(
    subscribeToConnection,
    () => chatWebSocketService.isConnected(token, chatId),
    () => false,
  );

  const sendMessage = (content: string): boolean => {
    return chatWebSocketService.publish(token, chatId, content);
  };

  return { isConnected, sendMessage };
};