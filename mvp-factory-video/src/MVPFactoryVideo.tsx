import {
  TransitionSeries,
  linearTiming,
  springTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { Scene1Pain } from "./scenes/Scene1Pain";
import { Scene2Solution } from "./scenes/Scene2Solution";
import { Scene3Pipeline } from "./scenes/Scene3Pipeline";
import { Scene4Stats } from "./scenes/Scene4Stats";
import { Scene5CTA } from "./scenes/Scene5CTA";

// Total = 125 + 115 + 110 + 90 + 65 - 10 - 25 - 10 - 10 = 450 frames = 15s
export const MVPFactoryVideo = () => {
  return (
    <TransitionSeries>
      {/* Scene 1: THE PAIN (4.17s) */}
      <TransitionSeries.Sequence durationInFrames={125}>
        <Scene1Pain />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 10 })}
      />

      {/* Scene 2: THE SOLUTION (3.83s) */}
      <TransitionSeries.Sequence durationInFrames={115}>
        <Scene2Solution />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={springTiming({
          config: { damping: 200 },
          durationInFrames: 25,
        })}
      />

      {/* Scene 3: THE PIPELINE (3.67s) */}
      <TransitionSeries.Sequence durationInFrames={110}>
        <Scene3Pipeline />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={wipe({ direction: "from-left" })}
        timing={linearTiming({ durationInFrames: 10 })}
      />

      {/* Scene 4: SOCIAL PROOF (3s) */}
      <TransitionSeries.Sequence durationInFrames={90}>
        <Scene4Stats />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 10 })}
      />

      {/* Scene 5: THE CTA (2.17s) */}
      <TransitionSeries.Sequence durationInFrames={65}>
        <Scene5CTA />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
