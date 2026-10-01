import { Client, type StompSubscription } from "@stomp/stompjs";
import type { RealtimeChatMessage } from "../hooks/use-chat-websocket";

type MessageListener = (message: RealtimeChatMessage) => void;

interface TopicEntry {
  listeners: Set<MessageListener>;
  subscription?: StompSubscription;
}

class ChatWebSocketService {
  private client: Client | null = null;
  private clientToken: string | null = null;
  private requestedToken: string | null = null;
  private transition: Promise<void> = Promise.resolve();
  private idleTimer: number | null = null;
  private readonly topics = new Map<string, TopicEntry>();
  private readonly connectionListeners = new Set<() => void>();

  public subscribe(
    token: string,
    chatId: number | string,
    listener: MessageListener,
  ): () => void {
    if (this.idleTimer !== null) {
      window.clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    const topic = `/topic/chat/${chatId}`;
    let entry = this.topics.get(topic);
    if (!entry) {
      entry = { listeners: new Set() };
      this.topics.set(topic, entry);
    }
    entry.listeners.add(listener);

    void this.ensureClient(token).then(() => this.subscribeTopic(topic));

    return () => {
      const currentEntry = this.topics.get(topic);
      if (!currentEntry) return;

      currentEntry.listeners.delete(listener);
      if (currentEntry.listeners.size === 0) {
        currentEntry.subscription?.unsubscribe();
        this.topics.delete(topic);
      }

      if ([...this.topics.values()].every((item) => item.listeners.size === 0)) {
        this.scheduleIdleShutdown();
      }
    };
  }

  public publish(
    token: string | null,
    chatId: number | string | null,
    content: string,
  ): boolean {
    const trimmedContent = content.trim();
    if (
      !token ||
      chatId === null ||
      !trimmedContent ||
      this.clientToken !== token ||
      !this.client?.connected
    ) {
      return false;
    }

    this.client.publish({
      destination: "/app/chat.send",
      body: JSON.stringify({ chatId, content: trimmedContent }),
    });
    return true;
  }

  public isConnected(token: string | null, chatId: number | string | null): boolean {
    return Boolean(
      token &&
        chatId !== null &&
        this.clientToken === token &&
        this.client?.connected &&
        this.topics.get(`/topic/chat/${chatId}`)?.listeners.size,
    );
  }

  public subscribeToConnection(listener: () => void): () => void {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  private ensureClient(token: string): Promise<void> {
    this.requestedToken = token;
    this.transition = this.transition
      .catch(() => undefined)
      .then(async () => {
        if (this.client && this.clientToken === token) return;

        const previousClient = this.client;
        this.client = null;
        this.clientToken = null;
        this.notifyConnectionChange();
        if (previousClient) await previousClient.deactivate();
        if (this.requestedToken !== token) return;

        const client = new Client({
          brokerURL:
            import.meta.env.VITE_CHAT_WEBSOCKET_URL ?? "ws://localhost:8080/ws",
          connectHeaders: {
            Authorization: `Bearer ${token}`,
          },
          reconnectDelay: 5000,
          onConnect: () => {
            if (this.client !== client) return;
            for (const topic of this.topics.keys()) {
              this.subscribeTopic(topic);
            }
            this.notifyConnectionChange();
          },
          onDisconnect: () => {
            if (this.client === client) this.notifyConnectionChange();
          },
          onWebSocketClose: () => {
            if (this.client === client) this.notifyConnectionChange();
          },
          onStompError: (frame) => {
            if (this.client === client) this.notifyConnectionChange();
            console.error("STOMP error:", frame.headers.message, frame.body);
          },
        });

        this.client = client;
        this.clientToken = token;
        this.notifyConnectionChange();
        void client.activate();
      });

    return this.transition;
  }

  private subscribeTopic(topic: string): void {
    const entry = this.topics.get(topic);
    if (!entry || entry.listeners.size === 0 || entry.subscription || !this.client?.connected) {
      return;
    }

    entry.subscription = this.client.subscribe(topic, (frame) => {
      try {
        const message = JSON.parse(frame.body) as RealtimeChatMessage;
        if (typeof message.content !== "string") return;
        for (const listener of this.topics.get(topic)?.listeners ?? []) {
          listener(message);
        }
      } catch (error: unknown) {
        console.error("Unable to parse chat message:", error);
      }
    });
  }

  private scheduleIdleShutdown(): void {
    if (this.idleTimer !== null) return;

    this.idleTimer = window.setTimeout(() => {
      this.idleTimer = null;
      this.requestedToken = null;
      this.transition = this.transition
        .catch(() => undefined)
        .then(async () => {
          if (this.topics.size > 0) return;
          const client = this.client;
          this.client = null;
          this.clientToken = null;
          this.notifyConnectionChange();
          if (client) await client.deactivate();
        });
    }, 0);
  }

  private notifyConnectionChange(): void {
    for (const listener of this.connectionListeners) listener();
  }
}

export const chatWebSocketService = new ChatWebSocketService();