import { ImageResponse } from "next/og"

export const runtime = "edge"
export const contentType = "image/png"
export const size = {
  width: 1200,
  height: 630,
}

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          background:
            "linear-gradient(135deg, #0f172a 0%, #111827 55%, #1f2937 100%)",
          color: "#f9fafb",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              backgroundColor: "#facc15",
            }}
          />
          Mortal Kombat Dedetizadora
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 70, fontWeight: 800, lineHeight: 1.05 }}>
            Orcamento Rapido
          </div>
          <div style={{ fontSize: 38, color: "#d1d5db", lineHeight: 1.25 }}>
            Controle de pragas profissional em Uberlandia
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 28,
            color: "#e5e7eb",
          }}
        >
          <span>Atendimento especializado</span>
          <span>mortalkombatdedetizadora-site.vercel.app</span>
        </div>
      </div>
    ),
    size,
  )
}
