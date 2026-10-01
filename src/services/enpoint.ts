export const API = {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    CURRENT_USER: "/api/users/me",
    USERS: "/api/users",
    CHATS: "/api/chats",
    CHAT: (chatId: string | number) => `/api/chats/${encodeURIComponent(chatId)}`,
    CHAT_MESSAGES: (chatId: string | number) =>
        `/api/chats/${encodeURIComponent(chatId)}/messages`,
}