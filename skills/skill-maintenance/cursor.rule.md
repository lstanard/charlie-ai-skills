# Skills repo maintenance (Cursor rule)
scope: project
version: 0.1.0

Apply this rule when the user asks to:
- add a skill
- create a skill
- update a skill
- new skill
- modify skill

When generating or editing output:
- After adding or updating a skill, update the README.md skills table to reflect the change.
- Add new skills to the correct section of README.md based on directory location: skills/**/skill.json at the top level go in the general table; skills/testing/* go in the Testing skills table; skills/frontend-architecture/* go in the Frontend architecture skills table; create a new section if the skill belongs to a new group.
- README table entries use the format: | [skill-name](skills/path/) | One-line description matching the skill.json description field. |
- Run `npm run gen` after any change to a skill.json to regenerate the SKILL.md and cursor.rule.md for that skill.
- Never hand-edit SKILL.md or cursor.rule.md — they are generated. Only edit skill.json, then re-run `npm run gen`.

Avoid:
- Deciding what content a skill should have — this skill only covers documentation and codegen hygiene

# metadata
id: charlie.skill-maintenance