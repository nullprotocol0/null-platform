import { useState, useEffect, useRef, type ChangeEvent } from "react";
import type { FileRef } from "../context/reducer.js";

interface Props {
  fileRef: FileRef;
  isMine: boolean;
}

const GREEN = "#00FF41";
const MUTED = "#555";
const BAR_COUNT = 48;

// ── Helpers ─────────────────────────────────────────────────────────────────

async function generateWaveformFromBytes(bytes: Uint8Array): Promise<number[]> {
  const audioCtx = new AudioContext();
  try {
    const buf = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer;
    const audioBuf = await audioCtx.decodeAudioData(buf);
    const channel = audioBuf.getChannelData(0);
    const step = Math.max(1, Math.floor(channel.length / BAR_COUNT));
    const waveform: number[] = [];
    for (let i = 0; i < BAR_COUNT; i++) {
      let peak = 0;
      for (let j = 0; j < step; j++) {
        peak = Math.max(peak, Math.abs(channel[i * step + j] ?? 0));
      }
      waveform.push(peak);
    }
    return waveform;
  } catch {
    return Array<number>(BAR_COUNT).fill(0.25);
  } finally {
    void audioCtx.close();
  }
}

function resample(src: number[], targetLen: number): number[] {
  if (src.length === 0) return Array<number>(targetLen).fill(0.25);
  const out: number[] = [];
  for (let i = 0; i < targetLen; i++) {
    const idx = (i / targetLen) * src.length;
    const lo = Math.floor(idx);
    const hi = Math.min(lo + 1, src.length - 1);
    const t = idx - lo;
    out.push((1 - t) * (src[lo] ?? 0) + t * (src[hi] ?? 0));
  }
  return out;
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

// ── Component ────────────────────────────────────────────────────────────────

export function VoiceNoteBubble({ fileRef, isMine }: Props) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(
    fileRef.voiceDuration !== undefined ? fileRef.voiceDuration / 1000 : 0
  );
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);
  const [waveform, setWaveform] = useState<number[]>(
    fileRef.waveform ? resample(fileRef.waveform, BAR_COUNT) : Array<number>(BAR_COUNT).fill(0.25)
  );
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Build audio element when bytes arrive
  useEffect(() => {
    if (!fileRef.bytes) return;

    const blob = new Blob(
      [fileRef.bytes.buffer.slice(fileRef.bytes.byteOffset, fileRef.bytes.byteOffset + fileRef.bytes.byteLength) as ArrayBuffer],
      { type: fileRef.mimeType }
    );
    const url = URL.createObjectURL(blob);
    setObjectUrl(url);

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onended = () => { setPlaying(false); setCurrentTime(0); };

    // Generate waveform from bytes if not already provided by sender
    if (!fileRef.waveform || fileRef.waveform.length === 0) {
      void generateWaveformFromBytes(fileRef.bytes).then((w) =>
        setWaveform(resample(w, BAR_COUNT))
      );
    }

    return () => {
      audio.pause();
      URL.revokeObjectURL(url);
      audioRef.current = null;
    };
  }, [fileRef.bytes]); // eslint-disable-line react-hooks/exhaustive-deps

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !objectUrl) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.playbackRate = speed;
      void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }

  function handleScrub(e: ChangeEvent<HTMLInputElement>) {
    const t = parseFloat(e.target.value);
    setCurrentTime(t);
    if (audioRef.current) audioRef.current.currentTime = t;
  }

  function setSpeedAndApply(s: 1 | 1.5 | 2) {
    setSpeed(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  }

  const progress = duration > 0 ? currentTime / duration : 0;
  const isReceiving = !fileRef.bytes;
  const maxAmp = Math.max(...waveform, 0.01);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "260px", maxWidth: "320px" }}>

      {/* Waveform bars */}
      <div style={{ display: "flex", alignItems: "center", gap: "2px", height: "36px", padding: "2px 0" }}>
        {waveform.map((amp, i) => {
          const barProgress = i / BAR_COUNT;
          const isPlayed = barProgress < progress;
          const heightPx = Math.max(3, Math.round((amp / maxAmp) * 32));
          return (
            <div
              key={i}
              style={{
                width: "3px",
                height: `${heightPx}px`,
                background: isPlayed ? GREEN : "#1a2a1a",
                borderRadius: "1px",
                flexShrink: 0,
                transition: playing ? "none" : "background 0.1s",
              }}
            />
          );
        })}
      </div>

      {/* Scrub bar */}
      <input
        type="range"
        min={0}
        max={duration || 1}
        step={0.01}
        value={currentTime}
        onChange={handleScrub}
        disabled={isReceiving || !objectUrl}
        style={{
          width: "100%",
          accentColor: GREEN,
          cursor: isReceiving ? "default" : "pointer",
          height: "3px",
        }}
      />

      {/* Controls row */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Play/pause */}
        <button
          onClick={togglePlay}
          disabled={isReceiving || !objectUrl}
          title={playing ? "Pause" : "Play"}
          style={{
            background: "transparent",
            border: `1px solid ${isReceiving ? MUTED : GREEN}`,
            borderRadius: "2px",
            color: isReceiving ? MUTED : GREEN,
            cursor: isReceiving ? "default" : "pointer",
            fontSize: "12px",
            padding: "4px 8px",
            fontFamily: "var(--font)",
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          {isReceiving ? "…" : playing ? "⏸" : "▶"}
        </button>

        {/* Time */}
        <span style={{ fontSize: "10px", color: MUTED, fontFamily: "var(--font)", flexShrink: 0 }}>
          {isReceiving
            ? `${fileRef.voiceDuration !== undefined ? formatDuration(fileRef.voiceDuration) : "…"}`
            : formatSeconds(playing || currentTime > 0 ? currentTime : duration)
          }
        </span>

        <div style={{ flex: 1 }} />

        {/* Speed selector */}
        <div style={{ display: "flex", gap: "3px" }}>
          {([1, 1.5, 2] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSpeedAndApply(s)}
              disabled={isReceiving}
              style={{
                background: speed === s ? "rgba(0,255,65,0.12)" : "transparent",
                border: `1px solid ${speed === s ? GREEN : "#222"}`,
                borderRadius: "2px",
                color: speed === s ? GREEN : MUTED,
                cursor: isReceiving ? "default" : "pointer",
                fontSize: "10px",
                padding: "2px 5px",
                fontFamily: "var(--font)",
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {isReceiving && (
        <div style={{ fontSize: "10px", color: MUTED, fontStyle: "italic" }}>
          receiving voice note…
        </div>
      )}
    </div>
  );
}
