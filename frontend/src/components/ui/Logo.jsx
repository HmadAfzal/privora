import { tokens as t } from "../../styles/tokens"

export default function Logo() {
  return (
    <div style={s.wrap}>
      <svg width="22" height="22" viewBox="-42 -50 84 100">
        <polygon points="0,-48 41.6,-24 41.6,14 0,48 -41.6,14 -41.6,-24" fill={t.accent}/>
        <polygon points="0,-31 26.8,-15.5 26.8,8.5 0,31 -26.8,8.5 -26.8,-15.5" fill={t.bgSide}/>
        <polygon points="0,-14 12.1,-7 12.1,4 0,14 -12.1,4 -12.1,-7" fill={t.accent}/>
      </svg>
      <span style={s.text}>privora</span>
      <span style={s.badge}>local</span>
    </div>
  )
}

const s = {
  wrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "18px 14px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    flexShrink: 0,
  },
  text: {
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 800,
    fontSize: 15,
    letterSpacing: "-0.04em",
    color: "#ffffff",
  },
  badge: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 9,
    letterSpacing: "0.10em",
    color: "#AAFF00",
    background: "rgba(170,255,0,0.08)",
    border: "1px solid rgba(170,255,0,0.15)",
    borderRadius: 2,
    padding: "2px 6px",
    marginLeft: "auto",
  },
}