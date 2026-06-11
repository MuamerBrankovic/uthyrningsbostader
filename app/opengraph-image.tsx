import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ReLoka — Företagsbostäder i Linköping och Norrköping";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#F8F7F4",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          position: "relative",
        }}
      >
        {/* Topp-etikett */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "9999px",
              background: "#2D7A4F",
            }}
          />
          <div
            style={{
              fontSize: "22px",
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#2D7A4F",
            }}
          >
            Linköping &amp; Norrköping
          </div>
        </div>

        {/* Logo / namn */}
        <div
          style={{
            display: "flex",
            fontSize: "180px",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: "#1a1a1a",
            marginBottom: "32px",
          }}
        >
          <span>Re</span>
          <span style={{ color: "#2D7A4F" }}>Loka</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            fontSize: "44px",
            fontWeight: 500,
            color: "#4b5563",
            lineHeight: 1.2,
            maxWidth: "1000px",
          }}
        >
          Företagsbostäder utan krångel — möblerade, flexibla, en kontaktperson.
        </div>

        {/* Botten-rad */}
        <div
          style={{
            position: "absolute",
            bottom: "70px",
            left: "80px",
            right: "80px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "24px",
            color: "#9ca3af",
            fontWeight: 500,
          }}
        >
          <div style={{ display: "flex" }}>reloka.se</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#2D7A4F",
              fontWeight: 600,
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "9999px",
                background: "#2D7A4F",
              }}
            />
            B2B · Linköping &amp; Norrköping
          </div>
        </div>

        {/* Vänster grön kant */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "16px",
            height: "100%",
            background: "#2D7A4F",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
