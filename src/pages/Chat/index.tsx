import React from "react";
import { FiEdit3, FiMoreHorizontal, FiPaperclip, FiSend } from "react-icons/fi";

import { useAppDispatch, useAppSelector } from "../../store";
import {
  createChat,
  fetchAvailableUsers,
  fetchUserChats,
  selectChat,
} from "../../store/chat-slice";
import {
  useChatWebSocket,
  type RealtimeChatMessage,
} from "../../hooks/use-chat-websocket";
import { apiService } from "../../services/api-service";

import { renderMessage } from "../../constants/utils";

import "./chat-styles.scss";

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  createdAt: string;
}

const toChatMessage = (
  incoming: RealtimeChatMessage,
  chatKey: string,
  email: string,
): ChatMessage => {
  const sender = incoming.sender;
  const senderEmail = typeof sender === "object" ? sender.email : sender;
  const senderName = typeof sender === "object" ? sender.name : sender;

  return {
    id: String(incoming.id ?? `${chatKey}-${Date.now()}`),
    sender: senderEmail === email || senderEmail === "me"
      ? "me"
      : senderName ?? "other",
    content: incoming.content,
    createdAt: incoming.createdAt ?? new Date().toLocaleTimeString(),
  };
};

const mergeMessages = (
  existing: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] => {
  const merged = [...existing];

  for (const message of incoming) {
    const optimisticIndex = message.sender === "me"
      ? merged.findIndex((item) =>
          item.id.startsWith("local-") && item.content === message.content,
        )
      : -1;
    if (optimisticIndex !== -1) {
      merged[optimisticIndex] = message;
    } else if (!merged.some((item) => item.id === message.id)) {
      merged.push(message);
    }
  }

  return merged;
};

const initialsFor = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const Chat: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    chats,
    availableUsers,
    activeChatId,
    status,
    usersStatus,
    creatingUserId,
    error,
    usersError,
    createError,
  } = useAppSelector((state) => state.chat);
  const { email } = useAppSelector((state) => state.settings);
  const { token } = useAppSelector((state) => state.auth);
  const [message, setMessage] = React.useState("");
  const [messagesByChat, setMessagesByChat] = React.useState<
    Record<string, ChatMessage[]>
  >({});
  const [sendError, setSendError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [showAvailableUsers, setShowAvailableUsers] = React.useState(false);
  const activeChat = chats.find((chat) => chat.id === activeChatId);
  const showingUsers = chats.length === 0 || showAvailableUsers;
  const activeChatKey = activeChatId === null ? null : String(activeChatId);
  const messages = activeChatKey ? messagesByChat[activeChatKey] ?? [] : [];

  const handleIncomingMessage = (incoming: RealtimeChatMessage): void => {
    if (activeChatKey === null || typeof incoming.content !== "string") return;
    const chatKey = activeChatKey;
    const message = toChatMessage(incoming, chatKey, email);

    setMessagesByChat((current) => ({
      ...current,
      [chatKey]: mergeMessages(current[chatKey] ?? [], [message]),
    }));
  };

  const { isConnected, sendMessage } = useChatWebSocket({
    token,
    chatId: activeChatId,
    onMessage: handleIncomingMessage,
  });

  React.useEffect(() => {
    dispatch(fetchUserChats())
      .unwrap()
      .then((loadedChats) => {
        if (loadedChats.length === 0) {
          dispatch(fetchAvailableUsers());
        }
      })
      .catch(() => undefined);
  }, [dispatch]);

  React.useEffect(() => {
    if (activeChatId === null || activeChatKey === null) return;
    let cancelled = false;

    void apiService.getChatMessages<RealtimeChatMessage[]>(activeChatId)
      .then((response) => {
        if (cancelled || !response.ok || !Array.isArray(response.data)) return;
        const loadedMessages = response.data
          .filter((item) => item && typeof item.content === "string")
          .map((item) => toChatMessage(item, activeChatKey, email));
        setMessagesByChat((current) => ({
          ...current,
          [activeChatKey]: mergeMessages(current[activeChatKey] ?? [], loadedMessages),
        }));
      })
      .catch((error: unknown) => {
        console.error("Unable to load chat messages:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [activeChatId, activeChatKey, email]);

  const handleMessageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    setMessage(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const content = message.trim();
    if (!content) return;
    if (!sendMessage(message)) {
      setSendError("Reconnecting to chat. Your message was not sent.");
      return;
    }

    if (activeChatKey !== null) {
      const chatKey = activeChatKey;
      setMessagesByChat((current) => ({
        ...current,
        [chatKey]: [
          ...(current[chatKey] ?? []),
          {
            id: `local-${Date.now()}-${Math.random()}`,
            sender: "me",
            content,
            createdAt: new Date().toLocaleTimeString(),
          },
        ],
      }));
    }

    setSendError(null);
    setMessage("");
  };

  const handleStartChat = (userId: number | string): void => {
    const user = availableUsers.find((candidate) => candidate.id === userId);
    if (!user) return;

    dispatch(createChat(user))
      .unwrap()
      .then(() => setShowAvailableUsers(false))
      .catch(() => undefined);
  };

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const filteredUsers = availableUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(search.trim().toLowerCase()) &&
      user.email !== email,
  );

  return (
    <div className="chat-page">
      <aside className="chat-page__sidebar">
        <div className="chat-page__sidebar-heading">
          <div>
            <span className="chat-page__eyebrow">Workspace</span>
            <h1>{showingUsers ? "Start a chat" : "Messages"}</h1>
          </div>
          <button
            aria-label={
              showAvailableUsers
                ? "Show conversations"
                : "Start a new conversation"
            }
            onClick={() => {
              const next = !showAvailableUsers;
              setShowAvailableUsers(next);
              setSearch("");
              if (next && usersStatus !== "loading")
                dispatch(fetchAvailableUsers());
            }}
            type="button"
          >
            <FiEdit3 />
          </button>
        </div>
        <label className="chat-page__filter">
          <span className="sr-only">
            {showingUsers ? "Find a person" : "Filter conversations"}
          </span>
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder={
              showingUsers ? "Find a person" : "Filter conversations"
            }
            type="search"
            value={search}
          />
        </label>
        <div className="chat-page__contacts">
          {status === "loading" && chats.length === 0 && (
            <p className="chat-page__list-message">Loading conversations...</p>
          )}
          {status === "failed" && chats.length === 0 && (
            <div className="chat-page__list-message">
              <p>{error}</p>
              <button onClick={() => dispatch(fetchUserChats())} type="button">
                Try again
              </button>
            </div>
          )}
          {showingUsers && usersStatus === "loading" && (
            <p className="chat-page__list-message">Loading people...</p>
          )}
          {showingUsers && usersStatus === "failed" && (
            <div className="chat-page__list-message">
              <p>{usersError}</p>
              <button
                onClick={() => dispatch(fetchAvailableUsers())}
                type="button"
              >
                Try again
              </button>
            </div>
          )}
          {showingUsers &&
            usersStatus === "succeeded" &&
            filteredUsers.length === 0 && (
              <p className="chat-page__list-message">
                {availableUsers.length === 0
                  ? "No other users are available yet."
                  : "No people match your search."}
              </p>
            )}
          {showingUsers &&
            filteredUsers.map((user) => (
              <button
                className="chat-page__contact"
                disabled={creatingUserId !== null}
                key={user.id}
                onClick={() => handleStartChat(user.id)}
                type="button"
              >
                <span className="chat-page__contact-avatar">
                  {initialsFor(user.name)}
                </span>
                <span>
                  <strong>{user.name}</strong>
                  <small>Start a conversation</small>
                </span>
                {creatingUserId === user.id && (
                  <span
                    className="chat-page__spinner"
                    aria-label="Creating chat"
                  />
                )}
              </button>
            ))}
          {!showingUsers &&
            filteredChats.map((chat) => (
              <button
                className={`chat-page__contact ${chat.id === activeChatId ? "is-active" : ""}`}
                key={chat.id}
                onClick={() => dispatch(selectChat(chat.id))}
                type="button"
              >
                <span className="chat-page__contact-avatar">
                  {initialsFor(chat.name)}
                </span>
                <span>
                  <strong>{chat.name}</strong>
                  {chat.type === 'GROUP' && <small>{chat.type}</small>}
                </span>
              </button>
            ))}
          {!showingUsers && filteredChats.length === 0 && (
            <p className="chat-page__list-message">
              No conversations match your search.
            </p>
          )}
          {createError && (
            <p className="chat-page__error" role="alert">
              {createError}
            </p>
          )}
        </div>
      </aside>
      <section className="chat-page__conversation">
        {activeChat ? (
          <>
            <header className="chat-page__conversation-header">
              <div>
                <span className="chat-page__contact-avatar">
                  {initialsFor(activeChat.name)}
                </span>
                <span>
                  <strong>{activeChat.name}</strong>
                  <small>
                    <i className={isConnected ? "is-online" : "is-connecting"} />
                    {isConnected ? "Connected" : "Connecting..."}
                  </small>
                </span>
              </div>
              <button aria-label="More conversation options" type="button">
                <FiMoreHorizontal />
              </button>
            </header>
            <div className="chat-page__messages">
              {messages.length > 0 ? (
                messages.map(renderMessage)
              ) : (
                <p className="chat-page__empty-conversation">
                  No messages yet. Start the conversation.
                </p>
              )}
            </div>
            {sendError && (
              <p className="chat-page__error chat-page__send-error" role="alert">
                {sendError}
              </p>
            )}
            <form className="chat-page__composer" onSubmit={handleSubmit}>
              <button aria-label="Attach a file" type="button">
                <FiPaperclip />
              </button>
              <input
                aria-label="Write a message"
                onChange={handleMessageChange}
                placeholder="Write a message..."
                type="text"
                value={message}
              />
              <button aria-label="Send message" type="submit">
                <FiSend />
              </button>
            </form>
          </>
        ) : (
          <div className="chat-page__empty-state">
            <span className="chat-page__empty-icon">
              <FiEdit3 />
            </span>
            <h2>
              {showingUsers
                ? "Find someone to message"
                : "Choose a conversation"}
            </h2>
            <p>
              {showingUsers
                ? "Select a person from the list to start a new chat."
                : "Your conversations will appear here."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Chat;
