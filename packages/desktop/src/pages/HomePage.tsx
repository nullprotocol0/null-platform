import { ConversationItem } from "../components/ConversationItem.js";
import { useApp } from "../context/AppContext.js";

const s = {
  page: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100%",
  },
  header: {
    padding: "16px 20px",
    borderBottom: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: "13px",
    letterSpacing: "0.2em",
    color: "var(--muted)",
    textTransform: "uppercase" as const,
  },
  btn: {
    background: "transparent",
    border: "1px solid var(--green)",
    borderRadius: "2px",
    color: "var(--green)",
    cursor: "pointer",
    fontSize: "12px",
    padding: "6px 14px",
  },
  list: {
    flex: 1,
    overflowY: "auto" as const,
  },
  empty: {
    padding: "40px 20px",
    textAlign: "center" as const,
    color: "var(--muted)",
    fontSize: "12px",
    lineHeight: 2,
  },
};

export function HomePage() {
  const { state, dispatch } = useApp();

  const sorted = Object.values(state.conversations).sort(
    (a, b) => b.lastActivity - a.lastActivity
  );

  // Contacts that haven't been messaged yet
  const newContacts = Object.values(state.contacts).filter(
    (c) => !state.conversations[c.address]
  );

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.title}>Conversations</div>
        <button
          style={s.btn}
          onClick={() => dispatch({ type: "SET_SCREEN", screen: "add-contact" })}
        >
          + Add contact
        </button>
      </div>

      <div style={s.list}>
        {sorted.map((conv) => (
          <ConversationItem
            key={conv.contactAddress}
            conversation={conv}
            contact={state.contacts[conv.contactAddress]}
            isActive={state.currentContactAddress === conv.contactAddress}
            peerStatus={state.peerStatuses[conv.contactAddress]}
            unreadCount={state.unreadCounts[conv.contactAddress] ?? 0}
            onClick={() =>
              dispatch({
                type: "OPEN_CONVERSATION",
                contactAddress: conv.contactAddress,
              })
            }
          />
        ))}

        {newContacts.map((c) => (
          <button
            key={c.address}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: "1px solid var(--border)",
              color: "var(--muted)",
              cursor: "pointer",
              fontSize: "12px",
              fontFamily: "var(--font)",
              padding: "12px 16px",
              textAlign: "left" as const,
              width: "100%",
              display: "flex",
              flexDirection: "column" as const,
              gap: "2px",
            }}
            onClick={() => dispatch({ type: "OPEN_CONVERSATION", contactAddress: c.address })}
          >
            <span style={{ color: "var(--green)" }}>
              {c.nickname ?? `${c.address.slice(0, 8)}…${c.address.slice(-4)}`}
            </span>
            <span style={{ fontSize: "10px" }}>no messages yet — click to start</span>
          </button>
        ))}

        {sorted.length === 0 && newContacts.length === 0 && (
          <div style={s.empty}>
            No contacts yet.
            <br />
            Click <strong>+ Add contact</strong> to get started.
          </div>
        )}
      </div>
    </div>
  );
}
