import React from "react";

type Props = {
  children: React.ReactNode;
  style?: React.CSSProperties;
  offset?: number;
};

export const ChromaticText: React.FC<Props> = ({ children, style = {}, offset = 4 }) => (
  <div style={{ position: "relative", ...style }}>
    <div style={{
      position: "absolute", top: 0, left: 0,
      color: "#FF2D55", opacity: 0.75,
      transform: `translateX(${-offset}px)`,
      ...style, background: "none",
    }}>
      {children}
    </div>
    <div style={{
      position: "absolute", top: 0, left: 0,
      color: "#0A84FF", opacity: 0.75,
      transform: `translateX(${offset}px)`,
      ...style, background: "none",
    }}>
      {children}
    </div>
    <div style={{ position: "relative", ...style }}>{children}</div>
  </div>
);
