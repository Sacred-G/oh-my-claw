# GSAP Plugin Reference

Full docs: https://gsap.com/docs/v3/Plugins/

---

## Table of Contents
- [ScrollTrigger](#scrolltrigger) — scroll-based animations
- [SplitText](#splittext) — split text into chars/words/lines
- [Flip](#flip) — smooth layout transitions (FLIP technique)
- [Draggable](#draggable) — drag-and-drop
- [MotionPath](#motionpath) — animate along SVG paths
- [MorphSVG](#morphsvg) — morph between SVG shapes
- [Observer](#observer) — detect scroll/touch/pointer velocity
- [ScrollSmoother](#scrollsmoother) — smooth scrolling
- [ScrollTo](#scrollto) — scroll to position/element
- [TextPlugin](#textplugin) — type-writer text replacement
- [ScrambleText](#scrambletext) — scramble text effect
- [Inertia](#inertia) — physics-based momentum
- [DrawSVG](#drawsvg) — animate SVG stroke drawing

---

## ScrollTrigger

**CDN:** `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js`

```js
gsap.registerPlugin(ScrollTrigger);
```

### Core Config

```js
gsap.to(".element", {
  x: 500,
  scrollTrigger: {
    trigger: ".element",     // Element that triggers the animation
    scroller: window,        // What to listen to for scroll (default: window)
    start: "top 80%",        // "triggerPos scrollerPos"
    end: "bottom 20%",       // "triggerPos scrollerPos"
    
    // Playback modes (use one)
    scrub: true,             // Links progress to scroll position (smoothly)
    scrub: 1,                // 1 second lag behind scroll
    toggleActions: "play pause resume reset", // onEnter onLeave onEnterBack onLeaveBack
    // toggleActions values: play, pause, resume, reverse, restart, reset, complete, none
    
    pin: true,               // Pin trigger element during animation
    pin: ".other-element",   // Pin a different element
    pinSpacing: true,        // Add space after pin (default true)
    
    anticipatePin: 1,        // Reduces pin jumping (0-1)
    markers: true,           // Debug markers
    id: "myTrigger",         // For getById()
    
    // Callbacks
    onEnter: (self) => {},
    onLeave: (self) => {},
    onEnterBack: (self) => {},
    onLeaveBack: (self) => {},
    onUpdate: (self) => console.log(self.progress),
    onToggle: (self) => {},
    onRefresh: (self) => {},
    
    // Horizontal scrolling
    horizontal: false,
  }
});
```

### ScrollTrigger Static Methods

```js
// Refresh after layout changes
ScrollTrigger.refresh();

// Kill all ScrollTriggers
ScrollTrigger.killAll();

// Get all ScrollTrigger instances
ScrollTrigger.getAll();

// Batch animate multiple elements entering viewport
ScrollTrigger.batch(".card", {
  onEnter: (elements) => gsap.from(elements, { opacity: 0, y: 40, stagger: 0.1 }),
});

// Config global settings
ScrollTrigger.config({
  limitCallbacks: true,     // more efficient
  ignoreMobileResize: true, // don't refresh on mobile keyboard
});

// Normalize scroll (mobile-friendly)
ScrollTrigger.normalizeScroll(true);
```

### Horizontal Scroll

```js
const sections = gsap.utils.toArray(".section");
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".container",
    pin: true,
    scrub: 1,
    end: () => "+=" + document.querySelector(".container").offsetWidth,
  }
});
tl.to(sections, { xPercent: -100 * (sections.length - 1), ease: "none" });
```

---

## SplitText

**Requires GSAP Club (paid).** Splits text into animatable chars/words/lines.

```js
gsap.registerPlugin(SplitText);

// Split the text
const split = SplitText.create(".heading", { type: "chars,words,lines" });
// or
const split = new SplitText(".heading", { type: "chars" });

// Animate the pieces
gsap.from(split.chars, {
  opacity: 0,
  y: 20,
  rotationX: -90,
  stagger: 0.02,
  duration: 0.5,
  ease: "back.out",
});

// Cleanup
split.revert(); // restores original HTML
```

**Available arrays after splitting:**
- `split.chars` — individual characters
- `split.words` — individual words  
- `split.lines` — individual lines

---

## Flip

Animate between two states with the FLIP technique (no position math needed).

```js
gsap.registerPlugin(Flip);

// 1. Capture current state
const state = Flip.getState(".items");

// 2. Make your DOM/layout changes
container.classList.toggle("expanded");

// 3. Animate FROM old state to new state
Flip.from(state, {
  duration: 0.6,
  ease: "power2.inOut",
  stagger: 0.05,
  absolute: true,    // use position:absolute during animation
  onComplete: () => console.log("done"),
});
```

```js
// Flip.to() — animate TO a new state
Flip.to(state, { duration: 0.5 });

// Fit one element's size/position to match another
Flip.fit(".element", ".target", { duration: 0.5 });
```

---

## Draggable

```js
gsap.registerPlugin(Draggable);

Draggable.create(".box", {
  type: "x,y",         // "x" | "y" | "x,y" | "rotation" | "scroll"
  bounds: ".container",
  edgeResistance: 0.65,
  inertia: true,       // momentum on release (requires InertiaPlugin)
  
  onDragStart: function() { console.log("drag start", this.x, this.y); },
  onDrag: function() {},
  onDragEnd: function() {},
  
  snap: {              // snap to grid
    x: gsap.utils.snap(50),
    y: gsap.utils.snap(50),
  },
  
  liveSnap: true,
  lockAxis: true,      // lock to one axis once dragging starts
});
```

---

## MotionPath

Animate an element along an SVG path.

```js
gsap.registerPlugin(MotionPathPlugin);

gsap.to(".car", {
  duration: 5,
  ease: "none",
  motionPath: {
    path: "#road",          // SVG path element or d attribute string
    align: "#road",         // keep element aligned to path
    autoRotate: true,       // rotate element to follow path direction
    alignOrigin: [0.5, 0.5], // pivot point
    start: 0,               // 0 = beginning of path
    end: 1,                 // 1 = end of path
  }
});
```

---

## MorphSVG

Morph between SVG shapes. **Requires GSAP Club.**

```js
gsap.registerPlugin(MorphSVGPlugin);

gsap.to("#circle", {
  duration: 1,
  morphSVG: "#star",   // target shape (SVG element or path string)
});

// Convert shapes to paths first for best results
MorphSVGPlugin.convertToPath("#circle, #rect");
```

---

## Observer

Detect and respond to scroll, touch, pointer with velocity tracking.

```js
gsap.registerPlugin(Observer);

Observer.create({
  target: window,
  type: "wheel,touch,pointer",
  onDown: (self) => console.log("scrolled down", self.deltaY),
  onUp: (self) => {},
  onLeft: (self) => {},
  onRight: (self) => {},
  onChange: (self) => {},
  wheelSpeed: -1,          // invert wheel direction
  preventDefault: true,
  tolerance: 10,           // minimum px before triggering
});
```

---

## ScrollSmoother

Smooth scrolling wrapper. **Requires GSAP Club + ScrollTrigger.**

```html
<!-- Required HTML structure -->
<body>
  <div id="smooth-wrapper">
    <div id="smooth-content">
      <!-- ALL page content here -->
    </div>
  </div>
</body>
```

```js
gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

const smoother = ScrollSmoother.create({
  wrapper: "#smooth-wrapper",
  content: "#smooth-content",
  smooth: 1.5,           // smoothing duration in seconds
  effects: true,         // enable data-speed attributes
  normalizeScroll: true, // normalize scroll across devices
});

// Scroll to element
smoother.scrollTo(".section", true, "top top");

// Parallax via HTML attribute
// <div data-speed="0.5"> moves at half scroll speed
// <div data-lag="0.5"> adds 0.5s lag
```

---

## ScrollTo Plugin

```js
gsap.registerPlugin(ScrollToPlugin);

// Scroll window to Y position
gsap.to(window, { duration: 1, scrollTo: 500 });

// Scroll to element
gsap.to(window, { duration: 1, scrollTo: ".section" });

// Scroll to element with offset
gsap.to(window, { duration: 1, scrollTo: { y: ".section", offsetY: 80 } });

// Horizontal scroll
gsap.to(".container", { duration: 1, scrollTo: { x: 400 } });
```

---

## TextPlugin

Animates the text content of an element (typewriter-style).

```js
gsap.registerPlugin(TextPlugin);

gsap.to(".heading", {
  duration: 2,
  text: "Hello World",     // animate to this text
  ease: "none",
  delimiter: "",           // "" = char by char, " " = word by word
});

// From current to new
gsap.to(".el", { text: { value: "New text here", delimiter: " " }, duration: 1.5 });
```

---

## ScrambleText

Randomizes text during animation. **Requires GSAP Club.**

```js
gsap.registerPlugin(ScrambleTextPlugin);

gsap.to(".heading", {
  duration: 2,
  scrambleText: {
    text: "Hello World",
    chars: "upperCase",    // "upperCase" | "lowerCase" | "0123456789" | custom
    speed: 0.4,
    revealDelay: 0.5,
  }
});
```

---

## DrawSVG

Animate SVG stroke drawing. **Requires GSAP Club.**

```js
gsap.registerPlugin(DrawSVGPlugin);

// Start hidden, animate to fully drawn
gsap.fromTo("#path", { drawSVG: "0%" }, { drawSVG: "100%", duration: 2 });

// Draw from center outward
gsap.fromTo("#path", { drawSVG: "50% 50%" }, { drawSVG: "0% 100%", duration: 2 });

// Partial draw
gsap.to("#path", { drawSVG: "25% 75%", duration: 1 });
```

---

## Inertia Plugin

Physics-based momentum for drag/throw effects.

```js
gsap.registerPlugin(InertiaPlugin);

// Used with Draggable
Draggable.create(".box", { type: "x,y", inertia: true });

// Standalone — tween with momentum
gsap.to(".ball", {
  inertia: {
    x: { velocity: 500, end: gsap.utils.snap(100) },
    y: { velocity: -300 },
  }
});
```

---

## Free vs Club Plugins

| Plugin | Free? |
|--------|-------|
| ScrollTrigger | ✅ Free |
| ScrollTo | ✅ Free |
| Observer | ✅ Free |
| Flip | ✅ Free |
| Draggable | ✅ Free |
| TextPlugin | ✅ Free |
| MotionPath | ✅ Free |
| CSSRule | ✅ Free |
| SplitText | 💰 Club |
| MorphSVG | 💰 Club |
| DrawSVG | 💰 Club |
| ScrambleText | 💰 Club |
| ScrollSmoother | 💰 Club |
| Inertia | 💰 Club |
| GSDevTools | 💰 Club |
| Physics2D | 💰 Club |

---

## CDN URLs (GSAP 3.12.5)

```
https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js
https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js
https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollToPlugin.min.js
https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/Observer.min.js
https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/Flip.min.js
https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/Draggable.min.js
https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/MotionPathPlugin.min.js
https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/TextPlugin.min.js
https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/EasePack.min.js
```
