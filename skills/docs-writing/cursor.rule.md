# Docs Writing (Cursor rule)
scope: project
version: 0.1.0

Apply this rule when the user asks to:
- edit markdown
- generate documentation
- generate markdown
- update README
- update documentation
- write doc
- write docs
- write README

When generating or editing output:
- No markdownlint violations in output
- Contains a 'Getting started' section with 3 bullet commands where applicable
- Code blocks are fenced and labeled (e.g., ```bash, ```ts)
- Headings use consistent hierarchy and blank lines between sections

Keep prose succinct. Assume the audience is technical, either a mid-level or senior software engineer.

**README guidelines:** READMEs are orientation documents — cover how to run, deploy, test, and contribute; architectural context is welcome. Err toward brevity over detail. Omit code samples unless explicitly requested or the README is scoped to documenting a specific feature. Use Mermaid diagrams to illustrate system behavior when a diagram communicates more clearly than prose.

Avoid:
- Perform deep architecture redesign
- Changing technical meaning
- Rewriting prose unless required for lint compliance
- Change API semantics or add behavior not requested
- Comprehensively documenting individual features in a README

# metadata
id: charlie.docs-writing