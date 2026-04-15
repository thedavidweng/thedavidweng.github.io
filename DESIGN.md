# Design System: Confident, Craftsmanship Portfolio

## Visual Theme & Atmosphere

**Design Philosophy**: Editorial, sophisticated, and craftsmanship-focused. The portfolio embodies the personality of a confident, refined, and detail-oriented creator who treats their work as gallery-worthy art.

**Core Principles**:
- Clean, uncluttered layouts that let content breathe with generous whitespace
- Grid-based compositions with full-bleed sliders and asymmetric text placement
- Moderate decoration level with refined details, avoiding excess
- Medium-low visual density for balanced negative space
- Professional imagery presentation with 3:2 aspect ratio

**Interaction Feel**: Smooth, sophisticated, and gallery-like. Every transition and hover state should feel intentional and premium.

---

## Color Palette & Roles

| Token Name | HEX Value | Usage |
|------------|-----------|-------|
| `--color-paper-white` | `#ffffff` | Primary background, cards |
| `--color-soft-cream` | `#fafafa` | Secondary background, sections |
| `--color-silver-mist` | `#a3a3a3` | Accent elements, muted text |
| `--color-carbon` | `#131718` | Primary text, headings |
| `--color-warm-slate` | `#a3a3a3` | Secondary text, captions |
| `--color-overlay-light` | `rgba(252,251,248,0.98)` | Light modal overlays, frosted glass |
| `--color-overlay-dark` | `rgba(27,25,24,0.98)` | Dark modal overlays, lightbox |
| `--color-shadow-soft` | `rgba(0,0,0,0.05)` | Subtle drop shadows |
| `--color-shadow-medium` | `rgba(0,0,0,0.08)` | Medium elevation shadows |
| `--color-shadow-heavy` | `rgba(0,0,0,0.10)` | High elevation shadows |

**Contrast Strategy**: Bold headings against muted accent colors. Text hierarchy achieved through weight and color variation rather than heavy color contrast.

---

## Typography Rules

### Font Families

| Role | Font Stack | Fallback |
|------|------------|----------|
| Primary (UI, Body) | ABC Monument Grotesk Variable | Helvetica, sans-serif |
| Secondary (Editorial) | Times Now SemiLight | Times New Roman, serif |

### Type Scale

```
HTML Base: 62.5% (10px effective base)
Body Size: 1.75rem (17.5px)
Line Height Body: 1.44
Line Height Headings: 1.2
Letter Spacing: -0.01em (slight tightening)
```

### Type Treatment

| Element | Size | Weight | Color | Line Height |
|---------|------|--------|-------|-------------|
| H1 Headings | 1.75rem | 375 (Regular) | Carbon `#131718` | 1.2 |
| H2 Headings | 1.75rem | 375 (Regular) | Silver Mist `#a3a3a3` | 1.2 |
| Body Text | 1.75rem | 375 (Regular) | Carbon `#131718` | 1.44 |
| Captions | 1.75rem | 375 (Regular) | Silver Mist `#a3a3a3` | 1.44 |

**Font Variable Usage**: Variable font enabled for fine-tuned weight control. Default weight is 375 (between Light and Regular).

**Rendering Optimizations**:
- Antialiasing: enabled
- Font Display: swap (for performance)
- Text Rendering: optimizeLegibility

---

## Component Stylings

### Buttons

| State | Style |
|-------|-------|
| Default | Transparent background, Silver Mist text, no border |
| Hover | Scale 1.01, subtle shadow appears `0 4px 10px rgba(0,0,0,0.05)` |
| Active | Pressed effect with darker text |
| Focus | Visible focus ring matching accent color |

### Cards & Containers

| Element | Border Radius | Background | Shadow |
|---------|---------------|------------|--------|
| Default Card | 16px | Paper White `#ffffff` | None |
| Elevated Card | 16px | Paper White `#ffffff` | `0 4px 10px rgba(0,0,0,0.05)` |
| Hover Card | 16px | Paper White `#ffffff` | `0 4px 10px rgba(0,0,0,0.08)` + Scale 1.01 |
| Image Container | 16px (desktop) / 12px (mobile) | — | None |

### Navigation

| Element | Specification |
|---------|---------------|
| Z-Index | 1 |
| Background | Light Overlay with backdrop blur |
| Blur Intensity | `blur(20px)` |
| Scroll Behavior | Native with `overscroll-behavior: none` |

### Images

| State | Treatment |
|-------|-----------|
| Default | 16px border radius (desktop), 12px (mobile), 3:2 aspect ratio |
| Hover | Subtle scale 1.01, shadow elevation |
| Lightbox | Full overlay with dark backdrop `rgba(27,25,24,0.98)`, 0.4s transition |

### Modals & Overlays

| Element | Z-Index | Backdrop | Blur |
|---------|---------|----------|------|
| Modal | 100 | Dark Overlay | `blur(25px)` |
| Lightbox | 100 | Dark Overlay `rgba(27,25,24,0.98)` | Fade transition 0.4s |

---

## Layout Principles

### Grid System

| Property | Mobile | Desktop |
|----------|--------|---------|
| Columns | 4 | 6 |
| Grid Gap | 0.8rem (8px) | 0.8rem (8px) |
| Padding | 4rem (40px) | 4rem (40px) |
| Max Width | ~672px | ~756px |
| Breakpoint | < 700px | ≥ 700px |

**Grid Definition**: `padding repeat(columns, 1fr) padding`

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-unit` | 8px | Base unit |
| `--spacing-gap` | 0.8rem (8px) | Grid gap |
| `--spacing-padding` | 4rem (40px) | Container padding |
| `--spacing-lh` | 1lh | Line-height unit for vertical rhythm |
| `--section-margin` | 1-4 lh | Section vertical spacing |
| `--slider-margin-top` | 3-4 lh | Slider top margin |
| `--slider-margin-bottom` | 4.75-6.75 lh | Slider bottom margin |

### Full-Bleed & Viewport

- **100dvh Usage**: Full viewport height for hero sections
- **Full Bleed**: Enabled for sliders and featured content
- **Subgrid**: CSS subgrid enabled for nested alignment

---

## Elevation & Motion

### Shadow System

| Level | Shadow Value | Usage |
|-------|--------------|-------|
| Subtle | `0 4px 10px rgba(0,0,0,0.05)` | Default card hover |
| Medium | `0 4px 10px rgba(0,0,0,0.08)` | Elevated elements |
| Heavy | `0 4px 10px rgba(0,0,0,0.10)` | Modal, high emphasis |

### Backdrop Effects

| Level | Blur Value | Usage |
|-------|------------|-------|
| Light | `blur(20px)` | Navigation, light overlays |
| Medium | `blur(25px)` | Modals, focused containers |

### Animation Timings

| Animation Type | Duration | Easing |
|----------------|----------|--------|
| Fast (micro) | 0.2s (200ms) | `cubic-bezier(.2, 0, 0, 1)` |
| Normal | 0.3s (300ms) | `cubic-bezier(.2, 0, 0, 1)` |
| Slider | 0.35s (350ms) | `cubic-bezier(.2, 0, 0, 1)` |
| Lightbox | 0.4s (400ms) | `cubic-bezier(.2, 0, 0, 1)` |
| View Transition | 0.6s (600ms) | `cubic-bezier(.2, 0, 0, 1)` |

### Easing Curves

| Name | Curve | Usage |
|------|-------|-------|
| Standard | `cubic-bezier(.2, 0, 0, 1)` | Default transitions |
| Smooth | `cubic-bezier(0, .55, .45, 1)` | Emphasis easing |
| Natural | `cubic-bezier(.4, 0, 0, 1)` | Direct movement |
| Gentle | `cubic-bezier(.25, .46, .45, .94)` | Subtle interactions |

### Animation Patterns

| Pattern | Description |
|---------|-------------|
| Blur In | `blur(4px) → 0px` + `opacity(0) → 1` |
| Translate Y | `translateY(8px) → 0px` |
| Opacity | `opacity(0) → 1` |
| Scale Hover | `scale(1) → scale(1.01)` |
| Filter Blur | Image blur transitions for lazy loading |

### Scroll Behavior

- Native scroll with `overscroll-behavior: none`
- Reveal on scroll animations enabled

### Special Effects

| Effect | Implementation |
|--------|----------------|
| SVG Aurora | Animated gradient path in footer |
| Frosted Glass | `backdrop-filter: blur(20-25px)` |
| View Transitions | `::view-transition-group` API |

---

## Do's and Don'ts

### Do's

1. **Use generous whitespace** — Let content breathe with ample margins and padding
2. **Maintain 8px grid alignment** — All spacing should be multiples of 8px
3. **Apply subtle shadows** — Start with lowest opacity (0.05) and increase only when needed
4. **Use blur transitions for entrances** — Animate from `blur(4px)` to clear
5. **Keep typography light** — Font weight 375 provides elegance without heaviness
6. **Prefer frosted glass on overlays** — Use `backdrop-filter: blur(20px)` for modals
7. **Use 3:2 aspect ratio for images** — Maintain consistent image proportions
8. **Animate with the standard curve** — `cubic-bezier(.2, 0, 0, 1)` for most transitions

### Don'ts

1. **Don't use heavy shadows** — Avoid `rgba(0,0,0,0.15)` or higher
2. **Don't overdecorate** — This is a refined, editorial aesthetic
3. **Don't use bold weights** — Stick to weight 375 or lighter
4. **Don't skip aspect ratios** — Always use 3:2 for project images
5. **Don't use jarring animations** — Avoid instant transitions or linear easing
6. **Don't crowd the grid** — Respect the 4-column mobile / 6-column desktop structure
7. **Don't use high contrast colors** — Keep accent colors muted (Silver Mist)
8. **Don't ignore the baseline** — Use line-height units (1lh) for vertical rhythm

---

## How Agents Should Use This File

### For UI Generation

When generating React/HTML components:

1. **Import CSS Variables**: Use the color tokens, spacing values, and shadow definitions directly in your CSS
2. **Follow Typography Scale**: Match font sizes to the 1.75rem base, weights to 375, and line-heights to 1.44/1.2
3. **Apply Border Radii**: Use 16px for cards, 12px for mobile images, 9999px for pills
4. **Use Standard Easing**: Always apply `cubic-bezier(.2, 0, 0, 1)` unless specified otherwise

### For Animation

1. **Entrance Animations**: Combine `blur(4px → 0)`, `translateY(8px → 0)`, and `opacity(0 → 1)` over 0.3s
2. **Hover States**: Apply `scale(1.01)` and shadow elevation over 0.2s
3. **Modal Transitions**: Use 0.4s duration with the standard easing curve

### For Layout

1. **Grid Structure**: Always use CSS Grid with `repeat(columns, 1fr)` and explicit padding
2. **Responsive**: Switch from 4 columns to 6 columns at the 700px breakpoint
3. **Spacing**: All gaps should be 8px (0.8rem), padding should be 40px (4rem)

### For Color Application

| Context | Background | Text |
|---------|------------|------|
| Primary Surface | `#ffffff` | `#131718` |
| Secondary Surface | `#fafafa` | `#131718` |
| Muted Text | — | `#a3a3a3` |
| Overlay | `rgba(252,251,248,0.98)` | Match content |

### For Shadow Application

| Elevation Need | Shadow Value |
|----------------|--------------|
| Subtle (default hover) | `0 4px 10px rgba(0,0,0,0.05)` |
| Medium (elevated) | `0 4px 10px rgba(0,0,0,0.08)` |
| Heavy (modal) | `0 4px 10px rgba(0,0,0,0.10)` |

### Quick Reference

```
Font: ABC Monument Grotesk Variable, 375 weight
Base Size: 1.75rem (17.5px)
Easing: cubic-bezier(.2, 0, 0, 1)
Animation Duration: 0.3s (default)
Border Radius: 16px (cards), 12px (mobile images)
Grid Gap: 8px
Container Padding: 40px
Breakpoint: 700px
```
