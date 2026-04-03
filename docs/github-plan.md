# GitHub Viral Plan — Ink & Vapor

> A comprehensive checklist to make this project discoverable, shareable, and community-friendly.

---

## 1. Repository Foundation

### Core Files
- [ ] **README.md** — Hero image/GIF, live demo link, one-line pitch, features, tech stack, quick start, screenshots, credits
- [ ] **LICENSE** — MIT (most permissive, encourages forks and usage)
- [ ] **CONTRIBUTING.md** — How to contribute, dev setup, PR guidelines, issue labels guide
- [ ] **CODE_OF_CONDUCT.md** — Contributor Covenant v2.1
- [ ] **SECURITY.md** — Vulnerability reporting process
- [ ] **CHANGELOG.md** — Version history, semantic versioning format
- [ ] **.gitignore** — node_modules, dist, .env, OS files, IDE configs

### GitHub Settings
- [ ] **Repository topics**: `canvas`, `generative-art`, `typography`, `pretext`, `webgl`, `fluid-simulation`, `interactive`, `typescript`, `vite`
- [ ] **Repository description**: "Text that dissolves into smoke and crystallizes back into ink. A generative typography experiment."
- [ ] **Website URL**: Set GitHub Pages or Vercel URL
- [ ] **Social preview image**: 1280×640px hero image (animated GIF or PNG)
- [ ] **Topics/tags**: 20 relevant GitHub topics for discoverability

---

## 2. README.md Structure

```
# Ink & Vapor

[Hero GIF — 5-second loop showing boundary drag, text dissolving, vapor swirling]

> Text that dissolves into smoke and crystallizes back into ink.

[Live Demo Button] [Wave Demo] [GitHub Stars Badge]

## What is this?
Ink & Vapor is a generative typography experiment where text exists in two states
simultaneously — heavy, permanent ink below a living boundary, and generative,
dissolving vapor above it.

## Features
- 🌊 Animated boundary wave you can drag and click
- ✨ Text dissolves into smoke and crystallizes back into ink
- 🎨 3 themes: Midnight Galaxy, Golden Hour, Ocean Depths
- 🖱️ Reactive cursor ring that pulsates like the boundary wave
- 📱 Fully responsive — works on mobile and desktop
- 🌪️ Click ripple waves that propagate through the text
- 🌀 Vortex: hold mouse to spiral particles into a gravity well

## Tech Stack
- **@chenglou/pretext** — Zero-DOM text measurement
- **Vite + TypeScript** — Fast dev experience, type safety
- **Canvas 2D** — Zero-DOM rendering hot path
- **Custom noise fields** — Multi-octave fractal Brownian motion

## Quick Start
\`\`\`bash
npm install
npm run dev
\`\`\`

## Project Structure
[Visual directory tree with brief descriptions]

## Demos
- [Main Experience](https://ink-vapor.vercel.app)
- [Wave Demo](https://ink-vapor.vercel.app/wave-demo.html)

## How It Works
[Brief explanation of the two-state text system]

## Contributing
Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md)

## Credits
- Powered by [@chenglou/pretext](https://github.com/chenglou/pretext)
- Inspired by [Bret Victor](http://worrydream.com/) and [The Book of Shaders](https://thebookofshaders.com/)

## License
MIT
```

---

## 3. Visual Assets

### Hero Image/GIF (for README + social)
- [ ] 15-second screen recording showing: drag boundary, text dissolving, click ripples, theme switch, cursor ring
- [ ] Export as optimized GIF (< 5MB) and MP4 (< 10MB)
- [ ] Social preview: 1280×640px static image with project name + tagline

### Screenshots for README
- [ ] Full desktop view with two-column layout
- [ ] Close-up of boundary with vapor particles
- [ ] Wave demo 3-section view
- [ ] Mobile view (responsive layout)
- [ ] Theme comparison (3 themes side by side)

### Demo GIFs
- [ ] `boundary-drag.gif` — dragging the boundary line
- [ ] `text-dissolve.gif` — text dissolving into vapor
- [ ] `click-ripple.gif` — click creating ripple waves
- [ ] `vortex-hold.gif` — holding mouse to create vortex
- [ ] `theme-cycle.gif` — cycling through 3 themes

---

## 4. Deployment

### Production Hosting
- [ ] **Vercel** — Primary deployment (fastest, free tier, auto-deploy from main)
- [ ] **GitHub Pages** — Secondary (for projects that prefer GH-native)
- [ ] **Netlify** — Optional alternative

### CI/CD
- [ ] **GitHub Actions workflow** — Auto-deploy on push to `main`
- [ ] **Preview deployments** — Each PR gets a unique preview URL
- [ ] **Lighthouse CI** — Performance audit on every PR

### Domain (optional)
- [ ] Custom domain (e.g., `inkandvapor.dev` or `ink-vapor.com`)
- [ ] DNS configuration for Vercel custom domain

---

## 5. Social Media Strategy

### Launch Posts
- [ ] **Twitter/X thread** — 8-tweet thread:
  1. Hook: "What if text could dissolve into smoke?"
  2. Demo GIF
  3. The tech (pretext, Canvas 2D, zero DOM reads)
  4. How the boundary wave works
  5. How text transitions between ink and vapor
  6. Interactive features (drag, click, hold, scroll)
  7. Open source, link to repo
  8. Credits and inspiration

- [ ] **Reddit post** — r/webdev, r/creativecoding, r/generative, r/design
  - Title: "I built a typography experiment where text dissolves into smoke"
  - Include GIF, link to live demo, link to GitHub

- [ ] **Hacker News** — "Show HN: Ink & Vapor — Generative typography on Canvas 2D"

- [ ] **Dev.to article** — "Building a fluid typography experiment with Canvas and pretext"
  - Deep dive into the technical architecture
  - Code snippets of key algorithms
  - Lessons learned

- [ ] **Product Hunt** — If polished enough for PH launch

### Ongoing Promotion
- [ ] Share in pretext Discord/Slack communities
- [ ] Submit to generative art showcases
- [ ] Post updates when major features are added
- [ ] Respond to every issue, PR, and comment promptly

---

## 6. Developer Experience

### Documentation
- [ ] **docs/ARCHITECTURE.md** — System architecture, data flow, rendering pipeline
- [ ] **docs/ALGORITHMS.md** — Deep dive into:
  - Boundary wave equation
  - Ripple propagation (Gaussian wavefront)
  - Circular wave (cursor ring)
  - Noise field (fractal Brownian motion)
  - Character brightness palette
  - Ink ↔ Vapor transition system
- [ ] **docs/THEMES.md** — How to create custom themes
- [ ] **docs/CONTRIBUTING.md** — Already listed above

### Developer Tools
- [ ] **ESLint + Prettier** — Code quality enforcement
- [ ] **Husky + lint-staged** — Pre-commit hooks
- [ ] **GitHub issue templates** — Bug report, feature request, question
- [ ] **Pull request template** — Checklist for contributors

### Performance
- [ ] **Performance monitoring** — FPS display, frame budget warnings
- [ ] **Lighthouse score** — Aim for 90+ on all metrics
- [ ] **Bundle size analysis** — Report in CI

---

## 7. Community Building

### Engagement
- [ ] **Good first issues** — Label 5-10 beginner-friendly issues
- [ ] **Feature roadmap** — Public roadmap in a pinned issue or wiki
- [ ] **Showcase section** — Community creations using the project
- [ ] **Discord/Slack** — Optional community server for discussion

### Recognition
- [ ] **Contributors section** in README (auto-generated via all-contributors bot)
- [ ] **Stargazers** — Thank first 100 stargazers publicly
- [ ] **Milestones** — 100⭐, 500⭐, 1000⭐ celebration posts

---

## 8. Advanced (Post-Launch)

### Enhancements
- [ ] **WebGL upgrade** — GPU-accelerated vapor rendering
- [ ] **Custom theme builder** — Web UI for creating color/font themes
- [ ] **Export as video** — Record canvas at 60fps for social media
- [ ] **Audio reactive mode** — Web Audio API drives vapor density
- [ ] **Multiplayer mode** — Shared canvas with WebSocket sync
- [ ] **NFT/Generative art** — Art Blocks submission (separate project)

### Metrics
- [ ] **GitHub Analytics** — Stars, forks, clones, referrers
- [ ] **Vercel Analytics** — Visitors, page views, geographic distribution
- [ ] **Social metrics** — Track mentions, shares, likes across platforms

---

## Priority Order

| Priority | Task | Why |
|----------|------|-----|
| **P0** | README.md + LICENSE + social preview | First thing visitors see |
| **P0** | Deploy to Vercel | Live demo is essential |
| **P1** | Hero GIF + screenshots | Visual proof sells the project |
| **P1** | CONTRIBUTING.md + issue templates | Enables community contribution |
| **P1** | Twitter/X launch thread | Biggest reach for creative coding |
| **P2** | Reddit HN Dev.to posts | Broader audience, SEO |
| **P2** | docs/ARCHITECTURE.md + ALGORITHMS.md | Deep technical credibility |
| **P2** | CI/CD auto-deploy | Professional project hygiene |
| **P3** | Custom domain | Brand building |
| **P3** | Discord/community | Long-term engagement |

---

## File Structure After Completion

```
ink-vapor/
├── docs/
│   ├── github-viral-plan.md       ← This file
│   ├── ARCHITECTURE.md            ← System design
│   ├── ALGORITHMS.md              ← Math behind the effects
│   └── THEMES.md                  ← Custom theme guide
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug-report.md
│   │   ├── feature-request.md
│   │   └── question.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/
│       └── deploy.yml
├── README.md                      ← Hero + pitch + features + quick start
├── LICENSE                        ← MIT
├── CONTRIBUTING.md               ← How to contribute
├── CODE_OF_CONDUCT.md            ← Contributor Covenant
├── SECURITY.md                   ← Vulnerability reporting
├── CHANGELOG.md                  ← Version history
├── .gitignore                    ← node_modules, dist, .env, etc.
├── .gitattributes                ← Line endings, binary file handling
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html                    ← Main experience
├── wave-demo.html               ← Wave visualization
└── src/
    └── ...                       ← Source code (already built)
```
