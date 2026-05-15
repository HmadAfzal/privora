import { useState, useEffect } from "react"
import { tokens as t } from "../../styles/tokens"
import { fetchSettings, saveSettings, reindexAll, clearAll } from "../../api/client"
import { IconSpinner } from "../ui/Icons"

const IconSettings = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="6.5" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M6.5 1v1.5M6.5 10.5V12M1 6.5h1.5M10.5 6.5H12M2.6 2.6l1.1 1.1M9.3 9.3l1.1 1.1M2.6 10.4l1.1-1.1M9.3 3.7l1.1-1.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

function Section({ title, children }) {
  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>{title}</div>
      {children}
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div style={s.field}>
      <div style={s.fieldLeft}>
        <span style={s.fieldLabel}>{label}</span>
        {hint && <span style={s.fieldHint}>{hint}</span>}
      </div>
      <div style={s.fieldRight}>{children}</div>
    </div>
  )
}

function TextInput({ value, onChange, placeholder }) {
  return (
    <input
      style={s.textInput}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}

function SliderField({ value, onChange, min, max, step, display }) {
  return (
    <div style={s.sliderWrap}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={s.slider}
      />
      <span style={s.sliderVal}>{display ?? value}</span>
    </div>
  )
}

function DangerButton({ onClick, loading, children }) {
  return (
    <button style={{ ...s.dangerBtn, opacity: loading ? 0.5 : 1 }} onClick={onClick} disabled={loading}>
      {loading ? <IconSpinner /> : children}
    </button>
  )
}

export default function SettingsPanel({ onClearAll }) {
  const [settings, setSettings]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [reindexing, setReindexing] = useState(false)
  const [clearing, setClearing]     = useState(false)
  const [saved, setSaved]           = useState(false)
  const [reindexResult, setReindexResult] = useState(null)
  const [error, setError]           = useState(null)

  useEffect(() => {
    fetchSettings()
      .then(setSettings)
      .catch(() => setError("Failed to load settings."))
      .finally(() => setLoading(false))
  }, [])

  function update(key, val) {
    setSettings(prev => ({ ...prev, [key]: val }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await saveSettings(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setError("Failed to save settings.")
    } finally {
      setSaving(false)
    }
  }

  async function handleReindex() {
    setReindexing(true)
    setReindexResult(null)
    setError(null)
    try {
      const res = reindexAll()
      setReindexResult(res.results)
    } catch (e) {
      setError(e?.response?.data?.detail || "Reindex failed.")
    } finally {
      setReindexing(false)
    }
  }

  async function handleClearAll() {
    if (!window.confirm("This will delete all indexed repos and chat history. Are you sure?")) return
    setClearing(true)
    setError(null)
    try {
      await clearAll()
      onClearAll?.()
    } catch {
      setError("Failed to clear data.")
    } finally {
      setClearing(false)
    }
  }

  if (loading) {
    return (
      <main style={s.panel}>
        <div style={s.loadingWrap}>
          <IconSpinner />
          <span style={s.loadingText}>Loading settings...</span>
        </div>
      </main>
    )
  }

  return (
    <main style={s.panel}>
      <div style={s.header}>
        <IconSettings />
        <span style={s.headerTitle}>Settings</span>
      </div>

      <div style={s.body}>

        <Section title="Model">
          <Field
            label="Ollama model"
            hint="Must be pulled locally via ollama pull <model>"
          >
            <TextInput
              value={settings.ollama_model}
              onChange={v => update("ollama_model", v)}
              placeholder="e.g. phi3:mini, llama3, mistral"
            />
          </Field>
        </Section>

        <Section title="Retrieval">
          <Field
            label="Similarity threshold"
            hint="Minimum score to show sources. Lower = more results, higher = stricter."
          >
            <SliderField
              value={settings.min_score}
              onChange={v => update("min_score", v)}
              min={0.05} max={0.95} step={0.05}
              display={settings.min_score.toFixed(2)}
            />
          </Field>
          <Field
            label="Top-K chunks"
            hint="How many source chunks are retrieved per query."
          >
            <SliderField
              value={settings.similarity_top_k}
              onChange={v => update("similarity_top_k", v)}
              min={1} max={12} step={1}
            />
          </Field>
        </Section>

        <div style={s.saveRow}>
          <button
            style={{ ...s.saveBtn, opacity: saving ? 0.6 : 1 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <><IconSpinner /> Saving...</> : saved ? "✓ Saved" : "Save settings"}
          </button>
          {error && <span style={s.errorText}>{error}</span>}
        </div>

        <div style={s.divider} />

        <Section title="Data management">
          <div style={s.dataRow}>
            <div style={s.dataInfo}>
              <span style={s.dataLabel}>Re-index all repos</span>
              <span style={s.dataHint}>Re-fetches and re-embeds every indexed repo from GitHub.</span>
            </div>
            <DangerButton onClick={handleReindex} loading={reindexing}>
              Re-index all
            </DangerButton>
          </div>
          {reindexResult && (
            <div style={s.reindexResults}>
              {reindexResult.map((r, i) => (
                <div key={i} style={s.reindexRow}>
                  <span style={{ ...s.reindexStatus, color: r.status === "ok" ? t.accent : "#ff5050" }}>
                    {r.status === "ok" ? "✓" : "✗"}
                  </span>
                  <span style={s.reindexCol}>{r.collection}</span>
                  {r.detail && <span style={s.reindexErr}>{r.detail}</span>}
                </div>
              ))}
            </div>
          )}

          <div style={{ ...s.dataRow, marginTop: 12 }}>
            <div style={s.dataInfo}>
              <span style={s.dataLabel}>Clear all data</span>
              <span style={s.dataHint}>Deletes all indexed repos from ChromaDB. Cannot be undone.</span>
            </div>
            <DangerButton onClick={handleClearAll} loading={clearing}>
              Clear all
            </DangerButton>
          </div>
        </Section>

      </div>
    </main>
  )
}

const s = {
  panel:          { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: t.bg },
  header:         { display: "flex", alignItems: "center", gap: 8, padding: "0 24px", height: 52, borderBottom: `1px solid ${t.border}`, flexShrink: 0 },
  headerTitle:    { fontFamily: t.raleway, fontWeight: 700, fontSize: 14, color: t.textSecond, letterSpacing: "-0.02em" },
  body:           { flex: 1, overflowY: "auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 28, maxWidth: 640 },
  loadingWrap:    { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText:    { fontFamily: t.mono, fontSize: 12, color: t.textMuted },

  section:        { display: "flex", flexDirection: "column", gap: 2 },
  sectionTitle:   { fontFamily: t.mono, fontSize: 10, letterSpacing: "0.12em", color: t.textMuted, textTransform: "uppercase", marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${t.border}` },

  field:          { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid rgba(255,255,255,0.03)`, gap: 24 },
  fieldLeft:      { display: "flex", flexDirection: "column", gap: 3, flex: 1 },
  fieldLabel:     { fontFamily: t.outfit, fontSize: 13, color: t.textPrimary },
  fieldHint:      { fontFamily: t.mono, fontSize: 10, color: t.textMuted, lineHeight: 1.5 },
  fieldRight:     { flexShrink: 0 },

  textInput:      { background: "rgba(255,255,255,0.04)", border: `1px solid ${t.borderMed}`, borderRadius: t.r4, padding: "7px 12px", fontFamily: t.mono, fontSize: 12, color: t.textPrimary, outline: "none", width: 200 },

  sliderWrap:     { display: "flex", alignItems: "center", gap: 10 },
  slider:         { width: 140, accentColor: t.accent, cursor: "pointer" },
  sliderVal:      { fontFamily: t.mono, fontSize: 13, color: t.accent, width: 36, textAlign: "right" },

  saveRow:        { display: "flex", alignItems: "center", gap: 12 },
  saveBtn:        { display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", background: t.accentDim, border: `1px solid ${t.accentBorder}`, borderRadius: t.r4, fontFamily: t.mono, fontSize: 12, color: t.accent, cursor: "pointer", letterSpacing: "0.04em", transition: "all 0.15s" },
  errorText:      { fontFamily: t.mono, fontSize: 11, color: "#ff5050" },

  divider:        { height: 1, background: t.border },

  dataRow:        { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 },
  dataInfo:       { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  dataLabel:      { fontFamily: t.outfit, fontSize: 13, color: t.textPrimary },
  dataHint:       { fontFamily: t.mono, fontSize: 10, color: t.textMuted, lineHeight: 1.5 },
  dangerBtn:      { display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "rgba(255,60,60,0.08)", border: "1px solid rgba(255,60,60,0.20)", borderRadius: t.r4, fontFamily: t.mono, fontSize: 11, color: "rgba(255,100,100,0.85)", cursor: "pointer", flexShrink: 0, letterSpacing: "0.04em", transition: "all 0.15s" },

  reindexResults: { marginTop: 8, display: "flex", flexDirection: "column", gap: 4, padding: "8px 10px", background: "rgba(255,255,255,0.02)", border: `1px solid ${t.border}`, borderRadius: t.r4 },
  reindexRow:     { display: "flex", alignItems: "center", gap: 8 },
  reindexStatus:  { fontFamily: t.mono, fontSize: 12, flexShrink: 0 },
  reindexCol:     { fontFamily: t.mono, fontSize: 11, color: t.textSecond },
  reindexErr:     { fontFamily: t.mono, fontSize: 10, color: "#ff5050" },
}