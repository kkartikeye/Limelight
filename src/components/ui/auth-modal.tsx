"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DL } from "@/lib/design-tokens";
import { useUser } from "@/lib/hooks/use-user";
import DLLogo from "./dl-logo";

interface AuthModalProps {
  onClose: () => void;
}

type Stage = "input" | "sent" | "error";

export default function AuthModal({ onClose }: AuthModalProps) {
  const { signInWithMagicLink } = useUser();
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<Stage>("input");
  const [errorMsg, setErrorMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = email.trim();
      if (!trimmed.includes("@")) return;

      setBusy(true);
      const { error } = await signInWithMagicLink(trimmed);
      setBusy(false);

      if (error) {
        setErrorMsg(error.message ?? "Something went wrong. Please try again.");
        setStage("error");
      } else {
        setStage("sent");
      }
    },
    [email, signInWithMagicLink]
  );

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(24,22,19,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "tooltip-fade-in 0.18s ease-out both",
      }}
    >
      {/* Card — stop propagation so clicks inside don't close the modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          maxWidth: "calc(100vw - 32px)",
          background: DL.PAPER,
          borderRadius: 20,
          padding: "40px 40px 36px",
          boxShadow: "0 32px 80px rgba(24,22,19,0.22), 0 2px 8px rgba(24,22,19,0.08)",
          position: "relative",
          fontFamily: DL.SANS,
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: 18, right: 18,
            background: "none", border: "none", cursor: "pointer",
            color: DL.DIM, padding: 6, borderRadius: 8,
            lineHeight: 1,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = DL.INK)}
          onMouseLeave={(e) => (e.currentTarget.style.color = DL.DIM)}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
          </svg>
        </button>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <DLLogo size={22} />
          <span style={{ fontFamily: DL.DISPLAY, fontSize: 20, fontWeight: 500, letterSpacing: -0.4, color: DL.INK }}>
            Limelight
          </span>
        </div>

        {stage === "sent" ? (
          /* ── Confirmation ── */
          <div style={{ textAlign: "center", paddingTop: 8 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 999, margin: "0 auto 18px",
              background: DL.CORAL_50, border: `1.5px solid ${DL.CORAL_BD}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={DL.CORAL} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"/>
              </svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: DL.INK, margin: "0 0 8px" }}>
              Check your inbox
            </p>
            <p style={{ fontSize: 13, color: DL.DIM, lineHeight: 1.5, margin: "0 0 24px" }}>
              We sent a magic link to <strong style={{ color: DL.INK }}>{email}</strong>.
              Click it to sign in — no password needed.
            </p>
            <button
              onClick={onClose}
              style={{
                width: "100%", padding: "11px 0", borderRadius: 999,
                background: DL.INK, color: DL.PAPER,
                border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600, fontFamily: DL.SANS,
              }}
            >
              Got it
            </button>
          </div>
        ) : (
          /* ── Sign-in form ── */
          <>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: DL.INK, margin: "0 0 6px", fontFamily: DL.SANS }}>
              Sign in
            </h2>
            <p style={{ fontSize: 13, color: DL.DIM, margin: "0 0 28px", lineHeight: 1.5 }}>
              Save your watchlist and reading history across devices. No password — we&rsquo;ll email you a magic link.
            </p>

            {stage === "error" && (
              <div style={{
                padding: "10px 14px", borderRadius: 10, marginBottom: 18,
                background: "#fff0ea", border: `1px solid ${DL.CORAL_BD}`,
                fontSize: 12, color: DL.CORAL,
              }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <label style={{ fontSize: 11, fontWeight: 600, color: DL.DIM, letterSpacing: 0.06, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Email
              </label>
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "11px 14px", borderRadius: 12,
                  border: `1.5px solid ${DL.RULE_2}`,
                  background: DL.CARD,
                  fontFamily: DL.SANS, fontSize: 14, color: DL.INK,
                  outline: "none", marginBottom: 14,
                  transition: "border-color 0.12s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = DL.CORAL)}
                onBlur={(e) => (e.currentTarget.style.borderColor = DL.RULE_2)}
              />
              <button
                type="submit"
                disabled={busy || email.trim().length < 5}
                style={{
                  width: "100%", padding: "11px 0", borderRadius: 999,
                  background: DL.CORAL, color: "#fff",
                  border: "none", cursor: busy ? "wait" : "pointer",
                  fontSize: 13, fontWeight: 600, fontFamily: DL.SANS,
                  opacity: busy || email.trim().length < 5 ? 0.5 : 1,
                  transition: "opacity 0.12s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {busy ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    Sending…
                  </>
                ) : (
                  "Send magic link"
                )}
              </button>
            </form>

            <p style={{ marginTop: 20, textAlign: "center", fontSize: 11, color: DL.DIM_2 }}>
              By signing in you agree to our terms. Your email is only used for auth.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
