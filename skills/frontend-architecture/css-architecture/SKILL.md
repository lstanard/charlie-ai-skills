---
name: "css-architecture"
description: "Style components with CSS Modules and a two-layer CSS variable token system (primitive + semantic). Prefer modules over Tailwind; avoid CSS-in-JS except for runtime-computed styles."
---

# CSS architecture (Modules + Design Tokens)
version: 0.2.0

## Purpose
Style components with CSS Modules and a two-layer CSS variable token system (primitive + semantic). Prefer modules over Tailwind; avoid CSS-in-JS except for runtime-computed styles.

## Triggers
- CSS architecture
- CSS modules
- design tokens
- CSS variables
- styling components
- theming
- CSS naming convention
- style a component
- add styles
- how to style

## Inputs

## Guarantees
- CSS Modules (.module.css) are the default styling mechanism; Tailwind utility classes are not used; CSS-in-JS (styled-components, emotion) is only used when styles must be computed from runtime values unavailable in CSS (e.g. user-defined colors)
- Design tokens use a two-layer system: primitive tokens define raw values (--color-blue-500, --space-4) and semantic tokens assign meaning (--color-text-primary, --color-bg-surface) by referencing primitives. Components reference semantic tokens only — never primitives directly.
- Class names use camelCase. The outermost element uses the component's own name as the class (.button, .card); generic wrappers use .container. Sub-elements are named descriptively and flatly (.title, .iconWrapper, .actions) — no BEM double-underscore or double-dash syntax.
- Boolean state classes use an is/has prefix: isActive, isDisabled, hasError. They are applied conditionally in JS alongside the base class, never used alone.
- Each component has its own co-located .module.css file. Styles are not shared across components except through tokens or an explicit shared utility file.
- Theme changes (dark mode, brand variants) are expressed by swapping semantic token values — never by duplicating component styles or adding theme-specific class variants.
- Global styles are structured in three layers: (1) tokens/ — primitive.css and semantic.css, both defining :root variables; (2) reset.css — a lightweight modern reset (box-sizing: border-box, margin/padding zeroing, sensible media defaults); (3) global.css — body-level baseline (font-family, line-height, color) using semantic tokens, plus global focus-visible styles. These are imported once at the app entry point. Nothing component-specific belongs in global CSS.
- Token files cover six categories: color, spacing, typography (family, size, weight, line-height), border-radius, shadow, and z-index. Each uses primitive tokens for raw values. Semantic aliases are added where they carry meaning beyond the raw value — color and typography always get semantic aliases; spacing uses primitives directly unless a value has domain meaning (e.g. --space-form-gap). Z-index uses named semantic layers only (--z-dropdown, --z-modal, --z-toast) — never raw integers in component styles.
- Styles are written mobile-first: base styles target the smallest viewport; min-width media queries layer on larger sizes. The standard breakpoint scale is sm (640px), md (768px), lg (1024px), xl (1280px). Breakpoints are defined as CSS custom properties in tokens/primitive.css for JS access (e.g. via getComputedStyle) but written as raw values in @media queries inside .module.css files, since custom properties cannot be used in media query conditions.
- A styles/utilities.module.css file holds a small, stable set of shared utility classes: .srOnly (visually hidden, accessible to screen readers), .truncate (single-line ellipsis), and .resetButton (removes default button chrome). Components include these via CSS Modules composes. This file stays minimal — recurring visual patterns should become components, not utilities.

## Non-goals
- Prescribing specific token names or token quantity — the two-layer structure is required, the names within it are not
- CSS preprocessors (Sass/Less) — native CSS with Modules is preferred; only introduce a preprocessor if a specific feature is needed
- Forcing CSS Modules in contexts where the project already has a stable established approach (e.g. a pure Tailwind codebase)

## Notes
BEM is designed to prevent naming collisions in global CSS. CSS Modules make that problem irrelevant — local scoping is automatic. Use flat, readable class names instead. For the token system, keep primitive tokens in tokens/primitive.css (or equivalent) and semantic tokens in tokens/semantic.css. Semantic tokens should map 1:1 to design decisions (text color, surface color, border, etc.) not to specific UI elements. CSS-in-JS is acceptable only when a value cannot be expressed statically — hover states, media queries, and theming all belong in CSS, not JS.