import { useState } from "react"
import { tokens as t } from "../../styles/tokens"
import { IconTrash, IconCheck, IconX, IconPlus } from "../ui/Icons"

export default function ChatList({ chats, activeChatId, onSelect, onNew, onDelete, onRename }) {
  const [confirmId, setConfirmId]   = useState(null)
  const [editingId, setEditingId]   = useState(null)
  const [editValue, setEditValue]   = useState("")

  function startEdit(e, chat) {
    e.stopPropagation()
    setEditingId(chat.id)
    setEditValue(chat.title)
  }

  function commitEdit(id) {
    if (editValue.trim()) onRename(id, editValue.trim())
    setEditingId(null)
  }

  return (
    <div style={s.wrap}>
      <button style={s.newBtn} onClick={onNew}>
        <IconPlus />
        New chat
      </button>

      <div style={s.list}>
        {chats.length === 0 && (
          <p style={s.empty}>No chats yet.</p>
        )}

        {chats.map(chat => (
          <div
            key={chat.id}
            style={{ ...s.item, ...(activeChatId === chat.id ? s.itemActive : {}) }}
            onClick={() => onSelect(chat.id)}
          >
            {editingId === chat.id ? (
              <input
                style={s.editInput}
                value={editValue}
                autoFocus
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") commitEdit(chat.id)
                  if (e.key === "Escape") setEditingId(null)
                }}
                onBlur={() => commitEdit(chat.id)}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span
                style={s.label}
                onDoubleClick={e => startEdit(e, chat)}
                title="Double-click to rename"
              >
                {chat.title}
              </span>
            )}

            {confirmId === chat.id ? (
              <div style={s.confirm} onClick={e => e.stopPropagation()}>
                <button style={s.btnYes} onClick={() => { onDelete(chat.id); setConfirmId(null) }}>
                  <IconCheck />
                </button>
                <button style={s.btnNo} onClick={() => setConfirmId(null)}>
                  <IconX />
                </button>
              </div>
            ) : (
              <button
                style={s.iconBtn}
                onClick={e => { e.stopPropagation(); setConfirmId(chat.id) }}
              >
                <IconTrash />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const s = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    flex: 1,
    overflow: "hidden",
  },
  newBtn: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "8px 12px",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${t.border}`,
    borderRadius: t.r4,
    color: t.textSecond,
    fontFamily: t.mono,
    fontSize: 11,
    cursor: "pointer",
    width: "100%",
    transition: "all 0.15s",
    flexShrink: 0,
  },
  list: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  empty: {
    fontFamily: t.mono,
    fontSize: 11,
    color: t.textDim,
    padding: "10px 4px",
  },
  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 10px",
    borderRadius: t.r4,
    cursor: "pointer",
    transition: "background 0.15s",
    gap: 6,
    border: "1px solid transparent",
  },
  itemActive: {
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${t.border}`,
  },
  label: {
    fontFamily: t.outfit,
    fontSize: 13,
    color: t.textSecond,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
    cursor: "text",
  },
  editInput: {
    flex: 1,
    background: "rgba(255,255,255,0.06)",
    border: `1px solid ${t.accentBorder}`,
    borderRadius: t.r3,
    padding: "3px 7px",
    fontFamily: t.outfit,
    fontSize: 13,
    color: t.textPrimary,
    outline: "none",
  },
  iconBtn: {
    background: "transparent",
    border: "none",
    color: t.textDim,
    cursor: "pointer",
    padding: 2,
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
  confirm: {
    display: "flex",
    gap: 3,
    flexShrink: 0,
  },
  btnYes: {
    background: "rgba(255,80,80,0.12)",
    border: "1px solid rgba(255,80,80,0.25)",
    color: "#ff5050",
    borderRadius: t.r3,
    padding: "2px 5px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  btnNo: {
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${t.border}`,
    color: t.textMuted,
    borderRadius: t.r3,
    padding: "2px 5px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
}