import {
  AbsoluteFill, useCurrentFrame, useVideoConfig,
  interpolate, spring, Sequence, Audio, staticFile, Easing,
} from "remotion";
import { C } from "../constants";
import { ChromaticText } from "../components/ChromaticText";

export const Scene1Pain: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [112, 125], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const titleSpring = spring({ frame, fps, config: { damping: 10, stiffness: 260 }, durationInFrames: 22 });
  const titleY = interpolate(titleSpring, [0, 1], [-150, 0]);

  const count = Math.floor(interpolate(frame, [18, 105], [0, 4782], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  }));

  const chromaIntensity = interpolate(frame, [0, 3, 8], [12, 8, 2], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const showGlitch = frame < 6 || (frame > 20 && frame < 23) || (frame > 51 && frame < 53);
  const glitchShift = (Math.sin(frame * 173.1) * 0.5 + 0.5) * 60 - 30;
  const scanY = (frame * 14) % height;
  const glowR = interpolate(Math.sin(frame / 11), [-1, 1], [0.08, 0.18]);

  const subOpacity = interpolate(frame, [28, 46], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subY = interpolate(frame, [28, 46], [30, 0], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const tollOpacity = interpolate(frame, [16, 32], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const barH = interpolate(frame, [5, 40], [0, 340], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const lineW = interpolate(frame, [35, 65], [0, 300], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: C.void, overflow: "hidden", opacity: fadeIn * fadeOut }}>
      <Audio src={staticFile("impact.wav")} startFrom={0} volume={0.8} />

      <div style={{
        position: "absolute", left: 120, top: "50%",
        transform: "translateY(-50%)",
        width: 900, height: 900, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,45,85," + glowR + ") 0%, transparent 60%)",
        filter: "blur(60px)",
      }} />

      <div style={{
        position: "absolute", left: 0, top: scanY,
        width: "100%", height: 1,
        background: "linear-gradient(90deg, transparent 0%, " + C.red + "88 40%, " + C.red + "88 60%, transparent 100%)",
        opacity: 0.5,
      }} />

      {showGlitch && (
        <>
          <div style={{
            position: "absolute", top: height * 0.33, left: glitchShift,
            width: "85%", height: 24,
            background: C.red + "22", border: "1px solid " + C.red + "55",
          }} />
          <div style={{
            position: "absolute", top: height * 0.6, left: -glitchShift * 0.5,
            width: "60%", height: 10,
            background: C.blue + "22",
          }} />
        </>
      )}

      <div style={{
        position: "absolute", left: 100, top: "50%",
        transform: "translateY(-50%)",
        width: 3, height: barH,
        backgroundColor: C.red,
        boxShadow: "0 0 16px " + C.red + ", 0 0 32px " + C.red + "66",
      }} />

      <AbsoluteFill style={{
        display: "flex", flexDirection: "column",
        justifyContent: "center", paddingLeft: 140,
        paddingRight: 80,
      }}>
        <Sequence from={4} layout="none">
          <div style={{
            opacity: interpolate(frame - 4, [0, 14], [0, 1], { extrapolateRight: "clamp" }),
            display: "flex", alignItems: "center", gap: 14,
            marginBottom: 30,
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              backgroundColor: C.red,
              boxShadow: "0 0 14px " + C.red,
              opacity: interpolate(Math.sin(frame / 6), [-1, 1], [0.4, 1]),
            }} />
            <span style={{
              fontFamily: C.mono, fontSize: 16, letterSpacing: 5,
              color: C.red, textTransform: "uppercase",
            }}>
              CRITICAL ALERT
            </span>
          </div>
        </Sequence>

        <div style={{ transform: "translateY(" + titleY + "px)" }}>
          <ChromaticText
            offset={chromaIntensity}
            style={{
              fontSize: 108,
              fontFamily: C.display,
              fontWeight: 900,
              letterSpacing: -4,
              lineHeight: 1,
              color: C.white,
              whiteSpace: "nowrap",
            }}
          >
            YOUR IDEA IS DYING
          </ChromaticText>
        </div>

        <div style={{
          opacity: subOpacity,
          transform: "translateY(" + subY + "px)",
          marginTop: 24,
          fontSize: 30,
          fontFamily: "Arial, sans-serif",
          color: C.muted,
          letterSpacing: 1,
        }}>
          Every day you don&apos;t ship, someone else does.
        </div>

        <Sequence from={16} layout="none">
          <div style={{
            opacity: interpolate(frame - 16, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
            marginTop: 60,
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 14, marginBottom: 12,
              opacity: tollOpacity,
            }}>
              <div style={{ width: lineW, height: 1, backgroundColor: C.red, boxShadow: "0 0 6px " + C.red }} />
              <span style={{ fontFamily: C.mono, fontSize: 13, letterSpacing: 4, color: C.red }}>
                IDEAS LOST TODAY
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
              <span style={{
                fontSize: 120,
                fontFamily: C.mono,
                fontWeight: 900,
                color: C.red,
                letterSpacing: -4,
                lineHeight: 1,
                textShadow: "0 0 50px " + C.red + "88",
              }}>
                {count.toLocaleString()}
              </span>
            </div>
          </div>
        </Sequence>
      </AbsoluteFill>

      <div style={{
        position: "absolute", bottom: 0, left: 0, height: 4,
        width: interpolate(frame, [0, 50], [0, width], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        }),
        backgroundColor: C.red,
        boxShadow: "0 0 20px " + C.red,
      }} />

      <Sequence from={30} layout="none">
        <div style={{
          position: "absolute", top: 60, right: 120,
          opacity: interpolate(frame - 30, [0, 20], [0, 0.4], { extrapolateRight: "clamp" }),
        }}>
          <div style={{ width: 60, height: 3, backgroundColor: C.red, position: "absolute", top: 0, right: 0 }} />
          <div style={{ width: 3, height: 60, backgroundColor: C.red, position: "absolute", top: 0, right: 0 }} />
          <div style={{ width: 60, height: 3, backgroundColor: C.red, position: "absolute", bottom: 0, left: 0 }} />
          <div style={{ width: 3, height: 60, backgroundColor: C.red, position: "absolute", bottom: 0, left: 0 }} />
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
