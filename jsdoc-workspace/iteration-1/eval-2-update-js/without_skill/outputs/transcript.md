# Transcript: Update parseConfig to Support YAML

## Task

Update the `parseConfig` function in `src/config.js` to handle both JSON and YAML files, in addition to the existing JSON-only behavior.

## Steps Taken

1. Reviewed the original function, which reads a file and unconditionally calls `JSON.parse` on its contents.

2. Identified what needed to change:
   - Detect the file extension to determine the format.
   - Parse YAML when the extension is `.yaml` or `.yml`.
   - Fall back to JSON parsing for all other extensions.

3. Selected `js-yaml` as the YAML parsing library. It is the most widely used YAML parser in the Node.js ecosystem and provides a `load()` function that parses a YAML string into a JavaScript object.

4. Added `require` statements for the built-in `path` module (to extract file extensions) and for `js-yaml`.

5. Replaced the single `JSON.parse(content)` call with a conditional:
   - If the extension is `.yaml` or `.yml`, call `yaml.load(content)`.
   - Otherwise, call `JSON.parse(content)`.

6. Added a `module.exports` statement so the function is importable.

## Output

Written to `config.js` in the outputs directory.

## Notes

- `js-yaml` must be installed as a dependency (`npm install js-yaml`) for the code to run.
- The original function had no `require` statements, so `fs` was assumed to be in scope from surrounding code. The updated file adds an explicit `require('fs')` for completeness and correctness as a standalone module.
- No changes were made to the function's error-handling behavior; invalid JSON or YAML will still throw a parse error, consistent with the original implementation.
