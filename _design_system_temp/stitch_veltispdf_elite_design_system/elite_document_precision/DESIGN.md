---
name: Elite Document Precision
colors:
  surface: '#fcf8ff'
  surface-dim: '#dcd8e4'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f2fe'
  surface-container: '#f0ecf8'
  surface-container-high: '#eae6f3'
  surface-container-highest: '#e4e1ed'
  on-surface: '#1b1b23'
  on-surface-variant: '#464554'
  inverse-surface: '#302f39'
  inverse-on-surface: '#f3effb'
  outline: '#777586'
  outline-variant: '#c7c4d7'
  surface-tint: '#5148d7'
  primary: '#2a14b4'
  on-primary: '#ffffff'
  primary-container: '#4338ca'
  on-primary-container: '#c1beff'
  inverse-primary: '#c3c0ff'
  secondary: '#8127cf'
  on-secondary: '#ffffff'
  secondary-container: '#9c48ea'
  on-secondary-container: '#fffbff'
  tertiary: '#3e3749'
  on-tertiary: '#ffffff'
  tertiary-container: '#554e60'
  on-tertiary-container: '#cac0d6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e3dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#100069'
  on-primary-fixed-variant: '#372abf'
  secondary-fixed: '#f0dbff'
  secondary-fixed-dim: '#ddb7ff'
  on-secondary-fixed: '#2c0051'
  on-secondary-fixed-variant: '#6900b3'
  tertiary-fixed: '#e9def5'
  tertiary-fixed-dim: '#cdc2d9'
  on-tertiary-fixed: '#1e1929'
  on-tertiary-fixed-variant: '#4a4456'
  background: '#fcf8ff'
  on-background: '#1b1b23'
  surface-variant: '#e4e1ed'
typography:
  display:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 16px
  sidebar-width: 280px
---

## Brand & Style
The design system is engineered to evoke the precision of high-end engineering tools and the effortless luxury of premium productivity suites. It targets high-stakes professional environments where clarity and reliability are non-negotiable.

The visual style is **Corporate Modern with Glassmorphic accents**. It draws heavily from the "Linear" and "Framer" aesthetic—utilizing expansive whitespace, hyper-refined border treatments, and subtle depth through translucent layers. The goal is to make a complex PDF editing environment feel lightweight, rhythmic, and high-status. Every interaction should feel intentional, frictionless, and "expensive."

## Colors
The palette is rooted in a "Soft Light" philosophy. The primary workspace uses **Pure White (#FFFFFF)** to represent the document canvas, while the surrounding interface uses **Neutral Gray (#F9FAFB)** to create a soft distinction between the tool and the content.

**Deep Indigo (#4338CA)** serves as the primary action color, signaling authority and stability. **Elegant Purple (#A855F7)** is used for secondary highlights and "Pro" features, while **Soft Lavender (#F3E8FF)** acts as a gentle background for active states, selections, and subtle alerts. This gradient of purples creates a sophisticated, cohesive brand thread without overwhelming the user's primary task: reading and editing.

## Typography
The design system utilizes **Geist** for its technical precision and modern, developer-centric aesthetic. It provides the "billion-dollar SaaS" feel through its tight tracking and balanced apertures.

For display styles, we use SemiBold weights with negative letter spacing to create a compact, "Apple-esque" impact. Body text maintains a standard tracking for high readability in document-heavy contexts. Label styles utilize slightly higher weights and uppercase transforms to differentiate UI controls from editable document content.

## Layout & Spacing
The layout follows a **Hybrid Fluid Workspace** model. The main editor canvas is fluid, expanding to maximize document visibility, while supporting utilities—like properties panels and navigation sidebars—are fixed at **280px**.

We use an 8px base grid to ensure vertical rhythm.
- **Desktop:** A 12-column grid is used for dashboard views, with 48px outer margins.
- **Editor View:** Relies on "No Grid" contextual layout, prioritizing safe margins (24px) around the document preview to simulate a physical desk.
- **Mobile:** Sidebars collapse into bottom sheets or full-screen overlays to preserve the 8px rhythmic spacing.

## Elevation & Depth
Depth is communicated through **Tonal Layering** and **Glassmorphism**, avoiding heavy shadows that can muddy a light interface.

1.  **Level 0 (Base):** Neutral Gray (#F9FAFB) background.
2.  **Level 1 (Panels):** Pure White (#FFFFFF) with a 1px border (#E5E7EB).
3.  **Level 2 (Floating Menus):** White background, 20px Backdrop Blur, and a "Linear-style" ambient shadow: `0 10px 15px -3px rgba(0,0,0,0.04), 0 4px 6px -2px rgba(0,0,0,0.02)`.
4.  **Active Overlays:** Semi-transparent Lavender (#F3E8FF/40) for selection masking.

Borders are preferred over shadows for defining structure, maintaining a crisp, architectural feel.

## Shapes
The shape language is "Generous & Modern." A base roundedness of **0.5rem (8px)** is applied to standard inputs and buttons. 

For larger containers like document cards or modal windows, we use **rounded-xl (1.5rem / 24px)** to achieve the soft, approachable feel characteristic of premium consumer electronics software. This high-radius approach softens the "utility" nature of a PDF editor, making the software feel more like a modern creative suite.

## Components

### Buttons
Primary buttons use the Deep Indigo background with white text. They feature a subtle 1px top-inner highlight to create a "pressed" tactile feel. Secondary buttons use a White background with a 1px border (#E5E7EB) and Deep Indigo text.

### Inputs & Text Fields
Inputs are Pure White with a subtle #E5E7EB border. On focus, they transition to a 1px #4338CA border with a soft Lavender (#F3E8FF) outer glow (4px spread).

### Cards
Cards are used for "Recent Documents." They feature a 1px border and no shadow by default. On hover, they lift slightly using the Level 2 ambient shadow and the border color shifts to #A855F7.

### Toolbars
Floating toolbars use **Glassmorphism**. A semi-transparent white background (opacity 80%) with a 12px backdrop blur allows document content to peek through, maintaining context while the user interacts with tools.

### Progress & Status
Success states use a refined emerald green, but system-critical alerts use the Elegant Purple to remain within the brand's premium spectrum.