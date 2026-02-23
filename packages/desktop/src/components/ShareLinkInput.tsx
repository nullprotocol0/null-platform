import { useState, type FormEvent } from "react";
import { parseShareLink, type ParsedShareLink } from "./QRScanner.js";

interface Props {
  onParse: (result: ParsedShareLink) => void;
}

const s = {
  wrapper: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  label: {
    fontSize: "11px",
    color: "var(--muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
  },
  row: {
    display: "flex",
    gap: "8px",
  },
  input: {
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: "2px",
    color: "var(--green)",
    fontSize: "12px",
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
    fontSize: "12px",
    padding: "8px 16px",
    whiteSpace: "nowrap" as const,
  },
  error: {
    fontSize: "11px",
    color: "var(--red)",
  },
};

export function ShareLinkInput({ onParse }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = parseShareLink(value.trim());
    if (!parsed) {
      setError("Invalid link. Expected: null://connect?address=0x...&pubkey=...");
      return;
    }
    onParse(parsed);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} style={s.wrapper}>
      <label style={s.label}>Paste share link</label>
      <div style={s.row}>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="null://connect?address=0x...&pubkey=..."
          style={s.input}
        />
        <button type="submit" disabled={!value.trim()} style={s.btn}>
          Add
        </button>
      </div>
      {error && <span style={s.error}>{error}</span>}
    </form>
  );
}
