import {
  AbsoluteFill, useCurrentFrame, useVideoConfig,
  interpolate, spring, Sequence, Audio, staticFile, Easing,
} from 'remotion';
import { C } from '../constants';

const STEPS = [
  { icon: '🔍', label: 'RESEARCH', sub: '26 subreddits + HN', color: '#BF5AF2', activateAt: 16 },
  { icon: '⚡', label: 'VALIDATE', sub: 'AI scores each idea', color: '#7B2FFF', activateAt: 32 },
  { icon: '🔨', label: 'BUILD', sub: 'Full-stack code gen', color: '#00D2FF', activateAt: 48 },
  { icon: '🚀', label: 'DEPLOY', sub: 'GitHub + Vercel', color: '#30D158', activateAt: 64 },
];

export const Scene3Pipeline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [96, 110], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const titleOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [0, 18], [30, 0], {
    easing: Easing.out(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const packetX = interpolate(frame, [68, 105], [200, width - 200], {
    easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const packetOpacity = interpolate(frame, [68, 74, 100, 105], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const glow = interpolate(Math.sin(frame / 10), [-1, 1], [0.08, 0.18]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#030816', overflow: 'hidden', opacity: fadeIn * fadeOut }}>
      <Audio src={staticFile('whoosh.wav')} startFrom={0} volume={0.5} />
      {STEPS.map((s) => (
        <Sequence key={s.label} from={s.activateAt} layout="none">
          <Audio src={staticFile('click.wav')} startFrom={0} volume={0.6} />
        </Sequence>
      ))}
      <div style={{
        position: 'absolute', top: -300, right: -300,
        width: 800, height: 800, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,210,255,' + glow + ') 0%, transparent 60%)',
        filter: 'blur(60px)',
      }} />
      <div style={{
        position: 'absolute', top: 80, left: 0, right: 0, textAlign: 'center',
        opacity: titleOpacity, transform: 'translateY(' + titleY + 'px)',
      }}>
        <div style={{ fontFamily: C.mono, fontSize: 14, letterSpacing: 6, color: C.cyan, marginBottom: 14 }}>
          THE PIPELINE
        </div>
        <div style={{ fontSize: 72, fontFamily: C.display, fontWeight: 900, letterSpacing: -3, color: C.white }}>
          Idea to Live Product
        </div>
      </div>
      <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {STEPS.map((step, i) => {
            const isActive = frame >= step.activateAt + 8;
            const stepSpring = spring({
              frame: frame - step.activateAt, fps,
              config: { damping: 16, stiffness: 200 }, durationInFrames: 24,
            });
            const stepY = interpolate(stepSpring, [0, 1], [60, 0]);
            const checkOpacity = interpolate(
              frame - (step.activateAt + 10), [0, 10], [0, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );
            const activeGlow = isActive ? interpolate(Math.sin((frame + i * 18) / 9), [-1, 1], [20, 40]) : 0;
            return (
              <div key={step.label} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  transform: 'translateY(' + stepY + 'px)',
                  opacity: stepSpring,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  width: 200, position: 'relative',
                }}>
                  <div style={{
                    width: 110, height: 110, borderRadius: '50%',
                    backgroundColor: step.color + '15',
                    border: '2px solid ' + step.color + (isActive ? 'CC' : '44'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 42,
                    boxShadow: isActive ? '0 0 ' + activeGlow + 'px ' + step.color + '66' : 'none',
                  }}>
                    {step.icon}
                  </div>
                  <div style={{
                    position: 'absolute', top: -6, right: 38,
                    width: 28, height: 28, borderRadius: '50%',
                    backgroundColor: '#30D158',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, color: '#000',
                    opacity: checkOpacity,
                    boxShadow: '0 0 12px #30D15888',
                  }}>
                    ✓
                  </div>
                  <div style={{ marginTop: 18, textAlign: 'center' }}>
                    <div style={{
                      fontFamily: C.display, fontSize: 18, fontWeight: 900,
                      letterSpacing: 2, color: isActive ? step.color : C.muted,
                    }}>
                      {step.label}
                    </div>
                    <div style={{ fontFamily: C.mono, fontSize: 13, color: C.muted, marginTop: 6 }}>
                      {step.sub}
                    </div>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', width: 80, flexShrink: 0,
                    opacity: interpolate(frame - (step.activateAt + 14), [0, 12], [0, 1], {
                      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
                    }),
                  }}>
                    <div style={{
                      flex: 1, height: 2,
                      background: 'linear-gradient(90deg, ' + step.color + ', ' + STEPS[i + 1].color + ')',
                    }} />
                    <div style={{
                      width: 0, height: 0,
                      borderTop: '7px solid transparent',
                      borderBottom: '7px solid transparent',
                      borderLeft: '12px solid ' + STEPS[i + 1].color,
                    }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <div style={{
        position: 'absolute', top: '50%', left: packetX,
        transform: 'translate(-50%, -12px)',
        width: 14, height: 14, borderRadius: '50%',
        backgroundColor: C.cyan,
        boxShadow: '0 0 18px ' + C.cyan + ', 0 0 36px ' + C.cyan + '66',
        opacity: packetOpacity,
      }} />
      {[20, 35, 50].map((offset, i) => (
        <div key={i} style={{
          position: 'absolute', top: '50%',
          left: Math.max(200, packetX - offset),
          transform: 'translate(-50%, -12px)',
          width: 8 - i * 2, height: 8 - i * 2, borderRadius: '50%',
          backgroundColor: C.cyan,
          opacity: packetOpacity * (0.4 - i * 0.12),
        }} />
      ))}
      <Sequence from={74} layout="none">
        <div style={{
          position: 'absolute', bottom: 80, left: 0, right: 0, textAlign: 'center',
          opacity: interpolate(frame - 74, [0, 16], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          <span style={{ fontFamily: C.mono, fontSize: 20, color: C.muted }}>
            Fully automated
          </span>
          <span style={{ fontFamily: C.mono, fontSize: 20, color: '#30D158', fontWeight: 700 }}>
            24 / 7
          </span>
          <span style={{ fontFamily: C.mono, fontSize: 20, color: C.muted }}>
            - Zero intervention required
          </span>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};