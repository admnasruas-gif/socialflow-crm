---
name: SocialFlow CRM
description: Operação simples para profissionais autônomos de social media acompanharem clientes, contratos e entregas.
colors:
  canvas: "#F7F7FA"
  surface: "#FFFFFF"
  surface-secondary: "#FAFAFA"
  surface-subtle: "#EFEFF4"
  surface-selected: "#FFFCE0"
  text-primary: "#17171C"
  text-secondary: "#656572"
  border: "#E7E7EE"
  border-strong: "#D4D4DF"
  brand-yellow: "#FFE600"
  brand-yellow-hover: "#F2DA00"
  brand-orange: "#F97316"
  brand-magenta: "#DB2777"
  brand-purple: "#9333EA"
  success: "#15803D"
  success-bg: "#DCFCE7"
  warning: "#B45309"
  warning-bg: "#FEF3C7"
  info: "#1D4ED8"
  info-bg: "#EFF6FF"
  danger: "#B91C1C"
  danger-bg: "#FEF2F2"
  action-primary: "linear-gradient(120deg, #C2410C 0%, #9D174D 50%, #7E22CE 100%)"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.04em"
rounded:
  field: "12px"
  card: "18px"
  sheet: "20px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  section: "24px"
components:
  button-primary:
    backgroundColor: "{colors.action-primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.field}"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.field}"
    height: "44px"
  input:
    backgroundColor: "#E5E5EA"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.field}"
    height: "46px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.card}"
  chip-active:
    backgroundColor: "{colors.text-primary}"
    textColor: "{colors.brand-yellow}"
    rounded: "{rounded.pill}"
---

# Design System: SocialFlow CRM

## Overview

**Creative North Star: "Estúdio em movimento"**

SocialFlow CRM is a contained, operational workspace for an independent social media professional. Its visual language keeps the calm of an iOS productivity app while allowing the NasRuas identity to appear as purposeful signals: a yellow action color and a restrained orange–magenta–purple spectrum for progress, status, and content work.

The system is mobile-first and scan-oriented. White surfaces sit on a cool neutral canvas, cards use quiet borders and soft shadows, and controls are large enough to operate comfortably on a phone. The tone is intentionally contained and operational rather than corporate-heavy or decorative. Brand color has a job: it should clarify an action, a state, or a piece of progress.

**Key Characteristics:**
- Mobile-first composition with 44px minimum interactive targets.
- Calm neutral workspace with small, high-signal color accents.
- Rounded cards and fields with restrained borders.
- Gradient reserved for brand marks, progress, and primary action emphasis.
- Dense enough for daily operations, never visually noisy.

## Colors

The palette pairs a cool near-white workspace with black-violet text, a signal yellow, and a creative spectrum that moves from orange through magenta to purple.

### Primary
- **Signal Yellow** (#FFE600): Primary brand action, add/create controls, selected emphasis, and the most recognizable NasRuas signature.
- **Creative Magenta** (#DB2777): Primary semantic accent for progress, active brand references, and content-related emphasis.
- **Creative Spectrum** (linear-gradient(120deg, #F97316 0%, #DB2777 50%, #9333EA 100%)): Brand identity gradient used in the logo ring, progress fills, and small structural accents.

### Secondary
- **Studio Orange** (#F97316): Leading color in the brand spectrum and a supporting content signal.
- **Studio Purple** (#9333EA): Closing color in the brand spectrum and a supporting report/content signal.
- **Action Blue** (#1D4ED8): Informational and calendar-related state, not a competing brand color.

### Neutral
- **Cool Canvas** (#F7F7FA): App background and breathing room around working surfaces.
- **White Surface** (#FFFFFF): Cards, fields, sheets, and primary reading surfaces.
- **Soft Surface** (#FAFAFA): Secondary containers and subtle grouping.
- **Subtle Gray** (#EFEFF4): Disabled controls and low-emphasis surfaces.
- **Ink** (#17171C): Primary text, active chips, and high-contrast controls.
- **Muted Ink** (#656572): Secondary labels, metadata, and supporting copy.
- **Quiet Border** (#E7E7EE): Default borders and dividers.
- **Strong Border** (#D4D4DF): Hover and stronger separation.

### Named Rules
**The Brand With Function Rule.** Yellow and the gradient must communicate action, progress, identity, or state; do not apply them as arbitrary decoration.

## Typography

**Display Font:** System sans (`-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, sans-serif)

**Body Font:** The same system sans stack for reliable mobile and desktop rendering.

**Character:** Direct, familiar, and highly legible. Weight and size create hierarchy; the system does not rely on expressive display typography or decorative type.

### Hierarchy
- **Display** (700, 28px, 1.15, -0.025em): Main screen titles such as Clientes, Postagens, Vendas, Vídeos, and Ajustes.
- **Headline** (700, 24px, 1.15, -0.025em): Dashboard greeting and prominent app-level headings.
- **Title** (600, 16px, 1.3): Client names, card titles, and primary item labels.
- **Body** (400, 16px, 1.45): Form input text and readable operational copy.
- **Label** (600, 13px, 1.3, 0.04em when uppercase): Section labels, metadata headers, and compact navigation context.
- **Metric** (700, 22px, 1.25): Dashboard and profile summary values.

### Named Rules
**The Data-First Type Rule.** Use weight and contrast to make names, statuses, dates, and delivery counts scannable before any brand accent is noticed.

## Layout

The app is a full-height column on mobile with a bottom navigation area and a compact desktop sidebar at larger widths. Main content is centered with a maximum width of 1120px and uses 16px horizontal gutters on narrow screens. Sections are stacked with a 20px rhythm; cards and toolbars use 8px–16px internal gaps.

Dashboard content follows a practical order: greeting and search, period/report controls, category chips, three summary metrics, then the client list. Lists begin as a single-column stack and may become a multi-column or table view on desktop. Horizontal chip rows scroll rather than wrap when space is constrained. Responsive changes preserve the information hierarchy and touch targets instead of shrinking controls below comfortable use.

## Elevation & Depth

Depth is conveyed primarily through tonal layering: white surfaces on a cool gray canvas, quiet 1px borders, and subtle ambient shadows. Shadows are never the main decoration. Sheets and menus can use stronger soft shadows because they sit above the workspace; resting cards remain visually calm.

### Shadow Vocabulary
- **Ambient micro** (`0 1px 3px rgba(23, 23, 28, 0.03–0.05)`): Search fields, quick tiles, and small resting controls.
- **Calendar lift** (`0 2px 6px rgba(23, 23, 28, 0.05)`): Small utility widgets such as the mini calendar.
- **Overlay lift** (`0 10px 28px rgba(23, 23, 28, 0.14)`): Dropdown menus and floating layers only.

### Named Rules
**The Quiet Surface Rule.** Resting cards stay flat and legible; stronger elevation belongs to overlays and transient layers, not every container.

## Shapes

The form language is gently rounded and tactile without becoming bubbly. Fields and standard controls use 12px corners, cards use 18px, bottom sheets use 20px top corners, and badges/chips use fully rounded pills. Avatars are circular; logos use circular masks with a brand gradient ring. Borders are thin, cool, and low contrast.

## Components

### Buttons
- **Character:** Direct and reliable, with a clear action hierarchy.
- **Shape:** 12px radius; standard controls are at least 44px tall.
- **Primary:** Gradient action background, white text, comfortable horizontal padding; yellow is used for high-salience NasRuas create/register actions.
- **Hover / Focus:** Darker gradient or stronger border; all controls receive a visible 2px focus outline with 2px offset.
- **Secondary / Ghost:** White or transparent background, quiet border, ink or muted-ink text; ghost actions remain visually subordinate.
- **Pressed / Disabled:** Brief scale-down response for tactile controls; disabled uses `#EFEFF4` and `#8A8A96`.

### Chips
- **Style:** Fully rounded 999px shape, 44px minimum height, white surface and quiet border when inactive.
- **State:** Active chips use ink background with signal-yellow text; status dots use semantic colors and remain small.
- **Behavior:** Chip rows scroll horizontally on narrow screens rather than forcing unreadable wrapping.

### Cards / Containers
- **Corner Style:** 18px for primary cards; 12px for field-like controls.
- **Background:** White surface over cool canvas; soft surface for secondary grouping.
- **Shadow Strategy:** Ambient micro shadow only where useful; borders do most of the separation work.
- **Border:** 1px quiet border; warning/danger states replace it with semantic borders.
- **Internal Padding:** Common card padding is 14px–20px, with 16px as the default.

### Inputs / Fields
- **Style:** 46px minimum height, 12px radius, cool gray search background (`#E5E5EA`) or white bordered field, 16px text.
- **Focus:** Primary accent border plus a soft 3px primary ring; never remove the visible focus state.
- **Error / Disabled:** Semantic danger border/background for errors; subtle gray surface and muted text when disabled.

### Navigation
- **Style:** Mobile bottom navigation with large, familiar icon targets and a compact desktop sidebar from the desktop breakpoint upward.
- **Default / Hover:** Muted ink with quiet tonal hover surface.
- **Active:** Ink or primary accent treatment with clear label/icon contrast.
- **Mobile treatment:** Preserve safe-area padding and the 58px useful navigation height.

### Summary Metrics
- **Character:** Compact decision support, not decorative dashboard chrome.
- **Style:** Three equal columns in a white bordered card, with a restrained 3px brand gradient accent and thin internal dividers.
- **Typography:** 13px muted labels above 22px bold tabular values.

### Progress
- **Style:** 5px rounded track with a semantic or brand gradient fill.
- **Behavior:** Use green for delivered, gradient for in-progress, amber for near deadline, and red for overdue.

## Do's and Don'ts

### Do:
- **Do** keep the mobile-first 44px interaction target and 16px narrow-screen page gutter.
- **Do** use white surfaces, quiet borders, and the cool canvas to establish hierarchy before adding color.
- **Do** reserve yellow and gradient accents for actions, progress, identity, and meaningful status.
- **Do** keep client names, contract periods, delivery counts, and status visible at a glance.
- **Do** preserve keyboard focus, reduced-motion behavior, and semantic state colors.
- **Do** use inline SVG icons with a consistent stroke weight.

### Don't:
- **Don't** turn the gradient into a general-purpose background or text effect.
- **Don't** use color as the only indicator of status; pair it with labels or icons.
- **Don't** shrink controls below comfortable touch size to fit more content.
- **Don't** add heavy shadows, glass blur, or decorative cards that compete with operational data.
- **Don't** introduce a second typeface or decorative display style without an explicit identity decision.
- **Don't** let page-specific strategy become a global design-system rule.
