import { useState } from "react"
import { tokens as t } from "../../styles/tokens"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"

const IconCopy    = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="4.5" y="4.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1.5 8.5V2.5a1 1 0 0 1 1-1h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
const IconRetry   = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5A4.5 4.5 0 1 1 4.5 10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M2 3.5v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
const IconChecked = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 7l3 3 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>

const syntaxTheme = {
  'code[class*="language-"]': {
    color: "rgba(255,255,255,0.80)",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "12px",
    lineHeight: "1.7",
    background: "none",
  },
  'pre[class*="language-"]': { background: "none", margin: 0, padding: 0 },
  comment:    { color: "rgba(255,255,255,0.28)" },
  prolog:     { color: "rgba(255,255,255,0.28)" },
  punctuation:{ color: "rgba(255,255,255,0.45)" },
  keyword:    { color: "#AAFF00" },
  "attr-name":{ color: "#AAFF00" },
  selector:   { color: "#AAFF00" },
  operator:   { color: "rgba(170,255,0,0.65)" },
  string:     { color: "rgba(255,220,100,0.85)" },
  "attr-value":{ color: "rgba(255,220,100,0.85)" },
  number:     { color: "rgba(130,200,255,0.85)" },
  boolean:    { color: "rgba(130,200,255,0.85)" },
  function:   { color: "rgba(255,255,255,0.90)" },
  "class-name":{ color: "rgba(255,255,255,0.90)" },
  variable:   { color: "rgba(255,255,255,0.70)" },
  tag:        { color: "#AAFF00" },
  "builtin":  { color: "rgba(130,200,255,0.85)" },
}

function CodeBlock({ inline, className, children }) {
  const [copied, setCopied] = useState(false)
  const match  = /language-(\w+)/.exec(className || "")
  const lang   = match?.[1] ?? ""
  const code   = String(children).replace(/\n$/, "")

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (inline) {
    return <code style={s.inlineCode}>{children}</code>
  }

  return (
    <div style={s.codeBlock}>
      <div style={s.codeHeader}>
        <span style={s.codeLang}>{lang || "code"}</span>
        <button style={s.codeCopy} onClick={handleCopy}>
          {copied ? <><IconChecked /> Copied</> : <><IconCopy /> Copy</>}
        </button>
      </div>
      <div style={s.codeBody}>
        <SyntaxHighlighter
          language={lang || "text"}
          style={syntaxTheme}
          PreTag="div"
          customStyle={{ margin: 0, padding: 0, background: "transparent", overflow: "auto" }}
          codeTagProps={{ style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 } }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

const mdComponents = {
  code: CodeBlock,
  p:    ({ children }) => <p style={s.mdPara}>{children}</p>,
  ul:   ({ children }) => <ul style={s.mdUl}>{children}</ul>,
  ol:   ({ children }) => <ol style={s.mdOl}>{children}</ol>,
  li:   ({ children }) => <li style={s.mdLi}>{children}</li>,
  h1:   ({ children }) => <h1 style={s.mdH}>{children}</h1>,
  h2:   ({ children }) => <h2 style={{ ...s.mdH, fontSize: 15 }}>{children}</h2>,
  h3:   ({ children }) => <h3 style={{ ...s.mdH, fontSize: 14 }}>{children}</h3>,
  strong:({ children }) => <strong style={{ color: "rgba(255,255,255,0.90)", fontWeight: 600 }}>{children}</strong>,
  em:   ({ children }) => <em style={{ color: "rgba(255,255,255,0.60)", fontStyle: "italic" }}>{children}</em>,
  blockquote: ({ children }) => <blockquote style={s.mdBlockquote}>{children}</blockquote>,
  hr:   () => <hr style={s.mdHr} />,
  a:    ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={s.mdLink}>{children}</a>,
}

function ActionBtn({ onClick, children, color }) {
  return (
    <button style={{ ...s.actionBtn, ...(color ? { color } : {}) }} onClick={onClick}>
      {children}
    </button>
  )
}

function UserMessage({ content }) {
  return (
    <div style={s.userRow}>
      <div style={s.userBubble}>{content}</div>
    </div>
  )
}

function SourceChip({ file, url, score }) {
  return (
    <div style={s.chip} onClick={() => url && window.open(url, "_blank")}>
      <span style={s.chipFile}>↳ {file}</span>
      <span style={s.chipScore}>{score}</span>
    </div>
  )
}

function AssistantMessage({ content, sources, error, streaming, onRetry }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={s.aRow}>
      <div style={s.avatar}>
        <svg width="13" height="13" viewBox="-42 -50 84 100">
          <polygon points="0,-48 41.6,-24 41.6,14 0,48 -41.6,14 -41.6,-24" fill={t.accent}/>
          <polygon points="0,-31 26.8,-15.5 26.8,8.5 0,31 -26.8,8.5 -26.8,-15.5" fill={t.bgSide}/>
          <polygon points="0,-14 12.1,-7 12.1,4 0,14 -12.1,4 -12.1,-7" fill={t.accent}/>
        </svg>
      </div>
      <div style={s.aContent}>
        {error ? (
          <p style={{ ...s.aText, ...s.errText }}>{content}</p>
        ) : (
          <div style={s.mdWrap}>
            <ReactMarkdown components={mdComponents}>
              {content}
            </ReactMarkdown>
            {streaming && (
              <span style={{
                display: "inline-block",
                width: 2,
                height: "1em",
                background: t.accent,
                marginLeft: 2,
                verticalAlign: "text-bottom",
                animation: "pulse 0.8s ease-in-out infinite",
              }}/>
            )}
          </div>
        )}
        {!streaming && (
          <div style={s.actions}>
            <ActionBtn onClick={handleCopy}>
              {copied ? <><IconChecked /> Copied</> : <><IconCopy /> Copy</>}
            </ActionBtn>
            {error && onRetry && (
              <ActionBtn onClick={onRetry} color="rgba(255,180,0,0.7)">
                <IconRetry /> Retry
              </ActionBtn>
            )}
          </div>
        )}
        {sources?.length > 0 && !streaming && (
          <div style={s.sources}>
            <div style={s.sourcesLbl}>SOURCES</div>
            {sources.map((src, i) => (
              <SourceChip key={i} file={src.file} url={src.url} score={src.score} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={s.aRow}>
      <div style={s.avatar}>
        <svg width="13" height="13" viewBox="-42 -50 84 100">
          <polygon points="0,-48 41.6,-24 41.6,14 0,48 -41.6,14 -41.6,-24" fill={t.accent}/>
          <polygon points="0,-31 26.8,-15.5 26.8,8.5 0,31 -26.8,8.5 -26.8,-15.5" fill={t.bgSide}/>
          <polygon points="0,-14 12.1,-7 12.1,4 0,14 -12.1,4 -12.1,-7" fill={t.accent}/>
        </svg>
      </div>
      <div style={s.dots}>
        {[0, 160, 320].map(delay => (
          <span key={delay} style={{ ...s.dot, animationDelay: `${delay}ms` }} />
        ))}
      </div>
    </div>
  )
}

export default function Message({ message, isTyping, onRetry }) {
  if (isTyping) return <TypingIndicator />
  return (
    <div style={{ animation: "fadeUp 0.25s ease forwards" }}>
      {message.role === "user"
        ? <UserMessage content={message.content} />
        : <AssistantMessage
            content={message.content}
            sources={message.sources}
            error={message.error}
            streaming={message.streaming}
            onRetry={onRetry}
          />
      }
    </div>
  )
}

const s = {
  userRow:    { display: "flex", justifyContent: "flex-end" },
  userBubble: { background: "rgba(255,255,255,0.06)", border: `1px solid ${t.border}`, borderRadius: "10px 10px 2px 10px", padding: "11px 15px", fontFamily: t.outfit, fontSize: 14, color: t.textPrimary, lineHeight: 1.6, maxWidth: "70%", whiteSpace: "pre-wrap" },
  aRow:       { display: "flex", gap: 10, alignItems: "flex-start" },
  avatar:     { width: 26, height: 26, borderRadius: t.r4, background: t.accentDim, border: `1px solid ${t.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  aContent:   { flex: 1, maxWidth: "85%" },
  aText:      { fontFamily: t.outfit, fontSize: 14, color: "rgba(255,255,255,0.72)", lineHeight: 1.75, whiteSpace: "pre-wrap" },
  errText:    { color: t.error },
  mdWrap:     { fontFamily: t.outfit, fontSize: 14, color: "rgba(255,255,255,0.72)", lineHeight: 1.75 },
  mdPara:     { margin: "0 0 10px", lineHeight: 1.75 },
  mdUl:       { paddingLeft: 18, margin: "0 0 10px" },
  mdOl:       { paddingLeft: 18, margin: "0 0 10px" },
  mdLi:       { margin: "3px 0", lineHeight: 1.7 },
  mdH:        { fontFamily: t.raleway, fontWeight: 700, fontSize: 16, color: "rgba(255,255,255,0.88)", margin: "14px 0 6px", letterSpacing: "-0.02em" },
  mdBlockquote:{ borderLeft: `2px solid ${t.accentBorder}`, paddingLeft: 12, margin: "8px 0", color: "rgba(255,255,255,0.45)", fontStyle: "italic" },
  mdHr:       { border: "none", borderTop: `1px solid ${t.border}`, margin: "12px 0" },
  mdLink:     { color: t.accent, textDecoration: "none", borderBottom: `1px solid rgba(170,255,0,0.3)` },
  inlineCode: { fontFamily: t.mono, fontSize: 12, color: t.accent, background: "rgba(170,255,0,0.07)", border: `1px solid rgba(170,255,0,0.15)`, borderRadius: 3, padding: "1px 5px" },
  codeBlock:  { margin: "10px 0", borderRadius: t.r6, overflow: "hidden", border: `1px solid ${t.border}`, background: "#0d0d0d" },
  codeHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", background: "rgba(255,255,255,0.03)", borderBottom: `1px solid ${t.border}` },
  codeLang:   { fontFamily: t.mono, fontSize: 10, letterSpacing: "0.08em", color: t.accent, textTransform: "uppercase" },
  codeCopy:   { display: "flex", alignItems: "center", gap: 4, fontFamily: t.mono, fontSize: 10, color: t.textMuted, background: "transparent", border: "none", cursor: "pointer", padding: 0, letterSpacing: "0.04em" },
  codeBody:   { padding: "12px 14px", overflowX: "auto" },
  actions:    { display: "flex", gap: 4, marginTop: 8 },
  actionBtn:  { display: "flex", alignItems: "center", gap: 5, fontFamily: t.mono, fontSize: 10, letterSpacing: "0.04em", color: t.textMuted, background: "transparent", border: `1px solid ${t.border}`, borderRadius: t.r3, padding: "4px 8px", cursor: "pointer", transition: "all 0.15s" },
  sources:    { marginTop: 12, borderTop: `1px solid ${t.border}`, paddingTop: 10 },
  sourcesLbl: { fontFamily: t.mono, fontSize: 9, letterSpacing: "0.14em", color: t.textDim, marginBottom: 6 },
  chip:       { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 9px", background: "rgba(255,255,255,0.025)", border: `1px solid ${t.border}`, borderRadius: t.r3, cursor: "pointer", transition: "background 0.15s", marginBottom: 3 },
  chipFile:   { fontFamily: t.mono, fontSize: 11, color: "rgba(170,255,0,0.65)" },
  chipScore:  { fontFamily: t.mono, fontSize: 10, color: t.textDim },
  dots:       { display: "flex", gap: 5, alignItems: "center", paddingTop: 8 },
  dot:        { width: 6, height: 6, borderRadius: "50%", background: "rgba(170,255,0,0.5)", display: "block", animation: "pulse 1.2s ease-in-out infinite" },
}