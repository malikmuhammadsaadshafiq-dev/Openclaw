import { Composition } from "remotion";
import { MVPFactoryVideo } from "./MVPFactoryVideo";

// 15 seconds at 30fps = 450 frames
// TransitionSeries: 125 + 115 + 110 + 90 + 65 - (10+25+10+10) = 450
export const RemotionRoot = () => {
  return (
    <Composition
      id="MVPFactory"
      component={MVPFactoryVideo}
      durationInFrames={450}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
