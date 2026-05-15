import { useRef } from "react"
import { tokens as t } from "../../styles/tokens"
import { IconSend, IconSpinner } from "../ui/Icons"

export default function InputBar({ value, onChange, onSend, loading, hasRepo }) {
  const ref = useRef(null)

function handleKey(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault()
    if (!hasRepo || !value.trim() || loading) return
    onSend()
  }
}
  function handleChange(e) {
    onChange(e.target.value)
    e.target.style.height = "auto"
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px"
  }

  function handleSend() {
    onSend()
    if (ref.current) ref.current.style.height = "auto"
  }

 const disabled = loading || !value.trim() || !hasRepo

  return (
    <div style={s.wrap}>
      {!hasRepo && (
        <div style={s.warn}>
          ⚠ No repo selected — go to the Repos tab and index one first
        </div>
      )}

      <div style={s.box}>
        <textarea
          ref={ref}
          style={s.textarea}
          placeholder="Ask anything about your codebase..."
          value={value}
          rows={1}
          onChange={handleChange}
          onKeyDown={handleKey}
        />
        <button
          style={{ ...s.sendBtn, opacity: disabled ? 0.3 : 1 }}
          onClick={handleSend}
          disabled={disabled}
        >
          {loading ? <IconSpinner /> : <IconSend />}
        </button>
      </div>

      <div style={s.hint}>
        Enter to send · Shift+Enter for new line
      </div>
    </div>
  )
}

const s = {
  wrap: {
    padding: "10px 24px 18px",
    borderTop: `1px solid ${t.border}`,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  warn: {
    fontFamily: t.mono,
    fontSize: 11,
    color: "rgba(255,180,0,0.55)",
    letterSpacing: "0.02em",
  },
  box: {
    display: "flex",
    alignItems: "flex-end",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${t.borderMed}`,
    borderRadius: t.r8,
    overflow: "hidden",
    transition: "border-color 0.15s",
  },
  textarea: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    padding: "12px 14px",
    fontFamily: t.outfit,
    fontSize: 14,
    color: t.textPrimary,
    lineHeight: 1.5,
    minHeight: 46,
    maxHeight: 140,
    overflowY: "auto",
    resize: "none",
  },
  sendBtn: {
    background: "transparent",
    border: "none",
    borderLeft: `1px solid ${t.border}`,
    color: t.accent,
    padding: "0 15px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    alignSelf: "stretch",
    transition: "opacity 0.15s",
  },
  hint: {
    fontFamily: t.mono,
    fontSize: 10,
    color: t.textDim,
    letterSpacing: "0.04em",
  },
}