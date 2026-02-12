# Frontend Skills Reference - The Complete Guide

> A comprehensive, framework-agnostic reference covering animations, design patterns, typography, UX intuition, and creative web experiences. Drop this into any project for instant access to modern frontend techniques.

---

## Table of Contents

- [1. CSS Animations & Motion](#1-css-animations--motion)
- [2. UI Design Patterns](#2-ui-design-patterns)
- [3. Typography & Text Design](#3-typography--text-design)
- [4. UX Intuition & Interaction Design](#4-ux-intuition--interaction-design)
- [5. Creative Web & Visual Effects](#5-creative-web--visual-effects)
- [6. Performance & Best Practices](#6-performance--best-practices)
- [7. Library Reference](#7-library-reference)

---

# 1. CSS Animations & Motion

## 1.1 CSS Transitions

The simplest way to animate between states.

```css
.button {
  background: #3b82f6;
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.button:hover {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(59,130,246,0.3);
}

/* Transition individual properties for control */
.card {
  transition:
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.3s ease,
    background 0.2s ease;
}
```

**Transition-safe properties (GPU-accelerated):** `transform`, `opacity`, `filter`, `clip-path`
**Avoid transitioning:** `width`, `height`, `top`, `left`, `margin`, `padding` (trigger layout)

## 1.2 CSS Keyframe Animations

```css
/* Fade in and slide up */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* Staggered children */
.stagger-list > * {
  animation: fade-in-up 0.5s ease both;
}
.stagger-list > *:nth-child(1) { animation-delay: 0.0s; }
.stagger-list > *:nth-child(2) { animation-delay: 0.1s; }
.stagger-list > *:nth-child(3) { animation-delay: 0.2s; }
.stagger-list > *:nth-child(4) { animation-delay: 0.3s; }
.stagger-list > *:nth-child(5) { animation-delay: 0.4s; }

/* Dynamic stagger with CSS custom properties */
.stagger-list > * {
  animation-delay: calc(var(--index, 0) * 0.08s);
}
```

## 1.3 Easing Functions & Cubic Bezier

```css
:root {
  /* Standard easings */
  --ease-in:       cubic-bezier(0.4, 0, 1, 1);
  --ease-out:      cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out:   cubic-bezier(0.4, 0, 0.2, 1);

  /* Expressive easings */
  --ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-bounce:   cubic-bezier(0.34, 1.8, 0.64, 1);
  --ease-elastic:  cubic-bezier(0.68, -0.6, 0.32, 1.6);
  --ease-snap:     cubic-bezier(0.5, 0, 0, 1);

  /* Smooth / Apple-like */
  --ease-smooth:   cubic-bezier(0.16, 1, 0.3, 1);

  /* CSS native spring-like */
  --ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Linear easing function (CSS) */
  --ease-spring-css: linear(
    0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%,
    0.938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%,
    1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%,
    1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%,
    0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1
  );
}
```

## 1.4 Scroll-Driven Animations (CSS Native)

```css
/* Animate based on scroll position */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(50px); }
  to   { opacity: 1; transform: translateY(0); }
}

.scroll-reveal {
  animation: fade-in linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}

/* Progress bar tied to page scroll */
.scroll-progress {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 4px;
  background: #3b82f6;
  transform-origin: left;
  animation: scale-x linear;
  animation-timeline: scroll();
}
@keyframes scale-x {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}

/* Parallax with scroll timeline */
.parallax-element {
  animation: parallax linear;
  animation-timeline: scroll();
}
@keyframes parallax {
  from { transform: translateY(-100px); }
  to   { transform: translateY(100px); }
}
```

**Browser support:** Chrome 115+, Edge 115+. Use IntersectionObserver or GSAP ScrollTrigger as fallback.

## 1.5 View Transitions API

```javascript
// Basic view transition
document.startViewTransition(() => {
  updateDOM(); // Your DOM update logic
});

// Named transitions for specific elements
// CSS:
.card {
  view-transition-name: card-hero;
}

::view-transition-old(card-hero) {
  animation: fade-out 0.3s ease;
}
::view-transition-new(card-hero) {
  animation: fade-in 0.3s ease;
}

/* Cross-document transitions (MPA) */
@view-transition {
  navigation: auto;
}
```

## 1.6 @starting-style (Entry Animations)

```css
/* Animate elements from display:none */
.dialog {
  opacity: 1;
  transform: scale(1);
  transition: opacity 0.3s, transform 0.3s, display 0.3s allow-discrete;
}

@starting-style {
  .dialog {
    opacity: 0;
    transform: scale(0.95);
  }
}

/* Works with popover, dialog, and any display-toggled element */
[popover]:popover-open {
  opacity: 1;
  transform: translateY(0);
}

@starting-style {
  [popover]:popover-open {
    opacity: 0;
    transform: translateY(-10px);
  }
}
```

## 1.7 The FLIP Technique

First, Last, Invert, Play - for smooth layout animations.

```javascript
function flipAnimate(element, callback) {
  // FIRST: Record initial position
  const first = element.getBoundingClientRect();

  // Perform DOM change
  callback();

  // LAST: Record final position
  const last = element.getBoundingClientRect();

  // INVERT: Calculate the delta
  const deltaX = first.left - last.left;
  const deltaY = first.top - last.top;
  const deltaW = first.width / last.width;
  const deltaH = first.height / last.height;

  // PLAY: Animate from inverted to final
  element.animate([
    {
      transform: `translate(${deltaX}px, ${deltaY}px) scale(${deltaW}, ${deltaH})`,
      transformOrigin: 'top left',
    },
    { transform: 'none', transformOrigin: 'top left' }
  ], {
    duration: 300,
    easing: 'cubic-bezier(0.2, 0, 0.2, 1)',
  });
}
```

## 1.8 Spring-Based & Physics Animations

```javascript
// Framer Motion spring
<motion.div
  animate={{ x: 100 }}
  transition={{
    type: "spring",
    stiffness: 300,    // Higher = snappier
    damping: 20,       // Higher = less oscillation
    mass: 1,           // Higher = slower, heavier
  }}
/>

// Common spring presets
const springs = {
  gentle:  { stiffness: 120, damping: 14, mass: 1 },
  wobbly:  { stiffness: 180, damping: 12, mass: 1 },
  stiff:   { stiffness: 300, damping: 20, mass: 1 },
  snappy:  { stiffness: 400, damping: 25, mass: 0.8 },
  molasses:{ stiffness: 120, damping: 20, mass: 4 },
};
```

## 1.9 Micro-Interactions

```css
/* Button press effect */
.btn-press {
  transition: transform 0.1s ease;
}
.btn-press:active {
  transform: scale(0.97);
}

/* Checkbox animation */
.checkbox-icon {
  stroke-dasharray: 24;
  stroke-dashoffset: 24;
  transition: stroke-dashoffset 0.3s ease 0.1s;
}
input:checked ~ .checkbox-icon {
  stroke-dashoffset: 0;
}

/* Toggle switch */
.toggle-track {
  width: 48px; height: 28px;
  border-radius: 14px;
  background: #d1d5db;
  transition: background 0.2s ease;
}
.toggle-thumb {
  width: 24px; height: 24px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  transform: translateX(2px);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
input:checked ~ .toggle-track {
  background: #3b82f6;
}
input:checked ~ .toggle-thumb {
  transform: translateX(22px);
}

/* Ripple effect */
.ripple {
  position: relative;
  overflow: hidden;
}
.ripple::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  width: 100px; height: 100px;
  transform: scale(0);
  opacity: 1;
  pointer-events: none;
}
.ripple:active::after {
  animation: ripple-effect 0.6s ease-out;
}
@keyframes ripple-effect {
  to { transform: scale(4); opacity: 0; }
}

/* Like heart animation */
@keyframes heart-beat {
  0%   { transform: scale(1); }
  25%  { transform: scale(1.3); }
  40%  { transform: scale(0.9); }
  60%  { transform: scale(1.15); }
  100% { transform: scale(1); }
}
.liked {
  animation: heart-beat 0.5s ease;
  color: #ef4444;
}
```

## 1.10 SVG Animations

```css
/* SVG path drawing */
.svg-draw path {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: draw 2s ease forwards;
}
@keyframes draw {
  to { stroke-dashoffset: 0; }
}

/* SVG morphing with CSS */
.morph {
  d: path("M10,80 Q52.5,10 95,80 T180,80");
  transition: d 0.5s ease;
}
.morph:hover {
  d: path("M10,50 Q52.5,90 95,50 T180,50");
}
```

```javascript
// GSAP SVG morph
gsap.to(".shape", {
  morphSVG: "#targetShape",
  duration: 1,
  ease: "power2.inOut"
});

// Lottie animation
import lottie from 'lottie-web';
lottie.loadAnimation({
  container: document.getElementById('lottie'),
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: '/animations/loading.json'
});
```

## 1.11 Text Animations

```css
/* Typewriter */
.typewriter {
  overflow: hidden;
  border-right: 3px solid;
  white-space: nowrap;
  width: 0;
  animation:
    typing 3.5s steps(30, end) forwards,
    blink-caret 0.75s step-end infinite;
}
@keyframes typing { from { width: 0; } to { width: 100%; } }
@keyframes blink-caret {
  from, to { border-color: transparent; }
  50% { border-color: currentColor; }
}

/* Split text reveal (per-character) */
.char {
  display: inline-block;
  opacity: 0;
  transform: translateY(1em);
  animation: char-reveal 0.6s ease forwards;
  animation-delay: calc(var(--char-index) * 0.03s);
}
@keyframes char-reveal {
  to { opacity: 1; transform: translateY(0); }
}

/* Gradient text animation */
.animated-gradient-text {
  background: linear-gradient(270deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #ff6b6b);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient-shift 4s ease infinite;
}
@keyframes gradient-shift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

## 1.12 Loading Animations

```css
/* Spinner */
.spinner {
  width: 24px; height: 24px;
  border: 3px solid var(--color-border, #e5e7eb);
  border-top-color: var(--color-primary, #3b82f6);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Skeleton shimmer */
.skeleton {
  background: linear-gradient(
    90deg,
    #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Bouncing dots */
.dots-loader { display: flex; gap: 6px; }
.dots-loader span {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--color-primary, #3b82f6);
  animation: dots-bounce 1.4s ease-in-out infinite both;
}
.dots-loader span:nth-child(2) { animation-delay: 0.16s; }
.dots-loader span:nth-child(3) { animation-delay: 0.32s; }
@keyframes dots-bounce {
  0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
  40%           { transform: scale(1); opacity: 1; }
}

/* Indeterminate progress bar */
.progress-bar {
  width: 100%; height: 4px;
  background: #e5e7eb; border-radius: 2px; overflow: hidden;
}
.progress-bar-fill {
  height: 100%; width: 40%;
  background: #3b82f6; border-radius: 2px;
  animation: progress-indeterminate 1.5s ease-in-out infinite;
}
@keyframes progress-indeterminate {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}
```

## 1.13 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Or target specific animations */
@media (prefers-reduced-motion: reduce) {
  .hero-animation { animation: none; }
  .parallax { transform: none; }
}
```

---

# 2. UI Design Patterns

## 2.1 Layout Systems

### CSS Grid - Advanced Patterns

```css
/* Responsive grid with zero media queries (RAM pattern) */
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: 1.5rem;
}

/* Named grid areas - Dashboard */
.dashboard {
  display: grid;
  grid-template-columns: 250px 1fr 300px;
  grid-template-rows: 60px 1fr 40px;
  grid-template-areas:
    "header  header  header"
    "sidebar main   aside"
    "footer  footer  footer";
  min-height: 100vh;
}
.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main    { grid-area: main; }
.aside   { grid-area: aside; }
.footer  { grid-area: footer; }

@media (max-width: 768px) {
  .dashboard {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header" "main" "sidebar" "aside" "footer";
  }
}

/* Overlapping items - Magazine layout */
.magazine {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: repeat(6, 80px);
}
.magazine .feature-image { grid-column: 1 / 8; grid-row: 1 / 5; }
.magazine .feature-text {
  grid-column: 5 / 13; grid-row: 3 / 7;
  z-index: 1;
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
}
```

### Subgrid

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}
.card {
  display: grid;
  grid-row: span 3;
  grid-template-rows: subgrid;
  gap: 0;
}
/* Card header, body, footer now align across all cards */
```

### Container Queries

```css
.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 1rem;
  }
}

@container card (min-width: 700px) {
  .card { grid-template-columns: 300px 1fr 200px; }
}

/* Container query units */
.card-title {
  font-size: clamp(1rem, 3cqi, 1.5rem);
}
```

### Flexbox Advanced

```css
/* Sidebar layout */
.with-sidebar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.with-sidebar .sidebar { flex-basis: 300px; flex-grow: 1; }
.with-sidebar .content { flex-basis: 0; flex-grow: 999; min-inline-size: 60%; }
```

### Masonry Layout

```css
/* CSS columns fallback (works everywhere) */
.masonry-columns {
  columns: 3 300px;
  column-gap: 1.5rem;
}
.masonry-columns > * {
  break-inside: avoid;
  margin-bottom: 1.5rem;
}

/* CSS native masonry (experimental - Firefox flag only) */
.masonry-native {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  grid-template-rows: masonry;
  gap: 1rem;
}
```

## 2.2 Visual Design Patterns

### Glassmorphism

```css
.glass-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* Dark glass */
.glass-card-dark {
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Neumorphism (Soft UI)

```css
:root { --neu-bg: #e0e5ec; --neu-light: #ffffff; --neu-dark: #a3b1c6; }

.neu-raised {
  background: var(--neu-bg);
  border-radius: 20px;
  box-shadow: 8px 8px 16px var(--neu-dark), -8px -8px 16px var(--neu-light);
}

.neu-inset {
  box-shadow: inset 8px 8px 16px var(--neu-dark), inset -8px -8px 16px var(--neu-light);
}
```

> **Warning:** Neumorphism has poor contrast. Always add borders for interactive elements.

### Brutalism

```css
.brutal-card {
  background: #fff;
  border: 3px solid #000;
  box-shadow: 8px 8px 0 #000;
  padding: 2rem;
  font-family: "Courier New", monospace;
}
.brutal-button {
  background: #ff5722;
  color: #000;
  border: 3px solid #000;
  box-shadow: 4px 4px 0 #000;
  font-weight: 900;
  text-transform: uppercase;
}
.brutal-button:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 #000; }
.brutal-button:active { transform: translate(4px, 4px); box-shadow: 0 0 0 #000; }
```

### Claymorphism

```css
.clay-card {
  background: #f87171;
  border-radius: 24px;
  box-shadow:
    0 12px 24px rgba(248, 113, 113, 0.4),
    inset 0 -4px 8px rgba(0, 0, 0, 0.1),
    inset 0 4px 8px rgba(255, 255, 255, 0.3);
}
```

### Bento Grid

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, minmax(200px, auto));
  gap: 1rem;
}
.bento-grid .feature { grid-column: span 2; grid-row: span 2; }
.bento-grid .tall    { grid-row: span 2; }
.bento-grid .wide    { grid-column: span 2; }
.bento-grid > * {
  border-radius: 20px;
  padding: 2rem;
  background: var(--surface);
  border: 1px solid var(--border);
}

@media (max-width: 768px) {
  .bento-grid { grid-template-columns: repeat(2, 1fr); }
  .bento-grid .feature { grid-column: span 2; grid-row: span 1; }
}
@media (max-width: 480px) {
  .bento-grid { grid-template-columns: 1fr; }
  .bento-grid .feature, .bento-grid .wide { grid-column: span 1; }
}
```

### Aurora UI

```css
.aurora-bg {
  position: relative;
  background: #0f0f1a;
  overflow: hidden;
}
.aurora-bg::before, .aurora-bg::after {
  content: "";
  position: absolute;
  width: 60vw; height: 60vw;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: aurora-drift 15s ease-in-out infinite alternate;
}
.aurora-bg::before {
  background: radial-gradient(circle, #7c3aed, transparent 70%);
  top: -20%; left: -10%;
}
.aurora-bg::after {
  background: radial-gradient(circle, #06b6d4, transparent 70%);
  bottom: -20%; right: -10%;
  animation-delay: -7s;
}
@keyframes aurora-drift {
  0%   { transform: translate(0, 0) scale(1); }
  50%  { transform: translate(5%, 10%) scale(1.1); }
  100% { transform: translate(-5%, -5%) scale(0.95); }
}
```

## 2.3 Card Designs

### Hover Lift

```css
.card-hover {
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease;
}
.card-hover:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.06);
}
```

### Animated Border Glow

```css
.card-glow {
  position: relative;
  background: #1a1a2e;
  border-radius: 16px;
  overflow: hidden;
}
.card-glow::before {
  content: "";
  position: absolute; inset: 0;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.4s;
}
.card-glow:hover::before { opacity: 1; }
```

### 3D Flip Card

```css
.flip-card { width: 300px; height: 400px; perspective: 1000px; }
.flip-card-inner {
  position: relative;
  width: 100%; height: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}
.flip-card:hover .flip-card-inner { transform: rotateY(180deg); }
.flip-card-front, .flip-card-back {
  position: absolute; inset: 0;
  backface-visibility: hidden;
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  padding: 2rem;
}
.flip-card-back { transform: rotateY(180deg); }
```

### Expandable Card (Animate Height)

```css
.expandable .card-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.expandable.expanded .card-body {
  grid-template-rows: 1fr;
}
.expandable .card-body-inner { overflow: hidden; }
```

### Spotlight / Mouse-Follow Card

```javascript
document.querySelectorAll('.spotlight-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  });
});
```

```css
.spotlight-card::before {
  content: "";
  position: absolute; inset: 0;
  background: radial-gradient(
    400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(255, 255, 255, 0.06), transparent 40%
  );
  pointer-events: none;
  opacity: 0; transition: opacity 0.3s;
}
.spotlight-card:hover::before { opacity: 1; }
```

## 2.4 Navigation Patterns

### Mega Menu

```css
.mega-menu {
  position: absolute;
  top: 100%; left: 0; right: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr) 300px;
  gap: 2rem;
  padding: 2rem;
  background: white;
  border-radius: 0 0 16px 16px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  opacity: 0; visibility: hidden;
  transform: translateY(-8px);
  transition: all 0.25s ease;
}
.has-mega-menu:hover .mega-menu,
.has-mega-menu:focus-within .mega-menu {
  opacity: 1; visibility: visible; transform: translateY(0);
}
```

### Command Palette (Cmd+K)

```tsx
// Using cmdk library
import { Command } from 'cmdk';

function CommandPalette() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(toggle => !toggle);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <Command.Dialog open={open} onOpenChange={setOpen}>
      <Command.Input placeholder="Type a command or search..." />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        <Command.Group heading="Pages">
          <Command.Item>Dashboard</Command.Item>
          <Command.Item>Settings</Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
```

### Bottom Sheet (Mobile)

```css
.bottom-sheet {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: white;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
  transform: translateY(100%);
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
  z-index: 50;
  max-height: 90vh;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.bottom-sheet.open { transform: translateY(0); }
.bottom-sheet .handle {
  width: 36px; height: 4px;
  background: #d1d5db;
  border-radius: 2px;
  margin: 12px auto;
}
```

### Hamburger Morph to X

```css
.menu-toggle span {
  display: block; height: 2px;
  background: currentColor; border-radius: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;
}
.menu-toggle[aria-expanded="true"] span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}
.menu-toggle[aria-expanded="true"] span:nth-child(2) {
  opacity: 0; transform: scaleX(0);
}
.menu-toggle[aria-expanded="true"] span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}
```

## 2.5 Hero Sections

### Split Layout Hero

```css
.hero-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  min-height: 80vh;
  padding: 4rem clamp(1rem, 5vw, 6rem);
}
.hero-split h1 {
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
@media (max-width: 768px) {
  .hero-split { grid-template-columns: 1fr; text-align: center; }
}
```

### Animated Gradient Hero

```css
.hero-gradient {
  background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
  background-size: 400% 400%;
  animation: gradient-shift 12s ease infinite;
}
@keyframes gradient-shift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

### Gradient Text Hero

```css
.hero-gradient-text {
  font-size: clamp(3rem, 8vw, 7rem);
  font-weight: 900;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

## 2.6 Color Theory & Theming

### CSS Custom Properties Theme System

```css
:root {
  --color-bg: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-text-primary: #111827;
  --color-text-secondary: #4b5563;
  --color-text-tertiary: #9ca3af;
  --color-border: #e5e7eb;
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
}

[data-theme="dark"] {
  --color-bg: #0f172a;
  --color-bg-secondary: #1e293b;
  --color-text-primary: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-border: #334155;
  --color-primary: #60a5fa;
}
```

### Dark Mode Implementation

```javascript
function initTheme() {
  const stored = localStorage.getItem('theme');
  if (stored) { document.documentElement.dataset.theme = stored; return; }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light';
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme;
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('theme', next);
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    document.documentElement.dataset.theme = e.matches ? 'dark' : 'light';
  }
});
```

### OKLCH Color Space

```css
:root {
  /* oklch(Lightness Chroma Hue) - perceptually uniform */
  --primary-50:  oklch(0.97 0.02 250);
  --primary-500: oklch(0.58 0.22 250);
  --primary-900: oklch(0.28 0.12 250);
}

/* Dynamic accent theming - change one variable to reskin everything */
[data-accent="blue"]   { --hue: 250; }
[data-accent="green"]  { --hue: 155; }
[data-accent="purple"] { --hue: 300; }

.button { background: oklch(0.58 0.2 var(--hue)); }
.button:hover { background: oklch(0.50 0.2 var(--hue)); }

/* Relative color syntax */
.button {
  --base: oklch(0.6 0.2 250);
  background: var(--base);
  border-color: oklch(from var(--base) calc(l + 0.1) c h);
}
.button:hover {
  background: oklch(from var(--base) calc(l - 0.1) c h);
}
```

## 2.7 Gradients

### Mesh Gradients

```css
.mesh-gradient {
  background:
    radial-gradient(at 0% 0%, #7c3aed 0%, transparent 50%),
    radial-gradient(at 100% 0%, #06b6d4 0%, transparent 50%),
    radial-gradient(at 100% 100%, #f472b6 0%, transparent 50%),
    radial-gradient(at 0% 100%, #fbbf24 0%, transparent 50%),
    #0f172a;
}
```

### Gradient Borders

```css
/* background-clip method (simplest) */
.gradient-border {
  border: 2px solid transparent;
  border-radius: 16px;
  background:
    linear-gradient(#1a1a2e, #1a1a2e) padding-box,
    linear-gradient(135deg, #667eea, #764ba2) border-box;
}
```

### Conic Gradients

```css
/* Rotating border spinner */
.spinner-border { position: relative; border-radius: 16px; }
.spinner-border::before {
  content: "";
  position: absolute; inset: -50%;
  background: conic-gradient(from 0deg, transparent 0deg, #3b82f6 90deg, transparent 180deg);
  animation: rotate 2s linear infinite;
}
.spinner-border::after {
  content: "";
  position: absolute; inset: 2px;
  background: #1a1a2e;
  border-radius: 14px;
}
@keyframes rotate { to { transform: rotate(360deg); } }
```

## 2.8 Shadows & Depth

### Layered Shadows (Realistic)

```css
.shadow-layered {
  box-shadow:
    0 1px 1px rgba(0,0,0,0.05),
    0 2px 2px rgba(0,0,0,0.05),
    0 4px 4px rgba(0,0,0,0.05),
    0 8px 8px rgba(0,0,0,0.05),
    0 16px 16px rgba(0,0,0,0.05);
}
```

### Elevation System

```css
:root {
  --elevation-0: none;
  --elevation-1: 0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1);
  --elevation-2: 0 2px 4px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.1);
  --elevation-3: 0 4px 8px rgba(0,0,0,0.06), 0 8px 16px rgba(0,0,0,0.1);
  --elevation-4: 0 8px 16px rgba(0,0,0,0.08), 0 16px 32px rgba(0,0,0,0.12);
  --elevation-5: 0 16px 32px rgba(0,0,0,0.1), 0 32px 64px rgba(0,0,0,0.14);
}

.card       { box-shadow: var(--elevation-2); }
.card:hover { box-shadow: var(--elevation-4); transition: box-shadow 0.3s; }
.dropdown   { box-shadow: var(--elevation-3); }
.modal      { box-shadow: var(--elevation-5); }
```

### Colored Shadows

```css
.colored-shadow {
  background: #3b82f6;
  box-shadow: 0 10px 30px -5px rgba(59, 130, 246, 0.5);
}
```

### Text Shadows

```css
/* Neon glow */
.text-neon {
  color: #fff;
  text-shadow:
    0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fff,
    0 0 42px #0fa, 0 0 82px #0fa, 0 0 92px #0fa;
}

/* 3D retro */
.text-3d {
  text-shadow:
    1px 1px 0 #ccc, 2px 2px 0 #bbb,
    3px 3px 0 #aaa, 4px 4px 0 #999,
    5px 5px 10px rgba(0,0,0,0.3);
}
```

## 2.9 Borders & Shapes

### Animated Rotating Gradient Border

```css
.animated-border {
  position: relative;
  border-radius: 16px;
  background: #1a1a2e;
  overflow: hidden;
  isolation: isolate;
}
.animated-border::before {
  content: "";
  position: absolute; inset: -200%;
  background: conic-gradient(from 0deg, transparent 0%, #3b82f6 25%, transparent 50%);
  animation: border-rotate 4s linear infinite;
  z-index: -2;
}
.animated-border::after {
  content: "";
  position: absolute; inset: 2px;
  background: #1a1a2e;
  border-radius: 14px;
  z-index: -1;
}
@keyframes border-rotate { to { transform: rotate(360deg); } }
```

### Clip-Path Shapes

```css
.triangle { clip-path: polygon(50% 0%, 0% 100%, 100% 100%); }
.hexagon  { clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%); }
.slanted  { clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%); }

/* Animated clip-path reveal */
.reveal {
  clip-path: inset(0 100% 0 0);
  animation: clip-reveal 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
@keyframes clip-reveal { to { clip-path: inset(0 0 0 0); } }
```

### Blob Shapes

```css
.blob {
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  width: 300px; height: 300px;
  background: linear-gradient(135deg, #667eea, #764ba2);
}

/* Animated morphing blob */
@keyframes blob-morph {
  0%   { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; }
  25%  { border-radius: 58% 42% 75% 25% / 76% 46% 54% 24%; }
  50%  { border-radius: 50% 50% 33% 67% / 55% 27% 73% 45%; }
  75%  { border-radius: 33% 67% 58% 42% / 63% 68% 32% 37%; }
  100% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; }
}
.blob-morph { animation: blob-morph 8s ease-in-out infinite; }
```

## 2.10 Background Effects

```css
/* Dot grid */
.dot-grid {
  background-image: radial-gradient(circle, #d1d5db 1px, transparent 1px);
  background-size: 24px 24px;
}

/* Grid lines */
.grid-lines {
  background-image:
    linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* Noise / Grain texture */
.noise::after {
  content: "";
  position: absolute; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.05;
  pointer-events: none;
  mix-blend-mode: overlay;
}

/* Striped background */
.stripes {
  background: repeating-linear-gradient(
    -45deg,
    transparent, transparent 10px,
    rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px
  );
}
```

## 2.11 Component Patterns

### Accordion (Native HTML + Animated)

```html
<details>
  <summary>What is your return policy?</summary>
  <div class="accordion-content"><div>You can return items within 30 days.</div></div>
</details>
```

```css
.accordion-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s ease;
}
details[open] .accordion-content { grid-template-rows: 1fr; }
.accordion-content > div { overflow: hidden; }
```

### Modal (Native `<dialog>`)

```html
<dialog id="modal" class="modal">
  <div class="modal-content">
    <h2>Confirm</h2>
    <p>Are you sure?</p>
    <button onclick="this.closest('dialog').close()">Close</button>
  </div>
</dialog>
```

```css
.modal {
  border: none; border-radius: 16px;
  box-shadow: var(--elevation-5);
  max-width: min(90vw, 500px); width: 100%;
  animation: modal-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal::backdrop { background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); }
@keyframes modal-in { from { opacity: 0; transform: scale(0.95) translateY(10px); } }
```

### Toast Notifications

```css
.toast-container {
  position: fixed; bottom: 1.5rem; right: 1.5rem;
  display: flex; flex-direction: column; gap: 0.75rem;
  z-index: 1000;
}
.toast {
  display: flex; align-items: flex-start; gap: 0.75rem;
  padding: 1rem 1.25rem; background: white;
  border-radius: 12px; box-shadow: var(--elevation-4);
  border-left: 4px solid var(--toast-color, #3b82f6);
  max-width: 400px;
  animation: toast-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast.success { --toast-color: #10b981; }
.toast.error   { --toast-color: #ef4444; }
@keyframes toast-in { from { opacity: 0; transform: translateX(100%); } }
```

### Popover (Native Popover API)

```html
<button popovertarget="info">Toggle Info</button>
<div id="info" popover class="popover-card">
  <h3>Title</h3><p>Content here. No JS needed.</p>
</div>
```

```css
.popover-card {
  border: 1px solid var(--color-border); border-radius: 12px;
  box-shadow: var(--elevation-3); padding: 1.25rem;
  opacity: 0; transform: scale(0.95);
  transition: opacity 0.2s, transform 0.2s, display 0.2s allow-discrete;
}
.popover-card:popover-open { opacity: 1; transform: scale(1); }
@starting-style {
  .popover-card:popover-open { opacity: 0; transform: scale(0.95); }
}
```

## 2.12 Responsive Design

### Fluid Typography with clamp()

```css
:root {
  --text-sm:   clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --text-2xl:  clamp(1.5rem, 1rem + 2.5vw, 2.25rem);
  --text-4xl:  clamp(2.25rem, 1rem + 6.25vw, 4.5rem);

  --space-sm: clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem);
  --space-md: clamp(1rem, 0.8rem + 1vw, 1.5rem);
  --space-lg: clamp(1.5rem, 1rem + 2.5vw, 3rem);
}
```

### Responsive Images

```html
<picture>
  <source media="(min-width: 1024px)" srcset="hero-wide.webp" type="image/webp" />
  <source media="(min-width: 768px)" srcset="hero-medium.webp" type="image/webp" />
  <img src="hero-fallback.jpg" alt="Hero" loading="lazy" decoding="async" />
</picture>

<img
  srcset="photo-400.webp 400w, photo-800.webp 800w, photo-1200.webp 1200w"
  sizes="(min-width: 1024px) 50vw, 100vw"
  src="photo-800.webp" alt="Description" loading="lazy"
/>
```

---

# 3. Typography & Text Design

## 3.1 Font Selection

### Best Fonts (2024-2026)

| Category | Font | Style | Use Case |
|----------|------|-------|----------|
| **Sans-Serif** | Inter | Neo-grotesque, variable | UI, dashboards, body text |
| | Geist | Vercel's system font | Developer tools, SaaS |
| | Plus Jakarta Sans | Geometric, friendly | Marketing, SaaS landing pages |
| | DM Sans | Low-contrast geometric | Clean UI, mobile apps |
| | Outfit | Geometric, modern | Headlines + body |
| | Figtree | Friendly geometric | Approachable brands |
| **Serif** | Instrument Serif | Elegant, display | Headlines, editorial |
| | Playfair Display | High contrast, variable | Luxury, fashion |
| | Fraunces | Soft serif, variable | Quirky editorial |
| | Lora | Contemporary serif | Long-form reading |
| **Monospace** | JetBrains Mono | Ligatures, clear | Code editors |
| | Fira Code | Coding ligatures | Code blocks |
| | Geist Mono | Vercel companion | Developer content |
| **Display** | Space Grotesk | Geometric display | Tech headlines |
| | Clash Display (Fontshare) | Strong geometric | Impact headlines |
| | Bricolage Grotesque | Eclectic variable | Distinctive branding |

### Font Pairing Strategies

```css
/* Serif + Sans: Editorial elegance */
h1, h2, h3 { font-family: 'Playfair Display', Georgia, serif; }
body { font-family: 'Inter', system-ui, sans-serif; }

/* Sans + Sans: Modern professional */
h1, h2, h3 { font-family: 'Space Grotesk', sans-serif; font-weight: 700; }
body { font-family: 'Inter', sans-serif; font-weight: 400; }
```

**Rules:** Max 2-3 fonts per project. Pair by contrast (serif vs sans) or weight. Match x-height for harmony.

### Font Loading Optimization

```html
<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;       /* swap = best for body text */
  unicode-range: U+0000-00FF;
}

/* Reduce CLS with fallback metrics */
@font-face {
  font-family: 'Inter Fallback';
  src: local('Arial');
  ascent-override: 90.49%;
  descent-override: 22.56%;
  line-gap-override: 0%;
  size-adjust: 107.06%;
}
body { font-family: 'Inter', 'Inter Fallback', system-ui, sans-serif; }
```

## 3.2 Fluid Typography System

```css
:root {
  /* Complete fluid type scale */
  --text-xs:   clamp(0.694rem, 0.658rem + 0.184vi, 0.8rem);
  --text-sm:   clamp(0.833rem, 0.775rem + 0.29vi, 1rem);
  --text-base: clamp(1rem, 0.913rem + 0.435vi, 1.25rem);
  --text-lg:   clamp(1.2rem, 1.074rem + 0.63vi, 1.563rem);
  --text-xl:   clamp(1.44rem, 1.262rem + 0.892vi, 1.953rem);
  --text-2xl:  clamp(1.728rem, 1.48rem + 1.241vi, 2.441rem);
  --text-3xl:  clamp(2.074rem, 1.733rem + 1.701vi, 3.052rem);
  --text-4xl:  clamp(2.488rem, 2.027rem + 2.307vi, 3.815rem);
  --text-5xl:  clamp(2.986rem, 2.366rem + 3.098vi, 4.768rem);

  /* Companion fluid spacing */
  --space-3xs: clamp(0.25rem, 0.225rem + 0.125vi, 0.313rem);
  --space-2xs: clamp(0.5rem, 0.45rem + 0.25vi, 0.625rem);
  --space-xs:  clamp(0.75rem, 0.675rem + 0.375vi, 0.938rem);
  --space-sm:  clamp(1rem, 0.9rem + 0.5vi, 1.25rem);
  --space-md:  clamp(1.5rem, 1.35rem + 0.75vi, 1.875rem);
  --space-lg:  clamp(2rem, 1.8rem + 1vi, 2.5rem);
  --space-xl:  clamp(3rem, 2.7rem + 1.5vi, 3.75rem);
  --space-2xl: clamp(4rem, 3.6rem + 2vi, 5rem);
  --space-3xl: clamp(6rem, 5.4rem + 3vi, 7.5rem);
}
```

### Modular Type Scales

| Scale | Ratio | Use Case |
|-------|-------|----------|
| Minor Second | 1.067 | Tight, minimal |
| Major Second | 1.125 | Body-text heavy |
| Minor Third | 1.200 | General purpose |
| Major Third | 1.250 | Balanced |
| Perfect Fourth | 1.333 | Editorial, headings |
| Golden Ratio | 1.618 | Classic proportion |

**Tools:** utopia.fyi, type-scale.com, fluid-type-scale.com

## 3.3 Variable Fonts

```css
/* Standard axes via CSS properties */
.heading {
  font-family: 'Inter', sans-serif;
  font-weight: 720;         /* wght axis: fine-grained */
  font-stretch: 87.5%;      /* wdth axis */
  font-style: oblique 12deg; /* slnt axis */
  font-optical-sizing: auto; /* opsz axis */
}

/* Custom axes via font-variation-settings */
.custom {
  font-variation-settings: 'wght' 650, 'wdth' 90, 'CASL' 0.5;
}

/* Animated variable font */
.animate-weight {
  font-weight: 100;
  transition: font-weight 0.6s ease;
}
.animate-weight:hover { font-weight: 900; }

@keyframes font-breathe {
  0%   { font-variation-settings: 'wght' 300, 'wdth' 75; }
  50%  { font-variation-settings: 'wght' 800, 'wdth' 125; }
  100% { font-variation-settings: 'wght' 300, 'wdth' 75; }
}
.breathing-text { animation: font-breathe 3s ease-in-out infinite; }
```

### Popular Variable Fonts

| Font | Axes | Source |
|------|------|--------|
| Inter | wght (100-900) | Google Fonts |
| Roboto Flex | wght, wdth, opsz, GRAD, slnt + more | Google Fonts |
| Recursive | wght, CASL, MONO, slnt, CRSV | Google Fonts |
| Fraunces | wght, opsz, SOFT, WONK | Google Fonts |
| Playfair Display | wght (400-900), ital | Google Fonts |

## 3.4 Text Effects

```css
/* Gradient text */
.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Outlined / stroke text */
.outlined {
  -webkit-text-stroke: 2px #000;
  -webkit-text-fill-color: transparent;
}
.outline-fill {
  -webkit-text-stroke: 2px #fff;
  -webkit-text-fill-color: transparent;
  transition: -webkit-text-fill-color 0.3s ease;
}
.outline-fill:hover { -webkit-text-fill-color: #fff; }

/* Neon glow */
.neon {
  color: #fff;
  text-shadow: 0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fff,
    0 0 42px #0fa, 0 0 82px #0fa, 0 0 92px #0fa;
}

/* Glitch text */
.glitch { position: relative; }
.glitch::before, .glitch::after {
  content: attr(data-text);
  position: absolute; top: 0; left: 0;
}
.glitch::before {
  color: #ff00c1;
  animation: glitch-1 0.3s infinite linear alternate-reverse;
  clip-path: inset(20% 0 40% 0);
}
.glitch::after {
  color: #00fff9;
  animation: glitch-2 0.3s infinite linear alternate-reverse;
  clip-path: inset(60% 0 10% 0);
}

/* Knockout text (image inside text) */
.knockout {
  background-image: url('/image.jpg');
  background-size: cover;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 3D text */
.text-3d-effect {
  text-shadow:
    0 1px 0 #ccc, 0 2px 0 #c9c9c9, 0 3px 0 #bbb,
    0 4px 0 #b9b9b9, 0 5px 0 #aaa,
    0 6px 1px rgba(0,0,0,.1), 0 0 5px rgba(0,0,0,.1),
    0 1px 3px rgba(0,0,0,.3), 0 3px 5px rgba(0,0,0,.2);
}
```

## 3.5 Advanced CSS Text

```css
/* text-wrap: balance (headings) and pretty (body) */
h1, h2, h3 { text-wrap: balance; }
p { text-wrap: pretty; }

/* Drop caps */
.article > p:first-of-type::first-letter {
  initial-letter: 3;
  font-weight: 700;
  margin-right: 0.1em;
  color: #2563eb;
}

/* OpenType features */
.tabular-nums  { font-variant-numeric: tabular-nums lining-nums; }
.old-style-nums { font-variant-numeric: oldstyle-nums; }
.small-caps    { font-variant-caps: small-caps; }
.fractions     { font-variant-numeric: diagonal-fractions; }
.ligatures     { font-variant-ligatures: common-ligatures discretionary-ligatures; }

/* Fancy underline */
.fancy-underline {
  text-decoration: underline;
  text-decoration-color: #2563eb;
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
  text-decoration-skip-ink: auto;
}
```

## 3.6 Reading Experience

```css
.readable {
  font-size: clamp(1rem, 0.95rem + 0.25vi, 1.125rem);
  line-height: 1.65;
  max-width: 65ch;       /* Optimal: 45-75 characters */
  letter-spacing: -0.01em;
  text-align: start;
  -webkit-font-smoothing: antialiased;
  orphans: 2; widows: 2;
}

/* Prose vertical rhythm */
.prose > * + * { margin-top: 1.25em; }
.prose h2 { font-size: 1.5em; margin-top: 2em; margin-bottom: 1em; line-height: 1.33; }
.prose h3 { font-size: 1.25em; margin-top: 1.6em; margin-bottom: 0.6em; }
.prose blockquote {
  padding-left: 1em; border-left: 0.25rem solid #e5e7eb; font-style: italic;
}
```

## 3.7 Heading Hierarchies

```css
h1 { font-size: var(--text-5xl); font-weight: 800; line-height: 1.1; letter-spacing: -0.03em; text-wrap: balance; }
h2 { font-size: var(--text-4xl); font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; text-wrap: balance; }
h3 { font-size: var(--text-3xl); font-weight: 600; line-height: 1.25; letter-spacing: -0.01em; }
h4 { font-size: var(--text-2xl); font-weight: 600; line-height: 1.3; }
h5 { font-size: var(--text-xl); font-weight: 600; line-height: 1.4; }
h6 { font-size: var(--text-lg); font-weight: 600; line-height: 1.4; text-transform: uppercase; letter-spacing: 0.05em; }

/* Eyebrow label */
.eyebrow {
  font-size: 0.75rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: #2563eb; margin-bottom: 0.5rem;
}

/* Marker highlight */
.headline-highlight {
  background: linear-gradient(transparent 60%, #fde68a 60%, #fde68a 90%, transparent 90%);
  display: inline;
}
```

## 3.8 Icon Libraries

| Library | Icons | Weights | Size |
|---------|-------|---------|------|
| Lucide | 1400+ | 1 | ~0.5KB/icon |
| Phosphor | 7000+ | 6 (thin-duotone) | ~1KB/icon |
| Heroicons | 300+ | 3 (outline/solid/mini) | ~0.5KB/icon |
| Tabler Icons | 5000+ | 1 | ~0.5KB/icon |
| Radix Icons | 300+ | 1 | ~0.3KB/icon |

**Best practice:** SVG icons > icon fonts. Tree-shakeable, multicolor, accessible.

## 3.9 System Font Stacks

```css
body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', Ubuntu, sans-serif; }
.serif { font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif; }
code { font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace; }
```

## 3.10 Font Performance Checklist

1. **WOFF2 only** (30% smaller than WOFF)
2. **Subset** to needed unicode ranges
3. **Variable fonts** (one file vs multiple weights)
4. **Preload** critical fonts
5. **font-display: swap** for body, **optional** for non-critical
6. **size-adjust** on fallback to reduce CLS
7. **Self-host** for full cache control
8. **Max 2-3 families** per site
9. **Cache** with `Cache-Control: public, max-age=31536000, immutable`

---

# 4. UX Intuition & Interaction Design

## 4.1 Interaction Feedback

```css
/* Button press feedback */
.btn { transition: transform 0.1s ease; }
.btn:active { transform: scale(0.97); }

/* Success state */
.btn-success {
  background: #10b981;
  animation: success-pulse 0.6s ease;
}
@keyframes success-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  100% { box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); }
}

/* Ripple effect (Material) */
.ripple { position: relative; overflow: hidden; }
.ripple::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  width: 100px; height: 100px;
  transform: scale(0); opacity: 1;
}
.ripple:active::after {
  animation: ripple-effect 0.6s ease-out;
}
@keyframes ripple-effect { to { transform: scale(4); opacity: 0; } }
```

## 4.2 Gesture-Based UI

### Drag and Drop

```tsx
// Using @dnd-kit (modern, accessible)
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function SortableList({ items }) {
  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map(item => <SortableItem key={item.id} {...item} />)}
      </SortableContext>
    </DndContext>
  );
}
```

### Swipe Actions

```css
.swipe-item {
  touch-action: pan-y;
  overflow: hidden;
}
.swipe-content {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
```

## 4.3 Progressive Disclosure

```css
/* Show more pattern */
.content-preview {
  max-height: 200px;
  overflow: hidden;
  position: relative;
}
.content-preview::after {
  content: "";
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 80px;
  background: linear-gradient(transparent, var(--color-bg));
}
.content-preview.expanded {
  max-height: none;
}
.content-preview.expanded::after { display: none; }

/* Wizard / Stepper */
.stepper {
  display: flex; align-items: center; gap: 0;
}
.step-indicator {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #e5e7eb; color: #6b7280; font-weight: 600;
  transition: all 0.3s ease;
}
.step-indicator.active { background: #3b82f6; color: white; }
.step-indicator.completed { background: #10b981; color: white; }
.step-connector {
  flex: 1; height: 2px; background: #e5e7eb;
  transition: background 0.3s;
}
.step-connector.completed { background: #10b981; }
```

## 4.4 Form UX

```css
/* Floating label */
.form-group { position: relative; }
.form-group input {
  padding: 1.25rem 1rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-size: 1rem;
  width: 100%;
  transition: border-color 0.2s;
}
.form-group label {
  position: absolute;
  left: 1rem; top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  transition: all 0.2s ease;
  pointer-events: none;
  font-size: 1rem;
}
.form-group input:focus ~ label,
.form-group input:not(:placeholder-shown) ~ label {
  top: 0.625rem;
  transform: translateY(0);
  font-size: 0.75rem;
  color: #3b82f6;
}
.form-group input:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }

/* Inline validation */
.field-error input { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.15); }
.field-error-message { color: #ef4444; font-size: 0.8125rem; margin-top: 0.375rem; }

/* Password strength meter */
.password-strength {
  display: flex; gap: 4px; margin-top: 8px;
}
.password-strength span {
  flex: 1; height: 4px; border-radius: 2px; background: #e5e7eb;
  transition: background 0.3s;
}
.strength-weak   span:nth-child(-n+1) { background: #ef4444; }
.strength-fair   span:nth-child(-n+2) { background: #f59e0b; }
.strength-good   span:nth-child(-n+3) { background: #10b981; }
.strength-strong span:nth-child(-n+4) { background: #10b981; }
```

## 4.5 Onboarding Patterns

```css
/* Spotlight / Coach mark */
.spotlight-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 100;
}
.spotlight-hole {
  position: absolute;
  border-radius: 8px;
  box-shadow: 0 0 0 9999px rgba(0,0,0,0.5);
  z-index: 101;
}
.spotlight-tooltip {
  position: absolute;
  background: white; border-radius: 12px;
  padding: 1.5rem; box-shadow: var(--elevation-4);
  max-width: 320px; z-index: 102;
}
```

## 4.6 Accessibility (a11y)

```css
/* Focus visible (keyboard-only focus rings) */
:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
:focus:not(:focus-visible) { outline: none; }

/* Skip link */
.skip-link {
  position: absolute;
  top: -100%; left: 50%;
  transform: translateX(-50%);
  padding: 0.75rem 1.5rem;
  background: #3b82f6; color: white;
  border-radius: 0 0 8px 8px;
  z-index: 1000;
  transition: top 0.2s;
}
.skip-link:focus { top: 0; }

/* Screen reader only */
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0, 0, 0, 0); white-space: nowrap;
  border-width: 0;
}

/* Touch targets (48px minimum) */
.touch-target { min-width: 48px; min-height: 48px; }

/* High contrast mode */
@media (forced-colors: active) {
  .button { border: 1px solid ButtonText; }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

### WCAG Contrast Ratios

```
AA Normal text (<18pt): 4.5:1
AA Large text (>=18pt): 3:1
AAA Normal text: 7:1
AAA Large text: 4.5:1
```

### ARIA Quick Reference

```html
<!-- Live regions for dynamic content -->
<div aria-live="polite" aria-atomic="true">Toast message here</div>

<!-- Loading states -->
<button aria-busy="true" aria-disabled="true">Loading...</button>

<!-- Expandable -->
<button aria-expanded="false" aria-controls="panel">Toggle</button>
<div id="panel" hidden>Content</div>

<!-- Tabs -->
<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="tab1">Tab 1</button>
</div>
<div role="tabpanel" id="tab1">Content</div>
```

## 4.7 Scroll UX

```css
/* Scroll snap */
.snap-container {
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}
.snap-item {
  scroll-snap-align: start;
  scroll-snap-stop: always;
  flex-shrink: 0;
}

/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #d1d5db; border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }

/* Hide scrollbar but keep functionality */
.no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
.no-scrollbar::-webkit-scrollbar { display: none; }
```

### Virtual Scrolling

Use `@tanstack/react-virtual` for long lists:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const parentRef = React.useRef(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: 400, overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div key={virtualItem.key}
            style={{ position: 'absolute', top: 0, transform: `translateY(${virtualItem.start}px)` }}>
            {items[virtualItem.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 4.8 Search UX

```css
/* Command palette styling */
.search-dialog {
  position: fixed;
  top: 20%; left: 50%;
  transform: translateX(-50%);
  width: min(640px, 90vw);
  background: white;
  border-radius: 16px;
  box-shadow: var(--elevation-5);
  overflow: hidden;
}
.search-input {
  width: 100%; padding: 1rem 1.25rem;
  border: none; border-bottom: 1px solid var(--color-border);
  font-size: 1.125rem;
}
.search-results { max-height: 400px; overflow-y: auto; }
.search-result-item {
  padding: 0.75rem 1.25rem;
  display: flex; align-items: center; gap: 0.75rem;
  cursor: pointer;
}
.search-result-item:hover,
.search-result-item[data-active="true"] {
  background: var(--color-bg-secondary);
}
.search-kbd {
  font-size: 0.75rem; padding: 2px 6px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 4px; font-family: monospace;
}
```

## 4.9 Optimistic UI & Performance Perception

```typescript
// Optimistic update pattern (React Query / TanStack)
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] });
    const previousTodos = queryClient.getQueryData(['todos']);

    // Optimistically update
    queryClient.setQueryData(['todos'], (old) =>
      old.map(t => t.id === newTodo.id ? { ...t, ...newTodo } : t)
    );

    return { previousTodos };
  },
  onError: (err, newTodo, context) => {
    // Rollback on error
    queryClient.setQueryData(['todos'], context.previousTodos);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  },
});
```

### Skeleton vs Spinner Decision

| Duration | Pattern |
|----------|---------|
| < 200ms | Show nothing (feels instant) |
| 200ms - 1s | Show spinner |
| 1s - 5s | Show skeleton screen |
| > 5s | Show progress bar with steps |

## 4.10 Error Handling UX

```css
/* Inline field error */
.field-group.error input {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(239,68,68,0.15);
}

/* Error banner */
.error-banner {
  display: flex; align-items: center; gap: 1rem;
  padding: 1rem 1.25rem;
  background: #fef2f2; border: 1px solid #fecaca;
  border-radius: 12px; color: #991b1b;
}

/* Empty state */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; padding: 4rem 2rem;
  max-width: 400px; margin: 0 auto;
}

/* 404 page */
.error-code {
  font-size: clamp(4rem, 15vw, 10rem);
  font-weight: 900;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

## 4.11 Delight Patterns

```css
/* Confetti burst (CSS-only simple version) */
@keyframes confetti-fall {
  0%   { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
.confetti-piece {
  position: fixed;
  width: 10px; height: 10px;
  animation: confetti-fall 3s ease-in forwards;
  z-index: 1000;
}

/* Celebration shake */
@keyframes celebrate-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px) rotate(-2deg); }
  40% { transform: translateX(4px) rotate(2deg); }
  60% { transform: translateX(-2px) rotate(-1deg); }
  80% { transform: translateX(2px) rotate(1deg); }
}
```

**Libraries:** canvas-confetti, react-rewards, party-js

---

# 5. Creative Web & Visual Effects

## 5.1 Three.js & React Three Fiber

```tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Float } from '@react-three/drei';

function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <mesh>
          <torusKnotGeometry args={[1, 0.3, 128, 32]} />
          <meshStandardMaterial color="#667eea" roughness={0.2} metalness={0.8} />
        </mesh>
      </Float>
      <OrbitControls enableZoom={false} autoRotate />
      <Environment preset="city" />
    </Canvas>
  );
}
```

## 5.2 Particle Systems

```javascript
// tsParticles setup
import Particles from "@tsparticles/react";

const options = {
  particles: {
    number: { value: 80 },
    color: { value: "#3b82f6" },
    links: { enable: true, color: "#3b82f6", distance: 150, opacity: 0.3 },
    move: { enable: true, speed: 1 },
    size: { value: { min: 1, max: 3 } },
    opacity: { value: { min: 0.3, max: 0.8 } },
  },
  interactivity: {
    events: {
      onHover: { enable: true, mode: "grab" },
      onClick: { enable: true, mode: "push" },
    },
  },
};
```

## 5.3 Cursor Effects

```css
/* Custom cursor */
body { cursor: none; }
.cursor {
  position: fixed;
  width: 20px; height: 20px;
  border: 2px solid #3b82f6;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  transition: transform 0.1s ease, width 0.2s, height 0.2s;
  transform: translate(-50%, -50%);
}
.cursor.hovering { width: 50px; height: 50px; background: rgba(59,130,246,0.1); }
```

```javascript
// Cursor follower with lag
const cursor = document.querySelector('.cursor');
let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0;

document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

function animate() {
  cursorX += (mouseX - cursorX) * 0.15;
  cursorY += (mouseY - cursorY) * 0.15;
  cursor.style.left = cursorX + 'px';
  cursor.style.top = cursorY + 'px';
  requestAnimationFrame(animate);
}
animate();

// Magnetic button
document.querySelectorAll('.magnetic').forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translate(0, 0)';
    btn.style.transition = 'transform 0.3s ease';
  });
});
```

## 5.4 Image Effects

```css
/* Hover zoom with overlay */
.image-zoom {
  overflow: hidden; border-radius: 12px;
  position: relative;
}
.image-zoom img {
  transition: transform 0.5s ease;
  width: 100%; display: block;
}
.image-zoom:hover img { transform: scale(1.08); }
.image-zoom::after {
  content: "";
  position: absolute; inset: 0;
  background: linear-gradient(transparent 50%, rgba(0,0,0,0.7));
  opacity: 0;
  transition: opacity 0.3s;
}
.image-zoom:hover::after { opacity: 1; }

/* Before/After slider */
.compare-slider {
  position: relative;
  overflow: hidden;
}
.compare-after {
  position: absolute; inset: 0;
  clip-path: inset(0 50% 0 0);
}
/* Drag input[type=range] to change clip-path */

/* Tilt effect on images */
.tilt-image {
  transition: transform 0.3s ease;
}
.tilt-image:hover {
  transform: perspective(800px) rotateX(3deg) rotateY(-5deg) scale(1.02);
}
```

## 5.5 Animated Backgrounds

```css
/* Wave animation */
.wave-bg {
  position: relative;
  overflow: hidden;
}
.wave-bg::after {
  content: "";
  position: absolute;
  bottom: -50%;
  left: -50%;
  width: 200%; height: 200%;
  background: radial-gradient(ellipse at center, rgba(59,130,246,0.15) 0%, transparent 70%);
  animation: wave-float 8s ease-in-out infinite;
}
@keyframes wave-float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(3%, -3%) rotate(1deg); }
  66% { transform: translate(-2%, 2%) rotate(-1deg); }
}

/* Animated mesh gradient */
.mesh-animate {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}
.mesh-animate::before, .mesh-animate::after {
  content: "";
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.5;
  animation: mesh-move 12s ease-in-out infinite alternate;
}
.mesh-animate::before {
  width: 50%; height: 50%;
  background: #06b6d4;
  top: -10%; left: -10%;
}
.mesh-animate::after {
  width: 40%; height: 40%;
  background: #f472b6;
  bottom: -10%; right: -10%;
  animation-delay: -6s;
}
@keyframes mesh-move {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(15%, 15%) scale(1.2); }
}
```

## 5.6 Scroll Experiences

### Parallax Effect

```css
/* CSS-only parallax */
.parallax-container {
  height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  perspective: 1px;
}
.parallax-layer-back {
  transform: translateZ(-1px) scale(2);
}
.parallax-layer-front {
  transform: translateZ(0);
}
```

```javascript
// JavaScript parallax
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  document.querySelectorAll('.parallax').forEach(el => {
    const speed = el.dataset.speed || 0.5;
    el.style.transform = `translateY(${scrolled * speed}px)`;
  });
});
```

### Horizontal Scroll Section

```css
.horizontal-scroll {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
.horizontal-scroll > * {
  flex: 0 0 100vw;
  scroll-snap-align: start;
}
```

### GSAP ScrollTrigger

```javascript
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

// Pin section while scrolling
gsap.to('.pinned-section', {
  scrollTrigger: {
    trigger: '.pinned-section',
    start: 'top top',
    end: '+=300%',
    pin: true,
    scrub: 1,
  },
  x: '-200%',
});

// Reveal on scroll
gsap.from('.reveal-element', {
  scrollTrigger: {
    trigger: '.reveal-element',
    start: 'top 80%',
    toggleActions: 'play none none reverse',
  },
  y: 60,
  opacity: 0,
  duration: 1,
  ease: 'power3.out',
});
```

## 5.7 Page Transitions

### View Transitions API (Native)

```css
@view-transition { navigation: auto; }

::view-transition-old(root) {
  animation: 0.3s ease both fade-out, 0.3s ease both slide-to-left;
}
::view-transition-new(root) {
  animation: 0.3s ease both fade-in, 0.3s ease both slide-from-right;
}

@keyframes fade-out { to { opacity: 0; } }
@keyframes fade-in { from { opacity: 0; } }
@keyframes slide-to-left { to { transform: translateX(-20px); } }
@keyframes slide-from-right { from { transform: translateX(20px); } }
```

### Shared Element Transitions

```css
.card-thumbnail { view-transition-name: hero-image; }
.detail-hero    { view-transition-name: hero-image; }

::view-transition-group(hero-image) {
  animation-duration: 0.5s;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

## 5.8 Creative Coding Libraries

| Library | Type | Best For |
|---------|------|----------|
| Three.js | WebGL 3D | 3D scenes, product viewers |
| React Three Fiber | React + Three.js | React 3D integration |
| p5.js | Creative coding | Generative art, sketches |
| Pixi.js | 2D WebGL | Games, data viz, particles |
| Two.js | 2D SVG/Canvas | Animated illustrations |
| Zdog | Pseudo-3D | Flat-shaded 3D illustrations |
| Paper.js | Vector graphics | Complex SVG manipulation |
| Matter.js | Physics engine | 2D physics simulations |
| Cannon.js | Physics engine | 3D physics simulations |

## 5.9 Audio Visualization

```javascript
const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 256;

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

function draw() {
  analyser.getByteFrequencyData(dataArray);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const barWidth = canvas.width / bufferLength;
  dataArray.forEach((value, i) => {
    const barHeight = (value / 255) * canvas.height;
    ctx.fillStyle = `hsl(${(i / bufferLength) * 360}, 80%, 60%)`;
    ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
  });

  requestAnimationFrame(draw);
}
```

## 5.10 Generative Art Patterns

```javascript
// Flow field with Perlin noise (p5.js)
function draw() {
  for (let x = 0; x < width; x += 10) {
    for (let y = 0; y < height; y += 10) {
      const angle = noise(x * 0.005, y * 0.005, frameCount * 0.01) * TWO_PI * 2;
      push();
      translate(x, y);
      rotate(angle);
      stroke(255, 50);
      line(0, 0, 10, 0);
      pop();
    }
  }
}
```

## 5.11 Kinetic Typography

```html
<!-- Text on SVG path -->
<svg viewBox="0 0 500 200">
  <defs>
    <path id="curve" d="M 10 80 Q 95 10 180 80 T 350 80 T 520 80" fill="none" />
  </defs>
  <text font-size="20" fill="currentColor">
    <textPath href="#curve">Text flowing along a curved path</textPath>
  </text>
</svg>
```

```css
/* Marquee / infinite scrolling text */
.marquee { overflow: hidden; white-space: nowrap; }
.marquee-content {
  display: inline-flex;
  animation: marquee 20s linear infinite;
}
.marquee-content > * { flex-shrink: 0; padding-inline: 2rem; }
@keyframes marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.marquee:hover .marquee-content { animation-play-state: paused; }

/* Circular text */
.circular-text span {
  position: absolute;
  left: 50%; top: 0;
  transform-origin: 0 150px; /* radius */
  transform: rotate(calc(var(--index) * 12deg));
}
```

---

# 6. Performance & Best Practices

## 6.1 Animation Performance

```css
/* GPU-accelerated properties (composite-only) */
.performant {
  transform: translateZ(0);    /* triggers GPU layer */
  will-change: transform;      /* hint to browser */
  contain: layout style paint; /* isolate from rest of page */
}

/* Use transform instead of top/left */
.bad  { top: 100px; }     /* triggers layout */
.good { transform: translateY(100px); } /* composite only */

/* Use opacity instead of visibility/display */
.bad  { visibility: hidden; }
.good { opacity: 0; }

/* Remove will-change after animation */
.animate { will-change: transform; }
.animate.done { will-change: auto; }
```

### Animation Frame Budget

At 60fps, each frame has **16.67ms**:
- **Layout:** < 4ms
- **Paint:** < 4ms
- **Composite:** < 2ms
- **JavaScript:** < 6ms

### Performance Checklist

1. Only animate `transform` and `opacity` when possible
2. Use `will-change` sparingly (max 2-3 elements)
3. Prefer CSS animations over JS for simple transitions
4. Use `requestAnimationFrame` for JS animations
5. Debounce scroll/resize event handlers
6. Use `IntersectionObserver` for scroll-triggered effects
7. Lazy-load below-fold animations
8. Respect `prefers-reduced-motion`
9. Use `contain: layout` to isolate animated elements
10. Test with DevTools Performance panel at 4x CPU throttle

## 6.2 Image Performance

```html
<!-- Lazy loading -->
<img src="photo.webp" loading="lazy" decoding="async" alt="..." />

<!-- Responsive with srcset -->
<img srcset="photo-400.webp 400w, photo-800.webp 800w, photo-1200.webp 1200w"
     sizes="(min-width: 1024px) 50vw, 100vw"
     src="photo-800.webp" alt="..." loading="lazy" />

<!-- Prevent CLS with aspect-ratio -->
<img src="photo.webp" width="800" height="450" alt="..."
     style="aspect-ratio: 16/9; width: 100%; height: auto;" />
```

## 6.3 Core Web Vitals Targets

| Metric | Good | Needs Work | Poor |
|--------|------|-----------|------|
| **LCP** (Largest Contentful Paint) | < 2.5s | 2.5-4s | > 4s |
| **INP** (Interaction to Next Paint) | < 200ms | 200-500ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | 0.1-0.25 | > 0.25 |

### Quick Wins

- Preload LCP image: `<link rel="preload" as="image" href="hero.webp">`
- Use `fetchpriority="high"` on hero image
- Inline critical CSS in `<head>`
- Defer non-critical JS: `<script defer>`
- Use `content-visibility: auto` for below-fold content

---

# 7. Library Reference

## Animation Libraries

| Library | Size | Type | Best For |
|---------|------|------|----------|
| **GSAP** | ~25KB | JS | Professional-grade, ScrollTrigger, SVG morph |
| **Framer Motion** | ~32KB | React | Declarative, layout animations, gestures |
| **Motion One** | ~3.8KB | JS | Lightweight, Web Animations API |
| **AutoAnimate** | ~2KB | JS | Drop-in children animations |
| **anime.js** | ~17KB | JS | SVG, CSS, DOM animations |
| **Lottie** | ~50KB | JS | After Effects animations |
| **react-spring** | ~18KB | React | Physics-based spring animations |

## UI Component Libraries

| Library | Type | Framework |
|---------|------|-----------|
| **shadcn/ui** | Copy-paste components | React + Tailwind |
| **Radix UI** | Headless primitives | React |
| **Headless UI** | Headless components | React / Vue |
| **React Aria** | Accessible hooks | React |
| **Ark UI** | Headless, state machines | React / Vue / Solid |
| **Melt UI** | Headless | Svelte |

## CSS Tools

| Library | Purpose |
|---------|---------|
| **Tailwind CSS** | Utility-first CSS framework |
| **Open Props** | CSS custom property defaults |
| **UnoCSS** | Atomic CSS engine |
| **Panda CSS** | Build-time CSS-in-JS |
| **CVA** | Class Variance Authority for variants |

## Scroll & Effects

| Library | Purpose |
|---------|---------|
| **GSAP ScrollTrigger** | Scroll-linked animations |
| **Lenis** | Smooth scrolling |
| **Locomotive Scroll** | Smooth scroll + parallax |
| **tsParticles** | Particle effects |
| **vanilla-tilt** | 3D tilt effect |
| **Splitting.js** | Text splitting for animation |

## Data & Charts

| Library | Best For |
|---------|----------|
| **Recharts** | React charts (simple) |
| **Chart.js** | Canvas charts (lightweight) |
| **Nivo** | React charts (beautiful) |
| **Tremor** | Dashboard components |
| **TanStack Table** | Headless data tables |
| **AG Grid** | Enterprise data grid |
| **D3** | Custom visualizations |

## 3D & Creative

| Library | Purpose |
|---------|---------|
| **Three.js** | 3D WebGL scenes |
| **React Three Fiber** | React + Three.js |
| **Drei** | R3F helpers |
| **p5.js** | Creative coding |
| **Pixi.js** | 2D WebGL renderer |
| **Matter.js** | 2D physics |
| **Spline** | 3D design tool (web export) |

## Utility Libraries

| Library | Purpose |
|---------|---------|
| **cmdk** | Command palette |
| **Vaul** | Drawer/bottom sheet |
| **Sonner** | Toast notifications |
| **@dnd-kit** | Drag and drop |
| **@tanstack/react-virtual** | Virtual scrolling |
| **react-loading-skeleton** | Skeleton screens |
| **canvas-confetti** | Confetti effects |

## Design Token Tools

| Tool | Purpose |
|------|---------|
| **Style Dictionary** | Transform design tokens to code |
| **Tokens Studio** | Figma-to-code token sync |
| **utopia.fyi** | Fluid type/space calculator |
| **Storybook** | Component documentation |
| **Chromatic** | Visual regression testing |

---

## Modern CSS Feature Support (2026)

| Feature | Key CSS | Support |
|---------|---------|---------|
| Subgrid | `grid-template-rows: subgrid` | All modern (2023+) |
| Container Queries | `container-type: inline-size` | All modern (2023+) |
| OKLCH Colors | `oklch(0.6 0.2 250)` | All modern (2023+) |
| Relative Color | `oklch(from var(--c) calc(l+0.1) c h)` | Chrome 119+, Safari 16.4+ |
| Popover API | `popover` attribute | Chrome 114+, Safari 17+, FF 125+ |
| @starting-style | Entry animations | Chrome 117+, Safari 17.4+ |
| View Transitions | `document.startViewTransition()` | Chrome 111+, Safari 18+ |
| Scroll-driven Animations | `animation-timeline: scroll()` | Chrome 115+ |
| Anchor Positioning | `anchor-name` | Chrome 125+ |
| `text-wrap: balance` | Balanced headings | Chrome 114+, FF 121+, Safari 17.5+ |
| `text-wrap: pretty` | No orphans | Chrome 117+, FF 126+, Safari 17.5+ |
| CSS Nesting | Native nesting | All modern (2023+) |
| `color-mix()` | Color blending | All modern (2023+) |
| `@property` | Custom property types | Chrome 85+, Safari 15.4+, FF 128+ |
| `initial-letter` | Drop caps | Chrome 110+, Safari 9+ |
| Masonry (CSS) | `grid-template-rows: masonry` | Firefox flag only |
| `@layer` | Cascade layers | All modern (2022+) |

---

## Architecture Principles

1. **Minimize media queries** - use `clamp()`, `auto-fit/minmax()`, container queries
2. **CSS custom properties** as theme backbone - cascade, override per-scope, enable runtime theming
3. **OKLCH** for palette generation - perceptually uniform colors
4. **Native HTML** first - `<dialog>`, `<details>`, `popover` before JS libraries
5. **Layered shadows** - multiple small shadows > single large shadow
6. **Skeleton screens** - always preferred over spinners for content loading
7. **`grid-template-rows: 0fr/1fr`** - modern way to animate height 0 to auto
8. **Headless components** (Radix, React Aria) + styling (CVA, Tailwind) = maximum flexibility
9. **Progressive enhancement** - build for no-JS, enhance with JS
10. **Respect user preferences** - `prefers-reduced-motion`, `prefers-color-scheme`, `forced-colors`

---

> **Tools Reference:**
> Clippy (clip-path) | Blobmaker (blobs) | Haikei (SVG backgrounds) | shadows.brumm.af (shadows) | meshgradient.in (gradients) | utopia.fyi (fluid type) | type-scale.com (scales) | heropatterns.com (patterns) | Fancy Border Radius (9elements) | v-fonts.com (variable fonts) | wakamaifondue.com (font inspector)
