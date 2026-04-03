# Project Plan: "Ink & Vapor" — Dual-Mode Text Alchemy

> A visceral, interactive experience where text exists in two states simultaneously — heavy, permanent **Ink** below a living boundary, and generative, dissolving **Vapor** above it. Drag the boundary. Click to ripple. Tune the simulation. Watch typography become alive.

---

## Vision

The screen is a single canvas divided by an animated, wavy boundary line. Below it: rich, dense, beautifully typeset text in heavy serif — text that feels carved into stone. Above it: the same text, but dissolved into a generative particle cloud — characters selected by brightness, drifting on noise fields, accumulating into ghostly density maps that hint at the words beneath.

**The interaction is the magic:**
- **Drag the boundary** up — ink crystallizes into vapor. Drag it down — vapor condenses into ink.
- **Click the boundary** — it ripples like water, temporarily vaporizing then re-crystallizing everything it touches.
- **Hover over vapor** — particles lean toward your cursor like iron filings to a magnet.
- **Open the control panel** — sliders for turbulence, drift speed, particle density, font size, boundary wave amplitude, and a theme switcher.

**Tagline:** *"Watch text dissolve and reform. The boundary between permanence and impermanence is a line you draw."*

---

## Technical Architecture

```
ink-vapor/
├── index.html                    — Entry: fonts, canvas, loading screen
├── package.json                  — Vite + TS + pretext
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.ts                   — Entry point, render loop, input routing
    ├── core/
    │   ├── renderer.ts           — Canvas 2D setup, HiDPI, resize, layer system
    │   ├── input.ts              — Mouse (move, drag, click), scroll, touch
    │   ├── timer.ts              — Delta-time clock, global time, pause/resume
    │   └── fonts.ts              — Font loading + sync with pretext
    ├── ink/                      — THE INK LAYER (below boundary)
    │   ├── layout.ts             — Multi-column text layout via pretext
    │   ├── typesetter.ts         — Per-character positioning, gradient fills
    │   └── crystallize.ts        — Animation: vapor → ink transition per character
    ├── vapor/                    — THE VAPOR LAYER (above boundary)
    │   ├── field.ts              — Multi-octave noise flow field (Perlin/Simplex)
    │   ├── particles.ts          — Particle system: birth, flow, death, accumulation
    │   ├── chars.ts              — Character palette (pretext brightness + width)
    │   ├── dissipate.ts          — Animation: ink → vapor transition per character
    │   └── attract.ts            — Mouse attraction field for vapor particles
    ├── boundary/                 — THE LIVING LINE
    │   ├── wave.ts               — Sine-composite wave equation, animated over time
    │   ├── ripple.ts             — Click-triggered ripple propagation (damped wave)
    │   ├── drag.ts               — Mouse-driven boundary repositioning
    │   └── render.ts             — Boundary visualization (glow, gradient stroke)
    ├── themes/                   — COLOR & TYPOGRAPHY THEMES
    │   ├── registry.ts           — Theme definitions, switcher, interpolation
    │   ├── midnight-galaxy.ts    — Deep cosmic blues, purple-white, star particles
    │   ├── golden-hour.ts        — Amber-to-crimson, ember-like vapor
    │   ├── ocean-depths.ts       — Deep blue ink, sea-mist vapor
    │   └── custom.ts             — Custom theme generation
    ├── controls/                 — PARAMETER PANEL (React sidebar)
    │   ├── panel.tsx             — Sidebar component with sections
    │   ├── sliders.tsx           — Parameter sliders (turbulence, drift, density...)
    │   ├── theme-picker.tsx      — Theme switcher UI
    │   ├── seed-nav.tsx          — Seed navigator for vapor pattern exploration
    │   └── params.ts             — Parameter state management, defaults, presets
    └── shared/
        ├── colors.ts             — Color utilities, interpolation, gradients
        ├── noise.ts              — Noise field implementation (layered Perlin)
        ├── utils.ts              — Lerp, clamp, smoothstep, easing, mapRange
        └── types.ts              — Shared type definitions
```

---

## Implementation Phases

### Phase 1: Foundation — Canvas, Input, Font Sync
**Duration:** Scaffold + core engine
**Goal:** A blank canvas that loads fonts, handles input, and runs a 60fps render loop.

- [ ] 1.1 **Project scaffold**: `npm create vite@latest ink-vapor -- --template vanilla-ts`
- [ ] 1.2 **Install pretext**: `npm install @chenglou/pretext`
- [ ] 1.3 **Renderer**: Canvas 2D setup with HiDPI (`devicePixelRatio`), resize handling, layer system (background → ink → vapor → boundary → UI)
- [ ] 1.4 **Input system**: Mouse tracking (x, y), drag detection, click detection, scroll delta, touch support
- [ ] 1.5 **Timer**: Delta-time clock with frame capping, global elapsed time
- [ ] 1.6 **Font loader**: `document.fonts.ready` + preload Playfair Display + Georgia + Inter + theme-specific fonts, sync with pretext measurement
- [ ] 1.7 **Shared utilities**: `lerp`, `clamp`, `smoothstep`, `easeInOutCubic`, `mapRange`, `distance`
- [ ] 1.8 **Loading screen**: Minimal spinner with "Measuring type…" text, fades out on font ready

**Deliverable:** A dark canvas that loads, tracks the mouse, and runs at 60fps with a loading screen.

---

### Phase 2: Ink Layer — Rich Text Layout on Canvas
**Goal:** Beautiful, multi-column text rendered on Canvas with pretext — the "Ink" half of the experience.

- [ ] 2.1 **Body text selection**: Write or curate the text that will be displayed (poetic, about impermanence, memory, or transformation — ~500 words)
- [ ] 2.2 **Pretext preparation**: `prepareWithSegments()` for the full body text with theme font
- [ ] 2.3 **Multi-column layout**: Column count based on viewport width (1/2/3 columns), gutter spacing, `layoutNextLine()` loop
- [ ] 2.4 **Typography polish**: 
  - Drop cap (first letter, 3× size, bold)
  - Pull quotes (italic, indented, different color)
  - Paragraph spacing (blank lines in text → extra vertical gap)
  - Gradient text fill (white → warm accent, per line)
- [ ] 2.5 **Per-character extraction**: Walk pretext layout to get each character's home position, width, and line context
- [ ] 2.6 **Ink rendering**: Draw characters on canvas with:
  - Theme-colored fill (rich, warm, editorial)
  - Subtle text shadow (canvas `shadowBlur`, very faint)
  - Alpha variation based on distance from boundary (fades near the line)
- [ ] 2.7 **Headline**: Large display title at top with animated gradient fill

**Deliverable:** A gorgeous editorial-quality text layout rendered entirely on Canvas 2D, with headline, drop cap, pull quotes, and gradient text. Looks like a magazine page.

---

### Phase 3: Boundary — The Living Line
**Goal:** An animated, wavy boundary line that divides Ink from Vapor — draggable, clickable, visually dramatic.

- [ ] 3.1 **Wave equation**: Composite of 3 sine waves at different frequencies/amplitudes, animated over time:
  ```
  y(x, t) = baseY + A₁·sin(k₁x + ω₁t) + A₂·sin(k₂x + ω₂t) + A₃·sin(k₃x + ω₃t)
  ```
- [ ] 3.2 **Boundary rendering**: 
  - Thin line (1px) with 50% opacity
  - Outer glow (radial gradient, theme-colored, 20px radius)
  - Gradient stroke along the line (left color → right color, theme-dependent)
  - Subtle particle sparkle where the line intersects vapor (tiny dots that flicker)
- [ ] 3.3 **Drag interaction**: Mouse drag moves the `baseY` up/down — the whole boundary follows
  - Smooth interpolation to drag target (spring physics, not instant)
  - Visual feedback: boundary thickens slightly while dragging
  - Clamp to screen bounds (top 10% → bottom 90%)
- [ ] 3.4 **Click ripple**: On click, spawn a ripple at click position:
  - Damped sinusoidal wave propagating left and right from click point
  - Amplitude decays over distance and time (exponential decay)
  - Multiple ripples can coexist and superimpose
- [ ] 3.5 **Hit testing**: Provide `getYAtX(x)` function that returns the boundary y-position at any x coordinate, including all waves and ripples

**Deliverable:** A beautiful, animated boundary line you can drag up/down and click to create ripples. It looks alive — glowing, shimmering, with sparkles along its length.

---

### Phase 4: Vapor Layer — Generative Particle Smoke
**Goal:** Above the boundary, the same text dissolves into a generative particle system — the algorithmic-art heart of the project.

- [ ] 4.1 **Character palette**: 
  - Build palette via pretext: `prepareWithSegments(ch, font)` for every char in `.,:;!+-=*#@%&a-zA-Z0-9`
  - Cross-reference with 3 weights × 2 styles = ~180 entries
  - Measure brightness via offscreen canvas `getImageData` alpha scan
  - Sort by brightness for binary search lookup
- [ ] 4.2 **Noise flow field**:
  - Multi-octave layered Perlin noise (3 octaves: coarse, medium, fine)
  - Velocity field computed per grid cell: `vx = noise(x, y, t)`, `vy = noise(x + offset, y + offset, t)`
  - Aspect-ratio corrected for non-square grid cells
- [ ] 4.3 **Particle system**:
  - Particles are spawned at the boundary line (birth zone)
  - Each particle carries: position, velocity, life, target character, size, opacity
  - Particles flow along the noise field vectors
  - Particles die when they drift too far from the boundary or exceed max lifetime
  - New particles continuously spawn to maintain density
- [ ] 4.4 **Character assignment**:
  - Each particle's character is selected by mapping its position to the underlying text
  - Characters near the boundary are dense, legible (high-brightness chars)
  - Characters far from the boundary are sparse, abstract (low-brightness chars like `.` `,`, `·`)
  - This creates a gradient from readable text → abstract smoke
- [ ] 4.5 **Rendering**:
  - Each particle draws its character on canvas at its position
  - Color: theme-dependent vapor color with opacity based on life and distance from boundary
  - Optional: slight rotation or scale variation per particle for organic feel
- [ ] 4.6 **Density accumulation layer** (optional, performance permitting):
  - Offscreen canvas where particles draw as soft radial gradients (`globalCompositeOperation: 'lighter'`)
  - The accumulation map creates a ghostly density cloud that hints at the text shape
  - Can be sampled for additional visual effects (e.g., glow in dense areas)

**Deliverable:** Above the boundary, the text dissolves into a living cloud of characters drifting on noise fields — dense and readable near the line, sparse and abstract at the top. It breathes, flows, and feels alive.

---

### Phase 5: The Transition — Ink ↔ Vapor Morph
**Goal:** The magical moment where characters transform from Ink to Vapor and back as they cross the boundary.

- [ ] 5.1 **Crossing detection**: Each frame, for each character position in the ink layout:
  - Check if the character's y-position is above or below the boundary at its x-position
  - Characters that cross become "transitioning"
- [ ] 5.2 **Ink → Vapor (dissolve)**:
  - Character doesn't just disappear — it fractures into 3-5 vapor particles
  - Particles inherit the character's position, then begin flowing on the noise field
  - Original ink character fades out over 8-12 frames (alpha decay)
  - Creates a "shattering" effect as text dissolves into smoke
- [ ] 5.3 **Vapor → Ink (crystallize)**:
  - When a vapor particle's position drops below the boundary (user drags boundary down):
  - Particle decelerates (damping increases dramatically)
  - It drifts toward its home position in the ink layout (spring force)
  - On arrival, the ink character fades in with a brief glow flash
  - Particle is removed from the vapor system
- [ ] 5.4 **Ripple-triggered transitions**:
  - When a ripple passes through a character's position:
  - Character briefly dissolves into vapor (even if below boundary)
  - Then re-crystallizes after the ripple passes
  - Creates a wave of dissolution that flows across the text
- [ ] 5.5 **Performance optimization**:
  - Only process characters near the boundary (spatial hashing: divide screen into horizontal bands, only check bands within ±2 lines of boundary)
  - Particle count caps at ~5000 for 60fps
  - Use `requestAnimationFrame` timestamp for frame-budget monitoring

**Deliverable:** The boundary becomes magical — dragging it through text creates a trail of dissolving characters that shatter into particles, and pulling it back crystallizes vapor into solid type. Click ripples send waves of temporary dissolution across the page.

---

### Phase 6: Mouse Interaction — Attraction & Repulsion Fields
**Goal:** The vapor responds to your cursor in satisfying, tactile ways.

- [ ] 6.1 **Mouse attraction field**:
  - Particles within 200px of cursor experience an additional force toward cursor
  - Force strength: inverse-square falloff, clamped to prevent singularity
  - Particles "lean" toward cursor — like iron filings to a magnet
  - Visual feedback: particles near cursor become slightly brighter/larger
- [ ] 6.2 **Click repulsion**:
  - Clicking (not on boundary) creates a brief repulsion burst from cursor position
  - Particles within 150px are pushed away with impulse force
  - Creates a satisfying "parting the mist" effect
- [ ] 6.3 **Scroll interaction**:
  - Scroll up/down increases/decreases the noise field animation speed
  - Fast scroll = turbulent, chaotic vapor
  - Slow/no scroll = calm, gentle drift
  - Visual feedback: boundary wave amplitude also responds to scroll speed
- [ ] 6.4 **Custom cursor**:
  - Hide default cursor on canvas
  - Draw a custom cursor: small circle (8px) with faint outer ring (20px)
  - Ring thickens when over vapor (indicating attraction)
  - Ring pulses when clicking (indicating repulsion)
  - Ring distorts into ellipse near boundary (indicating drag-ability)

**Deliverable:** Moving your mouse through the vapor feels physical — particles follow your cursor, clicking parts the mist, scrolling changes the storm intensity, and the cursor itself communicates what you can do.

---

### Phase 7: Themes — Color & Typography Systems
**Goal:** Multiple visual identities, each radically changing the feel of the experience.

- [ ] 7.1 **Theme registry**: Central theme definition interface:
  ```typescript
  interface Theme {
    id: string
    name: string
    // Colors
    bg: string
    bgGradient: [string, string, string]  // radial gradient stops
    inkColor: string
    inkGradient: [string, string]          // text gradient
    vaporColor: string
    vaporColorFar: string                  // vapor fades to this color at top
    boundaryColor: string
    boundaryGlowColor: string
    cursorColor: string
    // Typography
    headlineFont: string
    bodyFont: string
    vaporFont: string
    dropCapFont: string
    // Atmosphere
    particleShape: 'char' | 'dot' | 'mixed'
    grainIntensity: number
    headlineText: string
  }
  ```
- [ ] 7.2 **Three built-in themes**:
  - **Midnight Galaxy**: Deep cosmic blues (#06060f → #1a1a2e), white/cool vapor like stars, rich warm ink. Fonts: Playfair Display + Georgia.
  - **Golden Hour**: Amber-to-crimson background gradient (#1a0f06 → #2a1a0a), ember-like vapor particles (warm orange), rich brown ink. Fonts: Playfair Display + Georgia.
  - **Ocean Depths**: Deep navy (#0a0f1a → #0a1628), sea-mist vapor (pale blue-green), white-warm ink. Fonts: Playfair Display + Inter.
- [ ] 7.3 **Theme interpolation**: Smooth transition when switching themes:
  - All colors interpolate over 1.5 seconds (no jarring snap)
  - Font change applies immediately but with a brief fade-out/fade-in
  - Vapor particles keep their current positions but adopt new theme colors over their remaining lifetime
- [ ] 7.4 **Theme persistence**: Last-used theme saved to `localStorage`
- [ ] 7.5 **Custom theme generation** (stretch): UI to pick colors and fonts, generate a theme, save it

**Deliverable:** Three completely different visual experiences accessible through a theme switcher. Each theme changes colors, fonts, particle behavior, and atmospheric effects. Switching themes is smooth, not jarring.

---

### Phase 8: Control Panel — Parameter Exploration UI
**Goal:** A React sidebar with sliders, theme picker, and seed navigator — powered by web-artifacts-builder stack.

- [ ] 8.1 **Panel toggle**: Small chevron button on right edge of screen opens/closes sidebar
- [ ] 8.2 **Sidebar layout** (React + Tailwind + shadcn/ui):
  - **Section 1: Simulation** — sliders for:
    - Turbulence (noise octaves: 1-5)
    - Drift speed (field animation speed: 0.1x - 3x)
    - Particle density (spawn rate: 500 - 8000)
    - Particle size (font size scale: 0.5x - 2x)
    - Boundary wave amplitude (0 - 100px)
    - Boundary wave speed (0.1x - 2x)
    - Mouse attraction strength (0 - 2000)
  - **Section 2: Theme** — theme picker cards (3 themes as color swatches + preview)
  - **Section 3: Seed** — seed display with prev/next/random buttons, jump-to-seed input
  - **Section 4: Text** — dropdown to select different body texts (poetry, prose, technical)
  - **Section 5: Actions** — Reset to defaults, Regenerate (new seed), Fullscreen toggle
- [ ] 8.3 **Real-time parameter updates**: Changing any slider immediately affects the simulation (no restart needed)
- [ ] 8.4 **Presets**: 3 preset buttons — "Calm" (low turbulence, slow drift), "Storm" (high turbulence, fast drift), "Balance" (medium everything)
- [ ] 8.5 **Panel animation**: Sidebar slides in from right with spring animation, backdrop blur on canvas area
- [ ] 8.6 **Responsive**: On mobile, panel is a bottom sheet instead of sidebar

**Deliverable:** A polished control panel that lets you tune every aspect of the simulation in real-time, switch themes, explore seeds, and save presets. It looks like a professional audio plugin UI — clean, minimal, with satisfying slider interactions.

---

### Phase 9: Polish — Atmosphere, Sound, Micro-interactions
**Goal:** The details that make it feel like a finished product, not a prototype.

- [ ] 9.1 **Film grain overlay**: Subtle noise texture on entire canvas (configurable per theme)
- [ ] 9.2 **Vignette effect**: Darkened edges (radial gradient overlay, very subtle)
- [ ] 9.3 **Entry animation**: 
  - Page loads with boundary at 50%
  - Ink text types itself in from top to bottom (character-by-character reveal, 3 seconds)
  - Vapor begins forming at boundary, slowly building density
  - Boundary settles into its animated wave pattern
  - Control panel hint appears briefly ("→" arrow pointing to panel toggle)
- [ ] 9.4 **Ambient sound** (optional, Web Audio API):
  - Very quiet ambient drone/tone that shifts pitch based on vapor density
  - Click sounds (subtle, like a soft tap) when particles crystallize into ink
  - Whoosh sound (filtered noise) when dragging boundary quickly
  - Mute button in control panel
- [ ] 9.5 **Micro-interactions**:
  - Boundary glows brighter when hovered
  - Ink characters briefly flash when they crystallize from vapor
  - Vapor particles cluster slightly denser near the boundary (surface tension effect)
  - Custom cursor morphs based on context (over boundary → drag handle, over vapor → attract indicator)
  - Control panel sliders have subtle spring animation on value change
- [ ] 9.6 **Performance monitoring**:
  - FPS counter (toggleable, hidden by default)
  - Particle count display in panel
  - Frame budget warning if rendering exceeds 14ms
- [ ] 9.7 **Responsive design**:
  - Mobile: single column ink text, simplified vapor (fewer particles), bottom-sheet control panel
  - Tablet: 2 columns, medium vapor density
  - Desktop: 2-3 columns, full vapor density, sidebar panel
- [ ] 9.8 **Share/Export**:
  - Screenshot button (canvas → PNG download)
  - "Share this seed" — copies URL with seed parameter
  - Open Graph meta tags for social sharing preview

**Deliverable:** The experience feels alive from the moment the page loads. Every interaction has a satisfying response. The atmosphere is rich with subtle details (grain, vignette, sound). It works beautifully on mobile and desktop. You can share your favorite configurations.

---

### Phase 10: Launch — Build, Test, Deploy
**Goal:** Ship it.

- [ ] 10.1 **TypeScript strict mode**: All files pass `tsc --noEmit` with zero errors
- [ ] 10.2 **Performance audit**: 60fps on desktop Chrome with full particle count (5000+), 30fps on mobile
- [ ] 10.3 **Cross-browser test**: Chrome, Firefox, Safari, Edge — all functional
- [ ] 10.4 **Accessibility**: 
  - Keyboard navigation for control panel
  - `prefers-reduced-motion` reduces animation intensity
  - `prefers-color-scheme` selects appropriate default theme
- [ ] 10.5 **Vercel/Netlify deploy**: CI/CD pipeline, preview deployments for PRs
- [ ] 10.6 **README**: Project description, screenshots, local development instructions, theme documentation
- [ ] 10.7 **Demo recording**: 30-second screen recording showing the key interactions (drag boundary, click ripple, theme switch, panel controls)

**Deliverable:** A shipped, production-ready web experience at `ink-vapor.vercel.app` (or similar), with documentation and a demo video.

---

## Key Technical Decisions

### Why Canvas 2D, not WebGL?
Pretext's measurement pipeline returns pixel positions and widths — these map directly to `fillText` calls on Canvas 2D. WebGL would require building a custom text renderer (bitmap fonts or SDF), losing pretext's native font integration. Canvas 2D is simpler, and 5000 particles + 2000 ink characters at 60fps is achievable on modern hardware. **If performance becomes an issue, selectively upgrade to WebGL for the vapor layer only.**

### Why Vanilla TS for core, React for panel?
The core simulation (ink, vapor, boundary) is a tight render loop that benefits from zero framework overhead. The control panel is UI chrome — sliders, buttons, pickers — where React + shadcn/ui excels. This split keeps the hot path lean and the cold path productive.

### Why not use the aether codebase?
Aether's fluid sim is a density grid with advection — useful as reference, but Ink & Vapor needs a **particle system** (not a grid) for the vapor layer, a **boundary wave equation**, and a **dual-mode rendering pipeline**. Starting fresh avoids carrying over architectural assumptions. The character palette code (`palette.ts`) and obstacle routing (`obstacles.ts`) can be adapted.

### Font loading strategy
All theme fonts must be loaded before any pretext measurement. Use `document.fonts.load()` for each font string, `await document.fonts.ready`, then batch all `prepareWithSegments()` calls. Cache prepared handles. On theme switch, only swap the font string references — don't re-measure unless the new theme uses a different body font.

### Performance targets
| Metric | Target |
|--------|--------|
| Frame rate | 60fps desktop, 30fps mobile |
| Particle count | 5000+ at 60fps |
| Ink character count | 2000+ (single `prepare()` call) |
| `layoutNextLine()` calls | Once per frame (negligible cost) |
| Boundary wave computation | O(n) per frame where n = horizontal resolution (~200 points) |
| Memory | < 100MB (canvas + pretext cache + particle arrays) |

---

## Inspiration Sources

| Source | What to borrow |
|--------|---------------|
| **pretext-demos (fluid-smoke)** | Character brightness palette, noise flow field, density-to-character mapping |
| **pretext-demos (editorial-engine)** | Obstacle-aware text routing, `layoutNextLine` with slot carving |
| **pretext-playground (dragon)** | Canvas physics chain, particle rendering |
| **algorithmic-art skill** | Flow field algorithms, seeded randomness, parameter exploration UI patterns |
| **frontend-design skill** | Bold aesthetic direction, atmospheric depth, motion as design element |
| **Bret Victor** | Live parameter manipulation — every slider immediately visible |
| **Patricio Gonzalez Vivo (The Book of Shaders)** | Layered noise, gradient composition, atmospheric rendering |
| **Casey Reas / Processing** | Generative systems, emergent behavior, process over product |

---

## File Structure (Final)

```
ink-vapor/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
├── public/
│   └── fonts/                    # Local font fallbacks (optional)
└── src/
    ├── main.ts
    ├── core/
    │   ├── renderer.ts
    │   ├── input.ts
    │   ├── timer.ts
    │   └── fonts.ts
    ├── ink/
    │   ├── layout.ts
    │   ├── typesetter.ts
    │   └── crystallize.ts
    ├── vapor/
    │   ├── field.ts
    │   ├── particles.ts
    │   ├── chars.ts
    │   ├── dissipate.ts
    │   └── attract.ts
    ├── boundary/
    │   ├── wave.ts
    │   ├── ripple.ts
    │   ├── drag.ts
    │   └── render.ts
    ├── themes/
    │   ├── registry.ts
    │   ├── midnight-galaxy.ts
    │   ├── golden-hour.ts
    │   └── ocean-depths.ts
    ├── controls/
    │   ├── panel.tsx
    │   ├── sliders.tsx
    │   ├── theme-picker.tsx
    │   ├── seed-nav.tsx
    │   └── params.ts
    └── shared/
        ├── colors.ts
        ├── noise.ts
        ├── utils.ts
        └── types.ts
```

---

## Next Steps

1. **Phase 1**: Scaffold project, set up canvas, input, font loading
2. **Phase 2**: Build ink layer — gorgeous text layout on canvas
3. **Phase 3**: Build boundary — animated, draggable, clickable wave line
4. **Phase 4**: Build vapor layer — generative particle smoke with noise fields
5. **Phase 5**: Build transitions — ink ↔ vapor morph at boundary
6. **Phase 6**: Add mouse interaction fields — attraction, repulsion, scroll
7. **Phase 7**: Build theme system — 3 themes with smooth interpolation
8. **Phase 8**: Build control panel — React sidebar with all parameters
9. **Phase 9**: Polish — entry animation, sound, micro-interactions, responsive
10. **Phase 10**: Ship — type-check, performance audit, deploy

Each phase produces a visible, testable deliverable. No phase depends on a future phase. The project is incrementally impressive from Phase 2 onward.
