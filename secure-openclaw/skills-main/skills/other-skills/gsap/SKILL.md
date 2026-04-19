---
name: gsap
description: >
  Use this skill whenever the user wants to animate anything using GSAP (GreenSock Animation Platform).
  Trigger for any request involving: GSAP animations, tweens, timelines, ScrollTrigger, SplitText,
  Flip, Draggable, MorphSVG, MotionPath, scroll-based animations, web page animations, interactive
  UI animations, SVG animations, text animations, or any JavaScript animation library work. Also
  trigger when the user asks to "animate", "transition", or "add motion" to HTML/React/web content
  and GSAP would be the best tool for the job. Always consult this skill before writing any GSAP code.
---

# GSAP Animation Skill

GSAP (GreenSock Animation Platform) v3 — the industry-standard JavaScript animation library.

**Docs:** https://gsap.com/docs/v3/GSAP/  
**Cheatsheet:** https://gsap.com/cheatsheet  
**Plugins reference index:** see `references/plugins.md`  
**Special properties reference:** see `references/special-properties.md`

---

## Installation

```html
<!-- CDN (HTML artifacts) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>

<!-- ScrollTrigger plugin (add after gsap) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>

<!-- Register plugins before use -->
<script>gsap.registerPlugin(ScrollTrigger);</script>
```

```bash
# npm
npm install gsap
```

```js
// ES module import
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
```

---

## Core Concepts

### Tween — the animation workhorse

A tween animates one or more properties of one or more targets over time.

```js
// gsap.to() — animate FROM current values TO these values
gsap.to(".box", { x: 200, rotation: 360, duration: 1, ease: "power2.out" });

// gsap.from() — animate FROM these values TO current values
gsap.from(".box", { opacity: 0, y: -50, duration: 0.8 });

// gsap.fromTo() — define both start AND end values
gsap.fromTo(".box", { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 1 });

// gsap.set() — instantly set values (no animation, duration: 0)
gsap.set(".box", { x: 100, opacity: 0 });
```

### Timeline — sequencing container

A timeline holds and sequences multiple tweens.

```js
const tl = gsap.timeline({ defaults: { ease: "power2.out", duration: 0.8 } });

// Chain tweens — they play one after another by default
tl.from(".heading", { y: -30, opacity: 0 })
  .from(".subtitle", { y: -20, opacity: 0 })
  .from(".btn", { scale: 0.8, opacity: 0 });

// Position parameter controls WHEN a tween starts
tl.to(".a", { x: 100 })                // starts at end of previous
  .to(".b", { x: 100 }, "<")          // starts at SAME time as previous
  .to(".c", { x: 100 }, "<0.2")       // 0.2s after .b starts
  .to(".d", { x: 100 }, "+=0.5")      // 0.5s after the timeline ends
  .to(".e", { x: 100 }, 2)            // at exactly t=2s
  .to(".f", { x: 100 }, "myLabel");   // at a named label
```

### Position Parameter Quick Reference

| Value | Meaning |
|-------|---------|
| (none) | End of timeline |
| `"<"` | Start of previous tween |
| `">"` | End of previous tween |
| `"<0.5"` | 0.5s after previous starts |
| `"-=0.3"` | 0.3s before timeline end |
| `"+=0.3"` | 0.3s after timeline end |
| `2` | Absolute time 2s |
| `"label"` | At named label |

---

## Common Animatable Properties

```js
gsap.to(".box", {
  // Transform shortcuts (use these — NOT raw CSS transforms)
  x: 100,           // translateX (px)
  y: 50,            // translateY (px)
  xPercent: -50,    // translateX (%)
  yPercent: -50,    // translateY (%)
  rotation: 360,    // degrees
  rotationX: 45,    // 3D
  rotationY: 45,    // 3D
  scale: 1.5,       // scaleX + scaleY
  scaleX: 2,
  scaleY: 0.5,
  skewX: 15,
  skewY: 10,

  // CSS properties (camelCase)
  opacity: 0,
  width: "200px",
  backgroundColor: "#ff0000",
  borderRadius: "50%",
  color: "blue",

  // Animation options
  duration: 1,          // seconds
  delay: 0.5,           // seconds before starting
  ease: "power2.inOut", // easing function
  repeat: -1,           // -1 = infinite
  yoyo: true,           // reverse on repeat
  stagger: 0.1,         // delay between each target
});
```

---

## Easing

```js
// Built-in ease families (append .in, .out, .inOut)
"none"           // linear
"power1.out"     // subtle
"power2.out"     // smooth (default-ish)
"power3.out"     // more pronounced
"power4.out"     // aggressive
"back.out(1.7)"  // overshoot
"elastic.out(1, 0.3)"  // springy
"bounce.out"     // bouncy
"circ.out"       // circular
"expo.out"       // exponential
"sine.out"       // sine wave

// Step easing
"steps(5)"       // 5 discrete steps

// Custom ease
CustomEase.create("myEase", "M0,0 C0.126,0.382 0.282,0.674 0.44,0.822...")
```

---

## Special Properties (Callbacks & Controls)

```js
gsap.to(".box", {
  x: 200,
  duration: 1,
  
  // Callbacks
  onStart: () => console.log("started"),
  onComplete: () => console.log("done"),
  onUpdate: () => console.log("updating"),
  onRepeat: () => console.log("repeating"),
  
  // Stagger (when multiple targets)
  stagger: {
    amount: 1,        // total stagger time spread across all elements
    from: "center",   // "start" | "end" | "center" | "edges" | "random" | index
    grid: "auto",     // for grid layouts
    ease: "power1.in",
  },
  
  // Control
  id: "myTween",          // for gsap.getById()
  paused: true,           // don't autoplay
  immediateRender: false, // don't apply start values immediately
  overwrite: "auto",      // handle conflicts automatically
});
```

---

## Tween & Timeline Control Methods

```js
const tween = gsap.to(".box", { x: 200, duration: 2, paused: true });
const tl = gsap.timeline({ paused: true });

// Playback
tween.play();
tween.pause();
tween.reverse();
tween.restart();
tween.resume();

// Seek
tween.seek(0.5);         // jump to 0.5s
tl.seek("myLabel");      // jump to label
tween.progress(0.5);     // jump to 50% through
tween.time(1);           // jump to 1s

// Speed
tween.timeScale(2);      // 2x speed
tween.timeScale(0.5);    // half speed

// Info
tween.duration();        // total duration
tween.progress();        // 0 to 1
tween.isActive();        // currently playing?

// Cleanup
tween.kill();            // destroy tween
gsap.killTweensOf(".box"); // kill all tweens on target
```

---

## ScrollTrigger

Read `references/plugins.md` → ScrollTrigger section for full API.

```js
gsap.registerPlugin(ScrollTrigger);

// Basic scroll-triggered animation
gsap.to(".box", {
  x: 500,
  scrollTrigger: {
    trigger: ".box",       // element that triggers
    start: "top 80%",      // [trigger position] [viewport position]
    end: "bottom 20%",
    scrub: true,           // links animation to scroll position
    pin: true,             // pin trigger during animation
    markers: true,         // show debug markers (remove in prod)
  }
});

// Standalone ScrollTrigger (for callbacks only)
ScrollTrigger.create({
  trigger: ".section",
  start: "top center",
  onEnter: () => console.log("entered"),
  onLeave: () => console.log("left"),
  onEnterBack: () => console.log("re-entered"),
});
```

**start/end format:** `"[triggerPosition] [scrollerPosition]"`  
Trigger positions: `top`, `center`, `bottom`, `Npx`, `N%`  
Scroller positions: `top`, `center`, `bottom`, `Npx`, `N%`

---

## React Usage

```jsx
import { useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react"; // preferred

gsap.registerPlugin(useGSAP);

function MyComponent() {
  const container = useRef();
  
  useGSAP(() => {
    // GSAP context — auto-cleanup on unmount
    gsap.from(".box", { opacity: 0, y: 30, duration: 0.8 });
  }, { scope: container });
  
  return (
    <div ref={container}>
      <div className="box">Hello</div>
    </div>
  );
}
```

---

## gsap.matchMedia() — Responsive Animations

```js
const mm = gsap.matchMedia();

mm.add("(min-width: 800px)", () => {
  // desktop animations
  gsap.to(".hero", { x: 200, duration: 1 });
});

mm.add("(max-width: 799px)", () => {
  // mobile animations
  gsap.to(".hero", { y: 50, duration: 0.5 });
});

// Cleanup
mm.revert(); // remove all contexts
```

---

## gsap.context() — Scoping & Cleanup

```js
const ctx = gsap.context(() => {
  gsap.from(".card", { opacity: 0, y: 30, stagger: 0.1 });
  gsap.to(".bg", { backgroundPosition: "50% 100%", duration: 5, repeat: -1 });
}, containerRef); // scoped to a container element

// Later (e.g., component unmount)
ctx.revert(); // kills all tweens and reverts all changes
```

---

## Utility Methods

```js
gsap.utils.clamp(0, 100, 150);     // → 100
gsap.utils.mapRange(0,1, 0,100, 0.5); // → 50
gsap.utils.interpolate("red","blue", 0.5); // → midpoint color
gsap.utils.random(0, 100);         // random number
gsap.utils.random(["a","b","c"]);  // random from array
gsap.utils.snap(5, 13);            // → 15 (snap to nearest 5)
gsap.utils.wrap(0, 5, 6);          // → 1 (wrap around)
gsap.utils.toArray(".items");      // selector → array
```

---

## Common Patterns

### Page load entrance animation
```js
const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.8 } });
tl.from("nav", { y: -60, opacity: 0 })
  .from(".hero-title", { y: 40, opacity: 0 }, "-=0.4")
  .from(".hero-subtitle", { y: 30, opacity: 0 }, "-=0.5")
  .from(".hero-btn", { scale: 0.9, opacity: 0 }, "-=0.4");
```

### Scroll reveal (stagger cards)
```js
gsap.from(".card", {
  scrollTrigger: {
    trigger: ".cards-section",
    start: "top 75%",
  },
  opacity: 0,
  y: 50,
  stagger: 0.15,
  duration: 0.8,
  ease: "power2.out",
});
```

### Infinite loop animation
```js
gsap.to(".spinner", {
  rotation: 360,
  duration: 1,
  ease: "none",
  repeat: -1,
});
```

### Hover animation
```js
const btn = document.querySelector(".btn");
btn.addEventListener("mouseenter", () => gsap.to(btn, { scale: 1.05, duration: 0.2 }));
btn.addEventListener("mouseleave", () => gsap.to(btn, { scale: 1, duration: 0.2 }));
```

---

## Key Rules & Best Practices

1. **Use transform shortcuts** (`x`, `y`, `rotation`, `scale`) not raw CSS `transform`. GSAP optimizes these for performance.
2. **Use `gsap.context()`** in React/frameworks — ensures proper cleanup.
3. **Register plugins** with `gsap.registerPlugin()` before use — do it once at app root.
4. **`overwrite: "auto"`** to avoid conflicts when re-triggering tweens.
5. **`immediateRender: false`** on `gsap.from()` when multiple tweens target the same element to prevent flicker.
6. **Remove ScrollTrigger markers** (`markers: true`) before production.
7. **Use `scrub: true`** for scroll-linked animations; use `toggleActions` for trigger-only animations.
8. **Prefer timelines** over multiple standalone tweens for sequenced animations — easier to manage and control.

---

## Plugin Reference

For detailed plugin APIs (ScrollTrigger, SplitText, Flip, Draggable, MorphSVG, MotionPath, etc.), read:

📄 `references/plugins.md`

For complete special properties and vars options:

📄 `references/special-properties.md`
