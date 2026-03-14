"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { fetchChat, type ChatMessage, type ScenarioContext } from "@/lib/api";
import { Button } from "@/components/ui/Button";

interface AdvisorChatProps {
  scenarioContext: ScenarioContext | null;
  onClose?: () => void;
}

const WELCOME = "Ask about your scenario—affordability, risk, or next steps. Your numbers are included.";

/** Renders assistant message with paragraphs and bullet lists for readability. */
function FormattedMessage({ content }: { content: string }) {
  const blocks = content.split(/\n\n+/).filter((b) => b.trim());
  return (
    <div className="space-y-2 text-left">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        const bulletLines = lines.filter((l) => /^[•\-]\s/.test(l) || /^\d+\.\s/.test(l));
        const hasList = bulletLines.length > 0;
        if (hasList && bulletLines.length === lines.length) {
          return (
            <ul key={i} className="list-disc list-inside space-y-0.5 pl-1">
              {bulletLines.map((line, j) => (
                <li key={j}>{line.replace(/^[•\-]\s/, "").replace(/^\d+\.\s/, "")}</li>
              ))}
            </ul>
          );
        }
        if (hasList) {
          const before = lines.slice(0, lines.findIndex((l) => /^[•\-]\s/.test(l) || /^\d+\.\s/.test(l)));
          const listStart = before.length;
          const listLines = lines.slice(listStart);
          return (
            <div key={i} className="space-y-1.5">
              {before.length > 0 && <p>{before.join(" ")}</p>}
              <ul className="list-disc list-inside space-y-0.5 pl-1">
                {listLines.map((line, j) => (
                  <li key={j}>{line.replace(/^[•\-]\s/, "").replace(/^\d+\.\s/, "")}</li>
                ))}
              </ul>
            </div>
          );
        }
        return <p key={i} className="leading-relaxed">{block.trim()}</p>;
      })}
    </div>
  );
}

export function AdvisorChat({ scenarioContext, onClose }: AdvisorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !scenarioContext || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const nextHistory = [...messages, userMsg];
      const res = await fetchChat(nextHistory, scenarioContext);
      setMessages((prev) => [...prev, res.message]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const hasContext = scenarioContext != null && scenarioContext.home_value > 0;

  return (
    <div
      className="flex flex-col h-full min-h-[320px] max-h-[480px] overflow-hidden"
      style={{ backgroundColor: "var(--color-surface-card)" }}
    >
      <div
        className="flex items-center justify-between border-b pb-4 shrink-0"
        style={{ borderColor: "var(--color-border)" }}
      >
        <h2 className="text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">Advisor</h2>
      </div>

      {!hasContext ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-[15px] text-[var(--color-text-muted)] mb-3 max-w-[280px]">
            Run the calculator and click Calculate first. Your scenario (home value, payment, income) will be used for personalized advice here.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center h-11 min-w-[44px] rounded-[var(--radius-input)] px-5 text-sm font-medium text-white no-underline transition-all duration-150 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-app)]"
            style={{ background: "linear-gradient(90deg, #00C9FF, #00E0FF)" }}
          >
            Go to Calculator
          </Link>
        </div>
      ) : (
        <>
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            {messages.length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)]">{WELCOME}</p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-[var(--radius-input)] px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)]"
                      : "border bg-[var(--color-surface-input)] text-[var(--color-text-primary)]"
                  }`}
                  style={m.role === "assistant" ? { borderColor: "var(--color-border)" } : undefined}
                >
                  {m.role === "assistant" ? (
                    <FormattedMessage content={m.content} />
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div
                  className="rounded-[var(--radius-input)] px-3 py-2 text-sm border text-[var(--color-text-muted)]"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface-input)" }}
                >
                  …
                </div>
              </div>
            )}
            {error && (
              <p className="text-sm text-[var(--color-danger)]">{error}</p>
            )}
          </div>
          <div
            className="p-4 border-t flex gap-2 shrink-0"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface-card)" }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask a question…"
              className="flex-1 min-w-0 h-11 rounded-[var(--radius-input)] border px-4 py-2.5 text-[15px] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface-input)", color: "var(--color-text-primary)" }}
              disabled={loading}
              aria-label="Chat message"
            />
            <Button type="button" onClick={handleSend} disabled={loading || !input.trim()}>
              Send
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
