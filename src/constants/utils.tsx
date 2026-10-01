import React from "react";

interface IChatMessageProps {
  id: string;
  sender: string;
  content: string;
  createdAt: string;
}

const renderMessage = (item: IChatMessageProps): React.ReactNode => {
  return (
    <div
      className={`chat-page__message ${item.sender === "me" ? "is-sent" : ""}`}
      key={item.id}
    >
      <p>{item.content}</p>
      <time>{item.createdAt}</time>
    </div>
  );
};

export { renderMessage };
