import { useEffect, useRef } from "react";
import { tokens as t } from "../../styles/tokens";
import Message from "./Message";

const SUGGESTIONS = [
  "How does authentication work?",
  "Which services depend on Redis?",
  "Explain the overall architecture",
  "What happens when a user logs in?",
  "Where is error handling implemented?",
  "What does the main entry point do?",
];

function EmptyState({ onSuggest }) {
  return (
    <div style={s.empty}>
      <svg
        width="52"
        height="52"
        viewBox="-42 -50 84 100"
        style={{ opacity: 0.1 }}
      >
        <polygon
          points="0,-48 41.6,-24 41.6,14 0,48 -41.6,14 -41.6,-24"
          fill={t.accent}
        />
        <polygon
          points="0,-31 26.8,-15.5 26.8,8.5 0,31 -26.8,8.5 -26.8,-15.5"
          fill={t.bg}
        />
        <polygon
          points="0,-14 12.1,-7 12.1,4 0,14 -12.1,4 -12.1,-7"
          fill={t.accent}
        />
      </svg>

      <div style={s.emptyTitle}>What do you want to know?</div>
      <div style={s.emptySub}>
        Index a repo from the sidebar, then ask anything about it.
      </div>

      <div style={s.suggestions}>
        {SUGGESTIONS.map((q) => (
          <button key={q} style={s.suggestion} onClick={() => onSuggest(q)}>
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function MessageList({ messages, loading, onSuggest, onRetry }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const isEmpty = !messages || messages.length === 0;

  return (
    <div style={s.wrap}>
      {isEmpty ? (
        <EmptyState onSuggest={onSuggest} />
      ) : (
        <>
          {messages.map((msg, i) => (
            <Message
              key={msg.id}
              message={msg}
              onRetry={msg.error ? () => onRetry(msg) : null}
            />
          ))}
          {loading && !messages.some((m) => m.streaming) && (
            <Message isTyping />
          )}
        </>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

const s = {
  wrap: {
    flex: 1,
    overflowY: "auto",
    padding: "24px 24px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  empty: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingTop: 40,
    textAlign: "center",
  },
  emptyTitle: {
    fontFamily: t.raleway,
    fontWeight: 700,
    fontSize: 20,
    color: "rgba(255,255,255,0.35)",
    letterSpacing: "-0.03em",
    marginTop: 8,
  },
  emptySub: {
    fontFamily: t.outfit,
    fontSize: 13,
    color: t.textDim,
    marginBottom: 8,
    maxWidth: 340,
    lineHeight: 1.6,
  },
  suggestions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 7,
    justifyContent: "center",
    maxWidth: 500,
  },
  suggestion: {
    fontFamily: t.mono,
    fontSize: 12,
    color: t.textMuted,
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${t.border}`,
    borderRadius: t.r4,
    padding: "7px 12px",
    cursor: "pointer",
    transition: "all 0.15s",
    textAlign: "left",
  },
};
