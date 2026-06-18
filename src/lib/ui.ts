/**
 * Shared design tokens for all dashboard pages.
 * Import what you need — all values are plain CSSProperties objects.
 */
import type { CSSProperties } from "react";

// ─── Colors ───────────────────────────────────────────────────────────────────
export const ACCENT  = "#c8ff00";
export const BG      = "#0a0a10";
export const C_WHITE = "#ffffff";
export const C_MUTED = "rgba(255,255,255,0.45)";
export const C_DIM   = "rgba(255,255,255,0.30)";
export const C_LABEL = "rgba(255,255,255,0.38)";

// ─── Card ─────────────────────────────────────────────────────────────────────
export const CARD: CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  borderRadius: 12,
};

// ─── Typography ───────────────────────────────────────────────────────────────
/** 11px uppercase label — use for section titles and column headers */
export const LABEL: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: C_LABEL,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  margin: 0,
};

/** Page h1 */
export const H1: CSSProperties = {
  fontSize: 22,
  fontWeight: 600,
  color: C_WHITE,
  margin: 0,
};

/** Subtitle under h1 */
export const SUBTITLE: CSSProperties = {
  fontSize: 14,
  color: C_MUTED,
  margin: "6px 0 0",
};

// ─── Buttons ──────────────────────────────────────────────────────────────────
export const BTN_PRIMARY: CSSProperties = {
  background: ACCENT,
  color: "#000",
  border: "none",
  borderRadius: 8,
  padding: "9px 18px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export const BTN_SECONDARY: CSSProperties = {
  background: "rgba(255,255,255,0.07)",
  color: "rgba(255,255,255,0.70)",
  border: "none",
  borderRadius: 8,
  padding: "9px 18px",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export const BTN_ICON: CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 6,
  borderRadius: 6,
  color: "rgba(255,255,255,0.35)",
};

// ─── Form inputs ──────────────────────────────────────────────────────────────
export const INPUT: CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 13,
  color: "white",
  outline: "none",
  colorScheme: "dark" as CSSProperties["colorScheme"],
  boxSizing: "border-box" as CSSProperties["boxSizing"],
  width: "100%",
};

// ─── Page layout ──────────────────────────────────────────────────────────────
/** Standard page padding for dashboard content pages */
export const PAGE_PAD: CSSProperties = {
  padding: "32px 40px",
};

/** Standard page header block (below the pad wrapper) */
export const PAGE_HEADER_MB: CSSProperties = {
  marginBottom: 32,
};
