import { useState, useEffect } from "react"
import { tokens as t } from "../../styles/tokens"
import { IconPlus, IconTrash, IconSpinner } from "../ui/Icons"
import { ingestRepo, deleteRepo, fetchRepoMeta } from "../../api/client"

function formatDate(isoString) {
  if (!isoString) return "—"
  const d = new Date(isoString)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    + " · "
    + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
}

function RepoInfoPanel({ collection }) {
  const [meta, setMeta]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setMeta(null)
    fetchRepoMeta(collection)
      .then(setMeta)
      .catch(() => setMeta(null))
      .finally(() => setLoading(false))
  }, [collection])

  return (
    <div style={s.infoPanel}>
      {loading ? (
        <div style={s.infoLoading}>
          <IconSpinner /> loading stats...
        </div>
      ) : !meta ? (
        <div style={s.infoEmpty}>No metadata available.</div>
      ) : (
        <>
          <div style={s.infoRow}>
            <div style={s.infoStat}>
              <span style={s.infoVal}>{meta.file_count ?? "—"}</span>
              <span style={s.infoLbl}>FILES</span>
            </div>
            <div style={s.infoStat}>
              <span style={s.infoVal}>{meta.chunk_count ?? "—"}</span>
              <span style={s.infoLbl}>CHUNKS</span>
            </div>
          </div>
          <div style={s.infoIndexed}>
            <span style={s.infoIndexedDot} />
            <span style={s.infoIndexedLbl}>indexed</span>
            <span style={s.infoIndexedVal}>{formatDate(meta.indexed_at)}</span>
          </div>
        </>
      )}
    </div>
  )
}

export default function RepoList({ repos, activeRepo, onSelect, onAdd, onRemove, indexStatus, setStatus }) {
  const [input, setInput]       = useState("")
  const [indexing, setIndexing] = useState(false)

  async function handleAdd() {
    const url = input.trim()
    if (!url || repos.find(r => r.url === url)) return
    setIndexing(true)
    setStatus(url, "indexing")
    try {
      const data  = await ingestRepo(url)
      const parts = url.split("/")
      const name  = parts.slice(-2).join("/")
      onAdd({ url, name, collection: data.collection, addedAt: Date.now() })
      setStatus(url, "done")
      setInput("")
    } catch {
      setStatus(url, "error")
    } finally {
      setIndexing(false)
    }
  }

  return (
    <div style={s.wrap}>
      <div style={s.inputRow}>
        <input
          style={s.input}
          placeholder="github.com/owner/repo"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
        />
        <button style={s.addBtn} onClick={handleAdd} disabled={indexing}>
          {indexing ? <IconSpinner /> : <IconPlus />}
        </button>
      </div>
      {indexing && (
        <div style={s.statusLine}>
          <span style={s.statusDot} />
          Indexing repo...
        </div>
      )}
      <div style={s.list}>
        {repos.length === 0 && <p style={s.empty}>No repos indexed yet.</p>}
        {repos.map(repo => {
          const status   = indexStatus[repo.url]
          const isActive = activeRepo?.url === repo.url
          return (
            <div key={repo.url}>
              <div
                style={{ ...s.item, ...(isActive ? s.itemActive : {}) }}
                onClick={() => onSelect(isActive ? null : repo)}
              >
                <div style={s.itemLeft}>
                  <div style={s.repoName}>{repo.name}</div>
                  {status === "error"    && <div style={s.errText}>Index failed</div>}
                  {status === "indexing" && <div style={s.indexingText}>Indexing...</div>}
                </div>
                <div style={s.itemRight}>
                  <span style={{ ...s.dot, ...(isActive ? s.dotActive : {}) }} />
                  <button
                    style={s.iconBtn}
                    onClick={e => {
                      e.stopPropagation()
                      deleteRepo(repo.collection).finally(() => onRemove(repo.url))
                    }}
                  >
                    <IconTrash />
                  </button>
                </div>
              </div>
              {isActive && <RepoInfoPanel collection={repo.collection} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const s = {
  wrap:         { display: "flex", flexDirection: "column", gap: 8, flex: 1, overflow: "hidden" },
  inputRow:     { display: "flex", border: `1px solid ${t.border}`, borderRadius: "5px", overflow: "hidden", background: "rgba(255,255,255,0.02)", flexShrink: 0 },
  input:        { flex: 1, background: "transparent", border: "none", outline: "none", padding: "8px 10px", fontFamily: t.mono, fontSize: 11, color: "rgba(255,255,255,0.6)" },
  addBtn:       { background: "rgba(170,255,0,0.08)", border: "none", borderLeft: `1px solid ${t.border}`, color: t.accent, padding: "0 10px", cursor: "pointer", display: "flex", alignItems: "center" },
  statusLine:   { display: "flex", alignItems: "center", gap: 6, fontFamily: t.mono, fontSize: 10, color: t.accent, letterSpacing: "0.04em", flexShrink: 0 },
  statusDot:    { width: 5, height: 5, borderRadius: "50%", background: t.accent, display: "block", animation: "pulse 1.2s ease-in-out infinite" },
  list:         { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 },
  empty:        { fontFamily: t.mono, fontSize: 11, color: "rgba(255,255,255,0.15)", padding: "10px 4px" },
  item:         { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 10px", borderRadius: t.r4, cursor: "pointer", border: "1px solid transparent", transition: "all 0.15s", gap: 6 },
  itemActive:   { background: "rgba(170,255,0,0.05)", border: "1px solid rgba(170,255,0,0.13)", borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  itemLeft:     { flex: 1, overflow: "hidden" },
  repoName:     { fontFamily: t.mono, fontSize: 11, color: "rgba(255,255,255,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  errText:      { fontFamily: t.mono, fontSize: 10, color: "#ff5050", marginTop: 2 },
  indexingText: { fontFamily: t.mono, fontSize: 10, color: t.accent, marginTop: 2, opacity: 0.7 },
  itemRight:    { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
  dot:          { width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "block", flexShrink: 0 },
  dotActive:    { background: t.accent, animation: "pulse 2s ease-in-out infinite" },
  iconBtn:      { background: "transparent", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" },
  // Info panel
  infoPanel:      { background: "rgba(170,255,0,0.025)", border: "1px solid rgba(170,255,0,0.13)", borderTop: "none", borderRadius: `0 0 ${t.r4} ${t.r4}`, padding: "10px 12px 12px", marginBottom: 4, display: "flex", flexDirection: "column", gap: 10 },
  infoLoading:    { display: "flex", alignItems: "center", gap: 6, fontFamily: t.mono, fontSize: 10, color: t.textDim },
  infoEmpty:      { fontFamily: t.mono, fontSize: 10, color: t.textDim },
  infoRow:        { display: "flex", gap: 8 },
  infoStat:       { flex: 1, display: "flex", flexDirection: "column", gap: 3, background: "rgba(0,0,0,0.25)", border: `1px solid ${t.border}`, borderRadius: t.r4, padding: "8px 10px" },
  infoVal:        { fontFamily: t.mono, fontSize: 16, fontWeight: 500, color: t.accent, lineHeight: 1 },
  infoLbl:        { fontFamily: t.mono, fontSize: 9, letterSpacing: "0.12em", color: t.textMuted, textTransform: "uppercase" },
  infoIndexed:    { display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", background: "rgba(0,0,0,0.20)", borderRadius: t.r3, border: `1px solid ${t.border}` },
  infoIndexedDot: { width: 4, height: 4, borderRadius: "50%", background: t.accent, opacity: 0.5, flexShrink: 0 },
  infoIndexedLbl: { fontFamily: t.mono, fontSize: 9, letterSpacing: "0.10em", color: t.textMuted, textTransform: "uppercase", flexShrink: 0 },
  infoIndexedVal: { fontFamily: t.mono, fontSize: 10, color: t.textSecond, marginLeft: "auto" },
}