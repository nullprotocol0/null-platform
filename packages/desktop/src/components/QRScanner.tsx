import jsQR from "jsqr";

export interface ParsedShareLink {
  address: string;
  pubkeyHex: string;
}

/** Parse a null:// share link. Returns null if invalid. */
export function parseShareLink(raw: string): ParsedShareLink | null {
  try {
    // URL constructor may throw or produce unexpected results for null:// scheme
    // in some environments — handle manually if needed.
    const url = new URL(raw);
    if (url.protocol !== "null:") return null;
    const address = url.searchParams.get("address");
    const pubkeyHex = url.searchParams.get("pubkey");
    if (!address || !pubkeyHex) return null;
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return null;
    if (!/^[0-9a-fA-F]{66}$/.test(pubkeyHex)) return null; // 33 bytes = 66 hex chars
    return { address, pubkeyHex };
  } catch {
    return null;
  }
}

interface Props {
  onScan: (result: ParsedShareLink) => void;
  onError: (msg: string) => void;
}

const s = {
  btn: {
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: "2px",
    color: "var(--muted)",
    cursor: "pointer",
    fontSize: "12px",
    padding: "8px 16px",
  },
};

export function QRScanner({ onScan, onError }: Props) {
  async function handleClick() {
    const filePath = await window.nullBridge.system.openFileDialog([
      { name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp"] },
    ]);
    if (!filePath) return;

    let bytes: Uint8Array;
    try {
      bytes = await window.nullBridge.system.readFileBytes(filePath);
    } catch {
      onError("Failed to read file");
      return;
    }

    // Determine MIME type from extension
    const ext = filePath.split(".").pop()?.toLowerCase() ?? "png";
    const mimeMap: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
    };
    const mime = mimeMap[ext] ?? "image/png";

    // TS 5.7: Uint8Array<ArrayBufferLike> is not directly BlobPart — slice to plain ArrayBuffer
    const plainBuf = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer;
    const blob = new Blob([plainBuf], { type: mime });
    const objectUrl = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        onError("Canvas not available");
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      URL.revokeObjectURL(objectUrl);

      const result = jsQR(imageData.data, img.width, img.height);
      if (!result) {
        onError("No QR code found in image");
        return;
      }

      const parsed = parseShareLink(result.data);
      if (!parsed) {
        onError(`Invalid share link in QR: ${result.data}`);
        return;
      }
      onScan(parsed);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      onError("Failed to load image");
    };
    img.src = objectUrl;
  }

  return (
    <button style={s.btn} onClick={handleClick}>
      Open QR image file
    </button>
  );
}
