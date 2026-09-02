# Refine Design — Reference

## When to invoke

The user has an existing UI element in front of them — a component, a modal, a settings panel, a group of components making up a page section — and it isn't working: it feels cluttered, they can't tell what to click, or information takes too long to find. They want it redesigned, not built from scratch.

Triggered by phrases like "redesign this," "this feels cluttered," "improve the UX of this," or "clean up this UI." Not triggered by a request to build new UI with nothing existing to react to (that's `frontend-design`), and not triggered by a request for a pre-ship visual-craft pass over typography, color, proportion, or spacing rhythm on a design that's already structurally sound (that's `design-for-ai`'s `exam` or `hone`).

## Step 0: Scope check

Confirm the target is an existing design, not a blank slate:

- If there's no existing design to react to, say so and point at `frontend-design` instead. Don't proceed.
- If the request is specifically about visual craft — contrast, type scale, spacing rhythm, proportion — with no complaint about structure, hierarchy, or task clarity, name `design-for-ai:exam` (diagnostic) or `design-for-ai:hone` (pre-ship QA) as the better fit instead of running this skill's lens set on it. If the request mixes both (e.g. "this is cluttered and the spacing feels off"), run this skill for the structural half and mention the craft-level tools for the rest — don't silently absorb their scope.

## Step 1: Establish the primary goal(s)

Every lens in Step 2 depends on knowing what the user is supposed to accomplish here. Before critiquing anything, identify the primary action(s) this element or component group exists to support.

Infer it from what's available: component/prop names, surrounding copy, the route or page it lives on, adjacent code. State the inferred goal back before proceeding, e.g. "This modal's job is to let someone activate or deactivate a code — everything else here is secondary to that."

Only ask the user directly when the goal genuinely can't be inferred (e.g. a bare screenshot with ambiguous controls and no surrounding context). Don't skip this step because the request sounds like "just make it look better" — a redesign without a stated goal has no way to judge what deserves visual weight.

## Step 2: Survey existing patterns

Before diagnosing anything, find out how the rest of the page or application already solves problems like this one. Every later step is constrained by what this survey turns up.

- In a codebase: look for a shared component library or design-system package, a theme/token file (spacing scale, color palette, type scale — Tailwind config, CSS variables, a styled-components/theme object), and other instances of the same UI concept elsewhere (other modals, other list rows, other status indicators, other primary-button usages). Grep for the component names and token names already used near the target, not just in the target itself.
- Without a codebase (a screenshot or description with no source): look at whatever other screens or context the user has provided for the visual language already in use — button styles, badge treatments, spacing rhythm. If nothing else is available, say so and treat any recommendation to reuse an existing pattern as provisional until the user confirms what else exists.

The point of this step is to make Step 5's options and Step 6's implementation reuse what's established rather than inventing new styles that only this one element uses.

## Step 3: Diagnose across five lenses

Work through all five lenses for the target, not just the one that jumps out first. A single element commonly fails on more than one.

| Lens | What to check |
|---|---|
| Information architecture & hierarchy | Does visual weight (size, weight, color, position) track actual importance to the stated goal? Is content grouped by relationship, or just by the order it happened to get added? Are primary, secondary, and tertiary information visually distinguishable, or is everything the same size and weight? |
| Primary-action friction | Is the action(s) tied to the stated goal the easiest thing to find and complete, or does it compete on equal footing with secondary/administrative actions? Count the number of equal-weight choices presented at once — more choices at the same visual priority means more decision friction. |
| Scannability | Can someone locate the one piece of information they came for without reading every line? What's repeated, redundant, or unlabeled in a way that forces re-reading? Is there enough whitespace and grouping to let the eye skip what doesn't matter to the current task? |
| Decorative-element intent | For every border, background fill, icon, pill, or divider on the element: does it mark a real group boundary, a real state, or a real separation — or is it there because it "looks more designed"? Flag anything decorative that doesn't correspond to a structural fact for removal, and flag any place where a real grouping exists but nothing signals it visually. |
| Consistency with existing patterns | Against what Step 2 turned up: does this element reuse existing components, tokens, and interaction patterns, or does it introduce a one-off font size, spacing value, color, badge style, or component that nothing else in the app uses? A one-off that looks fine in isolation is still a finding if it diverges from an established pattern for no functional reason. |

Ground every finding in a named principle from the glossary below — a diagnosis that can't be tied to an established pattern is a matter of taste, not a finding.

## Step 4: Principle glossary

Cite from this list; don't invent new labels. This is a working reference, not exhaustive — if a different named, established pattern fits better, use it instead.

| Principle | What it explains |
|---|---|
| Gestalt proximity / similarity / common region | Why grouping (or failing to group) related elements changes how they're read as a unit |
| Hick's Law | Why more simultaneous, equal-weight choices slow down decision-making |
| Fitts's Law | Why a target's size and distance from the likely starting point affects how easy it is to hit |
| Progressive disclosure | Why showing only what's needed now, with the rest reachable on demand, reduces upfront clutter |
| Recognition over recall (Nielsen heuristic) | Why labeling and visible context beat asking the user to remember what an icon or field means |
| Jakob's Law | Why deviating from patterns users already know from other products creates friction |
| Miller's Law (7±2) | Why too many simultaneously-presented items overload short-term processing |
| Tesler's Law (conservation of complexity) | Why complexity that's removed from the UI has to go somewhere — a redesign can hide it, not delete it |
| F-pattern / Z-pattern scanning | How eyes actually traverse a screen, and what placement gets seen first or skipped |
| Von Restorff effect (isolation effect) | Why the one thing that should stand out needs to look different from everything around it, not just be labeled "primary" |
| Visual hierarchy via size/weight/color/contrast/whitespace/alignment | The mechanical toolkit for making importance visible without adding decoration |
| Consistency and standards (Nielsen heuristic #4) | Why the same concept should look and behave the same way everywhere in the same product — a new one-off style has a real inconsistency cost even when it reads fine on its own |

## Step 5: Report the diagnosis

Index-first: one line per finding, most impactful first, principle cited inline.

```
Refine Design — 5 findings

1. [High] No clear primary action — three buttons ("New Item", "View Log", "Reset") carry equal visual weight, with nothing signaling which one the user came here to click. (Hick's Law — equal-weight choices slow decisions without a lead action to anchor on.)
2. [Medium] Redundant heading — the section title and a repeated sub-label state the same fact twice, adding a scan step with no new information. (Recognition over recall — Nielsen heuristic #6.)
3. [Medium] Flat hierarchy — every row's label, value, and controls render at the same size and weight, so nothing signals which piece matters most for the task at hand. (Visual hierarchy via size/weight/contrast.)
4. [Medium] One-off badge style — this status pill uses a border and font size that don't match the badge component used on every other list screen in the app. (Consistency and standards — Nielsen heuristic #4.)
5. [Low] Decorative pill with no grouping purpose — a bordered badge around one label doesn't correspond to any real category boundary elsewhere in the layout. (Gestalt common region — a border should mark an actual group.)

Pick a number to expand, or "all" for the full report.
```

On drill-in, expand only the chosen finding: what it is, why it matters against the stated goal, and what a fix would need to change.

## Step 6: Generate 3 redesign options

The 3 options must differ in structural or IA approach — not 3 palettes on the same layout. Each names the core idea, the principle(s) it leans on, and its tradeoff, so the user can pick based on what they're willing to give up.

Before naming an option's approach, check whether Step 2's survey already turned up a component, token, or pattern that solves it — build the option from that first. Only introduce something new when nothing existing expresses the fix, and say so explicitly in the option rather than presenting it as if it already existed elsewhere in the app.

```
3 redesign options — pick one to build out:

1. Single-action stack — one primary action promoted above the fold using the app's existing primary-button style; secondary actions demoted to the existing text-link pattern below it. Leans on Hick's Law and visual hierarchy by size. Tradeoff: secondary actions take one more scan to find.
2. Grouped-by-relationship — the two pieces of data that are always read together become one visual unit using the existing card/row component; less-used actions move into the app's existing overflow-menu pattern. Leans on Gestalt proximity and progressive disclosure. Tradeoff: hides an action behind an extra click.
3. Status-led layout — the field most users check first becomes the dominant visual element via the existing status-badge component, with the rest as secondary metadata beneath it. Leans on the Von Restorff effect and F-pattern scanning. Tradeoff: reorders content away from how it reads today, which risks surprising returning users (Jakob's Law). No new component needed.

Pick 1, 2, or 3 to build out in full, or ask for changes to any option before choosing.
```

Don't implement any option as real code or a component change beyond this summary until the user picks one. The optional Step 7 mockup is the one exception — a disposable static comparison, not an implementation of any option.

## Step 7: Offer a side-by-side browser mockup (optional)

Immediately after presenting the Step 6 index, ask once whether the user wants to see the 3 options rendered side by side before picking. State plainly, in the same message, that this is optional, experimental, and token-intensive — building 3 real mockups in one page costs meaningfully more than comparing the text descriptions.

- If the user declines, doesn't respond affirmatively, or the target has no visual/renderable form at all, skip straight to Step 8 using the text-only comparison.
- If the user accepts:
  - Write a single self-contained HTML file containing all 3 options side by side as separate panels/columns — inline `<style>`, no build step, no framework, no other skill or plugin. Label each panel with its option name and one-line tradeoff from Step 6, so the comparison carries the same reasoning as the text index instead of forcing the user to reconcile the two separately.
  - Reuse the target's real copy and labels (never placeholder text) and the real colors/fonts/spacing identified in Step 2 wherever feasible in each panel, so every option reads as a plausible version of the actual UI rather than a generic wireframe.
  - Save the file to a scratch or temp directory, never into the project's source tree.
  - Open it with the operating system's default-browser command (e.g. `open` on macOS, `xdg-open` on Linux, `start` on Windows) so the user sees all 3 side by side in their own browser. Don't use any browser-automation tool to view it — this step hands the file to the user, it doesn't view the render itself.
  - Once the user says which panel they prefer, continue to Step 8 with only that option. Don't keep or reference the comparison file afterward.

## Step 8: Implement the chosen option

- If the target is real component/page code in a codebase, edit it directly to match the chosen option's structure, importing and reusing the existing shared components, utility classes, and tokens identified in Step 2 rather than writing new local CSS or one-off values.
- If there's no code target — a screenshot, a description, a design in an external tool — produce a mockup or a detailed structural description instead, describing it in terms of the existing visual language identified in Step 2.
- If the chosen option genuinely required a new pattern (flagged in Step 6), implement it as reusably as the codebase's conventions allow — e.g. as a component or token, not inline styling — and say where it should live for others to reuse, rather than leaving it local to this one element.

## Step 9: Name remaining craft-level work

After implementing, call out anything that's now a visual-craft concern rather than a structural one — contrast, spacing rhythm, type scale, proportion — and name `design-for-ai:hone` (pre-ship QA) or `design-for-ai:exam` (diagnostic) as the tool for that pass. Don't run that checklist here.

---

## Non-goals

- Never designs new UI with nothing existing to react to — that's `frontend-design`.
- Never runs a typography/color/proportion/composition visual-craft audit — that's `design-for-ai`'s `exam`/`hone`.
- Never cites a principle it invented; only established, named patterns.
- Never implements all 3 options as real code or component changes before the user picks one — the optional Step 7 mockup is disposable static HTML for comparison, not an implementation.
- Never skips primary-goal identification, even on a bare "just redesign this."
- Never introduces a new component, token, or visual pattern when an existing one already covers the need, and never leaves a genuinely new pattern as an unflagged local one-off.
- Never renders a mockup without asking first, never renders options one at a time when asked (all 3 go into one side-by-side page), and never uses a browser-automation tool, MCP server, or other skill/plugin to produce or view the preview.
