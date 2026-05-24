import { ImageResponse } from "next/og";

export const alt = "Blue Rift endless tunnel runner preview";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: "#020617",
          color: "#f8fafc",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 78% 30%, rgba(34, 211, 238, 0.35), transparent 260px), linear-gradient(135deg, rgba(251, 77, 255, 0.2), transparent 45%), #020617",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 96,
            top: 94,
            width: 420,
            height: 420,
            border: "12px solid rgba(34, 211, 238, 0.55)",
            borderRadius: "50%",
            boxShadow: "0 0 80px rgba(34, 211, 238, 0.45)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 196,
            top: 190,
            display: "flex",
            width: 140,
            height: 210,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 44,
              height: 170,
              background: "#67e8f9",
              boxShadow: "0 0 48px rgba(103, 232, 249, 0.85)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 84,
              left: 10,
              width: 52,
              height: 48,
              background: "#fb4dff",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 84,
              right: 10,
              width: 52,
              height: 48,
              background: "#fb4dff",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -10,
              width: 42,
              height: 54,
              background: "#bef264",
              boxShadow: "0 0 42px rgba(190, 242, 100, 0.9)",
            }}
          />
        </div>
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: 690,
            paddingLeft: 76,
          }}
        >
          <div
            style={{
              display: "flex",
              marginBottom: 28,
              color: "#a5f3fc",
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: 0,
              textTransform: "uppercase",
            }}
          >
            Endless Tunnel on Ink
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 112,
              fontWeight: 900,
              letterSpacing: 0,
              lineHeight: 0.88,
              textTransform: "uppercase",
            }}
          >
            Blue Rift
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 34,
              maxWidth: 610,
              color: "#cbd5e1",
              fontSize: 34,
              fontWeight: 700,
              lineHeight: 1.25,
            }}
          >
            Dodge blockers, collect energy, save your best run onchain.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
