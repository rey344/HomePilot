# HomePilot – Design System

Fintech-style dark theme. Professional, calm, production-ready.

---

## 1. Color Palette

All colors are defined as CSS variables in `frontend/src/app/globals.css`. **Do not hardcode hex values in components.**

### Base

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-app` | `#0B0F19` | App background |
| `--color-surface-card` | `#111827` | Cards, header |
| `--color-surface-input` | `#0F172A` | Input backgrounds |

### Border

| Token | Value | Usage |
|-------|-------|-------|
| `--color-border` | `rgba(255,255,255,0.08)` | All borders, dividers |

### Primary Accent (Electric Cyan)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#00C9FF` | Buttons, links, focus, progress bars |
| `--color-primary-hover` | `#00B4E6` | Button hover |

### Text

| Token | Value | Usage |
|-------|-------|-------|
| `--color-text-primary` | `#E5E7EB` | Headings, body |
| `--color-text-muted` | `#9CA3AF` | Labels, secondary text |

### Semantic

| Token | Value | Usage |
|-------|-------|-------|
| `--color-success` | `#22C55E` | Positive, principal paid, affordable |
| `--color-warning` | `#F59E0B` | Caution (40–50% housing) |
| `--color-danger` | `#EF4444` | Errors, over 50% housing |
| `--color-wants` | `#60A5FA` | Wants (30%) progress bar |

### Background Gradient

Subtle radial gradients for depth (no particles):

```css
radial-gradient(circle at 20% 10%, rgba(0,201,255,0.15), transparent 40%),
radial-gradient(circle at 80% 90%, rgba(0,201,255,0.08), transparent 50%),
#0B0F19
```

---

## 2. Typography

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| Title | 32px | 600 | "HomePilot" |
| Section header | 14px | 500 | Uppercase, `tracking-[0.08em]`, muted |
| Card title | 18px | 600 | Card headers |
| Body | 15px | 400 | Default text |
| Small / muted | 14px | 400 | Notes, labels |

**Font:** Inter (via `next/font/google`, `--font-inter`)

---

## 3. Spacing & Shape

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 8px | Tight gaps |
| `--space-2` | 16px | Default gap |
| `--space-3` | 24px | Section spacing |
| `--space-4` | 32px | Card padding |
| `--radius` | 14px | Cards, buttons |
| `--radius-input` | 10px | Inputs |

---

## 4. Elevation

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-card` | `0 10px 30px rgba(0,0,0,0.4)` | Cards |

---

## 5. Components

### Card

- Background: `--color-surface-card`
- Border: `--color-border`
- Padding: 32px (`p-8`)
- Radius: 14px
- Shadow: `--shadow-card`

### Button

**Primary**

- Background: `linear-gradient(90deg, #00C9FF, #00E0FF)`
- Text: white
- Height: 44px (`h-11`)
- Hover: `brightness-110`

**Secondary / Ghost**

- Border or transparent; `hover:bg-white/5`

### Input

- Background: `--color-surface-input`
- Border: `--color-border`; focus: `--color-primary` + ring
- Height: 44px (`h-11`)
- Radius: 10px
- Error state: `--color-danger` border and message

---

## 6. Affordability Color Feedback

Housing % of income drives message color:

| Range | Color | Meaning |
|-------|-------|---------|
| ≤ 40% | `--color-success` | Comfortable |
| 40–50% | `--color-warning` | Approaching limit |
| > 50% | `--color-danger` | Over budget |

---

## 7. Progress Bars (50/30/20)

| Segment | Color |
|---------|-------|
| Needs (50%) | `--color-primary` |
| Wants (30%) | `--color-wants` |
| Savings (20%) | `--color-success` |

---

## 8. Table (Amortization)

- Sticky header
- Zebra striping: `rgba(255,255,255,0.03)` on odd rows
- Numeric columns: right-aligned, `tabular-nums`
- Row hover: `bg-white/[0.03]`
- Dividers: `--color-border`

---

## 9. Accessibility

- Focus ring: `2px solid var(--color-primary)`, `outline-offset: 2px`
- Error messages: `role="alert"`, `aria-invalid` on inputs
- Labels: `aria-describedby` when error present
