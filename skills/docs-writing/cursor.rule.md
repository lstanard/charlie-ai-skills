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

Prefer yarn for commands. Wrap lines at 100 chars by default. Keep prose succinct. Assume the audience is technical, either a mid-level or senior software engineer.

Avoid:
- Perform deep architecture redesign
- Changing technical meaning
- Rewriting prose unless required for lint compliance
- Change API semantics or add behavior not requested

# metadata
id: charlie.docs-writing