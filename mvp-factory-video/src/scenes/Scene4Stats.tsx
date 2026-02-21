import {
  AbsoluteFill, useCurrentFrame, useVideoConfig,
  interpolate, spring, Sequence, Audio, staticFile, Easing,
} from 'remotion';
import { C } from '../constants';

export const Scene4Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [76, 90], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const mvpCount = Math.floor(interpolate(frame, [12, 72], [0, 257], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  }));

  const labelOpacity = interpolate(frame, [14, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const stat2Spring = spring({ frame: frame - 28, fps, config: { damping: 18, stiffness: 200 }, durationInFrames: 22 });
  const stat3Spring = spring({ frame: frame - 38, fps, config: { damping: 18, stiffness: 200 }, durationInFrames: 22 });
  const stat4Spring = spring({ frame: frame - 48, fps, config: { damping: 18, stiffness: 200 }, durationInFrames: 22 });

  const ringScale1 = interpolate(frame % 40, [0, 40], [0.5, 2.5]);
  const ringOp1 = interpolate(frame % 40, [0, 32, 40], [0.7, 0.1, 0]);
  const ringScale2 = interpolate((frame + 13) % 40, [0, 40], [0.5, 2.5]);
  const ringOp2 = interpolate((frame + 13) % 40, [0, 32, 40], [0.7, 0.1, 0]);
  const ringScale3 = interpolate((frame + 26) % 40, [0, 40], [0.5, 2.5]);
  const ringOp3 = interpolate((frame + 26) % 40, [0, 32, 40], [0.7, 0.1, 0]);

  const glow = interpolate(Math.sin(frame / 10), [-1, 1], [0.09, 0.22]);
  const badgeSpring = spring({ frame: frame - 56, fps, config: { damping: 14, stiffness: 220 }, durationInFrames: 22 });

  return (
    <AbsoluteFill style={{ backgroundColor: '#020D04', overflow: 'hidden', opacity: fadeIn * fadeOut }}>
      <Audio src={staticFile('chime.wav')} startFrom={0} volume={0.65} />

      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 1200, height: 1200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(189,255,0,' + glow + ') 0%, transparent 55%)',
        filter: 'blur(90px)',
      }} />

      {[[ringScale1, ringOp1], [ringScale2, ringOp2], [ringScale3, ringOp3]].map(([s, o], i) => (
        <div key={i} style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%) scale(' + s + ')',
          width: 340, height: 340, borderRadius: '50%',
          border: '1.5px solid ' + C.lime,
          opacity: o as number,
        }} />
      ))}

      <div style={{ position: 'absolute', top: 80, left: 0, right: 0, textAlign: 'center', opacity: labelOpacity }}>
        <span style={{ fontFamily: C.mono, fontSize: 14, letterSpacing: 6, color: C.lime }}>
          SOCIAL PROOF
        </span>
      </div>
      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 4,
          opacity: interpolate(frame, [10, 24], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          <span style={{
            fontSize: 200, fontFamily: C.display, fontWeight: 900,
            letterSpacing: -10, lineHeight: 1, color: C.lime,
            textShadow: '0 0 80px ' + C.lime + '66, 0 0 160px ' + C.lime + '33',
          }}>
            {mvpCount}
          </span>
          <span style={{ fontSize: 80, fontFamily: C.display, fontWeight: 900, color: C.lime + '88' }}>+</span>
        </div>
        <div style={{
          fontFamily: C.mono, fontSize: 22, letterSpacing: 5,
          color: C.muted, textTransform: 'uppercase', marginTop: -16,
          opacity: interpolate(frame, [16, 32], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          MVPs Shipped and Live
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 50 }}>
          {[
            { val: '24/7', label: 'ALWAYS BUILDING', sp: stat2Spring, color: C.cyan },
            { val: '100%', label: 'AUTO-DEPLOYED', sp: stat3Spring, color: C.amber },
            { val: '15+', label: 'PRODUCT TYPES', sp: stat4Spring, color: '#BF5AF2' },
          ].map(({ val, label, sp, color }) => (
            <div key={label} style={{
              opacity: sp,
              transform: 'scale(' + interpolate(sp, [0, 1], [0.7, 1]) + ')',
              background: '#050F07',
              border: '1px solid ' + color + '44',
              borderTop: '3px solid ' + color,
              borderRadius: 12, padding: '22px 36px',
              textAlign: 'center', minWidth: 200,
              boxShadow: '0 0 28px ' + color + '18',
            }}>
              <div style={{
                fontSize: 52, fontFamily: C.display, fontWeight: 900,
                color, letterSpacing: -2,
                textShadow: '0 0 20px ' + color + '55',
              }}>{val}</div>
              <div style={{ fontFamily: C.mono, fontSize: 12, letterSpacing: 3, color: C.muted, marginTop: 8 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
        <Sequence from={56} layout="none">
          <div style={{
            display: 'flex', gap: 16, marginTop: 32,
            opacity: badgeSpring,
            transform: 'scale(' + interpolate(badgeSpring, [0, 1], [0.8, 1]) + ')',
          }}>
            {['GitHub', 'Vercel'].map((name) => (
              <div key={name} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#080F0A', border: '1px solid #1E2E1E',
                borderRadius: 30, padding: '10px 26px',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  backgroundColor: '#30D158', boxShadow: '0 0 8px #30D158',
                  opacity: interpolate(Math.sin(frame / 7), [-1, 1], [0.4, 1]),
                }} />
                <span style={{ fontFamily: C.mono, fontSize: 16, color: C.white, fontWeight: 700 }}>{name}</span>
              </div>
            ))}
          </div>
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};