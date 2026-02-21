import {
  AbsoluteFill, useCurrentFrame, useVideoConfig,
  interpolate, spring, Sequence, Audio, staticFile, Easing,
} from 'remotion';
import { C } from '../constants';
import { ChromaticText } from '../components/ChromaticText';

const AGENTS = [
  { name: 'ResearchAgent', desc: '26 communities + HN + GitHub', color: '#BF5AF2', frame: 28 },
  { name: 'ValidationAgent', desc: 'AI scoring + market fit', color: '#5E5CE6', frame: 40 },
  { name: 'FrontendAgent', desc: 'Next.js + TypeScript + TailwindCSS', color: '#00D2FF', frame: 52 },
  { name: 'BackendAgent', desc: 'API routes + Zod + real logic', color: '#30D158', frame: 64 },
  { name: 'PMAgent', desc: 'GitHub push + Vercel deploy', color: '#FF9F0A', frame: 76 },
];

export const Scene2Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [100, 115], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const mvpSpring = spring({ frame, fps, config: { damping: 12, stiffness: 200 }, durationInFrames: 28 });
  const mvpY = interpolate(mvpSpring, [0, 1], [100, 0]);
  const factorySpring = spring({ frame: frame - 8, fps, config: { damping: 12, stiffness: 200 }, durationInFrames: 28 });
  const factoryY = interpolate(factorySpring, [0, 1], [100, 0]);
  const ringRot = frame * 0.5;
  const ring2Rot = -frame * 0.3;
  const dividerW = interpolate(frame, [14, 40], [0, 3], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const dividerH = interpolate(frame, [14, 50], [0, 500], {
    easing: Easing.out(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const subtitleOpacity = interpolate(frame, [24, 44], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const glow = interpolate(Math.sin(frame / 12), [-1, 1], [0.1, 0.22]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#040410', overflow: 'hidden', opacity: fadeIn * fadeOut }}>
      <Audio src={staticFile('whoosh.wav')} startFrom={0} volume={0.6} />
      {AGENTS.map((a) => (
        <Sequence key={a.name} from={a.frame} layout="none">
          <Audio src={staticFile('pop.wav')} startFrom={0} volume={0.55} />
        </Sequence>
      ))}
      <div style={{
        position: 'absolute', left: -200, top: '50%', transform: 'translateY(-50%)',
        width: 1000, height: 1000, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(123,47,255,' + glow + ') 0%, transparent 60%)',
        filter: 'blur(80px)',
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: 480,
        transform: 'translate(-50%, -50%) rotate(' + ringRot + 'deg)',
        width: 600, height: 600, borderRadius: '50%',
        border: '1px solid ' + C.violet + '33',
        opacity: interpolate(frame, [10, 30], [0, 1], { extrapolateRight: 'clamp' }),
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: 480,
        transform: 'translate(-50%, -50%) rotate(' + ring2Rot + 'deg)',
        width: 820, height: 820, borderRadius: '50%',
        border: '1px solid ' + C.cyan + '22',
        opacity: interpolate(frame, [15, 35], [0, 1], { extrapolateRight: 'clamp' }),
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 860, height: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: 120,
      }}>
        <Sequence from={6} layout="none">
          <div style={{
            opacity: interpolate(frame - 6, [0, 16], [0, 1], { extrapolateRight: 'clamp' }),
            display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32,
          }}>
            <div style={{
              height: 2, backgroundColor: C.violet,
              boxShadow: '0 0 10px ' + C.violet,
              width: interpolate(frame - 6, [0, 22], [0, 48], { extrapolateRight: 'clamp' }),
            }} />
            <span style={{ fontFamily: C.mono, fontSize: 14, letterSpacing: 5, color: C.violet }}>
              THE SOLUTION
            </span>
          </div>
        </Sequence>
        <div style={{ transform: 'translateY(' + mvpY + 'px)', opacity: mvpSpring }}>
          <div style={{ fontSize: 120, fontFamily: C.display, fontWeight: 900, letterSpacing: -5, lineHeight: 1, color: C.white }}>
            MVP
          </div>
        </div>
        <div style={{ transform: 'translateY(' + factoryY + 'px)', opacity: factorySpring, marginTop: -10 }}>
          <ChromaticText
            offset={interpolate(frame, [8, 20], [8, 1.5], { extrapolateRight: 'clamp' })}
            style={{ fontSize: 120, fontFamily: C.display, fontWeight: 900, letterSpacing: -5, lineHeight: 1, color: C.white }}
          >
            FACTORY
          </ChromaticText>
        </div>
        <div style={{ opacity: subtitleOpacity, marginTop: 30, fontSize: 24, fontFamily: 'Arial, sans-serif', color: C.muted, lineHeight: 1.6 }}>
          5 AI Agents. One mission.
          <span style={{ color: C.cyan, fontWeight: 700, fontFamily: C.mono, display: 'block' }}>
            Research to Build to Deploy.
          </span>
        </div>
      </div>
      <div style={{
        position: 'absolute', left: 860, top: '50%', transform: 'translateY(-50%)',
        width: dividerW, height: dividerH, backgroundColor: C.violet,
        boxShadow: '0 0 18px ' + C.violet + '88',
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 900, width: 980, height: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        gap: 14, paddingRight: 80,
      }}>
        {AGENTS.map((agent) => {
          const agentSpring = spring({
            frame: frame - agent.frame, fps,
            config: { damping: 18, stiffness: 220 }, durationInFrames: 22,
          });
          return (
            <div key={agent.name} style={{
              transform: 'translateX(' + interpolate(agentSpring, [0, 1], [120, 0]) + 'px)',
              opacity: agentSpring,
              display: 'flex', alignItems: 'center', gap: 18,
              background: '#0A0A1A',
              border: '1px solid ' + agent.color + '33',
              borderLeft: '4px solid ' + agent.color,
              borderRadius: 10, padding: '16px 22px',
              boxShadow: '0 0 24px ' + agent.color + '18',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                backgroundColor: agent.color + '22',
                border: '2px solid ' + agent.color + '66',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  backgroundColor: agent.color,
                  boxShadow: '0 0 10px ' + agent.color,
                  opacity: interpolate(Math.sin((frame + agent.frame) / 8), [-1, 1], [0.5, 1]),
                }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: C.mono, fontSize: 15, fontWeight: 700, color: agent.color, letterSpacing: 1 }}>
                  {agent.name}
                </div>
                <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 13, color: C.muted, marginTop: 3 }}>
                  {agent.desc}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', flexShrink: 0, width: 8, height: 8, borderRadius: '50%', backgroundColor: '#30D158', boxShadow: '0 0 8px #30D158' }} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};