import { ImageResponse } from "next/og";

export const alt = "NormCore";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        color: "#EAF5F6",
        background:
          "radial-gradient(circle at 75% 30%, #09535B 0, #071827 38%, #050E1B 72%)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 34 }}>
        <div
          style={{
            width: 42,
            height: 42,
            display: "flex",
            transform: "rotate(45deg)",
            border: "7px solid #18D3B5",
            borderRadius: 10,
          }}
        />
        NormCore
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ color: "#62E9D4", fontSize: 26 }}>
          ISO/IEC 27001 Annex A readiness, simplified.
        </div>
        <div style={{ maxWidth: 900, fontSize: 68, lineHeight: 1.04, fontWeight: 700 }}>
          Know what’s missing before the audit does.
        </div>
      </div>
    </div>,
    size,
  );
}
