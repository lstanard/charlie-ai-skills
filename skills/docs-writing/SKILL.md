# Docs Writing
version: 0.1.0

## Purpose
Produce clear, discoverable documentation (README, HOWTO, API docs)

## Triggers
- edit markdown
- generate documentation
- generate markdown
- update README
- update documentation
- write doc
- write docs
- write README

## Inputs
- title: string
- audience: string (optional)
- existing_markdown: string (optional)
- markdown_content: string (optional)

## Guarantees
- No markdownlint violations in output
- Contains a 'Getting started' section with 3 bullet commands where applicable
- Code blocks are fenced and labeled (e.g., ```bash, ```ts)
- Headings use consistent hierarchy and blank lines between sections

## Non-goals
- Perform deep architecture redesign
- Changing technical meaning
- Rewriting prose unless required for lint compliance
- Change API semantics or add behavior not requested

## Notes
Prefer yarn for commands. Wrap lines at 100 chars by default. Keep prose succinct. Assume the audience is technical, either a mid-level or senior software engineer.