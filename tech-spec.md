# SellScout AI — Technical Specification

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.0.0 | UI framework |
| react-dom | ^19.0.0 | DOM renderer |
| react-router-dom | ^7.0.0 | Client-side routing (5 pages) |
| three | ^0.172.0 | 3D sphere rendering on homepage hero |
| framer-motion | ^12.0.0 | Page entrance animations, accordion, step transitions, AnimatePresence |
| lucide-react | ^0.460.0 | Icon library (comprehensive icon set) |
| recharts | ^2.15.0 | Engagement trend charts, sparklines, donut chart |
| @fontsource-variable/inter | ^5.0.0 | Self-hosted Inter font |
| tailwindcss | ^4.0.0 | Utility-first CSS |
| @tailwindcss/vite | ^4.0.0 | Tailwind Vite integration |
| typescript | ^5.6.0 | Type safety |
| vite | ^6.0.0 | Build tool |
| @vitejs/plugin-react | ^4.0.0 | React Vite plugin |
| @types/react | ^19.0.0 | React type definitions |
| @types/react-dom | ^19.0.0 | React DOM type definitions |
| @types/three | ^0.172.0 | Three.js type definitions |

---

## Component Inventory

### Layout (shared across all pages)

| Component | Source | Notes |
|-----------|--------|-------|
| Navigation | Custom | Fixed header with scroll-aware background, active page indicator. Used on all pages. |
| Footer | Custom | 4-column link grid + bottom bar. Used on all pages. |
| CustomCursor | Custom | Global fixed-position cursor div with lerp tracking. Disabled on touch devices. |
| PageLayout | Custom | Wraps Navigation + children + Footer. Provides page entrance orchestration. |

### Sections (page-specific, used once)

| Section | Page | Notes |
|---------|------|-------|
| HeroSphere | Homepage | Full-viewport Three.js canvas + text overlay |
| FeaturesBand | Homepage | 4-column feature cards below hero |
| SocialProofBand | Homepage | Stats row with count-up animation |
| BottomCTA | Homepage + Pricing | Shared CTA section. Extracted to shared component. |
| PlaybooksDashboard | Playbooks | Grid of playbook cards + toolbar |
| PlaybookEditor | Playbooks | Two-column form (60/40) with AI sidebar |
| CampaignsList | Campaigns | Metric stats + campaign row list |
| CampaignBuilder | Campaigns | 4-step wizard with progress bar |
| OverviewDashboard | Analytics | 4 KPI metric cards |
| CampaignPerformance | Analytics | Sortable/filterable campaign table |
| EngagementTrends | Analytics | Tabbed area chart with crosshair tooltip |
| AIInsights | Analytics | 4 insight cards |
| ProspectBreakdown | Analytics | Donut chart + ranked list with sub-tabs |
| RecentActivity | Analytics | Live-feed timeline with auto-scrolling |
| PricingTiers | Pricing | 3 pricing cards + billing toggle |
| FeatureComparison | Pricing | Full comparison table |
| FAQ | Pricing | Accordion-style questions |
| TrustBand | Pricing | Guarantee + security badges + rating |

### Reusable Components

| Component | Source | Used By |
|-----------|--------|---------|
| PageHeader | Custom | Playbooks, Campaigns, Analytics, Pricing |
| SectionHeader | Custom | Multiple sections (overline + heading + desc) |
| MetricCard | Custom | Analytics KPIs, CampaignsList stats bar. Two variants: full (with sparkline) and compact (no sparkline). |
| PlaybookCard | Custom | PlaybooksDashboard grid |
| CampaignRow | Custom | CampaignsList (row layout) + CampaignPerformance (table row). Two display modes via prop. |
| FeatureCard | Custom | FeaturesBand |
| PricingCard | Custom | PricingTiers. Supports "popular" variant with badge and glow. |
| TestimonialCard | Custom | Homepage (social proof) — designed but not in current page scope, keep for future. |
| AITemplateCard | Custom | PlaybookEditor sidebar (future use in template gallery) |
| Toast | Custom | Global notification system. Positioned bottom-right, auto-dismiss 5s. |
| StatusBadge | Custom | PlaybookCard, CampaignRow. 4 variants: Draft, Active, Paused, Error. |
| Button | Custom | All pages. 3 variants: Primary, Secondary, Ghost. |
| Card | Custom | Wrapper component. Used by MetricCard, PlaybookCard, FeatureCard, etc. |
| Input | Custom | Text input, textarea, select across PlaybookEditor and CampaignBuilder. |
| TagInput | Custom | PlaybookEditor (industries, competitors). Type-to-add with removable pills. |
| ToggleSwitch | Custom | PlaybookEditor (Include CTA), EngagementTrends (Track toggles). |
| SegmentedControl | Custom | CampaignBuilder (time granularity), Analytics (Day/Week/Month). |
| DragDropZone | Custom | CampaignBuilder Step 2 (CSV upload). Drag-over state, upload progress. |
| SequenceStepCard | Custom | CampaignBuilder Step 3. Timeline-connected card with rich textarea and AI actions. |
| ProgressBar | Custom | CampaignBuilder. 4-step indicator with connecting lines. |
| Sparkline | Custom | MetricCard. SVG line chart with stroke-dasharray draw animation. Built manually — recharts is overkill for 30-point sparklines. |
| ComparisonTable | Custom | Pricing feature comparison. Category headers + checkmark/quantity cells. |
| AccordionItem | Custom | FAQ, PlaybookEditor sections, CampaignBuilder settings. Framer Motion AnimatePresence for height animation. |

### Hooks

| Hook | Purpose |
|------|---------|
| useMousePosition | Global mouse tracking with lerp smoothing for CustomCursor and Three.js sphere effector |
| useInView | Intersection observer wrapper for scroll-triggered animations (threshold 0.15) |
| useCountUp | Animates number from 0 to target value over duration with ease-out |
| useReducedMotion | Detects `prefers-reduced-motion` for accessibility |
| useToast | Toast notification state manager with add/remove/timeout logic |
| useLocalStorage | Persist form draft data in PlaybookEditor and CampaignBuilder |

---

## Animation Implementation

| Animation | Library | Approach | Complexity |
|-----------|---------|----------|------------|
| 3D Sphere (icosahedron + mouse deformation) | Three.js raw | IcosahedronGeometry with custom vertex shader for mouse-driven displacement. Effector follows mouse via raycaster + lerp. Outer glow particles via PointsMaterial with AdditiveBlending. | 🔒 High |
| Sphere entrance (scale + fade) | Three.js | Animate scale uniform 0.3→1.0 and material opacity over 1500ms in render loop. | Low |
| Sphere idle rotation + particle pulse | Three.js | Y-rotation 0.001 rad/frame in render loop. Particle opacity via sin(time) in vertex/fragment shader. | Medium |
| Hero text entrance (word stagger) | Framer Motion | Split headline into word spans. `variants` with staggerChildren: 0.08s, each child: y: 30→0, opacity: 0→1, 700ms. | Low |
| Page entrance sequence | Framer Motion | Orchestrated `variants` on PageLayout: nav 0ms, headline 100ms, description 400ms, rest 600ms. | Low |
| Scroll-reveal (sections) | Framer Motion + useInView | `whileInView` trigger with y: 50→0, opacity: 0→1, 700ms. `viewport: { once: true, amount: 0.15 }`. | Low |
| Card stagger entrance | Framer Motion | Parent `variants` with staggerChildren: 0.1s. Applied to all card grids. | Low |
| Custom cursor (lerp follow) | requestAnimationFrame | RAF loop with lerp factor 0.15. State machine for default/hover/text/dragging modes. No library needed. | Medium |
| Campaign builder step transition | Framer Motion | `AnimatePresence` with `mode="wait"`. Exiting step: x→-30, opacity→0. Entering step: x: 30→0, opacity: 0→1, 400ms. | Medium |
| Progress bar step activation | Framer Motion | Scale pulse (1→1.2→1, 300ms) on step circle. Connecting line fill: width 0→100%, 400ms. | Low |
| AI rewrite loading shimmer | CSS | `linear-gradient` background-position animation on textarea, 1.5s. Sparkles icon: CSS rotation. | Low |
| Form section expand/collapse | Framer Motion | `AnimatePresence` + `motion.div` with height: "auto" animation, 300ms. | Low |
| FAQ accordion | Framer Motion | Same pattern as form sections. Chevron: rotate 180deg transition 250ms. Only one open at a time (state-managed). | Low |
| Count-up numbers | Custom (useCountUp) | RAF-based interpolation with easeOutQuart. Triggered by `useInView`. | Low |
| Sparkline draw | CSS + SVG | `stroke-dasharray` / `stroke-dashoffset` CSS transition, 1200ms. Triggered after count-up completes. | Low |
| Engagement trend chart | Recharts | `<AreaChart>` with custom tooltip (floating div via Recharts' `content` prop). Crosshair via custom cursor component. Tab switching: conditional render with key swap. | Medium |
| Donut chart | SVG raw | Manual SVG with `<circle>` segments using `stroke-dasharray`/`stroke-dashoffset`. Hover: translate segment outward 8px via `transform`. Center text for total. | Medium |
| Live activity feed | Framer Motion | `AnimatePresence` with `initial={{ y: -20, opacity: 0 }}` for new items. Existing items shift via layout animation. | Medium |
| Toast enter/exit | Framer Motion | Enter: x: 100%→0, 400ms. Exit: x: 0→100%, opacity: 1→0, 300ms. Auto-dismiss via setTimeout. | Low |
| Billing toggle price roll | Framer Motion | Old number: y→-100%, opacity→0. New number: y: 100%→0, opacity: 0→1, 400ms. `AnimatePresence` with mode="wait". | Low |
| Launch button glow pulse | CSS | `box-shadow` keyframe animation, 2s infinite. | Low |
| Popular card glow pulse | CSS | Same pattern, 3s infinite, box-shadow opacity oscillation. | Low |
| Scroll indicator dot | CSS | `translateY` keyframe loop, 2s infinite ease-in-out. | Low |
| Nav background on scroll | CSS | `scroll` event listener toggles class. `transition: background 300ms, backdrop-filter 300ms`. | Low |

---

## State & Logic Plan

### Three.js Sphere Architecture

The sphere is a self-contained imperative module — not a React component tree. Approach:

- **Sphere class** (imperative, vanilla TS): Encapsulates the entire Three.js scene — renderer, camera, scene, geometry, materials, lights, particles, animation loop. Exposes: `mount(container: HTMLElement)`, `unmount()`, `setMousePosition(normalizedX: number, normalizedY: number)`.
- **Integration**: A React wrapper component (`HeroSphere`) creates a ref to a container div, instantiates the Sphere class in `useEffect`, and passes mouse position from `useMousePosition` hook via `setMousePosition`. Cleanup calls `unmount()` which disposes geometries, materials, renderer, and cancels the animation frame.
- **Mouse-to-effector pipeline**: Normalized mouse (-1 to 1) → Raycaster against sphere bounding sphere → intersection point → lerp current effector position toward intersection at 0.15/frame → pass to vertex shader as uniform → shader deforms vertices within radius 0.35, fadeWidth 0.2, strength 0.5.
- **Performance**: Use `IntersectionObserver` to pause/resume the RAF loop when canvas is off-screen. Cap `devicePixelRatio` at 2. On mobile: reduce particle count to 2500.
- **Reduced motion**: If `useReducedMotion` returns true, skip canvas mount and render static fallback image instead.

### Campaign Builder — 4-Step Wizard State

- **State shape**: `{ currentStep: 1-4, playbookId: string | null, prospects: Prospect[], sequence: SequenceStep[], settings: CampaignSettings }`
- **Persistence**: `useLocalStorage` auto-saves draft state on every change. Key: `campaign-builder-draft`.
- **Step validation**: Each step has a `canProceed()` check. Step 1: playbookId selected. Step 2: prospects.length > 0. Step 3: all steps have subject + body. Next button disabled until valid.
- **Step transition direction**: Track `direction: 'next' | 'prev'` to animate slide left/right correctly in AnimatePresence.
- **Sequence steps**: Dynamic array. Adding a step appends with day = lastDay + 3. Removing a step recalculates subsequent day offsets. Max 5 steps on Professional plan (enforced in UI).
- **Launch**: On final step, "Launch Campaign" sends the assembled campaign object. Show loading state, then redirect to Campaigns list with success toast.

### Playbook Editor — Form State

- **State shape**: Deep object with all form fields. Uses React state (not a form library — the form is complex enough to warrant manual state but simple enough to not need React Hook Form).
- **Dynamic arrays** (value props, pain points, features): Each is an array of objects with `id` (nanoid-like) and `value`. Add/remove/reorder operations.
- **Dirty tracking**: Deep comparison between current state and last-saved state (or initial empty state for new playbooks). Drives the Save button's dirty/clean state and the "Saved" / "Save Changes" label.
- **AI sidebar**: The score ring and template preview recompute based on form state (debounced 1s). The score is a simple heuristic function (count completed fields / total required fields).
- **LocalStorage persistence**: Auto-save draft every 5s of inactivity. Key: `playbook-draft-{id || 'new'}`.

### Analytics — Chart Data Flow

- **Time range state**: `"7d" | "30d" | "90d" | "quarter" | "custom"`. Default: "30d". Stored in URL query param for shareability.
- **Chart tab state**: `"opens" | "clicks" | "replies" | "bounces"`. Each tab fetches (or derives from cached data) a different data series for the same time range.
- **Granularity state**: `"day" | "week" | "month"`. Affects x-axis labels and data point aggregation.
- **Data source**: All analytics data comes from a single `getAnalytics(range, granularity)` call that returns a structured object. Chart tabs slice this data. No per-tab API calls needed.
- **Tooltip**: Custom Recharts tooltip component that reads current + previous period values from the data point and computes percentage change.

### Toast System — Global State

- **Context**: `ToastContext` at app root level. Provides `addToast(type, message)` and `removeToast(id)`.
- **State**: Array of `{ id, type, message, createdAt }`. Max 3 toasts visible at once (FIFO eviction).
- **Auto-dismiss**: Each toast sets a 5s timeout on mount. Cleared on manual dismiss or unmount.
- **Animation**: Framer Motion `AnimatePresence` on the toast container for enter/exit.

### Routing

- 5 routes: `/` (Homepage), `/playbooks` (Playbooks), `/campaigns` (Campaigns), `/analytics` (Analytics), `/pricing` (Pricing)
- Playbook editor: `/playbooks/:id` (edit) and `/playbooks/new` (create). Shares the same CampaignBuilder component with different initial states.
- Campaign builder: `/campaigns/new`. Could also support `/campaigns/:id/edit`.
- Analytics time range: `/analytics?range=30d&tab=opens&granularity=day` — state syncs with URL query params.
- Lazy load all page components via `React.lazy()` for code splitting.

---

## Other Key Decisions

### Raw Three.js over React Three Fiber

The sphere is a single fullscreen canvas with a simple scene (1 mesh + 1 points cloud + 2 lights). R3F's declarative reconciler adds overhead with no benefit for this use case. The sphere is fully imperative — mouse updates, animation loop, material uniforms — so a class-based approach with a thin React wrapper is cleaner and more performant.

### Recharts for Main Charts, Raw SVG for Sparklines

Recharts handles the engagement trend area chart (interactive tooltip, responsive container, tab switching). Sparklines in MetricCards are 30-point SVG paths — too simple for Recharts. Raw SVG with CSS `stroke-dasharray` animation avoids loading the Recharts bundle for a tiny line.

### No Form Library

Both PlaybookEditor and CampaignBuilder have complex, dynamic forms with array fields, conditional sections, and custom UI (tag inputs, sliders, toggles). Libraries like React Hook Form or Formik would fight against the bespoke UI patterns. Manual state with controlled components is more flexible here. Use simple debounced validation, not a schema library.

### No State Management Library

All state is either: (a) local component state, (b) shared via React Context (Toast, Cursor), or (c) URL query params (Analytics filters). No global store needed — the data flows are simple enough that useState + useContext cover all cases. No external API calls exist (all data is static/demo), so no async state management (TanStack Query, SWR) is needed.
