import { useState, useEffect, type FormEvent } from "react";
import { QRScanner, parseShareLink, type ParsedShareLink } from "../components/QRScanner.js";
import { ShareLinkInput } from "../components/ShareLinkInput.js";
import { QRCodeDisplay } from "../components/QRCodeDisplay.js";
import { useApp } from "../context/AppContext.js";

const s = {
  page: {
    padding: "32px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "32px",
    overflowY: "auto" as const,
    height: "100%",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  title: {
    fontSize: "16px",
    letterSpacing: "0.2em",
    color: "var(--green)",
  },
  back: {
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    fontSize: "13px",
    padding: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "32px",
  },
  section: {
    border: "1px solid var(--border)",
    borderRadius: "4px",
    padding: "24px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  },
  sectionTitle: {
    fontSize: "11px",
    color: "var(--muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.15em",
  },
  divider: {
    borderTop: "1px solid var(--border)",
  },
  preview: {
    border: "1px solid var(--border)",
    borderRadius: "4px",
    padding: "16px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  previewLabel: {
    fontSize: "11px",
    color: "var(--muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
  },
  previewAddress: {
    fontSize: "12px",
    color: "var(--green)",
    wordBreak: "break-all" as const,
  },
  row: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  input: {
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: "2px",
    color: "var(--green)",
    fontSize: "13px",
    fontFamily: "var(--font)",
    padding: "8px 12px",
    flex: 1,
    outline: "none",
  },
  btn: {
    background: "transparent",
    border: "1px solid var(--green)",
    borderRadius: "2px",
    color: "var(--green)",
    cursor: "pointer",
    fontSize: "13px",
    padding: "8px 20px",
  },
  successMsg: {
    fontSize: "12px",
    color: "var(--green-dim)",
  },
  errorMsg: {
    fontSize: "12px",
    color: "var(--red)",
  },
};

export function AddContactPage() {
  const { state, dispatch } = useApp();

  const [pending, setPending] = useState<ParsedShareLink | null>(null);
  const [nickname, setNickname] = useState("");
  const [scanError, setScanError] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedAddress, setSavedAddress] = useState<string | null>(null);

  // Listen for deep-link null:// URLs
  useEffect(() => {
    window.nullBridge.onProtocolLink((url) => {
      setScanError("");
      setSaved(false);
      const parsed = parseShareLink(url);
      if (parsed) {
        setPending(parsed);
      } else {
        setScanError(`Invalid share link: ${url}`);
      }
    });
  }, []);

  function handleParsed(result: ParsedShareLink) {
    setScanError("");
    setSaved(false);
    setSavedAddress(null);
    setPending(result);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!pending) return;

    const trimmed = nickname.trim();
    const contact: import("../context/reducer.js").Contact = {
      address: pending.address,
      pubkeyHex: pending.pubkeyHex,
      ...(trimmed ? { nickname: trimmed } : {}),
    };

    // Persist to LevelDB
    await window.nullBridge.storage.put(
      `contact:${pending.address}`,
      JSON.stringify({ ...contact, addedAt: Date.now() })
    );

    dispatch({ type: "ADD_CONTACT", contact });
    setSaved(true);
    setSavedAddress(pending.address);
    setPending(null);
    setNickname("");
  }

  function handleOpenConversation() {
    if (!pending) return;
    dispatch({ type: "OPEN_CONVERSATION", contactAddress: pending.address });
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => dispatch({ type: "SET_SCREEN", screen: "home" })}>
          ← back
        </button>
        <div style={s.title}>ADD CONTACT</div>
      </div>

      <div style={s.grid}>
        {/* Left: scan / paste */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Add someone</div>

          <QRScanner onScan={handleParsed} onError={setScanError} />
          <div style={{ fontSize: "11px", color: "var(--muted)" }}>— or —</div>
          <ShareLinkInput onParse={handleParsed} />

          {scanError && <div style={s.errorMsg}>{scanError}</div>}
          {saved && savedAddress && (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
              <div style={s.successMsg}>✓ Contact saved</div>
              <button
                style={s.btn}
                onClick={() => dispatch({ type: "OPEN_CONVERSATION", contactAddress: savedAddress })}
              >
                Message them →
              </button>
            </div>
          )}

          {pending && (
            <>
              <div style={s.divider} />
              <div style={s.preview}>
                <div style={s.previewLabel}>Contact found</div>
                <div style={s.previewAddress}>{pending.address}</div>
              </div>

              <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                <div style={s.row}>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Nickname (optional)"
                    style={s.input}
                    maxLength={40}
                  />
                  <button type="submit" style={s.btn}>
                    Save
                  </button>
                </div>
                <button
                  type="button"
                  style={{ ...s.btn, borderColor: "var(--border)", color: "var(--muted)" }}
                  onClick={handleOpenConversation}
                >
                  Open conversation →
                </button>
              </form>
            </>
          )}
        </div>

        {/* Right: share your own address */}
        {state.wallet && (
          <div style={s.section}>
            <div style={s.sectionTitle}>Share your address</div>
            <QRCodeDisplay
              address={state.wallet.address}
              pubkeyHex={state.wallet.pubkeyHex}
            />
          </div>
        )}
      </div>
    </div>
  );
}
