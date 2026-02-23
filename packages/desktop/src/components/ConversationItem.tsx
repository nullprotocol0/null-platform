import type { Contact, Conversation } from "../context/reducer.js";

interface Props {
  conversation: Conversation;
  contact: Contact | undefined;
  isActive: boolean;
  peerStatus: "connecting" | "connected" | "disconnected" | undefined;
  unreadCount?: number;
  onClick: () => void;
}

const STATUS_COLORS = {
  connected: "#00ff41",
  connecting: "#ffaa00",
  disconnected: "#555555",
} as const;

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
}

export function ConversationItem({ conversation, contact, isActive, peerStatus, unreadCount = 0, onClick }: Props) {
  const label =
    contact?.nickname ??
    `${conversation.contactAddress.slice(0, 6)}…${conversation.contactAddress.slice(-4)}`;

  const lastMsg = conversation.messages[conversation.messages.length - 1];
  const preview = lastMsg ? lastMsg.content.slice(0, 50) : "No messages yet";
  const statusColor = STATUS_COLORS[peerStatus ?? "disconnected"];

  const pendingCount = conversation.messages.filter(
    (m) => m.status === "pending"
  ).length;

  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--border)",
        background: isActive ? "var(--bg-hover)" : "transparent",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        userSelect: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: statusColor,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: "13px", color: "var(--green)", fontWeight: "bold" }}>
            {label}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {pendingCount > 0 && (
            <span style={{ fontSize: "10px", color: "var(--muted)" }}>
              {pendingCount}○
            </span>
          )}
          {unreadCount > 0 && (
            <span
              style={{
                background: "var(--green)",
                color: "#0a0a0a",
                borderRadius: "10px",
                fontSize: "10px",
                fontWeight: "bold",
                minWidth: "18px",
                height: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 5px",
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          {conversation.lastActivity > 0 && (
            <span style={{ fontSize: "10px", color: "var(--muted)" }}>
              {formatRelativeTime(conversation.lastActivity)}
            </span>
          )}
        </div>
      </div>
      <div
        style={{
          fontSize: "11px",
          color: "var(--muted)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {preview}
      </div>
    </div>
  );
}
