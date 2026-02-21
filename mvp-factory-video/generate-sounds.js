const fs = require('fs');
const path = require('path');
const SR = 44100;

function wav(filename, samples) {
  const d = samples.length * 2;
  const b = Buffer.alloc(44 + d);
  b.write('RIFF',0); b.writeUInt32LE(36+d,4); b.write('WAVE',8);
  b.write('fmt ',12); b.writeUInt32LE(16,16); b.writeUInt16LE(1,20);
  b.writeUInt16LE(1,22); b.writeUInt32LE(SR,24); b.writeUInt32LE(SR*2,28);
  b.writeUInt16LE(2,32); b.writeUInt16LE(16,34);
  b.write('data',36); b.writeUInt32LE(d,40);
  for(let i=0;i<samples.length;i++){
    const s=Math.max(-1,Math.min(1,samples[i]));
    b.writeInt16LE(Math.round(s*32767),44+i*2);
  }
  fs.writeFileSync(filename,b);
}

const pub = path.join(__dirname,'public');
if(!fs.existsSync(pub)) fs.mkdirSync(pub);

// pop.wav – UI pop, 120ms
(()=>{
  const n=Math.round(SR*0.12), s=new Float32Array(n);
  for(let i=0;i<n;i++){const t=i/SR; s[i]=Math.sin(2*Math.PI*900*t)*Math.exp(-38*t)*0.85;}
  wav(path.join(pub,'pop.wav'),s);
})();

// whoosh.wav – 480ms filtered noise sweep
(()=>{
  const n=Math.round(SR*0.48), s=new Float32Array(n);
  let prev=0,seed=42;
  for(let i=0;i<n;i++){
    seed=(seed*1664525+1013904223)>>>0;
    const noise=(seed/2147483648)-1;
    const p=i/n;
    const alpha=0.15+p*0.7;
    prev=alpha*noise+(1-alpha)*prev;
    const amp=p<0.25?p/0.25:1-(p-0.25)/0.75;
    s[i]=prev*amp*0.95;
  }
  wav(path.join(pub,'whoosh.wav'),s);
})();

// impact.wav – heavy bass hit 600ms
(()=>{
  const n=Math.round(SR*0.6), s=new Float32Array(n);
  let seed=9001;
  for(let i=0;i<n;i++){
    const t=i/SR;
    seed=(seed*1664525+1013904223)>>>0;
    const noise=(seed/2147483648)-1;
    const thump=Math.sin(2*Math.PI*52*t)*Math.exp(-6*t);
    const crack=noise*Math.exp(-28*t)*0.35;
    s[i]=(thump+crack)*0.9;
  }
  wav(path.join(pub,'impact.wav'),s);
})();

// chime.wav – success chord 1s
(()=>{
  const n=Math.round(SR*1.0), s=new Float32Array(n);
  for(let i=0;i<n;i++){
    const t=i/SR;
    const env=Math.exp(-3.5*t);
    s[i]=(0.55*Math.sin(2*Math.PI*523*t)+0.3*Math.sin(2*Math.PI*784*t)+0.15*Math.sin(2*Math.PI*1047*t))*env*0.75;
  }
  wav(path.join(pub,'chime.wav'),s);
})();

// rise.wav – frequency chirp 0→800Hz 450ms
(()=>{
  const n=Math.round(SR*0.45), s=new Float32Array(n);
  let phase=0;
  for(let i=0;i<n;i++){
    const t=i/SR, p=t/0.45;
    const freq=180+700*p*p;
    phase+=(2*Math.PI*freq)/SR;
    const env=Math.min(p*6,1)*(1-p*0.2);
    s[i]=Math.sin(phase)*env*0.75;
  }
  wav(path.join(pub,'rise.wav'),s);
})();

// click.wav – tiny tick 50ms
(()=>{
  const n=Math.round(SR*0.05), s=new Float32Array(n);
  for(let i=0;i<n;i++){const t=i/SR; s[i]=Math.sin(2*Math.PI*1400*t)*Math.exp(-90*t)*0.55;}
  wav(path.join(pub,'click.wav'),s);
})();

console.log('✓ 6 sound effects written to public/');
