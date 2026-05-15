import { useState } from "react"
import { useChats, useRepos } from "./store/useStore"
import Sidebar from "./components/Sidebar/Sidebar"
import ChatPanel from "./components/Chat/ChatPanel"
import SettingsPanel from "./components/Settings/SettingsPanel"

export default function App() {
  const [activeView, setActiveView] = useState("main")

  const {
    chats,
    activeChat,
    activeChatId,
    setActiveChatId,
    newChat,
    deleteChat,
    appendMessage,
    removeMessage,
    updateMessage,
    setTitle,
  } = useChats()

  const {
    repos,
    activeRepo,
    setActiveRepo,
    addRepo,
    removeRepo,
    indexStatus,
    setStatus,
  } = useRepos()

  function handleClearAll() {
    localStorage.removeItem("privora_repos")
    localStorage.removeItem("privora_chats")
    window.location.reload()
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#080808", overflow: "hidden" }}>
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={newChat}
        onDeleteChat={deleteChat}
        onRenameChat={setTitle}
        repos={repos}
        activeRepo={activeRepo}
        onSelectRepo={setActiveRepo}
        onAddRepo={addRepo}
        onRemoveRepo={removeRepo}
        indexStatus={indexStatus}
        setStatus={setStatus}
        activeView={activeView}
        onViewChange={setActiveView}
      />
      {activeView === "settings" ? (
        <SettingsPanel onClearAll={handleClearAll} />
      ) : (
        <ChatPanel
          activeChat={activeChat}
          activeChatId={activeChatId}
          activeRepo={activeRepo}
          onNewChat={newChat}
          appendMessage={appendMessage}
          removeMessage={removeMessage}
          updateMessage={updateMessage}
          setTitle={setTitle}
        />
      )}
    </div>
  )
}