---
name: "routing-and-navigation"
description: "URLs are UX. Use when creating routes, links, nav components, or anything that changes the URL. Covers Link vs button semantics, URL-based filter/pagination state, external link safety, and when programmatic navigation is appropriate."
---

# Routing and Navigation
version: 0.1.0

## Purpose
URLs are UX. Use when creating routes, links, nav components, or anything that changes the URL. Covers Link vs button semantics, URL-based filter/pagination state, external link safety, and when programmatic navigation is appropriate.

## Triggers
- creating routes
- adding navigation
- linking between pages
- nav component
- Link vs button
- routing
- URL state
- filter state
- pagination state
- search params
- programmatic navigation
- useNavigate
- TanStack Router
- external link
- breadcrumbs
- back navigation

## Inputs

## Guarantees
- Every navigable view has a unique, shareable URL. Navigation items (primary, secondary, tertiary) always link to a URL. Routes use path-based routing only — hash routing (#/route) is not used because it breaks SSR and assistive technology focus management.
- <Link> (renders <a>) is used for anything that navigates to a URL: nav items, breadcrumbs, 'View details'/'Edit'/'Back to list' actions, and card/row elements that navigate to a detail page. <button> is used for anything that triggers an action without navigating: opening a modal or dialog, submitting a form, toggling a panel, or triggering a mutation. These two are never interchangeable.
- Link text describes the destination and is meaningful in isolation (WCAG 2.4.4). Generic text like 'Click here', 'Read more', or 'Learn more' is not used as link text.
- Page state (filters, sort, pagination, active tab) lives in URL search params — not component state. This enables bookmarking, sharing, and correct back/forward behavior. Use the router's type-safe search param API (e.g. TanStack Router's validateSearch) to define and access search params.
- Internal links open in the same tab. target="_blank" is not added to internal links; modifier-key behavior (Cmd+click, middle-click) is the user's choice. External links may open in a new tab; when they do, rel="noopener noreferrer" is required and a visual indicator with a screen reader label ('opens in new tab') is included.
- useNavigate() / programmatic navigation is used only for redirects after a completed action (e.g. onSuccess after a form submit or delete confirmation). It is never used as a substitute for <Link> in interactive elements.

## Non-goals
- Prescribing a specific routing library — TanStack Router examples are illustrative; the principles apply to React Router, Next.js, etc.
- Server-side routing, API routing, or framework-level route configuration
- Authentication-based redirects and route guards — covered separately

## Notes
WCAG references: 2.4.4 Link Purpose (link text must describe destination); 3.2.2 On Input (don't change context unexpectedly — no forced new tabs for internal links); 3.2.3 Consistent Navigation (back/forward must work, requires URL state); 4.1.2 Name, Role, Value (use semantic <a> and <button>, not interchangeably). Screen readers announce <a> as 'link' and <button> as 'button' — AT users rely on these semantics to form a mental model of the page.