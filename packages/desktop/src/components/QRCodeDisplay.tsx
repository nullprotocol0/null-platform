import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface Props {
  address: string;
  pubkeyHex: string;
}

const s = {
  wrapper: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "12px",
  },
  qr: {
    border: "4px solid var(--bg)",
    borderRadius: "4px",
    background: "var(--bg)",
  },
  link: {
    fontSize: "10px",
    color: "var(--muted)",
    wordBreak: "break-all" as const,
    maxWidth: "256px",
    textAlign: "center" as const,
  },
  btn: {
    background: "transparent",
    border: "1px solid var(--green)",
    borderRadius: "2px",
    color: "var(--green)",
    cursor: "pointer",
    fontSize: "12px",
    padding: "6px 16px",
  },
  copied: {
    fontSize: "11px",
    color: "var(--green-dim)",
  },
};

export function QRCodeDisplay({ address, pubkeyHex }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shareLink = `null://connect?address=${address}&pubkey=${pubkeyHex}`;

  useEffect(() => {
    void QRCode.toDataURL(shareLink, {
      width: 256,
      margin: 2,
      color: { dark: "#00ff41", light: "#0a0a0a" },
    }).then(setDataUrl);
  }, [shareLink]);

  async function handleCopy() {
    await window.nullBridge.system.copyToClipboard(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={s.wrapper}>
      {dataUrl ? (
        <img src={dataUrl} alt="Your contact QR" width={256} height={256} style={s.qr} />
      ) : (
        <div
          style={{
            width: 256,
            height: 256,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--muted)",
            fontSize: "12px",
          }}
        >
          generating...
        </div>
      )}
      <div style={s.link}>{shareLink}</div>
      <button style={s.btn} onClick={handleCopy}>
        Copy share link
      </button>
      {copied && <span style={s.copied}>copied!</span>}
    </div>
  );
}
