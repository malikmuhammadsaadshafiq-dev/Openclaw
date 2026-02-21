
const fs = require('fs');
const base = 'C:/test';
function scene2() {
  let s = '';
  s += "  const fadeIn = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });\n";
  return s;
}
fs.writeFileSync(base + '/test.tsx', scene2());
