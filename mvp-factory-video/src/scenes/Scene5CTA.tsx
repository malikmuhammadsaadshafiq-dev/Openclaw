import {
  AbsoluteFill, useCurrentFrame, useVideoConfig,
  interpolate, spring, Sequence, Audio, staticFile, Easing,
} from 'remotion';
import { C } from '../constants';
import { ChromaticText } from '../components/ChromaticText';

function particle(i: number, frame: number) {
  const seed1 = Math.sin(i * 127.1) * 43758.5;
  const seed2 = Math.sin(i * 311.7) * 43758.5;
  const angle = (seed1 - Math.floor(seed1)) * Math.PI * 2;
  const speed = 2.5 + (seed2 - Math.floor(seed2)) * 5;
  const r = Math.max(0, frame - 2) * speed;
  const colors = [C.violet, C.cyan, C.lime, C.amber, C.red, '#BF5AF2'];
  return {
    x: Math.cos(angle) * r,
    y: Math.sin(angle) * r,
    size: 4 + (seed1 - Math.floor(seed1)) * 8,
    color: colors[i % colors.length],
  };
}

export const Scene5CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const flashOpacity = interpolate(frame, [0, 3, 8], [0.9, 0.3, 0], { extrapolateRight: 'clamp' });

  const line1Spring = spring({ frame, fps, config: { damping: 11, stiffness: 260 }, durationInFrames: 26 });
  const line1Y = interpolate(line1Spring, [0, 1], [-160, 0]);

  const line2Spring = spring({ frame: frame - 4, fps, config: { damping: 11, stiffness: 260 }, durationInFrames: 26 });
  const line2Y = interpolate(line2Spring, [0, 1], [160, 0]);

  const chromaLive = interpolate(frame, [4, 10, 22], [14, 10, 2], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const tagOpacity = interpolate(frame, [24, 38], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const badgeSpring = spring({ frame: frame - 36, fps, config: { damping: 16, stiffness: 200 }, durationInFrames: 22 });
  const glow = interpolate(Math.sin(frame / 8), [-1, 1], [0.12, 0.28]);

  const particleOpacity = interpolate(frame, [0, 6, 55, 65], [0, 1, 0.5, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: C.void, overflow: 'hidden', opacity: fadeIn }}>
      <Audio src={staticFile('rise.wav')} startFrom={0} volume={0.7} />
      <Sequence from={2} layout="none">
        <Audio src={staticFile('impact.wav')} startFrom={0} volume={0.5} />
      </Sequence>

      <AbsoluteFill style={{ backgroundColor: C.white, opacity: flashOpacity, pointerEvents: 'none' }} />

      {Array.from({ length: 40 }).map((_, i) => {
        const p = particle(i, frame);
        return (
          <div key={i} style={{
            position: 'absolute',
            top: height / 2 + p.y - p.size / 2,
            left: width / 2 + p.x - p.size / 2,
            width: p.size, height: p.size,
            borderRadius: '50%',
            backgroundColor: p.color,
            boxShadow: '0 0 ' + p.size * 2 + 'px ' + p.color,
            opacity: particleOpacity,
          }} />
        );
      })}
      {[0, 20, 40].map((offset, i) => {
        const lf = (frame + offset) % 50;
        return (
          <div key={i} style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%) scale(' + interpolate(lf, [0, 50], [0.4, 2.4]) + ')',
            width: 280, height: 280, borderRadius: '50%',
            border: '2px solid ' + [C.violet, C.cyan, C.lime][i],
            opacity: interpolate(lf, [0, 36, 50], [0.8, 0.1, 0]),
          }} />
        );
      })}

      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 900, height: 900, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(123,47,255,' + glow + ') 0%, rgba(0,210,255,' + glow * 0.5 + ') 40%, transparent 65%)',
        filter: 'blur(50px)',
      }} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
        <div style={{ transform: 'translateY(' + line1Y + 'px)', opacity: line1Spring }}>
          <div style={{
            fontSize: 130, fontFamily: C.display, fontWeight: 900,
            letterSpacing: -5, lineHeight: 1, color: C.white, textAlign: 'center',
            textShadow: '0 0 60px rgba(123,47,255,0.4)',
          }}>
            YOUR IDEA
          </div>
        </div>

        <div style={{ transform: 'translateY(' + line2Y + 'px)', opacity: line2Spring, marginTop: 4 }}>
          <ChromaticText
            offset={chromaLive}
            style={{
              fontSize: 130, fontFamily: C.display, fontWeight: 900,
              letterSpacing: -5, lineHeight: 1, color: C.lime,
              textShadow: '0 0 60px ' + C.lime + '66',
            }}
          >
            LIVE
          </ChromaticText>
        </div>

        <div style={{ opacity: tagOpacity, marginTop: 24, fontFamily: C.mono, fontSize: 24, color: C.muted, letterSpacing: 4 }}>
          in minutes - not months
        </div>

        <Sequence from={36} layout="none">
          <div style={{
            marginTop: 44, opacity: badgeSpring,
            transform: 'scale(' + interpolate(badgeSpring, [0, 1], [0.8, 1]) + ')',
            display: 'flex', alignItems: 'center', gap: 14,
            background: '#0A0A18', border: '1px solid ' + C.violet + '55',
            borderRadius: 40, padding: '14px 32px',
            boxShadow: '0 0 30px ' + C.violet + '22',
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              backgroundColor: C.lime, boxShadow: '0 0 12px ' + C.lime,
              opacity: interpolate(Math.sin(frame / 6), [-1, 1], [0.5, 1]),
            }} />
            <span style={{ fontFamily: C.mono, fontSize: 18, color: C.chrome, letterSpacing: 1.5 }}>
              MVP Factory - Powered by Kimi K2.5
            </span>
          </div>
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};