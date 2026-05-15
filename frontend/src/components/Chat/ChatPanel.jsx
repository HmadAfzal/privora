import { useState } from "react"
import { tokens as t } from "../../styles/tokens"
import MessageList from "./MessageList"
import InputBar from "./InputBar"
import { queryRepo, queryStream } from "../../api/client"
import { makeMessage } from "../../store/useStore"

export default function ChatPanel({
  activeChat,
  activeChatId,
  activeRepo,
  onNewChat,
  appendMessage,
  removeMessage,
  updateMessage,
  setTitle,
}) {
  const [input, setInput]   = useState("")
  const [loading, setLoading] = useState(false)

  function handleSuggest(q) {
    setInput(q)
  }

async function handleSend() {
  const q = input.trim()
  if (!q || loading) return

  let chatId = activeChatId
  if (!chatId) chatId = onNewChat()

  const userMsg = makeMessage("user", q)
  appendMessage(chatId, userMsg)

  if (!activeChat || activeChat.messages.length === 0) {
    setTitle(chatId, q.slice(0, 42))
  }

  setInput("")
  setLoading(true)

  const assistantMsg = makeMessage("assistant", "", { sources: [], streaming: true })
  appendMessage(chatId, assistantMsg)

  let fullText = ""

  await queryStream(
    q,
   activeRepo?.collection ?? "privora",
    (chunk) => {
      fullText += chunk
      updateMessage(chatId, assistantMsg.id, { content: fullText, streaming: true })
    },
    (sources) => {
      updateMessage(chatId, assistantMsg.id, { content: fullText, sources, streaming: false })
      setLoading(false)
    },
    (errText) => {
      updateMessage(chatId, assistantMsg.id, {
        content: "Something went wrong. " + errText,
        sources: [],
        error: true,
        streaming: false,
      })
      setLoading(false)
    }
  )
}

async function handleRetry(failedMsg) {
  const messages = activeChat?.messages ?? []
  const idx      = messages.findIndex(m => m.id === failedMsg.id)
  const userMsg  = messages[idx - 1]
  if (!userMsg) return

  removeMessage(activeChatId, failedMsg.id)

  const retryMsg = makeMessage("assistant", "", { sources: [], streaming: true })
  appendMessage(activeChatId, retryMsg)

  setLoading(true)
  let fullText = ""

  await queryStream(
    userMsg.content,
    activeRepo?.collection ?? "privora",
    (chunk) => {
      fullText += chunk
      updateMessage(activeChatId, retryMsg.id, {
        content: fullText,
        streaming: true,
      })
    },
    (sources) => {
      updateMessage(activeChatId, retryMsg.id, {
        content: fullText,
        sources,
        streaming: false,
      })
      setLoading(false)
    },
    (errText) => {
      updateMessage(activeChatId, retryMsg.id, {
        content: "Failed again. " + errText,
        sources: [],
        error: true,
        streaming: false,
      })
      setLoading(false)
    }
  )
}

  const messages = activeChat?.messages ?? []

  return (
    <main style={s.panel}>

      <div style={s.header}>
        <span style={s.headerTitle}>
          {activeChat ? activeChat.title : "Ask anything about your codebase"}
        </span>

        {activeRepo && (
          <div style={s.repoTag}>
            <span style={s.tagDot} />
            <span style={s.tagText}>{activeRepo.name}</span>
          </div>
        )}
      </div>

      <MessageList
        messages={messages}
        loading={loading}
        onSuggest={handleSuggest}
        onRetry={handleRetry}
      />

      <InputBar
        value={input}
        onChange={setInput}
        onSend={handleSend}
        loading={loading}
        hasRepo={!!activeRepo}
      />

    </main>
  )
}

const s = {
  panel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    background: t.bg,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    height: 52,
    borderBottom: `1px solid ${t.border}`,
    flexShrink: 0,
    gap: 12,
  },
  headerTitle: {
    fontFamily: t.raleway,
    fontWeight: 700,
    fontSize: 14,
    color: t.textSecond,
    letterSpacing: "-0.02em",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  repoTag: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "4px 10px",
    background: t.accentDim,
    border: `1px solid ${t.accentBorder}`,
    borderRadius: t.r3,
    flexShrink: 0,
  },
  tagDot: {
    width: 4,
    height: 4,
    borderRadius: "50%",
    background: t.accent,
    display: "block",
    animation: "pulse 2s ease-in-out infinite",
  },
  tagText: {
    fontFamily: t.mono,
    fontSize: 10,
    color: t.accent,
    letterSpacing: "0.05em",
  },
}