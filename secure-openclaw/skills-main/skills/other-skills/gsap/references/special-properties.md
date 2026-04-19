# GSAP Special Properties & Vars Reference

Full docs: https://gsap.com/docs/v3/GSAP/Tween  
Timeline docs: https://gsap.com/docs/v3/GSAP/Timeline

---

## Tween Special Properties

These go inside the `vars` object of any `gsap.to/from/fromTo()` call.

### Timing

| Property | Type | Description |
|----------|------|-------------|
| `duration` | number | Duration in seconds (default: 0.5) |
| `delay` | number | Seconds before starting |
| `endDelay` | number | Seconds to add after animation completes |
| `repeat` | number | Times to repeat. -1 = infinite |
| `repeatDelay` | number | Seconds between repeats |
| `yoyo` | boolean | Reverse direction on each repeat |
| `yoyoEase` | string/boolean | Separate ease for reverse direction |
| `repeatRefresh` | boolean | Re-evaluate start values on each repeat |

### Easing

| Property | Type | Description |
|----------|------|-------------|
| `ease` | string/function | Easing function |

### Stagger

```js
// Simple stagger
stagger: 0.1   // seconds between each element

// Advanced stagger object
stagger: {
  amount: 1,            // total time distributed across all elements
  each: 0.1,            // time between each (alternative to amount)
  from: "center",       // "start" | "end" | "center" | "edges" | "random" | index number
  grid: "auto",         // [rows, cols] or "auto" for grid stagger
  axis: "y",            // "x" | "y" for grid stagger direction
  ease: "power1.in",    // ease of the stagger distribution itself
}
```

### Callbacks

| Property | Type | Description |
|----------|------|-------------|
| `onStart` | function | Called when animation starts |
| `onStartParams` | array | Args to pass to onStart |
| `onComplete` | function | Called when animation completes |
| `onCompleteParams` | array | Args to pass to onComplete |
| `onUpdate` | function | Called on every frame |
| `onUpdateParams` | array | Args to pass to onUpdate |
| `onRepeat` | function | Called each time it repeats |
| `onRepeatParams` | array | Args to pass to onRepeat |
| `onReverseComplete` | function | Called when reversed animation completes |
| `onInterrupt` | function | Called when interrupted by kill/overwrite |

### Control & Identity

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Identifier for `gsap.getById()` |
| `paused` | boolean | Start in paused state |
| `reversed` | boolean | Start reversed |
| `immediateRender` | boolean | Apply starting values immediately (true by default for `from()`) |
| `lazy` | boolean | Delay rendering until next tick |
| `autoRevert` | boolean | Auto-revert on kill (default true) |
| `data` | any | Arbitrary data attached to the tween |

### Conflict Resolution

| Property | Type | Description |
|----------|------|-------------|
| `overwrite` | boolean/"auto" | `true` = kill all existing tweens on targets, `"auto"` = only kill conflicting properties |

### CSS-specific

| Property | Type | Description |
|----------|------|-------------|
| `force3D` | boolean/"auto" | Force GPU acceleration |
| `transformOrigin` | string | e.g., `"50% 50%"`, `"top left"` |
| `transformPerspective` | number | Perspective for 3D transforms (px) |
| `svgOrigin` | string | Transform origin for SVG elements |
| `smoothOrigin` | boolean | Smoothly update transformOrigin |

### Plugin-specific

| Property | Type | Description |
|----------|------|-------------|
| `scrollTrigger` | object | ScrollTrigger config (see plugins.md) |
| `motionPath` | object/string | MotionPath config |
| `morphSVG` | string/element | Target SVG to morph to |
| `drawSVG` | string | Draw amount e.g. `"0% 100%"` |
| `text` | string/object | TextPlugin config |
| `scrambleText` | string/object | ScrambleText config |
| `inertia` | object | InertiaPlugin config |

---

## Timeline Special Properties (gsap.timeline() vars)

```js
gsap.timeline({
  // All Tween special properties work here as defaults
  defaults: {
    duration: 0.8,
    ease: "power2.out",
  },
  
  // Timeline-specific
  paused: false,
  reversed: false,
  delay: 0,
  repeat: -1,
  repeatDelay: 0,
  yoyo: false,
  
  // Auto-remove tweens after they complete (saves memory for infinite timelines)
  autoRemoveChildren: false,
  
  // Smooth child timing adjustments
  smoothChildTiming: true,
  
  onStart: () => {},
  onComplete: () => {},
  onUpdate: () => {},
  onRepeat: () => {},
  onReverseComplete: () => {},
  
  // ScrollTrigger for the whole timeline
  scrollTrigger: { trigger: ".section", scrub: true },
})
```

---

## gsap.config() Global Settings

```js
gsap.config({
  autoSleep: 60,         // seconds of inactivity before pausing ticker
  force3D: "auto",       // GPU acceleration strategy
  nullTargetWarn: false, // suppress "target not found" warnings
  trialWarn: false,      // suppress trial plugin warnings
  units: { x: "px", y: "px", rotation: "deg" }, // default units
});
```

---

## gsap.defaults() — Apply to All Tweens

```js
// Set defaults for all subsequent tweens
gsap.defaults({
  ease: "power2.out",
  duration: 0.8,
});
```

---

## CSS Plugin — Animatable CSS Properties

GSAP can animate any numeric CSS property. Common ones:

```js
// Colors
backgroundColor, color, borderColor, outlineColor, fill, stroke

// Box model
width, height, maxWidth, maxHeight,
padding, paddingTop, paddingRight, paddingBottom, paddingLeft,
margin, marginTop, etc.,
borderWidth, borderRadius,

// Position
top, left, right, bottom,

// Visual
opacity, visibility, zIndex, filter,
backgroundPosition, backgroundSize,
boxShadow, textShadow,

// Transforms (use GSAP shortcuts instead — more performant)
// x, y, rotation, scale, skewX, skewY etc.

// Clips
clip, clipPath,

// Typography
fontSize, lineHeight, letterSpacing, wordSpacing,
```

**IMPORTANT:** GSAP's transform shortcuts (`x`, `y`, `rotation`, `scale`) are always preferred over raw `transform` CSS because they're independently controllable and GPU-optimized.

---

## Keyframes

Instead of multiple separate tweens, use keyframes:

```js
gsap.to(".box", {
  keyframes: [
    { x: 100, duration: 0.5 },
    { y: 100, duration: 0.5, ease: "bounce.out" },
    { opacity: 0, duration: 0.3 },
  ],
  // or as an object with % keys
  keyframes: {
    "0%":   { x: 0, y: 0 },
    "50%":  { x: 200, ease: "power1.in" },
    "100%": { x: 200, y: 200 },
    ease: "power1.inOut",  // overall ease
  }
});
```

---

## Targets — What GSAP Can Animate

```js
// CSS selector string
gsap.to(".box", {...});
gsap.to("#hero, .card", {...});  // multiple

// DOM element(s)
gsap.to(document.querySelector(".box"), {...});
gsap.to(document.querySelectorAll(".cards"), {...});

// Array of elements
gsap.to([el1, el2, el3], {...});

// Generic JS object (not DOM)
const obj = { value: 0 };
gsap.to(obj, { value: 100, onUpdate: () => render(obj.value) });

// React ref
gsap.to(myRef.current, {...});
```

---

## Quick Reference: Ease String Syntax

```
power0 / none / linear
power1 / power1.in / power1.out / power1.inOut
power2 / power2.in / power2.out / power2.inOut
power3.out
power4.out
back.out(1.7)          ← overshoot amount in parens
elastic.out(1, 0.3)    ← amplitude, period
bounce.out
circ.out
expo.out
sine.out
steps(n)               ← stepped easing, n = number of steps
"M0,0 C..."            ← custom SVG cubic bezier (use CustomEase)
```
