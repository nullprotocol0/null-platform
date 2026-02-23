import type { LocalMessage } from "../context/reducer.js";

interface Props {
  message: LocalMessage;
  isMine: boolean;
}

const STATUS = {
  pending: { symbol: "○", color: "var(--muted)" },
  delivered: { symbol: "✓", color: "var(--green-dim)" },
  failed: { symbol: "✗", color: "var(--red)" },
} as const;

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ message, isMine }: Props) {
  const status = STATUS[message.status];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isMine ? "flex-end" : "flex-start",
        gap: "4px",
        marginBottom: "8px",
      }}
    >
      <div
        style={{
          background: isMine ? "var(--bg-surface)" : "transparent",
          border: `1px solid ${isMine ? "var(--border)" : "var(--border)"}`,
          borderRadius: "4px",
          padding: "8px 12px",
          maxWidth: "70%",
          wordBreak: "break-word",
          fontSize: "13px",
          color: "var(--green)",
          lineHeight: 1.5,
          userSelect: "text",
        }}
      >
        {message.content}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "10px",
          color: "var(--muted)",
        }}
      >
        <span>{formatTime(message.timestamp)}</span>
        {isMine && (
          <span style={{ color: status.color }}>{status.symbol}</span>
        )}
      </div>
    </div>
  );
}
