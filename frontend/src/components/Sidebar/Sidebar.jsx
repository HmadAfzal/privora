import { useState } from "react"
import { tokens as t } from "../../styles/tokens"
import Logo from "../ui/Logo"
import ChatList from "./ChatList"
import RepoList from "./RepoList"
import { IconChat, IconRepo } from "../ui/Icons"

const IconSettings = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="6.5" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M6.5 1v1.5M6.5 10.5V12M1 6.5h1.5M10.5 6.5H12M2.6 2.6l1.1 1.1M9.3 9.3l1.1 1.1M2.6 10.4l1.1-1.1M9.3 3.7l1.1-1.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

export default function Sidebar({
  chats, activeChatId, onSelectChat, onNewChat, onDeleteChat, onRenameChat,
  repos, activeRepo, onSelectRepo, onAddRepo, onRemoveRepo,
  indexStatus, setStatus,
  activeView, onViewChange,
}) {
  const [tab, setTab] = useState("chats")

  return (
    <aside style={s.sidebar}>
      <Logo />
      <div style={s.tabs}>
        {[
          { id: "chats", label: "Chats", Icon: IconChat },
          { id: "repos", label: "Repos", Icon: IconRepo },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            style={{ ...s.tab, ...(tab === id && activeView === "main" ? s.tabOn : {}) }}
            onClick={() => { setTab(id); onViewChange("main") }}
          >
            <Icon />
            {label}
          </button>
        ))}
      </div>
      <div style={s.body}>
        {tab === "chats" ? (
          <ChatList
            chats={chats}
            activeChatId={activeChatId}
            onSelect={id => { onSelectChat(id); onViewChange("main") }}
            onNew={() => { onNewChat(); onViewChange("main") }}
            onDelete={onDeleteChat}
            onRename={onRenameChat}
          />
        ) : (
          <RepoList
            repos={repos}
            activeRepo={activeRepo}
            onSelect={onSelectRepo}
            onAdd={onAddRepo}
            onRemove={onRemoveRepo}
            indexStatus={indexStatus}
            setStatus={setStatus}
          />
        )}
      </div>
      <button
        style={{ ...s.settingsBtn, ...(activeView === "settings" ? s.settingsBtnOn : {}) }}
        onClick={() => onViewChange(activeView === "settings" ? "main" : "settings")}
      >
        <IconSettings />
        Settings
      </button>
    </aside>
  )
}

const s = {
  sidebar: {
    width: 252,
    minWidth: 252,
    background: t.bgSide,
    borderRight: `1px solid ${t.border}`,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  tabs: {
    display: "flex",
    padding: "10px 8px 0",
    gap: 3,
    flexShrink: 0,
  },
  tab: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    padding: "6px 0",
    fontFamily: t.mono,
    fontSize: 11,
    letterSpacing: "0.04em",
    color: t.textMuted,
    background: "transparent",
    border: "1px solid transparent",
    borderRadius: t.r4,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  tabOn: {
    color: t.accent,
    background: t.accentDim,
    border: `1px solid ${t.accentBorder}`,
  },
  body: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "10px 8px",
    gap: 8,
    overflow: "hidden",
  },
  settingsBtn: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "12px 14px",
    borderTop: `1px solid ${t.borderMed}`,
    background: "rgba(255,255,255,0.03)",
    border: "none",
    color: t.textSecond,
    fontFamily: t.mono,
    fontSize: 11,
    letterSpacing: "0.04em",
    cursor: "pointer",
    transition: "all 0.15s",
    flexShrink: 0,
    width: "100%",
    textAlign: "left",
  },
  settingsBtnOn: {
    color: t.accent,
    background: t.accentDim,
  },
}