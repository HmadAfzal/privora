import axios from "axios"

// In Docker: requests go through nginx proxy at /api
// In dev: requests go directly to localhost:8000
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
})

export async function ingestRepo(repoUrl, collectionName = null) {
  const res = await http.post("/ingest", {
    repo_url:        repoUrl,
    collection_name: collectionName,
  })
  return res.data
}

export async function queryRepo(question, collectionName = "privora") {
  const res = await http.post("/query", {
    question,
    collection_name: collectionName,
  })
  return res.data
}

export async function queryStream(question, collectionName, onChunk, onDone, onError) {
  try {
    const response = await fetch(`${BASE_URL}/query/stream`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ question, collection_name: collectionName }),
    })

    if (!response.ok) {
      const err = await response.json()
      onError(err.detail || "Query failed")
      return
    }

    const reader  = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text  = decoder.decode(value)
      const lines = text.split("\n").filter(l => l.startsWith("data: "))

      for (const line of lines) {
        const data = JSON.parse(line.replace("data: ", ""))
        if (data.type === "chunk") onChunk(data.text)
        if (data.type === "done")  onDone(data.sources)
      }
    }
  } catch (e) {
    onError(e.message)
  }
}

export async function deleteRepo(collectionName) {
  const res = await http.post("/delete", { collection_name: collectionName })
  return res.data
}

export async function checkHealth() {
  const res = await http.get("/health")
  return res.data
}

export async function fetchRepos() {
  const res = await http.get("/repos")
  return res.data.repos
}

export async function fetchRepoMeta(collectionName) {
  const res = await http.get(`/repos/meta/${collectionName}`)
  return res.data
}

export async function fetchSettings() {
  const res = await http.get("/settings")
  return res.data
}

export async function saveSettings(settings) {
  const res = await http.post("/settings", settings)
  return res.data
}

export async function reindexAll() {
  const res = await http.post("/reindex-all")
  return res.data
}

export async function clearAll() {
  const res = await http.post("/clear-all")
  return res.data
}