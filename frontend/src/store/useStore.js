import { useState, useEffect } from "react"
import { fetchRepos } from "../api/client"

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback }
  catch { return fallback }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function genId() {
  return Math.random().toString(36).slice(2, 10)
}


export function useChats() {
  const [chats, setChats] = useState(() => load("privora_chats", []))
  const [activeChatId, setActiveChatId] = useState(null)

  useEffect(() => { save("privora_chats", chats) }, [chats])

  const activeChat = chats.find(c => c.id === activeChatId) ?? null

  function newChat() {
    const chat = {
      id: genId(),
      title: "New chat",
      messages: [],
      createdAt: Date.now(),
    }
    setChats(prev => [chat, ...prev])
    setActiveChatId(chat.id)
    return chat.id
  }

function removeMessage(chatId, messageId) {
  setChats(prev => prev.map(c =>
    c.id === chatId
      ? { ...c, messages: c.messages.filter(m => m.id !== messageId) }
      : c
  ))
}
  function deleteChat(id) {
    setChats(prev => prev.filter(c => c.id !== id))
    if (activeChatId === id) setActiveChatId(null)
  }

  function appendMessage(chatId, message) {
    setChats(prev => prev.map(c =>
      c.id === chatId
        ? { ...c, messages: [...c.messages, message] }
        : c
    ))
  }

  function updateMessage(chatId, messageId, updates) {
  setChats(prev => prev.map(c =>
    c.id === chatId
      ? {
          ...c,
          messages: c.messages.map(m =>
            m.id === messageId ? { ...m, ...updates } : m
          ),
        }
      : c
  ))
}

  function setTitle(chatId, title) {
    setChats(prev => prev.map(c =>
      c.id === chatId ? { ...c, title } : c
    ))
  }

  return {
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
  }
}

export function useRepos() {
  const [repos, setRepos] = useState(() => load("privora_repos", []))
  const [activeRepo, setActiveRepo] = useState(null)
  const [indexStatus, setIndexStatus] = useState({}) 

  useEffect(() => {
    fetchRepos().then(backendRepos => {
      setRepos(prev => {
        const localUrls   = new Set(prev.map(r => r.url))
        const newFromBack = backendRepos.filter(r => !localUrls.has(r.url))
        if (newFromBack.length === 0) return prev
        return [...prev, ...newFromBack.map(r => ({ ...r, addedAt: Date.now() }))]
      })
    }).catch(() => {
    })
  }, [])

  function addRepo(repo) {
    setRepos(prev => [repo, ...prev.filter(r => r.url !== repo.url)])
  }

  function removeRepo(url) {
    setRepos(prev => prev.filter(r => r.url !== url))
    if (activeRepo?.url === url) setActiveRepo(null)
  }

  function setStatus(url, status) {
    setIndexStatus(prev => ({ ...prev, [url]: status }))
  }

  return {
    repos,
    activeRepo,
    setActiveRepo,
    addRepo,
    removeRepo,
    indexStatus,
    setStatus,
  }
}

export function makeMessage(role, content, extras = {}) {
  return {
    id: Math.random().toString(36).slice(2, 10),
    role,
    content,
    createdAt: Date.now(),
    ...extras,
  }
}