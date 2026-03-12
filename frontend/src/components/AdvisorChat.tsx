"use client";

import { useState, useRef, useEffect } from "react";
import { fetchChat, type ChatMessage, type ScenarioContext } from "@/lib/api";
import { Button } from "@/components/ui/Button";

interface AdvisorChatProps {
  scenarioContext: ScenarioContext | null;
  onClose?: () => void;
}

const WELCOME = "Ask about your scenario: affordability, risk, or what to do next. I have your numbers.";

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
    <div className="flex flex-col h-full min-h-[320px] max-h-[480px] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
        <h3 className="font-semibold text-gray-900">Advisor chat</h3>
      </div>

      {!hasContext ? (
        <div className="flex-1 flex items-center justify-center p-4 text-center text-sm text-gray-500">
          Run the calculator to get personalized advice. I’ll use your home value, payment, and income to answer questions.
        </div>
      ) : (
        <>
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            {messages.length === 0 && (
              <p className="text-sm text-gray-500">{WELCOME}</p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-[var(--color-primary)] text-white"
                      : "border border-gray-200 bg-gray-50 text-gray-900"
                  }`}
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
                <div className="rounded-lg px-3 py-2 text-sm border border-gray-200 bg-gray-50 text-gray-500">
                  …
                </div>
              </div>
            )}
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
          <div className="p-3 border-t border-gray-200 flex gap-2 shrink-0 bg-white">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask about your scenario…"
              className="flex-1 min-w-0 h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
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
